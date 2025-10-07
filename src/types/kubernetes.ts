/**
 * Kubernetes Service Interface
 * 
 * Common interface for Kubernetes services used by ARC components
 */

export interface IKubernetesService {
    // Cluster operations
    getClusterInfo(): Promise<any>;
    listNamespaces(): Promise<any[]>;
    getNamespace(name: string): Promise<any>;
    createNamespace(name: string, labels?: Record<string, string>): Promise<void>;
    deleteNamespace(name: string): Promise<void>;
    
    // Resource operations
    applyResource(resource: any): Promise<void>;
    applyManifest(manifest: any): Promise<any>;
    deleteResource(namespace: string, name: string, resourceType: string): Promise<void>;
    
    // Deployment operations
    listDeployments(namespace: string): Promise<any[]>;
    
    // Custom resources
    getCustomResources(apiVersion: string, kind: string, namespace: string): Promise<any[]>;
    deleteCustomResources(apiVersion: string, kind: string, namespace: string): Promise<void>;
    
    // Secrets
    createSecret(namespace: string, name: string, data: Record<string, string>, labels?: Record<string, string>): Promise<void>;
    
    // Logs and monitoring
    getPodLogs(namespace: string, labelSelector: string, options?: any): Promise<string>;
    getPodsInNamespace(namespace: string): Promise<any[]>;
    
    // Network policies
    listNetworkPolicies(namespace: string): Promise<any[]>;
    
    // API operations
    getApiVersions(): Promise<string[]>;
    
    // Helm operations
    deleteHelmRelease(name: string, namespace: string): Promise<void>;
}