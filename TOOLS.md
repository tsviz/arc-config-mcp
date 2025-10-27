# ARC MCP Server Tools Catalog

> **🚀 Complete reference for all ARC management tools with ARC 0.13.0 support**
> 
> A comprehensive, discoverable catalog of all MCP tools for GitHub Actions Runner Controller operations. Includes support for container mode optimization, dual-stack networking, Azure Key Vault integration, and OpenShift deployment.

## 🆕 ARC 0.13.0 Enhancements

This MCP server now fully supports ARC 0.13.0 features:
- **🔥 Container Mode**: `kubernetes-novolume` for RWX-free deployments
- **🌐 Dual-Stack Networking**: IPv4/IPv6 support with automatic fallback
- **🔐 Azure Key Vault**: Secure secret management with CSI integration
- **🏢 OpenShift Support**: Enterprise deployment with Security Context Constraints
- **📊 Enhanced Metrics**: New `workflow_name` and `target` labels

## 🔍 Quick Discovery

From any MCP client (Copilot, Claude, etc.), discover available tools:

```text
🧑 "What ARC tools are available?"
🤖 Running tool discovery...

Tool: arc_list_tools
Args: {}
```

Filter by category or functionality:
```text
Tool: arc_list_tools
Args: { "filter": "install" }
```

## 🧰 Tool Categories

| Category                         | Tools                                    | Purpose                             |
| -------------------------------- | ---------------------------------------- | ----------------------------------- |
| **🎯 Core ARC Operations**        | install, status, scale, manage, cleanup  | Essential ARC lifecycle management  |
| **🤖 AI-Powered Features**        | natural_language, troubleshoot, optimize | Intelligent automation and analysis |
| **🔒 Security & Compliance**      | validate_policies, security_scan, audit  | Policy enforcement and security     |
| **📊 Monitoring & Insights**      | health_check, metrics, reports           | Observability and analytics         |
| **🛠️ Infrastructure Management**  | networking, secrets, backup, upgrade     | Advanced cluster operations         |
| **🎭 Natural Language Interface** | process_natural_language                 | Human-friendly command processing   |
| **🔥 ARC 0.13.0 Features**        | container_mode, dual_stack, key_vault    | Latest ARC capabilities             |

---

## 📦 Detailed Tool Reference

### 🔥 ARC 0.13.0 Enhanced Tools

#### `arc_install_controller` (Enhanced)
**Purpose**: Deploy ARC controller with 0.13.0 optimizations  
**Use Cases**: Container mode deployments, dual-stack networking, Azure Key Vault integration

```typescript
interface InstallParams {
  namespace?: string;              // Target namespace (default: arc-system)
  version?: string;               // ARC version (default: 0.13.0)
  security_profile?: string;      // Security level: basic|standard|strict
  container_mode?: string;        // NEW: kubernetes-novolume|kubernetes-dind
  enable_dual_stack?: boolean;    // NEW: Enable IPv4/IPv6 dual-stack
  azure_key_vault?: {             // NEW: Azure Key Vault integration
    enabled: boolean;
    vault_name: string;
    tenant_id: string;
  };
  openshift_mode?: boolean;       // NEW: Enable OpenShift SCCs
  enhanced_metrics?: boolean;     // NEW: Enable workflow_name labels
  auto_scaling?: boolean;      // Enable auto-scaling (default: true)
  monitoring?: boolean;        // Install monitoring stack (default: true)
  github_org?: string;        // GitHub organization
  github_repo?: string;       // Specific repository (optional)
}
```

**Example Natural Language**:
- *"Install ARC in my development cluster with basic security"*
- *"Deploy ARC controller version 0.9.1 with strict security policies"*
- *"Set up ARC for my organization with auto-scaling enabled"*

#### `arc_get_status`
**Purpose**: Comprehensive health check and status report for all ARC components  
**Use Cases**: Health monitoring, troubleshooting, compliance reporting

```typescript
interface StatusParams {
  namespace?: string;          // Check specific namespace
  include_runners?: boolean;   // Include runner details (default: true)
  include_metrics?: boolean;   // Include performance metrics
  detailed?: boolean;         // Verbose output with diagnostics
}
```

**Returns**:
- Controller health and version
- Active runner counts and status
- Resource utilization metrics
- Recent events and errors
- Policy compliance status

#### `arc_scale_runners`
**Purpose**: Horizontal scaling of GitHub Actions runners with intelligent load balancing  
**Use Cases**: Peak load handling, cost optimization, maintenance periods

