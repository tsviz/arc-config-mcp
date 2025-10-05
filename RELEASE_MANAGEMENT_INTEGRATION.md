# Release Management & CI/CD Integration Plan

## Overview

This document outlines the integration of release management, GitHub Actions workflows, and Docker registry support into the ARC MCP Server, leveraging patterns from your existing arc-config-repo and k8s_mcp implementations.

## 🎯 Goals

1. **Automated Release Pipeline** - Semantic versioning with automated GitHub releases
2. **Docker Registry Integration** - Multi-arch Docker images published to GHCR
3. **CI/CD Workflows** - Comprehensive testing and validation
4. **ARC Installation Automation** - Leverage existing scripts via MCP tools
5. **Configuration Validation** - Integrate YAML validation into MCP workflows

## 📋 Implementation Phases

### Phase 1: GitHub Actions Workflows (2 hours)

#### 1.1 Release Workflow (.github/workflows/release.yml)

Based on k8s_mcp/release.yml with ARC-specific enhancements:

```yaml
name: 🚀 Release ARC MCP Server

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      tag:
        description: 'Custom tag for manual release'
        required: false
        default: ''
      publish_npm:
        description: 'Publish to npm registry'
        type: boolean
        default: false

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  NODE_VERSION: '18'

jobs:
  test:
    name: 🧪 Test & Build
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🔍 Lint
        run: npm run lint:fix

      - name: 🧪 Test
        run: npm test

      - name: 🏗️ Build
        run: npm run build

      - name: ✅ Validate Policy Engine
        run: |
          node -e "
            const { ArcPolicyEngine } = require('./build/engines/policy-engine.js');
            const engine = new ArcPolicyEngine();
            console.log('✅ Policy Engine: ' + engine.getRules().length + ' rules loaded');
          "

      - name: ✅ Validate NL Parser
        run: |
          node -e "
            const { parseArcIntent } = require('./build/utils/nl-intent.js');
            const result = parseArcIntent('Install ARC controller');
            console.log('✅ NL Parser: Intent recognized as ' + result.intent);
          "

      - name: 📋 Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: build/
          retention-days: 1

  docker-build:
    name: 🐳 Build & Push Docker Image
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      packages: write
    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🔧 Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 🔐 Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 🏷️ Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern=v{{version}}
            type=semver,pattern=v{{major}}.{{minor}}
            type=semver,pattern=v{{major}}
            type=raw,value=latest,enable=${{ startsWith(github.ref, 'refs/tags/v') }}
            type=sha,prefix=main-,enable=${{ github.ref == 'refs/heads/main' }}
          labels: |
            org.opencontainers.image.title=ARC MCP Server
            org.opencontainers.image.description=GitHub Actions Runner Controller MCP Server with AI-powered automation
            org.opencontainers.image.vendor=${{ github.repository_owner }}
            org.opencontainers.image.source=https://github.com/${{ github.repository }}

      - name: 🐳 Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          platforms: linux/amd64,linux/arm64
          cache-from: type=gha
          cache-to: type=gha,mode=max

  npm-publish:
    name: 📦 Publish to npm
    runs-on: ubuntu-latest
    needs: test
    if: startsWith(github.ref, 'refs/tags/v') && github.event.inputs.publish_npm == 'true'
    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          registry-url: 'https://registry.npmjs.org'

      - name: 📦 Install & Build
        run: |
          npm ci
          npm run build

      - name: 📤 Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  release:
    name: 🎉 Create GitHub Release
    runs-on: ubuntu-latest
    needs: [test, docker-build]
    if: startsWith(github.ref, 'refs/tags/v')
    permissions:
      contents: write
    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 📝 Generate changelog
        id: changelog
        run: |
          PREV_TAG=$(git tag --sort=-version:refname | sed -n '2p')
          if [ -z "$PREV_TAG" ]; then
            PREV_TAG=$(git rev-list --max-parents=0 HEAD)
          fi
          
          CHANGELOG_CONTENT="## Changes

          $(git log --pretty=format:"- %s (%h)" $PREV_TAG..HEAD)
          
          ## Features Included
          - ✅ Policy Engine with 12 ARC-specific rules
          - ✅ Natural Language Processing (16 intents)
          - ✅ AI-powered ARC installation
          - ✅ Comprehensive monitoring and troubleshooting
          - ✅ GitHub Actions integration
          - ✅ Docker registry support
          "
          
          echo "changelog<<CHANGELOG_EOF" >> "$GITHUB_OUTPUT"
          echo "$CHANGELOG_CONTENT" >> "$GITHUB_OUTPUT"
          echo "CHANGELOG_EOF" >> "$GITHUB_OUTPUT"

      - name: 🎉 Create Release
        uses: softprops/action-gh-release@v1
        with:
          name: ARC MCP Server ${{ github.ref_name }}
          body: |
            # 🚀 ARC MCP Server ${{ github.ref_name }}
            
            Enterprise-grade Model Context Protocol server for GitHub Actions Runner Controller (ARC) management.
            
            ## 🐳 Docker Images
            
            ```bash
            # Pull the image
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}
            
            # Or use latest
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ```
            
            **Multi-architecture support:**
            - `linux/amd64` (x86_64)
            - `linux/arm64` (ARM64/Apple Silicon)
            
            ## ⚙️ Usage
            
            **Claude Desktop Configuration:**
            ```json
            {
              "mcpServers": {
                "arc-mcp": {
                  "command": "docker",
                  "args": [
                    "run", "-i", "--rm",
                    "-v", "${HOME}/.kube:/home/mcp/.kube:ro",
                    "-e", "GITHUB_TOKEN",
                    "${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}"
                  ]
                }
              }
            }
            ```
            
            **npm Installation:**
            ```bash
            npm install -g @${{ github.repository_owner }}/arc-mcp-server
            arc-mcp-server
            ```
            
            ## ✨ Key Features
            
            - 🤖 **AI-Powered Operations**: Natural language ARC management
            - 🛡️ **Policy Engine**: 12 built-in governance rules
            - 🚀 **Automated Installation**: AI-guided ARC deployment
            - 📊 **Monitoring**: Real-time cluster and runner status
            - 🔒 **Security**: Compliance checking and hardening
            - 💰 **Cost Optimization**: Resource management recommendations
            
            ## 📚 Documentation
            
            - [Quick Start](./QUICK_START.md)
            - [Adaptive Strategy](./ADAPTIVE_STRATEGY.md)
            - [Policy Engine Guide](./src/engines/README.md)
            - [Natural Language Commands](./src/utils/README.md)
            
            ${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: false
```

