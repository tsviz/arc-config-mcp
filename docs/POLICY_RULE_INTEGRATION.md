# ARC Policy Rule Integration Guide

## Overview

The ARC MCP server includes a comprehensive policy engine with **18 built-in policy rules** that validate GitHub Actions Runner Controller (ARC) deployments. This guide explains how policy configuration generation integrates with the policy engine's rules.

## Quick Start

### List All Available Rules

```bash
# List all 18 built-in policy rules
arc_validate_policies --operation list_rules

# Filter by category
arc_validate_policies --operation list_rules --category security
arc_validate_policies --operation list_rules --category compliance
arc_validate_policies --operation list_rules --category performance
arc_validate_policies --operation list_rules --category cost
arc_validate_policies --operation list_rules --category operations
arc_validate_policies --operation list_rules --category networking
```

### Generate Policy Configuration

```bash
# Natural language (recommended)
arc_policy_config_generate --query "development environment"
arc_policy_config_generate --query "HIPAA healthcare production"
arc_policy_config_generate --query "AI machine learning research"

# Explicit environment parameter (24 types supported)
arc_policy_config_generate --environment development
arc_policy_config_generate --environment hipaa
arc_policy_config_generate --environment aiml
```

## Built-in Policy Rules (18 Total)

### 🔒 Security Rules (6)

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `arc-sec-001` | High | Require Runner Security Context |
| `arc-sec-002` | Critical | Prohibit Privileged Runners |
| `arc-sec-003` | Critical | Require GitHub Token Secret |
| `arc-013-003` | High | JIT Token Security |
| `arc-013-005` | Medium | Azure Key Vault Integration |
| `arc-013-006` | Medium | OpenShift Compatibility |

### 📊 Performance Rules (4)

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `arc-res-001` | Medium | Require Runner Resource Limits |
| `arc-013-001` | Medium | Container Mode Configuration |
| `arc-013-007` | Low | Container Lifecycle Hooks |
| `arc-scale-002` | Low | Minimum Replicas Configuration |

### 💰 Cost Rules (2)

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `arc-res-002` | Medium | Reasonable Runner CPU Limits |
| `arc-scale-001` | Medium | Reasonable Max Replicas |

### ⚙️ Operations Rules (3)

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `arc-ops-001` | Low | Require Runner Labels |
| `arc-013-002` | Low | Enhanced Metrics Labels |
| `arc-ops-002` | Medium | Valid Runner Image |

### 🌐 Networking Rules (1)

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `arc-013-004` | Low | Dual-Stack Networking Support |

### 📋 Compliance Rules (2)

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `arc-comp-001` | High | GitHub Repository Scope |
| `arc-comp-002` | Medium | Required Runner Group |

## How Policy Config Generation Works

### The Integration Problem (Fixed)

**Before:** Generated policy configs only included category-level enforcement settings (e.g., `security: strict`, `compliance: advisory`), but the policy engine didn't read these categories. It only looked for `ruleOverrides` and `customRules` sections.

**After:** The `arc_policy_config_generate` tool now includes a `generateRuleOverrides()` function that maps category enforcement to individual rule settings.

### Category-to-Rule Mapping

The tool automatically generates `ruleOverrides` based on category enforcement levels:

**Strict Enforcement:**
- Security/Compliance rules → `severity: "critical"`
- Performance/Operations rules → `severity: "high"`
- Cost/Networking rules → `severity: "high"`

**Advisory Enforcement:**
- All rules → `severity: "medium"` (warnings only)

**Disabled Enforcement:**
- All rules → `enabled: false`

### Example: Development vs HIPAA

**Development Environment:**
```json
{
  "categories": {
    "security": { "enforcement": "advisory" },
    "compliance": { "enforcement": "disabled" }
  },
  "ruleOverrides": {
    "arc-sec-001": { "enabled": true, "severity": "medium" },
    "arc-sec-002": { "enabled": true, "severity": "medium" },
    "arc-comp-001": { "enabled": false }
  }
}
```