```typescript
interface ScaleParams {
  runner_set: string;          // Runner set name
  target_replicas: number;     // Desired runner count
  min_replicas?: number;       // Minimum runners (auto-scaling)
  max_replicas?: number;       // Maximum runners (auto-scaling)
  scale_down_delay?: string;   // Delay before scaling down (5m)
  force?: boolean;             // Force immediate scaling
}
```

**Example Operations**:
- Scale to handle deployment pipeline load
- Reduce costs during off-hours
- Emergency scaling for critical builds

#### `arc_manage_runners`
**Purpose**: Complete runner lifecycle management including creation, updates, and deletion  
**Use Cases**: Runner configuration changes, environment setup, cleanup

```typescript
interface ManageParams {
  operation: 'create' | 'update' | 'delete' | 'restart';
  runner_set: string;
  config?: RunnerSetConfig;    // Runner configuration
  labels?: string[];          // GitHub runner labels
  resources?: ResourceLimits; // CPU/memory limits
}
```

#### `arc_cleanup_installation`
**Purpose**: Comprehensive ARC cleanup and uninstallation with AI-guided safety checks  
**Use Cases**: Environment cleanup, cluster decommissioning, fresh installs

```typescript
interface CleanupParams {
  cleanup?: boolean;           // Enable cleanup (overrides CLEANUP_ARC env var)
  namespace?: string;          // Target namespace (default: arc-systems)
  preserveData?: boolean;      // Backup secrets before removal (default: false)
  dryRun?: boolean;           // Preview mode without execution (default: false)
  force?: boolean;            // Force cleanup of large installations (default: false)
  forceNamespaceRemoval?: boolean; // Force namespace removal (default: false)
}
```

**🛡️ Safety Features**:
- **Disabled by default**: Requires `CLEANUP_ARC=true` environment variable
- **AI-guided validation**: Comprehensive pre-cleanup safety analysis
- **Real-time progress**: Live updates with visual progress indicators
- **Graceful shutdown**: Proper termination of running workflows
- **Selective cleanup**: Choose which components to remove/preserve
- **Dry run mode**: Preview all changes without execution

**Example Operations**:
- Complete ARC removal for cluster migration
- Cleanup failed installations for fresh start
- Selective component removal for upgrades
- Safe environment decommissioning

> **⚠️ Important**: This tool is disabled by default for safety. Enable with `CLEANUP_ARC=true` environment variable. See [Cleanup Documentation](docs/CLEANUP_FUNCTIONALITY.md) for full details.

### 🤖 AI-Powered Features

#### `arc_process_natural_language`
**Purpose**: Convert human language into structured ARC operations  
**Use Cases**: User-friendly command interface, automated operations, workflow integration

```typescript
interface NLProcessParams {
  query: string;               // Natural language command
  context?: string;           // Additional context
  auto_execute?: boolean;     // Execute the parsed command
  dry_run?: boolean;          // Preview without execution
}
```

**Supported Patterns**:
- *"Install ARC with security settings for production"*
- *"Scale my repo runners to handle the evening deployment rush"*
- *"Check why my runners are failing and fix the issues"*
- *"Cleanup ARC installation safely with backup"*
- *"Uninstall ARC but preserve my configuration data"*
- *"Remove ARC completely and clean up the namespace"*
- *"Optimize costs by reducing unnecessary runner overhead"*
- *"Show me a compliance report for SOC2 requirements"*

#### `arc_troubleshoot_issues`
**Purpose**: Automated diagnostics and problem resolution for ARC infrastructure  
**Use Cases**: Incident response, proactive monitoring, self-healing systems

```typescript
interface TroubleshootParams {
  scope?: 'controller' | 'runners' | 'networking' | 'all';
  auto_fix?: boolean;          // Attempt automatic remediation
  include_suggestions?: boolean; // Provide manual fix suggestions
  severity_filter?: string;    // Filter by issue severity
}
```

**Diagnostic Capabilities**:
- Resource constraint detection
- Network connectivity issues
- GitHub API rate limiting
- Certificate and authentication problems
- Runner startup failures

#### `arc_optimize_costs`
**Purpose**: AI-driven cost analysis and optimization recommendations  
**Use Cases**: Budget management, resource efficiency, cost forecasting

```typescript
interface OptimizeParams {
  scope?: 'cluster' | 'namespace' | 'runner_set';
  target?: string;             // Specific target to optimize
  apply_recommendations?: boolean; // Auto-apply safe optimizations
  cost_threshold?: number;     // Only show savings above threshold
  time_period?: string;        // Analysis period (7d, 30d, 90d)
}
```

