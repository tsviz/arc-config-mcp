# ARC Policy Validation & Compliance

> **🔒 Enterprise-Grade Policy Enforcement for GitHub Actions Runner Controller**

The ARC Policy Validation tool (`arc_validate_policies`) provides automated security, compliance, performance, and cost policy validation for your GitHub Actions Runner Controller deployments.

## 🎯 Overview

The policy engine evaluates your ARC RunnerScaleSets against **20+ built-in policies** covering:

- **🔒 Security**: Prevent privileged runners, enforce security contexts, validate secrets
- **📋 Compliance**: Repository scoping, runner groups, proper labeling
- **📊 Performance**: Resource limits, CPU/memory quotas
- **💰 Cost**: Autoscaling configuration, resource optimization
- **⚙️ Operations**: Runner images, operational best practices

## 🚀 Quick Start

### Basic Validation

Check if a specific RunnerScaleSet complies with all policies:

```bash
# Via natural language
"Validate my runners for compliance"

# Via direct tool invocation
arc_validate_policies --operation validate --namespace arc-systems --runnerScaleSetName my-runners
```

### Generate Compliance Report

Get a comprehensive compliance report for your entire cluster:

```bash
# Cluster-wide report
arc_validate_policies --operation report

# Namespace-specific report
arc_validate_policies --operation report --namespace arc-systems
```

### List Available Policies

View all available policy rules:

```bash
# All policies
arc_validate_policies --operation list_rules

# Filter by category
arc_validate_policies --operation list_rules --category security
```

### View Current Violations

List all current policy violations:

```bash
# All violations
arc_validate_policies --operation list_violations

# Filter by severity
arc_validate_policies --operation list_violations --severity critical

# Filter by category and namespace
arc_validate_policies --operation list_violations --category security --namespace arc-systems
```

### Auto-Fix Violations

Automatically remediate violations where possible:

```bash
arc_validate_policies --operation auto_fix --namespace arc-systems
```

## � Auto-Discovery of Policy Configuration

> **✨ Zero-configuration policy management**

The policy engine **automatically discovers and loads** policy configuration files from your workspace. No need to specify paths manually!

### How It Works

The tool searches for policy configuration files in the following locations (in order):

1. `configs/policies/arc-policy-config.json`
2. `configs/policies/arc-policy-config.yaml`
3. `.arc-policy-config.json` (workspace root)
4. `.arc-policy-config.yaml` (workspace root)

When found, the policy configuration is **automatically loaded** and applied to all validation operations.

### Benefits

- ✅ **No manual configuration** - Just create the file and it's detected
- ✅ **Version controlled** - Store policy configs in Git alongside your runner configs
- ✅ **Team sharing** - Everyone on the team uses the same policy rules
- ✅ **Environment-specific** - Different configs for dev/staging/prod

### Example Usage

```bash
# 1. Create your policy config (auto-discovered)
cat > configs/policies/arc-policy-config.json << 'EOF'
{
  "organization": {
    "name": "my-org",
    "environment": "production"
  },
  "global": {
    "enforcement": "strict",
    "autoFix": true
  },
  "ruleOverrides": {
    "arc-comp-001": {
      "enabled": false,
      "comment": "We use org-wide runners intentionally"
    }
  }
}
EOF

# 2. Run validation (config is auto-loaded)
arc_validate_policies --operation report

# Output will show:
# 📁 Policy Configuration: Auto-discovered at configs/policies/arc-policy-config.json
# ✅ Loaded custom policy configuration
```

### Override Auto-Discovery

You can still manually specify a config path if needed:

```bash
arc_validate_policies --operation report --configPath /path/to/custom-config.json
```

### Confirmation

When a policy config is auto-discovered, you'll see:

```
📁 Policy Configuration: Auto-discovered at configs/policies/arc-policy-config.json
✅ Custom policy configuration loaded
   - Organization: my-org (production)
   - Enforcement: strict
   - Auto-fix: enabled
   - Rule overrides: 2 rules customized
```