**HIPAA Environment:**
```json
{
  "categories": {
    "security": { "enforcement": "strict" },
    "compliance": { "enforcement": "strict" }
  },
  "ruleOverrides": {
    "arc-sec-001": { "enabled": true, "severity": "critical" },
    "arc-sec-002": { "enabled": true, "severity": "critical" },
    "arc-comp-001": { "enabled": true, "severity": "critical" }
  }
}
```

## Supported Environments (24 Types)

The tool supports 24 different environment types with pre-configured policy profiles:

### Core Environments
- **development** - Fast iteration, relaxed policies, auto-fix enabled
- **staging** - Balanced policies, testing production-like settings
- **production** - Strict enforcement, compliance required, HA enforced

### Compliance-Specific
- **fedramp** / **fedramp-high** / **fedramp-moderate** - Federal government (NIST 800-53, FIPS 140-2)
- **hipaa** - Healthcare (PHI protection, HITECH, SOC2 Type II)
- **pci-dss** - Payment card industry (PCI-DSS, ISO27001)
- **sox** - Sarbanes-Oxley compliance
- **gdpr** - EU data protection

### Industry-Specific
- **financial** - Financial services (PCI-DSS, SOC2, ISO27001)
- **healthcare** - Healthcare systems (HIPAA, reliability focus)
- **government** - Government/public sector
- **education** - Educational institutions

### Infrastructure Types
- **edge** / **iot** / **embedded** - Resource-constrained (500m CPU, 1Gi memory)
- **multi-tenant** - Multi-tenant SaaS platforms

### Organization Sizes
- **startup** - Fast iteration, aggressive cost control
- **enterprise** - Large-scale, strict governance (8 CPU, 16Gi memory)

### Workload Types
- **aiml** / **research** - AI/ML workloads (16 CPU, 64Gi memory, GPU support)

### Security Levels
- **high-security** / **zero-trust** / **air-gapped** - Maximum security posture

## Natural Language Detection

The tool supports natural language queries with keyword matching:

```bash
# Development
"for development purposes", "dev environment", "local testing"

# HIPAA
"hipaa", "healthcare", "PHI protection"

# FedRAMP
"fedramp", "federal", "government cloud"

# AI/ML
"AI", "machine learning", "ML workloads", "GPU"

# Edge
"edge computing", "IoT", "embedded systems"
```

## Configuration File Structure

Generated configs at `configs/policies/arc-policy-config.json` include:

```json
{
  "organization": {
    "name": "my-organization",
    "environment": "hipaa",
    "compliance": ["HIPAA", "HITECH", "SOC2 Type II"]
  },
  "global": {
    "enforcement": "strict",
    "autoFix": false,
    "excludedNamespaces": ["kube-system", "kube-public", "kube-node-lease"]
  },
  "categories": {
    "security": {
      "enabled": true,
      "enforcement": "strict",
      "autoFix": false,
      "description": "PHI protection required"
    }
  },
  "ruleOverrides": {
    "arc-sec-001": {
      "enabled": true,
      "severity": "critical",
      "autoFix": false
    }
  },
  "limits": {
    "maxCpu": "4000m",
    "maxMemory": "8Gi",
    "minReplicas": 3,
    "maxReplicas": 50
  }
}
```

## Auto-Discovery

Policy configs are automatically discovered from standard locations:
- `configs/policies/arc-policy-config.json`
- `configs/policies/arc-policy-config.yaml`
- `configs/policies/policy-config.json`
- `configs/policies/policy-config.yaml`

The `arc_validate_policies` tool automatically loads your config without additional parameters.

## Validation Workflow

1. **Generate Config:**
   ```bash
   arc_policy_config_generate --query "HIPAA healthcare"
   ```

2. **List Rules:**
   ```bash
   arc_validate_policies --operation list_rules
   ```

3. **Validate Deployment:**
   ```bash
   arc_validate_policies --operation validate --namespace arc-systems --runnerScaleSetName my-runners
   ```

4. **Generate Compliance Report:**
   ```bash
   arc_validate_policies --operation report
   ```

5. **Auto-Fix Violations:**
   ```bash
   arc_validate_policies --operation auto_fix --namespace arc-systems
   ```

## Customizing Rules

### Override Specific Rules

