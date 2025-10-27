import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs-extra';
import * as path from 'path';
import { z } from 'zod';

// Policy Types and Interfaces for ARC
export interface ArcPolicyRule {
    id: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'security' | 'compliance' | 'performance' | 'cost' | 'operations' | 'networking';
    enabled: boolean;
    scope: 'cluster' | 'namespace' | 'runnerscaleset' | 'runner' | 'resource';
    conditions: PolicyCondition[];
    actions: PolicyAction[];
    metadata?: Record<string, any>;
}

export interface PolicyCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex_match' | 'exists' | 'not_exists' | 'in' | 'not_in';
    value: any;
    description?: string;
}

export interface PolicyAction {
    type: 'deny' | 'warn' | 'modify' | 'audit' | 'notify' | 'info';
    message: string;
    autoFix?: boolean;
    fixAction?: string;
    notificationChannels?: string[];
}

export interface PolicyViolation {
    ruleId: string;
    ruleName: string;
    severity: string;
    category: string;
    resource: {
        kind: string;
        name: string;
        namespace?: string;
    };
    message: string;
    field?: string;
    currentValue?: any;
    suggestedValue?: any;
    canAutoFix: boolean;
    timestamp: string;
    metadata?: Record<string, any>;
}

export interface PolicyEvaluationResult {
    passed: boolean;
    violations: PolicyViolation[];
    warnings: PolicyViolation[];
    summary: {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        violationsBySeverity: Record<string, number>;
        violationsByCategory: Record<string, number>;
    };
}

export interface ArcPolicyConfiguration {
    organization: {
        name: string;
        environment: 'development' | 'staging' | 'production';
        compliance?: string[];
    };
    global: {
        enforcement: 'strict' | 'advisory' | 'disabled';
        autoFix: boolean;
        excludedNamespaces?: string[];
    };
    categories: {
        [key: string]: {
            enabled: boolean;
            enforcement: 'strict' | 'advisory' | 'disabled';
            autoFix: boolean;
        };
    };
    customRules?: ArcPolicyRule[];
    ruleOverrides?: {
        [ruleId: string]: {
            enabled?: boolean;
            severity?: 'low' | 'medium' | 'high' | 'critical';
            enforcement?: 'strict' | 'advisory' | 'disabled';
        };
    };
    notifications?: {
        slack?: {
            webhookUrl: string;
            channel: string;
            severityLevels: string[];
        };
        email?: {
            recipients: string[];
            severityLevels: string[];
        };
    };
}

export interface ArcComplianceReport {
    timestamp: string;
    cluster: string;
    namespace?: string;
    overallCompliance: number; // percentage
    results: PolicyEvaluationResult;
    recommendations: string[];
    trends?: {
        complianceHistory: Array<{
            timestamp: string;
            compliance: number;
        }>;
    };
}

/**
 * ARC Policy Engine for GitHub Actions Runner Controller governance and compliance
 */
export class ArcPolicyEngine {
    private rules: Map<string, ArcPolicyRule> = new Map();
    private kc: k8s.KubeConfig;
    private k8sApi: k8s.AppsV1Api;
    private coreApi: k8s.CoreV1Api;
    private customApi: k8s.CustomObjectsApi;
    private config?: ArcPolicyConfiguration;

    constructor(kubeConfig: k8s.KubeConfig, configPath?: string) {
        this.kc = kubeConfig;
        this.k8sApi = this.kc.makeApiClient(k8s.AppsV1Api);
        this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
        this.customApi = this.kc.makeApiClient(k8s.CustomObjectsApi);

        // Load configuration from file if provided
        if (configPath) {
            this.loadConfiguration(configPath);
        }

        this.loadDefaultArcPolicies();
        this.applyConfiguration();
    }

    /**
     * Validate an ARC policy configuration object
     */
    validateConfiguration(config: any): { isValid: boolean; errors?: string[]; warnings?: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!config || typeof config !== 'object') {
            errors.push('Configuration root must be an object');
            return { isValid: false, errors };
        }

