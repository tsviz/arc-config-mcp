/**
 * Core ARC types and interfaces
 */

export interface ArcServerInfo {
    name: string;
    version: string;
    description: string;
    author: string;
}

export interface ArcInstallationConfig {
    namespace: string;
    controllerVersion: string;
    scaleSetVersion: string;
    certManagerVersion?: string;
    githubToken: string;
    githubRepository: string;
    runnerGroup?: string;
    runnerScaleSetName: string;
    minReplicas: number;
    maxReplicas: number;
    // ARC 0.13.0 features
    containerMode?: 'kubernetes' | 'kubernetes-novolume';
    dualStackNetworking?: boolean;
    azureKeyVault?: AzureKeyVaultConfig;
    openShiftSupport?: boolean;
    metricsLabels?: {
        workflowName?: boolean;
        targetLabels?: boolean;
        legacyJobWorkflowRef?: boolean; // Will be deprecated in 0.14.0
    };
}

export interface AzureKeyVaultConfig {
    enabled: boolean;
    vaultUrl?: string;
    managedIdentity?: {
        enabled: boolean;
        clientId?: string;
    };
    secretsStoreCsi?: {
        enabled: boolean;
        secretProviderClass?: string;
    };
}

export interface ArcRunnerStatus {
    name: string;
    namespace: string;
    replicas: {
        current: number;
        desired: number;
        ready: number;
    };
    status: 'Running' | 'Pending' | 'Failed' | 'Unknown';
    lastUpdate: string;
    githubRepository?: string;
    // ARC 0.13.0 features
    containerMode?: 'kubernetes' | 'kubernetes-novolume';
    networkConfig?: {
        dualStack: boolean;
        ipv4?: string;
        ipv6?: string;
    };
    security?: {
        jitTokenSecure: boolean; // JIT token no longer in ephemeral status
        vaultIntegration?: boolean;
    };
    metrics?: {
        workflowName?: string;
        target?: string;
        jobWorkflowRef?: string; // Legacy, will be removed in 0.14.0
    };
}

export interface ArcControllerStatus {
    version: string;
    namespace: string;
    status: 'Running' | 'Pending' | 'Failed' | 'Unknown';
    pods: {
        total: number;
        ready: number;
        running: number;
    };
    lastUpdate: string;
}

export interface KubernetesResource {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace?: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
    };
    spec?: Record<string, any>;
    status?: Record<string, any>;
}

export interface PolicyViolation {
    rule: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    resource: {
        kind: string;
        name: string;
        namespace?: string;
    };
    suggestion?: string;
}

export interface GitHubRunnerInfo {
    id: number;
    name: string;
    os: string;
    status: 'online' | 'offline' | 'busy';
    busy: boolean;
    labels: string[];
}

export interface ServiceContext {
    kubernetes: any;
    github: any;
    policy: any;
    installer: any;
    logger: any;
}

// ARC 0.13.0 specific interfaces
export interface ContainerModeConfig {
    mode: 'kubernetes' | 'kubernetes-novolume';
    hooks?: {
        preStart?: string[];
        postStop?: string[];
    };
    storage?: {
        enablePersistentVolume?: boolean;
        storageClass?: string;
        size?: string;
    };
}

export interface DualStackNetworkConfig {
    enabled: boolean;
    ipv4?: {
        enabled: boolean;
        cidr?: string;
    };
    ipv6?: {
        enabled: boolean;
        cidr?: string;
    };
    fallbackToIpv4?: boolean;
    networkPolicies?: {
        ipv4Rules?: string[];
        ipv6Rules?: string[];
    };
}

export interface OpenShiftConfig {
    enabled: boolean;
    securityContextConstraints?: {
        name?: string;
        custom?: boolean;
    };
    routes?: {
        enabled: boolean;
        hostnames?: string[];
    };
    imageRegistry?: {
        internal?: boolean;
        external?: string;
    };
}

export interface MetricsConfiguration {
    enableDistinctLabels: boolean;
    workflowNameLabel: boolean;
    targetLabel: boolean;
    // Backward compatibility
    legacyJobWorkflowRef?: boolean; // Default true for 0.13.0, will be false in 0.14.0
    customLabels?: Record<string, string>;
}