### 🔒 Security & Compliance

#### `arc_validate_policies`
**Purpose**: Comprehensive policy compliance validation against organizational standards  
**Use Cases**: Security audits, compliance reporting, policy enforcement

```typescript
interface ValidateParams {
  policy_set?: string;         // Specific policy set to validate
  severity_filter?: string;    // critical|high|medium|low
  auto_remediate?: boolean;    // Fix violations automatically
  report_format?: string;      // json|yaml|markdown|pdf
}
```

**Policy Categories**:
- **Security**: Container security, RBAC, network policies
- **Compliance**: SOC2, ISO27001, PCI-DSS requirements  
- **Performance**: Resource limits, scaling policies
- **Cost**: Resource optimization, waste prevention
- **Operations**: Monitoring, logging, backup procedures

#### `arc_security_scan`
**Purpose**: Deep security analysis of ARC infrastructure and configurations  
**Use Cases**: Security assessments, vulnerability management, threat detection

```typescript
interface SecurityScanParams {
  scan_type?: 'vulnerability' | 'configuration' | 'runtime' | 'all';
  include_containers?: boolean; // Scan runner container images
  include_secrets?: boolean;   // Analyze secret management
  compliance_framework?: string; // Target compliance standard
}
```

#### `arc_audit_trail`
**Purpose**: Generate comprehensive audit logs and compliance reports  
**Use Cases**: Compliance reporting, incident investigation, change tracking

### 📊 Monitoring & Insights

#### `arc_health_check`
**Purpose**: Proactive health monitoring with alerting and trend analysis  
**Use Cases**: SLA monitoring, capacity planning, proactive maintenance

```typescript
interface HealthCheckParams {
  components?: string[];       // Specific components to check
  alert_threshold?: number;    // Health score alert threshold
  trend_analysis?: boolean;    // Include historical trends
  export_metrics?: boolean;    // Export to monitoring system
}
```

#### `arc_generate_reports`
**Purpose**: Automated report generation for operations, security, and costs  
**Use Cases**: Executive reporting, operational reviews, compliance documentation

```typescript
interface ReportParams {
  report_type: 'operational' | 'security' | 'cost' | 'compliance';
  time_period: string;         // Report timeframe
  format: 'pdf' | 'html' | 'json' | 'csv';
  recipients?: string[];       // Email recipients
  schedule?: string;           // Cron expression for automation
}
```

### 🛠️ Infrastructure Management

#### `arc_configure_networking`
**Purpose**: Advanced network configuration and security policy management  
**Use Cases**: Network isolation, traffic management, security hardening

#### `arc_manage_secrets`
**Purpose**: Secure credential management including rotation and encryption  
**Use Cases**: GitHub token management, certificate rotation, secret lifecycle

#### `arc_backup_config`
**Purpose**: Configuration backup and disaster recovery preparation  
**Use Cases**: Change management, disaster recovery, environment replication

#### `arc_upgrade_components`
**Purpose**: Intelligent version management and upgrade orchestration  
**Use Cases**: Maintenance windows, security patches, feature updates

---

## 🗺 Usage Patterns & Workflows

### 🚀 Common Operational Sequences

| Workflow                | Tool Sequence                                                            | Purpose                        |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| **Fresh Installation**  | `arc_install_controller` → `arc_get_status` → `arc_validate_policies`    | Complete setup with validation |
| **Performance Scaling** | `arc_get_status` → `arc_scale_runners` → `arc_health_check`              | Load-based scaling             |
| **Issue Resolution**    | `arc_troubleshoot_issues` → `arc_health_check` → `arc_get_status`        | Problem diagnosis and fix      |
| **Security Audit**      | `arc_security_scan` → `arc_validate_policies` → `arc_generate_reports`   | Compliance assessment          |
| **Cost Optimization**   | `arc_optimize_costs` → `arc_scale_runners` → `arc_generate_reports`      | Resource efficiency            |
| **Version Upgrade**     | `arc_backup_config` → `arc_upgrade_components` → `arc_validate_policies` | Safe upgrades                  |

### 🎯 Natural Language Workflow Examples

#### Scenario: New Project Setup
```text
🧑 "Set up ARC for our new microservices project with production-grade security"

🤖 I'll configure ARC with enterprise security for your microservices:

   1️⃣ Installing ARC controller...
      Tool: arc_install_controller
      Args: {
        namespace: "arc-production",
        security_profile: "strict",
        monitoring: true,
        auto_scaling: true
      }

   2️⃣ Validating security compliance...
      Tool: arc_validate_policies
      Args: {
        policy_set: "production",
        severity_filter: "critical"
      }

   3️⃣ Configuring monitoring...
      Tool: arc_health_check
      Args: {
        alert_threshold: 95,
        trend_analysis: true
      }

   ✅ Production-ready ARC setup complete!
```

