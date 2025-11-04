# ARC MCP Server - Workflow Guide

> **💡 Using with GitHub Copilot Chat**  
> This guide is designed for use with **GitHub Copilot Chat** in VS Code. All commands use the `#toolname` syntax to invoke MCP tools directly in your chat conversations. Open Copilot Chat with `Cmd+Shift+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux).

---

## 🎯 Overview

The ARC MCP Server supports **three deployment modes** to fit different team workflows:

| Mode | Description | Use Case | Version Control |
|------|-------------|----------|-----------------|
| **🔄 Hybrid** | Generate configs → Auto-apply → Commit | Fast iteration with audit trail | ✅ Automatic |
| **📋 GitOps** | Generate configs → Review → Manual apply | Team review & approval process | ✅ Manual |
| **⚡ Direct** | Immediate apply without files | Quick fixes & testing | ❌ None |

---

## 🏢 Workflow 1: DevOps/GitOps (Recommended for Teams)

**Best for**: Production environments, team collaboration, compliance requirements

### Prerequisites

```bash
# Ensure you have:
✅ Kubernetes cluster with kubectl configured
✅ GitHub PAT with repo and admin:org permissions (GITHUB_TOKEN env var)
✅ Git repository initialized
✅ GitHub Copilot Chat active in VS Code (Cmd+Shift+I / Ctrl+Shift+I)
```

### Step-by-Step: Hybrid Mode (Default)

> **📝 Note:** All steps below use GitHub Copilot Chat. Copy the commands and paste them into your Copilot Chat panel.

#### **1️⃣ Install ARC Controller**

In GitHub Copilot Chat, prompt:
```
Use #arc_install_controller with namespace arc-systems
```

**What happens:**
- ✅ Installs ARC via Helm
- 📝 Generates `configs/controller.yaml` with settings
- 🔍 Shows you the config before applying
- ✅ Auto-commits to Git with message: "chore: install ARC controller in arc-systems namespace"

**Expected output:**
```
✅ ARC Controller installed successfully
📊 Status: Running (1/1 pods ready)
📝 Config saved to: configs/controller.yaml
🔍 Git status: Committed
```

#### **2️⃣ Deploy GitHub Actions Runners**

In GitHub Copilot Chat, prompt:
```
Use #arc_deploy_runners_hybrid with organization=tsvi-solutions, minRunners=5, maxRunners=20, mode=hybrid
```

**What happens:**
- 📝 Generates `configs/runner-sets/tsvi-solutions-runners.yaml`
- 🔍 Shows you the YAML configuration
- ✅ Applies to cluster immediately
- 📊 Shows deployment status
- 🔄 Auto-commits with message: "feat: deploy runners for tsvi-solutions (5-20 replicas)"

**Expected output:**
```yaml
# Generated config preview:
apiVersion: actions.github.com/v1alpha1
kind: AutoscalingRunnerSet
metadata:
  name: tsvi-solutions-runners
  namespace: arc-systems
spec:
  githubConfigUrl: "https://github.com/tsvi-solutions"
  minRunners: 5
  maxRunners: 20
  runnerScaleSetName: "tsvi-solutions-runners"
  ...

✅ Runners deployed successfully
📊 Status: 5/5 runners ready
📝 Config saved to: configs/runner-sets/tsvi-solutions-runners.yaml
🔍 Git status: Changes committed
```

#### **3️⃣ Review Your Infrastructure**

In GitHub Copilot Chat, prompt:
```
#arc_list_configs
```

**Expected output:**
```
📋 ARC Configuration Summary

Controller:
  ✅ configs/controller.yaml
  📅 Last modified: 2025-10-30 10:30:00
  
Runner Sets:
  ✅ tsvi-solutions-runners
     📄 configs/runner-sets/tsvi-solutions-runners.yaml
     🏃 Scaling: 5-20 replicas
     🏢 Organization: tsvi-solutions
     📅 Last modified: 2025-10-30 10:32:00
