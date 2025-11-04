# Release Notes - Version 2.5.0

**Release Date:** November 3, 2025

## 🎯 Major Feature: Policy Rule Integration & Enhanced Configuration

This major release delivers full integration between policy configuration generation and the policy engine's built-in rules, along with comprehensive policy management tooling and enterprise-grade GitOps/hybrid deployment workflows.

### 🚀 Highlights

- ✅ **18 Built-in Policy Rules** fully integrated with config generation
- ✅ **24 Environment Profiles** (dev, HIPAA, FedRAMP, AI/ML, edge, etc.)
- ✅ **GitOps Workflow** with version-controlled infrastructure configs
- ✅ **Policy Listing Tool** to view and filter all available rules
- ✅ **Complete Documentation** for policy integration and hybrid workflows
- ✅ **Natural Language Support** for intuitive configuration
- ✅ **Drift Detection** to ensure configs match deployed state

### ✨ New Features

#### Policy Rule Integration
- **Complete Rule Override System**: Policy configuration now properly integrates with all 18 built-in policy rules
  - Added `generateRuleOverrides()` function that maps category enforcement to individual rule settings
  - Category-level enforcement (`security: strict`, `compliance: advisory`) now automatically generates rule-specific overrides
  - Strict enforcement → `severity: "critical"` for security/compliance, `"high"` for others
  - Advisory enforcement → `severity: "medium"` (warnings only)
  - Disabled enforcement → `enabled: false` for all category rules

- **18 Built-in Policy Rules** properly exposed and manageable:
  - 🔒 Security (6 rules): arc-sec-001, arc-sec-002, arc-sec-003, arc-013-003, arc-013-005, arc-013-006
  - 📊 Performance (4 rules): arc-res-001, arc-013-001, arc-013-007, arc-scale-002
  - 💰 Cost (2 rules): arc-res-002, arc-scale-001
  - ⚙️ Operations (3 rules): arc-ops-001, arc-013-002, arc-ops-002
  - 🌐 Networking (1 rule): arc-013-004
  - 📋 Compliance (2 rules): arc-comp-001, arc-comp-002

#### Enhanced Policy Configuration Tool
- **24 Environment Types** supported with pre-configured profiles:
  - Core: `development`, `staging`, `production`
  - Compliance: `fedramp`, `fedramp-high`, `fedramp-moderate`, `hipaa`, `pci-dss`, `sox`, `gdpr`
  - Industry: `financial`, `healthcare`, `government`, `education`
  - Infrastructure: `edge`, `iot`, `embedded`, `multi-tenant`
  - Organization: `startup`, `enterprise`
  - Workload: `aiml`, `research`
  - Security: `high-security`, `zero-trust`, `air-gapped`

- **Natural Language Detection**: Intuitive environment detection from queries
  - "for development purposes" → development
  - "HIPAA healthcare" → hipaa
  - "AI machine learning" → aiml
  - "edge computing" → edge

#### Policy Listing Tool
- **New Operation**: `arc_validate_policies --operation list_rules`
  - Lists all 18 built-in policy rules with details
  - Filter by category: `--category security`, `--category compliance`, etc.
  - Shows rule ID, name, severity, scope, enabled status, and description
  - Provides usage examples for validation and remediation

#### GitOps/Hybrid Deployment Model
- **Configuration Version Control**: All deployments now generate versioned config files
  - Controller configs: `configs/controller.yaml`
  - Runner set configs: `configs/runner-sets/{name}.yaml`
  - Policy configs: `configs/policies/arc-policy-config.json`
  - Configs tracked in Git for full audit history

- **Three Deployment Modes**:
  1. **Direct Mode**: Generate and apply immediately (default, `--apply true`)
  2. **GitOps Mode**: Generate configs only for manual review (`--apply false`)
  3. **Hybrid Mode**: Generate, review, then apply with `arc_apply_config` tool

- **Benefits of GitOps Workflow**:
  - 📝 **Review Before Apply**: Human review of all infrastructure changes
  - 🔄 **Version Control**: Full Git history of configuration changes
  - 🔙 **Easy Rollback**: Revert to previous configs with Git
  - 🤝 **Team Collaboration**: Pull requests for infrastructure changes
  - 🔒 **Audit Trail**: Complete record of who changed what and when
  - 🚀 **CI/CD Integration**: Automated application via pipelines

