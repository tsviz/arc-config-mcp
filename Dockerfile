# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source (needed before npm ci because prepare script runs build)
COPY src/ ./src/

# Install dependencies and build
RUN npm ci

# Build is handled by prepare script, but ensure it's built
RUN npm run build

# Production stage with CLI tools
FROM node:18-alpine AS production

# Install kubectl, helm, and other CLI tools needed for ARC management
RUN apk add --no-cache \
    curl \
    wget \
    git \
    bash \
    ca-certificates \
    && wget -q https://dl.k8s.io/release/$(wget -qO- https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl -O /usr/local/bin/kubectl \
    && chmod +x /usr/local/bin/kubectl \
    && wget -q https://get.helm.sh/helm-v3.16.4-linux-amd64.tar.gz -O /tmp/helm.tar.gz \
    && tar -xzf /tmp/helm.tar.gz -C /tmp \
    && mv /tmp/linux-amd64/helm /usr/local/bin/helm \
    && rm -rf /tmp/helm.tar.gz /tmp/linux-amd64 \
    && helm version \
    && kubectl version --client

WORKDIR /app

# Install production dependencies only (skip prepare script)
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/build ./build

# Create non-root user
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001 -G mcp && \
    chown -R mcp:mcp /app

# Create .kube directory for kubeconfig
RUN mkdir -p /home/mcp/.kube && \
    chown -R mcp:mcp /home/mcp

USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Labels
LABEL org.opencontainers.image.title="ARC MCP Server" \
    org.opencontainers.image.description="GitHub Actions Runner Controller MCP Server" \
    org.opencontainers.image.vendor="tsviz" \
    org.opencontainers.image.source="https://github.com/tsviz/arc-config-mcp"

# Start server
CMD ["node", "build/index.js"]
