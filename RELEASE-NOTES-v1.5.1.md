# ARC Config MCP Server v1.5.1 Release Notes

## 🎉 Production-Ready Release!

We're excited to announce the v1.5.1 release of the ARC Config MCP Server - a comprehensive TypeScript MCP server for GitHub Actions Runner Controller (ARC) management with AI-powered automation.

### ✨ What's New in v1.5.1

#### 🔧 **CI/CD Pipeline Stability**
- **Fixed TypeScript compilation issues** in CI workflows
- **Resolved ArcPolicyEngine initialization** with proper KubeConfig mocking
- **Enhanced type declarations** with comprehensive `@types` packages
- **Validated all 11 ARC policy rules** load correctly
- **Fixed natural language parser** test cases for intent recognition

#### 🧪 **Testing Infrastructure**
- **Local CI test script** (`test-ci-locally.js`) for pre-push validation
- **Complete ES module compatibility** for Node.js 18+
- **Policy engine validation** with 11 comprehensive governance rules
- **Natural language intent parsing** for 4 core ARC operations

#### 🛠️ **Developer Experience**
- **Production-ready Docker images** with kubectl v1.34.1 + helm v3.16.4
- **Comprehensive type safety** with explicit TypeScript annotations
- **Enhanced error handling** for all CI validation steps
- **Detailed logging** for troubleshooting and monitoring

### 🚀 **Key Features**

#### **AI-Powered ARC Management**
- 🤖 **Natural Language Interface**: "Install ARC controller", "Scale runners to 5"
- 🔍 **Intent Recognition**: Automatic parsing of ARC operations from plain English
- 📋 **Comprehensive Tooling**: 16+ MCP tools for complete ARC lifecycle management

#### **Policy Engine & Governance**
- 📊 **11 Built-in Policy Rules**: Security, compliance, performance, cost, operations
- 🔒 **Security Policies**: Runner security contexts, privileged mode prevention
- 💰 **Cost Optimization**: Resource limits, scaling controls, efficiency monitoring
- 📈 **Compliance Reporting**: Automated ARC governance and audit trails

#### **Production Infrastructure**
- 🐳 **Docker Ready**: Multi-stage Alpine builds with CLI tools integrated
- ☸️ **Kubernetes Native**: Full kubectl and helm integration for real operations
- 🔧 **CLI Tools**: Direct access to kubectl v1.34.1 and helm v3.16.4
- 📦 **npm Package**: Easy installation and local development

### 🛠️ **Technical Specifications**

#### **Runtime Requirements**
- **Node.js**: 18.0.0 or higher
- **TypeScript**: ES2022 with ES modules
- **Kubernetes**: Compatible with modern cluster versions
- **Docker**: Alpine Linux base for minimal footprint

#### **Dependencies**
- **@kubernetes/client-node**: Kubernetes API integration
- **@modelcontextprotocol/sdk**: MCP server framework
- **@octokit/rest**: GitHub API integration
- **express**: HTTP transport support
- **winston**: Structured logging

### 📋 **Installation & Usage**

#### **npm Installation**
```bash
npm install -g arc-config-mcp
arc-config-mcp --help
```

#### **Docker Usage**
```bash
docker pull ghcr.io/tsviz/arc-config-mcp:v1.5.1
docker run --rm -v ~/.kube:/home/node/.kube arc-config-mcp
```

#### **Local Development**
```bash
git clone https://github.com/tsviz/arc-config-mcp.git
cd arc-config-mcp
npm install
npm run build
npm start
```

### 🧪 **Quality Assurance**

#### **CI/CD Pipeline**
- ✅ **Lint**: ESLint validation with TypeScript rules
- ✅ **Build**: TypeScript compilation with strict mode
- ✅ **Test**: Policy engine + NL parser validation
- ✅ **Docker**: Multi-architecture container builds

#### **Local Testing**
```bash
# Run the same tests as CI locally
node test-ci-locally.js
```

### 🔧 **Breaking Changes**
- None - this is a stability and enhancement release

### 🐛 **Bug Fixes**
- Fixed TypeScript implicit 'any' type errors in index.ts
- Resolved missing type declarations for fs-extra, express, cors
- Fixed ArcPolicyEngine constructor requiring KubeConfig parameter
- Corrected CI test expectations (11 rules vs 12)
- Fixed natural language parser test cases for intent matching

### 📈 **Performance Improvements**
- Optimized Docker image size to 365MB (multi-stage Alpine build)
- Enhanced ES module loading for faster startup
- Improved policy engine initialization with proper Kubernetes client setup

### 🛡️ **Security**
- All ARC operations require proper Kubernetes authentication
- GitHub token security with secret management
- Runner security context enforcement
- Privileged container prevention policies

### 📚 **Documentation**
- Updated README with comprehensive setup instructions
- Added troubleshooting guides for common issues
- Enhanced API documentation for all MCP tools
- Local testing scripts with clear examples

### 🙏 **Acknowledgments**
Special thanks to the community for testing and feedback that made this production-ready release possible!

---

## 🔗 **Links**
- **Repository**: https://github.com/tsviz/arc-config-mcp
- **Issues**: https://github.com/tsviz/arc-config-mcp/issues
- **Documentation**: https://github.com/tsviz/arc-config-mcp#readme

## 💬 **Support**
For questions, issues, or contributions, please visit our GitHub repository or open an issue.

**Happy ARC Managing! 🚀**