## �📋 Built-in Policy Rules

### Security Policies (6 rules)

| Rule ID | Name | Severity | Description |
|---------|------|----------|-------------|
| `arc-sec-001` | Require Runner Security Context | High | ARC runner pods must have security context defined |
| `arc-sec-002` | Prohibit Privileged Runners | Critical | ARC runners must not run in privileged mode |
| `arc-sec-003` | Require GitHub Token Secret | Critical | ARC controllers must reference valid GitHub token secret |
| `arc-sec-004` | Prohibit hostPath Mounts | High | ARC runners should not mount host paths |
| `arc-sec-005` | Restrict Container Capabilities | High | ARC runners should drop unnecessary capabilities |
| `arc-sec-006` | Enforce Read-Only Root Filesystem | Medium | ARC runners should use read-only root filesystem |

### Compliance Policies (3 rules)

| Rule ID | Name | Severity | Description |
|---------|------|----------|-------------|
| `arc-comp-001` | Require Repository Scoping | Medium | ARC runners should be scoped to specific repositories |
| `arc-comp-002` | Require Runner Groups | Medium | ARC runners should be assigned to runner groups |
| `arc-comp-003` | Require Resource Labels | Low | ARC resources must have proper labels |

### Performance Policies (3 rules)

| Rule ID | Name | Severity | Description |
|---------|------|----------|-------------|
| `arc-perf-001` | Require Resource Limits | High | ARC runners must have resource limits defined |
| `arc-perf-002` | CPU Limit Validation | Medium | ARC runners must have appropriate CPU limits |
| `arc-perf-003` | Memory Limit Validation | Medium | ARC runners must have appropriate memory limits |

### Cost Policies (2 rules)

| Rule ID | Name | Severity | Description |
|---------|------|----------|-------------|
| `arc-cost-001` | Require Autoscaling | Low | ARC runners should use autoscaling |
| `arc-cost-002` | Validate Resource Right-sizing | Medium | ARC runners should have optimized resource allocation |

### Operations Policies (2 rules)

| Rule ID | Name | Severity | Description |
|---------|------|----------|-------------|
| `arc-ops-001` | Require Supported Runner Image | Medium | ARC runners should use supported runner images |
| `arc-ops-002` | Require Operational Labels | Low | ARC runners should have operational labels |

## 🔧 Custom Policy Configuration

> **✨ Policy configuration files are automatically discovered and loaded!**  
> Simply create `configs/policies/arc-policy-config.json` and the tool will find it.

### Overview

External policy configuration allows you to:
- **Override default rules** - Disable rules that don't apply to your environment
- **Customize severity levels** - Adjust rule importance based on your needs
- **Control auto-fix behavior** - Enable/disable automatic remediation
- **Set enforcement modes** - Choose between strict, advisory, or disabled
- **Version control policies** - Store policy configs in Git alongside your ARC configs
- **Zero configuration** - No need to specify paths, configs are auto-discovered!

### Quick Start: Create Your First Policy Config

**Method 1: Use the Generator Tool (Recommended)** ⭐

The easiest way to create a policy configuration:

```bash
# Generate a basic config (interactive)
arc_generate_policy_config

# Generate for production environment
arc_generate_policy_config \
  --organizationName "my-company" \
  --environment production \
  --enforcementLevel strict \
  --enableAutoFix false

# Generate for development with auto-fix enabled
arc_generate_policy_config \
  --organizationName "my-company" \
  --environment development \
  --enforcementLevel advisory \
  --enableAutoFix true

# Generate with specific rules disabled
arc_generate_policy_config \
  --organizationName "my-company" \
  --environment production \
  --disableRules '["arc-comp-001", "arc-013-005"]'

# Custom output location
arc_generate_policy_config \
  --organizationName "my-company" \
  --outputPath "./custom/policy.json"
```