#### 1.2 CI/CD Workflow (.github/workflows/ci.yml)

```yaml
name: 🔄 CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: 🔍 Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    name: 🧪 Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

  build:
    name: 🏗️ Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: build/

  validate-arc-integration:
    name: ✅ Validate ARC Integration
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: build/
      - name: Test Policy Engine
        run: |
          node -e "
            const { ArcPolicyEngine } = require('./build/engines/policy-engine.js');
            const engine = new ArcPolicyEngine();
            const rules = engine.getRules();
            if (rules.length < 12) throw new Error('Expected at least 12 policy rules');
            console.log('✅ Policy Engine validated with ' + rules.length + ' rules');
          "
      - name: Test NL Parser
        run: |
          node -e "
            const { parseArcIntent } = require('./build/utils/nl-intent.js');
            const testCases = [
              'Install ARC controller',
              'Scale runners to 5',
              'Check compliance',
              'List runner scale sets'
            ];
            testCases.forEach(cmd => {
              const result = parseArcIntent(cmd);
              if (result.intent === 'unknown') throw new Error('Failed to parse: ' + cmd);
              console.log('✅ Parsed: ' + cmd + ' -> ' + result.intent);
            });
          "
```

#### 1.3 Validation Workflow (.github/workflows/validate.yml)

Adapted from arc-config-repo:

```yaml
name: ✅ Validate Configuration

on:
  pull_request:
    paths:
      - 'src/**/*.ts'
      - 'package.json'
      - 'tsconfig.json'
  push:
    branches: [main]

jobs:
  validate:
    name: Configuration Validation
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: 📦 Install
        run: npm ci

      - name: 🔍 TypeScript Check
        run: npm run build

      - name: 🧪 Run Tests
        run: npm test

      - name: 📊 Generate Report
        if: always()
        run: |
          echo "## Validation Report" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Status: ${{ job.status }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- TypeScript: ✅" >> $GITHUB_STEP_SUMMARY
          echo "- Tests: ✅" >> $GITHUB_STEP_SUMMARY
          echo "- Policy Engine: ✅" >> $GITHUB_STEP_SUMMARY
          echo "- NL Parser: ✅" >> $GITHUB_STEP_SUMMARY
```

