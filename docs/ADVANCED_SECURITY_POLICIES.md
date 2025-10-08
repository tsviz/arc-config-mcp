# Advanced Security Policy Configuration for ARC

This configuration demonstrates enterprise-grade security policies for GitHub Actions Runner Controller (ARC) deployments.

```yaml
# arc-security-policies.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: arc-security-policies
  namespace: arc-systems
  labels:
    app.kubernetes.io/name: arc-security-policies
    app.kubernetes.io/component: policy-engine
data:
  policy-config.json: |
    {
      "organization": {
        "name": "enterprise-corp",
        "environment": "production",
        "riskTolerance": "low",
        "complianceFrameworks": ["SOC2", "ISO27001", "NIST"]
      },
      "global": {
        "enforcement": "strict",
        "auditLogging": true,
        "allowAutoFix": true,
        "notificationChannels": ["slack", "email"]
      },
      "categories": {
        "runtime-security": {
          "enabled": true,
          "enforcement": "strict",
          "policies": {
            "container-scanning": {
              "enabled": true,
              "severity": "critical",
              "maxCriticalVulns": 0,
              "maxHighVulns": 2,
              "scanInterval": "24h"
            },
            "network-monitoring": {
              "enabled": true,
              "allowedDomains": [
                "github.com",
                "api.github.com",
                "*.github.com",
                "docker.io",
                "registry-1.docker.io"
              ],
              "blockPrivateNetworks": true,
              "enableDNSLogging": true
            },
            "behavior-analysis": {
              "enabled": true,
              "detectAnomalies": true,
              "baselineWindow": "7d",
              "alertThreshold": 2.0
            }
          }
        },
        "supply-chain": {
          "enabled": true,
          "enforcement": "strict",
          "policies": {
            "action-verification": {
              "enabled": true,
              "allowedOrgs": [
                "actions",
                "github",
                "microsoft",
                "azure",
                "hashicorp",
                "docker"
              ],
              "requireSHAPinning": true,
              "maxActionAge": "1y"
            },
            "dependency-scanning": {
              "enabled": true,
              "enableDependabot": true,
              "autoUpdate": "security-only"
            }
          }
        },
        "secrets-management": {
          "enabled": true,
          "enforcement": "strict",
          "policies": {
            "token-rotation": {
              "enabled": true,
              "maxAge": "90d",
              "rotationWarning": "7d",
              "autoRotate": false
            },
            "environment-isolation": {
              "enabled": true,
              "preventCrossEnvironment": true,
              "environments": ["development", "staging", "production"]
            },
            "oidc-preferred": {
              "enabled": true,
              "requireOIDC": true,
              "allowLongLivedTokens": false
            }
          }
        },
        "access-control": {
          "enabled": true,
          "enforcement": "strict",
          "policies": {
            "just-in-time": {
              "enabled": true,
              "maxAccessDuration": "8h",
              "requireJustification": true,
              "approvalRequired": true
            },
            "least-privilege": {
              "enabled": true,
              "prohibitedVerbs": ["*", "create", "delete", "deletecollection"],
              "prohibitedResources": ["secrets", "configmaps"],
              "maxRoleBindings": 3
            },
            "rbac-review": {
              "enabled": true,
              "reviewInterval": "30d",
              "autoRevoke": true
            }
          }
        },
        "audit-monitoring": {
          "enabled": true,
          "enforcement": "advisory",
          "policies": {
            "comprehensive-logging": {
              "enabled": true,
              "logLevel": "info",
              "retentionPeriod": "90d",
              "exportToSIEM": true
            },
            "anomaly-detection": {
              "enabled": true,
              "alertOnSuspiciousActivity": true,
              "integrations": ["splunk", "datadog"]
            },
            "compliance-reporting": {
              "enabled": true,
              "reportingInterval": "weekly",
              "includeTrends": true
            }
          }
        },
        "compliance": {
          "enabled": true,
          "enforcement": "strict",
          "frameworks": {
            "SOC2": {
              "enabled": true,
              "controls": {
                "CC6.1": "logical-access-security",
                "CC6.2": "authentication-mechanisms",
                "CC6.3": "authorization-controls",
                "CC7.1": "system-operations"
              }
            },
            "ISO27001": {
              "enabled": true,
              "controls": {
                "A.9.1.1": "access-control-policy",
                "A.9.2.1": "user-registration",
                "A.12.6.1": "vulnerability-management"
              }
            },
            "NIST": {
              "enabled": true,
              "framework": "cybersecurity-framework-1.1",
              "functions": ["identify", "protect", "detect", "respond", "recover"]
            }
          }
        }
      },
      "exemptions": {
        "development": {
          "namespace": "arc-dev",
          "disabledPolicies": [
            "arc-secret-002",
            "arc-compliance-001"
          ],
          "reasoning": "Development environment with relaxed policies"
        }
      },
      "notifications": {
        "slack": {
          "webhook": "https://hooks.slack.com/services/...",
          "channel": "#security-alerts",
          "severityThreshold": "medium"
        },
        "email": {
          "recipients": ["security@company.com"],
          "severityThreshold": "high"
        }
      }
    }

---
# Pod Security Standards for ARC Runners
apiVersion: v1
kind: Namespace
metadata:
  name: arc-systems
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted

---
# Network Policy for ARC Runner Isolation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: arc-runner-network-policy
  namespace: arc-systems
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: github-actions-runner
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: arc-systems
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53

---
# RBAC for Security Policy Engine
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: arc-security-policy-engine
rules:
- apiGroups: [""]
  resources: ["pods", "secrets", "configmaps", "serviceaccounts"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["actions.sumologic.com"]
  resources: ["runnerscalesets"]
  verbs: ["get", "list", "watch", "patch"]
- apiGroups: ["networking.k8s.io"]
  resources: ["networkpolicies"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]
  verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: arc-security-policy-engine
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: arc-security-policy-engine
subjects:
- kind: ServiceAccount
  name: arc-security-policy-engine
  namespace: arc-systems

---
# Service Account for Policy Engine
apiVersion: v1
kind: ServiceAccount
metadata:
  name: arc-security-policy-engine
  namespace: arc-systems
  labels:
    app.kubernetes.io/name: arc-security-policy-engine
```