**What it does:**
- ✅ Creates a complete, valid policy configuration
- ✅ Applies environment-specific defaults
- ✅ Auto-saves to the standard location (`configs/policies/`)
- ✅ Ready to use immediately - no manual editing needed

**Method 2: Manual Creation**

If you prefer to write the config manually:

```bash
# 1. Create the policies directory
mkdir -p configs/policies

# 2. Create a basic policy config
cat > configs/policies/arc-policy-config.json << 'EOF'
{
  "organization": {
    "name": "my-org",
    "environment": "production"
  },
  "global": {
    "enforcement": "advisory",
    "autoFix": true
  },
  "ruleOverrides": {
    "arc-comp-001": {
      "enabled": false,
      "comment": "We intentionally use org-wide runners"
    }
  }
}
EOF

# 3. Run validation - config is automatically loaded!
arc_validate_policies --operation report

# You'll see:
# 📁 Policy Configuration: Auto-discovered at configs/policies/arc-policy-config.json
# ✅ Custom policy configuration loaded
```

### Recommended Folder Structure

```
your-workspace/
├── configs/
│   ├── controller.yaml
│   ├── runner-sets/
│   │   └── tsvi-solutions-runners.yaml
│   └── policies/                          # 👈 Policy configuration directory
│       ├── arc-policy-config.json         # Main policy configuration
│       ├── production-overrides.json      # Production-specific overrides
│       └── development-overrides.json     # Development-specific overrides
```

### Configuration File Format

Create `configs/policies/arc-policy-config.json`:

```json
{
  "organization": {
    "name": "my-company",
    "environment": "production",
    "compliance": ["SOC2", "ISO27001"]
  },
  "global": {
    "enforcement": "strict",
    "autoFix": false,
    "excludedNamespaces": ["kube-system", "test"]
  },
  "categories": {
    "security": {
      "enabled": true,
      "enforcement": "strict",
      "autoFix": false
    },
    "compliance": {
      "enabled": true,
      "enforcement": "advisory",
      "autoFix": false
    },
    "performance": {
      "enabled": true,
      "enforcement": "advisory",
      "autoFix": true
    },
    "cost": {
      "enabled": true,
      "enforcement": "advisory",
      "autoFix": true
    },
    "operations": {
      "enabled": true,
      "enforcement": "advisory",
      "autoFix": false
    }
  },
  "ruleOverrides": {
    "arc-sec-002": {
      "enabled": true,
      "severity": "critical",
      "enforcement": "strict"
    },
    "arc-cost-001": {
      "enabled": false
    }
  },
  "customRules": [
    {
      "id": "custom-001",
      "name": "Require Company Registry",
      "description": "Runners must use images from company registry",
      "severity": "high",
      "category": "security",
      "enabled": true,
      "scope": "runnerscaleset",
      "conditions": [
        {
          "field": "spec.template.spec.containers[*].image",
          "operator": "contains",
          "value": "registry.company.com",
          "description": "Image must be from company registry"
        }
      ],
      "actions": [
        {
          "type": "deny",
          "message": "Only images from registry.company.com are allowed",
          "autoFix": false
        }
      ]
    }
  ]
}
```

### Real-World Example: Organization-Wide Runners

Many organizations prefer organization-wide runners rather than repository-scoped runners. Here's how to configure policies for this scenario:

**File**: `configs/policies/arc-policy-config.json`

```json
{
  "organization": {
    "name": "tsvi-solutions",
    "environment": "production",
    "compliance": ["SOC2"]
  },
  "global": {
    "enforcement": "strict",
    "autoFix": true,
    "excludedNamespaces": ["kube-system", "kube-public"]
  },
  "categories": {
    "security": {
      "enabled": true,
      "enforcement": "strict",
      "autoFix": true,
      "comment": "Security policies are non-negotiable"
    },
    "compliance": {
      "enabled": true,
      "enforcement": "advisory",
      "autoFix": false,
      "comment": "Compliance warnings only - not blocking"
    },
    "performance": {
      "enabled": true,
      "enforcement": "advisory",
      "autoFix": true,
      "comment": "Auto-fix performance issues where possible"
    }
  },
  "ruleOverrides": {
    "arc-comp-001": {
      "enabled": false,
      "comment": "We intentionally use org-wide runners for shared infrastructure"
    },
    "arc-013-005": {
      "enabled": false,
      "comment": "Not using Azure Key Vault - running on local Kubernetes"
    },
    "arc-013-001": {
      "enabled": true,
      "enforcement": "advisory",
      "comment": "Container mode optimization is recommended but not required"
    }
  }
}
```