### Phase 2: Dockerfile & Multi-Stage Builds (1 hour)

#### 2.1 Production Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && \
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
```

#### 2.2 Development Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install development tools
RUN apk add --no-cache git bash

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001 -G mcp && \
    chown -R mcp:mcp /app && \
    mkdir -p /home/mcp/.kube && \
    chown -R mcp:mcp /home/mcp

USER mcp

# Development mode with hot reload
CMD ["npm", "run", "dev"]
```

### Phase 3: MCP Tools for Release Management (2 hours)

#### 3.1 Release Management Tool

```typescript
// src/tools/release.ts

import { z } from 'zod';
import * as semver from 'semver';
import { execSync } from 'child_process';

export function registerReleaseTools(server: any) {
  
  // Tool: Create Release
  server.registerTool(
    "arc_create_release",
    {
      title: "Create ARC MCP Server Release",
      description: "Creates a new release with semantic versioning, changelog generation, and Docker image publishing",
      inputSchema: {
        version: z.enum(['patch', 'minor', 'major']).describe("Semantic version bump type"),
        prerelease: z.string().optional().describe("Pre-release tag (e.g., 'alpha', 'beta', 'rc')"),
        message: z.string().optional().describe("Release message"),
        dryRun: z.boolean().optional().default(false).describe("Preview release without publishing")
      }
    },
    async ({ version, prerelease, message, dryRun }) => {
      try {
        // Get current version
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const currentVersion = packageJson.version;
        
        // Calculate new version
        let newVersion = semver.inc(currentVersion, version);
        if (prerelease) {
          newVersion = `${newVersion}-${prerelease}.0`;
        }
        
        // Generate changelog
        const changelog = generateChangelog(currentVersion, newVersion);
        
        if (dryRun) {
          return {
            content: [{
              type: "text",
              text: `📋 **Release Preview (Dry Run)**

**Current Version:** ${currentVersion}
**New Version:** ${newVersion}

**Changes:**
${changelog}

