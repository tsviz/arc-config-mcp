# ARC MCP Server Quickstart Guide

> **🚀 Get up and running with ARC automation in 5 minutes**
> 
> This guide walks you through setting up the ARC MCP Server for AI-powered GitHub Actions Runner Controller management.

## ⚡ Quick Setup Options

Choose your preferred setup method:

### 🐳 Option 1: Docker (Recommended)
```bash
# Run with minimal configuration
docker run -p 3000:3000 \
  -e GITHUB_TOKEN=your_token_here \
  -v ~/.kube/config:/app/.kube/config:ro \
  ghcr.io/tsviz/arc-config-mcp:latest
```

### 📦 Option 2: npm/Node.js
```bash
# Clone and install
git clone https://github.com/tsviz/arc-config-mcp.git
cd arc-config-mcp
npm install && npm run build && npm start
```

### 🤖 Option 3: MCP Client Integration
```bash
# Direct MCP protocol connection
npm start -- --stdio
```

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Kubernetes cluster** (1.24+ recommended)
- [ ] **kubectl** configured and connected
- [ ] **GitHub Personal Access Token** with required scopes
- [ ] **Node.js 18+** (if running locally)
- [ ] **Docker** (if using container method)

## 🔑 GitHub Token Setup

1. **Create Personal Access Token**: https://github.com/settings/tokens/new

2. **Required Scopes**:
   ```
   ✅ repo                    # Repository access
   ✅ admin:org               # Organization management  
   ✅ workflow                # Actions workflow management
   ```

3. **Set Environment Variable**:
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ```

## 🎯 Quick Start Scenarios

### Scenario 1: First-Time ARC Installation

```text
🧑 "Install ARC in my development cluster"

🤖 I'll help you set up ARC with development-friendly settings:

   1️⃣ Checking cluster readiness...
      ✅ Kubernetes 1.28 detected
      ✅ kubectl access verified
      ✅ Sufficient resources available

   2️⃣ Installing ARC controller...
      📦 Downloading actions-runner-controller v0.9.1
      ⚙️ Configuring with development security profile
      🚀 Deploying to namespace: arc-system

   3️⃣ Setting up basic runners...
      👥 Creating default runner set
      🔗 Registering with GitHub repository
      📊 Enabling basic monitoring

   ✅ Installation complete!
      🌐 ARC dashboard: kubectl port-forward -n arc-system svc/controller 8080:8080
      📚 Next steps: Scale runners or configure advanced features
```

### Scenario 2: Health Check & Status

```text
🧑 "Check my ARC status"

🤖 Running comprehensive ARC health check...

   📊 Controller Status:
      ✅ ARC Controller: Running (v0.9.1)
      ✅ Webhook Server: Healthy
      ✅ Metrics Server: Collecting data

   🏃 Runner Status:
      • Active runners: 3/5
      • Queued jobs: 1
      • Success rate: 98.5%

   🔍 Recent Activity:
      • Job completed: web-app-ci (2m ago)
      • Runner scaled up: +2 runners (5m ago)
      • Health check: All systems green ✅

   💡 Recommendations:
      • Consider auto-scaling for variable loads
      • Update to latest ARC version (v0.9.2 available)
```

### Scenario 3: Scale Runners for High Load

```text
🧑 "Scale my runners for the afternoon deployment window"

🤖 Preparing for high-load deployment window:

   📊 Current Situation:
      • Active runners: 3
      • Queue depth: 8 jobs
      • Average wait time: 4 minutes

   🎯 Scaling Strategy:
      • Target runners: 8 (optimal for current queue)
      • Auto-scaling: Enable (3-12 range)
      • Scale-down delay: 10 minutes (post-deployment)

   ⚙️ Implementing scaling...
      ✅ Updated runner set configuration
      ✅ Horizontal Pod Autoscaler configured
      ✅ Resource quotas verified

   🚀 Result:
      • New runner capacity: 8 runners
      • Estimated queue clear time: 2 minutes
      • Cost impact: +$15/hour during peak
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Required
GITHUB_TOKEN=ghp_your_token_here

# Optional but recommended
GITHUB_ORG=your-organization          # For org-level runners
GITHUB_REPO=your-repository           # For repo-specific runners
KUBECONFIG_PATH=/path/to/kubeconfig   # If not using default location
ARC_NAMESPACE=arc-system              # ARC controller namespace
RUNNER_NAMESPACE=arc-runners          # Runner pods namespace

