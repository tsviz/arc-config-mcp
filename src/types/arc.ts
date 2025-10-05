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