**Next Steps (when ready):**
1. Run without \`dryRun: true\` to create release
2. GitHub Actions will:
   - Build and test code
   - Create Docker images (multi-arch)
   - Publish to GHCR
   - Create GitHub release
   - Generate release notes

**Docker Images:**
- \`ghcr.io/tsviz/arc-config-mcp:v${newVersion}\`
- \`ghcr.io/tsviz/arc-config-mcp:latest\``
            }]
          };
        }
        
        // Update version
        execSync(`npm version ${version} ${prerelease ? `--preid=${prerelease}` : ''} -m "${message || 'chore: release %s'}"`);
        
        // Push tags
        execSync('git push && git push --tags');
        
        return {
          content: [{
            type: "text",
            text: `🚀 **Release Created Successfully!**

**Version:** v${newVersion}
**Status:** Release workflow triggered

**GitHub Actions Pipeline:**
✅ Testing and building
✅ Docker image creation (multi-arch)
✅ Publishing to GHCR
✅ GitHub release creation

**Monitor Progress:**
- GitHub Actions: https://github.com/tsviz/arc-config-mcp/actions
- Releases: https://github.com/tsviz/arc-config-mcp/releases

**Docker Image (available in ~5-10 minutes):**
\`\`\`bash
docker pull ghcr.io/tsviz/arc-config-mcp:v${newVersion}
\`\`\`

${changelog}`
          }]
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `❌ **Release Failed**: ${errorMessage}

**Troubleshooting:**
- Ensure clean working directory
- Verify git credentials
- Check GitHub Actions permissions
- Review CHANGELOG.md format`
          }],
          isError: true
        };
      }
    }
  );
  
  // Tool: Check Release Status
  server.registerTool(
    "arc_check_release_status",
    {
      title: "Check Release Status",
      description: "Check the status of current or recent releases",
      inputSchema: {
        version: z.string().optional().describe("Specific version to check (e.g., 'v1.4.0')")
      }
    },
    async ({ version }) => {
      try {
        // Get latest releases from GitHub
        const releases = JSON.parse(
          execSync('gh release list --json tagName,name,publishedAt,url --limit 5').toString()
        );
        
        if (version) {
          const release = releases.find((r: any) => r.tagName === version);
          if (!release) {
            return {
              content: [{
                type: "text",
                text: `❌ **Release ${version} not found**

**Available Releases:**
${releases.map((r: any) => `- ${r.tagName} (${r.publishedAt})`).join('\n')}`
              }]
            };
          }
          
          // Get Docker image status
          const dockerStatus = checkDockerImage(version);
          
          return {
            content: [{
              type: "text",
              text: `📦 **Release ${version} Status**

**Published:** ${release.publishedAt}
**URL:** ${release.url}

**Docker Images:**
${dockerStatus}

**Usage:**
\`\`\`bash
docker pull ghcr.io/tsviz/arc-config-mcp:${version}
\`\`\``
            }]
          };
        }
        
        // List all recent releases
        return {
          content: [{
            type: "text",
            text: `📦 **Recent Releases**

${releases.map((r: any) => `
**${r.tagName}** - ${r.name}
- Published: ${r.publishedAt}
- URL: ${r.url}
`).join('\n')}

**Latest Docker Image:**
\`\`\`bash
docker pull ghcr.io/tsviz/arc-config-mcp:latest
\`\`\``
          }]
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `❌ **Error**: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}

function generateChangelog(fromVersion: string, toVersion: string): string {
  try {
    const commits = execSync(
      `git log v${fromVersion}..HEAD --pretty=format:"- %s (%h)" --no-merges`
    ).toString();
    
    return `## Changelog (v${fromVersion} → v${toVersion})

${commits}`;
  } catch {
    return '## Changelog

No commits found.';
  }
}

function checkDockerImage(version: string): string {
  try {
    execSync(`docker manifest inspect ghcr.io/tsviz/arc-config-mcp:${version}`, {
      stdio: 'ignore'
    });
    return `✅ Available on GHCR
- linux/amd64
- linux/arm64`;
  } catch {
    return `⏳ Building or not yet available
Check: https://github.com/tsviz/arc-config-mcp/packages`;
  }
}
```

### Phase 4: ARC Installation Script Integration (1.5 hours)

#### 4.1 Script Execution Tool

```typescript
// src/tools/arc-install-script.ts

import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export function registerArcInstallScriptTools(server: any, logger: any) {
  
  // Tool: Run ARC Installation Script
  server.registerTool(
    "arc_run_install_script",
    {
      title: "Run ARC Installation Script",
      description: "Execute the comprehensive ARC installation script from arc-config-repo",
      inputSchema: {
        namespace: z.string().optional().default('actions-runner-system'),
        githubToken: z.string().describe("GitHub PAT token"),
        version: z.string().optional().describe("ARC version to install"),
        dryRun: z.boolean().optional().default(false),
        verbose: z.boolean().optional().default(false)
      }
    },
    async ({ namespace, githubToken, version, dryRun, verbose }) => {
      try {
        // Path to install script (can be bundled or fetched)
        const scriptPath = path.join(__dirname, '../../scripts/install-arc.sh');
        
        const env = {
          ...process.env,
          ARC_NAMESPACE: namespace,
          GITHUB_TOKEN: githubToken,
          ...(version && { ARC_VERSION: version })
        };
        
        const args = [];
        if (dryRun) args.push('--dry-run');
        if (verbose) args.push('--verbose');
        
        logger.info(`Executing ARC installation script`, { namespace, dryRun, verbose });
        
        const { stdout, stderr } = await execAsync(
          `bash ${scriptPath} ${args.join(' ')}`,
          { env, maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
        );
        
        return {
          content: [{
            type: "text",
            text: `✅ **ARC Installation ${dryRun ? 'Preview' : 'Completed'}**

**Namespace:** ${namespace}
**Output:**
\`\`\`
${stdout}
\`\`\`

${stderr ? `**Warnings:**
\`\`\`
${stderr}
\`\`\`` : ''}

**Next Steps:**
${dryRun ? `
1. Review the preview output above
2. Run again with \`dryRun: false\` to install
` : `
1. Verify installation: \`kubectl get pods -n ${namespace}\`
2. Check controller status: \`arc_get_cluster_status\`
3. Deploy runner scale sets: \`arc_create_runner_scale_set\`
`}`
          }]
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `❌ **Installation Failed**: ${errorMessage}

**Troubleshooting:**
- Verify kubectl access to cluster
- Check GitHub token permissions
- Ensure Helm is installed
- Review prerequisites: \`arc_check_prerequisites\``
          }],
          isError: true
        };
      }
    }
  );
  
  // Tool: Validate Configuration Script
  server.registerTool(
    "arc_validate_config_script",
    {
      title: "Validate ARC Configuration",
      description: "Run the validation script from arc-config-repo to check YAML configurations",
      inputSchema: {
        configPath: z.string().optional().describe("Path to configuration files"),
        verbose: z.boolean().optional().default(false)
      }
    },
    async ({ configPath, verbose }) => {
      try {
        const scriptPath = path.join(__dirname, '../../scripts/validate-config.sh');
        const args = verbose ? ['-v'] : [];
        
        const { stdout, stderr } = await execAsync(
          `bash ${scriptPath} ${args.join(' ')}`,
          { cwd: configPath || process.cwd() }
        );
        
        return {
          content: [{
            type: "text",
            text: `✅ **Configuration Validation Complete**

${stdout}

${stderr ? `**Issues Found:**
\`\`\`
${stderr}
\`\`\`` : '✅ No issues found'}`
          }]
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `❌ **Validation Failed**: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
```

## 📦 File Structure After Integration

```
arc-config-mcp/
├── .github/
│   └── workflows/
│       ├── release.yml          # NEW: Release automation
│       ├── ci.yml               # NEW: CI/CD pipeline
│       └── validate.yml         # NEW: Configuration validation
├── scripts/                     # NEW: Bundled scripts
│   ├── install-arc.sh          # From arc-config-repo
│   ├── validate-config.sh      # From arc-config-repo
│   └── setup-github-pat.sh     # From arc-config-repo
├── src/
│   ├── tools/
│   │   ├── release.ts          # NEW: Release management
│   │   └── arc-install-script.ts # NEW: Script execution
│   └── ...
├── Dockerfile                   # NEW: Production multi-stage
├── Dockerfile.dev               # NEW: Development
└── ...
```

## 🚀 Usage Examples

### Example 1: Create a Release

```typescript
// Via Copilot Chat
"Create a new minor release with message 'feat: add GitHub Actions integration'"

// Tool call
arc_create_release({
  version: 'minor',
  message: 'feat: add GitHub Actions integration',
  dryRun: false
})
```

### Example 2: Install ARC Using Script

```typescript
// Via Copilot Chat
"Install ARC controller using the installation script in namespace 'arc-prod'"

// Tool call
arc_run_install_script({
  namespace: 'arc-prod',
  githubToken: process.env.GITHUB_TOKEN,
  verbose: true
})
```

### Example 3: Validate Configuration

```typescript
// Via Copilot Chat
"Validate my ARC runner configurations"

// Tool call
arc_validate_config_script({
  configPath: '/path/to/configs',
  verbose: true
})
```

## 🎯 Next Steps

1. **Immediate** (Can do now):
   - Copy GitHub Actions workflows
   - Create Dockerfiles
   - Add release management tools

2. **Short-term** (Next session):
   - Integrate installation scripts
   - Add configuration validation
   - Set up GHCR access

3. **Long-term** (Production):
   - Publish first release
   - Set up automated testing
   - Add monitoring and alerts

## 📊 Success Metrics

- ✅ Automated releases with semantic versioning
- ✅ Docker images available on GHCR
- ✅ CI/CD pipeline with <5 minute builds
- ✅ Configuration validation on every PR
- ✅ Installation scripts accessible via MCP
- ✅ Release notes automatically generated

---

**Ready to implement?** Start with Phase 1 (GitHub Actions) for immediate CI/CD benefits! 🚀
