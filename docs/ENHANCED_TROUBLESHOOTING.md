# Enhanced ARC MCP Server - Comprehensive Troubleshooting Guide

## 🎯 Overview

This enhanced version of the ARC MCP server includes comprehensive troubleshooting capabilities based on real-world experience with ARC installations and cleanup operations. The system can automatically detect, diagnose, and fix common issues without requiring manual command-line intervention.

## 🔧 Enhanced Troubleshooting Scenarios

### 1. Namespace Stuck Terminating

**Issue:** Namespace remains in "Terminating" state indefinitely
**Real-world Example:** `arc-systems` namespace stuck for 9+ hours due to finalizers

**Auto-Fix Capabilities:**
- ✅ Automatically detects stuck resources with finalizers
- ✅ Force removes finalizers from orphaned runner resources
- ✅ Uses `kubectl patch` to clear namespace finalizers
- ✅ Force finalizes namespace via API endpoint

**Manual Steps Automated:**
```bash
# These steps are now automated by the MCP server
kubectl patch namespace arc-systems -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl get namespace arc-systems -o json | jq '.spec.finalizers = []' | kubectl replace --raw "/api/v1/namespaces/arc-systems/finalize" -f -
```

### 2. Image Pull Authentication Issues

**Issue:** `ImagePullBackOff` or `ErrImagePull` due to GitHub Container Registry authentication
**Real-world Example:** `ghcr.io/actions/actions-runner-controller:v0.27.6`: unauthorized

**Auto-Fix Capabilities:**
- ✅ Detects GHCR authentication failures
- ✅ Attempts alternative image repositories
- ✅ Uses specific stable image versions
- ✅ Configures image pull secrets if needed
- ✅ Falls back to DockerHub mirrors

**Prevention Strategies:**
- Uses proven image versions instead of `latest`
- Configures proper GitHub token permissions
- Implements repository failover mechanisms

### 3. Certificate Manager Issues

**Issue:** cert-manager pods not ready, blocking ARC installation
**Real-world Example:** CRDs not available, webhook not responsive

**Auto-Fix Capabilities:**
- ✅ Waits intelligently for cert-manager readiness
- ✅ Tests webhook connectivity with sample resources
- ✅ Validates CRDs are properly installed
- ✅ Provides fallback installation methods (Helm vs kubectl)

**Comprehensive Validation:**
- Checks namespace existence
- Validates all deployments are ready
- Tests CRD availability
- Verifies webhook responsiveness

### 4. Helm Installation Timeouts

**Issue:** Helm installations timeout due to resource constraints or image pulls
**Real-world Example:** Installation hangs for 10+ minutes waiting for pods

**Auto-Fix Capabilities:**
- ✅ Dynamically adjusts timeout values based on cluster size
- ✅ Monitors pod startup progress in real-time
- ✅ Detects and resolves resource constraint issues
- ✅ Provides intelligent retry mechanisms

**Smart Monitoring:**
- Real-time pod status updates
- Progress visualization during installation
- Intelligent failure detection and recovery

### 5. Pod Security Standards Violations

**Issue:** Pods rejected due to security policy violations
**Real-world Example:** `runAsNonRoot` conflicts, privilege escalation issues

**Auto-Fix Capabilities:**
- ✅ Automatically configures proper security contexts
- ✅ Adjusts namespace security policies when needed
- ✅ Uses privileged namespaces for compatibility
- ✅ Optimizes security settings for ARC requirements

### 6. Resource Finalizer Issues

**Issue:** Custom resources stuck due to finalizers preventing deletion
**Real-world Example:** `runner.actions.summerwind.dev` finalizers on 3 runner instances

**Auto-Fix Capabilities:**
- ✅ Detects all stuck resources with finalizers
- ✅ Force removes finalizers from specific resource types
- ✅ Handles AutoscalingRunnerSets, RunnerDeployments, and Runners
- ✅ Provides granular finalizer management

**Supported Resource Types:**
- `runners.actions.summerwind.dev`
- `autoscalingrunnersets.actions.summerwind.dev`
- `runnerdeployments.actions.summerwind.dev`
- `horizontalrunnerautoscalers.actions.summerwind.dev`

## 🚀 Enhanced Installation Process

The enhanced installation process includes six phases with comprehensive troubleshooting:

### Phase 1: Prerequisites Validation with Issue Detection
- ✅ Validates Kubernetes cluster connectivity
- ✅ Checks Helm availability and configuration
- ✅ Validates GitHub token permissions
- ✅ Detects existing installation conflicts
- ✅ Performs resource capacity analysis

### Phase 2: Environment Assessment with AI Optimization
- ✅ Analyzes cluster topology
- ✅ Generates optimal scaling configurations
- ✅ Assesses security posture
- ✅ Creates intelligent installation plan

### Phase 3: ARC Installation with Real-time Monitoring
- ✅ Creates namespace with security policies
- ✅ Installs cert-manager with comprehensive validation
- ✅ Deploys ARC controller with progress tracking
- ✅ Monitors pod startup and health

### Phase 4: Security Hardening with AI Configuration
- ✅ Applies enterprise-grade security policies
- ✅ Configures network policies
- ✅ Sets up proper RBAC
- ✅ Enables compliance monitoring

### Phase 5: Validation with Comprehensive Testing
- ✅ Validates all components are healthy
- ✅ Tests webhook connectivity
- ✅ Performs compliance scoring
- ✅ Generates security reports

### Phase 6: Runner Guidance with AI Recommendations
- ✅ Generates optimal runner configurations
- ✅ Provides testing workflows
- ✅ Creates next-step recommendations
- ✅ Enables conversational management

