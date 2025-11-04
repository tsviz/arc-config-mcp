# ARC Config MCP Server

> **🚀 AI-Powered GitHub Actions Runner Controller Management**
> 
> A comprehensive TypeScript MCP (Model Context Protocol) server that transforms complex ARC operations into conversational AI interactions. Deploy, monitor, and manage GitHub Actions runners with natural language commands.

> **🎯 QUICK START**: Add to your MCP client: `ghcr.io/tsviz/arc-config-mcp:latest` → Ask AI: *"Install ARC in my cluster"* → Done! ✨

[![GitHub release](https://img.shields.io/github/release/tsviz/arc-config-mcp.svg)](https://github.com/tsviz/arc-config-mcp/releases)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Ftsviz%2Farc--config--mcp-blue)](https://ghcr.io/tsviz/arc-config-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

**📚 Quick Links**: [Installation](#-quick-start) • [Policy Validation Guide](docs/POLICY_VALIDATION_GUIDE.md) • [Policy Rule Integration](docs/POLICY_RULE_INTEGRATION.md) • [Hybrid Workflows](docs/HYBRID_WORKFLOW_CLARITY.md) • [Tool Catalog](#%EF%B8%8F-complete-tool-catalog) • [Roadmap](ROADMAP.md) • [Contributing](#%F0%9F%A4%9D-contributing)

## 🎯 What is ARC Config MCP Server?

ARC Config MCP Server is an enterprise-grade automation tool that bridges the gap between complex Kubernetes-based GitHub Actions runner management and intuitive AI-powered operations. Instead of memorizing kubectl commands and YAML configurations, simply tell the AI what you want to accomplish.

**🆕 NOW SUPPORTS ARC 0.13.0** with advanced container modes, dual-stack networking, Azure Key Vault integration, and OpenShift support!

## 🌟 Key Features

### 🤖 **Natural Language Operations**
Transform complex ARC tasks into simple conversations:
- *"Install ARC with container mode optimization"*
- *"Scale runners to handle 50 concurrent jobs"* 
- *"Set up dual-stack networking for IPv6 support"*
- *"Configure Azure Key Vault for secure secret management"*

### ⚡ **ARC 0.13.0 Enhancements**
- **🔥 Container Mode**: `kubernetes-novolume` eliminates ReadWriteMany storage requirements
- **🌐 Dual-Stack Networking**: IPv4/IPv6 support with automatic fallback
- **🔐 Azure Key Vault Integration**: Secure secret management without workflow exposure
- **🏢 OpenShift Support**: Enterprise-grade deployment with Security Context Constraints
- **📊 Enhanced Metrics**: New `workflow_name` and `target` labels for better monitoring

### 🚀 **Enterprise-Ready Capabilities**
- **Intelligent Installation**: Zero-configuration ARC deployment with smart defaults
- **Real-time Monitoring**: Live status dashboards and proactive health monitoring
- **Enterprise Security**: Built-in policy validation and compliance enforcement with 20+ security rules
- **Automated Policy Remediation**: Auto-fix feature generates corrected configs for 6+ common violations
- **Compliance Reporting**: Generate SOC2/enterprise compliance reports with scoring and recommendations
- **Cost Intelligence**: Automatic scaling and resource optimization
- **Self-Healing**: Automated troubleshooting and remediation
- **Platform Support**: Kubernetes, OpenShift, AKS, EKS, GKE compatibility

## 🚀 Quick Start

### 🎯 Step 1: Connect to MCP Client

**Use with AI assistants like GitHub Copilot in VS Code**

Add this configuration to your MCP client settings (e.g., `~/.mcp.json` or VS Code settings):

```json
{
  "mcpServers": {
    "arc-config": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "${HOME}/.kube:/home/node/.kube:ro",
        "-v", "/path/to/your/project/configs:/app/configs",
        "-e", "GITHUB_TOKEN",
        "ghcr.io/tsviz/arc-config-mcp:latest"
      ]
    }
  }
}
```

> **💡 Configuration Path**: Replace `/path/to/your/project/configs` with your actual project path (e.g., `/Users/username/projects/my-arc-project/configs`)

### 🎯 Step 2: Choose Your Workflow

The MCP server supports **three deployment workflows** to match your team's needs:

| Workflow | Best For | Config Files | Auto-Apply | Version Control |
|----------|----------|--------------|------------|-----------------|
| **Recommended** (Default) | Most teams | ✅ Saved | ❌ Manual* | ✅ Yes |
| **Direct Apply** | Quick testing | ❌ Not saved | ✅ Automatic | ❌ No |
| **Full GitOps** | Enterprise teams | ✅ Saved | ❌ CI/CD handles it | ✅ Yes + CI/CD |

*\*You review the generated config, then tell the AI to apply it (e.g., "apply it" or "deploy it")*

**💡 Choosing a workflow:** The default (Recommended) balances safety and convenience. For quick experiments, use Direct Apply. For production deployments, stick with Recommended or Full GitOps to maintain audit trails and enable rollbacks.

### 🎯 Step 3: Start Using Natural Language

**✨ That's it!** Talk to your AI assistant to manage ARC:

```text
"Install ARC controller in my cluster"
"Deploy 10-20 autoscaling runners for my organization"
"Show me the status of my runners"
"Scale up to handle more load"
```

> **📖 Learn More**: See [Understanding Workflows](#-understanding-workflows) below to choose the best approach for your team.

---

<a id="understanding-workflows"></a>

## 📖 Understanding Workflows

The MCP server offers three ways to deploy and manage ARC, each suited for different needs:

### 🎯 Recommended Workflow (Default)

**Perfect for most teams** - Combines AI convenience with version control best practices.

**How it works:**
1. AI generates configuration files in `configs/` directory
2. You review the YAML files (they're in your project!)
3. Apply using AI commands: *"Apply the runner configuration"*
4. Changes are tracked in Git for audit trail

**Benefits:**
- ✅ Version control for all infrastructure
- ✅ Review changes before applying
- ✅ Easy rollback via Git
- ✅ Team collaboration via Pull Requests
- ✅ Still simple to use with AI

**Example:**
```text
You: "Deploy 20-40 runners for my-org"
AI:  ✅ Created configs/runner-sets/my-org-runners.yaml
     👀 Review the file, then say "apply it" when ready

You: "Apply it"
AI:  ✅ Applied to cluster! 20 runners starting...
```

> **📖 Detailed Guide**: [Workflow Guide](docs/WORKFLOW_GUIDE.md) | [Visual Guide](docs/HYBRID_WORKFLOW_VISUAL_GUIDE.md)

### ⚡ Direct Apply Workflow

**Best for quick testing** - Deploy immediately without saving configuration files.

**How it works:**
1. AI deploys directly to cluster
2. No config files created
3. Fastest approach

**Tradeoffs:**
- ❌ No version control
- ❌ No audit trail
- ❌ Can't review before applying
- ✅ Fastest for testing

**Example:**
```text
You: "Install ARC controller with direct mode"
AI:  ✅ Installing directly to cluster...
     ✅ Done in 45 seconds!
```

### 🏢 Full GitOps Workflow

**Best for enterprise teams** - Integrates with ArgoCD, Flux, or CI/CD pipelines.

**How it works:**
1. AI generates configuration files only
2. You commit to Git
3. Your GitOps tool (ArgoCD/Flux) applies automatically
4. Never applies directly to cluster

**Benefits:**
- ✅ Full GitOps compliance
- ✅ Automated deployments via CI/CD
- ✅ Policy enforcement before apply
- ✅ Complete audit trail

**Example:**
```text
You: "Generate runner config for my-org in gitops mode"
AI:  ✅ Created configs/runner-sets/my-org-runners.yaml
     📋 Commit to Git - your GitOps tool will handle deployment
```

> **📖 GitOps Guide**: [Setting up ArgoCD/Flux](docs/WORKFLOW_GUIDE.md#gitops-integration)

---

## 🛠️ Alternative Installation Methods

### 🐳 Docker Standalone
```bash
# Pull and run the latest version
docker run -p 3000:3000 ghcr.io/tsviz/arc-config-mcp:latest

# With custom configuration
docker run -p 3000:3000 \
  -e GITHUB_TOKEN=your_token \
  -e KUBECONFIG_PATH=/kubeconfig \
  -v ~/.kube/config:/kubeconfig:ro \
  ghcr.io/tsviz/arc-config-mcp:latest
```

### 🛠️ Local Development
```bash
git clone https://github.com/tsviz/arc-config-mcp.git
cd arc-config-mcp
npm install
npm run build
npm start -- --stdio  # For MCP protocol connection
```

---

## 🎭 Natural Language Examples

Transform complex ARC operations into simple conversations:

### 🔥 ARC 0.13.0 Enhanced Examples

```text
🧑 "Install ARC with the new container mode to eliminate storage issues"
🤖 ✅ Installing ARC controller with kubernetes-novolume container mode...
   📦 Helm chart: actions-runner-controller v0.13.0
   🔥 Container mode: kubernetes-novolume (no RWX storage needed!)
   📊 Enhanced metrics: workflow_name and target labels enabled
   🔒 Security: JIT token secure mode enabled
   ⏱️ Installation completed in 52 seconds

🧑 "Set up dual-stack networking for IPv6 support"
🤖 ✅ Configuring dual-stack networking for ARC runners...
   🌐 IPv4/IPv6: Dual-stack support enabled
   🔄 Fallback: IPv4 only if IPv6 unavailable
   🛡️ Network policies: Updated for dual-stack
   📝 DNS config: Optimized for both protocols
   ⏱️ Network configuration completed in 30 seconds

🧑 "Configure Azure Key Vault integration for secure secrets"
🤖 ✅ Setting up Azure Key Vault CSI integration...
   🔐 Key Vault: Connected to production vault
   🎫 Workload Identity: Configured for secure access
   🚫 Workflow context: Secrets isolated from workflows
   📋 Secret Provider Class: Created and validated
   ⏱️ Azure Key Vault integration completed in 75 seconds

🧑 "Deploy runners optimized for OpenShift with enterprise security"
🤖 ✅ Deploying OpenShift-optimized ARC runners...
   🏢 Platform: OpenShift Security Context Constraints applied
   👤 Security: Non-root user with restricted capabilities
   🏷️ SELinux: Multi-Category Security labels configured
   🔒 Pod Security: Restricted standard enforced
   ⏱️ OpenShift deployment completed in 95 seconds
```

### 💡 Traditional Examples

```text
🧑 "Install ARC in my dev cluster with basic security settings"
🤖 ✅ Installing ARC controller with development security profile...
   📦 Helm chart: actions-runner-controller v0.13.0
   🔒 Security: Basic validation enabled
   📍 Namespace: arc-systems
   ⏱️ Installation completed in 45 seconds

🧑 "Scale my repo runners to handle the evening build rush"
🤖 ✅ Analyzing current load and scaling runners...
   📊 Current: 3 runners, Target: 8 runners
   📈 Load factor: 85% → 45%
   💰 Cost impact: +$12/hour (estimated)
   ⏱️ Scaling completed in 90 seconds

🧑 "Show me why my runners keep failing"
🤖 🔍 Analyzing runner health and recent failures...
   ❌ Issue found: Insufficient CPU resources
   💡 Recommendation: Increase runner resource limits
   🛠️ Auto-fix available: Update resource quotas
   📋 Policy violation: Resource limits below minimum

🧑 "Check ARC policies and fix what you can"
🤖 ✅ Running policy validation and auto-remediation...
   📊 Compliance Score: 55.6% (10/18 policies passing)
   🔧 Auto-fixing 3 violations (CPU limits, memory requests, labels)
   📝 Generated: configs/runner-sets/my-runners-fixed.yaml
   💡 Manual fixes needed: 2 violations (see recommendations)
   ⏱️ Auto-fix completed in 18 seconds

🧑 "Validate policies and apply fixes to the cluster"
🤖 ✅ Running policy validation with cluster remediation...
   📊 Initial Compliance: 44.4% (8/18 policies passing)
   🔧 Applied 4 fixes to cluster (resources, security contexts)
   📝 Saved audit trail: configs/runner-sets/production-runners-fixed.yaml
   ✅ Final Compliance: 77.8% (14/18 policies passing)
   ⏱️ Validation and remediation completed in 32 seconds
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Client     │    │   MCP Server    │    │   Kubernetes    │
│   (Copilot)     │◄──►│   (This Repo)   │◄──►│   (ARC Runs)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                         ┌─────────────────┐
                         │   GitHub API    │
                         │ (Runner Mgmt)   │
                         └─────────────────┘
```

### Components
- **Natural Language Processor**: Converts human intent to structured operations
- **ARC Policy Engine**: Validates configurations against 18 built-in enterprise policies
- **Configuration Manager**: GitOps-ready config generation with version control support
- **Kubernetes Orchestrator**: Manages cluster resources and deployments
- **GitHub Integration**: Handles runner registration and lifecycle
- **Monitoring Hub**: Tracks performance and health metrics

## 🛠️ Complete Tool Catalog

> **📚 Full Documentation**: See [TOOLS.md](TOOLS.md) for comprehensive tool documentation with examples and parameters.

### 🎯 Core Operations
| Tool                         | Purpose                    | Example Usage                |
| ---------------------------- | -------------------------- | ---------------------------- |
| `arc_install_controller`     | Deploy ARC to Kubernetes   | Install with custom config   |
| `arc_get_status`             | Comprehensive health check | Monitor all components       |
| `arc_scale_runners`          | Horizontal runner scaling  | Handle load spikes           |
| `arc_manage_runners`         | Full lifecycle management  | Create/update/delete runners |
| `arc_cleanup_installation`   | Safe ARC cleanup/uninstall | Remove ARC with AI guidance  |
| `arc_analyze_cleanup_state`  | Pre-cleanup analysis       | Analyze before removing ARC  |

> **🛡️ Safety Note**: Cleanup functionality is **disabled by default**. Set `CLEANUP_ARC=true` environment variable to enable. See [Cleanup Documentation](docs/CLEANUP_FUNCTIONALITY.md) for details.

### 📋 Configuration Management Tools
Use these tools with the [Recommended Workflow](#-recommended-workflow-default) for version-controlled deployments.

| Tool                           | Purpose                        | Example Usage                     |
| ------------------------------ | ------------------------------ | --------------------------------- |
| `arc_install_controller_hybrid`| Install ARC with config files  | Generate controller configuration   |
| `arc_deploy_runners_hybrid`    | Deploy runners with versioning | Generate and apply runner configs |
| `arc_apply_config`             | Apply existing config files    | Deploy from repository configs    |
| `arc_list_configs`             | List stored configurations     | View all config files             |
| `arc_detect_drift`             | Compare config vs deployed     | Find configuration drift          |

### 🤖 AI-Powered Features
| Tool                           | Purpose                  | Example Usage                |
| ------------------------------ | ------------------------ | ---------------------------- |
| `arc_process_natural_language` | Convert speech to action | "Scale up for deployment"    |

### 🔐 Security & Compliance
| Tool                       | Purpose                              | Example Usage                |
| -------------------------- | ------------------------------------ | ---------------------------- |
| `arc_validate_policies`    | Validate & auto-fix policy violations (generates fixed configs in `configs/`)| Compliance reports, config-based remediation |

### 🏛️ Legacy Tools
| Tool                       | Purpose                  | Status      |
| -------------------------- | ------------------------ | ----------- |
| `deploy_github_runners`    | Original deployment tool | Deprecated  |

## 🗺️ Roadmap & Future Tools

The following tools are planned for future releases to enhance ARC management capabilities:

### 🔐 Security & Compliance (High Priority)
| Tool                       | Purpose                              | Priority | Complexity |
| -------------------------- | ------------------------------------ | -------- | ---------- |
| `arc_audit_logs`           | Security audit log analysis          | High     | Medium     |
| `arc_manage_secrets`       | Secret rotation and management       | Medium   | High       |
| `arc_configure_networking` | Network policy management            | Medium   | Medium     |

### 🎯 Operations & Monitoring (Medium Priority)
| Tool                       | Purpose                                | Priority | Complexity |
| -------------------------- | -------------------------------------- | -------- | ---------- |
| `arc_troubleshoot_issues`  | Automated diagnostics for common issues| High     | High       |
| `arc_optimize_costs`       | Resource and cost optimization         | Medium   | Medium     |
| `arc_generate_reports`     | Operational reports and metrics        | Medium   | Low        |
| `arc_performance_tuning`   | Auto-tune runner performance settings  | Low      | High       |

### 🚀 Advanced Features (Lower Priority)
| Tool                       | Purpose                                | Priority | Complexity |
| -------------------------- | -------------------------------------- | -------- | ---------- |
| `arc_backup_config`        | Configuration backup and restore       | Medium   | Low        |
| `arc_upgrade_components`   | Automated ARC version upgrades         | Medium   | High       |
| `arc_migrate_runners`      | Migrate runners between clusters       | Low      | High       |
| `arc_disaster_recovery`    | DR planning and execution              | Low      | Very High  |

> **💡 Want to contribute?** These tools are tracked as GitHub issues. Check the [Issues](https://github.com/tsviz/arc-config-mcp/issues) page for details and implementation discussions.

## 📋 Prerequisites & Requirements


### System Requirements
- **Node.js**: 18.0+ (LTS recommended)
- **Kubernetes**: 1.24+ (tested up to 1.30)
- **Memory**: 512MB+ for server
- **Storage**: 100MB for installation

### Kubernetes Permissions
The server requires these cluster permissions:
- **Namespaces**: List, create, watch
- **Deployments**: Full CRUD operations
- **Services**: Create, update, delete
- **ConfigMaps/Secrets**: Manage runner configurations
- **RBAC**: Create service accounts and roles

### GitHub Requirements
- **Personal Access Token** with scopes:
  - `repo` (for repository access)
  - `admin:org` (for organization runners)
  - `workflow` (for Actions management)
- **Organization/Repository** admin permissions
- **GitHub Actions** enabled

## 🔧 Installation & Configuration

### Environment Configuration
Create a `.env` file with your settings:

```bash
# GitHub Configuration
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_ORG=your-organization
GITHUB_REPO=your-repository

# Kubernetes Configuration  
KUBECONFIG_PATH=/path/to/kubeconfig
ARC_NAMESPACE=arc-systems
RUNNER_NAMESPACE=arc-runners

# MCP Server Configuration
MCP_PORT=3000
LOG_LEVEL=info
ENABLE_METRICS=true

# Security Settings
ENABLE_POLICY_VALIDATION=true
SECURITY_PROFILE=standard  # basic|standard|strict
AUTO_FIX_VIOLATIONS=false
CLEANUP_ARC=false  # Enable ARC cleanup/uninstall functionality (disabled by default for safety)

# Performance Tuning
MAX_CONCURRENT_OPERATIONS=5
OPERATION_TIMEOUT=300
RETRY_ATTEMPTS=3
```

### VS Code + GitHub Copilot Integration

1. **Configure MCP Server** (already shown above):
   The JSON configuration from the Quick Start section works directly with VS Code + GitHub Copilot.

2. **Enable MCP in GitHub Copilot**:
   Add to your VS Code settings:
   ```json
   {
     "github.copilot.enable": {
       "*": true,
       "mcp": true
     }
   }
   ```

3. **Start using natural language commands** with GitHub Copilot to manage your ARC infrastructure!

### Production Deployment

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arc-config-mcp
  namespace: mcp-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: arc-config-mcp
  template:
    metadata:
      labels:
        app: arc-config-mcp
    spec:
      containers:
      - name: mcp-server
        image: ghcr.io/tsviz/arc-config-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: github-credentials
              key: token
        - name: LOG_LEVEL
          value: "info"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

#### Docker Compose
```yaml
version: '3.8'
services:
  arc-mcp:
    image: ghcr.io/tsviz/arc-config-mcp:latest
    ports:
      - "3000:3000"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - LOG_LEVEL=info
    volumes:
      - ~/.kube/config:/app/.kube/config:ro
    restart: unless-stopped
```

## 🎨 Usage Patterns & Examples

### 🔥 ARC 0.13.0 Advanced Patterns

#### 1. Container Mode Optimization
```text
🧑 "Upgrade my existing ARC to use the new container mode"

🤖 I'll migrate you to kubernetes-novolume container mode:

   1️⃣ Analyzing current deployment...
      📊 Current: kubernetes mode with PVC storage
      🔍 RWX storage usage: 15 GB across 8 runners
      💰 Storage cost: $45/month

   2️⃣ Planning migration to kubernetes-novolume...
      ⚡ Benefits: No RWX storage dependency
      📈 Performance: ~30% faster job startup
      💰 Cost savings: $45/month storage eliminated
      🔧 Lifecycle hooks: preStart/preStop configured

   3️⃣ Executing migration...
      🚀 Creating new runner deployment with container mode
      📦 Adding workspace lifecycle hooks
      🔄 Rolling out updated configuration
      🧹 Cleaning up legacy PVC resources

   ✅ Migration complete!
      🎯 Container mode: kubernetes-novolume active
      ⚡ Job startup time: Reduced by 28 seconds
      💾 Ephemeral storage: 10Gi per runner
```

#### 2. Dual-Stack Networking Setup
```text
🧑 "Configure my runners for IPv6 support"

🤖 Setting up dual-stack networking for future-ready infrastructure:

   1️⃣ Evaluating network requirements...
      🌐 Current: IPv4 only
      📋 Target: IPv4/IPv6 dual-stack
      🔍 GitHub API: IPv6 endpoints available

   2️⃣ Configuring dual-stack support...
      🔧 DNS policy: ClusterFirst with IPv6
      🛡️ Network policies: Updated for dual protocols  
      🏷️ Service configuration: Dual-stack enabled
      📡 Ingress: IPv4/IPv6 load balancing

   3️⃣ Testing connectivity...
      ✅ IPv4 GitHub API: Connected
      ✅ IPv6 GitHub API: Connected  
      🔄 Fallback mechanism: IPv4 verified
      📊 Latency: IPv6 -12ms vs IPv4

   ✅ Dual-stack networking active!
      🌐 Protocols: IPv4 + IPv6 with automatic fallback
      🚀 Performance: Optimized routing selection
      🛡️ Security: Enhanced network isolation
```

#### 3. Azure Key Vault Integration
```text
🧑 "Secure my secrets using Azure Key Vault instead of Kubernetes secrets"

🤖 Implementing Azure Key Vault CSI integration:

   1️⃣ Validating Azure setup...
      🔐 Key Vault: arc-secrets-prod detected
      👤 Workload Identity: Configured for AKS
      🎫 Service Principal: Permissions verified
      📦 CSI Driver: secrets-store-csi-driver v1.4.1

   2️⃣ Creating SecretProviderClass...
      🏷️ Name: arc-azure-keyvault
      🔑 Secrets: github-token, webhook-secret
      🛡️ Access: Workload Identity federation
      📍 Mount path: /mnt/secrets

   3️⃣ Updating runner deployment...
      📦 Volume: CSI secrets-store driver
      🔒 Security: No secrets in workflow context
      🔄 Rotation: Automatic on key vault update
      📊 Monitoring: Secret access auditing

   ✅ Azure Key Vault integration complete!
      🔐 Secrets: Managed externally in Azure
      🚫 Context isolation: Secrets hidden from workflows
      🔄 Auto-rotation: 90-day lifecycle
      📋 Audit trail: All access logged
```

### 💡 Traditional Deployment Patterns

#### 1. First-Time ARC Installation
```text
🧑 "I need to set up GitHub Actions runners in my new cluster"

🤖 I'll help you install ARC with best practices:

   1️⃣ Checking cluster compatibility...
      ✅ Kubernetes 1.28 detected
      ✅ Sufficient resources available
      ✅ RBAC permissions verified

   2️⃣ Installing ARC controller...
      📦 Adding Actions Runner Controller Helm repository
      ⚙️ Configuring with security defaults
      🚀 Deploying to namespace: arc-systems

   3️⃣ Setting up runner infrastructure...
      👥 Creating runner group: default-runners
      🔒 Configuring GitHub webhook authentication
      📊 Enabling monitoring and metrics

   ✅ Installation complete! 
      🌐 Controller endpoint: https://arc.your-cluster.com
      📈 Grafana dashboard: https://monitoring.your-cluster.com/arc
      📚 Next steps: Configure your first runner set
```

### 2. Scaling for High Load
```text
🧑 "Our deployment pipeline is slow, we need more runners during business hours"

🤖 I'll set up intelligent scaling for your deployment pipeline:

   📊 Current Analysis:
      • 3 active runners
      • 12 queued jobs
      • Average wait time: 8 minutes

   🎯 Optimization Plan:
      • Scale to 8 runners immediately
      • Configure auto-scaling: 3-15 runners
      • Business hours boost: 9AM-6PM EST
      • Weekend scale-down: 1-3 runners

   ⚙️ Implementing changes...
      ✅ HorizontalPodAutoscaler configured
      ✅ Schedule-based scaling rules applied
      ✅ Cost optimization policies enabled

   💰 Cost Impact:
      • Current: ~$180/month
      • Optimized: ~$245/month (+36%)
      • ROI: 2.5x faster deployments
```

### 3. Troubleshooting Runner Issues
```text
🧑 "My runners keep dying and I don't know why"

🤖 Let me analyze your runner health:

   🔍 Diagnostic Results:
      ❌ 3 runners crashed in last hour
      ❌ OOMKilled events detected
      ❌ CPU throttling at 95%

   🎯 Root Cause: Resource constraints
      • Memory limit: 2Gi (insufficient)
      • CPU limit: 1000m (too low for builds)
      • Recommended: 4Gi memory, 2000m CPU

   🛠️ Auto-fix Available:
      1. Update resource quotas
      2. Configure memory overcommit protection
      3. Add resource monitoring alerts

   Would you like me to apply these fixes? [y/N]
```

### 4. Security Compliance Check
```text
🧑 "Check if our ARC setup meets SOC2 requirements"

🤖 Running comprehensive policy validation and compliance audit...

   � Analyzing ARC Resources:
      ✅ Controller: Healthy and compliant
      📊 RunnerScaleSets: 3 found
      🔒 Security Policies: 23 rules evaluated

   📋 Compliance Report:
      ✅ Security Policies: 18/20 passed (90%)
      ⚠️ Compliance Policies: 8/10 passed (80%)
      ✅ Performance Policies: 5/5 passed (100%)
      
   🔴 Critical Issues Found:
      1. Privileged runner detected (arc-sec-002)
      2. Missing resource limits (arc-perf-001)
      
   🟠 High Priority Issues:
      1. GitHub token secret not configured (arc-sec-003)
      2. Runner not scoped to repository (arc-comp-001)

   💡 Auto-Fix Available:
      🔧 2 violations can be automatically fixed
      
   🛠️ Remediation Plan:
      1. Remove privileged flag from runner pods
      2. Add resource limits (CPU: 2000m, Memory: 4Gi)
      3. Configure GitHub token secret reference
      4. Scope runners to specific repositories

   📊 Overall Compliance Score: 78/100
      Target for SOC2: 95/100
      
   Would you like me to auto-fix the applicable violations? [y/N]
```

## ⚡ Quick Command Reference

Common commands you'll use frequently with this MCP server:

### Policy & Compliance
```text
# Basic validation
"Check ARC policies"
"Validate my runners against compliance rules"

# Generate compliance report
"Show me a compliance report for arc-runners namespace"
"Generate compliance report as JSON"

# Auto-fix violations (generates config files for review)
"Fix policy violations"
"Auto-fix compliance issues"

# Auto-fix and apply to cluster immediately
"Fix violations and apply to cluster"
"Auto-remediate and deploy fixes"
```

### Installation & Deployment
```text
# Install ARC controller
"Install ARC in my cluster"
"Deploy ARC controller with production settings"

# Deploy runners with config versioning
"Deploy runners for my-org repository"
"Create runner set for enterprise-repo with 5 minimum runners"

# Apply existing configurations
"Apply the my-runners config"
"Deploy config from configs/runner-sets/production.yaml"
```

### Monitoring & Status
```text
# Check overall health
"Show ARC status"
"What's the health of my runners?"

# Detect configuration drift
"Check for config drift"
"Compare deployed state with my config files"

# View logs and troubleshoot
"Show me runner logs"
"Why are my runners failing?"
```

### Scaling & Management
```text
# Scale runners
"Scale my-runners to 10"
"Increase runner capacity for evening builds"

# Manage lifecycle
"Update runner image to latest"
"Delete old runner sets"
```

### Configuration Management
```text
# List configurations
"Show all my configs"
"List runner configurations"

# Review generated configs before applying
"Generate runner config but don't apply"
"Create configuration for review only"
```

> **💡 Pro Tip**: All commands are natural language - no need to memorize exact syntax!

## 🔒 Security & Best Practices

### 🛡️ Security Framework

Our security model implements defense-in-depth principles:

```
┌─────────────────────────────────────────────────────────┐
│                 Security Layers                         │
├─────────────────────────────────────────────────────────┤
│ 🔐 Authentication    │ GitHub tokens, RBAC, mTLS       │
│ 🛡️ Authorization     │ Fine-grained permissions        │
│ 🔍 Audit Logging     │ All operations tracked          │
│ 📦 Container Security│ Image scanning, non-root users  │
│ 🌐 Network Policies  │ Zero-trust networking           │
│ 🔒 Secrets Management│ Encrypted storage, rotation     │
│ 📊 Monitoring        │ Real-time threat detection      │
└─────────────────────────────────────────────────────────┘
```

### 🚨 Security Policies

The server includes built-in security policies:

#### **Critical Security Rules**
- Container images must be from approved registries
- No privileged containers allowed
- Resource limits must be specified
- Network policies required for all namespaces

#### **Access Control Policies**
- GitHub tokens must have minimal required scopes
- Kubernetes RBAC follows least-privilege principle
- MCP client authentication required in production

#### **Operational Security**
- All operations are logged and auditable
- Sensitive data is masked in logs
- Failed operations trigger security alerts

### 🔐 Secure Configuration Example

```yaml
# Security-hardened ARC configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: arc-security-config
data:
  security_profile: "strict"
  audit_logging: "enabled"
  network_policies: "enforced"
  image_scanning: "required"
  resource_quotas: "mandatory"
  
  # Policy definitions
  allowed_registries: |
    - ghcr.io
    - gcr.io
    - docker.io/library
  
  mandatory_labels: |
    - app.kubernetes.io/name
    - app.kubernetes.io/version
    - security.policy/compliant
```

**⚠️ Security Notice**: This tool provides administrative access to Kubernetes clusters and GitHub repositories. Always follow your organization's security policies and use appropriate access controls.

---

## 🔍 Policy Validation & Auto-Fix

### 🛡️ Enterprise Policy Engine

The ARC MCP Server includes a comprehensive policy engine that validates your GitHub Actions Runner deployments against **18 built-in policies** covering security, compliance, performance, cost optimization, and operational best practices.

#### **Policy Categories**

| Category | Rules | Description |
|----------|-------|-------------|
| 🔒 **Security** | 6 rules | Prevent privileged runners, enforce security contexts, validate secrets |
| 📋 **Compliance** | 2 rules | Repository scoping, runner group requirements |
| 📊 **Performance** | 4 rules | Resource limits, container mode optimization |
| 💰 **Cost** | 2 rules | Reasonable CPU/replica limits, cost optimization |
| ⚙️ **Operations** | 3 rules | Proper labeling, valid runner images, observability |
| 🌐 **Networking** | 1 rule | Dual-stack networking support |

#### **Policy Configuration & Environments**

Generate environment-specific policy configurations with **24 pre-configured profiles**:

```text
🧑 "Generate a HIPAA policy config"
🤖 ✅ Generated HIPAA-compliant policy configuration
   🔒 Security rules: Critical severity (PHI protection)
   📋 Compliance rules: Critical severity (HIPAA/HITECH)
   📊 Performance rules: High severity (reliability)
   📁 Saved: configs/policies/arc-policy-config.json
   
🧑 "List all available security rules"
🤖 📋 Security Policy Rules (6 total)
   ✅ arc-sec-001: Require Runner Security Context (High)
   ✅ arc-sec-002: Prohibit Privileged Runners (Critical)
   ✅ arc-sec-003: Require GitHub Token Secret (Critical)
   ✅ arc-013-003: JIT Token Security (High)
   ✅ arc-013-005: Azure Key Vault Integration (Medium)
   ✅ arc-013-006: OpenShift Compatibility (Medium)
```

**Supported Environments:**
- Core: `development`, `staging`, `production`
- Compliance: `hipaa`, `fedramp`, `pci-dss`, `sox`, `gdpr`
- Industry: `financial`, `healthcare`, `government`, `education`
- Infrastructure: `edge`, `iot`, `embedded`, `multi-tenant`
- Organization: `startup`, `enterprise`
- Workload: `aiml`, `research`
- Security: `high-security`, `zero-trust`, `air-gapped`

> **📖 Complete Policy Guide**: See **[Policy Validation Usage Guide](docs/POLICY_VALIDATION_GUIDE.md)** for step-by-step instructions, real-world workflows, and troubleshooting
> 
> **🎯 Policy Rule Integration**: See **[Policy Rule Integration Guide](docs/POLICY_RULE_INTEGRATION.md)** for comprehensive documentation on how policy configs integrate with the 18 built-in rules
> 
> **📋 Policy Reference**: See [POLICY_VALIDATION.md](docs/POLICY_VALIDATION.md) for detailed rule descriptions and technical specifications

### 🚀 Auto-Fix Capabilities

The policy engine can **automatically remediate violations** by generating fixed configuration files that follow best practices.

#### **How Auto-Fix Works**

```text
🧑 "Check my runners for policy violations"

🤖 📊 Running policy validation...
   
   ✅ Compliance Score: 55.6%
   ❌ 8 violations found (6 can be auto-fixed)
   
   Critical Issues:
   🔴 None found
   
   High Priority:
   🟠 Missing security context
   🟠 Repository scope too broad
   
   💡 Auto-fix available for 6 violations

🧑 "Auto-fix the violations"

🤖 📝 Generating fixed configuration files...
   
   ✅ Fixed security context issues
   ✅ Added dual-stack networking support
   ✅ Configured OpenShift compatibility
   ✅ Added enhanced metrics labels
   
   📁 Generated Files:
   - configs/runner-sets/my-runners.yaml
   
   📋 Next Steps:
   1. Review: configs/runner-sets/my-runners.yaml
   2. Commit: git add configs/ && git commit -m "fix: policy violations"
   3. Apply: Say "apply the runner configuration"
   4. Validate: Say "check compliance again"
   
   💡 Config files saved for audit trail!
```

#### **Two Auto-Fix Modes**

##### **1. Generate Only (Default - Recommended)**
Perfect for GitOps workflows - **generates fixed config files in `configs/` folder only**.

```bash
# Ask AI:
"Auto-fix my policy violations"

# What happens:
✅ Fetches current runner configuration from cluster
✅ Applies policy fixes to the configuration
✅ Generates fixed YAML in configs/runner-sets/
✅ Adds audit annotations (timestamp, violations fixed)
⏸️ STOPS - does NOT apply to cluster
📋 Shows you the changes and next steps
```

**Benefits:**
- ✅ **Review before apply** - See exactly what will change
- ✅ **Git version control** - Config files ready to commit
- ✅ **Audit trail** - Track all policy fixes over time
- ✅ **Rollback capable** - Easy to revert changes
- ✅ **Team collaboration** - Create PRs for review

##### **2. Generate + Apply Mode**
For development environments - **generates configs in `configs/` folder AND applies fixes to cluster**.

```bash
# Ask AI:
"Auto-fix my violations and apply them"
# or
"Auto-fix with apply=true"

# What happens:
✅ Everything from mode 1 (generates configs in configs/), PLUS:
🚀 Applies fixes directly to cluster
📊 Shows apply results (success/failure per resource)
✅ Config files still saved in configs/ for audit trail
```

**When to use:**
- 🧪 Development/testing environments
- 🚀 Quick fixes needed urgently
- 👤 Single-person projects
- ⚡ Speed over review process

#### **Fixable Violations**

The auto-fix feature can remediate these policy violations automatically:

| Violation | Fix Applied | Impact |
|-----------|-------------|--------|
| Missing security context | Adds pod security context with non-root user | Security ↑ |
| Container mode not optimized | Sets `kubernetes-novolume` mode | Performance ↑, Storage costs ↓ |
| OpenShift incompatibility | Configures `runAsUser: 999` and SCC compatibility | OpenShift support ✓ |
| Missing enhanced metrics labels | Adds `workflow_name` and `target` labels | Observability ↑ |
| Dual-stack networking | Configures `dnsPolicy: ClusterFirst` | IPv4/IPv6 support ✓ |
| Missing lifecycle hooks | Adds container lifecycle hooks for novolume mode | Reliability ↑ |

#### **Manual Remediation Required**

Some violations require human decision-making and cannot be auto-fixed:

| Violation | Why Manual? | What to Do |
|-----------|-------------|------------|
| Missing GitHub token secret | Requires actual GitHub PAT/App credentials | Configure in cluster secrets |
| Privileged runner detected | Security decision needed | Remove privileged flag or justify |
| Repository scope too broad | Business logic decision | Scope to specific repos |
| Invalid runner image | Image selection requires approval | Use official images from ghcr.io |
| Missing required labels | Naming conventions vary by org | Add org-specific labels |
| Azure Key Vault not configured | Requires Azure setup | Configure AKV CSI driver |

### 📊 Compliance Reporting

Generate comprehensive compliance reports for your ARC deployments:

```text
🧑 "Generate a compliance report for all my runners"

🤖 📊 ARC Compliance Report
   
   Cluster: production-aks
   Namespace: arc-systems
   Compliance Score: 78.5%
   
   ✅ Passed: 14 rules
   ❌ Failed: 4 rules
   ⚠️ Warnings: 3 rules
   
   By Severity:
   🔴 Critical: 0
   🟠 High: 2
   🟡 Medium: 3
   🟢 Low: 2
   
   By Category:
   🔒 Security: 3 violations
   📋 Compliance: 1 violation
   ⚙️ Operations: 3 violations
   
   Top Issues:
   1. [HIGH] Security context not configured (3 runners)
   2. [HIGH] Runners scoped to entire org (security risk)
   3. [MED] Container mode not optimized (performance impact)
   
   💡 6 violations can be auto-fixed
   💰 Estimated cost savings from fixes: $45/month
```

### 🎯 Policy Validation Commands

Common AI commands for policy management:

```text
# Validation
"Check my runners for policy violations"
"Validate ARC compliance"
"Run a security audit on my runners"

# Auto-Fix
"Auto-fix the policy violations"
"Fix the violations and save configs"
"Auto-fix and apply immediately" (with apply=true)

# Reporting
"Generate a compliance report"
"Show me all critical violations"
"List security policy violations"

# Specific Checks
"Check if my runners meet SOC2 requirements"
"Validate runners against security policies"
"Show me cost optimization opportunities"
```

### 🔐 Policy Customization

While the server comes with 20+ built-in policies, you can customize enforcement levels:

```bash
# Configure policy behavior via environment variables
export ARC_POLICY_ENFORCEMENT="strict"     # strict, advisory, or disabled
export ARC_POLICY_AUTO_FIX_ENABLED="true"  # Enable/disable auto-fix
export ARC_POLICY_CATEGORIES="security,compliance"  # Focus on specific categories
```

> **📖 Advanced Policy Configuration**: See [EXTERNAL_POLICY_CONFIG.md](docs/EXTERNAL_POLICY_CONFIG.md) for custom policy definitions

### 📖 Learn More

**New to policy validation?** Check out the **[Complete Policy Validation Usage Guide](docs/POLICY_VALIDATION_GUIDE.md)** for:
- 📚 Step-by-step tutorials for each operation
- 🎬 Real-world workflow examples
- 🔧 Troubleshooting common issues
- 🚀 Advanced usage patterns
- ✅ Best practices and tips

**Quick Links:**
- [Understanding Policy Categories](docs/POLICY_VALIDATION_GUIDE.md#-understanding-policy-categories)
- [Auto-Fix Features](docs/POLICY_VALIDATION_GUIDE.md#-auto-fix-features)
- [Real-World Workflows](docs/POLICY_VALIDATION_GUIDE.md#-real-world-workflows)
- [Compliance Scoring Explained](docs/POLICY_VALIDATION_GUIDE.md#-understanding-compliance-scoring)

---

## 📊 Monitoring & Observability
````

## 📊 Monitoring & Observability

### 📈 Built-in Metrics

The server exposes comprehensive metrics for monitoring:

```javascript
// Prometheus metrics available at /metrics
arc_operations_total{operation="install",status="success"} 42
arc_operations_duration_seconds{operation="scale"} 1.23
arc_runners_active{namespace="production"} 8
arc_policy_violations_total{severity="critical"} 0
arc_github_api_requests_total{endpoint="runners"} 1337
```

### 🔍 Health Checks

Multiple health check endpoints:
- `/health` - Basic server health
- `/health/kubernetes` - Cluster connectivity
- `/health/github` - GitHub API status
- `/health/runners` - Runner status summary

### 📊 Grafana Dashboard

Pre-built dashboard for comprehensive monitoring:
```json
{
  "dashboard": {
    "title": "ARC MCP Server Monitoring",
    "panels": [
      {
        "title": "Runner Utilization",
        "type": "stat",
        "targets": ["arc_runners_active / arc_runners_total"]
      },
      {
        "title": "Operation Success Rate",
        "type": "gauge", 
        "targets": ["rate(arc_operations_total{status='success'}[5m])"]
      }
    ]
  }
}
```

## 🚀 Advanced Features

### 🎯 Cost Optimization Engine

Intelligent cost management for runner infrastructure:

```text
💰 Cost Analysis Report
┌─────────────────────────────────────────┐
│ Monthly Runner Costs: $1,247            │
│ Optimization Potential: -$312 (25%)     │
│                                         │
│ 📊 Recommendations:                     │
│ • Scale down during weekends (-$89)     │
│ • Use spot instances (-$156)            │
│ • Optimize resource allocations (-$67)  │
│                                         │
│ 🎯 Auto-optimization Available          │
└─────────────────────────────────────────┘
```

### 🤖 Predictive Scaling

AI-powered scaling based on workload patterns:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: predictive-scaling-config
data:
  enabled: "true"
  prediction_window: "2h"
  confidence_threshold: "0.8"
  scale_up_factor: "1.5"
  scale_down_factor: "0.7"
  
  # ML model configuration
  model_type: "time_series_forecast"
  training_data_days: "30"
  retrain_interval: "24h"
```

### 🛠️ Self-Healing Capabilities

Automated problem detection and resolution:

```text
🔧 Self-Healing Engine Status
├── 🔍 Issue Detection: Active
│   ├── Resource exhaustion monitoring
│   ├── Network connectivity checks  
│   ├── GitHub API rate limit tracking
│   └── Runner health verification
│
├── 🛠️ Auto-Remediation: Enabled
│   ├── Restart unhealthy runners
│   ├── Scale up on resource pressure
│   ├── Rotate expired credentials
│   └── Clean up orphaned resources
│
└── 📊 Success Rate: 94.2%
    ├── Issues detected: 127
    ├── Auto-resolved: 119
    └── Manual intervention: 8
```

## 🧪 Testing & Validation

### 🔬 Comprehensive Test Suite

Run the full test suite to ensure reliability:

```bash
# Unit tests
npm run test:unit

# Integration tests (requires cluster)
npm run test:integration

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance

# Security tests
npm run test:security
```

### 🎯 Test Coverage

Current test coverage metrics:
- **Unit Tests**: 94% line coverage
- **Integration Tests**: 87% API coverage  
- **E2E Tests**: 78% workflow coverage
- **Security Tests**: 100% vulnerability checks

### 🏗️ Local Testing Environment

Set up a complete local testing environment:

```bash
# Start local Kubernetes cluster
npm run dev:cluster:start

# Deploy test ARC environment
npm run dev:arc:setup

# Run MCP server in development mode
npm run dev:server

# Execute test scenarios
npm run dev:test:scenarios
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

Example workflow for automated ARC management:

```yaml
name: ARC Management
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  arc-health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check ARC Status
        uses: ./
        with:
          mcp-server: 'ghcr.io/tsviz/arc-config-mcp:latest'
          operation: 'health-check'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Scale for Peak Hours
        if: github.event.schedule == '0 9 * * 1-5'  # Weekday mornings
        uses: ./
        with:
          operation: 'scale-runners'
          target-replicas: 10
          
      - name: Cost Optimization
        if: github.event.schedule == '0 18 * * 5'  # Friday evenings
        uses: ./
        with:
          operation: 'optimize-costs'
          apply-recommendations: true
```

## 📚 API Reference

### MCP Protocol Integration

The server implements the full MCP specification:

```typescript
// Tool invocation example
interface MCPToolCall {
  method: "tools/call";
  params: {
    name: "arc_install_controller";
    arguments: {
      namespace: "arc-systems";
      security_profile: "standard";
      auto_scaling: true;
    };
  };
}

// Response format
interface MCPToolResponse {
  content: [
    {
      type: "text";
      text: "✅ ARC controller installed successfully";
    }
  ];
  isError: false;
}
```

### REST API Endpoints

When running in HTTP mode, these endpoints are available:

```
GET  /health                 - Server health check
GET  /metrics               - Prometheus metrics
POST /api/v1/arc/install    - Install ARC controller
GET  /api/v1/arc/status     - Get ARC status
POST /api/v1/arc/scale      - Scale runners
GET  /api/v1/tools          - List available tools
POST /api/v1/execute        - Execute natural language command
```

## 📚 Documentation

### Core Guides

| Guide | Description | When to Use |
|-------|-------------|-------------|
| **[Policy Validation Usage Guide](docs/POLICY_VALIDATION_GUIDE.md)** | Complete guide to using the policy validation tool with real-world workflows | Essential for security/compliance teams |
| **[Policy Reference](docs/POLICY_VALIDATION.md)** | Technical reference for all 20+ built-in policies | When you need detailed policy specifications |
| **[Workflow Guide](docs/WORKFLOW_GUIDE.md)** | Understanding deployment workflows (Recommended, Direct, GitOps) | Setting up your deployment process |
| **[Hybrid Workflow Visual Guide](docs/HYBRID_WORKFLOW_VISUAL_GUIDE.md)** | Visual diagrams of the GitOps workflow | Visual learners or architecture planning |
| **[Advanced Security](docs/ADVANCED_SECURITY_POLICIES.md)** | Deep dive into security configurations | Hardening production deployments |
| **[Cleanup Functionality](docs/CLEANUP_FUNCTIONALITY.md)** | Safe ARC uninstallation and cleanup | Decommissioning or troubleshooting |
| **[Enhanced Troubleshooting](docs/ENHANCED_TROUBLESHOOTING.md)** | Debugging guide and common issues | When things go wrong |

### Quick References

- **[TOOLS.md](TOOLS.md)** - Complete tool catalog with all available operations
- **[QUICK_START.md](QUICK_START.md)** - Get up and running in 5 minutes
- **[ROADMAP.md](ROADMAP.md)** - Future features and development plans
- **[Release Notes](RELEASE-NOTES-v2.4.4.md)** - Latest updates and changes

### External Resources

- [GitHub ARC Official Documentation](https://docs.github.com/en/actions/tutorials/use-actions-runner-controller)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)

## 🤝 Contributing

We welcome contributions to improve ARC Config MCP Server!

### 🚀 Getting Started

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Set up development environment**:
   ```bash
   npm install
   npm run dev:setup
   ```
4. **Make your changes**
5. **Run tests**: `npm test`
6. **Submit a pull request**

### 📋 Development Guidelines

- Follow TypeScript best practices
- Maintain 90%+ test coverage
- Update documentation for new features
- Follow conventional commit messages
- Ensure all security checks pass

### 🔍 Code Review Process

All contributions go through our review process:
1. **Automated Checks**: CI/CD pipeline validation
2. **Security Review**: Vulnerability scanning
3. **Performance Review**: Load testing for critical paths
4. **Documentation Review**: Ensure docs are updated
5. **Maintainer Review**: Final approval by core team

## 🆘 Troubleshooting

### Common Issues

#### Installation Problems
```text
❌ Error: KUBECONFIG not found
🔧 Solution: Set KUBECONFIG environment variable
   export KUBECONFIG=/path/to/kubeconfig

❌ Error: GitHub token invalid
🔧 Solution: Check token scopes and expiration
   - Required scopes: repo, admin:org, workflow
   - Generate new token: https://github.com/settings/tokens
```

#### Runtime Issues
```text
❌ Error: Runners not starting
🔧 Diagnosis: Check resource constraints
   kubectl describe pod -n arc-runners
   
❌ Error: High API rate limits
🔧 Solution: Configure rate limiting
   Set GITHUB_API_RATE_LIMIT=5000 in environment
```

#### Configuration Drift Issues
```text
❌ Issue: Config file shows minRunners: 20 but only 1 runner is running
🔧 Diagnosis: Manual Helm commands can override YAML configs
   # Check actual deployed values
   kubectl get autoscalingrunnersets -n arc-systems <name> -o yaml
   
🔧 Solution: Re-apply using MCP tools to sync with config files
   #arc_apply_config --configType runnerSet --name <runner-set-name>
   
   # Or use drift detection to find all mismatches
   #arc_detect_drift
   
💡 Best Practice: Always use MCP tools (#arc_apply_config) instead of 
   manual Helm commands. MCP tools read your YAML files and apply all 
   values correctly. Manual Helm --set commands bypass the config files.
```

#### Policy Validation Issues
```text
❌ Issue: False positive violations reported
🔧 Diagnosis: Check actual deployed resource structure
   kubectl get autoscalingrunnersets -n arc-runners <name> -o yaml | grep -A5 <field>
   
🔧 Solution: Policy engine validates against deployed resources, not config templates
   - Ensure field paths match actual Kubernetes resource structure
   - Array indices like containers[0] are supported
   
❌ Issue: Auto-fix not applying to cluster
🔧 Solution: Use apply=true parameter to apply fixes
   #arc_validate_policies operation=auto_fix apply=true
   
   Default behavior (apply=false): Generates config files only for review
   With apply=true: Generates config files AND applies to cluster

❌ Issue: Compliance score lower than expected
🔧 Diagnosis: Check for manual remediation required
   #arc_validate_policies operation=validate
   
   - Auto-fixable: Resources, labels, annotations, security contexts
   - Manual required: GitHub secrets, container images, privileged mode
   
💡 Best Practice: Always review generated config files in configs/runner-sets/
   before applying to production clusters. Config files are created for
   audit trail regardless of apply parameter.
```

#### Performance Issues
```text
❌ Issue: Slow response times
🔧 Optimization: Enable caching
   Set ENABLE_CACHE=true
   Set CACHE_TTL=300
   
❌ Issue: High memory usage
🔧 Solution: Tune garbage collection
   NODE_OPTIONS="--max-old-space-size=512"
```

### 🔍 Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Environment variable
export LOG_LEVEL=debug

# Runtime flag  
npm start -- --log-level debug

# Specific component debugging
export DEBUG=arc:*,mcp:*,k8s:*
```

### 📞 Getting Help

- **Documentation**: [docs/](./docs/)
  - **[Workflow Guide](docs/WORKFLOW_GUIDE.md)** - Complete guide to DevOps, GitOps, and Direct workflows with GitHub Copilot Chat
  - **[Hybrid Workflow Visual Guide](docs/HYBRID_WORKFLOW_VISUAL_GUIDE.md)** - Visual diagrams and step-by-step workflow illustrations
  - [Hybrid Workflow Clarity](docs/HYBRID_WORKFLOW_CLARITY.md) - Detailed explanation of config files and how they're used
  - [Cleanup Functionality](docs/CLEANUP_FUNCTIONALITY.md) - Safe ARC cleanup procedures
  - [Enhanced Troubleshooting](docs/ENHANCED_TROUBLESHOOTING.md) - Advanced debugging guide
  - [Policy as Code](docs/POLICY_AS_CODE.md) - Policy configuration and enforcement
- **Examples**: [examples/](./examples/)
  - [Controller with Custom Values](examples/controller-with-values.yaml.md) - How to customize ARC controller configuration
- **Official GitHub ARC Docs**:
  - [ARC Tutorial](https://docs.github.com/en/actions/tutorials/use-actions-runner-controller) - Getting started guide
  - [ARC Concepts](https://docs.github.com/en/actions/concepts/runners/actions-runner-controller) - Core concepts
  - [Runner Scale Sets](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/runners/runner-scale-sets) - Autoscaling
  - [ARC Support](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/runners/support-for-arc) - Enterprise support
- **GitHub Issues**: [Create an issue](https://github.com/tsviz/arc-config-mcp/issues/new)
- **Discussions**: [GitHub Discussions](https://github.com/tsviz/arc-config-mcp/discussions)
- **Security Issues**: security@tsviz.com

## 🎓 Learning Resources

### 📖 Official GitHub Documentation

**Essential ARC Resources:**
- **[ARC Tutorial](https://docs.github.com/en/actions/tutorials/use-actions-runner-controller)** - Step-by-step guide to getting started with ARC
- **[ARC Concepts](https://docs.github.com/en/actions/concepts/runners/actions-runner-controller)** - Understanding how ARC works
- **[Runner Scale Sets](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/runners/runner-scale-sets)** - Learn about autoscaling runners
- **[ARC Support & SLA](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/runners/support-for-arc)** - Formal support information for enterprise

### 📖 Additional Reading
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Actions Runner Controller Repository](https://github.com/actions/actions-runner-controller)
- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)

### 🎥 Video Tutorials
- [ARC MCP Server Quick Start](https://youtube.com/example) (5 min)
- [Advanced Configuration Guide](https://youtube.com/example) (15 min)
- [Troubleshooting Common Issues](https://youtube.com/example) (10 min)

### 💡 Best Practices Guide
- [Enterprise Deployment Patterns](./docs/ENTERPRISE_DEPLOYMENT.md)
- [Security Hardening Checklist](./docs/SECURITY_CHECKLIST.md)
- [Performance Optimization Guide](./docs/PERFORMANCE_TUNING.md)

## 🚗 Roadmap

### 🎯 Upcoming Features

#### Version 1.6.0 (Next Release)
- [ ] **Multi-cluster Support**: Manage ARC across multiple Kubernetes clusters
- [ ] **Advanced Cost Analytics**: ML-powered cost prediction and optimization
- [ ] **Webhook Integration**: Real-time event processing from GitHub
- [ ] **Custom Policy DSL**: Domain-specific language for policy configuration

#### Version 1.7.0 (Q2 2024)
- [ ] **GitOps Integration**: ArgoCD and Flux compatibility
- [ ] **Advanced Scheduling**: Complex workload-aware runner scheduling
- [ ] **Integration Hub**: Pre-built integrations with popular DevOps tools
- [ ] **Mobile Dashboard**: React Native app for on-the-go monitoring

#### Version 2.0.0 (Q3 2024)
- [ ] **Multi-Cloud Support**: AWS, GCP, Azure runner orchestration
- [ ] **AI-Powered Optimization**: GPT-4 powered operational intelligence
- [ ] **Enterprise SSO**: SAML, OIDC, and LDAP integration
- [ ] **Compliance Framework**: SOC2, ISO27001, PCI-DSS automation

### 🗺️ Long-term Vision

Transform ARC management from manual operations to fully autonomous, AI-driven infrastructure that:
- Predicts and prevents issues before they occur
- Optimizes costs automatically across cloud providers
- Ensures compliance with evolving security standards
- Scales intelligently based on development team patterns

## 📄 License & Legal

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Dependencies
- **Node.js Ecosystem**: Various MIT and Apache 2.0 licensed packages
- **Kubernetes Client**: Apache 2.0 License
- **GitHub API**: Used under GitHub Terms of Service

### Security Disclosure
For security vulnerabilities, please email security@tsviz.com instead of using public issues.

### Contributing License Agreement
By contributing to this project, you agree that your contributions will be licensed under the same MIT License.

## 🔗 Related Projects & Ecosystem

### Official Projects
- **[ARC Config Repo](https://github.com/tsviz/arc-config-repo)**: Original ARC configuration and policies
- **[K8s MCP Server](https://github.com/tsviz/k8s_mcp)**: General Kubernetes management MCP server

### Community Projects
- **[Actions Runner Controller](https://github.com/actions/actions-runner-controller)**: The core ARC project
- **[GitHub Official ARC Docs](https://docs.github.com/en/actions/concepts/runners/actions-runner-controller)**: Complete documentation
  - [Tutorial: Use ARC](https://docs.github.com/en/actions/tutorials/use-actions-runner-controller)
  - [Runner Scale Sets](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/runners/runner-scale-sets)
  - [ARC Support](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/runners/support-for-arc)
- **[Model Context Protocol](https://modelcontextprotocol.io/)**: Protocol specification and tools
- **[GitHub Copilot](https://github.com/features/copilot)**: AI pair programmer integration

### Complementary Tools
- **Monitoring**: Prometheus, Grafana, DataDog integration examples
- **Security**: Falco, OPA Gatekeeper policy examples  
- **GitOps**: ArgoCD, Flux configuration templates
- **Cost Management**: Kubecost, OpenCost integration guides

---

<div align="center">

**🚀 Ready to transform your ARC operations?**

[Get Started](./docs/QUICKSTART.md) • [View Examples](./examples/) • [Join Community](https://github.com/tsviz/arc-config-mcp/discussions)

*Transforming GitHub Actions runner management from manual kubectl commands to conversational AI-powered automation* ✨

</div>