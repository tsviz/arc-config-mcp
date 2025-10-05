# External Policy Configuration

> **🔧 Flexible external policy management for ARC deployments**
> 
> Configure and manage ARC policies using external configuration files, enabling separation of concerns, version control, and environment-specific policy management without rebuilding the MCP server.

## 🎯 Overview

External Policy Configuration allows organizations to define ARC governance policies in separate configuration files that can be:
- Stored in version control systems
- Updated without server restarts
- Environment-specific configurations
- Shared across multiple ARC deployments
- Dynamically reloaded based on file changes

## 🏗️ Configuration Architecture

```
┌─────────────────────────────────────────────────────────┐
│              External Policy Architecture                │
├─────────────────────────────────────────────────────────┤
│ 📁 Config Files      │ YAML/JSON policy definitions     │
│ 🔄 Hot Reload        │ Dynamic configuration updates    │
│ 🌍 Environment Mgmt  │ Per-environment configurations   │
│ 📦 Version Control   │ Git-based policy management      │
│ 🔗 Remote Sources    │ HTTP/S3/Git repository loading   │
└─────────────────────────────────────────────────────────┘
```

## 📂 Configuration File Structure

### Basic Configuration Format

```yaml
# arc-external-config.yaml
apiVersion: arc.config/v1
kind: ExternalPolicyConfig
metadata:
  name: production-arc-config
  version: "1.0.0"
  environment: production
  
spec:
  # Policy sources
  policySources:
    - type: "file"
      path: "./policies/security-policies.yaml"
    - type: "http"
      url: "https://company.com/policies/arc-compliance.yaml"
    - type: "git"
      repository: "git@github.com:company/arc-policies.git"
      branch: "production"
      path: "policies/"
      
  # Environment-specific settings
  environment:
    name: "production"
    enforementLevel: "strict"
    autoRemediation: false
    alerting: true
    
  # Feature flags
  features:
    aiOptimization: true
    predictiveScaling: true
    costOptimization: true
    securityScanning: true
    
  # Integration settings
  integrations:
    monitoring:
      prometheus: true
      grafana: true
      alertmanager: true
    security:
      falco: true
      opa: true
      admission-controller: true
    compliance:
      sonarqube: true
      twistlock: true
      aqua: true
```

### Multi-Environment Configuration

```yaml
# environments/production.yaml
apiVersion: arc.config/v1
kind: EnvironmentConfig
metadata:
  name: production
  
spec:
  policies:
    security:
      level: "strict"
      scanImages: true
      networkPolicies: "enforced"
      rbacMode: "least-privilege"
      
    compliance:
      frameworks: ["SOC2", "ISO27001"]
      auditLogging: "comprehensive"
      dataRetention: "7y"
      
    performance:
      autoScaling: true
      resourceLimits: "enforced"
      optimizationLevel: "balanced"
      
    cost:
      budgetAlerts: true
      autoShutdown: false
      resourceQuotas: "enforced"
      
  runners:
    defaultNodeSelector:
      workload: "github-actions"
      environment: "production"
    tolerations:
      - key: "dedicated"
        operator: "Equal"
        value: "github-actions"
        effect: "NoSchedule"
        
  monitoring:
    metricsRetention: "90d"
    alertingRules: "./alerts/production-alerts.yaml"
    dashboards: "./dashboards/production/"
```

```yaml
# environments/development.yaml
apiVersion: arc.config/v1
kind: EnvironmentConfig
metadata:
  name: development
  
spec:
  policies:
    security:
      level: "permissive"
      scanImages: false
      networkPolicies: "advisory"
      rbacMode: "developer-friendly"
      
    compliance:
      frameworks: ["basic"]
      auditLogging: "minimal"
      dataRetention: "30d"
      
    performance:
      autoScaling: false
      resourceLimits: "advisory"
      optimizationLevel: "development"
      
    cost:
      budgetAlerts: false
      autoShutdown: true
      resourceQuotas: "advisory"
      
  runners:
    defaultNodeSelector:
      workload: "github-actions"
      environment: "development"
    resources:
      requests:
        cpu: "100m"
        memory: "256Mi"
      limits:
        cpu: "1000m"
        memory: "2Gi"
```

## 🔧 Configuration Loading Strategies

### File-Based Configuration

```typescript
// Configuration loading from local files
interface FileConfigSource {
  type: "file";
  path: string;
  watchForChanges?: boolean;
  reloadInterval?: string; // "5m", "1h", etc.
}

// Example usage
const fileConfig: FileConfigSource = {
  type: "file",
  path: "./config/arc-policies.yaml",
  watchForChanges: true,
  reloadInterval: "5m"
};
```

### Remote HTTP Configuration