### Using Custom Policy Configuration

#### Method 1: Auto-Discovery (Recommended)

Simply create your config file in the standard location and it will be **automatically loaded**:

```bash
# 1. Create config file in standard location
configs/policies/arc-policy-config.json

# 2. Run any validation command - config is auto-discovered!
arc_validate_policies --operation report

# 3. Confirmation message will show:
# 📁 Policy Configuration: Auto-discovered at configs/policies/arc-policy-config.json
# ✅ Custom policy configuration loaded
```

**No path specification needed!** The tool automatically checks:
- `configs/policies/arc-policy-config.json` (recommended)
- `configs/policies/arc-policy-config.yaml`
- `.arc-policy-config.json` (workspace root)
- `.arc-policy-config.yaml` (workspace root)

#### Method 2: Explicit Path (Advanced)

For non-standard locations or environment-specific configs:

```bash
# Use custom policy config from specific path
arc_validate_policies --operation report --configPath ./custom/path/policy-config.json

# Validate with custom config
arc_validate_policies --operation validate \
  --namespace arc-systems \
  --runnerScaleSetName my-runners \
  --configPath ./configs/policies/production-policy.json

# Auto-fix with custom rules
arc_validate_policies --operation auto_fix \
  --namespace arc-systems \
  --configPath ./configs/policies/dev-policy.json
  --configPath ./configs/policies/arc-policy-config.json
```

### Configuration Options Explained

#### Organization Settings

```json
"organization": {
  "name": "company-name",           // Your organization identifier
  "environment": "production",      // Environment: development, staging, production
  "compliance": ["SOC2", "ISO27001"] // Compliance frameworks you follow
}
```

#### Global Settings

```json
"global": {
  "enforcement": "strict",          // strict | advisory | disabled
  "autoFix": true,                  // Enable automatic remediation
  "excludedNamespaces": [           // Namespaces to skip validation
    "kube-system", 
    "kube-public"
  ]
}
```

**Enforcement Modes**:
- **strict**: Violations block operations (future feature)
- **advisory**: Violations generate warnings only
- **disabled**: Category is completely disabled

#### Category Configuration

Each category can be independently configured:

```json
"categories": {
  "security": {
    "enabled": true,              // Enable/disable entire category
    "enforcement": "strict",      // strict | advisory | disabled
    "autoFix": true              // Allow auto-remediation for this category
  }
}
```

#### Rule Overrides

Override specific rules:

```json
"ruleOverrides": {
  "arc-comp-001": {               // Rule ID
    "enabled": false,             // Disable this rule
    "severity": "low",            // Change severity (optional)
    "enforcement": "disabled",    // Override enforcement mode
    "comment": "Reason for override"
  }
}
```

### Common Override Scenarios

#### Scenario 1: Organization-Wide Runners

```json
"ruleOverrides": {
  "arc-comp-001": {
    "enabled": false,
    "comment": "We use organization-wide runners for shared CI/CD infrastructure"
  }
}
```

#### Scenario 2: Non-Azure Environment

```json
"ruleOverrides": {
  "arc-013-005": {
    "enabled": false,
    "comment": "Not using Azure Key Vault - running on-premises"
  }
}
```

#### Scenario 3: Development Environment