## 🧹 Enhanced Cleanup Process

The enhanced cleanup process includes six phases with force recovery capabilities:

### Phase 1: Enhanced Validation with Issue Detection
- ✅ Detects stuck resources and finalizers
- ✅ Identifies namespace terminating issues
- ✅ Analyzes resource dependencies
- ✅ Performs safety checks

### Phase 2: Comprehensive Troubleshooting
- ✅ Automatically applies fixes for known issues
- ✅ Removes finalizers from stuck resources
- ✅ Resolves namespace terminating problems
- ✅ Handles orphaned resources

### Phase 3: Forced Resource Cleanup
- ✅ Force removes runner resources with grace period bypass
- ✅ Uninstalls Helm releases with timeout handling
- ✅ Removes deployments and services
- ✅ Cleans up secrets and configurations

### Phase 4: Finalizer Removal
- ✅ Systematically removes finalizers from all ARC resources
- ✅ Handles multiple resource types
- ✅ Uses proper API calls for finalizer management
- ✅ Provides recovery tracking

### Phase 5: Namespace Force Deletion
- ✅ Attempts graceful namespace deletion first
- ✅ Force removes namespace finalizers if needed
- ✅ Uses API endpoint for finalizer management
- ✅ Waits intelligently for completion

### Phase 6: Final Verification
- ✅ Comprehensive verification of cleanup completeness
- ✅ Checks for remaining resources across all namespaces
- ✅ Validates Custom Resource Definitions
- ✅ Provides detailed cleanup report

## 📊 Real-time Progress Updates

All operations provide real-time progress updates in the VS Code chat:

```
## 🚀 ARC Installation Progress

Progress: 60% [████████████░░░░░░░░]

📋 Installation Phases:
    ✅ 🔍 Prerequisites
    ✅ 📊 Assessment  
    ⚡ 🚀 Installation
    ⏸️ 🛡️  Security
    ⏸️ ✅ Validation
    ⏸️ 🏃‍♂️ Runners

🎯 Current Phase: Installing ARC controller with AI optimization...

⏱️ This process typically takes 2-5 minutes
🎪 Sit back and enjoy the show!
```

## 🧠 AI Insights

The system provides intelligent insights throughout the process:

- 🧠 Analyzing cluster state for safe cleanup operations
- 🧠 Environment validated - safe to proceed with cleanup
- 🧠 No runner resources found - skipping this phase
- 🧠 Evaluating namespace arc-systems for safe removal
- 🧠 Some components may require manual cleanup - see verification results

## 🛡️ Safety Features

### Default Safety Mode
- Cleanup functionality is disabled by default (`CLEANUP_ARC=false`)
- Requires explicit enablement to prevent accidental deletions
- Provides dry-run mode for validation

### Intelligent Recovery
- Automatic detection of common failure patterns
- Self-healing capabilities for known issues
- Comprehensive rollback strategies

### Comprehensive Logging
- Detailed operation logs with timestamps
- AI insights and recommendations
- Troubleshooting results and recovery actions

## 🎮 Usage Examples

### Enable Enhanced Installation
The enhanced installation is used automatically when calling the installation tool. It includes:
- Comprehensive troubleshooting
- Real-time progress updates
- Automatic issue resolution
- Intelligent recovery mechanisms

### Enable Enhanced Cleanup
```bash
# Set environment variable to enable cleanup
export CLEANUP_ARC=true

# Or update your MCP configuration
{
  "args": ["--rm", "-i", "-e", "CLEANUP_ARC=true", ...]
}
```

### Natural Language Commands
The system supports natural language for all operations:
- "Install ARC with troubleshooting"
- "Cleanup the stuck ARC installation"
- "Fix the namespace terminating issue"
- "Force remove all ARC components"

## 🔍 Troubleshooting Scenarios Covered

| Issue | Severity | Auto-Fix | Description |
|-------|----------|----------|-------------|
| Namespace Stuck Terminating | High | ✅ | Finalizers blocking namespace deletion |
| Image Pull Authentication | Critical | ✅ | GHCR authentication failures |
| Cert-Manager Not Ready | High | ✅ | CRDs or webhook issues |
| Helm Installation Timeout | Medium | ✅ | Resource constraints or image pulls |
| Pod Security Violations | Medium | ✅ | Security context misconfigurations |
| GitHub Token Issues | Critical | ✅ | Invalid or expired tokens |
| Resource Limit Issues | Medium | ✅ | Insufficient cluster resources |
| Network Policy Problems | Medium | ✅ | Connectivity blocked by policies |
| CRD Version Conflicts | High | ✅ | Custom Resource Definition issues |
| Webhook Configuration | High | ✅ | Admission controller problems |
| Runner Registration | Medium | ✅ | GitHub integration failures |

## 🎯 Benefits

1. **Zero Manual Intervention**: All common issues are detected and fixed automatically
2. **Real-world Experience**: Based on actual troubleshooting scenarios
3. **Comprehensive Coverage**: Handles installation, cleanup, and recovery
4. **Intelligent Recovery**: Self-healing capabilities for known issues
5. **Safety First**: Multiple safety mechanisms prevent accidental damage
6. **Visual Feedback**: Real-time progress updates and AI insights
7. **Natural Language**: Conversational interface for all operations

## 🔄 Continuous Improvement

The troubleshooting scenarios are continuously updated based on:
- Real-world deployment experiences
- Community feedback and issues
- New ARC versions and changes
- Kubernetes platform evolution

This ensures the MCP server stays current with the latest challenges and solutions in the ARC ecosystem.