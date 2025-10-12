# ARC Config MCP v2.3.0 Release Notes

## 🎉 What's New in v2.3.0

### 🚀 Major Installation & Management Enhancements

This release represents a significant improvement to the ARC (GitHub Actions Runner Controller) installation and management experience, with enterprise-grade enhancements, better error handling, and optimized configurations for high-capacity workloads.

---

## ✨ Key Features & Improvements

### 🔐 **Enhanced GitHub Integration**
- **Real GitHub API Integration**: Replaced placeholder GitHub service with actual API calls
- **Comprehensive Token Validation**: Added detailed GitHub token permission checking
- **Smart Error Diagnostics**: Provides specific remediation steps for token issues
- **Token Format Validation**: Checks for proper `ghp_` or `github_pat_` prefixes
- **Organization Permission Testing**: Validates self-hosted runner permissions

### 🛠️ **Advanced Installation Features**
- **Intelligent Prerequisites Validation**: Enhanced validation with detailed error reporting
- **Automatic Controller Restart**: Ensures GitHub token updates are applied immediately
- **Fallback Error Recovery**: Multiple recovery mechanisms for installation failures
- **Enhanced Troubleshooting**: Real-time diagnostics during installation process

### 📈 **Optimized for High-Capacity Workloads**
- **Default Runners**: Increased from 3 to **20 runners** for enterprise workloads
- **Smart Autoscaling**: Enhanced configuration (min: 20, max: 40+)
- **Concurrent Job Support**: Optimized for handling multiple parallel jobs
- **Enterprise Security**: Enhanced security policies and network configurations

### 🎯 **Improved User Experience**
- **Better Error Messages**: Detailed, actionable error descriptions
- **Step-by-Step Remediation**: Clear instructions for fixing common issues
- **Enhanced Progress Reporting**: Real-time installation progress with AI insights
- **Natural Language Processing**: Improved command interpretation

---

## 🔧 Technical Improvements

### **GitHub Service Enhancements**
```typescript
// NEW: Real GitHub API integration
async getCurrentUser(githubToken?: string): Promise<any>
```
- Actual API calls to GitHub with proper error handling
- HTTP status code analysis (401, 403, etc.)
- Detailed token validation and format checking

### **Enhanced ARC Installer**
```typescript
// NEW: Comprehensive token validation
private async validateGitHubTokenPermissions(githubToken: string, organizationName?: string): Promise<void>
```
- Organization access verification
- Runner registration permission testing
- Detailed permission requirement documentation

### **Optimized Runner Configurations**
```yaml
# IMPROVED: Default configurations
spec:
  replicas: 20  # Was: 3
  minReplicas: 20  # Was: 1
  maxReplicas: 40  # Was: 6
```

---

## 📊 Configuration Updates

### **Enhanced Example Templates**
- **Runner Deployment**: Updated to handle 4+ concurrent parallel jobs
- **Autoscaling HPA**: Better minimum thresholds and scaling policies
- **Enterprise Security**: Improved security contexts and network policies

### **MCP Server Configuration**
- **Updated Docker Image**: Latest build with enhanced features
- **Environment Variables**: Better precedence handling for organization settings
- **Error Recovery**: Enhanced fallback mechanisms

---

## 🛡️ Error Handling & Diagnostics

### **Prerequisite Validation Failures**
- **GitHub Token Issues**: Detailed analysis with remediation steps
- **Kubernetes Connectivity**: Enhanced cluster access diagnostics
- **Helm Availability**: Better Helm installation guidance

### **Installation Troubleshooting**
- **Real-time Diagnostics**: Live analysis during installation
- **Controller Log Analysis**: Automatic error detection in ARC logs
- **Recovery Mechanisms**: Multiple fallback strategies

### **Enhanced Error Messages**
```
❌ GitHub Token Authentication Failed

Error: Bad credentials
Status: 401 Unauthorized

Your GitHub Personal Access Token (PAT) is invalid, expired, or malformed.

🔧 How to Fix:
1. Check token format: Should start with 'ghp_' or 'github_pat_'
2. Verify token length: Should be 40+ characters
3. Generate new token: Go to GitHub Settings > Personal Access Tokens
4. Required permissions:
   - Organization permissions:
     - Administration: Read
     - Self-hosted runners: Read and write
   - Repository permissions:
     - Administration: Read and write
5. Update MCP configuration with the new token
6. Restart the MCP server and try again
```

---

## 🎯 Usage Examples

### **Quick ARC Installation**
```bash
# With the enhanced error handling and diagnostics
arc_install_controller --namespace arc-systems --enableRealTimeLogging true
```

### **High-Capacity Runner Deployment**
```bash
# Deploy 20 runners with auto-scaling (new default)
arc_deploy_runners --organization tsvi-solutions --replicas 20
```

### **Enhanced Status Checking**
```bash
# Get comprehensive status with visual diagrams
arc_get_status --includeVisualDiagram true
```

---

## 📋 Migration Guide

### **From v2.2.x to v2.3.0**

1. **GitHub Token Requirements**:
   - Ensure your token has the required permissions (see error messages for details)
   - Token format must be `ghp_` or `github_pat_` prefixed

2. **Default Runner Count**:
   - Default increased from 3 to 20 runners
   - Autoscaling now starts at 20 minimum
   - Adjust if you need fewer runners: `--replicas 5`

3. **Environment Variables**:
   - `GITHUB_ORG` now takes precedence over parameter values
   - `RUNNER_LABEL` environment variable support added

4. **Docker Image**:
   - Update your MCP configuration to use the latest image tag
   - Image includes enhanced error handling and diagnostics

---

## 🔍 Breaking Changes

- **Default Runner Count**: Changed from 3 to 20 (can be overridden)
- **Minimum Autoscaling**: Changed from 1 to 20 (for enterprise workloads)
- **GitHub Service**: Real API calls replace placeholder responses
- **Error Handling**: Enhanced validation may catch previously ignored issues

---

## 🚀 Performance Improvements

- **Faster Installation**: Optimized Helm operations and validation steps
- **Better Resource Utilization**: Enhanced runner configurations for efficiency
- **Reduced Error Recovery Time**: Faster diagnosis and automatic fixes
- **Improved Scaling**: Better autoscaling algorithms for workload prediction

---

## 🛠️ Development & Testing

### **Enhanced Testing**
- Comprehensive error scenario testing
- GitHub API integration testing
- Installation recovery testing

### **Better Logging**
- Enhanced diagnostic logging throughout installation process
- Real-time progress updates with AI insights
- Detailed error analysis and reporting

---

## 📚 Documentation

- **Enhanced Error Messages**: Self-documenting error responses
- **Inline Code Comments**: Better documentation of complex logic
- **Example Configurations**: Updated with enterprise-grade settings
- **Troubleshooting Guides**: Built into error messages

---

## 🙏 Acknowledgments

This release includes significant improvements based on real-world ARC deployment experience and user feedback. Special thanks to the community for reporting issues and suggesting enhancements.

---

## 📞 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/tsviz/arc-config-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tsviz/arc-config-mcp/discussions)
- **Documentation**: [Project README](https://github.com/tsviz/arc-config-mcp/blob/main/README.md)

---

**Full Changelog**: [v2.2.1...v2.3.0](https://github.com/tsviz/arc-config-mcp/compare/v2.2.1...v2.3.0)

**Download**: [Release v2.3.0](https://github.com/tsviz/arc-config-mcp/releases/tag/v2.3.0)