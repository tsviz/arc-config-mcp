/**
 * Enhanced Kubernetes Service for ARC Operations
 * 
 * Comprehensive Kubernetes service with full ARC management capabilities.
 * Based on proven patterns from the arc-config-repo implementation.
 */

import * as k8s from '@kubernetes/client-node';
import * as https from 'https';
import type { Logger } from 'winston';
import type { IKubernetesService } from '../types/kubernetes.js';

export interface ClusterInfo {
    version: string;
    currentContext: string;
    nodeCount: number;
    readyNodes: number;
    totalCpu?: number;
    totalMemory?: number;
}

export interface DeploymentInfo {
    name: string;
    namespace: string;
    replicas: number;
    readyReplicas: number;
    availableReplicas: number;
    labels: Record<string, string>;
    securityContext?: any;
    resources?: any;
}

export interface NamespaceInfo {
    name: string;
    labels: Record<string, string>;
    status: string;
}

export interface NetworkPolicyInfo {
    name: string;
    namespace: string;
    labels: Record<string, string>;
}

export class KubernetesEnhancedService implements IKubernetesService {
    private kc: k8s.KubeConfig;
    private k8sApi: k8s.CoreV1Api;
    private appsApi: k8s.AppsV1Api;
    private networkingApi: k8s.NetworkingV1Api;
    private customObjectsApi: k8s.CustomObjectsApi;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
        this.kc = new k8s.KubeConfig();

        try {
            this.kc.loadFromDefault();
            
            // Handle Docker Desktop self-signed certificates with strict safety checks
            const currentContext = this.kc.getCurrentContext();
            const cluster = this.kc.getCurrentCluster();
            
            if (currentContext && cluster && cluster.server) {
                // Multiple safety checks to ensure we only disable TLS verification for Docker Desktop
                const contextName = currentContext.toLowerCase();
                const serverUrl = cluster.server.toLowerCase();
                
                const isDockerDesktopContext = contextName.includes('docker-desktop') || 
                                             contextName.includes('docker-for-desktop');
                
                const isLocalhost = serverUrl.includes('127.0.0.1') || 
                                  serverUrl.includes('localhost') ||
                                  serverUrl.includes('0.0.0.0');
                
                // Only disable TLS verification if BOTH conditions are met:
                // 1. The context name explicitly indicates Docker Desktop
                // 2. The server URL is localhost/127.0.0.1
                const isDockerDesktop = isDockerDesktopContext && isLocalhost;
                
                // Additional safety: never disable for cloud domains
                const isCloudCluster = serverUrl.includes('.amazonaws.com') ||
                                     serverUrl.includes('.gcp.') ||
                                     serverUrl.includes('.azure.') ||
                                     serverUrl.includes('.digitalocean.com') ||
                                     serverUrl.includes('.linode.com') ||
                                     serverUrl.includes('.k8s.') ||
                                     !isLocalhost; // Any non-localhost is considered cloud
                
                if (isDockerDesktop && !isCloudCluster) {
                    this.logger.info('Detected Docker Desktop local cluster, configuring for self-signed certificates', {
                        context: currentContext,
                        server: cluster.server
                    });
                    
                    // Create a custom HTTPS agent that ignores certificate errors ONLY for Docker Desktop
                    const httpsAgent = new https.Agent({
                        rejectUnauthorized: false
                    });
                    
                    // Apply the custom agent to the kubeconfig
                    this.kc.applyToHTTPSOptions = (options: any) => {
                        options.agent = httpsAgent;
                        return options;
                    };
                    
                    this.logger.info('Applied custom HTTPS agent for Docker Desktop cluster');
                } else if (isCloudCluster) {
                    this.logger.info('Detected cloud Kubernetes cluster, using standard TLS verification', {
                        context: currentContext,
                        server: cluster.server
                    });
                } else {
                    this.logger.info('Using standard Kubernetes TLS configuration', {
                        context: currentContext,
                        server: cluster.server
                    });
                }
            }
        } catch (error) {
            this.logger.error('Failed to load Kubernetes configuration', { error });
            throw new Error('Kubernetes configuration not found or invalid');
        }