```json
"ruleOverrides": {
  "arc-perf-001": {
    "enforcement": "advisory",
    "comment": "Resource limits recommended but not enforced in dev"
  },
  "arc-sec-001": {
    "enforcement": "advisory",
    "comment": "Security context warnings only in development"
  }
}
```

#### Scenario 4: Lenient Cost Policies

```json
"categories": {
  "cost": {
    "enabled": true,
    "enforcement": "advisory",
    "autoFix": false,
    "comment": "Cost optimization suggestions only"
  }
}
```

### Environment-Specific Configurations

Create separate configurations for each environment:

**Production**: `configs/policies/production-policy.json`
```json
{
  "organization": {
    "environment": "production"
  },
  "global": {
    "enforcement": "strict",
    "autoFix": false
  },
  "categories": {
    "security": {
      "enforcement": "strict"
    },
    "compliance": {
      "enforcement": "strict"
    }
  }
}
```

**Development**: `configs/policies/development-policy.json`
```json
{
  "organization": {
    "environment": "development"
  },
  "global": {
    "enforcement": "advisory",
    "autoFix": true
  },
  "categories": {
    "security": {
      "enforcement": "advisory"
    },
    "compliance": {
      "enforcement": "disabled"
    }
  }
}
```

### Version Control Best Practices

1. **Store in Git**: Keep policy configs in your repository
```bash
git add configs/policies/arc-policy-config.json
git commit -m "feat: add ARC policy configuration"
```

2. **Review Changes**: Use PRs for policy changes
```bash
git checkout -b update-arc-policies
# Edit configs/policies/arc-policy-config.json
git add configs/policies/
git commit -m "chore: disable repository scoping requirement"
git push origin update-arc-policies
# Create PR for team review
```

3. **Document Overrides**: Always add comments explaining why rules are disabled
```json
"ruleOverrides": {
  "arc-comp-001": {
    "enabled": false,
    "comment": "Approved by security team on 2025-11-01 - Ticket SEC-1234"
  }
}
```

### Validating Your Configuration

Before using a custom policy config, validate its structure:

```bash
# The tool will automatically validate the configuration file
arc_validate_policies --operation report --configPath ./configs/policies/arc-policy-config.json

# Look for configuration validation errors in the output
```

### Benefits of External Policy Configuration

✅ **Version Control** - Track policy changes in Git history  
✅ **Team Collaboration** - Review policy changes via pull requests  
✅ **Environment Flexibility** - Different policies for dev/staging/prod  
✅ **No Server Restart** - Policy updates apply immediately  
✅ **Audit Trail** - Git commits provide change history  
✅ **Documentation** - Comments explain business decisions  
✅ **Compliance** - Demonstrate governance practices

## 📊 Understanding Compliance Reports

### Compliance Score

The compliance score is calculated as:

```
Compliance Score = (Passed Rules / Total Rules) × 100
```

**Score Interpretation:**
- **90-100%**: ✅ Excellent - Production ready
- **70-89%**: ⚠️ Good - Minor improvements needed
- **50-69%**: ⚠️ Fair - Significant issues to address
- **Below 50%**: ❌ Poor - Critical issues require immediate attention

### Violation Severity Levels

| Severity | Symbol | Description | Action Required |
|----------|--------|-------------|-----------------|
| **Critical** | 🔴 | Security vulnerabilities or compliance violations | Immediate remediation required |
| **High** | 🟠 | Significant issues affecting security or performance | Address within 24-48 hours |
| **Medium** | 🟡 | Moderate issues that should be resolved | Plan remediation within 1 week |
| **Low** | 🟢 | Best practice recommendations | Address as time permits |

## 🛠️ Auto-Fix Capabilities

The policy engine can automatically remediate certain violations:

### Auto-Fixable Violations

- Adding security contexts
- Setting resource limits
- Removing privileged flags
- Adding required labels
- Configuring autoscaling

### Manual Remediation Required

- GitHub token configuration (requires secrets)
- Repository scoping (requires GitHub configuration)
- Runner group assignment (requires organizational setup)
- Custom security contexts (requires environment-specific config)

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: ARC Compliance Check
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  pull_request:
    paths:
      - 'configs/runner-sets/**'