- **Config File Structure**:
  ```yaml
  chart:
    repository: oci://ghcr.io/actions/...
    name: gha-runner-scale-set-controller
    version: latest
  release:
    name: arc-controller
    namespace: arc-systems
    createNamespace: true
  values:
    # Custom Helm values here
    replicaCount: 2
    resources:
      limits:
        cpu: "2000m"
  metadata:
    managedBy: arc-config-mcp
    mode: hybrid
    generatedAt: '2025-11-03T...'
  ```

- **Apply Configs to Cluster**: New `arc_apply_config` tool
  - Reads config files from `configs/` directory
  - Builds appropriate Helm commands with custom values
  - Executes deployment to Kubernetes cluster
  - Supports drift detection and reconciliation

### 🐛 Bug Fixes

#### ESM Module Compatibility
- **Fixed `require()` usage in arc_validate_policies tool**
  - Replaced CommonJS `require('fs-extra')` and `require('path')` with async ESM imports
  - Added proper module unwrapping: `const fs = fsModule.default || fsModule`
  - Resolved "require is not defined" error in policy validation operations

### 📚 Documentation

#### New Documentation
- **POLICY_RULE_INTEGRATION.md**: Comprehensive guide covering:
  - Complete listing of 18 built-in policy rules
  - How policy config generation integrates with policy engine
  - All 24 environment types with detailed descriptions
  - Category-to-rule mapping logic
  - Natural language detection patterns
  - Configuration file structure and examples
  - Validation workflows and troubleshooting
  - Customization guide for rule overrides and custom rules

#### Enhanced Hybrid/GitOps Documentation
- **HYBRID_WORKFLOW_CLARITY.md**: Detailed explanation of the hybrid deployment model
  - How configuration generation separates from cluster application
  - The relationship between config files and Helm commands
  - `arc_apply_config` tool workflow and implementation
  - Benefits of review-before-apply pattern
  - Git-based version control for infrastructure configs

- **HYBRID_WORKFLOW_IMPROVEMENTS_SUMMARY.md**: Summary of workflow enhancements
  - Generate → Review/Edit → Apply workflow
  - Config file structure and customization
  - Integration with CI/CD pipelines
  - Manual vs automated application options

- **HYBRID_WORKFLOW_VISUAL_GUIDE.md**: Visual workflow diagrams
  - Step-by-step visual representation
  - Decision trees for deployment modes
  - GitOps integration patterns

- **CODE_CHANGE_HYBRID_TOOLS.md**: Technical implementation details
  - Tool architecture and code structure
  - How configs are generated and applied
  - Customization examples and best practices

### 🔧 Technical Improvements

#### Code Organization
- **Rule Category Mapping**: Centralized mapping of rule IDs to categories
  ```typescript
  const ruleCategoryMap = {
    'arc-sec-001': 'security',
    'arc-res-001': 'performance',
    'arc-res-002': 'cost',
    // ... all 18 rules mapped
  };
  ```

- **Severity Assignment Logic**: Environment-specific severity levels
  - Development: All enabled rules → `medium` (advisory)
  - Production/HIPAA: Security/Compliance → `critical`, Performance/Operations → `high`, Cost → `medium`
  - Edge/IoT: Performance/Cost → `strict` (resource efficiency critical)
  - AI/ML: All → `advisory` (research flexibility)

#### Policy Engine Integration
- **applyConfiguration()** method now receives properly formatted `ruleOverrides`
  - Generated configs include both `categories` and `ruleOverrides` sections
  - Policy engine applies rule-specific overrides on top of built-in defaults
  - Custom rules can be added via `customRules` section

### 💡 Usage Examples

#### GitOps Workflow
```bash
# 1. Generate controller config (GitOps mode)
arc_install_controller_hybrid --apply false --namespace arc-systems

# 2. Review the generated config
cat configs/controller.yaml

# 3. Commit to Git for review
git add configs/controller.yaml
git commit -m "feat: Add ARC controller configuration"
git push origin feature/arc-setup

# 4. After PR approval, apply to cluster
arc_apply_config --configType controller

# 5. Generate runner set config
arc_deploy_runners_hybrid --apply false --organization myorg --runnerName prod-runners

# 6. Review and customize
vim configs/runner-sets/prod-runners.yaml

# 7. Commit and apply
git add configs/runner-sets/prod-runners.yaml
git commit -m "feat: Add production runners"
git push && arc_apply_config --configType runnerSet --name prod-runners
```

#### Generate HIPAA Policy Config
```bash
arc_policy_config_generate --query "HIPAA healthcare production"
```