        this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
        this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
        this.networkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);
        this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
    }

    /**
     * Get comprehensive cluster information
     */
    async getClusterInfo(): Promise<ClusterInfo> {
        try {
            // Get version info from version API
            const versionApi = this.kc.makeApiClient(k8s.VersionApi);
            const versionResponse = await versionApi.getCode();
            const nodesResponse = await this.k8sApi.listNode();
            const nodes = (nodesResponse as any).body?.items || (nodesResponse as any).items || [];

            const readyNodes = nodes.filter((node: any) =>
                node.status?.conditions?.some((condition: any) =>
                    condition.type === 'Ready' && condition.status === 'True'
                )
            ).length;

            // Calculate total resources
            let totalCpu = 0;
            let totalMemory = 0;

            for (const node of nodes) {
                if (node.status?.capacity) {
                    const cpu = node.status.capacity.cpu;
                    const memory = node.status.capacity.memory;

                    if (cpu) {
                        // Convert CPU to millicores
                        if (cpu.endsWith('m')) {
                            totalCpu += parseInt(cpu.slice(0, -1));
                        } else {
                            totalCpu += parseInt(cpu) * 1000;
                        }
                    }

                    if (memory) {
                        // Convert memory to Ki
                        if (memory.endsWith('Ki')) {
                            totalMemory += parseInt(memory.slice(0, -2));
                        } else if (memory.endsWith('Mi')) {
                            totalMemory += parseInt(memory.slice(0, -2)) * 1024;
                        } else if (memory.endsWith('Gi')) {
                            totalMemory += parseInt(memory.slice(0, -2)) * 1024 * 1024;
                        }
                    }
                }
            }

            return {
                version: (versionResponse as any).body?.gitVersion || (versionResponse as any).gitVersion || 'unknown',
                currentContext: this.kc.getCurrentContext(),
                nodeCount: nodes.length,
                readyNodes,
                totalCpu,
                totalMemory
            };
        } catch (error) {
            this.logger.error('Failed to get cluster info', { error });
            throw new Error(`Failed to get cluster information: ${error}`);
        }
    }

    /**
     * Get API versions available in the cluster
     */
    async getApiVersions(): Promise<string[]> {
        try {
            const apisApi = this.kc.makeApiClient(k8s.ApisApi);
            const response = await apisApi.getAPIVersions();
            const groups = (response as any).body?.groups || (response as any).groups || [];
            return groups.map((g: any) => g.preferredVersion?.groupVersion || '');
        } catch (error) {
            this.logger.error('Failed to get API versions', { error });
            return [];
        }
    }

    /**
     * List all namespaces
     */
    async listNamespaces(): Promise<NamespaceInfo[]> {
        try {
            const response = await this.k8sApi.listNamespace();
            const items = (response as any).body?.items || (response as any).items || [];
            return items.map((ns: any) => ({
                name: ns.metadata?.name || '',
                labels: ns.metadata?.labels || {},
                status: ns.status?.phase || 'Unknown'
            }));
        } catch (error) {
            this.logger.error('Failed to list namespaces', { error });
            throw new Error(`Failed to list namespaces: ${error}`);
        }
    }

    /**
     * Get a specific namespace
     */
    async getNamespace(name: string): Promise<NamespaceInfo> {
        try {
            const response = await this.k8sApi.readNamespace({ name });
            const ns = response;

            return {
                name: ns.metadata?.name || '',
                labels: ns.metadata?.labels || {},
                status: ns.status?.phase || 'Unknown'
            };
        } catch (error) {
            this.logger.error('Failed to get namespace', { namespace: name, error });
            throw new Error(`Failed to get namespace ${name}: ${error}`);
        }
    }

    /**
     * Create a namespace with labels
     */
    async createNamespace(name: string, labels: Record<string, string> = {}): Promise<void> {
        try {
            const namespace = {
                apiVersion: 'v1',
                kind: 'Namespace',
                metadata: {
                    name,
                    labels
                }
            };

            await this.k8sApi.createNamespace({ body: namespace });
            this.logger.info('Namespace created successfully', { namespace: name, labels });
        } catch (error: any) {
            if (error.statusCode === 409) {
                // Namespace already exists, update labels
                this.logger.info('Namespace already exists, updating labels', { namespace: name });
                await this.updateNamespaceLabels(name, labels);
            } else {
                this.logger.error('Failed to create namespace', { namespace: name, error });
                throw new Error(`Failed to create namespace ${name}: ${error}`);
            }
        }
    }

    /**
     * Update namespace labels
     */
    async updateNamespaceLabels(name: string, labels: Record<string, string>): Promise<void> {
        try {
            const patch = {
                metadata: {
                    labels
                }
            };

            const options = { headers: { 'Content-Type': 'application/merge-patch+json' } };
            await this.k8sApi.patchNamespace({
                name,
                body: patch,
                ...options
            });

            this.logger.info('Namespace labels updated', { namespace: name, labels });
        } catch (error) {
            this.logger.error('Failed to update namespace labels', { namespace: name, error });
            throw new Error(`Failed to update namespace labels for ${name}: ${error}`);
        }
    }

    /**
     * Delete a namespace
     */
    async deleteNamespace(name: string): Promise<void> {
        try {
            await this.k8sApi.deleteNamespace({ name });
            this.logger.info('Namespace deleted', { namespace: name });
        } catch (error) {
            this.logger.error('Failed to delete namespace', { namespace: name, error });
            throw new Error(`Failed to delete namespace ${name}: ${error}`);
        }
    }

    /**
     * List deployments in a namespace
     */
    async listDeployments(namespace?: string): Promise<DeploymentInfo[]> {
        try {
            const response = namespace
                ? await this.appsApi.listNamespacedDeployment({ namespace })
                : await this.appsApi.listDeploymentForAllNamespaces();

            const items = response?.items || [];
            return items.map((deployment: any) => ({
                name: deployment.metadata?.name || '',
                namespace: deployment.metadata?.namespace || '',
                replicas: deployment.spec?.replicas || 0,
                readyReplicas: deployment.status?.readyReplicas || 0,
                availableReplicas: deployment.status?.availableReplicas || 0,
                labels: deployment.metadata?.labels || {},
                securityContext: deployment.spec?.template?.spec?.securityContext,
                resources: deployment.spec?.template?.spec?.containers?.[0]?.resources
            }));
        } catch (error) {
            this.logger.error('Failed to list deployments', { namespace, error });
            throw new Error(`Failed to list deployments: ${error}`);
        }
    }

    /**
     * Get deployment status
     */
    async getDeploymentStatus(name: string, namespace: string): Promise<DeploymentInfo> {
        try {
            const response = await this.appsApi.readNamespacedDeployment({ name, namespace });
            const deployment = response;

            return {
                name: deployment.metadata?.name || '',
                namespace: deployment.metadata?.namespace || '',
                replicas: deployment.spec?.replicas || 0,
                readyReplicas: deployment.status?.readyReplicas || 0,
                availableReplicas: deployment.status?.availableReplicas || 0,
                labels: deployment.metadata?.labels || {},
                securityContext: deployment.spec?.template?.spec?.securityContext,
                resources: deployment.spec?.template?.spec?.containers?.[0]?.resources
            };
        } catch (error) {
            this.logger.error('Failed to get deployment status', { name, namespace, error });
            throw new Error(`Failed to get deployment ${name} in namespace ${namespace}: ${error}`);
        }
    }

    /**
     * Wait for a deployment to be ready
     */
    async waitForDeployment(name: string, namespace: string, timeoutSeconds: number = 300): Promise<void> {
        const start = Date.now();
        const timeout = timeoutSeconds * 1000;

        this.logger.info('Waiting for deployment to be ready', { name, namespace, timeoutSeconds });

        while (Date.now() - start < timeout) {
            try {
                const deployment = await this.getDeploymentStatus(name, namespace);

                if (deployment.readyReplicas === deployment.replicas && deployment.replicas > 0) {
                    this.logger.info('Deployment is ready', { name, namespace });
                    return;
                }

                // Wait 5 seconds before checking again
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                // Deployment might not exist yet, continue waiting
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        throw new Error(`Timeout waiting for deployment ${name} in namespace ${namespace} to be ready`);
    }

    /**
     * Create a secret
     */
    async createSecret(
        namespace: string,
        name: string,
        data: Record<string, string>,
        labels: Record<string, string> = {}
    ): Promise<void> {
        try {
            const secret = {
                apiVersion: 'v1',
                kind: 'Secret',
                metadata: {
                    name,
                    namespace,
                    labels
                },
                type: 'Opaque',
                stringData: data
            };

            await this.k8sApi.createNamespacedSecret({ 
                namespace, 
                body: secret 
            });
            this.logger.info('Secret created successfully', { name, namespace });
        } catch (error: any) {
            if (error.statusCode === 409) {
                // Secret already exists, update it
                await this.updateSecret(namespace, name, data, labels);
            } else {
                this.logger.error('Failed to create secret', { name, namespace, error });
                throw new Error(`Failed to create secret ${name} in namespace ${namespace}: ${error}`);
            }
        }
    }

    /**
     * Update a secret
     */
    async updateSecret(
        namespace: string,
        name: string,
        data: Record<string, string>,
        labels: Record<string, string> = {}
    ): Promise<void> {
        try {
            const secret = {
                apiVersion: 'v1',
                kind: 'Secret',
                metadata: {
                    name,
                    namespace,
                    labels
                },
                type: 'Opaque',
                stringData: data
            };

            await this.k8sApi.replaceNamespacedSecret({
                name,
                namespace,
                body: secret
            });
            this.logger.info('Secret updated successfully', { name, namespace });
        } catch (error) {
            this.logger.error('Failed to update secret', { name, namespace, error });
            throw new Error(`Failed to update secret ${name} in namespace ${namespace}: ${error}`);
        }
    }

    /**
     * Get pod logs
     */
    async getPodLogs(namespace: string, labelSelector: string, lines: number = 100): Promise<string> {
        try {
            // First, get pods with the label selector
            const podsResponse = await this.k8sApi.listNamespacedPod({
                namespace,
                labelSelector
            });

            if (podsResponse.items.length === 0) {
                return 'No pods found with the specified label selector';
            }

            // Get logs from the first pod
            const podName = podsResponse.items[0].metadata?.name;
            if (!podName) {
                return 'Pod name not found';
            }

            const logsResponse = await this.k8sApi.readNamespacedPodLog({
                name: podName,
                namespace,
                tailLines: lines
            });

            return logsResponse as string;
        } catch (error) {
            this.logger.error('Failed to get pod logs', { namespace, labelSelector, error });
            throw new Error(`Failed to get pod logs: ${error}`);
        }
    }

    /**
     * List network policies
     */
    async listNetworkPolicies(namespace: string): Promise<NetworkPolicyInfo[]> {
        try {
            const response = await this.networkingApi.listNamespacedNetworkPolicy({ namespace });

            return response.items.map((policy: any) => ({
                name: policy.metadata?.name || '',
                namespace: policy.metadata?.namespace || '',
                labels: policy.metadata?.labels || {}
            }));
        } catch (error) {
            this.logger.error('Failed to list network policies', { namespace, error });
            return [];
        }
    }

    /**
     * Apply a Kubernetes resource
     */
    async applyResource(resource: any): Promise<void> {
        try {
            const { kind, metadata } = resource;
            const namespace = metadata?.namespace;
            const name = metadata?.name;

            switch (kind) {
                case 'NetworkPolicy':
                    try {
                        await this.networkingApi.createNamespacedNetworkPolicy({ namespace, body: resource });
                    } catch (error: any) {
                        if (error.statusCode === 409) {
                            await this.networkingApi.replaceNamespacedNetworkPolicy({ name, namespace, body: resource });
                        } else {
                            throw error;
                        }
                    }
                    break;

                case 'Secret':
                    try {
                        await this.k8sApi.createNamespacedSecret({ namespace, body: resource });
                    } catch (error: any) {
                        if (error.statusCode === 409) {
                            await this.k8sApi.replaceNamespacedSecret({ name, namespace, body: resource });
                        } else {
                            throw error;
                        }
                    }
                    break;

                case 'ConfigMap':
                    try {
                        await this.k8sApi.createNamespacedConfigMap({ namespace, body: resource });
                    } catch (error: any) {
                        if (error.statusCode === 409) {
                            await this.k8sApi.replaceNamespacedConfigMap({ name, namespace, body: resource });
                        } else {
                            throw error;
                        }
                    }
                    break;

                default:
                    // For custom resources, use the custom objects API
                    const parts = resource.apiVersion.split('/');
                    const group = parts.length === 2 ? parts[0] : '';
                    const version = parts.length === 2 ? parts[1] : parts[0];
                    const plural = `${kind.toLowerCase()}s`; // Simple pluralization

                    try {
                        await this.customObjectsApi.createNamespacedCustomObject({
                            group, version, namespace, plural, body: resource
                        });
                    } catch (error: any) {
                        if (error.statusCode === 409) {
                            await this.customObjectsApi.replaceNamespacedCustomObject({
                                group, version, namespace, plural, name, body: resource
                            });
                        } else {
                            throw error;
                        }
                    }
                    break;
            }

            this.logger.info('Resource applied successfully', { kind, name, namespace });
        } catch (error) {
            this.logger.error('Failed to apply resource', { resource: resource.kind, error });
            throw new Error(`Failed to apply ${resource.kind}: ${error}`);
        }
    }

    /**
     * Get custom resources
     */
    async getCustomResources(apiVersion: string, kind: string, namespace?: string): Promise<any[]> {
        try {
            const parts = apiVersion.split('/');
            const group = parts.length === 2 ? parts[0] : '';
            const version = parts.length === 2 ? parts[1] : parts[0];
            const plural = `${kind.toLowerCase()}s`; // Simple pluralization

            const response = namespace
                ? await this.customObjectsApi.listNamespacedCustomObject({ group, version, namespace, plural })
                : await this.customObjectsApi.listClusterCustomObject({ group, version, plural });

            return (response as any).items || [];
        } catch (error) {
            this.logger.error('Failed to get custom resources', { apiVersion, kind, namespace, error });
            return [];
        }
    }

    /**
     * Delete custom resources
     */
    async deleteCustomResources(apiVersion: string, kind: string, namespace: string): Promise<void> {
        try {
            const resources = await this.getCustomResources(apiVersion, kind, namespace);
            const parts = apiVersion.split('/');
            const group = parts.length === 2 ? parts[0] : '';
            const version = parts.length === 2 ? parts[1] : parts[0];
            const plural = `${kind.toLowerCase()}s`;

            for (const resource of resources) {
                const name = resource.metadata?.name;
                if (name) {
                    await this.customObjectsApi.deleteNamespacedCustomObject({
                        group, version, namespace, plural, name
                    });
                }
            }

            this.logger.info('Custom resources deleted', { apiVersion, kind, namespace, count: resources.length });
        } catch (error) {
            this.logger.error('Failed to delete custom resources', { apiVersion, kind, namespace, error });
            throw new Error(`Failed to delete custom resources: ${error}`);
        }
    }

    /**
     * Delete Helm release (requires helm CLI)
     */
    async deleteHelmRelease(releaseName: string, namespace: string): Promise<void> {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        try {
            await execAsync(`helm uninstall ${releaseName} --namespace ${namespace}`);
            this.logger.info('Helm release deleted', { releaseName, namespace });
        } catch (error) {
            this.logger.error('Failed to delete Helm release', { releaseName, namespace, error });
            throw new Error(`Failed to delete Helm release ${releaseName}: ${error}`);
        }
    }

    /**
     * Apply Kubernetes manifest (compatibility method)
     */
    async applyManifest(manifest: any): Promise<any> {
        await this.applyResource(manifest);
        return {
            applied: true,
            resource: manifest
        };
    }

    /**
     * Delete a Kubernetes resource (compatibility method)
     */
    async deleteResource(namespace: string, name: string, resourceType: string): Promise<void> {
        this.logger.info(`Deleting ${resourceType} ${name} in namespace ${namespace}`);
        
        try {
            if (resourceType.toLowerCase() === 'namespace') {
                await this.deleteNamespace(name);
            } else if (resourceType.toLowerCase() === 'deployment') {
                await this.appsApi.deleteNamespacedDeployment({ name, namespace });
            } else if (resourceType.toLowerCase() === 'secret') {
                await this.k8sApi.deleteNamespacedSecret({ name, namespace });
            } else if (resourceType.toLowerCase() === 'configmap') {
                await this.k8sApi.deleteNamespacedConfigMap({ name, namespace });
            } else {
                // Try as custom resource
                const parts = resourceType.split('/');
                if (parts.length === 2) {
                    const [group, version] = parts;
                    const plural = `${resourceType.toLowerCase()}s`;
                    await this.customObjectsApi.deleteNamespacedCustomObject({
                        group, version, namespace, plural, name
                    });
                }
            }
        } catch (error) {
            this.logger.error(`Failed to delete ${resourceType} ${name}`, { error });
            throw error;
        }
    }

    /**
     * Scale deployment (compatibility method)
     */
    async scaleDeployment(namespace: string, name: string, replicas: number): Promise<void> {
        try {
            const patch = {
                spec: {
                    replicas: replicas
                }
            };

            await this.appsApi.patchNamespacedDeployment({
                name, 
                namespace, 
                body: patch
            });

            this.logger.info(`Scaled deployment ${name} to ${replicas} replicas`, { namespace });
        } catch (error) {
            this.logger.error(`Failed to scale deployment ${name}`, { namespace, replicas, error });
            throw new Error(`Failed to scale deployment ${name}: ${error}`);
        }
    }

    /**
     * Execute kubectl command (compatibility method)
     */
    async execute(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        try {
            const fullCommand = command.startsWith('kubectl') ? command : `kubectl ${command}`;
            const { stdout, stderr } = await execAsync(fullCommand, { 
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                timeout: 30000 // 30 second timeout
            });
            
            this.logger.debug('Kubectl command executed', { command: fullCommand, stdout: stdout.slice(0, 500) });
            
            return {
                stdout: stdout || '',
                stderr: stderr || '',
                exitCode: 0
            };
        } catch (error: any) {
            this.logger.error('Kubectl command failed', { command, error: error.message });
            return {
                stdout: error.stdout || '',
                stderr: error.stderr || error.message || '',
                exitCode: error.code || 1
            };
        }
    }

    /**
     * Get pods in namespace for compatibility
     */
    async getPodsInNamespace(namespace: string): Promise<any[]> {
        try {
            const response = await this.k8sApi.listNamespacedPod({ namespace });
            return response.items;
        } catch (error) {
            this.logger.error('Failed to get pods in namespace', { namespace, error });
            return [];
        }
    }
}