```typescript
// Configuration loading from HTTP endpoints
interface HttpConfigSource {
  type: "http";
  url: string;
  headers?: Record<string, string>;
  authentication?: {
    type: "bearer" | "basic" | "api-key";
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  };
  cacheTTL?: string;
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: "linear" | "exponential";
  };
}

// Example usage
const httpConfig: HttpConfigSource = {
  type: "http",
  url: "https://config-server.company.com/arc/production.yaml",
  headers: {
    "X-API-Version": "v1"
  },
  authentication: {
    type: "bearer",
    token: process.env.CONFIG_SERVER_TOKEN
  },
  cacheTTL: "10m",
  retryPolicy: {
    maxRetries: 3,
    backoffStrategy: "exponential"
  }
};
```

### Git Repository Configuration

```typescript
// Configuration loading from Git repositories
interface GitConfigSource {
  type: "git";
  repository: string;
  branch?: string;
  tag?: string;
  path?: string;
  authentication?: {
    type: "ssh" | "token";
    sshKey?: string;
    token?: string;
  };
  syncInterval?: string;
}

// Example usage
const gitConfig: GitConfigSource = {
  type: "git",
  repository: "git@github.com:company/arc-policies.git",
  branch: "production",
  path: "policies/",
  authentication: {
    type: "ssh",
    sshKey: "/path/to/ssh/key"
  },
  syncInterval: "15m"
};
```

### Cloud Storage Configuration

```typescript
// Configuration from cloud storage (S3, GCS, Azure Blob)
interface CloudConfigSource {
  type: "s3" | "gcs" | "azure-blob";
  bucket: string;
  key: string;
  region?: string;
  authentication?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    serviceAccountPath?: string;
    connectionString?: string;
  };
  encryption?: {
    enabled: boolean;
    kmsKeyId?: string;
  };
}

// Example S3 configuration
const s3Config: CloudConfigSource = {
  type: "s3",
  bucket: "company-arc-policies",
  key: "production/arc-config.yaml",
  region: "us-west-2",
  authentication: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  encryption: {
    enabled: true,
    kmsKeyId: "arn:aws:kms:us-west-2:123456789:key/12345678-1234-1234-1234-123456789012"
  }
};
```

## 🔄 Dynamic Configuration Management

### Hot Reload Configuration

```yaml
# Hot reload settings
apiVersion: arc.config/v1
kind: HotReloadConfig
metadata:
  name: dynamic-updates
  
spec:
  enabled: true
  
  # File watching configuration
  fileWatcher:
    enabled: true
    debounceInterval: "5s"
    watchPaths:
      - "./config/**/*.yaml"
      - "./policies/**/*.yaml"
      
  # Periodic refresh configuration
  periodicRefresh:
    enabled: true
    interval: "10m"
    sources: ["http", "git", "s3"]
    
  # Validation on reload
  validation:
    enabled: true
    strictMode: true
    rollbackOnError: true
    
  # Notification settings
  notifications:
    enabled: true
    channels:
      - type: "webhook"
        url: "https://alerts.company.com/webhook"
      - type: "slack"
        webhook: "https://hooks.slack.com/services/..."
      - type: "email"
        recipients: ["ops@company.com"]
        
  # Graceful restart
  gracefulRestart:
    enabled: true
    drainTimeout: "30s"
    maxUnavailable: "25%"
```

### Configuration Validation

```yaml
# Configuration validation rules
apiVersion: arc.config/v1
kind: ValidationConfig
metadata:
  name: config-validation
  
spec:
  validation:
    # Schema validation
    schema:
      enabled: true
      strict: true
      customSchemas:
        - path: "./schemas/security-policy.json"
        - path: "./schemas/compliance-policy.json"
        
    # Business logic validation
    businessRules:
      - name: "resource-limits-required"
        description: "All runners must have resource limits defined"
        rule: |
          spec.runners[*].resources.limits != null
          
      - name: "security-context-required"
        description: "Security context must be defined for production"
        condition: "environment == 'production'"
        rule: |
          spec.runners[*].securityContext != null
          
    # Cross-reference validation
    references:
      - name: "namespace-exists"
        description: "Referenced namespaces must exist"
        type: "kubernetes"
        resource: "namespaces"
        
    # Custom validation functions
    customValidators:
      - name: "cost-threshold-check"
        function: "./validators/cost-validator.js"
      - name: "compliance-framework-check"
        function: "./validators/compliance-validator.js"
```

## 📊 Configuration Management Workflows

### GitOps Configuration Workflow