jobs:
  validate-policies:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Run Policy Validation
        uses: your-org/arc-mcp-action@v1
        with:
          operation: report
          namespace: arc-systems
          fail-on-violations: true
          severity-threshold: high
```

## 📈 Best Practices

### 1. Regular Compliance Audits

Run compliance reports regularly:

```bash
# Daily compliance check
arc_validate_policies --operation report > compliance-$(date +%Y%m%d).md
```

### 2. Pre-Deployment Validation

Validate before applying changes:

```bash
# Before deploying new RunnerScaleSet
arc_validate_policies --operation validate --namespace arc-systems --runnerScaleSetName new-runners
```

### 3. Severity-Based Enforcement

Focus on critical and high severity issues first:

```bash
# List critical violations only
arc_validate_policies --operation list_violations --severity critical
```

### 4. Category-Specific Reviews

Review policies by category:

```bash
# Security-focused review
arc_validate_policies --operation list_violations --category security

# Cost optimization review
arc_validate_policies --operation list_violations --category cost
```

## 🎯 Common Use Cases

### SOC2 Compliance

```bash
# Generate SOC2 compliance report
arc_validate_policies --operation report --namespace production

# Focus on security and compliance categories
arc_validate_policies --operation list_violations --category security
arc_validate_policies --operation list_violations --category compliance
```

### Security Audit

```bash
# Comprehensive security check
arc_validate_policies --operation list_violations --category security --severity high

# Review privileged runner usage
# (Check for arc-sec-002 violations)
```

### Cost Optimization

```bash
# Identify cost optimization opportunities
arc_validate_policies --operation list_violations --category cost

# Check autoscaling configuration
# (Review arc-cost-001 and arc-cost-002)
```

### Performance Tuning

```bash
# Performance policy review
arc_validate_policies --operation list_violations --category performance

# Identify resource limit issues
# (Check arc-perf-001, arc-perf-002, arc-perf-003)
```

## 🚨 Troubleshooting

### Issue: "RunnerScaleSet not found"

**Solution**: Verify the resource exists:
```bash
kubectl get runnerscalesets -n arc-systems
```

### Issue: "Permission denied"

**Solution**: Ensure your kubeconfig has access to custom resources:
```bash
kubectl auth can-i list runnerscalesets.actions.github.com
```

### Issue: "Too many violations"

**Solution**: Focus on critical issues first:
```bash
arc_validate_policies --operation list_violations --severity critical
```

### Issue: "Auto-fix not working"

**Note**: Auto-fix is currently in preview mode. Some violations require manual remediation due to dependencies on external configurations (GitHub secrets, organization settings, etc.).

## 📖 Related Documentation

- [Policy as Code](POLICY_AS_CODE.md) - External policy configuration guide
- [External Policy Configuration](EXTERNAL_POLICY_CONFIG.md) - Detailed policy configuration reference
- [Security Best Practices](../README.md#-security--best-practices) - ARC security guidelines
- [Compliance Framework](../README.md#roadmap) - Upcoming compliance features

## 📚 Quick Reference

### Common Commands

```bash
# Generate report with custom policy
arc_validate_policies --operation report \
  --configPath ./configs/policies/arc-policy-config.json

# List all policy rules
arc_validate_policies --operation list_rules

# View current violations
arc_validate_policies --operation list_violations --severity high

# Auto-fix with custom config
arc_validate_policies --operation auto_fix \
  --namespace arc-systems \
  --configPath ./configs/policies/arc-policy-config.json

# Validate specific runner set
arc_validate_policies --operation validate \
  --namespace arc-systems \
  --runnerScaleSetName my-runners \
  --configPath ./configs/policies/arc-policy-config.json
```

### Policy Configuration File Locations

```bash
# Recommended location
./configs/policies/arc-policy-config.json

