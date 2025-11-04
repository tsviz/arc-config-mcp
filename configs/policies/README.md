# ARC Policy Configuration

This directory contains policy configuration files for your ARC deployment.

## 📁 Files

- **`arc-policy-config.json`** - Main policy configuration for tsvi-solutions
- Add environment-specific configs here as needed

## 🎯 Purpose

Policy configuration files allow you to:
- Override default policy rules
- Disable rules that don't apply to your environment
- Customize severity levels and enforcement modes
- Control auto-fix behavior
- Document business decisions and exceptions

## 🚀 Usage

### Apply Custom Policy Configuration

```bash
# Use with validation
arc_validate_policies --operation report \
  --configPath ./configs/policies/arc-policy-config.json

# Use with auto-fix
arc_validate_policies --operation auto_fix \
  --namespace arc-systems \
  --configPath ./configs/policies/arc-policy-config.json
```

### Current Configuration

The current `arc-policy-config.json` is configured for:
- **Organization**: tsvi-solutions
- **Environment**: Production
- **Enforcement**: Strict for security, advisory for compliance/performance
- **Auto-fix**: Enabled globally

### Key Overrides

1. **`arc-comp-001` (Repository Scoping)** - Disabled
   - Reason: Organization-wide runners are intentional for shared infrastructure
   
2. **`arc-013-005` (Azure Key Vault)** - Disabled
   - Reason: Not using Azure - running on Docker Desktop / local Kubernetes
   
3. **`arc-perf-001` (Resource Limits)** - Advisory only
   - Reason: Resource limits recommended but not enforced in dev environment

## 📝 Customization

### Disable a Rule

```json
"ruleOverrides": {
  "arc-comp-001": {
    "enabled": false,
    "comment": "Explain why this rule doesn't apply"
  }
}
```

### Change Severity

```json
"ruleOverrides": {
  "arc-ops-001": {
    "severity": "high",
    "comment": "Runner images are critical for our org"
  }
}
```

### Change Enforcement Mode

```json
"categories": {
  "compliance": {
    "enforcement": "advisory",
    "comment": "Compliance warnings only, not blocking"
  }
}
```

## 🔄 Version Control

Policy configurations are stored in Git for:
- ✅ Audit trail of policy changes
- ✅ Team review via pull requests
- ✅ Rollback capability
- ✅ Documentation of business decisions

## 📖 Documentation

See [POLICY_VALIDATION.md](../../docs/POLICY_VALIDATION.md) for complete documentation on:
- Available policy rules
- Configuration options
- Common use cases
- Best practices

## 🤝 Team Workflow

1. **Propose Changes**: Create a branch and edit policy config
2. **Document Reason**: Add comments explaining why
3. **Create PR**: Submit for team review
4. **Apply**: After approval, use the updated config

Example:
```bash
git checkout -b policy/disable-azure-keyvault
# Edit arc-policy-config.json
git add configs/policies/
git commit -m "chore: disable Azure Key Vault policy - not applicable"
git push origin policy/disable-azure-keyvault
# Create PR for review
```