```

#### **4️⃣ Check Cluster Status**

In GitHub Copilot Chat, prompt:
```
#arc_get_status
```

**Expected output:**
```
🎯 ARC Installation Status

Controller:
  ✅ Healthy (Running)
  📦 Version: 0.13.0
  🏢 Namespace: arc-systems
  
Runner Sets:
  ✅ tsvi-solutions-runners
     🏃 Active: 5/5 runners
     📊 Scale: 5 (min) → 20 (max)
     ✅ All runners connected to GitHub
```

#### **5️⃣ Detect Configuration Drift**

In GitHub Copilot Chat, prompt:
```
#arc_detect_drift
```

**What it checks:**
- Compares `configs/*.yaml` files vs. actual cluster state
- Detects manual changes made directly to cluster
- Warns if repo is out of sync

**Expected output (no drift):**
```
✅ No configuration drift detected

All configurations in repository match deployed resources:
  ✅ Controller: In sync
  ✅ tsvi-solutions-runners: In sync
```

**Expected output (drift detected):**
```
⚠️ Configuration drift detected!

Differences found:
  ⚠️ tsvi-solutions-runners:
     Repository: minRunners=5
     Cluster:    minRunners=3
     
💡 To fix: Update configs/runner-sets/tsvi-solutions-runners.yaml and run:
   Use #arc_apply_config with configType=runnerSet, name=tsvi-solutions-runners
```

#### **6️⃣ Scale Runners (Creates Config Change)**

In GitHub Copilot Chat, prompt:
```
Use #arc_scale_runners with runnerName=tsvi-solutions-runners, minReplicas=10, maxReplicas=50
```

**What happens:**
- 📝 Updates `configs/runner-sets/tsvi-solutions-runners.yaml`
- ✅ Applies changes to cluster
- 📊 Shows scaling in progress
- 🔄 Commits with message: "chore: scale tsvi-solutions-runners (10-50 replicas)"

---

### Step-by-Step: GitOps Mode (Manual Review)

**Best for**: Teams requiring pull request reviews before deployment

> **📝 Note:** Commands below use GitHub Copilot Chat for generation, then switch to terminal for Git operations, then back to Copilot Chat for applying configurations.

#### **1️⃣ Generate Runner Configuration**

In GitHub Copilot Chat, prompt:
```
Use #arc_deploy_runners_hybrid with organization=tsvi-solutions, minRunners=5, maxRunners=20, mode=gitops, apply=false
```

**What happens:**
- 📝 Generates `configs/runner-sets/tsvi-solutions-runners.yaml`
- 🔍 Shows you the YAML
- ⏸️ **STOPS** - Does NOT apply to cluster
- 📋 Waits for your review

**Expected output:**
```yaml
# Generated config:
configs/runner-sets/tsvi-solutions-runners.yaml

✅ Configuration generated successfully
⏸️ Apply manually when ready

📋 Next steps:
  1. Review the config file
  2. Commit to Git: git add configs/ && git commit -m "Add runners"
  3. Push for PR review: git push origin feature/add-runners
  4. After approval, apply: Use #arc_apply_config with configType=runnerSet, name=tsvi-solutions-runners
```

#### **2️⃣ Review & Commit**

**Switch to VS Code terminal** (`Ctrl+`` or View → Terminal):
```bash
git status
git diff configs/runner-sets/tsvi-solutions-runners.yaml
git add configs/
git commit -m "feat: add runners for tsvi-solutions"
git push origin feature/arc-runners
```

#### **3️⃣ Create Pull Request**

```
# In GitHub UI:
- Create PR from feature/arc-runners → main
- Request team review
- Discuss configuration parameters
- Get approval
```

#### **4️⃣ Apply After Approval**

**Return to GitHub Copilot Chat** (`Cmd+Shift+I` / `Ctrl+Shift+I`), then prompt:
```
Use #arc_apply_config with configType=runnerSet, name=tsvi-solutions-runners
```

**What happens:**
- ✅ Reads `configs/runner-sets/tsvi-solutions-runners.yaml`
- ✅ Applies to cluster
- 📊 Validates deployment succeeded

---

## ⚡ Workflow 2: Direct Application (No DevOps)

**Best for**: Quick testing, personal projects, temporary deployments

### When to Use Direct Mode

- 🧪 Testing new configurations
- 🔧 Troubleshooting production issues quickly
- 👤 Personal development clusters
- 🚀 Proof-of-concept deployments

### Step-by-Step: Direct Mode

> **📝 Note:** Direct mode uses GitHub Copilot Chat exclusively - no Git operations needed.

#### **1️⃣ Install Controller (Direct)**

In GitHub Copilot Chat, prompt:
```
Use #arc_install_controller with namespace arc-systems
```

**What happens:**
- ✅ Installs ARC via Helm immediately
- ❌ No config files generated
- ❌ No Git commits
- ✅ Fast and simple

#### **2️⃣ Deploy Runners (Direct - Legacy Tool)**

In GitHub Copilot Chat, prompt:
```
Use #deploy_github_runners with organization=tsvi-solutions, minReplicas=5, maxReplicas=20
```

**What happens:**
- ✅ Deploys runners immediately to cluster
- ❌ No YAML files created
- ❌ No version control
- ⚡ Fastest option

**Expected output:**
```
✅ Runners deployed successfully
📊 Status: 5/5 runners active
🏃 Runner set: tsvi-solutions-runners
```

#### **3️⃣ Scale Runners (Direct)**

In GitHub Copilot Chat, prompt:
```
Use #arc_scale_runners with runnerName=tsvi-solutions-runners, minReplicas=10, maxReplicas=50
```

**What happens:**
- ✅ Scales immediately
- ❌ No config file updates
- ⚠️ Changes not tracked in Git

---

## 📊 Mode Comparison Table

| Feature | Hybrid | GitOps | Direct |
|---------|--------|--------|--------|
| **Speed** | ⚡⚡ Fast | ⏱️ Slower (manual steps) | ⚡⚡⚡ Fastest |
| **Config Files** | ✅ Auto-generated | ✅ Generated | ❌ None |
| **Git Commits** | ✅ Automatic | ✅ Manual | ❌ None |
| **Code Review** | ⚠️ Post-deployment | ✅ Pre-deployment | ❌ None |
| **Audit Trail** | ✅ Full history | ✅ Full history | ❌ None |
| **Drift Detection** | ✅ Yes | ✅ Yes | ❌ No baseline |
| **Rollback** | ✅ Easy (Git revert) | ✅ Easy (Git revert) | ⚠️ Manual recreation |
| **Team Collaboration** | ✅ Good | ✅ Excellent | ❌ Poor |
| **Compliance** | ✅ Yes | ✅ Yes | ❌ No |

---

## 🎯 Recommended Workflows by Environment

### Production
```
Mode: GitOps
Workflow: Generate → PR Review → Approve → Apply
Why: Requires team approval, full audit trail
```

### Staging
```
Mode: Hybrid
Workflow: Generate → Auto-apply → Auto-commit
Why: Fast iteration with version control
```

### Development/Testing
```
Mode: Direct
Workflow: Apply immediately
Why: Speed matters more than tracking
```

---

## 🔄 Migration Path

### From Direct → Hybrid

If you have existing runners deployed directly, you can capture them:

```bash
# 1. Export existing runner configuration
kubectl get autoscalingrunnersets -n arc-systems tsvi-solutions-runners -o yaml > configs/runner-sets/tsvi-solutions-runners.yaml

# 2. Clean up kubectl metadata
# Edit the file to remove: resourceVersion, uid, creationTimestamp, etc.

# 3. Commit to Git
git add configs/
git commit -m "chore: capture existing runner configuration"

# 4. Future changes use hybrid mode (in Copilot Chat)
Use #arc_deploy_runners_hybrid with mode=hybrid
```

---

## � Workflow 4: Policy Validation & Compliance

**Best for**: Ensuring security, compliance, and operational best practices across all ARC deployments

### Why Policy Validation Matters

- ✅ **Security**: Prevent vulnerable configurations
- ✅ **Compliance**: Meet regulatory requirements
- ✅ **Cost Optimization**: Reduce unnecessary spending
- ✅ **Performance**: Avoid resource bottlenecks
- ✅ **Operational Excellence**: Follow best practices

### Step-by-Step: Policy Validation Workflow

> **📝 Note:** All steps use GitHub Copilot Chat (`Cmd+Shift+I` / `Ctrl+Shift+I`)

#### **1️⃣ Create Custom Policy Configuration (Optional)**

If you need custom policies for your environment:

In GitHub Copilot Chat:
```
Generate a policy config for production environment with strict security policies
```

**Or use the tool directly:**
```
Use #arc_generate_policy_config with organization=tsvi-solutions, environment=production, requirements="Strict security, SOC2 compliance, cost optimization"
```

**What happens:**
- ✅ Generates `configs/policies/arc-policy-config.json`
- ✅ Tailored to your requirements
- ✅ Auto-discovered on next validation
- ✅ Ready for Git commit

**Example output:**
```json
{
  "version": "1.0",
  "organization": {
    "name": "tsvi-solutions",
    "environment": "production"
  },
  "global": {
    "enforcement": "strict",
    "autoFix": false
  },
  "ruleOverrides": {
    "arc-sec-001": {
      "enabled": true,
      "severity": "critical"
    },
    "arc-cost-001": {
      "enabled": true,
      "severity": "high"
    }
  }
}
```

#### **2️⃣ Run Policy Validation**

In GitHub Copilot Chat:
```
Check my ARC policies
```

**Or explicitly:**
```
Use #arc_validate_policies
```

**What happens:**
- 🔍 Auto-discovers `configs/policies/arc-policy-config.json` (if exists)
- 📊 Validates all runners against 18+ policies
- 📋 Shows compliance score and violations
- 🔧 Identifies auto-fixable issues

**Example output:**
```
🔒 ARC Policy Validation

🔍 Auto-Discovery:
   ✅ Found: configs/policies/arc-policy-config.json
   📋 Applying custom overrides

📊 Compliance Score: ⚠️ 72.2%

| Metric         | Count |
|----------------|-------|
| Total Rules    | 18    |
| ✅ Passed      | 13    |
| ❌ Failed      | 5     |
| 🔧 Auto-fix    | 3     |

🔴 Critical Issues: 0
🟠 High Priority: 0
⚠️ Warnings: 5
```

#### **3️⃣ Auto-Fix Policy Violations (GitOps-Friendly)**

In GitHub Copilot Chat:
```
Fix my policy violations
```

**Or use tool directly:**
```
Use #arc_validate_policies with operation=auto_fix
```

**What happens (Default Behavior - Recommended ✅):**
- ✅ Generates fixed configurations
- ✅ Saves to `configs/runner-sets/[name].yaml`
- ✅ Shows what will be fixed
- ❌ Does NOT apply to cluster yet
- 📋 Waits for your review

**Example output:**
```
🔧 Auto-Fix Summary

✅ Fixed 3 violations:
   • Added resource limits (CPU: 2, Memory: 4Gi)
   • Added security context (non-root)
   • Configured DNS policy (ClusterFirst)

📁 Generated Files:
   • configs/runner-sets/tsvi-solutions-runners.yaml

📊 What Changed:
   
spec.template.spec.containers[0].resources:
+  limits:
+    cpu: "2"
+    memory: "4Gi"

spec.template.spec.securityContext:
+  runAsNonRoot: true
+  runAsUser: 1000

💡 Next Steps:
   1. Review: configs/runner-sets/tsvi-solutions-runners.yaml
   2. Test in dev first (optional)
   3. Commit: git add configs/ && git commit
   4. Apply: "Apply the runner configuration"
```

#### **4️⃣ Review Changes**

**In VS Code terminal:**
```bash
# See what changed
git diff configs/runner-sets/

# Review specific file
cat configs/runner-sets/tsvi-solutions-runners.yaml
```

#### **5️⃣ Commit to Git (Version Control)**

**In VS Code terminal:**
```bash
git add configs/
git commit -m "fix: auto-remediate policy violations - compliance 72.2% → 88.9%"
git push origin main

# Or create PR for team review:
git checkout -b fix/policy-compliance
git push origin fix/policy-compliance
# Create PR in GitHub UI
```

#### **6️⃣ Apply After Review**

**Return to GitHub Copilot Chat:**
```
Apply the runner configuration
```

**Or explicitly:**
```
Use #arc_apply_config with configType=runnerSet, name=tsvi-solutions-runners
```

**What happens:**
- ✅ Applies fixed configuration to cluster
- ✅ Waits for rollout to complete
- 📊 Validates deployment succeeded
- 🔍 Auto-validates policies again

#### **7️⃣ Verify Compliance Improvement**

In GitHub Copilot Chat:
```
Check my ARC policies
```

**Expected output:**
```
🔒 ARC Policy Validation

📊 Compliance Score: ✅ 88.9%

| Metric         | Count |
|----------------|-------|
| Total Rules    | 18    |
| ✅ Passed      | 16    |
| ❌ Failed      | 2     |

🎉 Compliance Improved: 72.2% → 88.9%

Remaining issues require manual fixes:
• Repository scoping configuration
• Runner group assignment
```

---

### Alternative: Apply Immediately (Dev/Test Only ⚠️)

For **development or testing environments only**, you can fix and apply in one step:

In GitHub Copilot Chat:
```
Fix policy violations and apply to cluster
```

**Or:**
```
Use #arc_validate_policies with operation=auto_fix, apply=true
```

**What happens:**
- ✅ Generates fixed configs
- ✅ Saves to `configs/` (still creates files!)
- ✅ **Applies to cluster immediately**
- 📊 Re-validates automatically

**⚠️ Use with caution:** This skips the review step!

---

### Policy Validation Best Practices

| Practice | Why It Matters |
|----------|----------------|
| **Generate policy config first** | Customize policies for your environment |
| **Run validation before deployments** | Catch issues early in dev |
| **Use default (config-only) mode** | Review before applying to production |
| **Commit policy configs to Git** | Version control for audit trail |
| **Validate regularly** | Detect configuration drift |
| **Check compliance in CI/CD** | Prevent non-compliant deployments |

---

### Integration with Deployment Workflows

**Hybrid Mode + Policy Validation:**

```
# Full workflow in GitHub Copilot Chat:

# 1. Deploy runners (hybrid mode)
Use #arc_deploy_runners_hybrid with organization=my-org, minRunners=10, maxRunners=50

# 2. Validate policies
#arc_validate_policies

# 3. Fix any violations
#arc_validate_policies with operation=auto_fix

# 4. Review and commit
# (Switch to terminal)
git diff configs/
git add configs/
git commit -m "feat: add runners with policy compliance"

# 5. Apply
# (Back to Copilot Chat)
Use #arc_apply_config with configType=runnerSet, name=my-org-runners

# 6. Verify
#arc_validate_policies
```

---

## 🐛 Troubleshooting

### "Configuration drift detected"

**Cause**: Someone modified runners directly in cluster

**Fix**:
```
# Option 1: Update repo to match cluster
kubectl get autoscalingrunnersets -n arc-systems <name> -o yaml > configs/runner-sets/<name>.yaml
git add configs/ && git commit -m "sync: update config to match cluster"

# Option 2: Apply repo config to cluster (overwrite cluster)
Use #arc_apply_config with configType=runnerSet, name=<name>
```

### "Config file not found"

**Cause**: Trying to apply config that doesn't exist in repo

**Fix**:
```
# Generate the config first:
Use #arc_deploy_runners_hybrid with mode=gitops, apply=false
```

---

## 📚 Tool Quick Reference

| Tool | Mode Support | Purpose |
|------|--------------|---------|
| `arc_install_controller` | All | Install ARC controller |
| `arc_deploy_runners_hybrid` | Hybrid, GitOps | Deploy with config files |
| `deploy_github_runners` | Direct | Deploy without config files (legacy) |
| `arc_apply_config` | Hybrid, GitOps | Apply existing config to cluster |
| `arc_list_configs` | Hybrid, GitOps | List all config files |
| `arc_detect_drift` | Hybrid, GitOps | Check repo vs. cluster sync |
| `arc_scale_runners` | All | Scale runners (updates configs in Hybrid) |
| `arc_get_status` | All | Check cluster state |

---

## 🎓 Examples

> **💬 All examples below use GitHub Copilot Chat** - Open it with `Cmd+Shift+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)

### Example 1: Full DevOps Workflow (Hybrid)

**In GitHub Copilot Chat**, copy and paste these commands one at a time:
```
# 1. Install
Use #arc_install_controller

# 2. Deploy runners with auto-scaling
Use #arc_deploy_runners_hybrid with organization=my-org, minRunners=10, maxRunners=100, mode=hybrid

# 3. Check what was created
#arc_list_configs

# 4. Verify cluster
#arc_get_status

# 5. Later, check for drift
#arc_detect_drift
```

### Example 2: Team Review Workflow (GitOps)

**Step 1 - In GitHub Copilot Chat:**
```
# 1. Generate config (don't apply)
Use #arc_deploy_runners_hybrid with organization=my-org, minRunners=10, maxRunners=100, mode=gitops, apply=false
```

**Step 2 - Switch to VS Code Terminal** (`Ctrl+`` or View → Terminal):
```bash
# 2. Review and push for PR
git checkout -b feature/add-runners
git add configs/
git commit -m "Add runners for my-org"
git push origin feature/add-runners
```

**Step 3 - After PR approval, return to GitHub Copilot Chat:**
```
# Pull latest changes first (in terminal)
git checkout main && git pull

# Then apply in Copilot Chat
Use #arc_apply_config with configType=runnerSet, name=my-org-runners
```

### Example 3: Quick Test (Direct)

**In GitHub Copilot Chat** (all commands):
```
# Just deploy immediately
Use #deploy_github_runners with organization=test-org, minReplicas=1, maxReplicas=5

# Scale later
Use #arc_scale_runners with runnerName=test-org-runners, minReplicas=2, maxReplicas=10

# Clean up
Use #arc_cleanup_installation with namespace=arc-systems
```

---

## 🚀 Getting Started

> **🎯 Quick Start:** Open GitHub Copilot Chat (`Cmd+Shift+I` / `Ctrl+Shift+I`) and follow the commands below

**New project?** Start with **Hybrid Mode** - it's the best balance:

**In GitHub Copilot Chat:**
```
Use #arc_install_controller
Use #arc_deploy_runners_hybrid with organization=YOUR_ORG, minRunners=5, maxRunners=20
```

**Existing deployment?** Capture current state then switch to Hybrid:

**In VS Code Terminal:**
```bash
kubectl get autoscalingrunnersets -n arc-systems -o yaml > configs/runner-sets/existing-runners.yaml
# Clean up the YAML, then commit
git add configs/ && git commit -m "capture existing config"
```

**Just testing?** Use **Direct Mode** with the legacy tool:

**In GitHub Copilot Chat:**
```
Use #deploy_github_runners with organization=test, minReplicas=1, maxReplicas=5
```