# MCP Server Settings
MCP_PORT=3000                         # HTTP mode port
LOG_LEVEL=info                        # debug|info|warn|error
ENABLE_METRICS=true                   # Prometheus metrics
```

### VS Code + GitHub Copilot Integration

1. **Add to MCP Settings** (`~/.config/github-copilot/mcp.json`):
   ```json
   {
     "mcpServers": {
       "arc-config": {
         "command": "node",
         "args": ["/path/to/arc-config-mcp/build/index.js"],
         "env": {
           "GITHUB_TOKEN": "your_token_here",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

2. **Test Integration**:
   - Open VS Code with GitHub Copilot
   - Type: *"Show me my ARC status"*
   - Copilot should connect to the MCP server

### Kubernetes RBAC Setup

If you encounter permission issues, apply this RBAC configuration:

```bash
# Download and apply RBAC manifests
kubectl apply -f https://raw.githubusercontent.com/tsviz/arc-config-mcp/main/examples/rbac.yaml

# Or create manually
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: arc-mcp-server
  namespace: arc-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: arc-mcp-server
rules:
- apiGroups: [""]
  resources: ["namespaces", "pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
- apiGroups: ["actions.summerwind.dev"]
  resources: ["*"]
  verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: arc-mcp-server
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: arc-mcp-server
subjects:
- kind: ServiceAccount
  name: arc-mcp-server
  namespace: arc-system
EOF
```

## 🧪 Testing Your Setup

### 1. Basic Connectivity Test

```bash
# Test Kubernetes connectivity
kubectl cluster-info

# Test GitHub API connectivity
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Test MCP server health (if running in HTTP mode)
curl http://localhost:3000/health
```

### 2. MCP Tool Test

Use the MCP client to test available tools:

```bash
# List available tools
echo '{"method": "tools/list", "params": {}}' | nc localhost 3000

# Test ARC status
echo '{"method": "tools/call", "params": {"name": "arc_get_status"}}' | nc localhost 3000
```

### 3. Natural Language Test

Try these commands with your MCP client:

```text
🧑 "What ARC tools are available?"
🧑 "Check my cluster status"
🧑 "Show me runner health"
🧑 "List ARC components"
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### ❌ Kubernetes Connection Failed
```bash
# Check kubectl configuration
kubectl config current-context
kubectl auth can-i create pods --namespace arc-system

# Solution: Fix KUBECONFIG or RBAC permissions
export KUBECONFIG=/path/to/correct/kubeconfig
kubectl apply -f examples/rbac.yaml
```

#### ❌ GitHub API Authentication Failed
```bash
# Test token validity
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Solution: Regenerate token with correct scopes
# Go to: https://github.com/settings/tokens
```

#### ❌ MCP Server Won't Start
```bash
# Check Node.js version
node --version  # Should be 18+

# Check dependencies
npm install

# Check TypeScript compilation
npm run build

# Solution: Update Node.js or fix compilation errors
```

#### ❌ No ARC Resources Found
```bash
# Check if ARC is installed
kubectl get pods -n arc-system
kubectl get crd | grep actions

# Solution: Install ARC first
# Use: "Install ARC in my cluster" command
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Environment variable
export LOG_LEVEL=debug
export DEBUG=arc:*,mcp:*,k8s:*

# Runtime flag
npm start -- --log-level debug

# Docker debug mode
docker run -e LOG_LEVEL=debug -e DEBUG=arc:* \
  ghcr.io/tsviz/arc-config-mcp:latest
```

### Health Check Commands

```bash
# Check all components
kubectl get all -n arc-system
kubectl get all -n arc-runners

# Check ARC controller logs
kubectl logs -n arc-system deployment/controller

# Check runner pod logs
kubectl logs -n arc-runners -l app=github-actions-runner

# Check MCP server metrics (if enabled)
curl http://localhost:3000/metrics
```

## 🎓 Next Steps

### 🚀 Basic Operations
- **Install ARC**: *"Install ARC in my cluster with standard security"*
- **Scale Runners**: *"Scale my runners to 10 for high load"*
- **Monitor Health**: *"Show me detailed ARC status"*
- **Troubleshoot**: *"Diagnose why my runners are failing"*

### 🔒 Security & Compliance
- **Policy Validation**: *"Check my ARC setup against SOC2 requirements"*
- **Security Scan**: *"Run security scan on my ARC deployment"*
- **Compliance Report**: *"Generate compliance report for auditors"*

### 💰 Cost Optimization
- **Cost Analysis**: *"Show me ARC cost breakdown and optimization opportunities"*
- **Auto-scaling**: *"Set up intelligent auto-scaling for cost efficiency"*
- **Resource Right-sizing**: *"Optimize runner resource allocations"*

### 📚 Learning Resources
- [Complete Tool Catalog](./TOOLS.md)
- [Policy as Code Guide](./docs/POLICY_AS_CODE.md)
- [External Configuration](./docs/EXTERNAL_POLICY_CONFIG.md)
- [Advanced Examples](./examples/)

## 💬 Getting Help

### 🆘 Support Channels
- **GitHub Issues**: [Report bugs or request features](https://github.com/tsviz/arc-config-mcp/issues)
- **Discussions**: [Community Q&A](https://github.com/tsviz/arc-config-mcp/discussions)
- **Documentation**: [Complete docs](./docs/)

### 🤝 Community
- **Contributing**: [How to contribute](./CONTRIBUTING.md)
- **Code of Conduct**: [Community guidelines](./CODE_OF_CONDUCT.md)
- **Roadmap**: [Future plans](./ROADMAP.md)

---

<div align="center">

**🎉 Congratulations! You're ready to automate ARC with AI**

[Advanced Configuration](./docs/) • [Tool Examples](./examples/) • [Community](https://github.com/tsviz/arc-config-mcp/discussions)

*From manual kubectl commands to conversational AI automation in 5 minutes* ✨

</div>