# Environment-specific configs
./configs/policies/production-policy.json
./configs/policies/development-policy.json
./configs/policies/staging-policy.json
```

### Rule Override Quick Reference

```json
{
  "ruleOverrides": {
    "arc-comp-001": {
      "enabled": false,
      "comment": "Org-wide runners intentional"
    },
    "arc-013-005": {
      "enabled": false,
      "comment": "Not using Azure Key Vault"
    },
    "arc-perf-001": {
      "enforcement": "advisory",
      "comment": "Resource limits advisory in dev"
    }
  }
}
```

### Example Configurations by Use Case

#### Local Development
```json
{
  "global": { "enforcement": "advisory", "autoFix": true },
  "ruleOverrides": {
    "arc-013-005": { "enabled": false },
    "arc-comp-001": { "enabled": false }
  }
}
```

#### Production (Strict)
```json
{
  "global": { "enforcement": "strict", "autoFix": false },
  "categories": {
    "security": { "enforcement": "strict" },
    "compliance": { "enforcement": "strict" }
  }
}
```

#### Cost-Conscious Environment
```json
{
  "categories": {
    "cost": { "enabled": true, "enforcement": "strict" },
    "performance": { "enabled": true, "enforcement": "strict" }
  }
}
```

---

## 🎨 Policy Configuration Generator

> **✨ Create validated policy configurations in seconds**

The `arc_generate_policy_config` tool creates customized policy configuration files with intelligent defaults based on your environment and requirements.

### Basic Usage

```bash
# Generate with defaults (development config in configs/policies/)
arc_generate_policy_config

# Specify organization and environment
arc_generate_policy_config \
  --organizationName "acme-corp" \
  --environment production

# Production config with strict enforcement
arc_generate_policy_config \
  --organizationName "acme-corp" \
  --environment production \
  --enforcementLevel strict \
  --enableAutoFix false
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `organizationName` | string | `"my-organization"` | GitHub organization name |
| `environment` | string | `"development"` | Environment: `development`, `staging`, `production` |
| `enforcementLevel` | string | `"advisory"` (dev)<br>`"strict"` (prod) | Enforcement level: `advisory`, `strict`, `disabled` |
| `enableAutoFix` | boolean | `true` (dev)<br>`false` (prod) | Enable automatic violation fixes |
| `disableRules` | string[] | `[]` | Array of rule IDs to disable |
| `customCategories` | object | See below | Custom category configurations |
| `outputPath` | string | `configs/policies/arc-policy-config.json` | Output file path |

### Environment-Specific Defaults

#### Development Environment
```json
{
  "organization": { "environment": "development", "compliance": "internal" },
  "global": { "enforcement": "advisory", "autoFix": true },
  "categories": { "security": { "enforcement": "advisory" } }
}
```

#### Production Environment
```json
{
  "organization": { "environment": "production", "compliance": "enterprise" },
  "global": { "enforcement": "strict", "autoFix": false },
  "categories": { "security": { "enforcement": "strict" } }
}
```

### Advanced Examples

#### Disable Specific Rules
```bash
arc_generate_policy_config \
  --organizationName "startup-inc" \
  --environment development \
  --disableRules '["arc-comp-001", "arc-013-005"]'
```

Generates:
```json
{
  "ruleOverrides": {
    "arc-comp-001": {
      "enabled": false,
      "comment": "Disabled via generator"
    },
    "arc-013-005": {
      "enabled": false,
      "comment": "Disabled via generator"
    }
  }
}
```

#### Custom Category Configuration
```bash
arc_generate_policy_config \
  --customCategories '{
    "security": {"enforcement": "strict", "enabled": true},
    "cost": {"enforcement": "advisory", "enabled": true},
    "performance": {"enforcement": "disabled", "enabled": false}
  }'
```

#### Custom Output Location
```bash
# Generate in a specific location
arc_generate_policy_config \
  --organizationName "my-team" \
  --outputPath "./team-policies/custom-config.json"

# Generate for staging
arc_generate_policy_config \
  --environment staging \
  --outputPath "configs/policies/staging-policy.json"
```