```yaml
# .github/workflows/arc-config-management.yaml
name: ARC Configuration Management
on:
  push:
    paths: 
      - 'configs/**'
      - 'policies/**'
  pull_request:
    paths:
      - 'configs/**'
      - 'policies/**'

jobs:
  validate-config:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate Configuration Syntax
        run: |
          arc-validate-config \
            --config-dir ./configs \
            --schema ./schemas \
            --strict
            
      - name: Security Scan
        run: |
          arc-security-scan \
            --config-files ./configs/**/*.yaml \
            --policies ./policies/**/*.yaml
            
      - name: Compliance Check
        run: |
          arc-compliance-check \
            --framework SOC2 \
            --config ./configs/production.yaml
            
      - name: Dry Run Deployment
        run: |
          arc-deploy-config \
            --config ./configs/production.yaml \
            --dry-run \
            --diff
            
  deploy-config:
    needs: validate-config
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy Configuration
        run: |
          arc-deploy-config \
            --config ./configs/production.yaml \
            --apply \
            --wait-for-ready
            
      - name: Verify Deployment
        run: |
          arc-verify-config \
            --config ./configs/production.yaml \
            --timeout 300s
            
      - name: Post-Deployment Tests
        run: |
          arc-test-suite \
            --config ./configs/production.yaml \
            --smoke-tests
```

### Configuration Promotion Pipeline

```yaml
# Configuration promotion across environments
apiVersion: arc.config/v1
kind: PromotionPipeline
metadata:
  name: config-promotion
  
spec:
  stages:
    - name: "development"
      source:
        git:
          repository: "git@github.com:company/arc-configs.git"
          branch: "develop"
      validation:
        - syntax-check
        - security-scan
        - basic-compliance
      autoPromote: true
      
    - name: "staging"
      source:
        git:
          repository: "git@github.com:company/arc-configs.git"
          branch: "staging"
      validation:
        - full-validation
        - integration-tests
        - performance-tests
      approval:
        required: true
        approvers: ["platform-team"]
        
    - name: "production"
      source:
        git:
          repository: "git@github.com:company/arc-configs.git"
          branch: "main"
      validation:
        - comprehensive-validation
        - security-audit
        - compliance-certification
      approval:
        required: true
        approvers: ["security-team", "compliance-team"]
      rollback:
        automated: true
        healthcheck: true
        timeout: "5m"
```

## 🔐 Security & Encryption

### Secrets Management

```yaml
# Secure configuration with encrypted secrets
apiVersion: arc.config/v1
kind: SecureConfig
metadata:
  name: encrypted-config
  
spec:
  # External secret providers
  secretProviders:
    - name: "vault"
      type: "hashicorp-vault"
      address: "https://vault.company.com"
      authentication:
        method: "kubernetes"
        role: "arc-config-reader"
        
    - name: "k8s-secrets"
      type: "kubernetes"
      namespace: "arc-system"
      
    - name: "aws-secrets"
      type: "aws-secrets-manager"
      region: "us-west-2"
      
  # Encrypted configuration values
  encryptedValues:
    github_token: "vault:secret/arc/github#token"
    webhook_secret: "k8s:arc-system/webhook-secret#secret"
    database_password: "aws:prod/arc/database#password"
    
  # Field-level encryption
  encryption:
    provider: "vault-transit"
    keyName: "arc-config-key"
    encryptedFields:
      - "spec.github.token"
      - "spec.webhook.secret"
      - "spec.database.credentials"
```

### Access Control

```yaml
# Configuration access control
apiVersion: arc.config/v1
kind: ConfigAccessControl
metadata:
  name: config-rbac
  
spec:
  roles:
    - name: "config-admin"
      permissions:
        - "read:*"
        - "write:*"
        - "delete:*"
      subjects:
        - kind: "User"
          name: "ops-lead@company.com"
        - kind: "Group"
          name: "platform-admins"
          
    - name: "config-operator"
      permissions:
        - "read:configs/*"
        - "write:configs/development/*"
        - "write:configs/staging/*"
      subjects:
        - kind: "ServiceAccount"
          name: "arc-operator"
          namespace: "arc-system"
          
    - name: "config-reader"
      permissions:
        - "read:configs/*"
        - "read:policies/*"
      subjects:
        - kind: "Group"
          name: "developers"
          
  # Environment-specific access
  environmentAccess:
    development:
      allowedRoles: ["config-admin", "config-operator", "config-reader"]
      requireApproval: false
    staging:
      allowedRoles: ["config-admin", "config-operator"]
      requireApproval: true
      approvers: ["platform-team"]
    production:
      allowedRoles: ["config-admin"]
      requireApproval: true
      approvers: ["security-team", "compliance-team"]
```

## 📈 Monitoring & Observability

### Configuration Metrics