## Security Policy Implementation Guide

### 1. Runtime Security Policies

**Container Image Scanning**: Automatically scan all runner images for vulnerabilities before deployment.

```yaml
# Add to RunnerScaleSet
metadata:
  annotations:
    security.arc.io/image-scanned: "true"
    security.arc.io/scan-timestamp: "2024-10-07T12:00:00Z"
    security.arc.io/critical-vulns: "0"
    security.arc.io/high-vulns: "1"
```

**Network Behavior Monitoring**: Restrict and monitor runner network communications.

```yaml
spec:
  template:
    spec:
      containers:
      - name: runner
        env:
        - name: ALLOWED_EGRESS_DOMAINS
          value: "github.com,api.github.com,docker.io"
        - name: NETWORK_MONITORING_ENABLED
          value: "true"
```

### 2. Supply Chain Security

**Action Origin Validation**: Only allow actions from verified organizations.

```yaml
# GitHub Actions workflow policy
on: [push, pull_request]
jobs:
  security-check:
    runs-on: self-hosted
    steps:
    - uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608  # v4.1.0 - SHA pinned
    - uses: github/super-linter@45fc0d88288b70840731a0c2bb5d1c0a2b0f2fd  # v4.9.4 - SHA pinned
```

### 3. Advanced RBAC & Access Control

**Just-In-Time Access**: Time-bounded runner access with justification.

```yaml
metadata:
  annotations:
    security.arc.io/access-justification: "Emergency deployment for critical security patch"
    security.arc.io/access-expires: "2024-10-07T20:00:00Z"
    security.arc.io/approver: "security-team@company.com"
```

### 4. Compliance Integration

**SOC2 Type II Compliance**: Ensure runners meet enterprise compliance requirements.

```yaml
metadata:
  labels:
    compliance.arc.io/soc2-certified: "true"
    compliance.arc.io/framework: "SOC2-TypeII"
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: runner
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
```

### 5. Implementation Commands

Use the MCP server tools to implement these policies:

```bash
# 1. Perform AI security assessment
arc_ai_security_assessment --namespace arc-systems --risk-threshold medium

# 2. Apply auto-fixes for policy violations
arc_auto_fix_violations --namespace arc-systems --dry-run false

# 3. Scan supply chain security
arc_scan_supply_chain --repository "owner/repo" --include-container-scanning true

# 4. Generate compliance report
arc_generate_compliance_report --framework SOC2 --include-remediation true
```

This comprehensive security framework provides defense-in-depth for ARC deployments while maintaining operational efficiency.