### What Gets Generated

The tool creates a complete policy configuration file with:

- **Organization metadata** (name, environment, compliance level)
- **Global settings** (enforcement level, auto-fix, excluded namespaces)
- **Category configurations** (security, compliance, performance, cost, operations, networking)
- **Rule overrides** (disabled rules with comments)
- **Intelligent defaults** based on environment (dev vs staging vs production)

### Example Output

```json
{
  "organization": {
    "name": "acme-corp",
    "environment": "production",
    "compliance": "enterprise"
  },
  "global": {
    "enforcement": "strict",
    "autoFix": false,
    "excludedNamespaces": ["kube-system", "kube-public"]
  },
  "categories": {
    "security": {
      "enabled": true,
      "enforcement": "strict"
    },
    "compliance": {
      "enabled": true,
      "enforcement": "strict"
    },
    "performance": {
      "enabled": true,
      "enforcement": "advisory"
    },
    "cost": {
      "enabled": true,
      "enforcement": "advisory"
    }
  },
  "ruleOverrides": {}
}
```

### Integration with Auto-Discovery

Generated configs are automatically placed in `configs/policies/arc-policy-config.json` by default, which is the **first location** checked by auto-discovery. This means:

1. Run `arc_generate_policy_config` once
2. Policy config is created in the recommended location
3. All future validation commands automatically use it
4. No need to specify `--configPath` manually

### Workflow Example

```bash
# 1. Generate your initial policy config
arc_generate_policy_config --organizationName "my-org" --environment production

# 2. Review the generated file
cat configs/policies/arc-policy-config.json

# 3. Run validation (auto-discovers your config)
arc_validate_policies --operation report

# 4. Apply auto-fixes with your custom rules
arc_validate_policies --operation auto_fix

# 5. Adjust config as needed and re-validate
# Edit configs/policies/arc-policy-config.json
arc_validate_policies --operation report
```

### Tips

- **Start with development defaults**: Use `--environment development` for initial setup, then tighten rules for production
- **Use version control**: Commit generated configs to track policy evolution
- **Create environment-specific configs**: Generate separate files for dev/staging/prod
- **Iterate on rules**: Start permissive, disable noisy rules, then increase enforcement gradually
- **Document overrides**: The generator adds comments for disabled rules; expand these with team-specific context

---

## 📚 Key Takeaways

### Auto-Discovery Feature

✅ **Zero Configuration Required**
- Create `configs/policies/arc-policy-config.json`
- Run any validation command
- Config is automatically loaded
- No path specification needed

✅ **Flexible Locations**
The tool checks (in order):
1. `configs/policies/arc-policy-config.json` ⭐ Recommended
2. `configs/policies/arc-policy-config.yaml`
3. `.arc-policy-config.json` (workspace root)
4. `.arc-policy-config.yaml` (workspace root)

✅ **Version Control Friendly**
- Store policies alongside your ARC configs
- Track changes in Git
- Share with your team
- Environment-specific configurations

### Common Workflows

**Initial Setup:**
```bash
mkdir -p configs/policies
cat > configs/policies/arc-policy-config.json << 'EOF'
{ "organization": { "name": "my-org", "environment": "production" } }
EOF
```

**Daily Usage:**
```bash
# Just run validation - config is auto-loaded
arc_validate_policies --operation report
arc_validate_policies --operation auto_fix
```

**Override for Testing:**
```bash
# Use a different config temporarily
arc_validate_policies --operation report --configPath ./test-config.json
```

---

## 🤝 Contributing

Want to add custom policies? See our [Contributing Guide](../README.md#-contributing) for details on extending the policy engine.

---

**Questions or Issues?** [Create an issue](https://github.com/tsviz/arc-config-mcp/issues/new) or check the [Discussions](https://github.com/tsviz/arc-config-mcp/discussions).