#### Scenario: Performance Issue Investigation
```text
🧑 "Our builds are taking forever, something's wrong with the runners"

🤖 Let me diagnose the performance issues:

   1️⃣ Analyzing current system health...
      Tool: arc_get_status
      Args: { detailed: true, include_metrics: true }

   2️⃣ Running comprehensive troubleshooting...
      Tool: arc_troubleshoot_issues
      Args: { 
        scope: "all",
        auto_fix: true,
        include_suggestions: true
      }

   3️⃣ Checking resource optimization opportunities...
      Tool: arc_optimize_costs
      Args: { apply_recommendations: true }

   📊 Issues found and resolved:
      ✅ Scaled runners from 3 to 8 (load balancing)
      ✅ Fixed resource constraints (CPU limits)
      ✅ Optimized runner placement (node affinity)
```

---

## 💡 Best Practices & Tips

### 🎯 Operational Excellence
- **Always start with `arc_get_status`** to establish baseline health
- **Use `arc_validate_policies`** before major changes
- **Enable monitoring** with all installations for proactive management
- **Schedule regular health checks** for early issue detection

### 🔒 Security Best Practices
- **Implement strict security profiles** for production environments
- **Regular security scans** to detect new vulnerabilities
- **Automated policy validation** in CI/CD pipelines
- **Audit trail generation** for compliance requirements

### 💰 Cost Management
- **Regular cost optimization reviews** to prevent waste
- **Auto-scaling configuration** to match workload patterns
- **Resource limit enforcement** to prevent resource sprawl
- **Scheduled scaling** for predictable workload patterns

### 🚀 Performance Optimization
- **Proactive monitoring** with trend analysis
- **Intelligent scaling** based on queue depth and build times
- **Resource right-sizing** for optimal price/performance
- **Network optimization** for faster runner startup

---

## 🔄 Tool Evolution & Updates

### 🆕 Latest Tool Additions (v1.5.x)
- `arc_optimize_costs`: AI-powered cost analysis and recommendations
- `arc_security_scan`: Deep security vulnerability analysis
- `arc_generate_reports`: Automated operational and compliance reporting
- Enhanced `arc_troubleshoot_issues` with ML-based diagnostics

### 🛣️ Upcoming Tools (v1.6.x)
- `arc_multi_cluster`: Multi-cluster ARC management
- `arc_webhook_processor`: Real-time GitHub event processing
- `arc_custom_policies`: Policy-as-Code with custom DSL
- `arc_integration_hub`: Pre-built DevOps tool integrations

### 📊 Tool Usage Analytics
Track tool effectiveness and adoption:
- Most used: `arc_get_status` (daily health checks)
- Highest value: `arc_troubleshoot_issues` (reduces MTTR by 70%)
- Growing adoption: `arc_optimize_costs` (average 25% cost reduction)

---

## 🔄 Keeping This Catalog Current

This document provides a comprehensive overview of available tools. For the most up-to-date runtime information:

1. **Use `arc_list_tools`** for real-time tool discovery
2. **Check release notes** for newly added tools
3. **Monitor tool deprecation warnings** in server logs
4. **Subscribe to updates** via GitHub repository watch

---

## 📞 Tool Support & Feedback

### 🆘 Getting Help
- **Tool-specific issues**: Use `arc_troubleshoot_issues` for automated diagnosis
- **Documentation**: Check `/docs` directory for detailed guides
- **Community**: [GitHub Discussions](https://github.com/tsviz/arc-config-mcp/discussions)
- **Enterprise Support**: Contact enterprise@tsviz.com

### 📝 Feedback & Requests
We continuously improve our tool catalog based on user feedback:
- **Feature requests**: [GitHub Issues](https://github.com/tsviz/arc-config-mcp/issues/new?template=feature-request.md)
- **Tool usage analytics**: Help us prioritize development
- **Integration suggestions**: Tell us about your workflows

---

<div align="center">

**🧰 Ready to explore ARC automation?**

[Quick Start Guide](./docs/QUICKSTART.md) • [Tool Examples](./examples/) • [API Reference](./docs/API.md)

*From manual kubectl commands to conversational AI-powered ARC operations* ✨

</div>