# 🚀 ARC Config MCP Server v1.5.2 - Docker Registry Release

## 🎉 Major Release with Automated Docker Publishing!

This release establishes production-ready Docker registry publishing with comprehensive CI/CD automation, making the ARC MCP Server easily accessible via GitHub Container Registry.

### ✨ What's New in v1.5.2

#### 🐳 **Automated Docker Registry Publishing**
- **GitHub Container Registry integration** (`ghcr.io/tsviz/arc-config-mcp`)
- **Multi-architecture builds** (linux/amd64, linux/arm64)
- **Automated releases** triggered by version tags
- **Development builds** for PR testing and feature branches
- **Docker image caching** for faster builds

#### 🔄 **Enhanced CI/CD Workflows**
- **Production Release Pipeline** (`release.yml`) with comprehensive validation
- **Development Build Pipeline** (`dev-build.yml`) for PR testing
- **Fixed validation steps** with proper KubeConfig initialization
- **Comprehensive testing** before Docker image publishing
- **Automatic GitHub releases** with detailed usage instructions

#### 🧪 **Improved Testing & Validation**
- **Policy Engine Validation**: All 11 ARC governance rules verified
- **Natural Language Parser Testing**: 4 core intent patterns validated
- **Multi-step validation** ensures production readiness
- **PR testing workflow** with automatic Docker image builds

### 🐳 **Docker Image Usage**

#### **Pull from GitHub Container Registry**
```bash
# Latest stable release
docker pull ghcr.io/tsviz/arc-config-mcp:latest

# Specific version
docker pull ghcr.io/tsviz/arc-config-mcp:v1.5.2

# Development builds (for testing)
docker pull ghcr.io/tsviz/arc-config-mcp:main-dev
```

#### **MCP Client Configuration**
```json
{
  "mcpServers": {
    "arc-config-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "${HOME}/.kube:/home/node/.kube:ro",
        "-e", "GITHUB_TOKEN",
        "ghcr.io/tsviz/arc-config-mcp:v1.5.2"
      ]
    }
  }
}
```

#### **Local Development & Testing**
```bash
# Run with Kubernetes access
docker run --rm -it \
  -v ~/.kube:/home/node/.kube:ro \
  -e GITHUB_TOKEN=your_token_here \
  ghcr.io/tsviz/arc-config-mcp:v1.5.2

# Test natural language commands
echo 'Install ARC controller in namespace arc-systems' | \
  docker run --rm -i \
  -v ~/.kube:/home/node/.kube:ro \
  -e GITHUB_TOKEN=your_token_here \
  ghcr.io/tsviz/arc-config-mcp:v1.5.2
```

### 🚀 **Production Features**

#### **AI-Powered ARC Management**
- 🤖 **Natural Language Processing**: 16 ARC intent patterns
- 📋 **Comprehensive Tooling**: Complete ARC lifecycle management
- 🔍 **Intent Recognition**: Automatic parsing from plain English commands

#### **Enterprise Policy Engine**
- 📊 **11 Built-in Governance Rules**: Security, compliance, performance, cost
- 🔒 **Security Policies**: Runner security contexts, privileged mode prevention  
- 💰 **Cost Optimization**: Resource limits, scaling controls
- 📈 **Compliance Reporting**: Automated governance and audit trails

#### **Production Infrastructure**
- ☸️ **Kubernetes Native**: kubectl v1.34.1 + helm v3.16.4 integrated
- 🐳 **Docker Optimized**: Multi-stage Alpine builds (365MB)
- 🔧 **CLI Tools**: Direct access to Kubernetes management tools
- 📦 **Multi-Architecture**: AMD64 and ARM64 support

### 🛠️ **Development Workflow**

#### **PR Testing**
- Automatic Docker builds for pull requests
- Test images available as `ghcr.io/tsviz/arc-config-mcp:pr-{number}`
- Comprehensive validation before merge
- Automated PR comments with testing instructions

#### **Branch Builds**
- Development branches get automatic builds with `-dev` suffix
- Feature branches supported with automatic tagging
- Continuous integration for all changes

### 📋 **Quality Assurance**

#### **Release Validation**
- ✅ **Policy Engine**: 11 ARC governance rules loaded and tested
- ✅ **Natural Language Parser**: 4 core intent patterns validated
- ✅ **Build Process**: TypeScript compilation with strict mode
- ✅ **Docker Images**: Multi-architecture builds verified
- ✅ **Integration**: kubectl/helm tools accessibility confirmed

#### **Automated Testing**
```bash
# Run local CI tests (same as GitHub Actions)
node test-ci-locally.js
```

### 🔄 **Migration from Previous Versions**

#### **From v1.5.1 or earlier:**
1. Update your MCP configuration to use the new Docker registry:
   ```bash
   # Old (if using local builds)
   arc-config-mcp
   
   # New (Docker registry)
   docker run --rm -i ghcr.io/tsviz/arc-config-mcp:v1.5.2
   ```

2. Update volume mounts for Kubernetes access:
   ```json
   {
     "args": [
       "run", "-i", "--rm",
       "-v", "${HOME}/.kube:/home/node/.kube:ro",
       "-e", "GITHUB_TOKEN",
       "ghcr.io/tsviz/arc-config-mcp:v1.5.2"
     ]
   }
   ```

### 🐛 **Bug Fixes**
- Fixed ArcPolicyEngine initialization in CI/CD workflows
- Corrected policy rule count validation (11 rules, not 12)
- Fixed natural language parser test cases for proper intent matching
- Resolved TypeScript compilation issues in release workflows

### 📈 **Performance Improvements**
- Multi-stage Docker builds for optimized image size
- GitHub Actions caching for faster CI/CD
- Parallel validation steps for quicker feedback
- Efficient multi-architecture builds

### 🛡️ **Security**
- Automated Docker image scanning (future enhancement ready)
- Secure GitHub Container Registry publishing
- Proper secret management in CI/CD workflows
- Read-only volume mounts for Kubernetes configuration

### 📚 **Documentation**
- Comprehensive Docker usage examples
- Updated MCP client configuration instructions
- Development workflow documentation
- PR testing guide

### 🔗 **Quick Links**
- **Docker Hub**: `ghcr.io/tsviz/arc-config-mcp`
- **Latest Release**: `ghcr.io/tsviz/arc-config-mcp:latest`
- **This Version**: `ghcr.io/tsviz/arc-config-mcp:v1.5.2`
- **Repository**: https://github.com/tsviz/arc-config-mcp
- **Issues**: https://github.com/tsviz/arc-config-mcp/issues

---

## 🎯 **Ready for Production!**

The ARC MCP Server is now production-ready with:
- ✅ Automated Docker registry publishing
- ✅ Multi-architecture support (AMD64/ARM64)
- ✅ Comprehensive CI/CD validation
- ✅ Enterprise-grade AI-powered ARC management
- ✅ 11 governance policy rules
- ✅ Full Kubernetes CLI integration

**Happy ARC Managing with Docker! 🚀🐳**