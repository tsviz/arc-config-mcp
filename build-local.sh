#!/bin/bash

# Build script for ARC MCP Server local development
# Creates uniquely tagged Docker images for local testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Building ARC MCP Server for local development...${NC}"

# Generate unique tag with timestamp
TIMESTAMP=$(date +%s)
LOCAL_TAG="arc-config-mcp:local-dev-${TIMESTAMP}"

echo -e "${YELLOW}📦 Building Docker image with tag: ${LOCAL_TAG}${NC}"

# Build the Docker image
docker build -t "${LOCAL_TAG}" .

echo -e "${GREEN}✅ Docker image built successfully!${NC}"
echo -e "${BLUE}🏷️  Tag: ${LOCAL_TAG}${NC}"

# Update mcp.json with the new tag
echo -e "${YELLOW}📝 Updating mcp.json with new tag...${NC}"

# Create a temporary file for the updated mcp.json
cat > mcp.json << EOF
{
    "mcpServers": {
        "arc-config": {
            "command": "docker",
            "args": [
                "run",
                "--rm",
                "-i",
                "--network=host",
                "-v", "/home/\${USER}/.kube:/home/mcp/.kube:ro",
                "-e", "KUBECONFIG=/home/mcp/.kube/config",
                "-e", "GITHUB_TOKEN=\${GITHUB_TOKEN}",
                "-e", "GITHUB_ORG=\${GITHUB_ORG:-}",
                "-e", "LOG_LEVEL=\${LOG_LEVEL:-info}",
                "-e", "ENABLE_METRICS=\${ENABLE_METRICS:-true}",
                "${LOCAL_TAG}"
            ],
            "env": {
                "GITHUB_TOKEN": "\${GITHUB_TOKEN}",
                "GITHUB_ORG": "\${GITHUB_ORG}",
                "LOG_LEVEL": "info",
                "ENABLE_METRICS": "true"
            }
        }
    }
}
EOF

echo -e "${GREEN}✅ mcp.json updated with new tag${NC}"

# Clean up old local-dev images (keep last 3)
echo -e "${YELLOW}🧹 Cleaning up old local-dev images...${NC}"
OLD_IMAGES=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep "arc-config-mcp:local-dev" | tail -n +4)
if [ ! -z "$OLD_IMAGES" ]; then
    echo "$OLD_IMAGES" | xargs docker rmi 2>/dev/null || true
    echo -e "${GREEN}✅ Cleaned up old images${NC}"
else
    echo -e "${BLUE}ℹ️  No old images to clean up${NC}"
fi

# Show current images
echo -e "${BLUE}📋 Current arc-config-mcp images:${NC}"
docker images | grep arc-config-mcp || echo "No arc-config-mcp images found"

echo ""
echo -e "${GREEN}🎉 Build complete!${NC}"
echo -e "${BLUE}🚀 You can now use the MCP server with VS Code + GitHub Copilot${NC}"
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   1. Configure VS Code to use the updated mcp.json"
echo "   2. Restart VS Code or reload the MCP server"
echo "   3. Test ARC installation: 'Install ARC using the arc-config MCP server'"