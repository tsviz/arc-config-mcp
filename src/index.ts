#!/usr/bin/env node

/**
 * ARC Config MCP Server
 * 
 * A comprehensive TypeScript MCP server for GitHub Actions Runner Controller (ARC) management
 * with AI-powered automation for Kubernetes-based GitHub Actions runners.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { ArcInstaller } from './services/arc-installer.js';
import { KubernetesService } from './services/kubernetes.js';
import { GitHubService } from './services/github.js';
import { PolicyService } from './services/policy.js';
import { registerArcTools } from './tools/index.js';
import { ArcServerInfo } from './types/arc.js';

// Load environment variables
config();

// Configure logger
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        })
    ]
});

/**
 * Server configuration and implementation
 */
const SERVER_INFO: ArcServerInfo = {
    name: 'arc-config-mcp',
    version: '1.0.0',
    description: 'GitHub Actions Runner Controller (ARC) management with AI-powered automation',
    author: 'tsviz'
};

/**
 * Create and configure the MCP server
 */
function createMcpServer(): McpServer {
    const server = new McpServer(
        {
            name: SERVER_INFO.name,
            version: SERVER_INFO.version,
            description: SERVER_INFO.description,
            icons: [
                {
                    src: './assets/arc-logo.svg',
                    sizes: ['512x512'],
                    mimeType: 'image/svg+xml'
                }
            ],
            websiteUrl: 'https://github.com/tsviz/arc-config-mcp'
        },
        {
            capabilities: {
                tools: {
                    listChanged: true
                },
                resources: {
                    subscribe: true,
                    listChanged: true
                },
                prompts: {
                    listChanged: true
                },
                logging: {}
            }
        }
    );

    // Initialize services
    const kubernetesService = new KubernetesService(logger);
    const githubService = new GitHubService(logger);
    const policyService = new PolicyService(logger);
    const arcInstaller = new ArcInstaller(kubernetesService, githubService, logger);

    // Register all ARC management tools
    registerArcTools(server, {
        kubernetes: kubernetesService,
        github: githubService,
        policy: policyService,
        installer: arcInstaller,
        logger
    });

    logger.info('ARC MCP Server initialized with comprehensive tooling', {
        server: SERVER_INFO.name,
        version: SERVER_INFO.version,
        toolsRegistered: 'comprehensive ARC management tools'
    });

    return server;
}

/**
 * Run server with stdio transport (for local MCP clients)
 */
async function runStdioServer(): Promise<void> {
    logger.info('Starting ARC MCP Server with stdio transport');

    const server = createMcpServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);
    logger.info('ARC MCP Server running on stdio transport');
}

/**
 * Run server with HTTP transport (for remote MCP clients)
 */
async function runHttpServer(port: number = 3000): Promise<void> {
    logger.info(`Starting ARC MCP Server with HTTP transport on port ${port}`);

    const app = express();
    app.use(express.json());
    app.use(cors({
        origin: '*',
        exposedHeaders: ['Mcp-Session-Id']
    }));

    const server = createMcpServer();

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            server: SERVER_INFO.name,
            version: SERVER_INFO.version,
            timestamp: new Date().toISOString()
        });
    });

    // MCP endpoint
    app.post('/mcp', async (req: Request, res: Response) => {
        try {
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
                enableJsonResponse: true
            });

            res.on('close', () => {
                transport.close();
            });

            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        } catch (error: any) {
            logger.error('Error handling MCP request:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal server error'
                    },
                    id: null
                });
            }
        }
    });

    app.listen(port, () => {
        logger.info(`ARC MCP Server running on http://localhost:${port}/mcp`);
    }).on('error', (error: Error) => {
        logger.error('Server error:', error);
        process.exit(1);
    });
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const transport = args.includes('--http') ? 'http' : 'stdio';
    const port = parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '3000');

    try {
        if (transport === 'http') {
            await runHttpServer(port);
        } else {
            await runStdioServer();
        }
    } catch (error: any) {
        logger.error('Fatal error starting ARC MCP Server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        logger.error('Fatal error:', error);
        process.exit(1);
    });
}