        // Organization validation
        if (!config.organization?.name) errors.push('organization.name is required');
        if (!config.organization?.environment) errors.push('organization.environment is required');

        // Global validation
        if (!config.global) errors.push('global section is required');
        if (config.global && !['strict', 'advisory', 'disabled'].includes(config.global.enforcement)) {
            errors.push(`global.enforcement must be one of strict|advisory|disabled (got ${config.global.enforcement})`);
        }

        // Categories validation
        if (config.categories && typeof config.categories === 'object') {
            Object.entries(config.categories).forEach(([cat, settings]: [string, any]) => {
                if (!['security', 'compliance', 'performance', 'cost', 'operations'].includes(cat)) {
                    warnings.push(`Unknown category '${cat}' will be ignored`);
                }
                if (settings && settings.enforcement && !['strict', 'advisory', 'disabled'].includes(settings.enforcement)) {
                    errors.push(`categories.${cat}.enforcement invalid (${settings.enforcement})`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length ? errors : undefined,
            warnings: warnings.length ? warnings : undefined
        };
    }

    /**
     * Load configuration from external file
     */
    private async loadConfiguration(configPath: string): Promise<void> {
        try {
            if (await fs.pathExists(configPath)) {
                const configData = await fs.readFile(configPath, 'utf8');
                this.config = JSON.parse(configData) as ArcPolicyConfiguration;
                console.error(`✅ Loaded ARC policy configuration from: ${configPath}`);
            } else {
                console.error(`⚠️ ARC policy configuration file not found: ${configPath}`);
            }
        } catch (error) {
            console.error(`❌ Error loading ARC policy configuration: ${error}`);
        }
    }

    /**
     * Apply configuration settings to policies
     */
    private applyConfiguration(): void {
        if (!this.config) return;

        // Apply rule overrides
        if (this.config.ruleOverrides) {
            Object.entries(this.config.ruleOverrides).forEach(([ruleId, override]) => {
                const rule = this.rules.get(ruleId);
                if (rule) {
                    if (override.enabled !== undefined) {
                        rule.enabled = override.enabled;
                    }
                    if (override.severity) {
                        rule.severity = override.severity;
                    }
                }
            });
        }

        // Add custom rules
        if (this.config.customRules) {
            this.config.customRules.forEach(rule => {
                this.rules.set(rule.id, rule);
            });
        }

        console.error(`🔧 Applied ARC configuration for ${this.config.organization.name} (${this.config.organization.environment})`);
    }

    /**
     * Load default ARC policy rules
     */
    private loadDefaultArcPolicies(): void {
        const defaultPolicies: ArcPolicyRule[] = [
            // ARC Security Policies
            {
                id: 'arc-sec-001',
                name: 'Require Runner Security Context',
                description: 'ARC runner pods must have security context defined',
                severity: 'high',
                category: 'security',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.securityContext',
                        operator: 'exists',
                        value: true,
                        description: 'Security context must be defined for runner pods'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'ARC runner is missing security context. This is a security risk.',
                        autoFix: true,
                        fixAction: 'add_runner_security_context'
                    }
                ]
            },
            {
                id: 'arc-sec-002',
                name: 'Prohibit Privileged Runners',
                description: 'ARC runners must not run in privileged mode',
                severity: 'critical',
                category: 'security',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.containers[*].securityContext.privileged',
                        operator: 'not_equals',
                        value: true,
                        description: 'Privileged ARC runners are not allowed'
                    }
                ],
                actions: [
                    {
                        type: 'deny',
                        message: 'Privileged ARC runners are prohibited for security reasons.',
                        autoFix: true,
                        fixAction: 'remove_privileged_flag'
                    }
                ]
            },
            {
                id: 'arc-sec-003',
                name: 'Require GitHub Token Secret',
                description: 'ARC controllers must reference a valid GitHub token secret',
                severity: 'critical',
                category: 'security',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.githubConfigSecret.name',
                        operator: 'exists',
                        value: true,
                        description: 'GitHub token secret must be defined'
                    }
                ],
                actions: [
                    {
                        type: 'deny',
                        message: 'ARC runner must reference a valid GitHub token secret.',
                        autoFix: false
                    }
                ]
            },

            // ARC Resource Management Policies
            {
                id: 'arc-res-001',
                name: 'Require Runner Resource Limits',
                description: 'ARC runners must have CPU and memory limits',
                severity: 'medium',
                category: 'performance',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.containers[*].resources.limits.cpu',
                        operator: 'exists',
                        value: true,
                        description: 'CPU limits must be defined for runners'
                    },
                    {
                        field: 'spec.template.spec.containers[*].resources.limits.memory',
                        operator: 'exists',
                        value: true,
                        description: 'Memory limits must be defined for runners'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'ARC runner is missing resource limits. This can lead to resource contention.',
                        autoFix: true,
                        fixAction: 'add_runner_resource_limits'
                    }
                ]
            },
            {
                id: 'arc-res-002',
                name: 'Reasonable Runner CPU Limits',
                description: 'ARC runner CPU limits should be reasonable (not more than 4 cores typically)',
                severity: 'medium',
                category: 'cost',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.containers[*].resources.limits.cpu',
                        operator: 'less_than',
                        value: '4000m',
                        description: 'Runner CPU limits should typically be under 4 cores'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'High CPU limits detected for ARC runner. Consider if this is necessary for cost optimization.'
                    }
                ]
            },

            // ARC Operational Policies
            {
                id: 'arc-ops-001',
                name: 'Require Runner Labels',
                description: 'ARC runners must have standard labels for observability',
                severity: 'low',
                category: 'operations',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'metadata.labels["actions.github.com/scale-set-name"]',
                        operator: 'exists',
                        value: true,
                        description: 'scale-set-name label is required'
                    },
                    {
                        field: 'metadata.labels.app',
                        operator: 'exists',
                        value: true,
                        description: 'app label is required'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'Missing required labels for proper ARC runner management and observability.'
                    }
                ]
            },

            // ARC 0.13.0 New Features Policies
            {
                id: 'arc-013-001',
                name: 'Container Mode Configuration',
                description: 'ARC 0.13.0: Validate container mode configuration for storage optimization',
                severity: 'medium',
                category: 'performance',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.containerMode',
                        operator: 'in',
                        value: ['kubernetes', 'kubernetes-novolume'],
                        description: 'Container mode must be kubernetes or kubernetes-novolume'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'ARC 0.13.0: Consider using kubernetes-novolume mode for better performance and eliminating RWX storage requirements.',
                        autoFix: true,
                        fixAction: 'set_container_mode_novolume'
                    }
                ]
            },
            {
                id: 'arc-013-002',
                name: 'Enhanced Metrics Labels',
                description: 'ARC 0.13.0: Require enhanced metrics labels for better observability',
                severity: 'low',
                category: 'operations',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'metadata.labels["actions.github.com/workflow-name"]',
                        operator: 'exists',
                        value: true,
                        description: 'workflow-name label enhances metrics granularity in 0.13.0'
                    },
                    {
                        field: 'metadata.labels["actions.github.com/target"]',
                        operator: 'exists',
                        value: true,
                        description: 'target label improves monitoring and alerting in 0.13.0'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'ARC 0.13.0: Add workflow_name and target labels for enhanced metrics. job_workflow_ref will be deprecated in 0.14.0.',
                        autoFix: true,
                        fixAction: 'add_enhanced_metrics_labels'
                    }
                ]
            },
            {
                id: 'arc-013-003',
                name: 'JIT Token Security',
                description: 'ARC 0.13.0: Ensure JIT tokens are not stored in ephemeral runner status',
                severity: 'high',
                category: 'security',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.env[*].name',
                        operator: 'not_contains',
                        value: 'RUNNER_JIT_CONFIG',
                        description: 'JIT tokens should not be exposed in runner status'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'ARC 0.13.0: JIT tokens are now securely managed and no longer stored in ephemeral runner status for enhanced security.',
                        autoFix: true,
                        fixAction: 'remove_jit_token_exposure'
                    }
                ]
            },
            {
                id: 'arc-013-004',
                name: 'Dual-Stack Networking Support',
                description: 'ARC 0.13.0: Validate dual-stack networking configuration',
                severity: 'low',
                category: 'networking',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.dnsPolicy',
                        operator: 'equals',
                        value: 'ClusterFirst',
                        description: 'DNS policy should support dual-stack networking'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'ARC 0.13.0: Configure DNS policy for dual-stack IPv4/IPv6 support when available.',
                        autoFix: true,
                        fixAction: 'configure_dualstack_dns'
                    }
                ]
            },
            {
                id: 'arc-013-005',
                name: 'Azure Key Vault Integration',
                description: 'ARC 0.13.0: Validate Azure Key Vault secret management integration',
                severity: 'medium',
                category: 'security',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.volumes[*].csi.driver',
                        operator: 'contains',
                        value: 'secrets-store.csi.k8s.io',
                        description: 'Azure Key Vault CSI driver integration for secure secret management'
                    }
                ],
                actions: [
                    {
                        type: 'info',
                        message: 'ARC 0.13.0: Consider Azure Key Vault integration for enhanced secret management without exposing secrets in workflow context.'
                    }
                ]
            },
            {
                id: 'arc-013-006',
                name: 'OpenShift Compatibility',
                description: 'ARC 0.13.0: Validate OpenShift-specific security context constraints',
                severity: 'medium',
                category: 'security',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.securityContext.runAsUser',
                        operator: 'greater_than',
                        value: 999,
                        description: 'OpenShift requires non-root user ID > 999'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'ARC 0.13.0: Ensure security context is compatible with OpenShift Security Context Constraints.',
                        autoFix: true,
                        fixAction: 'configure_openshift_scc'
                    }
                ]
            },
            {
                id: 'arc-013-007',
                name: 'Container Lifecycle Hooks',
                description: 'ARC 0.13.0: Validate container lifecycle hooks for kubernetes-novolume mode',
                severity: 'low',
                category: 'performance',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.containers[*].lifecycle.preStart',
                        operator: 'exists',
                        value: true,
                        description: 'PreStart hooks recommended for kubernetes-novolume mode'
                    }
                ],
                actions: [
                    {
                        type: 'info',
                        message: 'ARC 0.13.0: Container lifecycle hooks enable workspace restoration/export in kubernetes-novolume mode for better performance.'
                    }
                ]
            },
            {
                id: 'arc-ops-002',
                name: 'Valid Runner Image',
                description: 'ARC runners should use supported runner images',
                severity: 'medium',
                category: 'operations',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.template.spec.containers[0].image',
                        operator: 'regex_match',
                        value: '^(ghcr\\.io/actions/actions-runner|sumologic/github-actions-runner)',
                        description: 'Runner image should be from supported registries'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'ARC runner should use supported official runner images for best compatibility.'
                    }
                ]
            },

            // ARC Scaling Policies
            {
                id: 'arc-scale-001',
                name: 'Reasonable Max Replicas',
                description: 'ARC runner scale sets should have reasonable maximum replicas',
                severity: 'medium',
                category: 'cost',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.maxReplicas',
                        operator: 'less_than',
                        value: 50,
                        description: 'Maximum replicas should be reasonable to control costs'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'High maximum replicas setting detected. This could lead to high costs during scaling events.'
                    }
                ]
            },
            {
                id: 'arc-scale-002',
                name: 'Minimum Replicas Configuration',
                description: 'ARC runner scale sets should have minimum replicas set appropriately',
                severity: 'low',
                category: 'performance',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.minReplicas',
                        operator: 'greater_than',
                        value: -1,
                        description: 'Minimum replicas should be defined (0 or more)'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'Consider setting minimum replicas for better availability and response times.'
                    }
                ]
            },

            // ARC Compliance Policies
            {
                id: 'arc-comp-001',
                name: 'GitHub Repository Scope',
                description: 'ARC runners should be scoped to specific repositories for security',
                severity: 'high',
                category: 'compliance',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.githubConfigUrl',
                        operator: 'contains',
                        value: '/repos/',
                        description: 'GitHub config URL should be repository-specific, not organization-wide'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'Consider scoping ARC runners to specific repositories rather than organization-wide for better security.'
                    }
                ]
            },
            {
                id: 'arc-comp-002',
                name: 'Required Runner Group',
                description: 'ARC runners should specify a runner group for organization',
                severity: 'medium',
                category: 'compliance',
                enabled: true,
                scope: 'runnerscaleset',
                conditions: [
                    {
                        field: 'spec.runnerGroup',
                        operator: 'exists',
                        value: true,
                        description: 'Runner group should be specified for organization'
                    }
                ],
                actions: [
                    {
                        type: 'warn',
                        message: 'Specify a runner group for better organization and access control.'
                    }
                ]
            }
        ];

        defaultPolicies.forEach(policy => {
            this.rules.set(policy.id, policy);
        });
    }

    /**
     * Get all policy rules
     */
    getRules(): ArcPolicyRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Get policy rules by category
     */
    getRulesByCategory(category: string): ArcPolicyRule[] {
        return this.getRules().filter(rule => rule.category === category);
    }

    /**
     * Evaluate policies against an ARC RunnerScaleSet
     */
    async evaluateRunnerScaleSet(namespace: string, runnerScaleSetName: string): Promise<PolicyEvaluationResult> {
        try {
            const response = await this.customApi.getNamespacedCustomObject({
                group: 'actions.sumologic.com',
                version: 'v1alpha1', 
                namespace,
                plural: 'runnerscalesets',
                name: runnerScaleSetName
            });

            return this.evaluateResource((response as any).body || response, 'runnerscaleset');
        } catch (error) {
            throw new Error(`Failed to evaluate RunnerScaleSet: ${error}`);
        }
    }

    /**
     * Evaluate policies against a Kubernetes resource
     */
    evaluateResource(resource: any, resourceType: string): PolicyEvaluationResult {
        const violations: PolicyViolation[] = [];
        const warnings: PolicyViolation[] = [];
        const enabledRules = this.getRules().filter(rule => rule.enabled && rule.scope === resourceType);

        for (const rule of enabledRules) {
            const ruleViolations = this.evaluateRule(rule, resource);

            for (const violation of ruleViolations) {
                if (rule.actions.some(action => action.type === 'deny')) {
                    violations.push(violation);
                } else {
                    warnings.push(violation);
                }
            }
        }

        const totalRules = enabledRules.length;
        const failedRules = new Set([...violations, ...warnings].map(v => v.ruleId)).size;
        const passedRules = totalRules - failedRules;

        const violationsBySeverity = this.groupBy([...violations, ...warnings], 'severity');
        const violationsByCategory = this.groupBy([...violations, ...warnings], 'category');

        return {
            passed: violations.length === 0,
            violations,
            warnings,
            summary: {
                totalRules,
                passedRules,
                failedRules,
                violationsBySeverity,
                violationsByCategory
            }
        };
    }

    /**
     * Evaluate a single policy rule against a resource
     */
    private evaluateRule(rule: ArcPolicyRule, resource: any): PolicyViolation[] {
        const violations: PolicyViolation[] = [];

        for (const condition of rule.conditions) {
            const result = this.evaluateCondition(condition, resource);

            if (!result.passed) {
                const canAutoFix = rule.actions.some(action => action.autoFix === true);

                violations.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    severity: rule.severity,
                    category: rule.category,
                    resource: {
                        kind: resource.kind || 'RunnerScaleSet',
                        name: resource.metadata?.name || 'Unknown',
                        namespace: resource.metadata?.namespace
                    },
                    message: rule.actions[0]?.message || rule.description,
                    field: condition.field,
                    currentValue: result.currentValue,
                    suggestedValue: result.suggestedValue,
                    canAutoFix,
                    timestamp: new Date().toISOString(),
                    metadata: rule.metadata
                });
            }
        }

        return violations;
    }

    /**
     * Evaluate a single condition against a resource
     */
    private evaluateCondition(condition: PolicyCondition, resource: any): {
        passed: boolean;
        currentValue?: any;
        suggestedValue?: any;
    } {
        const fieldValue = this.getFieldValue(resource, condition.field);

        switch (condition.operator) {
            case 'equals':
                return {
                    passed: fieldValue === condition.value,
                    currentValue: fieldValue,
                    suggestedValue: condition.value
                };

            case 'not_equals':
                return {
                    passed: fieldValue !== condition.value,
                    currentValue: fieldValue
                };

            case 'contains':
                return {
                    passed: String(fieldValue).includes(String(condition.value)),
                    currentValue: fieldValue
                };

            case 'not_contains':
                return {
                    passed: !String(fieldValue).includes(String(condition.value)),
                    currentValue: fieldValue
                };

            case 'greater_than':
                return {
                    passed: this.parseResourceValue(fieldValue) > this.parseResourceValue(condition.value),
                    currentValue: fieldValue,
                    suggestedValue: condition.value
                };

            case 'less_than':
                return {
                    passed: this.parseResourceValue(fieldValue) < this.parseResourceValue(condition.value),
                    currentValue: fieldValue,
                    suggestedValue: condition.value
                };

            case 'regex_match':
                {
                    const regex = new RegExp(condition.value);
                    return {
                        passed: regex.test(String(fieldValue)),
                        currentValue: fieldValue
                    };
                }

            case 'exists':
                return {
                    passed: fieldValue !== undefined && fieldValue !== null,
                    currentValue: fieldValue
                };

            case 'not_exists':
                return {
                    passed: fieldValue === undefined || fieldValue === null,
                    currentValue: fieldValue
                };

            default:
                return { passed: false, currentValue: fieldValue };
        }
    }

    /**
     * Get field value from resource using dot notation or array notation
     */
    private getFieldValue(obj: any, field: string): any {
        // Handle array notation like containers[*]
        if (field.includes('[*]')) {
            const parts = field.split('[*]');
            const arrayPath = parts[0];
            const remainingPath = parts[1];

            const arrayValue = this.getNestedValue(obj, arrayPath);
            if (Array.isArray(arrayValue)) {
                // Check if any array element has the remaining field
                return arrayValue.some(item => {
                    const itemValue = remainingPath ? this.getNestedValue(item, remainingPath.substring(1)) : item;
                    return itemValue !== undefined && itemValue !== null;
                });
            }
            return false;
        }

        return this.getNestedValue(obj, field);
    }

    /**
     * Get nested value using dot notation
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Parse resource values (CPU, memory) for comparison
     */
    private parseResourceValue(value: any): number {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;

        // Handle CPU values (m suffix for millicores)
        if (value.endsWith('m')) {
            return parseInt(value.slice(0, -1));
        }

        // Handle memory values (Ki, Mi, Gi suffixes)
        if (value.endsWith('Ki')) {
            return parseInt(value.slice(0, -2)) * 1024;
        }
        if (value.endsWith('Mi')) {
            return parseInt(value.slice(0, -2)) * 1024 * 1024;
        }
        if (value.endsWith('Gi')) {
            return parseInt(value.slice(0, -2)) * 1024 * 1024 * 1024;
        }

        // Default to parsing as number
        return parseFloat(value) || 0;
    }

    /**
     * Group array items by a property
     */
    private groupBy(items: any[], property: string): Record<string, number> {
        return items.reduce((acc, item) => {
            const key = item[property] || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Generate compliance report for namespace or cluster ARC resources
     */
    async generateArcComplianceReport(namespace?: string): Promise<ArcComplianceReport> {
        try {
            let runnerScaleSets: any[] = [];

            if (namespace) {
                const response = await this.customApi.listNamespacedCustomObject({
                    group: 'actions.sumologic.com',
                    version: 'v1alpha1',
                    namespace,
                    plural: 'runnerscalesets'
                });
                runnerScaleSets = ((response as any).body || response)?.items || [];
            } else {
                const response = await this.customApi.listClusterCustomObject({
                    group: 'actions.sumologic.com',
                    version: 'v1alpha1',
                    plural: 'runnerscalesets'
                });
                runnerScaleSets = ((response as any).body || response)?.items || [];
            }

            const allResults: PolicyEvaluationResult[] = [];

            for (const runnerScaleSet of runnerScaleSets) {
                const result = this.evaluateResource(runnerScaleSet, 'runnerscaleset');
                allResults.push(result);
            }

            // Aggregate results
            const aggregatedResult: PolicyEvaluationResult = {
                passed: allResults.every(r => r.passed),
                violations: allResults.flatMap(r => r.violations),
                warnings: allResults.flatMap(r => r.warnings),
                summary: {
                    totalRules: allResults.reduce((sum, r) => sum + r.summary.totalRules, 0),
                    passedRules: allResults.reduce((sum, r) => sum + r.summary.passedRules, 0),
                    failedRules: allResults.reduce((sum, r) => sum + r.summary.failedRules, 0),
                    violationsBySeverity: this.mergeGroups(allResults.map(r => r.summary.violationsBySeverity)),
                    violationsByCategory: this.mergeGroups(allResults.map(r => r.summary.violationsByCategory))
                }
            };

            const totalChecks = aggregatedResult.summary.totalRules;
            const passedChecks = aggregatedResult.summary.passedRules;
            const overallCompliance = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

            const recommendations = this.generateArcRecommendations(aggregatedResult);

            return {
                timestamp: new Date().toISOString(),
                cluster: this.kc.getCurrentCluster()?.name || 'Unknown',
                namespace,
                overallCompliance: Math.round(overallCompliance * 100) / 100,
                results: aggregatedResult,
                recommendations
            };
        } catch (error) {
            throw new Error(`Failed to generate ARC compliance report: ${error}`);
        }
    }

    /**
     * Merge multiple grouped objects
     */
    private mergeGroups(groups: Record<string, number>[]): Record<string, number> {
        return groups.reduce((merged, group) => {
            Object.entries(group).forEach(([key, value]) => {
                merged[key] = (merged[key] || 0) + value;
            });
            return merged;
        }, {});
    }

    /**
     * Generate ARC-specific recommendations based on violations
     */
    private generateArcRecommendations(result: PolicyEvaluationResult): string[] {
        const recommendations: string[] = [];
        const { violations, warnings } = result;

        // Security recommendations
        const securityViolations = [...violations, ...warnings].filter(v => v.category === 'security');
        if (securityViolations.length > 0) {
            recommendations.push('🔒 Security: Review ARC runner security contexts, avoid privileged runners, and ensure GitHub token secrets are properly configured.');
        }

        // Resource management recommendations
        const resourceViolations = [...violations, ...warnings].filter(v => v.category === 'performance');
        if (resourceViolations.length > 0) {
            recommendations.push('📊 Resources: Define appropriate resource limits for ARC runners to prevent resource contention and ensure stable performance.');
        }

        // Operational recommendations
        const opsViolations = [...violations, ...warnings].filter(v => v.category === 'operations');
        if (opsViolations.length > 0) {
            recommendations.push('⚙️ Operations: Add proper labeling and use supported runner images for improved ARC runner observability and reliability.');
        }

        // Cost optimization recommendations
        const costViolations = [...violations, ...warnings].filter(v => v.category === 'cost');
        if (costViolations.length > 0) {
            recommendations.push('💰 Cost: Review ARC scaling settings and resource limits to optimize costs while maintaining performance.');
        }

        // Compliance recommendations
        const complianceViolations = [...violations, ...warnings].filter(v => v.category === 'compliance');
        if (complianceViolations.length > 0) {
            recommendations.push('📋 Compliance: Scope ARC runners to specific repositories and configure runner groups for better access control and governance.');
        }

        // Auto-fix recommendations
        const autoFixableViolations = [...violations, ...warnings].filter(v => v.canAutoFix);
        if (autoFixableViolations.length > 0) {
            recommendations.push(`🔧 Auto-fix: ${autoFixableViolations.length} ARC policy violations can be automatically fixed. Consider using the auto-remediation feature.`);
        }

        return recommendations;
    }
}