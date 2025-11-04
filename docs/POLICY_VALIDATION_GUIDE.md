# 🔒 ARC Policy Validation Tool - Complete Usage Guide

> **Enterprise-Grade Policy Enforcement for GitHub Actions Runner Controller**

This comprehensive guide covers everything you need to know about using the ARC Policy Validation tool to ensure your GitHub Actions runners meet security, compliance, performance, and cost optimization standards.

## 📖 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Understanding Policy Categories](#-understanding-policy-categories)
- [Using the Tool](#-using-the-tool)
- [Auto-Fix Features](#-auto-fix-features)
- [Real-World Workflows](#-real-world-workflows)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)
- [Advanced Usage](#-advanced-usage)

---

## 🎯 Overview

### What is Policy Validation?

The ARC Policy Validation tool is a built-in enterprise policy engine that automatically validates your GitHub Actions Runner Controller (ARC) deployments against **20+ security, compliance, performance, and cost policies**. It helps you:

- ✅ **Prevent security vulnerabilities** before they reach production
- ✅ **Ensure compliance** with organizational and regulatory requirements
- ✅ **Optimize performance** and resource utilization
- ✅ **Reduce costs** through intelligent configuration
- ✅ **Maintain operational excellence** with best practices

### Key Features

| Feature | Description |
|---------|-------------|
| **🔍 Automatic Scanning** | Scans all ARC resources in your cluster automatically |
| **📊 Compliance Scoring** | Provides overall compliance percentage (0-100%) |
| **🔧 Auto-Fix** | Automatically remediates 6+ common policy violations |
| **📝 GitOps-Ready** | Generates configuration files for version control |
| **🎯 Targeted Validation** | Validate specific resources or namespaces |
| **📋 Detailed Reports** | Generate comprehensive compliance reports |
| **⚡ Real-Time** | Validates against live cluster state |

### No Configuration Required!

All 20+ policies are **built into the MCP server** - no external configuration files, no setup, no maintenance. Just start using it!

### 🎯 Auto-Discovery of Policy Configurations

The tool automatically searches for custom policy configurations in standard locations - no need to specify paths manually!

**Standard Paths Checked (in order)**:
1. `configs/policies/arc-policy-config.json`
2. `configs/policies/arc-policy-config.yaml`
3. `.arc/policy-config.json`
4. `.arc/policy-config.yaml`

**How It Works**:
```bash
# No configPath needed - auto-discovers your config!
arc_validate_policies
# ✅ Auto-discovered: configs/policies/arc-policy-config.json
# 📊 Applying custom policy overrides...
# Compliance Score: 72.2%
```

**Benefits**:
- ✅ Zero configuration overhead
- ✅ GitOps-friendly (configs/ folder)
- ✅ Consistent across teams
- ✅ Works out of the box

**Manual Override** (optional):
```bash
# Only if you need a non-standard location
arc_validate_policies --configPath /custom/path/policy-config.json
```

### 🛠️ Policy Configuration Generator Tool

Need to customize policies? Use the **`arc_generate_policy_config`** tool to create a starter configuration!

**Quick Start**:
```bash
# Generate default config
"Generate a policy config for my organization"

# Generates: configs/policies/arc-policy-config.json
{
  "version": "1.0",
  "organization": {
    "name": "your-org",
    "environment": "production"
  },
  "global": {
    "enforcement": "strict"
  },
  "ruleOverrides": {}
}
```

**With Custom Requirements**:
```bash
# Specify your needs in natural language
"Generate a policy config for development environment with relaxed security policies"

# Or use the tool directly
arc_generate_policy_config \
  --organization "tsvi-solutions" \
  --environment "development" \
  --requirements "Relaxed security for faster iteration, cost optimization enabled"
```

**Example Output**:
```json
{
  "version": "1.0",
  "organization": {
    "name": "tsvi-solutions",
    "environment": "development"
  },
  "global": {
    "enforcement": "advisory",
    "autoFix": true
  },
  "ruleOverrides": {
    "arc-sec-001": {
      "enabled": true,
      "severity": "medium"
    },
    "arc-cost-001": {
      "enabled": true,
      "severity": "high",
      "customValues": {
        "aggressiveScaleDown": true
      }
    }
  }
}
```

**Common Use Cases**:

| Scenario | Command |
|----------|---------|
| **Production** | `arc_generate_policy_config --environment production --requirements "Strict security, SOC2 compliance"` |
| **Development** | `arc_generate_policy_config --environment development --requirements "Relaxed policies for faster dev cycles"` |
| **Cost Optimization** | `arc_generate_policy_config --requirements "Aggressive cost controls, auto-scaling"` |
| **Security Focus** | `arc_generate_policy_config --requirements "Maximum security, no privileged mode"` |

**What Happens Next**:
1. ✅ Config file saved to `configs/policies/arc-policy-config.json`
2. ✅ Auto-discovered on next `arc_validate_policies` run
3. ✅ Customized policies applied automatically
4. ✅ Ready to commit to Git for version control

---

## 🚀 Quick Start

### Your First Policy Check

Simply ask the AI:

```text
"Check my ARC policies"
```

Or use the tool directly:

```bash
# Default: Show overview + current violations
arc_validate_policies
```

You'll immediately see:
- Your compliance score (e.g., 55.6%)
- Number of passed/failed policies
- Critical violations that need attention
- Quick action suggestions

### Example Output

```
🔒 ARC Policy Validation Tool

📊 Current Status (Namespace: arc-systems)
Compliance Score: ⚠️ 55.6%

| Metric         | Count |
|----------------|-------|
| Total Rules    | 18    |
| ✅ Passed      | 10    |
| ❌ Failed      | 8     |
| 🔴 Critical    | 0     |
| 🟠 High        | 0     |
| ⚠️ Warnings    | 10    |

✅ No Critical Violations
Great job! Your ARC deployment has no critical policy violations.
```

---

## 📚 Understanding Policy Categories

The tool validates against **6 categories** of policies, each serving a specific purpose.

### 🔒 Security Policies (6 Rules)

**Purpose**: Prevent security vulnerabilities and enforce defense-in-depth practices

| Rule ID | Name | Severity | What It Checks |
|---------|------|----------|----------------|
| `arc-sec-001` | Require Security Context | High | Runners must have security context defined |
| `arc-sec-002` | Prohibit Privileged Mode | Critical | Runners cannot run as privileged containers |
| `arc-sec-003` | Require GitHub Token Secret | Critical | Controllers must reference valid token secrets |
| `arc-sec-004` | Prohibit hostPath Mounts | High | Runners should not mount host paths |
| `arc-sec-005` | Restrict Capabilities | High | Runners should drop unnecessary capabilities |
| `arc-sec-006` | Read-Only Root Filesystem | Medium | Runners should use read-only root filesystem |

**Why These Matter**:
- Privileged containers can escape to the host system
- Missing security contexts allow unsafe default permissions
- Invalid token secrets cause authentication failures
- Host path mounts create security boundaries vulnerabilities

### 📋 Compliance Policies (3 Rules)

**Purpose**: Ensure organizational and regulatory compliance requirements

| Rule ID | Name | Severity | What It Checks |
|---------|------|----------|----------------|
| `arc-comp-001` | Require Repository Scoping | Medium | Runners should target specific repositories |
| `arc-comp-002` | Require Runner Groups | Medium | Runners should be assigned to runner groups |
| `arc-comp-003` | Require Resource Labels | Low | Resources must have proper Kubernetes labels |

**Why These Matter**:
- Repository scoping prevents unauthorized workflow access
- Runner groups enable access control and usage tracking
- Proper labeling is required for governance and cost allocation

### 📊 Performance Policies (3 Rules)

**Purpose**: Optimize resource utilization and prevent performance bottlenecks

| Rule ID | Name | Severity | What It Checks |
|---------|------|----------|----------------|
| `arc-perf-001` | Require Resource Limits | High | Pods must have CPU/memory limits defined |
| `arc-perf-002` | Require Resource Requests | High | Pods must have CPU/memory requests defined |
| `arc-perf-003` | Reasonable Resource Values | Medium | Resource values should be within acceptable ranges |

**Why These Matter**:
- Missing limits allow pods to consume all node resources
- Missing requests cause poor scheduling decisions
- Unreasonable values waste money or cause failures

### 💰 Cost Policies (2 Rules)

**Purpose**: Optimize costs and prevent budget overruns

| Rule ID | Name | Severity | What It Checks |
|---------|------|----------|----------------|
| `arc-cost-001` | Enable Autoscaling | Medium | Runner sets should use autoscaling |
| `arc-cost-002` | Reasonable Replica Counts | Medium | Min/max replicas should be within cost-effective ranges |

**Why These Matter**:
- Autoscaling prevents paying for idle runners
- Reasonable replica limits prevent runaway costs
- Over-provisioning wastes cloud resources

### ⚙️ Operations Policies (2 Rules)

**Purpose**: Maintain operational excellence and observability

| Rule ID | Name | Severity | What It Checks |
|---------|------|----------|----------------|
| `arc-ops-001` | Valid Runner Image | High | Runner images should be from trusted registries |
| `arc-ops-002` | Enable Observability | Medium | Runners should have monitoring/logging enabled |

**Why These Matter**:
- Untrusted images can contain malware or vulnerabilities
- Observability is critical for troubleshooting and monitoring

### 🌐 Networking Policies (1 Rule)

**Purpose**: Ensure proper network configuration

| Rule ID | Name | Severity | What It Checks |
|---------|------|----------|----------------|
| `arc-net-001` | Dual-Stack Support | Low | Runners should support IPv4/IPv6 dual-stack |

**Why These Matter**:
- Dual-stack support ensures compatibility with modern networks
- IPv6 readiness future-proofs your infrastructure

---

## 🛠️ Using the Tool

### 5 Core Operations

The tool supports 5 main operations, each serving a different purpose:

#### 1. Overview (Default)

**When to use**: First time using the tool, or quick status check

```bash
# No parameters needed - provides educational overview + current status
arc_validate_policies
```

**What you get**:
- Introduction to the tool and its capabilities
- Current compliance score
- Summary of violations by severity
- Quick action suggestions

---

#### 2. Generate Compliance Report

**When to use**: Need detailed analysis for management or audit purposes

```bash
# Natural language
"Generate ARC compliance report"

# Direct tool call
arc_validate_policies --operation report

# Specific namespace
arc_validate_policies --operation report --namespace production
```

**What you get**:
- Overall compliance score (0-100%)
- Detailed breakdown by category
- Detailed breakdown by severity
- List of all violations with context
- Actionable recommendations
- Timestamp for audit trail

**Example Output**:

```
# ✅ ARC Compliance Report

Cluster: my-cluster
Namespace: arc-systems
Compliance Score: 55.6%
Timestamp: 2025-11-01 10:30:45

📊 Summary
| Metric              | Count |
|---------------------|-------|
| Total Rules         | 18    |
| Rules Passed        | 10    |
| Rules Failed        | 8     |
| Critical Violations | 0     |
| High Violations     | 0     |
| Warnings            | 10    |

🎯 Violations by Severity
- 🟡 medium: 5
- 🟢 low: 3

📂 Violations by Category
- 📊 performance: 4
- 💰 cost: 2
- 📋 compliance: 2

💡 Recommendations
- Enable autoscaling for cost optimization
- Add resource limits to prevent resource exhaustion
- Configure repository scoping for better security
```

---

#### 3. List Policy Rules

**When to use**: Want to understand available policies before validation

```bash
# All rules
"Show me all ARC policy rules"
arc_validate_policies --operation list_rules

# Filter by category
"Show me security policy rules"
arc_validate_policies --operation list_rules --category security
```

**What you get**:
- Complete list of all policy rules
- Rule ID, name, severity, and scope
- Detailed description of what each rule checks
- Organized by category
- Usage examples

**Example Output**:

```
# 📋 ARC Policy Rules - Security

Found 6 policy rules in category 'security'.

## 🔒 Security Policies (6)

### ✅ Require Runner Security Context
- ID: arc-sec-001
- Severity: 🟠 high
- Scope: Pod
- Status: Enabled
- Description: ARC runner pods must have security context defined

### ✅ Prohibit Privileged Runners
- ID: arc-sec-002
- Severity: 🔴 critical
- Scope: Container
- Status: Enabled
- Description: ARC runners must not run in privileged mode
```

---

#### 4. List Current Violations

**When to use**: Need to see specific violations without full report

```bash
# All violations
"Show me policy violations"
arc_validate_policies --operation list_violations

# Filter by severity
"Show me critical policy violations"
arc_validate_policies --operation list_violations --severity critical

# Filter by category and severity
arc_validate_policies --operation list_violations --category security --severity high

# Specific namespace
arc_validate_policies --operation list_violations --namespace production
```

**What you get**:
- Focused list of violations only
- Grouped by severity (critical → high → medium → low)
- Resource name and location
- Current vs. suggested values
- Auto-fix availability status

**Example Output**:

```
# 📋 Current Policy Violations

Found 3 violation(s) in namespace arc-systems.

## 🟠 HIGH (2)

### 1. Require Resource Limits
- Resource: AutoScalingRunnerSet/production-runners (arc-systems)
- Category: 📊 performance
- Issue: Runner containers do not define resource limits
- Field: spec.template.spec.containers[0].resources.limits
- Current: undefined
- Suggested: {"cpu":"2","memory":"4Gi"}
- Auto-fix: ✅ Yes

### 2. Require Security Context
- Resource: AutoScalingRunnerSet/production-runners (arc-systems)
- Category: 🔒 security
- Issue: Runner pods do not have security context
- Field: spec.template.spec.securityContext
- Current: undefined
- Suggested: {"runAsNonRoot":true,"fsGroup":1000}
- Auto-fix: ✅ Yes

## 🟡 MEDIUM (1)

### 1. Enable Autoscaling
- Resource: AutoScalingRunnerSet/dev-runners (arc-systems)
- Category: 💰 cost
- Issue: Runner set does not have autoscaling enabled
- Field: spec.maxRunners
- Current: undefined
- Suggested: Set min/max runners for autoscaling
- Auto-fix: ❌ No

---

🔧 Auto-Fix Available
2 violation(s) can be automatically fixed.
Run: arc_validate_policies --operation auto_fix --namespace arc-systems
```

---

#### 5. Validate Specific Resource

**When to use**: Check one specific RunnerScaleSet in detail

```bash
# Natural language
"Validate the production-runners deployment"

# Direct tool call
arc_validate_policies --operation validate \
  --namespace arc-systems \
  --runnerScaleSetName production-runners
```

**What you get**:
- Pass/fail status for that resource
- Detailed violations for that resource only
- Warnings (non-blocking issues)
- Next steps specific to that resource

**Example Output**:

```
# ❌ Policy Validation Result - FAILED

Resource: production-runners
Namespace: arc-systems

📊 Summary
| Metric     | Count |
|------------|-------|
| Total      | 18    |
| Passed     | 15    |
| Failed     | 3     |
| Violations | 3     |
| Warnings   | 0     |

🔴 Policy Violations

1. Require Resource Limits (🟠 high)
   - Category: 📊 performance
   - Message: Runner containers do not define resource limits
   - Field: spec.template.spec.containers[0].resources.limits
   - Current: undefined
   - Suggested: {"cpu":"2","memory":"4Gi"}
   - Auto-fix: ✅ Available

📖 Next Steps
1. Review violations above
2. Fix critical issues first
3. Use auto-fix: arc_validate_policies --operation auto_fix --namespace arc-systems
4. Re-validate after fixes
```

---

## 🔧 Auto-Fix Features

One of the most powerful features is the **automatic remediation** of policy violations. The tool can fix many common issues automatically.

### How Auto-Fix Works

Auto-fix operates in **two modes**:

#### Mode 1: Config-Only (Default - Recommended ✅)

**Safest approach** - Generates fixed configuration files for review

```bash
# Natural language
"Fix my policy violations"

# Direct tool call
arc_validate_policies --operation auto_fix --namespace arc-systems
```

**What happens**:
1. ✅ Scans for violations
2. ✅ Applies fixes to a copy of the configuration
3. ✅ Saves fixed config to `configs/runner-sets/[name]-fixed.yaml`
4. ✅ Shows you what was fixed
5. ❌ Does NOT apply to cluster (you control when)

**Next steps**:
1. Review the generated config file
2. Commit to Git for audit trail
3. Say "apply the runner configuration" when ready

---

#### Mode 2: Apply Mode (Advanced ⚠️)

**Faster but riskier** - Generates configs AND applies to cluster immediately

```bash
# Natural language
"Fix policy violations and apply to cluster"

# Direct tool call
arc_validate_policies --operation auto_fix --namespace arc-systems --apply true
```

**What happens**:
1. ✅ Scans for violations
2. ✅ Applies fixes to configuration
3. ✅ Saves fixed config to `configs/` (audit trail)
4. ✅ **Applies changes to cluster immediately**
5. ✅ Validates the changes

**Use when**:
- You're working in a dev/test environment
- You need immediate remediation
- You trust the auto-fix logic
- You have good backup/rollback procedures

---

### What Can Be Auto-Fixed?

The tool can automatically fix **6+ common violations**:

| Violation Type | Auto-Fix Action |
|----------------|-----------------|
| **Missing Resource Limits** | Adds sensible CPU/memory limits |
| **Missing Resource Requests** | Adds CPU/memory requests |
| **Missing Security Context** | Adds non-root user configuration |
| **Missing Labels** | Adds required Kubernetes labels |
| **Container Capabilities** | Drops unnecessary capabilities |
| **Dual-Stack Networking** | Configures IPv4/IPv6 support |

### What Requires Manual Fix?

Some violations require human judgment:

| Violation Type | Why Manual? |
|----------------|-------------|
| **Privileged Mode** | Needs architectural review |
| **Repository Scoping** | Requires knowledge of repos |
| **Runner Group Assignment** | Depends on org structure |
| **Image Registry** | Business policy decision |

---

### Auto-Fix Example Walkthrough

**Scenario**: Your runners are missing resource limits and security contexts

```text
🧑 "Check my ARC policies"

🤖 📊 Running policy validation...
   
   Compliance Score: ⚠️ 55.6%
   
   Found 3 violations:
   🟠 Missing resource limits (high)
   🟠 Missing security context (high)  
   🟡 No autoscaling configured (medium)
   
   💡 2 violations can be auto-fixed!

🧑 "Fix them"

🤖 🔧 Generating fixed configuration...
   
   ✅ Added resource limits (CPU: 2, Memory: 4Gi)
   ✅ Added security context (non-root, fsGroup: 1000)
   
   📁 Generated: configs/runner-sets/production-runners-fixed.yaml
   
   📋 What Changed:
   
   spec.template.spec.containers[0].resources:
   +  limits:
   +    cpu: "2"
   +    memory: "4Gi"
   +  requests:
   +    cpu: "1"
   +    memory: "2Gi"
   
   spec.template.spec.securityContext:
   +  runAsNonRoot: true
   +  fsGroup: 1000
   +  runAsUser: 1000
   
   💡 Next Steps:
   1. Review: configs/runner-sets/production-runners-fixed.yaml
   2. Test: Apply to dev environment first
   3. Commit: git add configs/ && git commit
   4. Apply: Say "apply the runner configuration"

🧑 "Apply it"

🤖 ✅ Applying configuration to cluster...
   
   📦 Applied: AutoScalingRunnerSet/production-runners
   ⏱️ Waiting for rollout... Done!
   
   🔍 Re-validating...
   
   ✅ New Compliance Score: 77.8%
   ✅ 2 violations resolved
   ⚠️ 1 manual fix still needed (autoscaling)
```

---

## 🎬 Real-World Workflows

### Workflow 1: Initial Security Audit

**Goal**: Understand current security posture

```bash
# Step 1: Get overview
"Check my ARC policies"

# Step 2: Deep dive into security
"Show me security policy violations"
arc_validate_policies --operation list_violations --category security

# Step 3: Full compliance report for management
"Generate a compliance report"
arc_validate_policies --operation report

# Step 4: Export for documentation
# (Save the report output to a file for sharing)
```

**Timeline**: 5 minutes  
**Output**: Management-ready compliance report

---

### Workflow 2: Pre-Production Validation

**Goal**: Ensure production readiness before deployment

```bash
# Step 1: Validate specific runner set
"Validate the production-runners deployment"
arc_validate_policies --operation validate \
  --namespace arc-systems \
  --runnerScaleSetName production-runners

# Step 2: Check for any critical issues
"Show me critical violations"
arc_validate_policies --operation list_violations --severity critical

# Step 3: Fix auto-fixable issues
"Fix the violations"
arc_validate_policies --operation auto_fix --namespace arc-systems

# Step 4: Review and apply
# Review configs/runner-sets/production-runners-fixed.yaml
"Apply the runner configuration"

# Step 5: Re-validate
"Validate production-runners again"
```

**Timeline**: 10-15 minutes  
**Output**: Production-ready, compliant runner deployment

---

### Workflow 3: Continuous Compliance Monitoring

**Goal**: Integrate into CI/CD pipeline

```bash
# In your CI/CD pipeline (e.g., GitHub Actions)

# Step 1: Generate compliance report
arc_validate_policies --operation report --namespace production > compliance-report.txt

# Step 2: Check for critical violations
CRITICAL_COUNT=$(arc_validate_policies --operation list_violations \
  --severity critical --namespace production | grep "Found" | cut -d' ' -f2)

# Step 3: Fail pipeline if critical violations exist
if [ "$CRITICAL_COUNT" -gt 0 ]; then
  echo "❌ Critical policy violations found!"
  exit 1
fi

# Step 4: Generate auto-fix PR if violations exist
if [ "$CRITICAL_COUNT" -eq 0 ] && [ violations exist ]; then
  arc_validate_policies --operation auto_fix --namespace production
  # Create PR with fixed configs
fi
```

**Timeline**: Automated, runs on every deployment  
**Output**: Continuous compliance enforcement

---

### Workflow 4: Cost Optimization Review

**Goal**: Reduce infrastructure costs

```bash
# Step 1: Check cost-related policies
"Show me cost policy violations"
arc_validate_policies --operation list_violations --category cost

# Step 2: Identify over-provisioned runners
"Generate compliance report"
# Look for:
# - Runners without autoscaling
# - High max replica counts
# - Excessive resource limits

# Step 3: Apply cost optimizations
"Fix cost violations"
arc_validate_policies --operation auto_fix --category cost

# Step 4: Monitor savings
# Track runner count and resource usage over time
```

**Timeline**: Monthly review  
**Output**: Reduced cloud infrastructure costs

---

### Workflow 5: Security Incident Response

**Goal**: Quickly identify and fix security issues

```bash
# Step 1: Emergency security scan
"Show me all security violations"
arc_validate_policies --operation list_violations \
  --category security \
  --severity critical

# Step 2: Check all namespaces
for ns in $(kubectl get ns -o name | cut -d'/' -f2); do
  echo "Checking namespace: $ns"
  arc_validate_policies --operation list_violations \
    --namespace $ns \
    --category security
done

# Step 3: Immediate remediation
"Fix security violations and apply"
arc_validate_policies --operation auto_fix \
  --category security \
  --apply true

# Step 4: Verify fix
"Generate security compliance report"
arc_validate_policies --operation report | grep -A 20 "Security"
```

**Timeline**: Under 30 minutes  
**Output**: Security vulnerabilities remediated

---

## ✅ Best Practices

### 1. Regular Validation Schedule

```
Daily:    Check for critical violations
Weekly:   Generate full compliance reports
Monthly:  Review and update policies
Quarterly: Audit compliance trends
```

### 2. Use GitOps Workflow

Always use **config-only mode** (default) for production:

```bash
# ✅ DO: Generate configs first
arc_validate_policies --operation auto_fix

# Review the configs
git diff configs/

# Commit for audit trail
git add configs/
git commit -m "fix: policy violations - compliance score 55% → 78%"

# Apply when ready
"Apply the runner configuration"

# ❌ DON'T: Apply directly in production
arc_validate_policies --operation auto_fix --apply true  # Risky!
```

### 3. Filter Effectively

Use filters to focus on what matters:

```bash
# Focus on critical issues first
arc_validate_policies --operation list_violations --severity critical

# Then high priority
arc_validate_policies --operation list_violations --severity high

# By category for specialized teams
arc_validate_policies --operation list_violations --category security  # Security team
arc_validate_policies --operation list_violations --category cost      # FinOps team
```

### 4. Document Exceptions

Some violations may be intentional - document them:

```yaml
# In your runner configuration
apiVersion: actions.github.com/v1alpha1
kind: AutoScalingRunnerSet
metadata:
  annotations:
    # Document why this violates policy
    arc-mcp/policy-exception: "Privileged mode required for Docker-in-Docker builds"
    arc-mcp/exception-approved-by: "security-team@company.com"
    arc-mcp/exception-expires: "2025-12-31"
```

### 5. Monitor Compliance Trends

Track compliance over time:

```bash
# Generate report with timestamp
DATE=$(date +%Y-%m-%d)
arc_validate_policies --operation report > "compliance-reports/compliance-${DATE}.txt"

# Track score over time
SCORE=$(grep "Compliance Score" "compliance-reports/compliance-${DATE}.txt" | \
  grep -oP '\d+\.\d+')
echo "$DATE,$SCORE" >> compliance-history.csv
```

### 6. Integrate with Alerting

Set up alerts for compliance drift:

```bash
# In monitoring system (Prometheus, DataDog, etc.)

# Alert if compliance drops below threshold
if [ $COMPLIANCE_SCORE -lt 70 ]; then
  send_alert "ARC compliance dropped to ${COMPLIANCE_SCORE}%"
fi

# Alert on critical violations
CRITICAL=$(arc_validate_policies --operation list_violations --severity critical | wc -l)
if [ $CRITICAL -gt 0 ]; then
  send_page "Critical ARC policy violations detected!"
fi
```

### 7. Use in Pull Requests

Add policy validation to PR checks:

```yaml
# .github/workflows/arc-policy-check.yml
name: ARC Policy Validation
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate ARC Policies
        run: |
          # Connect to cluster
          # Run validation
          arc_validate_policies --operation report
          
          # Fail on critical violations
          CRITICAL=$(arc_validate_policies --operation list_violations --severity critical | wc -l)
          if [ $CRITICAL -gt 0 ]; then
            echo "❌ Critical policy violations found"
            exit 1
          fi
```

---

## 🔧 Troubleshooting

### Issue: "Unable to connect to cluster"

**Symptom**: Policy validation fails with connection error

**Solution**:
```bash
# Check kubeconfig
kubectl get nodes

# Verify MCP server has access
docker run -v ~/.kube:/home/node/.kube:ro \
  ghcr.io/tsviz/arc-config-mcp:latest \
  -- kubectl get nodes

# Check permissions
kubectl auth can-i list autoscalingrunnersets.actions.github.com -n arc-systems
```

---

### Issue: "No violations found but compliance is low"

**Symptom**: Tool shows low compliance but no violations listed

**Solution**: Some rules generate warnings, not violations

```bash
# Check warnings too
arc_validate_policies --operation report
# Look for "Warnings" section

# List all issues (violations + warnings)
arc_validate_policies --operation list_violations
```

---

### Issue: "Auto-fix not working for violation"

**Symptom**: Auto-fix doesn't remediate a specific violation

**Solution**: Some violations require manual intervention

```bash
# Check if violation is auto-fixable
arc_validate_policies --operation list_violations
# Look for "Auto-fix: ✅ Yes" or "❌ No"

# Manual fixes required for:
# - Privileged mode (architectural decision)
# - Repository scoping (requires repo knowledge)
# - Runner groups (org structure dependency)
```

---

### Issue: "Fixed config not applying to cluster"

**Symptom**: Generated config exists but cluster unchanged

**Solution**: Default mode doesn't auto-apply

```bash
# Option 1: Apply manually via kubectl
kubectl apply -f configs/runner-sets/my-runners-fixed.yaml

# Option 2: Ask AI to apply
"Apply the runner configuration"

# Option 3: Use apply mode (for dev/test only)
arc_validate_policies --operation auto_fix --apply true
```

---

### Issue: "Compliance score seems incorrect"

**Symptom**: Score doesn't match expected value

**Solution**: Score is calculated per-resource, not per-policy

```bash
# Example: 18 policies, 3 runner sets
# Total checks: 18 policies × 3 runners = 54 checks
# If 1 runner fails 1 policy: 53/54 = 98.1% compliance

# Check per-resource scores
arc_validate_policies --operation validate \
  --namespace arc-systems \
  --runnerScaleSetName each-runner

# For cluster-wide score
arc_validate_policies --operation report
```

---

### Issue: "Policy conflicts with our requirements"

**Symptom**: Valid use case violates policy

**Solution**: Document exception and accept risk

```yaml
# Add annotations to resource
metadata:
  annotations:
    arc-mcp/policy-exception: "Reason for exception"
    arc-mcp/exception-approved: "approver@company.com"
    arc-mcp/risk-accepted: "true"

# Future: Custom policy configurations will be supported
```

---

## 🚀 Advanced Usage

### Custom Policy Configuration (Coming Soon)

```yaml
# arc-policy-config.yaml
version: "1.0"

policies:
  # Override built-in policy severity
  arc-sec-001:
    severity: critical  # Upgrade from high
    
  # Customize thresholds
  arc-perf-003:
    customValues:
      maxCPU: "8"        # Default is "4"
      maxMemory: "16Gi"  # Default is "8Gi"
  
  # Disable policy (not recommended)
  arc-net-001:
    enabled: false
    reason: "IPv6 not supported in our network"
```

---

### Integration with External Tools

#### Prometheus Metrics

```python
# Export compliance score as metric
from prometheus_client import Gauge

arc_compliance_score = Gauge(
    'arc_policy_compliance_score',
    'ARC policy compliance score percentage',
    ['namespace']
)

# Update from validation
score = get_compliance_score('arc-systems')
arc_compliance_score.labels(namespace='arc-systems').set(score)
```

#### Slack Notifications

```bash
# Send compliance report to Slack
REPORT=$(arc_validate_policies --operation report)
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"ARC Compliance Report\n\`\`\`${REPORT}\`\`\`\"}" \
  $SLACK_WEBHOOK_URL
```

#### DataDog Integration

```bash
# Send compliance events to DataDog
COMPLIANCE=$(arc_validate_policies --operation report | grep "Compliance Score" | \
  grep -oP '\d+\.\d+')

curl -X POST "https://api.datadoghq.com/api/v1/events" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -d "{
    \"title\": \"ARC Compliance Check\",
    \"text\": \"Current compliance: ${COMPLIANCE}%\",
    \"tags\": [\"arc\", \"compliance\"],
    \"alert_type\": \"info\"
  }"
```

---

### Batch Validation Across Clusters

```bash
#!/bin/bash
# validate-all-clusters.sh

CLUSTERS=("prod-us-east" "prod-eu-west" "staging")

for cluster in "${CLUSTERS[@]}"; do
  echo "=== Validating cluster: $cluster ==="
  
  # Switch context
  kubectl config use-context $cluster
  
  # Run validation
  arc_validate_policies --operation report > "reports/${cluster}-compliance.txt"
  
  # Extract score
  SCORE=$(grep "Compliance Score" "reports/${cluster}-compliance.txt" | \
    grep -oP '\d+\.\d+')
  
  echo "Cluster $cluster: ${SCORE}% compliant"
  
  # Alert if below threshold
  if (( $(echo "$SCORE < 80" | bc -l) )); then
    echo "⚠️ Cluster $cluster below compliance threshold!"
  fi
done
```

---

### Policy-as-Code CI/CD Pipeline

```yaml
# .github/workflows/policy-enforcement.yml
name: ARC Policy Enforcement

on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8am
  workflow_dispatch:

jobs:
  validate-and-fix:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBECONFIG }}
      
      - name: Run Policy Validation
        id: validate
        run: |
          arc_validate_policies --operation report > compliance-report.txt
          cat compliance-report.txt
          
          SCORE=$(grep "Compliance Score" compliance-report.txt | grep -oP '\d+\.\d+')
          echo "score=$SCORE" >> $GITHUB_OUTPUT
      
      - name: Auto-Fix Violations
        if: steps.validate.outputs.score < 80
        run: |
          arc_validate_policies --operation auto_fix
      
      - name: Create PR with Fixes
        if: steps.validate.outputs.score < 80
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'fix: auto-remediate ARC policy violations'
          title: 'Auto-fix ARC Policy Violations'
          body: |
            ## Automated Policy Remediation
            
            Compliance score: ${{ steps.validate.outputs.score }}%
            
            This PR contains auto-generated fixes for ARC policy violations.
            
            Please review the changes and merge if appropriate.
          branch: auto-fix-arc-policies
      
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: compliance-report
          path: compliance-report.txt
```

---

## 📊 Understanding Compliance Scoring

### How Scores Are Calculated

```
Compliance Score = (Passed Checks / Total Checks) × 100%

Where:
- Total Checks = Number of Policies × Number of Resources
- Passed Checks = Checks that pass validation
```

**Example**:
- 18 active policies
- 3 runner sets in namespace
- Total checks: 18 × 3 = 54
- If 10 checks fail: (44/54) × 100 = 81.5% compliance

### Score Interpretation

| Score Range | Status | Meaning |
|-------------|--------|---------|
| **90-100%** | ✅ Excellent | Production-ready, well-configured |
| **70-89%** | ⚠️ Good | Minor issues, room for improvement |
| **50-69%** | 🔶 Fair | Multiple issues, needs attention |
| **Below 50%** | ❌ Poor | Significant problems, urgent fixes needed |

### What Affects Your Score

**Increases score**:
- ✅ Adding resource limits/requests
- ✅ Enabling security contexts
- ✅ Configuring autoscaling
- ✅ Proper labeling
- ✅ Repository scoping

**Decreases score**:
- ❌ Missing critical configurations
- ❌ Security context violations
- ❌ Resource limit issues
- ❌ Compliance gaps

---

## 🎓 Learning Resources

### Additional Documentation

- **[Full Policy Reference](POLICY_VALIDATION.md)** - Detailed policy descriptions
- **[Workflow Guide](WORKFLOW_GUIDE.md)** - GitOps and deployment workflows
- **[Security Guide](ADVANCED_SECURITY_POLICIES.md)** - Advanced security configurations

### Video Tutorials

- **Getting Started with Policy Validation** (5 min)
- **Auto-Fix Deep Dive** (10 min)
- **CI/CD Integration** (15 min)

### Support

- **GitHub Discussions**: Ask questions and share experiences
- **GitHub Issues**: Report bugs or request features
- **Documentation**: This guide and linked resources

---

## 🎯 Quick Reference

### Common Commands

```bash
# Overview
arc_validate_policies

# Full report
arc_validate_policies --operation report

# List rules
arc_validate_policies --operation list_rules

# List violations
arc_validate_policies --operation list_violations

# Auto-fix (config only)
arc_validate_policies --operation auto_fix

# Auto-fix and apply
arc_validate_policies --operation auto_fix --apply true

# Validate specific resource
arc_validate_policies --operation validate \
  --namespace arc-systems \
  --runnerScaleSetName my-runners
```

### Filters

```bash
# By severity
--severity critical|high|medium|low

# By category
--category security|compliance|performance|cost|operations|networking

# By namespace
--namespace production
```

### Natural Language

```text
"Check my ARC policies"
"Generate compliance report"
"Show me security violations"
"Fix policy violations"
"Validate production runners"
```

---

## 🚀 Next Steps

1. **Start Simple**: Run `arc_validate_policies` to see your current state
2. **Generate Report**: Get detailed analysis with `--operation report`
3. **Fix Issues**: Use auto-fix for quick remediation
4. **Integrate**: Add to CI/CD for continuous compliance
5. **Monitor**: Track scores over time

**Ready to get started?** Just ask: *"Check my ARC policies"* 🎯

---

<div align="center">

**Questions or issues?** Open an issue on [GitHub](https://github.com/tsviz/arc-config-mcp/issues)

*Ensuring secure, compliant, and optimized GitHub Actions runners* ✨

</div>