```yaml
# Configuration monitoring
apiVersion: arc.config/v1
kind: ConfigMonitoring
metadata:
  name: config-observability
  
spec:
  metrics:
    enabled: true
    endpoint: "/metrics"
    
    # Custom metrics
    customMetrics:
      - name: "config_reload_total"
        description: "Total number of configuration reloads"
        type: "counter"
        labels: ["source", "environment", "status"]
        
      - name: "config_validation_duration_seconds"
        description: "Time spent validating configuration"
        type: "histogram"
        labels: ["config_type", "environment"]
        
      - name: "config_errors_total"
        description: "Total configuration errors"
        type: "counter"
        labels: ["error_type", "source"]
        
  # Health checks
  healthChecks:
    - name: "config-source-connectivity"
      interval: "30s"
      timeout: "10s"
      
    - name: "config-validation-status"
      interval: "60s"
      
    - name: "secret-provider-health"
      interval: "120s"
      
  # Alerting rules
  alerts:
    - name: "config-reload-failure"
      condition: "increase(config_errors_total[5m]) > 0"
      severity: "critical"
      
    - name: "config-source-unavailable"
      condition: "up{job='config-source'} == 0"
      severity: "warning"
      
    - name: "config-validation-slow"
      condition: "config_validation_duration_seconds > 30"
      severity: "warning"
```

### Audit Logging

```yaml
# Configuration audit logging
apiVersion: arc.config/v1
kind: AuditConfig
metadata:
  name: config-audit
  
spec:
  logging:
    enabled: true
    level: "info"
    format: "json"
    
    # Audit events to log
    events:
      - "config-loaded"
      - "config-validated"
      - "config-applied"
      - "config-error"
      - "secret-accessed"
      - "permission-denied"
      
    # Log destinations
    destinations:
      - type: "file"
        path: "/var/log/arc-config/audit.log"
        rotation: "daily"
        retention: "90d"
        
      - type: "syslog"
        facility: "local0"
        tag: "arc-config"
        
      - type: "elasticsearch"
        endpoint: "https://logs.company.com"
        index: "arc-config-audit"
        
    # Sensitive field masking
    masking:
      enabled: true
      fields:
        - "*.token"
        - "*.password"
        - "*.secret"
        - "*.key"
```

## 🚀 Getting Started

### 1. Basic External Configuration

```bash
# Create basic external configuration
mkdir -p config policies
cat > config/basic-config.yaml << EOF
apiVersion: arc.config/v1
kind: ExternalPolicyConfig
metadata:
  name: basic-arc-config
  environment: development
spec:
  policySources:
    - type: file
      path: "./policies/development.yaml"
  environment:
    enforementLevel: "advisory"
    autoRemediation: false
EOF

# Start MCP server with external config
arc-mcp-server \
  --external-config "./config/basic-config.yaml" \
  --watch-config \
  --port 3000
```

### 2. Multi-Environment Setup

```bash
# Set up multi-environment configuration
mkdir -p environments/{dev,staging,prod}

# Development environment
cat > environments/dev/config.yaml << EOF
# Development-specific configuration
EOF

# Staging environment  
cat > environments/staging/config.yaml << EOF
# Staging-specific configuration
EOF

# Production environment
cat > environments/prod/config.yaml << EOF
# Production-specific configuration
EOF

# Deploy with environment selection
arc-deploy-config \
  --environment production \
  --config-dir "./environments/prod" \
  --apply
```

### 3. Git-Based Configuration

```bash
# Set up Git-based configuration management
git init arc-policies
cd arc-policies

# Create policy structure
mkdir -p {configs,policies,schemas,validators}

# Add configuration files
git add .
git commit -m "Initial ARC policy configuration"
git push origin main

# Configure MCP server to use Git source
arc-mcp-server \
  --config-source git \
  --repository "git@github.com:company/arc-policies.git" \
  --branch main \
  --sync-interval 5m
```

## 🔧 MCP Tool Integration

Use MCP tools to manage external configurations:

```typescript
// Load external configuration
const configStatus = await mcpClient.call("arc_load_external_config", {
  source: "git",
  repository: "git@github.com:company/arc-policies.git",
  branch: "production",
  validate: true
});

// Validate configuration
const validation = await mcpClient.call("arc_validate_external_config", {
  config_path: "./config/production.yaml",
  schema_path: "./schemas/arc-config-schema.json",
  strict: true
});

// Reload configuration
const reload = await mcpClient.call("arc_reload_config", {
  source: "all",
  graceful: true,
  wait_for_ready: true
});

// Monitor configuration health
const health = await mcpClient.call("arc_config_health_check", {
  include_sources: true,
  include_validation: true,
  include_metrics: true
});
```

---

<div align="center">

**🔧 Ready to implement external configuration?**

[Configuration Templates](../templates/configs/) • [Validation Schemas](../schemas/) • [Examples](../examples/configs/)

*Flexible, version-controlled policy management for enterprise ARC deployments* ✨

</div>