Add rule-specific overrides to your config:

```json
{
  "ruleOverrides": {
    "arc-sec-001": {
      "enabled": true,
      "severity": "critical",
      "autoFix": true
    },
    "arc-ops-001": {
      "enabled": false,
      "comment": "Labels not required in dev"
    }
  }
}
```

### Add Custom Rules

```json
{
  "customRules": [
    {
      "id": "custom-001",
      "name": "My Custom Rule",
      "description": "Organization-specific requirement",
      "severity": "high",
      "category": "compliance",
      "enabled": true,
      "scope": "runnerscaleset",
      "conditions": [
        {
          "field": "metadata.annotations['company.com/approved']",
          "operator": "equals",
          "value": "true"
        }
      ],
      "actions": [
        {
          "type": "deny",
          "message": "Deployment must be approved"
        }
      ]
    }
  ]
}
```

## Implementation Details

### Code Location

- **Policy Engine:** `src/engines/policy-engine.ts` - Contains 18 built-in rules
- **Config Generation:** `src/tools/enhanced-tools.ts` - `arc_policy_config_generate` tool
- **Rule Override Logic:** `generateRuleOverrides()` function in `enhanced-tools.ts`

### Rule Category Mapping

```typescript
const ruleCategoryMap = {
  'arc-sec-001': 'security',
  'arc-sec-002': 'security',
  'arc-sec-003': 'security',
  'arc-013-003': 'security',
  'arc-013-005': 'security',
  'arc-013-006': 'security',
  'arc-res-001': 'performance',
  'arc-013-001': 'performance',
  'arc-013-007': 'performance',
  'arc-scale-002': 'performance',
  'arc-res-002': 'cost',
  'arc-scale-001': 'cost',
  'arc-ops-001': 'operations',
  'arc-ops-002': 'operations',
  'arc-013-002': 'operations',
  'arc-comp-001': 'compliance',
  'arc-comp-002': 'compliance',
  'arc-013-004': 'networking'
};
```

## Troubleshooting

### Rules Not Being Applied

**Problem:** Generated config doesn't affect policy validation

**Solution:** Ensure `ruleOverrides` section is included in your config. Regenerate using the latest version of the tool (v2.4.4+).

### Config Not Auto-Discovered

**Problem:** Policy engine uses default rules instead of your config

**Solution:** 
- Place config in `configs/policies/arc-policy-config.json`
- Check file syntax with `jq . configs/policies/arc-policy-config.json`
- Restart MCP server after changes

### Wrong Severity Levels

**Problem:** Rules have unexpected severity in validation

**Solution:** Check your `ruleOverrides` section - it takes precedence over category enforcement.

## Examples

### Development Team Setup

```bash
# Generate dev config
arc_policy_config_generate --query "development environment"

# Result: Advisory warnings, auto-fix enabled, no limits
# - Security: medium severity (warnings)
# - Compliance: disabled
# - Cost: disabled
```

### HIPAA Healthcare Production

```bash
# Generate HIPAA config  
arc_policy_config_generate --query "HIPAA healthcare production"

# Result: Strict enforcement, PHI protection
# - Security: critical severity (blocks deployment)
# - Compliance: critical severity (blocks deployment)
# - Performance: high severity (enforced)
# - minReplicas: 3 (HA required)
```

### AI/ML Research Environment

```bash
# Generate AI/ML config
arc_policy_config_generate --query "AI machine learning research"

# Result: Flexible policies, high resources
# - Security: advisory (medium)
# - Compliance: disabled
# - maxCpu: 16000m (16 cores)
# - maxMemory: 64Gi
```

## Summary

✅ **18 built-in policy rules** covering security, compliance, performance, cost, operations, and networking

✅ **24 environment types** with pre-configured profiles

✅ **Automatic rule override generation** based on category enforcement

✅ **Natural language support** for intuitive configuration

✅ **Auto-discovery** of policy configs from standard locations

✅ **Full integration** between config generation and policy engine validation

The policy system now properly leverages all rules, ensuring that your environment-specific configurations (development, HIPAA, AI/ML, etc.) actually affect the policy validation behavior.
