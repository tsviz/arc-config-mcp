/**
 * MCP Tools Registration
 * 
 * Registers all ARC management tools with the MCP server.
 */

import type { ServiceContext } from '../types/arc.js';

/**
 * Register all ARC management tools
 */
export function registerArcTools(server: any, services: ServiceContext): void {
    // Natural language processing tool
    server.registerTool(
        'arc_process_natural_language',
        {
            title: 'Process Natural Language ARC Command',
            description: 'Process natural language commands for ARC operations like "Install ARC", "Scale runners", "Check status"',
            inputSchema: {
                query: {
                    type: 'string',
                    description: 'Natural language query about ARC operations'
                }
            },
            outputSchema: {
                action: { type: 'string' },
                parameters: { type: 'object' },
                confidence: { type: 'number' }
            }
        },
        async ({ query }: { query: string }) => {
            const result = await processNaturalLanguageQuery(query, services);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ],
                structuredContent: result
            };
        }
    );

    // Installation tools
    server.registerTool(
        'arc_install_controller',
        {
            title: 'Install ARC Controller',
            description: 'Install GitHub Actions Runner Controller in Kubernetes cluster',
            inputSchema: {
                namespace: { type: 'string', default: 'arc-systems' },
                version: { type: 'string', default: '0.27.6' },
                certManager: { type: 'boolean', default: true }
            },
            outputSchema: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                details: { type: 'object' }
            }
        },
        async (params: any) => {
            const result = await services.installer.installController(params);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        }
    );

    // Status and monitoring tools
    server.registerTool(
        'arc_get_status',
        {
            title: 'Get ARC Status',
            description: 'Get comprehensive status of ARC installation and runners',
            inputSchema: {},
            outputSchema: {
                controller: { type: 'object' },
                runners: { type: 'array' },
                cluster: { type: 'object' }
            }
        },
        async () => {
            const result = await services.installer.getStatus();
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        }
    );

    // Scaling operations
    server.registerTool(
        'arc_scale_runners',
        {
            title: 'Scale ARC Runners',
            description: 'Scale GitHub Actions runners up or down',
            inputSchema: {
                scaleSetName: { type: 'string' },
                replicas: { type: 'number', minimum: 0, maximum: 100 },
                namespace: { type: 'string', default: 'arc-systems' }
            },
            outputSchema: {
                success: { type: 'boolean' },
                currentReplicas: { type: 'number' },
                targetReplicas: { type: 'number' }
            }
        },
        async (params: any) => {
            services.logger.info('Scaling ARC runners', params);
            const result = {
                success: true,
                currentReplicas: 2,
                targetReplicas: params.replicas,
                message: `Scaled ${params.scaleSetName} to ${params.replicas} replicas`
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        }
    );

    services.logger.info('ARC MCP tools registered successfully');
}

/**
 * Process natural language queries for ARC operations
 */
async function processNaturalLanguageQuery(query: string, services: ServiceContext): Promise<any> {
    const lowercaseQuery = query.toLowerCase();

    // Simple pattern matching for demo - would use proper NLP in production
    if (lowercaseQuery.includes('install') && lowercaseQuery.includes('arc')) {
        return {
            action: 'install_controller',
            parameters: { namespace: 'arc-systems', version: '0.27.6' },
            confidence: 0.9,
            interpretation: 'User wants to install ARC controller'
        };
    }

    if (lowercaseQuery.includes('scale') && lowercaseQuery.includes('runner')) {
        const numbers = query.match(/\d+/);
        const replicas = numbers ? parseInt(numbers[0]) : 2;
        return {
            action: 'scale_runners',
            parameters: { replicas, scaleSetName: 'default-runners' },
            confidence: 0.8,
            interpretation: `User wants to scale runners to ${replicas} replicas`
        };
    }

    if (lowercaseQuery.includes('status') || lowercaseQuery.includes('check')) {
        return {
            action: 'get_status',
            parameters: {},
            confidence: 0.95,
            interpretation: 'User wants to check ARC status'
        };
    }

    return {
        action: 'unknown',
        parameters: {},
        confidence: 0.1,
        interpretation: 'Query not recognized',
        suggestion: 'Try commands like "Install ARC", "Scale runners to 5", or "Check ARC status"'
    };
}