Generated config includes:
- All security rules set to `critical` severity
- All compliance rules set to `critical` severity  
- Performance rules set to `high` severity
- minReplicas: 3 (HA required)
- Compliance frameworks: HIPAA, HITECH, SOC2 Type II

#### List Security Rules
```bash
arc_validate_policies --operation list_rules --category security
```

Shows all 6 security rules with current status and severity.

#### Validate with Custom Config
```bash
# Config auto-discovered from configs/policies/arc-policy-config.json
arc_validate_policies --operation validate --namespace arc-systems --runnerScaleSetName my-runners
```

#### Drift Detection
```bash
# Check if configs in Git match what's deployed
arc_detect_drift --runnerName prod-runners

# Auto-fix by regenerating missing configs
arc_detect_drift --runnerName prod-runners --autoFix true
```

### 🔄 Migration Guide

**For existing users:**

1. **Regenerate policy configurations** to get `ruleOverrides` section:
   ```bash
   arc_policy_config_generate --query "your environment type"
   ```

2. **Review generated ruleOverrides** in `configs/policies/arc-policy-config.json`

3. **Customize specific rules** if needed by adding overrides:
   ```json
   {
     "ruleOverrides": {
       "arc-sec-001": {
         "enabled": true,
         "severity": "critical",
         "autoFix": true
       }
     }
   }
   ```

4. **Validate your deployment** with the enhanced policy engine:
   ```bash
   arc_validate_policies --operation report
   ```

5. **Adopt GitOps workflow** (optional but recommended):
   ```bash
   # Generate configs without applying
   arc_install_controller_hybrid --apply false
   arc_deploy_runners_hybrid --apply false --organization myorg
   
   # Commit to Git
   git add configs/
   git commit -m "chore: Track ARC infrastructure configs"
   
   # Apply when ready
   arc_apply_config --configType controller
   arc_apply_config --configType runnerSet --name your-runner
   ```

### ⚠️ Important Notes

**Config File Location:**
- All generated configs are now stored in `configs/` directory
- Controller: `configs/controller.yaml`
- Runner sets: `configs/runner-sets/{name}.yaml`
- Policies: `configs/policies/arc-policy-config.json`
- **Recommendation**: Add `configs/` to Git for version control

**Policy Engine Changes:**
- Old policy configs without `ruleOverrides` will still work with default rule settings
- New configs automatically include `ruleOverrides` for all 18 rules
- Category enforcement now properly affects individual rules

**Hybrid Mode Default:**
- `--apply` parameter defaults to `false` for safety (GitOps mode)
- Add `--apply true` to directly install without generating configs first
- This prevents accidental direct installations without review

**Breaking Changes:**
- None - all changes are additive and backward compatible

### 📊 Statistics

- **18 built-in policy rules** fully integrated
- **24 environment types** with pre-configured profiles
- **6 policy categories**: security, compliance, performance, cost, operations, networking
- **4 severity levels**: low, medium, high, critical
- **3 enforcement modes**: disabled, advisory, strict
- **3 deployment modes**: direct, GitOps, hybrid
- **4+ documentation guides** for hybrid workflows and policy management

### 🎯 GitOps Benefits

The new hybrid deployment model enables enterprise-grade infrastructure management:

1. **🔍 Transparency**: Every change is visible in Git before being applied
2. **📜 Audit Trail**: Complete history of infrastructure changes with commit messages
3. **👥 Collaboration**: Team reviews via pull requests before deployment
4. **🔄 Reproducibility**: Same config always produces same deployment
5. **🔙 Rollback**: Instant rollback to any previous config version
6. **🤖 Automation**: CI/CD pipelines can validate and apply configs
7. **🔒 Security**: Separation of config generation from cluster application
8. **📦 Portability**: Configs work across different environments/clusters

### 🚀 What's Next

Future enhancements planned:
- Additional ARC 0.14.0 rules when available
- Custom rule templates for common organizational policies
- Policy compliance scoring and recommendations
- Integration with external policy engines (OPA, Kyverno)

### 🙏 Acknowledgments

This release represents a significant enhancement to the policy management capabilities, ensuring that environment-specific configurations properly affect policy validation behavior across all 18 built-in rules.

---

**Full Changelog:** v2.4.4...v2.5.0

**Docker Images:**
```bash
docker pull ghcr.io/tsviz/arc-config-mcp:v2.5.0
docker pull ghcr.io/tsviz/arc-config-mcp:latest
```

**Dependencies:**
- Node.js: 18-alpine
- Helm: v3.16.3
- kubectl: v1.34.1
- Kubernetes Client: v0.22.0
