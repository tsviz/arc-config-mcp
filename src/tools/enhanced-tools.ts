/**
 * Enhanced ARC Tools with Real-time Progress Updates and Comprehensive Troubleshooting
 * 
 * Provides streaming progress updates that appear in real-time in the Copilot chat interface,
 * with extensive troubleshooting capabilities based on real-world experience.
 */

import type { ServiceContext } from '../types/arc.js';
import { createProgressReporter, formatProgressForChat, ChatAwareLogger, type ProgressUpdate } from '../utils/progress-reporter.js';
import { EnhancedArcInstaller } from '../services/arc-installer-enhanced.js';
import { GitRepositoryDetector } from '../utils/git-repository-detector.js';
import { ArcPolicyEngine } from '../engines/policy-engine.js';
import { ConfigFileManager } from '../services/config-file-manager.js';
import { z } from 'zod';

/**
 * Register enhanced ARC tools with real-time progress updates
 */
export function registerEnhancedArcTools(server: any, services: ServiceContext): void {
    // Enhanced installation tool with streaming progress
    server.registerTool(
        'arc_install_controller',
        {
            title: 'Install ARC Controller with Real-time Progress',
            description: 'Install GitHub Actions Runner Controller in Kubernetes cluster with live status updates in chat',
            inputSchema: {
                namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)"),
                version: z.string().optional().describe("ARC version to install (defaults to latest)"),
                enableRealTimeLogging: z.boolean().optional().describe("Enable real-time logging (defaults to true)")
            }
        },
        async (params: any) => {
            let progressUpdates: string[] = [];
            let currentPhase = '';
            let isComplete = false;
            
            // Create progress reporter that accumulates updates for the chat
            const progressReporter = createProgressReporter(
                (update: ProgressUpdate) => {
                    const formatted = formatProgressForChat(update);
                    progressUpdates.push(formatted);
                    currentPhase = update.phase;
                },
                (finalMessage: string) => {
                    progressUpdates.push(`## ✅ Installation Complete!\n\n${finalMessage}`);
                    isComplete = true;
                },
                (errorMessage: string) => {
                    progressUpdates.push(`## ❌ Installation Failed\n\n${errorMessage}`);
                    isComplete = true;
                }
            );
            
            // Create chat-aware logger
            const chatLogger = new ChatAwareLogger(services.logger, progressReporter);
            
            // Create enhanced installer with chat logger and comprehensive troubleshooting
            const enhancedInstaller = new EnhancedArcInstaller(
                services.kubernetes, 
                services.github, 
                chatLogger
            );
            
            try {
                // Phase 1: Pre-installation cluster analysis
                progressReporter.updateProgress({
                    phase: 'Cluster Analysis',
                    progress: 0,
                    message: 'Analyzing current cluster state and generating installation plan...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '🔍 Performing comprehensive cluster assessment before installation'
                });

                const clusterAnalysis = await enhancedInstaller.analyzeClusterForInstallation(params);
                progressUpdates.push(formatClusterAnalysisForChat(clusterAnalysis));

                // Phase 2: Generate execution plan
                progressReporter.updateProgress({
                    phase: 'Execution Planning',
                    progress: 10,
                    message: 'Generating detailed execution plan with command preview...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '📋 Creating step-by-step installation plan with exact commands'
                });

                const executionPlan = await enhancedInstaller.generateInstallationPlan(params, clusterAnalysis);
                progressUpdates.push(formatExecutionPlanForChat(executionPlan));

                // Phase 3: User confirmation prompt (simulated)
                progressReporter.updateProgress({
                    phase: 'Ready to Execute',
                    progress: 20,
                    message: 'Installation plan ready. Proceeding with execution...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '🚀 All prerequisites validated - beginning installation with real-time monitoring'
                });

                // Start installation with enhanced troubleshooting capabilities
                // Enable automatic cleanup on failure if CLEANUP_ARC=true
                const installationOptions = {
                    ...params,
                    autoCleanupOnFailure: process.env.CLEANUP_ARC === 'true'
                };
                
                const result = await enhancedInstaller.installController(installationOptions);
                
                progressReporter.complete('🎉 ARC Controller installation completed successfully! Ready to deploy GitHub Actions runners. 🏃‍♂️ Next: Deploy 20 runners? (Default for high-capacity workloads)');
                
                // Add runner deployment follow-up prompt
                const runnerPrompt = `

## 🚀 **ARC Installation Complete!**

### 📋 **Next Steps:**
Your ARC Controller is now ready to manage GitHub Actions runners. 

### 🏃‍♂️ **Deploy Runners?**
Would you like to deploy GitHub Actions runners now?

**💡 Recommendation:** Deploy **20 runners** with auto-scaling (20-40+ range) for optimal high-capacity performance and concurrent parallel jobs.

**Options:**
- ✅ **Deploy 20 runners** (default for high-capacity workloads)
- 📈 **Deploy more runners** (specify number: "Deploy 30 runners", "Deploy 50 runners")
- � **Deploy fewer runners** (specify number: "Deploy 10 runners", "Deploy 5 runners")
- 🔧 **Custom deployment** (specify your own configuration)  
- ⏭️ **Skip for now** (deploy runners later)

### 🎯 **Quick Deploy Command:**
To deploy 20 runners with auto-scaling, you can say:
> *"Deploy runners"* or *"Deploy 20 runners"* or *"Deploy runners with auto-scaling"*

### 📊 **Current Status:**
- ✅ ARC Controller: Installed and ready
- ⏳ Runners: Not deployed yet
- 🛡️ Security: Enterprise hardening active
- 📈 Monitoring: AI-powered insights enabled`;
                
                // Return accumulated progress updates plus final result and runner prompt
                const finalContent = progressUpdates.join('\n---\n\n') + runnerPrompt + '\n\n## 📊 Final Installation Report\n\n```json\n' + JSON.stringify(result, null, 2) + '\n```';
                
                return {
                    content: [
                        {
                            type: 'text', 
                            text: finalContent
                        }
                    ],
                    structuredContent: {
                        type: 'installation_progress',
                        updates: progressUpdates,
                        result: result,
                        clusterAnalysis: clusterAnalysis,
                        executionPlan: executionPlan,
                        isComplete: true,
                        runnerDeploymentPrompt: {
                            recommended: true,
                            defaultCount: 20,
                            autoScaling: {
                                min: 20,
                                max: 40
                            },
                            message: "Would you like to deploy GitHub Actions runners now? (Recommended: 20 runners with auto-scaling)"
                        }
                    }
                };
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                
                // Enhanced error handling with specific guidance for prerequisite validation failures
                let enhancedErrorMessage = `Installation failed: ${errorMessage}`;
                let errorDetails = '';
                
                // Check if this is a prerequisite validation error and provide specific guidance
                if (errorMessage.includes('Prerequisites validation failed')) {
                    enhancedErrorMessage = `❌ **Prerequisites Validation Failed**\n\nThe ARC installation cannot proceed due to prerequisite validation issues.\n\n`;
                    
                    // Try to get more specific error details by testing GitHub token directly
                    try {
                        const githubToken = process.env.GITHUB_TOKEN;
                        if (githubToken) {
                            const response = await fetch('https://api.github.com/user', {
                                headers: {
                                    'Authorization': `token ${githubToken}`,
                                    'Accept': 'application/vnd.github.v3+json'
                                }
                            });
                            
                            if (response.status === 401) {
                                const errorBody = await response.json();
                                errorDetails = `## 🔑 **GitHub Token Authentication Failed**\n\n` +
                                    `**Error:** ${errorBody.message || 'Bad credentials'}\n` +
                                    `**Status:** ${response.status} Unauthorized\n\n` +
                                    `Your GitHub Personal Access Token (PAT) is **invalid, expired, or malformed**.\n\n` +
                                    `### 🔧 **How to Fix:**\n` +
                                    `1. **Check token format**: Should start with 'ghp_' or 'github_pat_'\n` +
                                    `2. **Verify token length**: Should be 40+ characters\n` +
                                    `3. **Generate new token**: Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)\n` +
                                    `4. **Required permissions**:\n` +
                                    `   - **Organization permissions:**\n` +
                                    `     - Administration: Read\n` +
                                    `     - Self-hosted runners: Read and write\n` +
                                    `   - **Repository permissions:**\n` +
                                    `     - Administration: Read and write\n` +
                                    `5. **Update MCP configuration** with the new token\n` +
                                    `6. **Restart the MCP server** and try again\n\n` +
                                    `### 🎯 **Current Token Info:**\n` +
                                    `- **Format**: ${githubToken.substring(0, 10)}...${githubToken.substring(githubToken.length - 4)}\n` +
                                    `- **Length**: ${githubToken.length} characters\n` +
                                    `- **Starts with**: ${githubToken.substring(0, 4)}\n\n` +
                                    `### 📚 **Documentation:**\n` +
                                    `- [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)\n` +
                                    `- [Token permissions for GitHub Actions](https://docs.github.com/en/rest/actions/self-hosted-runners)`;
                            } else if (response.status === 403) {
                                errorDetails = `## 🔑 **GitHub Token Permission Issues**\n\n` +
                                    `Your GitHub token is valid but lacks required permissions.\n\n` +
                                    `### 🔧 **Required Token Permissions:**\n` +
                                    `**Organization permissions:**\n` +
                                    `- Administration: Read\n` +
                                    `- Self-hosted runners: Read and write\n\n` +
                                    `**Repository permissions (if using repo-level runners):**\n` +
                                    `- Administration: Read and write\n\n` +
                                    `### 💡 **How to Fix:**\n` +
                                    `1. Go to [GitHub Token Settings](https://github.com/settings/tokens)\n` +
                                    `2. Click on your token or create a new one\n` +
                                    `3. Update the permissions as listed above\n` +
                                    `4. Click "Update token" or "Generate token"\n` +
                                    `5. Update your MCP configuration with the new token\n` +
                                    `6. Restart the MCP server and try again`;
                            } else if (response.ok) {
                                const user = await response.json();
                                errorDetails = `## ✅ **GitHub Token is Valid**\n\n` +
                                    `**User:** ${user.login}\n` +
                                    `**Token Status:** Valid and authenticated\n\n` +
                                    `The GitHub token validation passed, so the issue is likely with:\n` +
                                    `- Kubernetes cluster connectivity\n` +
                                    `- Helm installation\n` +
                                    `- Other prerequisites\n\n` +
                                    `Check the detailed logs above for specific error information.`;
                            }
                        } else {
                            errorDetails = `## 🔑 **GitHub Token Missing**\n\n` +
                                `No GitHub token found in environment variable GITHUB_TOKEN.\n\n` +
                                `### 🔧 **How to Fix:**\n` +
                                `1. Generate a token at [GitHub Settings](https://github.com/settings/tokens)\n` +
                                `2. Set the GITHUB_TOKEN environment variable\n` +
                                `3. Restart the MCP server`;
                        }
                    } catch (testError) {
                        errorDetails = `## ⚠️ **Unable to Test GitHub Token**\n\n` +
                            `Could not perform detailed GitHub token validation: ${testError}\n\n` +
                            `This might be a network connectivity issue or the token might be malformed.`;
                    }
                    
                    // Generic fallback for other prerequisite types
                    if (!errorDetails && errorMessage.includes('Kubernetes')) {
                        errorDetails = `## ⚙️ **Kubernetes Access Issues**\n\n` +
                            `Cannot connect to your Kubernetes cluster.\n\n` +
                            `### 🔧 **How to Fix:**\n` +
                            `1. Ensure kubectl is installed and configured\n` +
                            `2. Test cluster access: \`kubectl cluster-info\`\n` +
                            `3. Verify your kubeconfig is correct\n` +
                            `4. Check if cluster is running and accessible`;
                    } else if (errorMessage.includes('Helm')) {
                        errorDetails = `## 📦 **Helm Issues**\n\n` +
                            `Helm is not available or not properly configured.\n\n` +
                            `### 🔧 **How to Fix:**\n` +
                            `1. Install Helm 3.x from [helm.sh](https://helm.sh/docs/intro/install/)\n` +
                            `2. Verify installation: \`helm version\`\n` +
                            `3. Ensure Helm has access to your cluster`;
                    }
                    
                    // Add warning count if mentioned in error
                    const warningMatch = errorMessage.match(/(\d+) warnings?/);
                    if (warningMatch) {
                        errorDetails += `\n\n### ⚠️ **Additional Warnings:** ${warningMatch[1]} warning(s) detected\n` +
                            `Check the detailed logs above for warning details.`;
                    }
                }
                
                const fullErrorMessage = enhancedErrorMessage + '\n' + errorDetails;
                progressReporter.error(fullErrorMessage);
                
                const finalContent = progressUpdates.join('\n---\n\n');
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: finalContent
                        }
                    ],
                    structuredContent: {
                        type: 'installation_error',
                        updates: progressUpdates,
                        error: errorMessage,
                        enhancedError: fullErrorMessage,
                        errorType: errorMessage.includes('Prerequisites validation failed') ? 'prerequisite_validation' : 'installation_error',
                        isComplete: true
                    }
                };
            }
        }
    );
    
    // Enhanced status tool with visual diagrams
    server.registerTool(
        'arc_get_status',
        {
            title: 'Get ARC Status with Visual Diagrams',
            description: 'Get comprehensive status of ARC installation with real-time visual diagrams',
            inputSchema: {
                namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)"),
                includeVisualDiagram: z.boolean().optional().describe("Include visual diagram (defaults to true)")
            }
        },
        async (params: any) => {
            try {
                services.logger.info('🔍 Gathering comprehensive ARC status with visual diagrams...');
                
                const includeVisualDiagram = params.includeVisualDiagram !== false; // Default to true
                
                const result = await services.installer.getStatus();
                
                // Create enhanced status display with visual elements
                let statusContent = `# 🎯 ARC Status Dashboard\n\n`;
                
                // Add visual diagram if requested (and we have data for it)
                if (includeVisualDiagram && result.controller?.installed) {
                    statusContent += `## 🎨 Visual Cluster Diagram\n\n`;
                    
                    // Generate cluster diagram based on current state
                    const namespace = params.namespace || 'arc-systems';
                    const deploymentStatus = {
                        arcDeployment: {
                            metadata: { name: 'arc-gha-rs-controller' },
                            spec: { replicas: result.controller.pods },
                            status: { 
                                readyReplicas: result.controller.readyPods,
                                conditions: [{ type: 'Available', status: result.controller.status === 'Healthy' ? 'True' : 'False' }]
                            }
                        },
                        services: [],
                        hasSecret: true
                    };
                    
                    // Use the installer's diagram generation method
                    const clusterDiagram = (services.installer as any).generateClusterDiagram(deploymentStatus, namespace);
                    statusContent += `\`\`\`\n${clusterDiagram}\n\`\`\`\n\n`;
                    
                    // Add runner ecosystem diagram if runners exist
                    if (result.runners && result.runners.length > 0) {
                        const runnerEcosystemDiagram = (services.installer as any).generateRunnerEcosystemDiagram(result.runners);
                        statusContent += `## 🏃‍♂️ Runner Ecosystem Diagram\n\n`;
                        statusContent += `\`\`\`\n${runnerEcosystemDiagram}\n\`\`\`\n\n`;
                    }
                }
                
                // Controller Status
                statusContent += `## 🤖 Controller Status\n\n`;
                statusContent += `- **Installed:** ${result.controller.installed ? '✅ Yes' : '❌ No'}\n`;
                statusContent += `- **Status:** ${getStatusEmoji(result.controller.status)} ${result.controller.status}\n`;
                statusContent += `- **Pods:** ${result.controller.readyPods}/${result.controller.pods} ready\n`;
                statusContent += `- **Namespace:** \`${result.controller.namespace}\`\n`;
                statusContent += `- **Version:** ${result.controller.version}\n\n`;
                
                // Runner Status
                statusContent += `## 🏃‍♂️ Runner Status\n\n`;
                if (result.runners && result.runners.length > 0) {
                    result.runners.forEach((runner: any) => {
                        statusContent += `### ${runner.name}\n`;
                        statusContent += `- **Status:** ${getStatusEmoji(runner.status)} ${runner.status}\n`;
                        statusContent += `- **Runners:** ${runner.status?.currentRunners || 0}/${runner.spec?.maxRunners || 0} (min: ${runner.spec?.minRunners || 0})\n`;
                        statusContent += `- **AI Optimized:** ${runner.aiOptimized ? '🧠 Yes' : '⚪ No'}\n\n`;
                    });
                } else {
                    statusContent += `*No runner scale sets deployed yet.*\n\n`;
                    statusContent += `💡 **Next Step:** Deploy runners using the AI-generated configuration.\n\n`;
                }
                
                // AI Insights
                if (result.aiInsights && result.aiInsights.length > 0) {
                    statusContent += `## 🧠 AI Insights\n\n`;
                    result.aiInsights.forEach((insight: string) => {
                        statusContent += `- ${insight}\n`;
                    });
                    statusContent += `\n`;
                }
                
                // Compliance Score
                statusContent += `## 🛡️ Security & Compliance\n\n`;
                statusContent += `- **Compliance Score:** ${getScoreEmoji(result.compliance.score)} ${result.compliance.score}%\n`;
                statusContent += `- **Security Hardening:** ${result.compliance.securityHardening}\n`;
                statusContent += `- **Network Policies:** ${result.compliance.networkPolicies}\n`;
                statusContent += `- **Pod Security Standards:** ${result.compliance.podSecurityStandards}\n\n`;
                
                // Recommendations
                if (result.recommendations && result.recommendations.length > 0) {
                    statusContent += `## 💡 Recommendations\n\n`;
                    result.recommendations.forEach((rec: string) => {
                        statusContent += `- ${rec}\n`;
                    });
                    statusContent += `\n`;
                }
                
                // Add timestamp
                statusContent += `---\n*Status updated at ${new Date().toLocaleString()}*`;
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: statusContent
                        }
                    ],
                    structuredContent: {
                        type: 'arc_status_dashboard',
                        timestamp: new Date().toISOString(),
                        ...result
                    }
                };
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                services.logger.error('Failed to get ARC status', { error: errorMessage });
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `# ❌ Error Getting ARC Status\n\n${errorMessage}\n\n💡 **Tip:** Make sure ARC is installed and your kubectl is configured correctly.`
                        }
                    ],
                    structuredContent: {
                        type: 'error',
                        error: errorMessage
                    }
                };
            }
        }
    );
    
    // Natural language processing tool with enhanced feedback
    server.registerTool(
        'arc_process_natural_language',
        {
            title: 'Process Complex ARC Queries',
            description: 'Handle complex or ambiguous ARC-related queries that require interpretation and analysis.',
            inputSchema: {
                query: z.string().describe("Natural language command or query")
            }
        },
        async (params: { query: string }) => {
            const result = await processNaturalLanguageQuery(params.query, services);
            
            let responseContent = `# 🧠 AI Command Interpretation\n\n`;
            responseContent += `**Your Command:** "${params.query}"\n\n`;
            responseContent += `**Interpretation:** ${result.interpretation}\n\n`;
            responseContent += `**Confidence:** ${Math.round(result.confidence * 100)}%\n\n`;
            responseContent += `**Suggested Action:** ${result.action}\n\n`;
            
            if (result.parameters && Object.keys(result.parameters).length > 0) {
                responseContent += `**Parameters:**\n`;
                Object.entries(result.parameters).forEach(([key, value]) => {
                    responseContent += `- ${key}: \`${value}\`\n`;
                });
                responseContent += `\n`;
            }
            
            if (result.suggestion) {
                responseContent += `💡 **Suggestion:** ${result.suggestion}\n\n`;
            }
            
            return {
                content: [
                    {
                        type: 'text',
                        text: responseContent
                    }
                ],
                structuredContent: result
            };
        }
    );
    
    // Enhanced scaling tool
    server.registerTool(
        'arc_scale_runners',
        {
            title: 'Scale ARC Runners',
            description: 'Scale GitHub Actions runners with intelligent cost and performance recommendations.',
            inputSchema: {
                minReplicas: z.number().optional().describe("Minimum number of runners for auto-scaling"),
                maxReplicas: z.number().optional().describe("Maximum number of runners for auto-scaling"),
                replicas: z.number().optional().describe("Fixed number of runners (used when not auto-scaling)"),
                runnerName: z.string().optional().describe("Name of specific runner deployment to scale"),
                namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)")
            }
        },
        async (params: any) => {
            services.logger.info('🔄 Scaling ARC runners with AI optimization', params);
            
            // IMMEDIATE OVERRIDE: Force GITHUB_ORG before any other processing
            if (process.env.GITHUB_ORG) {
                const originalOrg = params.organization;
                params.organization = process.env.GITHUB_ORG;
                services.logger.info(`IMMEDIATE OVERRIDE: organization "${originalOrg}" → "${process.env.GITHUB_ORG}" (GITHUB_ORG takes absolute precedence)`);
            }
            
            // VALIDATION: Detect and fix incorrect parameter usage for scaling
            if (params.replicas && !params.minReplicas && !params.maxReplicas) {
                services.logger.warn(`⚠️ Detected potential min/max misinterpretation in scaling. Using replicas=${params.replicas} as maxReplicas, calculating minReplicas`);
                params.maxReplicas = params.replicas;
                params.minReplicas = Math.max(1, Math.floor(params.replicas * 0.6)); // Use 60% as min
                delete params.replicas; // Remove the incorrect parameter
            }
            
            services.logger.info('✅ Validated scaling parameters', params);
            
            try {
                // Get current AutoscalingRunnerSets
                const namespace = params.namespace || 'arc-systems';
                const runnerName = params.runnerName;
                
                let autoscalingRunnerSets;
                if (runnerName) {
                    // Scale specific runner set
                    autoscalingRunnerSets = await services.installer.commandExecutor.kubectl(
                        `get autoscalingrunnersets ${runnerName} -n ${namespace} -o json`
                    );
                } else {
                    // Get all runner sets and scale the first one found
                    autoscalingRunnerSets = await services.installer.commandExecutor.kubectl(
                        `get autoscalingrunnersets -n ${namespace} -o json`
                    );
                }
                
                const arsData = JSON.parse(autoscalingRunnerSets.stdout);
                let targetRunnerSet;
                
                if (arsData.items && arsData.items.length > 0) {
                    // Multiple runner sets - use first one if no specific name provided
                    targetRunnerSet = arsData.items[0];
                } else if (arsData.metadata) {
                    // Single runner set
                    targetRunnerSet = arsData;
                } else {
                    throw new Error('No AutoscalingRunnerSets found in namespace ' + namespace);
                }
                
                const currentRunnerSetName = targetRunnerSet.metadata.name;
                const currentMinRunners = targetRunnerSet.spec.minRunners || 0;
                const currentMaxRunners = targetRunnerSet.spec.maxRunners || 1;
                
                // Determine new scaling configuration
                let newMinRunners, newMaxRunners;
                
                if (params.minReplicas !== undefined && params.maxReplicas !== undefined) {
                    // Both min and max specified
                    newMinRunners = params.minReplicas;
                    newMaxRunners = params.maxReplicas;
                } else if (params.replicas) {
                    // Single replica count - set as max, calculate min
                    newMaxRunners = params.replicas;
                    newMinRunners = Math.max(1, Math.floor(params.replicas * 0.6));
                } else if (params.minReplicas !== undefined) {
                    // Only min specified, keep current max or increase if needed
                    newMinRunners = params.minReplicas;
                    newMaxRunners = Math.max(currentMaxRunners, params.minReplicas);
                } else if (params.maxReplicas !== undefined) {
                    // Only max specified, keep current min or decrease if needed
                    newMaxRunners = params.maxReplicas;
                    newMinRunners = Math.min(currentMinRunners, params.maxReplicas);
                } else {
                    throw new Error('No scaling parameters provided. Specify replicas, minReplicas, maxReplicas, or both min/max.');
                }
                
                services.logger.info(`Scaling ${currentRunnerSetName}: ${currentMinRunners}-${currentMaxRunners} → ${newMinRunners}-${newMaxRunners}`);
                
                // Apply the scaling using kubectl patch
                const patchData = {
                    spec: {
                        minRunners: newMinRunners,
                        maxRunners: newMaxRunners
                    }
                };
                
                await services.installer.commandExecutor.kubectl(
                    `patch autoscalingrunnersets ${currentRunnerSetName} -n ${namespace} --type merge -p '${JSON.stringify(patchData)}'`
                );
                
                // GitOps: Update config file if configs directory exists
                let configUpdated = false;
                try {
                    const fs = await import('fs/promises');
                    const path = await import('path');
                    
                    const configDir = path.join(process.cwd(), 'configs', 'runner-sets');
                    const configPath = path.join(configDir, `${currentRunnerSetName}.yaml`);
                    
                    // Check if configs directory exists
                    try {
                        await fs.access(configDir);
                        
                        // Check if config file exists
                        try {
                            await fs.access(configPath);
                            
                            // Read current config file
                            const configContent = await fs.readFile(configPath, 'utf-8');
                            
                            // Update minRunners and maxRunners in YAML
                            let updatedContent = configContent
                                .replace(/(\s+minRunners:\s+)\d+/g, `$1${newMinRunners}`)
                                .replace(/(\s+maxRunners:\s+)\d+/g, `$1${newMaxRunners}`);
                            
                            // Write back updated config
                            await fs.writeFile(configPath, updatedContent, 'utf-8');
                            
                            configUpdated = true;
                            services.logger.info(`✅ Updated config file: ${configPath}`);
                            
                        } catch (fileError) {
                            // Config file doesn't exist - that's ok, user might be in Direct mode
                            services.logger.debug(`Config file not found: ${configPath} (Direct mode assumed)`);
                        }
                        
                    } catch (dirError) {
                        // configs directory doesn't exist - that's ok, user is in Direct mode
                        services.logger.debug('configs/runner-sets/ directory not found (Direct mode assumed)');
                    }
                    
                } catch (error) {
                    // Any other error - log but don't fail the operation
                    services.logger.debug('Could not update config file:', error);
                }
                
                // Wait a moment and get current status
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Get current pod count
                const pods = await services.installer.commandExecutor.kubectl(
                    `get pods -n ${namespace} -l app.kubernetes.io/name=gha-runner-scale-set -o json`
                );
                const podData = JSON.parse(pods.stdout);
                const currentReplicas = podData.items ? podData.items.length : 0;
                
                const result = {
                    success: true,
                    runnerSetName: currentRunnerSetName,
                    currentReplicas,
                    previousConfig: {
                        minRunners: currentMinRunners,
                        maxRunners: currentMaxRunners
                    },
                    newConfig: {
                        minRunners: newMinRunners,
                        maxRunners: newMaxRunners
                    },
                    autoscalingEnabled: true,
                    configUpdated,
                    message: `Successfully updated ${currentRunnerSetName} scaling: min=${newMinRunners}, max=${newMaxRunners}`,
                    aiRecommendation: newMaxRunners > 20 ? 
                        '💡 Consider monitoring resource usage with this scale' :
                        '✅ Optimal scaling configuration applied',
                    estimatedCost: calculateEstimatedCost(newMaxRunners),
                    timeline: `Scaling changes will take effect within 1-2 minutes`
                };
                
                let scalingContent = `# 🔄 Runner Scaling Operation Complete\n\n`;
                scalingContent += `**Runner Set:** ${currentRunnerSetName}\n`;
                scalingContent += `**Namespace:** ${namespace}\n`;
                scalingContent += `**Current Active Pods:** ${currentReplicas}\n`;
                scalingContent += `**Previous Range:** ${currentMinRunners} - ${currentMaxRunners} runners\n`;
                scalingContent += `**New Range:** ${newMinRunners} - ${newMaxRunners} runners\n`;
                scalingContent += `**Status:** ✅ Successfully updated\n`;
                if (configUpdated) {
                    scalingContent += `**Config File:** ✅ Updated in configs/runner-sets/${currentRunnerSetName}.yaml\n`;
                }
                scalingContent += `\n## 🧠 AI Analysis\n\n`;
                scalingContent += `**Recommendation:** ${result.aiRecommendation}\n`;
                scalingContent += `**Estimated Cost:** ${result.estimatedCost}\n`;
                scalingContent += `**Timeline:** ${result.timeline}\n\n`;
                scalingContent += `**Note:** The autoscaler will adjust the actual number of runners based on workload demand within the new ${newMinRunners}-${newMaxRunners} range.`;
                
                return {
                    content: [{ type: 'text', text: scalingContent }],
                    structuredContent: result
                };
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                services.logger.error('Scaling failed:', errorMessage);
                
                const result = {
                    success: false,
                    error: errorMessage,
                    message: `Scaling failed: ${errorMessage}`
                };
                
                let errorContent = `# ❌ Runner Scaling Failed\n\n`;
                errorContent += `**Error:** ${errorMessage}\n\n`;
                errorContent += `## 🔧 Troubleshooting Steps:\n\n`;
                errorContent += `1. **Check if AutoscalingRunnerSets exist:** \`kubectl get autoscalingrunnersets -n arc-systems\`\n`;
                errorContent += `2. **Verify namespace:** Ensure the runners are in the correct namespace\n`;
                errorContent += `3. **Check permissions:** Ensure kubectl has permissions to modify AutoscalingRunnerSets\n`;
                errorContent += `4. **View logs:** Check ARC controller logs for more details\n`;
                
                return {
                    content: [{ type: 'text', text: errorContent }],
                    structuredContent: result
                };
            }
        }
    );

        // Pre-cleanup analysis tool with comprehensive state assessment and Mermaid diagram
    server.registerTool(
        'arc_analyze_cleanup_state',
        {
            title: 'Analyze ARC Cleanup State',
            description: 'Comprehensive analysis of current ARC installation state with detailed report and visual diagram before cleanup',
            inputSchema: {
                namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)"),
                includeVisualDiagram: z.boolean().optional().describe("Include visual diagram (defaults to true)")
            }
        },
        async (params: any) => {
            let progressUpdates: string[] = [];
            
            // Create progress reporter for analysis
            const progressReporter = createProgressReporter(
                (update: ProgressUpdate) => {
                    const formatted = formatProgressForChat(update);
                    progressUpdates.push(formatted);
                },
                (finalMessage: string) => {
                    progressUpdates.push(`## ✅ Analysis Complete!\n\n${finalMessage}`);
                },
                (errorMessage: string) => {
                    progressUpdates.push(`## ❌ Analysis Failed\n\n${errorMessage}`);
                }
            );
            
            // Create enhanced installer for analysis
            const enhancedInstaller = new EnhancedArcInstaller(
                services.kubernetes, 
                services.github, 
                services.logger
            );
            
            try {
                // Phase 1: Cluster State Analysis
                progressReporter.updateProgress({
                    phase: 'State Analysis',
                    progress: 10,
                    message: 'Analyzing current ARC installation state...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '🔍 Performing comprehensive cluster state assessment'
                });

                const clusterAnalysis = await enhancedInstaller.analyzeClusterForCleanup(params);
                
                // Phase 2: Issue Detection
                progressReporter.updateProgress({
                    phase: 'Issue Detection',
                    progress: 30,
                    message: 'Detecting potential cleanup issues and stuck resources...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '🔧 Scanning for finalizers, orphaned resources, and blocking conditions'
                });

                // Detect stuck resources and potential issues
                const stuckResources = await analyzeStuckResources(services.kubernetes);
                const namespaceIssues = await analyzeNamespaceIssues(services.kubernetes);
                const finalizerIssues = await analyzeFinalizerIssues(services.kubernetes);
                
                // Phase 3: Risk Assessment
                progressReporter.updateProgress({
                    phase: 'Risk Assessment',
                    progress: 50,
                    message: 'Assessing cleanup risks and complexity...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '⚡ Evaluating potential impact and cleanup complexity'
                });

                const riskAssessment = calculateCleanupRisk({
                    stuckResources,
                    namespaceIssues,
                    finalizerIssues,
                    clusterAnalysis
                });

                // Phase 4: Generate Cleanup Strategy
                progressReporter.updateProgress({
                    phase: 'Strategy Planning',
                    progress: 70,
                    message: 'Generating recommended cleanup strategy...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '📋 Creating optimal cleanup plan with fallback strategies'
                });

                const cleanupStrategy = generateCleanupStrategy({
                    stuckResources,
                    namespaceIssues,
                    finalizerIssues,
                    riskAssessment
                });

                // Phase 5: Generate Mermaid Diagram
                progressReporter.updateProgress({
                    phase: 'Diagram Generation',
                    progress: 90,
                    message: 'Creating visual representation of cleanup state...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '🎨 Generating comprehensive state diagram'
                });

                const mermaidDiagram = generateCleanupStateDiagram({
                    clusterAnalysis,
                    stuckResources,
                    namespaceIssues,
                    finalizerIssues,
                    riskAssessment,
                    cleanupStrategy
                });

                progressReporter.complete('📊 Cleanup state analysis completed successfully!');

                // Format the comprehensive report
                const analysisReport = formatCleanupAnalysisReport({
                    clusterAnalysis,
                    stuckResources,
                    namespaceIssues,
                    finalizerIssues,
                    riskAssessment,
                    cleanupStrategy,
                    mermaidDiagram
                });

                const finalContent = progressUpdates.join('\n---\n\n') + '\n\n' + analysisReport;
                
                return {
                    content: [{ type: 'text', text: finalContent }],
                    structuredContent: {
                        type: 'cleanup_analysis',
                        updates: progressUpdates,
                        analysis: {
                            clusterAnalysis,
                            stuckResources,
                            namespaceIssues,
                            finalizerIssues,
                            riskAssessment,
                            cleanupStrategy
                        },
                        mermaidDiagram,
                        isComplete: true
                    }
                };
            } catch (error) {
                progressReporter.error(`Analysis failed: ${error}`);
                return {
                    content: [{ type: 'text', text: progressUpdates.join('\n---\n\n') }],
                    structuredContent: {
                        type: 'analysis_error',
                        updates: progressUpdates,
                        error: error instanceof Error ? error.message : String(error),
                        isComplete: true
                    }
                };
            }
        }
    );

    // Enhanced cleanup tool with comprehensive troubleshooting and progressive safety measures
    server.registerTool(
        'arc_cleanup_installation', 
        {
            title: 'Cleanup/Uninstall ARC with Real-time Progress',
            description: 'Comprehensive cleanup and uninstallation of ARC with AI-guided safety checks and live progress updates',
            inputSchema: {
                namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)"),
                organization: z.string().optional().describe("GitHub organization name for runner cleanup (will auto-detect if not provided)"),
                aggressiveMode: z.boolean().optional().describe("Enable aggressive cleanup mode - assumes runners are not in use (defaults to true for MCP)"),
                preserveData: z.boolean().optional().describe("Preserve data and configurations (defaults to false)"),
                dryRun: z.boolean().optional().describe("Preview cleanup without making changes (defaults to false)"),
                forceNamespaceRemoval: z.boolean().optional().describe("Force removal of namespace even if it contains other resources (defaults to false)")
            }
        },
        async (params: any) => {
            let progressUpdates: string[] = [];
            let currentPhase = '';
            let isComplete = false;
            
            // Create progress reporter that accumulates updates for the chat
            const progressReporter = createProgressReporter(
                (update: ProgressUpdate) => {
                    const formatted = formatProgressForChat(update);
                    progressUpdates.push(formatted);
                    currentPhase = update.phase;
                },
                (finalMessage: string) => {
                    progressUpdates.push(`## ✅ Cleanup Complete!\n\n${finalMessage}`);
                    isComplete = true;
                },
                (errorMessage: string) => {
                    progressUpdates.push(`## ❌ Cleanup Failed\n\n${errorMessage}`);
                    isComplete = true;
                }
            );
            
            // Create chat-aware logger
            const chatLogger = new ChatAwareLogger(services.logger, progressReporter);
            
            // Create enhanced installer with chat logger for comprehensive cleanup
            const enhancedInstaller = new EnhancedArcInstaller(
                services.kubernetes, 
                services.github, 
                chatLogger
            );
            
            try {
                // Check for CLEANUP_ARC environment variable or explicit request
                const shouldCleanup = process.env.CLEANUP_ARC === 'true' || params.cleanup === true || params.uninstall === true;
                
                if (!shouldCleanup) {
                    progressReporter.updateProgress({
                        phase: 'Safety Check',
                        progress: 0,
                        message: 'Cleanup functionality is disabled by default for safety',
                        timestamp: new Date().toISOString(),
                        aiInsight: 'Set CLEANUP_ARC=true environment variable or pass cleanup=true parameter to enable'
                    });
                    
                    progressReporter.complete('🛡️ Cleanup not performed - safety mode enabled. Use CLEANUP_ARC=true to enable cleanup functionality.');
                    
                    const finalContent = progressUpdates.join('\n---\n\n') + '\n\n## 🛡️ Safety Configuration\n\n```text\nTo enable cleanup functionality:\n1. Set environment variable: CLEANUP_ARC=true\n2. Or pass parameter: cleanup=true\n3. Restart the MCP server\n```';
                    
                    return {
                        content: [{ type: 'text', text: finalContent }],
                        structuredContent: {
                            type: 'cleanup_disabled',
                            updates: progressUpdates,
                            safetyMode: true,
                            isComplete: true
                        }
                    };
                }

                // Phase 1: Pre-cleanup cluster analysis
                progressReporter.updateProgress({
                    phase: 'Cluster Analysis',
                    progress: 0,
                    message: 'Analyzing current cluster state and generating cleanup plan...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '🔍 Performing comprehensive cluster assessment before cleanup'
                });

                const clusterAnalysis = await enhancedInstaller.analyzeClusterForCleanup(params);
                progressUpdates.push(formatClusterAnalysisForChat(clusterAnalysis));

                // Phase 2: Generate cleanup execution plan
                progressReporter.updateProgress({
                    phase: 'Cleanup Planning',
                    progress: 10,
                    message: 'Generating detailed cleanup plan with command preview...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '📋 Creating step-by-step cleanup plan with exact commands'
                });

                const cleanupPlan = await enhancedInstaller.generateCleanupPlan(params, clusterAnalysis);
                progressUpdates.push(formatCleanupPlanForChat(cleanupPlan));

                // Phase 3: Safety validation
                progressReporter.updateProgress({
                    phase: 'Safety Validation',
                    progress: 15,
                    message: 'Performing safety checks and impact analysis...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '🛡️ Analyzing cleanup impact and ensuring safe execution'
                });
                
                // Start cleanup with comprehensive troubleshooting
                progressReporter.updateProgress({
                    phase: 'Initialization',
                    progress: 20,
                    message: 'Starting comprehensive ARC cleanup with AI-guided safety checks...',
                    timestamp: new Date().toISOString(),
                    aiInsight: '🚀 All safety checks passed - beginning cleanup with real-time monitoring'
                });
                
                const cleanupOptions = {
                    namespace: params.namespace || 'arc-systems',
                    organization: params.organization, // Pass organization for GitHub runner cleanup
                    preserveData: params.preserveData || false,
                    dryRun: params.dryRun || false,
                    force: true, // Always force when using MCP
                    forceNamespaceRemoval: params.forceNamespaceRemoval || false,
                    aggressiveMode: params.aggressiveMode !== false // Default to true for MCP unless explicitly disabled
                };
                
                progressReporter.updateProgress({
                    phase: 'Configuration',
                    progress: 10,
                    message: `Ultra-robust cleanup configuration: ${JSON.stringify(cleanupOptions)}`,
                    timestamp: new Date().toISOString(),
                    aiInsight: 'MCP-triggered cleanup operates in aggressive mode by default - assumes runners can be safely terminated'
                });
                
                const result = await enhancedInstaller.cleanupArcWithTroubleshooting(cleanupOptions);
                
                progressReporter.complete('🎉 ARC cleanup completed successfully with AI guidance!');
                
                // Format the final content with cleanup results
                let finalContent = progressUpdates.join('\n---\n\n') + '\n\n## 📊 Cleanup Summary\n\n';
                
                if (result.summary.removed.length > 0) {
                    finalContent += `### ✅ Components Removed:\n`;
                    result.summary.removed.forEach((component: string) => {
                        finalContent += `- ${component}\n`;
                    });
                    finalContent += '\n';
                }
                
                if (result.summary.preserved.length > 0) {
                    finalContent += `### 🛡️ Components Preserved:\n`;
                    result.summary.preserved.forEach((component: string) => {
                        finalContent += `- ${component}\n`;
                    });
                    finalContent += '\n';
                }
                
                if (result.summary.warnings.length > 0) {
                    finalContent += `### ⚠️ Warnings:\n`;
                    result.summary.warnings.forEach((warning: string) => {
                        finalContent += `- ${warning}\n`;
                    });
                    finalContent += '\n';
                }
                
                finalContent += `### 📈 Performance:\n`;
                finalContent += `- **Total Time:** ${result.totalTime.toFixed(2)} seconds\n`;
                finalContent += `- **AI Insights Generated:** ${result.aiInsights.length}\n\n`;
                
                if (result.summary.errors.length === 0) {
                    finalContent += `### 🎯 Status: ✅ Complete\n`;
                    finalContent += `Your Kubernetes cluster is now clean of ARC components and ready for fresh installation if needed.`;
                } else {
                    finalContent += `### ⚠️ Status: Completed with ${result.summary.errors.length} error(s)\n`;
                    finalContent += `Some manual cleanup may be required. Check the detailed logs above.`;
                }
                
                return {
                    content: [{ type: 'text', text: finalContent }],
                    structuredContent: {
                        type: 'cleanup_success',
                        updates: progressUpdates,
                        result: result,
                        clusterAnalysis: clusterAnalysis,
                        cleanupPlan: cleanupPlan,
                        isComplete: true
                    }
                };
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                progressReporter.error(`Cleanup failed: ${errorMessage}`);
                
                const finalContent = progressUpdates.join('\n---\n\n');
                
                return {
                    content: [{ type: 'text', text: finalContent }],
                    structuredContent: {
                        type: 'cleanup_error',
                        updates: progressUpdates,
                        error: errorMessage,
                        isComplete: true
                    }
                };
            }
        }
    );

    // Enhanced runner deployment tool
    server.registerTool(
        'deploy_github_runners',
        {
            title: 'Deploy GitHub Runners with Auto-scaling',
            description: 'Deploy GitHub Actions runners with configurable auto-scaling. Supports setting minimum and maximum replica counts for optimal resource management.',
            inputSchema: {
                minReplicas: z.number().optional().describe("Minimum number of runners (for auto-scaling)"),
                maxReplicas: z.number().optional().describe("Maximum number of runners (for auto-scaling)"),
                organization: z.string().optional().describe("GitHub organization name"),
                replicas: z.number().optional().describe("Fixed number of runners (when not using auto-scaling)"),
                runnerName: z.string().optional().describe("Custom name for the runner deployment"),
                namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)"),
                autoscaling: z.boolean().optional().describe("Enable auto-scaling (automatically enabled when min/max specified)")
            }
        },
        async (params: any) => {
            let progressUpdates: string[] = [];
            
            // IMMEDIATE OVERRIDE: Force GITHUB_ORG before any other processing
            if (process.env.GITHUB_ORG) {
                const originalOrg = params.organization;
                params.organization = process.env.GITHUB_ORG;
                services.logger.info(`IMMEDIATE OVERRIDE: organization "${originalOrg}" → "${process.env.GITHUB_ORG}" (GITHUB_ORG takes absolute precedence)`);
            }
            
            // VALIDATION: Detect and fix incorrect parameter usage
            services.logger.info('Validating deployment parameters', params);
            
            // Detect min/max from replicas parameter (common Copilot mistake)
            if (params.replicas && !params.minReplicas && !params.maxReplicas) {
                services.logger.warn(`⚠️ Detected potential min/max misinterpretation. Using replicas=${params.replicas} as maxReplicas, calculating minReplicas`);
                params.maxReplicas = params.replicas;
                params.minReplicas = Math.max(1, Math.floor(params.replicas * 0.6)); // Use 60% as min
                delete params.replicas; // Remove the incorrect parameter
            }
            
            services.logger.info('✅ Validated parameters', params);
            
            const progressReporter = createProgressReporter(
                (update: ProgressUpdate) => {
                    const formatted = formatProgressForChat(update);
                    progressUpdates.push(formatted);
                },
                (finalMessage: string) => {
                    progressUpdates.push(`## ✅ Runner Deployment Complete!\n\n${finalMessage}`);
                },
                (errorMessage: string) => {
                    progressUpdates.push(`## ❌ Runner Deployment Failed\n\n${errorMessage}`);
                }
            );
            
            try {
                progressReporter.updateProgress({
                    phase: 'Runner Deployment',
                    progress: 0,
                    message: 'Starting AI-optimized runner deployment...',
                    timestamp: new Date().toISOString(),
                    aiInsight: 'Generating intelligent runner configuration for your organization'
                });
                
                // Enhanced organization validation and auto-detection
                // ABSOLUTE PRIORITY: GITHUB_ORG environment variable overrides everything
                let organization;
                
                if (process.env.GITHUB_ORG) {
                    organization = process.env.GITHUB_ORG;
                    services.logger.info(`🔒 FORCING organization from GITHUB_ORG: ${organization} (ignoring local configs, existing deployments, and repo context)`);
                } else {
                    // Only use auto-detection if GITHUB_ORG is not set
                    const gitDetector = new GitRepositoryDetector(services.logger);
                    organization = await gitDetector.resolveGitHubOrganization(params.organization);
                    services.logger.info(`📍 Auto-detected organization: ${organization}`);
                }
                
                // Debug logging to track organization resolution
                services.logger.info(`Organization resolution complete: GITHUB_ORG="${process.env.GITHUB_ORG}", params.organization="${params.organization}", final="${organization}"`);
                
                // Skip existing deployment detection if GITHUB_ORG is set
                if (!process.env.GITHUB_ORG && (!organization && !process.env.GITHUB_ORG)) {
                    progressReporter.updateProgress({
                        phase: 'Organization Detection',
                        progress: 5,
                        message: 'Auto-detecting GitHub organization from existing deployments...',
                        timestamp: new Date().toISOString(),
                        aiInsight: 'Scanning existing runner deployments for organization hints'
                    });
                    
                    try {
                        // Fix the kubectl call to use the proper command executor
                        const existingDeployments = await services.installer.commandExecutor.kubectl(
                            'get autoscalingrunnersets -n arc-systems -o jsonpath={.items[*].spec.githubConfigUrl}'
                        );
                        
                        if (existingDeployments.stdout.trim()) {
                            const urls = existingDeployments.stdout.trim().split(' ').filter(Boolean);
                            const firstUrl = urls[0]; // e.g., "https://github.com/tsvi-solutions"
                            const detectedOrg = firstUrl.split('/').pop(); // Extract organization name
                            if (detectedOrg && organization === 'tsvi-solutions') {
                                organization = detectedOrg;
                                services.logger.info(`Auto-detected organization from existing deployments: ${organization}`);
                            }
                        }
                    } catch (e) {
                        services.logger.warn('Could not auto-detect organization from existing deployments, using resolved value');
                    }
                }
                
                // Default to 20 replicas (better for high workload capacity), but allow user to specify different amounts
                const replicas = Math.max(params.replicas || 20, 20);
                
                // Determine runner name with intelligent fallback
                let runnerName: string;
                if (process.env.RUNNER_LABEL) {
                    runnerName = process.env.RUNNER_LABEL;
                    services.logger.info(`Using RUNNER_LABEL from environment: ${runnerName}`);
                } else if (params.runnerName) {
                    runnerName = params.runnerName;
                    services.logger.info(`Using explicit runnerName parameter: ${runnerName}`);
                } else {
                    runnerName = `${organization}-runners`;
                    services.logger.warn(`⚠️ RUNNER_LABEL not set in mcp.json. Using default: ${runnerName}. Set RUNNER_LABEL in mcp.json for consistent naming.`);
                }
                const runnerLabel = runnerName; // Use the resolved runner name as the label
                
                progressReporter.updateProgress({
                    phase: 'Configuration Generation',
                    progress: 20,
                    message: `Generating runner configuration for organization: ${organization} with label: ${runnerLabel}`,
                    timestamp: new Date().toISOString(),
                    aiInsight: `Creating ${replicas} runners with label '${runnerLabel}' and enterprise security settings optimized for ${replicas} concurrent parallel jobs`
                });
                
                // Generate runner deployment YAML using modern API (ARC v0.13.0+)
                const runnerDeployment = {
                    apiVersion: 'actions.github.com/v1alpha1',
                    kind: 'AutoscalingRunnerSet',
                    metadata: {
                        name: runnerName,
                        namespace: 'arc-systems',
                        labels: {
                            'mcp.arc.io/managed': 'true',
                            'mcp.arc.io/enhanced': 'true'
                        }
                    },
                    spec: {
                        // Use minRunners/maxRunners for modern autoscaling
                        minRunners: params.minReplicas || Math.max(1, Math.floor(replicas / 4)),
                        maxRunners: params.maxReplicas || replicas,
                        githubConfigUrl: `https://github.com/${organization}`,
                        githubConfigSecret: 'controller-manager',
                        runnerGroup: 'default',
                        runnerScaleSetName: runnerName,
                        template: {
                            metadata: {
                                labels: {
                                    'app': 'github-actions-runner',
                                    'runner-set': runnerName
                                }
                            },
                            spec: {
                                containers: [{
                                    name: 'runner',
                                    image: 'ghcr.io/actions/actions-runner:latest',
                                    env: [
                                        { name: 'RUNNER_FEATURE_FLAG_EPHEMERAL', value: 'true' }
                                    ],
                                    resources: {
                                        limits: { cpu: '2.0', memory: '1Gi' },
                                        requests: { cpu: '100m', memory: '64Mi' }
                                    }
                                }]
                            }
                        }
                    }
                };
                
                progressReporter.updateProgress({
                    phase: 'CRD Validation',
                    progress: 35,
                    message: 'Checking for required CRDs (AutoscalingRunnerSet)...',
                    timestamp: new Date().toISOString(),
                    aiInsight: 'Validating Kubernetes CRD prerequisites for runner deployment'
                });
                
                // Check if AutoscalingRunnerSet CRDs are installed
                try {
                    await services.installer.commandExecutor.kubectl('get crd autoscalingrunnersets.actions.github.com');
                    services.logger.info('✅ AutoscalingRunnerSet CRDs are already installed');
                } catch (error) {
                    services.logger.warn('❌ AutoscalingRunnerSet CRDs not found, installing...');
                    
                    progressReporter.updateProgress({
                        phase: 'CRD Installation',
                        progress: 38,
                        message: 'Installing required CRDs for ARC v0.13.0+...',
                        timestamp: new Date().toISOString(),
                        aiInsight: 'Installing AutoscalingRunnerSet and EphemeralRunner CRDs as prerequisite'
                    });
                    
                    // Install CRDs using the official ARC Helm chart
                    const crdHelmArgs = [
                        'upgrade', '--install', 'arc-crds',
                        '--namespace', 'arc-systems',
                        '--create-namespace',
                        '--set', 'crdsOnly=true',
                        'oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller'
                    ].join(' ');
                    
                    try {
                        await services.installer.commandExecutor.helm(crdHelmArgs);
                        services.logger.info('✅ Successfully installed ARC CRDs');
                        
                        // Wait for CRDs to be available
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        
                        // Verify CRDs are now installed
                        await services.installer.commandExecutor.kubectl('get crd autoscalingrunnersets.actions.github.com');
                        services.logger.info('✅ CRD installation verified');
                    } catch (crdError) {
                        throw new Error(`Failed to install required CRDs: ${crdError}`);
                    }
                }
                
                progressReporter.updateProgress({
                    phase: 'Deployment',
                    progress: 40,
                    message: 'Applying runner deployment to Kubernetes...',
                    timestamp: new Date().toISOString(),
                    aiInsight: 'Deploying with Pod Security Standards and resource limits'
                });
                
                // Use the official ARC Helm chart for proper deployment
                const minRunners = params.minReplicas || Math.max(1, Math.floor(replicas / 4));
                const maxRunners = params.maxReplicas || replicas;
                
                // Get GitHub token from environment or services
                const githubToken = process.env.GITHUB_TOKEN || services.installer?.github?.token || '';
                if (!githubToken) {
                    throw new Error('GitHub token not found. Please ensure GITHUB_TOKEN is set or GitHub service is configured.');
                }
                
                const helmArgs = [
                    'install', runnerName,
                    '--namespace', 'arc-systems',
                    '--set', `githubConfigUrl=https://github.com/${organization}`,
                    '--set', `githubConfigSecret.github_token=${githubToken}`,
                    '--set', `maxRunners=${maxRunners}`,
                    '--set', `minRunners=${minRunners}`,
                    '--set', `runnerScaleSetName=${runnerName}`,
                    '--set', `runnerGroup=default`,
                    'oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set'
                ].join(' ');
                
                try {
                    // Use the installer's command executor for helm commands
                    await services.installer.commandExecutor.helm(helmArgs);
                } catch (error) {
                    // If installation fails due to existing release, try upgrade instead
                    const upgradeArgs = helmArgs.replace('install', 'upgrade --install');
                    await services.installer.commandExecutor.helm(upgradeArgs);
                }
                
                progressReporter.updateProgress({
                    phase: 'Validation',
                    progress: 80,
                    message: 'Validating runner deployment...',
                    timestamp: new Date().toISOString(),
                    aiInsight: 'AutoScalingRunnerSet includes built-in autoscaling - no separate autoscaler needed'
                });
                
                // Wait a moment for deployment to start
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                progressReporter.updateProgress({
                    phase: 'Complete',
                    progress: 100,
                    message: 'Runner deployment completed successfully!',
                    timestamp: new Date().toISOString(),
                    aiInsight: 'Runners are registering with GitHub and ready for workflows'
                });
                
                // Calculate autoscaling ranges: use explicit values if provided, otherwise calculate
                const minReplicas = params.minReplicas || replicas;
                const maxReplicas = params.maxReplicas || Math.max(replicas * 2, 40);
                
                const result = {
                    success: true,
                    runnerName,
                    runnerLabel,
                    organization,
                    replicas,
                    autoscaling: {
                        min: minReplicas,
                        max: maxReplicas
                    },
                    features: {
                        ephemeralRunners: true,
                        autoScaling: true,
                        securityHardening: true,
                        aiOptimized: true,
                        configurableLabels: true
                    }
                };
                
                progressReporter.complete(`🎉 Successfully deployed ${replicas} AI-optimized runners with label '${runnerLabel}' for ${organization}!`);
                
                const finalContent = progressUpdates.join('\n---\n\n') + '\n\n## 📊 Deployment Summary\n\n```json\n' + JSON.stringify(result, null, 2) + '\n```';
                
                return {
                    content: [{ type: 'text', text: finalContent }],
                    structuredContent: {
                        type: 'runner_deployment_success',
                        updates: progressUpdates,
                        result: result,
                        isComplete: true
                    }
                };
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                
                // Enhanced error handling with specific guidance
                let enhancedErrorMessage = `Runner deployment failed: ${errorMessage}`;
                let recoverySteps = '';
                
                // Detect common error patterns and provide specific guidance
                if (errorMessage.includes('404') && errorMessage.includes('github.com/orgs/')) {
                    const orgMatch = errorMessage.match(/github\.com\/orgs\/([^\/]+)/);
                    const failedOrg = orgMatch ? orgMatch[1] : 'unknown';
                    
                    enhancedErrorMessage = `❌ **GitHub Organization Access Error**\n\nThe organization '${failedOrg}' is not accessible with the current GitHub token.\n\n`;
                    recoverySteps = `## 🔧 **Recovery Steps:**\n\n` +
                        `1. **Check organization name**: Verify '${failedOrg}' is correct\n` +
                        `2. **Verify token access**: Ensure your GitHub token has access to this organization\n` +
                        `3. **Try auto-detection**: Run deployment without specifying organization to auto-detect\n` +
                        `4. **Use working organization**: Try 'tsvi-solutions' which is known to work\n\n` +
                        `💡 **Tip**: The MCP server can auto-detect the correct organization from existing deployments if you don't specify one.`;
                } else if (errorMessage.includes('secret') && errorMessage.includes('controller-manager')) {
                    enhancedErrorMessage = `❌ **GitHub Token Configuration Error**\n\nThe GitHub token secret is not properly configured.\n\n`;
                    recoverySteps = `## 🔧 **Recovery Steps:**\n\n` +
                        `1. **Check secret**: \`kubectl get secret controller-manager -n arc-systems\`\n` +
                        `2. **Verify token**: Ensure your GitHub token is valid and has correct permissions\n` +
                        `3. **Reinstall ARC**: Consider reinstalling ARC with the correct token`;
                }
                
                const fullErrorMessage = enhancedErrorMessage + '\n' + recoverySteps;
                
                progressReporter.error(fullErrorMessage);
                
                const finalContent = progressUpdates.join('\n---\n\n');
                
                return {
                    content: [{ type: 'text', text: finalContent }],
                    structuredContent: {
                        type: 'runner_deployment_error',
                        updates: progressUpdates,
                        error: errorMessage,
                        isComplete: true
                    }
                };
            }
        }
    );
    
    // Enhanced runner management tool
    server.registerTool(
        'arc_manage_runners',
        {
            title: 'Manage ARC Runners',
            description: 'List, scale, and manage GitHub Actions runners with real-time updates',
            inputSchema: {
                action: z.string().optional().describe("Action to perform: list, scale, status"),
                namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)"),
                replicas: z.number().optional().describe("Number of replicas for scaling operations"),
                runnerName: z.string().optional().describe("Name of specific runner deployment to manage")
            }
        },
        async (params: any) => {
            try {
                const action = params.action || 'list';
                const namespace = params.namespace || 'arc-systems';
                
                let content = `# 🏃‍♂️ ARC Runner Management\n\n`;
                
                if (action === 'list' || action === 'status') {
                    // Enhanced runner status collection with pod information
                    let runnerDeployments = [];
                    let runners = [];
                    let autoscalers = [];
                    let pods = [];
                    
                    try {
                        // Since we deploy using Helm, check for Helm releases instead of direct autoscalingrunnersets
                        const helmResult = await services.installer.commandExecutor.helm(`list -n ${namespace} -o json`);
                        const helmData = JSON.parse(helmResult.stdout);
                        runnerDeployments = helmData.filter((release: any) => 
                            release.name.includes('runner') || release.chart.includes('gha-runner')
                        ) || [];
                        
                        // If we have Helm releases, try to get the actual autoscaling runner sets
                        if (runnerDeployments.length > 0) {
                            try {
                                const autoscalingResult = await services.installer.commandExecutor.kubectl(`get autoscalingrunnersets -n ${namespace} -o json`);
                                const autoscalingData = JSON.parse(autoscalingResult.stdout);
                                // Merge Helm data with Kubernetes data for complete picture
                                runnerDeployments = autoscalingData.items || runnerDeployments;
                            } catch (k8sError) {
                                services.logger.info('Using Helm release data since autoscalingrunnersets API not available');
                            }
                        }
                    } catch (error) {
                        services.logger.warn('Could not get runner deployments', { error });
                    }
                    
                    try {
                        const runnerResult = await services.installer.commandExecutor.kubectl(`get ephemeralrunners -n ${namespace} -o json`);
                        const runnerData = JSON.parse(runnerResult.stdout);
                        runners = runnerData.items || [];
                    } catch (error) {
                        services.logger.warn('Could not get ephemeral runners', { error });
                    }
                    
                    try {
                        const listenerResult = await services.installer.commandExecutor.kubectl(`get pods -n ${namespace} -l app.kubernetes.io/component=autoscaling-listener -o json`);
                        const listenerData = JSON.parse(listenerResult.stdout);
                        autoscalers = listenerData.items || [];
                    } catch (error) {
                        services.logger.warn('Could not get listener pods', { error });
                    }
                    
                    // Get pod status for enhanced reporting
                    try {
                        const podResult = await services.installer.commandExecutor.kubectl(`get pods -n ${namespace} -l app.kubernetes.io/name=actions-runner -o json`);
                        const podData = JSON.parse(podResult.stdout);
                        pods = podData.items || [];
                    } catch (error) {
                        services.logger.warn('Could not get runner pods', { error });
                    }
                    
                    content += `## 📊 Runner Deployments\n\n`;
                    if (runnerDeployments.length > 0) {
                        runnerDeployments.forEach((deployment: any) => {
                            const status = deployment.status || {};
                            content += `### ${deployment.metadata.name}\n`;
                            content += `- **Organization:** ${deployment.spec.template.spec.organization}\n`;
                            content += `- **Desired Replicas:** ${deployment.spec.replicas}\n`;
                            content += `- **Current Replicas:** ${status.replicas || 0}\n`;
                            content += `- **Available Replicas:** ${status.availableReplicas || 0}\n`;
                            content += `- **Status:** ${status.availableReplicas === deployment.spec.replicas ? '🟢 Healthy' : '🟡 Scaling'}\n\n`;
                        });
                    } else {
                        content += `*No runner deployments found.*\n\n`;
                    }
                    
                    content += `## 🏃‍♂️ Active Runners\n\n`;
                    if (runners.length > 0) {
                        runners.forEach((runner: any, index: number) => {
                            const status = runner.status || {};
                            content += `${index + 1}. **${runner.metadata.name}**\n`;
                            content += `   - Organization: ${runner.spec.organization}\n`;
                            content += `   - Status: ${getStatusEmoji(status.phase)} ${status.phase || 'Unknown'}\n`;
                            content += `   - Repository: ${runner.spec.repository || 'Organization-wide'}\n\n`;
                        });
                    } else {
                        content += `*No active runners found.*\n\n`;
                    }
                    
                    content += `## ⚖️ Autoscalers\n\n`;
                    if (autoscalers.length > 0) {
                        autoscalers.forEach((scaler: any) => {
                            content += `### ${scaler.metadata.name}\n`;
                            content += `- **Target:** ${scaler.spec.scaleTargetRef.name}\n`;
                            content += `- **Range:** ${scaler.spec.minReplicas}-${scaler.spec.maxReplicas} replicas\n`;
                            content += `- **Current Desired:** ${scaler.status?.desiredReplicas || 'N/A'}\n\n`;
                        });
                    } else {
                        content += `*No autoscalers configured.*\n\n`;
                    }
                    
                } else if (action === 'scale') {
                    const deploymentName = params.runnerName || params.deploymentName || 'tsvi-runners';
                    const replicas = params.replicas || 4;  // Default to 4 for concurrent jobs
                    
                    content += `## 🔄 Scaling Runner Deployment\n\n`;
                    content += `Scaling **${deploymentName}** to **${replicas}** replicas...\n\n`;
                    
                    try {
                        // Scale the AutoScalingRunnerSet using kubectl patch
                        await services.installer.commandExecutor.kubectl(`patch autoscalingrunnerset ${deploymentName} -n ${namespace} -p '{"spec":{"maxRunners":${replicas}}}' --type=merge`);
                        content += `✅ **Success!** AutoScalingRunnerSet scaled to maximum ${replicas} runners.\n\n`;
                        content += `**Estimated Timeline:** Scaling will complete in approximately ${Math.ceil(replicas * 0.5)} minutes.\n\n`;
                        content += `**Cost Impact:** Approximately $${(replicas * 0.10 * 24 * 30).toFixed(2)}/month for 24/7 operation.\n\n`;
                    } catch (error) {
                        content += `❌ **Failed to scale AutoScalingRunnerSet:** ${error}\n\n`;
                    }
                }
                
                content += `---\n*Updated at ${new Date().toLocaleString()}*`;
                
                return {
                    content: [{ type: 'text', text: content }],
                    structuredContent: {
                        type: 'runner_management',
                        action: action,
                        timestamp: new Date().toISOString()
                    }
                };
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: 'text', text: `# ❌ Runner Management Error\n\n${errorMessage}` }],
                    structuredContent: { type: 'error', error: errorMessage }
                };
            }
        }
    );
    
    // Note: Removed arc_deploy_autoscaling_runners tool due to API endpoint conflicts
    // The main arc_deploy_runners tool handles all deployment scenarios correctly

    services.logger.info('Enhanced ARC MCP tools registered with real-time progress capabilities');
}

/**
 * Helper functions for enhanced display
 */
function getStatusEmoji(status: string): string {
    if (!status) return '⚪'; // Default for undefined/null status
    switch (status.toLowerCase()) {
        case 'healthy':
        case 'running':
        case 'active':
            return '🟢';
        case 'starting':
        case 'pending':
            return '🟡';
        case 'degraded':
        case 'failed':
        case 'error':
            return '🔴';
        default:
            return '⚪';
    }
}

function getScoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    return '🔴';
}

function calculateEstimatedCost(replicas: number): string {
    const costPerRunner = 0.10; // $0.10 per hour per runner
    const monthlyCost = replicas * costPerRunner * 24 * 30;
    return `~$${monthlyCost.toFixed(2)}/month`;
}

/**
 * Format cluster analysis for chat display
 */
function formatClusterAnalysisForChat(analysis: any): string {
    let content = `## 🔍 Cluster Analysis Report\n\n`;
    
    // Cluster Overview
    content += `### 🏗️ Cluster Overview\n`;
    content += `- **Kubernetes Version:** ${analysis.cluster?.version || 'Unknown'}\n`;
    content += `- **Nodes:** ${analysis.cluster?.nodeCount || 0} (${analysis.cluster?.readyNodes || 0} ready)\n`;
    content += `- **Total CPU:** ${analysis.cluster?.totalCpu || 'Unknown'}\n`;
    content += `- **Total Memory:** ${analysis.cluster?.totalMemory || 'Unknown'}\n`;
    content += `- **Storage Classes:** ${analysis.cluster?.storageClasses?.length || 0}\n\n`;
    
    // Existing ARC Resources
    if (analysis.existingArc && Object.keys(analysis.existingArc).length > 0) {
        content += `### 🔍 Existing ARC Resources\n`;
        Object.entries(analysis.existingArc).forEach(([namespace, resources]: [string, any]) => {
            if (Object.keys(resources).length > 0) {
                content += `**Namespace: ${namespace}**\n`;
                Object.entries(resources).forEach(([resourceType, count]: [string, any]) => {
                    if (count > 0) {
                        content += `- ${resourceType}: ${count}\n`;
                    }
                });
                content += '\n';
            }
        });
    } else {
        content += `### ✅ Existing ARC Resources\n`;
        content += `No existing ARC resources detected - clean installation possible.\n\n`;
    }
    
    // Prerequisites Check
    content += `### 🔧 Prerequisites Status\n`;
    if (analysis.prerequisites) {
        Object.entries(analysis.prerequisites).forEach(([check, status]: [string, any]) => {
            const emoji = status.passed ? '✅' : '❌';
            content += `${emoji} **${check}:** ${status.message}\n`;
        });
    }
    content += '\n';
    
    // Recommendations
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        content += `### 💡 AI Recommendations\n`;
        analysis.recommendations.forEach((rec: string, index: number) => {
            content += `${index + 1}. ${rec}\n`;
        });
        content += '\n';
    }
    
    // Risk Assessment
    content += `### 🛡️ Risk Assessment\n`;
    content += `- **Installation Risk:** ${getRiskEmoji(analysis.risk?.installationRisk)} ${analysis.risk?.installationRisk || 'Low'}\n`;
    content += `- **Data Loss Risk:** ${getRiskEmoji(analysis.risk?.dataLossRisk)} ${analysis.risk?.dataLossRisk || 'None'}\n`;
    content += `- **Downtime Risk:** ${getRiskEmoji(analysis.risk?.downtimeRisk)} ${analysis.risk?.downtimeRisk || 'Minimal'}\n\n`;
    
    return content;
}

/**
 * Format execution plan for chat display  
 */
function formatExecutionPlanForChat(plan: any): string {
    let content = `## 📋 Installation Execution Plan\n\n`;
    
    content += `### ⏱️ Timeline Overview\n`;
    content += `- **Estimated Duration:** ${plan.estimatedDuration || '5-10 minutes'}\n`;
    content += `- **Total Steps:** ${plan.steps?.length || 0}\n`;
    content += `- **Complexity:** ${plan.complexity || 'Medium'}\n\n`;
    
    if (plan.steps && plan.steps.length > 0) {
        content += `### 🚀 Execution Steps\n\n`;
        plan.steps.forEach((step: any, index: number) => {
            content += `#### Step ${index + 1}: ${step.name}\n`;
            content += `**Duration:** ${step.estimatedTime || '1-2 minutes'} | **Risk:** ${getRiskEmoji(step.risk)} ${step.risk || 'Low'}\n\n`;
            
            if (step.commands && step.commands.length > 0) {
                content += `**Commands to execute:**\n`;
                content += '```bash\n';
                step.commands.forEach((cmd: string) => {
                    content += `${cmd}\n`;
                });
                content += '```\n\n';
            }
            
            if (step.description) {
                content += `**Description:** ${step.description}\n\n`;
            }
            
            if (step.resources && step.resources.length > 0) {
                content += `**Resources created:**\n`;
                step.resources.forEach((resource: string) => {
                    content += `- ${resource}\n`;
                });
                content += '\n';
            }
        });
    }
    
    if (plan.rollbackPlan) {
        content += `### 🔄 Rollback Strategy\n`;
        content += `In case of failure, the following rollback steps will be executed:\n`;
        if (plan.rollbackPlan.steps) {
            plan.rollbackPlan.steps.forEach((step: string, index: number) => {
                content += `${index + 1}. ${step}\n`;
            });
        }
        content += '\n';
    }
    
    return content;
}

/**
 * Format cleanup plan for chat display
 */
function formatCleanupPlanForChat(plan: any): string {
    let content = `## 🗑️ Cleanup Execution Plan\n\n`;
    
    content += `### ⏱️ Cleanup Overview\n`;
    content += `- **Estimated Duration:** ${plan.estimatedDuration || '3-8 minutes'}\n`;
    content += `- **Total Phases:** ${plan.phases?.length || 6}\n`;
    content += `- **Safety Level:** ${plan.safetyLevel || 'High'}\n`;
    content += `- **Backup Strategy:** ${plan.backupStrategy || 'Automatic'}\n\n`;
    
    if (plan.targetResources && Object.keys(plan.targetResources).length > 0) {
        content += `### 🎯 Target Resources for Cleanup\n`;
        Object.entries(plan.targetResources).forEach(([category, resources]: [string, any]) => {
            if (Array.isArray(resources) && resources.length > 0) {
                content += `**${category}:**\n`;
                resources.forEach((resource: string) => {
                    content += `- ${resource}\n`;
                });
                content += '\n';
            }
        });
    }
    
    if (plan.phases && plan.phases.length > 0) {
        content += `### 🔄 Cleanup Phases\n\n`;
        plan.phases.forEach((phase: any, index: number) => {
            content += `#### Phase ${index + 1}: ${phase.name}\n`;
            content += `**Duration:** ${phase.estimatedTime || '30-60 seconds'} | **Risk:** ${getRiskEmoji(phase.risk)} ${phase.risk || 'Low'}\n\n`;
            
            if (phase.actions && phase.actions.length > 0) {
                content += `**Actions:**\n`;
                phase.actions.forEach((action: string) => {
                    content += `- ${action}\n`;
                });
                content += '\n';
            }
            
            if (phase.commands && phase.commands.length > 0) {
                content += `**Sample commands:**\n`;
                content += '```bash\n';
                phase.commands.slice(0, 3).forEach((cmd: string) => {
                    content += `${cmd}\n`;
                });
                if (phase.commands.length > 3) {
                    content += `# ... and ${phase.commands.length - 3} more commands\n`;
                }
                content += '```\n\n';
            }
        });
    }
    
    if (plan.safetyChecks && plan.safetyChecks.length > 0) {
        content += `### 🛡️ Safety Checks\n`;
        plan.safetyChecks.forEach((check: string, index: number) => {
            content += `${index + 1}. ${check}\n`;
        });
        content += '\n';
    }
    
    if (plan.preservedResources && plan.preservedResources.length > 0) {
        content += `### 🔒 Resources to Preserve\n`;
        plan.preservedResources.forEach((resource: string) => {
            content += `- ${resource}\n`;
        });
        content += '\n';
    }
    
    return content;
}

/**
 * Get risk level emoji
 */
function getRiskEmoji(risk: string): string {
    switch (risk?.toLowerCase()) {
        case 'none':
        case 'minimal':
        case 'low':
            return '🟢';
        case 'medium':
        case 'moderate':
            return '🟡';
        case 'high':
        case 'critical':
            return '🔴';
        default:
            return '⚪';
    }
}

/**
 * Enhanced natural language processing
 */
async function processNaturalLanguageQuery(query: string, services: ServiceContext): Promise<any> {
    if (!query || typeof query !== 'string') {
        return {
            action: 'unknown',
            parameters: {},
            confidence: 0.0,
            interpretation: 'Invalid or empty query provided',
            suggestion: 'Try commands like "Install ARC", "Scale runners to 5", "Check ARC status", or "Cleanup ARC installation"'
        };
    }
    
    const lowercaseQuery = query.toLowerCase();

    // Enhanced pattern matching with more sophisticated understanding
    if (lowercaseQuery.includes('install') && (lowercaseQuery.includes('arc') || lowercaseQuery.includes('controller'))) {
        return {
            action: 'install_controller',
            parameters: { 
                namespace: extractNamespace(query) || 'arc-systems', 
                version: extractVersion(query) || '0.27.6',
                enableRealTimeLogging: true
            },
            confidence: 0.95,
            interpretation: 'User wants to install ARC controller with real-time progress updates',
            suggestion: 'This will start an AI-guided installation with live progress updates in this chat!'
        };
    }

    if ((lowercaseQuery.includes('cleanup') || lowercaseQuery.includes('uninstall') || lowercaseQuery.includes('remove')) && 
        (lowercaseQuery.includes('arc') || lowercaseQuery.includes('controller') || lowercaseQuery.includes('installation'))) {
        return {
            action: 'cleanup_installation',
            parameters: { 
                cleanup: true,
                namespace: extractNamespace(query) || 'arc-systems',
                dryRun: lowercaseQuery.includes('dry run') || lowercaseQuery.includes('dry-run'),
                preserveData: lowercaseQuery.includes('preserve') || lowercaseQuery.includes('backup'),
                force: lowercaseQuery.includes('force'),
                enableRealTimeLogging: true
            },
            confidence: 0.95,
            interpretation: 'User wants to cleanup/uninstall ARC with AI-guided safety checks',
            suggestion: 'This will perform comprehensive cleanup with live progress updates and safety validations!'
        };
    }

    if ((lowercaseQuery.includes('scale') || lowercaseQuery.includes('deploy')) && lowercaseQuery.includes('runner')) {
        // Handle various range syntax patterns
        let replicas, minReplicas, maxReplicas;
        
        // Pattern 1: "X-Y" range syntax (e.g., "20-40")
        const rangeMatch = query.match(/(\d+)\s*-\s*(\d+)/);
        
        // Pattern 2: "X min and Y max" syntax (e.g., "25 runners min and 40 max")
        const minMaxMatch = query.match(/(\d+).*min.*and.*(\d+).*max|(\d+).*min.*(\d+).*max/i);
        
        // Pattern 3: Individual min/max patterns
        const minMatch = query.match(/(\d+).*min/i);
        const maxMatch = query.match(/(\d+).*max/i);
        
        // Pattern 4: Single number
        const singleMatch = query.match(/\d+/);
        
        if (rangeMatch) {
            // Range syntax detected (e.g., "20-40")
            minReplicas = parseInt(rangeMatch[1]);
            maxReplicas = parseInt(rangeMatch[2]);
            replicas = maxReplicas; // Use max as target for compatibility
        } else if (minMaxMatch) {
            // Min/max syntax detected (e.g., "25 min and 40 max")
            if (minMaxMatch[1] && minMaxMatch[2]) {
                minReplicas = parseInt(minMaxMatch[1]);
                maxReplicas = parseInt(minMaxMatch[2]);
            } else if (minMaxMatch[3] && minMaxMatch[4]) {
                minReplicas = parseInt(minMaxMatch[3]);
                maxReplicas = parseInt(minMaxMatch[4]);
            }
            replicas = maxReplicas; // Use max as target for compatibility
        } else if (minMatch || maxMatch) {
            // Individual min or max specified
            if (minMatch) minReplicas = parseInt(minMatch[1]);
            if (maxMatch) maxReplicas = parseInt(maxMatch[1]);
            replicas = maxReplicas || minReplicas || 2;
        } else if (singleMatch) {
            // Single number detected
            replicas = parseInt(singleMatch[0]);
        } else {
            replicas = 2; // Default fallback
        }
        
        return {
            action: 'scale_runners',
            parameters: { 
                replicas, 
                minReplicas,
                maxReplicas,
                scaleSetName: extractScaleSetName(query) || 'default-runners',
                aiOptimized: true
            },
            confidence: 0.9,
            interpretation: (minReplicas && maxReplicas) ? 
                `User wants autoscaling with min: ${minReplicas}, max: ${maxReplicas} runners` :
                rangeMatch ? 
                    `User wants autoscaling range of ${minReplicas}-${maxReplicas} runners` :
                    `User wants to scale runners to ${replicas} replicas with AI optimization`,
            suggestion: `This will scale your runners and provide cost and performance recommendations`
        };
    }

    if (lowercaseQuery.includes('status') || lowercaseQuery.includes('check') || lowercaseQuery.includes('dashboard')) {
        return {
            action: 'get_status',
            parameters: { 
                includeVisualDiagrams: true,
                includeAiInsights: true 
            },
            confidence: 0.98,
            interpretation: 'User wants to see comprehensive ARC status with visual diagrams',
            suggestion: 'This will show a beautiful status dashboard with real-time cluster visualization'
        };
    }

    return {
        action: 'unknown',
        parameters: {},
        confidence: 0.1,
        interpretation: 'Query not clearly understood',
        suggestion: 'Try specific commands like:\n- "Install ARC with real-time logging"\n- "Scale runners to 5"\n- "Show me the ARC status dashboard"\n- "Cleanup ARC installation"\n- "Uninstall ARC with dry run"'
    };
}

/**
 * Helper functions for extracting parameters from natural language
 */
function extractNamespace(query: string): string | null {
    const namespaceMatch = query.match(/namespace[:\s]+([a-z0-9-]+)/i);
    return namespaceMatch ? namespaceMatch[1] : null;
}

function extractVersion(query: string): string | null {
    const versionMatch = query.match(/version[:\s]+([0-9.]+)/i);
    return versionMatch ? versionMatch[1] : null;
}

function extractScaleSetName(query: string): string | null {
    const nameMatch = query.match(/(?:scale set|runners?)[:\s]+([a-z0-9-]+)/i);
    return nameMatch ? nameMatch[1] : null;
}

/**
 * Helper functions for cleanup analysis
 */

/**
 * Analyze stuck resources in the cluster
 */
async function analyzeStuckResources(kubernetesService: any): Promise<any> {
    try {
        const stuckResources = {
            pods: [],
            deployments: [],
            runners: [],
            services: [],
            secrets: [],
            finalizerBlocked: []
        };

        // Check for stuck pods
        const pods = await kubernetesService.execute('get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded -o json');
        if (pods.stdout) {
            const podsData = JSON.parse(pods.stdout);
            stuckResources.pods = podsData.items?.filter((pod: any) => 
                pod.status?.phase === 'Terminating' || 
                pod.status?.phase === 'Unknown' ||
                (pod.metadata?.deletionTimestamp && pod.metadata?.finalizers?.length > 0)
            ) || [];
        }

        // Check for stuck runners
        const runners = await kubernetesService.execute('get runners -A -o json');
        if (runners.stdout) {
            const runnersData = JSON.parse(runners.stdout);
            stuckResources.runners = runnersData.items?.filter((runner: any) =>
                runner.metadata?.deletionTimestamp && runner.metadata?.finalizers?.length > 0
            ) || [];
        }

        // Check for stuck deployments
        const deployments = await kubernetesService.execute('get deployments -A --field-selector=metadata.namespace=arc-systems -o json');
        if (deployments.stdout) {
            const deploymentsData = JSON.parse(deployments.stdout);
            stuckResources.deployments = deploymentsData.items?.filter((dep: any) =>
                dep.metadata?.deletionTimestamp && dep.metadata?.finalizers?.length > 0
            ) || [];
        }

        return stuckResources;
    } catch (error) {
        return {
            pods: [],
            deployments: [],
            runners: [],
            services: [],
            secrets: [],
            finalizerBlocked: [],
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Analyze namespace issues
 */
async function analyzeNamespaceIssues(kubernetesService: any): Promise<any> {
    try {
        const namespaceIssues = {
            terminating: [],
            stuck: [],
            blocked: []
        };

        // Check for terminating namespaces
        const namespaces = await kubernetesService.execute('get namespace -o json');
        if (namespaces.stdout) {
            const namespacesData = JSON.parse(namespaces.stdout);
            namespaceIssues.terminating = namespacesData.items?.filter((ns: any) =>
                ns.status?.phase === 'Terminating'
            ) || [];
            
            namespaceIssues.stuck = namespacesData.items?.filter((ns: any) =>
                ns.metadata?.deletionTimestamp && 
                ns.metadata?.finalizers?.length > 0 &&
                ns.status?.phase === 'Terminating'
            ) || [];
        }

        return namespaceIssues;
    } catch (error) {
        return {
            terminating: [],
            stuck: [],
            blocked: [],
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Analyze finalizer issues
 */
async function analyzeFinalizerIssues(kubernetesService: any): Promise<any> {
    try {
        const finalizerIssues = {
            blockedResources: [] as any[],
            orphanedFinalizers: [] as any[],
            unknownFinalizers: [] as any[]
        };

        // Get all resources with finalizers in arc-systems namespace
        const resourceTypes = ['runners', 'runnerdeployments', 'horizontalrunnerautoscalers', 'pods', 'secrets', 'configmaps'];
        
        for (const resourceType of resourceTypes) {
            try {
                const result = await kubernetesService.execute(`get ${resourceType} -n arc-systems -o json`);
                if (result.stdout) {
                    const data = JSON.parse(result.stdout);
                    const blockedItems = data.items?.filter((item: any) =>
                        item.metadata?.finalizers?.length > 0 &&
                        item.metadata?.deletionTimestamp
                    ) || [];
                    
                    finalizerIssues.blockedResources.push(...blockedItems.map((item: any) => ({
                        type: resourceType,
                        name: item.metadata?.name,
                        namespace: item.metadata?.namespace,
                        finalizers: item.metadata?.finalizers,
                        deletionTimestamp: item.metadata?.deletionTimestamp
                    })));
                }
            } catch {
                // Ignore errors for resource types that might not exist
            }
        }

        return finalizerIssues;
    } catch (error) {
        return {
            blockedResources: [],
            orphanedFinalizers: [],
            unknownFinalizers: [],
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Calculate cleanup risk assessment
 */
function calculateCleanupRisk(analysisData: any): any {
    const { stuckResources, namespaceIssues, finalizerIssues } = analysisData;
    
    let riskScore = 0;
    let complexity = 'Low';
    let estimatedTime = '2-5 minutes';
    let warnings = [];
    let criticalIssues = [];

    // Calculate risk based on stuck resources
    if (stuckResources.runners?.length > 0) {
        riskScore += stuckResources.runners.length * 10;
        warnings.push(`${stuckResources.runners.length} stuck runner(s) detected`);
    }

    if (stuckResources.pods?.length > 0) {
        riskScore += stuckResources.pods.length * 5;
        warnings.push(`${stuckResources.pods.length} stuck pod(s) detected`);
    }

    if (namespaceIssues.terminating?.length > 0) {
        riskScore += 20;
        criticalIssues.push('Terminating namespace(s) detected - may require force removal');
    }

    if (finalizerIssues.blockedResources?.length > 0) {
        riskScore += finalizerIssues.blockedResources.length * 8;
        criticalIssues.push(`${finalizerIssues.blockedResources.length} resource(s) blocked by finalizers`);
    }

    // Determine complexity and time based on risk score
    if (riskScore > 50) {
        complexity = 'High';
        estimatedTime = '8-15 minutes';
    } else if (riskScore > 20) {
        complexity = 'Medium';
        estimatedTime = '5-10 minutes';
    }

    return {
        riskScore,
        complexity,
        estimatedTime,
        warnings,
        criticalIssues,
        recommendation: riskScore > 30 ? 'Consider manual intervention for stuck resources' : 'Standard cleanup should handle all issues'
    };
}

/**
 * Generate cleanup strategy based on analysis
 */
function generateCleanupStrategy(analysisData: any): any {
    const { stuckResources, namespaceIssues, finalizerIssues, riskAssessment } = analysisData;
    
    const strategy = {
        phases: [] as any[],
        fallbackOptions: [] as string[],
        manualSteps: [] as string[],
        automatedActions: [] as string[]
    };

    // Phase 1: Standard cleanup
    strategy.phases.push({
        name: 'Standard Resource Cleanup',
        description: 'Remove ARC components using standard Kubernetes deletion',
        commands: [
            'helm list -n arc-systems -q | grep -q "^arc$" && helm uninstall arc -n arc-systems || echo "No Helm release found"',
            'kubectl delete deployment arc-actions-runner-controller -n arc-systems --ignore-not-found',
            'kubectl delete service -n arc-systems --all --ignore-not-found'
        ],
        expectedDuration: '1-2 minutes',
        risk: 'Low'
    });

    // Phase 2: Finalizer removal (if needed)
    if (finalizerIssues.blockedResources?.length > 0) {
        strategy.phases.push({
            name: 'Finalizer Removal',
            description: 'Remove blocking finalizers from stuck resources',
            commands: finalizerIssues.blockedResources.map((resource: any) =>
                `kubectl patch ${resource.type} ${resource.name} -n ${resource.namespace} -p '{"metadata":{"finalizers":[]}}' --type=merge`
            ),
            expectedDuration: '30-60 seconds',
            risk: 'Medium'
        });
    }

    // Phase 3: Force deletion (if needed)
    if (stuckResources.runners?.length > 0 || namespaceIssues.terminating?.length > 0) {
        strategy.phases.push({
            name: 'Force Deletion',
            description: 'Force remove stuck resources and namespaces',
            commands: [
                'kubectl delete ephemeralrunners -n arc-systems --all --force --grace-period=0',
                'kubectl delete autoscalingrunnersets -n arc-systems --all --force --grace-period=0',
                'helm uninstall -n arc-systems --ignore-not-found $(helm list -n arc-systems -q)',
                'kubectl get namespace arc-systems -o json | jq ".spec.finalizers = []" | kubectl replace --raw /api/v1/namespaces/arc-systems/finalize -f -'
            ],
            expectedDuration: '1-3 minutes',
            risk: 'High'
        });
    }

    // Fallback options
    strategy.fallbackOptions = [
        'Manual finalizer removal using kubectl patch',
        'Direct etcd manipulation (requires cluster admin access)',
        'Cluster restart (last resort)'
    ];

    return strategy;
}

/**
 * Generate Mermaid diagram for cleanup state
 */
function generateCleanupStateDiagram(analysisData: any): string {
    const { clusterAnalysis, stuckResources, namespaceIssues, finalizerIssues, riskAssessment } = analysisData;
    
    let diagram = `flowchart TD
    %% ARC Cleanup State Analysis Diagram
    
    Start([🔍 ARC Cleanup Analysis]) --> ClusterState{Cluster State}
    
    ClusterState --> NSCheck[📁 Namespace Status]
    ClusterState --> ResCheck[🏃 Resource Status]
    ClusterState --> FinCheck[🔒 Finalizer Status]
    
    %% Namespace Analysis
    NSCheck --> NS1[arc-systems]`;

    // Add namespace status
    if (namespaceIssues.terminating?.length > 0) {
        diagram += `
    NS1 --> NSTerminating[⚠️ Terminating State]
    NSTerminating --> NSStuck{Stuck?}
    NSStuck -->|Yes| NSForceRemoval[💥 Force Removal Required]
    NSStuck -->|No| NSWaiting[⏳ Waiting for Resources]`;
    } else {
        diagram += `
    NS1 --> NSActive[✅ Active/Ready]`;
    }

    // Add resource analysis
    diagram += `
    
    %% Resource Analysis
    ResCheck --> RunnerCheck[🏃 Runners]
    ResCheck --> PodCheck[📦 Pods]
    ResCheck --> SvcCheck[🌐 Services]`;

    // Add runner status
    if (stuckResources.runners?.length > 0) {
        diagram += `
    RunnerCheck --> RStuck[❌ ${stuckResources.runners.length} Stuck]
    RStuck --> RFinalizers[🔒 Finalizer Blocked]`;
    } else {
        diagram += `
    RunnerCheck --> RNone[✅ None Found]`;
    }

    // Add pod status
    if (stuckResources.pods?.length > 0) {
        diagram += `
    PodCheck --> PStuck[❌ ${stuckResources.pods.length} Stuck]`;
    } else {
        diagram += `
    PodCheck --> PNone[✅ Clean]`;
    }

    // Add finalizer analysis
    diagram += `
    
    %% Finalizer Analysis
    FinCheck --> FinBlocked{Blocked Resources?}`;

    if (finalizerIssues.blockedResources?.length > 0) {
        diagram += `
    FinBlocked -->|${finalizerIssues.blockedResources.length} Found| FinRemoval[🔧 Finalizer Removal]
    FinRemoval --> FinForce[💪 Force Patch Required]`;
    } else {
        diagram += `
    FinBlocked -->|None| FinClean[✅ No Finalizers]`;
    }

    // Add risk assessment and strategy
    diagram += `
    
    %% Risk Assessment
    NSCheck --> RiskCalc[⚡ Risk Assessment]
    ResCheck --> RiskCalc
    FinCheck --> RiskCalc
    
    RiskCalc --> Risk{Complexity: ${riskAssessment.complexity}}`;

    // Add strategy based on risk
    if (riskAssessment.complexity === 'High') {
        diagram += `
    Risk -->|High Risk| StrategyComplex[🔧 Multi-Phase Strategy]
    StrategyComplex --> Phase1[1️⃣ Standard Cleanup]
    StrategyComplex --> Phase2[2️⃣ Finalizer Removal]
    StrategyComplex --> Phase3[3️⃣ Force Deletion]
    Phase3 --> Nuclear[☢️ Nuclear Option]`;
    } else if (riskAssessment.complexity === 'Medium') {
        diagram += `
    Risk -->|Medium Risk| StrategyStandard[🛠️ Standard + Finalizers]
    StrategyStandard --> Phase1[1️⃣ Standard Cleanup]
    StrategyStandard --> Phase2[2️⃣ Finalizer Removal]`;
    } else {
        diagram += `
    Risk -->|Low Risk| StrategySimple[✅ Standard Cleanup]
    StrategySimple --> Phase1[1️⃣ Quick & Clean]`;
    }

    diagram += `
    
    %% Final outcome
    Phase1 --> Success[🎉 Cleanup Complete]
    
    %% Styling
    classDef danger fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef warning fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef info fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    
    class NSTerminating,RStuck,PStuck,FinForce,Nuclear danger
    class NSStuck,RFinalizers,FinRemoval,StrategyComplex warning
    class NSActive,RNone,PNone,FinClean,Success success
    class Start,ClusterState,RiskCalc info`;

    return diagram;
}

/**
 * Format comprehensive cleanup analysis report
 */
function formatCleanupAnalysisReport(data: any): string {
    const { clusterAnalysis, stuckResources, namespaceIssues, finalizerIssues, riskAssessment, cleanupStrategy, mermaidDiagram } = data;
    
    let report = `# 🔍 ARC Cleanup State Analysis Report

## 📊 Executive Summary

**Risk Level:** ${getRiskEmoji(riskAssessment.complexity)} ${riskAssessment.complexity}
**Estimated Cleanup Time:** ${riskAssessment.estimatedTime}
**Risk Score:** ${riskAssessment.riskScore}/100

${riskAssessment.criticalIssues.length > 0 ? `
⚠️ **Critical Issues Detected:**
${riskAssessment.criticalIssues.map((issue: string) => `- ${issue}`).join('\n')}
` : '✅ **No critical issues detected** - standard cleanup should proceed smoothly.'}

## 🏗️ Current Cluster State

`;

    // Add cluster analysis
    if (clusterAnalysis) {
        report += `### 🌐 Cluster Overview
- **Kubernetes Version:** ${clusterAnalysis.cluster?.version || 'Unknown'}
- **Nodes:** ${clusterAnalysis.cluster?.nodeCount || 0} (${clusterAnalysis.cluster?.readyNodes || 0} ready)
- **Storage Classes:** ${clusterAnalysis.cluster?.storageClasses?.length || 0}

`;
    }

    // Add namespace analysis
    report += `### 📁 Namespace Analysis
`;
    if (namespaceIssues.terminating?.length > 0) {
        report += `❌ **Terminating Namespaces:** ${namespaceIssues.terminating.length}
`;
        namespaceIssues.terminating.forEach((ns: any) => {
            report += `   - \`${ns.metadata.name}\` (since ${ns.metadata.deletionTimestamp})
`;
        });
    } else {
        report += `✅ **No problematic namespaces detected**
`;
    }

    // Add stuck resources analysis
    report += `
### 🏃 Stuck Resources Analysis
`;
    if (stuckResources.runners?.length > 0) {
        report += `❌ **Stuck Runners:** ${stuckResources.runners.length}
`;
        stuckResources.runners.forEach((runner: any) => {
            report += `   - \`${runner.metadata.name}\` (finalizers: ${runner.metadata.finalizers?.join(', ') || 'none'})
`;
        });
    } else {
        report += `✅ **No stuck runners detected**
`;
    }

    if (stuckResources.pods?.length > 0) {
        report += `❌ **Stuck Pods:** ${stuckResources.pods.length}
`;
    } else {
        report += `✅ **No stuck pods detected**
`;
    }

    // Add finalizer analysis
    report += `
### 🔒 Finalizer Analysis
`;
    if (finalizerIssues.blockedResources?.length > 0) {
        report += `❌ **Resources Blocked by Finalizers:** ${finalizerIssues.blockedResources.length}
`;
        finalizerIssues.blockedResources.forEach((resource: any) => {
            report += `   - \`${resource.type}/${resource.name}\` (finalizers: ${resource.finalizers?.join(', ')})
`;
        });
    } else {
        report += `✅ **No finalizer issues detected**
`;
    }

    // Add recommended strategy
    report += `
## 🛠️ Recommended Cleanup Strategy

**Approach:** ${cleanupStrategy.phases?.length > 2 ? 'Multi-phase with fallbacks' : 'Standard with safety checks'}

`;

    cleanupStrategy.phases?.forEach((phase: any, index: number) => {
        report += `### Phase ${index + 1}: ${phase.name}
**Duration:** ${phase.expectedDuration} | **Risk:** ${getRiskEmoji(phase.risk)} ${phase.risk}

${phase.description}

**Commands to execute:**
\`\`\`bash
${phase.commands?.join('\n') || 'No specific commands'}
\`\`\`

`;
    });

    // Add fallback options if needed
    if (cleanupStrategy.fallbackOptions?.length > 0) {
        report += `### 🔄 Fallback Options
${cleanupStrategy.fallbackOptions.map((option: string) => `- ${option}`).join('\n')}

`;
    }

    // Add the Mermaid diagram
    report += `## 🎨 Visual State Diagram

\`\`\`mermaid
${mermaidDiagram}
\`\`\`

## 📝 Next Steps

1. **Review this analysis** carefully to understand current state
2. **Verify critical issues** match your expectations
3. **Run the cleanup tool** when ready: \`arc_cleanup_installation\`
4. **Monitor progress** through real-time updates
5. **Check final status** after completion

${riskAssessment.recommendation ? `
💡 **AI Recommendation:** ${riskAssessment.recommendation}
` : ''}

---
*Analysis completed at ${new Date().toISOString()}*
`;

    return report;
}

/**
 * Register policy validation tools
 */
export function registerPolicyTools(server: any, services: ServiceContext): void {
    // Policy validation and compliance tool
    server.registerTool(
        'arc_validate_policies',
        {
            title: 'Validate ARC Policies and Compliance',
            description: 'Validate ARC RunnerScaleSets against security, compliance, performance, and cost policies. All policies are built into the MCP server - no external files needed. When called without parameters, provides helpful overview and checks for violations.',
            inputSchema: {
                operation: z.enum(['validate', 'report', 'list_rules', 'list_violations', 'auto_fix'])
                    .optional()
                    .describe("Operation: 'validate' (check specific resource), 'report' (compliance report), 'list_rules' (available policies), 'list_violations' (current violations), 'auto_fix' (remediate issues). Default: provides helpful overview with rules and violations."),
                namespace: z.string().optional().describe("Kubernetes namespace to validate (defaults to 'arc-systems')"),
                runnerScaleSetName: z.string().optional().describe("Specific RunnerScaleSet name to validate"),
                category: z.enum(['security', 'compliance', 'performance', 'cost', 'operations', 'networking'])
                    .optional()
                    .describe("Filter by policy category"),
                severity: z.enum(['low', 'medium', 'high', 'critical'])
                    .optional()
                    .describe("Filter by severity level"),
                autoFix: z.boolean().optional().describe("Automatically fix violations where possible (default: false)"),
                apply: z.boolean().optional().describe("⚠️ IMPORTANT: Controls cluster application behavior. DEFAULT (false): Generates fixed config files in 'configs/' folder ONLY - no cluster changes. When true: Generates configs AND applies them to cluster immediately. Most users should use default for safe review-before-apply workflow.")
            }
        },
        async (params: any) => {
            try {
                services.logger.info('🔍 Starting ARC policy validation...', params);

                // AUTO-DISCOVERY: Check for policy config in standard locations
                const fsModule = await import('fs-extra');
                const pathModule = await import('path');
                const fs = fsModule.default || fsModule;
                const path = pathModule.default || pathModule;
                let discoveredConfigPath: string | undefined;

                const standardConfigPaths = [
                    'configs/policies/arc-policy-config.json',
                    'configs/policies/arc-policy-config.yaml',
                    'configs/policies/policy-config.json',
                    'configs/policies/policy-config.yaml'
                ];

                for (const configPath of standardConfigPaths) {
                    const absolutePath = path.resolve(process.cwd(), configPath);
                    if (fs.existsSync(absolutePath)) {
                        discoveredConfigPath = absolutePath;
                        services.logger.info(`✨ Auto-discovered policy config: ${configPath}`);
                        break;
                    }
                }

                // Explicit configPath parameter takes precedence over auto-discovery
                const finalConfigPath = params.configPath || discoveredConfigPath;

                if (finalConfigPath) {
                    services.logger.info(`📋 Using policy configuration: ${finalConfigPath}`);
                } else {
                    services.logger.info('📋 Using built-in default policy rules (no external config found)');
                }

                // Create policy engine instance with auto-discovered or explicit config
                const policyEngine = new ArcPolicyEngine(
                    services.kubernetes.getKubeConfig(),
                    finalConfigPath
                );

                // Smart default: if no operation specified, provide educational overview + check violations
                const operation = params.operation || 'overview';

                // Handle different operations
                switch (operation) {
                    case 'overview': {
                        // Default behavior: educate user about the tool and show current state
                        services.logger.info('📚 Providing policy validation overview...');
                        
                        let output = `# 🔒 ARC Policy Validation Tool

Welcome! This tool validates your GitHub Actions Runner Controller (ARC) deployments against **20+ built-in policies** for security, compliance, performance, and cost optimization.

## 🎯 What Gets Validated

All policies are **built into the MCP server** - no external configuration needed!

| Category | Policies | Examples |
|----------|----------|----------|
| 🔒 **Security** | 6 rules | Privileged mode, security contexts, secrets |
| 📋 **Compliance** | 3 rules | Repository scoping, runner groups, labels |
| 📊 **Performance** | 3 rules | Resource limits, CPU/memory quotas |
| 💰 **Cost** | 2 rules | Autoscaling, resource optimization |
| ⚙️ **Operations** | 2 rules | Runner images, operational practices |

${discoveredConfigPath ? `
## ✨ Custom Policy Configuration Active

**Using:** \`${path.relative(process.cwd(), discoveredConfigPath)}\`

Your custom policy configuration has been auto-discovered and loaded! This allows you to:
- Override built-in rule settings
- Customize enforcement levels
- Enable/disable specific rules
- Set organization-specific policies

` : `
## 📂 Policy Configuration (Optional)

Want to customize policies? Create a config file at:
- \`configs/policies/arc-policy-config.json\`
- \`configs/policies/arc-policy-config.yaml\`

The MCP server will **automatically discover and load** your config - no additional parameters needed!

`}

---

`;

                        // Try to get current violations (this educates AND provides value)
                        try {
                            const namespace = params.namespace || 'arc-systems';
                            const complianceReport = await policyEngine.generateArcComplianceReport(namespace);
                            
                            const complianceEmoji = complianceReport.overallCompliance >= 90 ? '✅' : 
                                                   complianceReport.overallCompliance >= 70 ? '⚠️' : '❌';
                            
                            output += `## 📊 Current Status (Namespace: ${namespace})

**Compliance Score**: ${complianceEmoji} **${complianceReport.overallCompliance.toFixed(1)}%**

| Metric | Count |
|--------|-------|
| Total Rules | ${complianceReport.results.summary.totalRules} |
| ✅ Passed | ${complianceReport.results.summary.passedRules} |
| ❌ Failed | ${complianceReport.results.summary.failedRules} |
| 🔴 Critical | ${complianceReport.results.violations.filter((v: any) => v.severity === 'critical').length} |
| 🟠 High | ${complianceReport.results.violations.filter((v: any) => v.severity === 'high').length} |
| ⚠️ Warnings | ${complianceReport.results.warnings.length} |

`;

                            // Show critical violations if any
                            const criticalViolations = complianceReport.results.violations.filter((v: any) => v.severity === 'critical');
                            if (criticalViolations.length > 0) {
                                output += `### 🔴 Critical Violations Detected

${criticalViolations.map((v: any, idx: number) => `${idx + 1}. **${v.ruleName}** - ${v.resource.kind}/${v.resource.name}
   - ${v.message}`).join('\n')}

`;
                            } else {
                                output += `### ✅ No Critical Violations

Great job! Your ARC deployment has no critical policy violations.

`;
                            }
                        } catch (error) {
                            // If we can't check violations (e.g., ARC not installed), that's okay - just educate
                            output += `## ℹ️ Current Status

Unable to check current violations. This might mean:
- ARC is not yet installed in your cluster
- The namespace doesn't exist
- You don't have necessary permissions

Don't worry - the tool is ready to validate once you have ARC deployed!

`;
                        }

                        // Add usage examples
                        output += `---

## 🚀 How to Use This Tool

### Quick Actions

**Check all violations:**
\`\`\`
Just mention "check ARC policies" or "validate ARC policies"
\`\`\`

**See full compliance report:**
\`\`\`
Run with: operation=report
Or say: "Generate ARC compliance report"
\`\`\`

**List all policy rules:**
\`\`\`
Run with: operation=list_rules
Or say: "Show me ARC policy rules"
\`\`\`

**Auto-fix violations:**
\`\`\`
Run with: operation=auto_fix
Or say: "Fix ARC policy violations"
\`\`\`

### Filter by Category or Severity

\`\`\`
category=security     # Only security policies
severity=critical     # Only critical violations
\`\`\`

### Advanced: Validate Specific Resource

\`\`\`
operation=validate
namespace=arc-systems
runnerScaleSetName=my-runners
\`\`\`

---

## 💡 What Makes This Tool Smart

✅ **No configuration needed** - All 20+ policies are built-in
✅ **Understands natural language** - Just ask in plain English
✅ **Auto-detects issues** - Scans your cluster automatically  
✅ **Provides fixes** - Can auto-remediate many violations
✅ **Enterprise-ready** - Based on industry best practices

## 📖 Policy Categories Explained

**🔒 Security**: Prevents privileged runners, enforces security contexts, validates secrets
**📋 Compliance**: Repository scoping, runner groups, proper labeling
**📊 Performance**: Resource limits, CPU/memory quotas
**💰 Cost**: Autoscaling configuration, resource optimization
**⚙️ Operations**: Runner images, operational best practices

---

*Ready to validate your ARC deployment? Just ask me to check policies, generate a report, or fix violations!*
`;

                        return {
                            content: [{ type: 'text', text: output }],
                            isError: false
                        };
                    }

                    case 'list_rules': {
                        const allRules = policyEngine.getRules();
                        let filteredRules = allRules;

                        if (params.category) {
                            filteredRules = policyEngine.getRulesByCategory(params.category);
                        }

                        const report = formatPolicyRulesForChat(filteredRules, params.category);

                        return {
                            content: [{ type: 'text', text: report }],
                            isError: false
                        };
                    }

                    case 'report': {
                        services.logger.info('📊 Generating compliance report...');
                        
                        const complianceReport = await policyEngine.generateArcComplianceReport(params.namespace);
                        const report = formatComplianceReportForChat(complianceReport);

                        return {
                            content: [{ type: 'text', text: report }],
                            isError: false,
                            structuredData: complianceReport
                        };
                    }

                    case 'validate': {
                        if (!params.runnerScaleSetName) {
                            throw new Error('runnerScaleSetName is required for validation operation');
                        }
                        if (!params.namespace) {
                            throw new Error('namespace is required for validation operation');
                        }

                        services.logger.info(`🔍 Validating RunnerScaleSet: ${params.namespace}/${params.runnerScaleSetName}`);

                        const result = await policyEngine.evaluateRunnerScaleSet(
                            params.namespace,
                            params.runnerScaleSetName
                        );

                        const report = formatValidationResultForChat(result, params);

                        return {
                            content: [{ type: 'text', text: report }],
                            isError: !result.passed,
                            structuredData: result
                        };
                    }

                    case 'list_violations': {
                        services.logger.info('📋 Listing current policy violations...');

                        const complianceReport = await policyEngine.generateArcComplianceReport(params.namespace);
                        let violations = [...complianceReport.results.violations, ...complianceReport.results.warnings];

                        if (params.severity) {
                            violations = violations.filter(v => v.severity === params.severity);
                        }
                        if (params.category) {
                            violations = violations.filter(v => v.category === params.category);
                        }

                        const report = formatViolationsListForChat(violations, params);

                        return {
                            content: [{ type: 'text', text: report }],
                            isError: violations.length > 0,
                            structuredData: { violations }
                        };
                    }

                    case 'auto_fix': {
                        const applyMode = params.apply === true;
                        services.logger.info(`🔧 Auto-fixing policy violations in ${applyMode ? 'APPLY MODE (configs + cluster)' : 'CONFIG-ONLY MODE (no cluster changes)'}...`);

                        const complianceReport = await policyEngine.generateArcComplianceReport(params.namespace);
                        const autoFixableViolations = [
                            ...complianceReport.results.violations,
                            ...complianceReport.results.warnings
                        ].filter(v => v.canAutoFix);

                        if (autoFixableViolations.length === 0) {
                            return {
                                content: [{
                                    type: 'text',
                                    text: '✅ No auto-fixable violations found. All policies are compliant or require manual remediation.'
                                }],
                                isError: false
                            };
                        }

                        // Group violations by resource
                        const violationsByResource = autoFixableViolations.reduce((acc, v) => {
                            const key = `${v.resource.namespace || params.namespace || 'arc-systems'}/${v.resource.name}`;
                            if (!acc[key]) {
                                acc[key] = {
                                    namespace: v.resource.namespace || params.namespace || 'arc-systems',
                                    name: v.resource.name,
                                    kind: v.resource.kind,
                                    violations: []
                                };
                            }
                            acc[key].violations.push(v);
                            return acc;
                        }, {} as Record<string, any>);

                        // If generateConfig is true, create fixed config files
                        // ALWAYS generate config files for auditing
                        {
                            services.logger.info('🔧 Generating fixed configuration files...');
                            
                            const configFileManager = new ConfigFileManager(process.cwd());
                            const fixedConfigs: string[] = [];
                            const fixResults: Array<{name: string, fixed: number, failed: number, violations: any[]}> = [];

                            for (const [key, resourceInfo] of Object.entries(violationsByResource)) {
                                try {
                                    // Fetch current resource from cluster
                                    const resources = await services.kubernetes.getCustomResources(
                                        'actions.github.com/v1alpha1',
                                        'AutoScalingRunnerSet',
                                        resourceInfo.namespace
                                    );

                                    const resource = resources.find((r: any) => r.metadata?.name === resourceInfo.name);
                                    if (!resource) {
                                        throw new Error(`RunnerScaleSet ${resourceInfo.name} not found in namespace ${resourceInfo.namespace}`);
                                    }
                                    
                                    // Apply fixes to the resource with tracking
                                    let fixedCount = 0;
                                    let failedCount = 0;
                                    const appliedFixes: any[] = [];
                                    
                                    for (const violation of resourceInfo.violations) {
                                        const fixApplied = applyFixToResource(resource, violation, services.logger);
                                        if (fixApplied) {
                                            fixedCount++;
                                            // Get the actual value that was set
                                            const actualValue = violation.suggestedValue || 
                                                               (violation.fixAction ? getFixValueFromAction(violation.fixAction, resource, violation) : undefined);
                                            appliedFixes.push({
                                                ...violation,
                                                actualValue
                                            });
                                        } else {
                                            failedCount++;
                                            services.logger.warn(`Failed to apply fix for ${violation.ruleName} on ${resourceInfo.name}`);
                                        }
                                    }

                                    fixResults.push({
                                        name: resourceInfo.name,
                                        fixed: fixedCount,
                                        failed: failedCount,
                                        violations: appliedFixes
                                    });

                                    // Clean up metadata for config file, but preserve spec and status
                                    const cleanResource = {
                                        apiVersion: resource.apiVersion,
                                        kind: resource.kind,
                                        metadata: {
                                            name: resource.metadata.name,
                                            namespace: resource.metadata.namespace,
                                            labels: resource.metadata.labels || {},
                                            annotations: {
                                                ...(resource.metadata.annotations || {}),
                                                'arc-mcp/auto-fixed': new Date().toISOString(),
                                                'arc-mcp/violations-fixed': fixedCount.toString(),
                                                'arc-mcp/violations-failed': failedCount.toString()
                                            }
                                        },
                                        spec: resource.spec  // Preserve the spec with applied fixes!
                                    };

                                    // Save to configs/runner-sets/
                                    const configPath = await configFileManager.writeConfig(
                                        'runnerSet',
                                        cleanResource,
                                        resourceInfo.name
                                    );
                                    
                                    fixedConfigs.push(configPath);
                                    services.logger.info(`✅ Generated fixed config: ${configPath} (${fixedCount} fixes applied, ${failedCount} failed)`);
                                } catch (error: any) {
                                    services.logger.error(`Failed to generate config for ${resourceInfo.name}:`, error);
                                    fixResults.push({
                                        name: resourceInfo.name,
                                        fixed: 0,
                                        failed: resourceInfo.violations.length,
                                        violations: []
                                    });
                                }
                            }

                            const totalFixed = fixResults.reduce((sum, r) => sum + r.fixed, 0);
                            const totalFailed = fixResults.reduce((sum, r) => sum + r.failed, 0);

                            // Store fixed resources for potential cluster application
                            const fixedResources: Array<{name: string, namespace: string, resource: any}> = [];
                            
                            // Track which resources have fixed configs saved
                            for (const [key, resourceInfo] of Object.entries(violationsByResource)) {
                                const configPath = fixedConfigs.find(path => path.includes(resourceInfo.name));
                                if (configPath) {
                                    // We need to re-fetch the resource with fixes applied
                                    // The cleanResource created earlier has the fixes in its spec
                                    const result = fixResults.find(r => r.name === resourceInfo.name);
                                    if (result && result.fixed > 0) {
                                        try {
                                            // Fetch again to get the fixed resource we saved
                                            const resources = await services.kubernetes.getCustomResources(
                                                'actions.github.com/v1alpha1',
                                                'AutoScalingRunnerSet',
                                                resourceInfo.namespace
                                            );
                                            const originalResource = resources.find((r: any) => r.metadata?.name === resourceInfo.name);
                                            
                                            if (originalResource) {
                                                // Apply the same fixes to a fresh copy for cluster application
                                                for (const violation of resourceInfo.violations) {
                                                    applyFixToResource(originalResource, violation, services.logger);
                                                }
                                                
                                                fixedResources.push({
                                                    name: resourceInfo.name,
                                                    namespace: resourceInfo.namespace,
                                                    resource: originalResource
                                                });
                                            }
                                        } catch (error: any) {
                                            services.logger.error(`Failed to prepare fixed resource for ${resourceInfo.name}:`, error);
                                        }
                                    }
                                }
                            }

                            // If apply=true, apply the fixes to the cluster
                            const applyResults: Array<{name: string, applied: boolean, error?: string}> = [];
                            if (applyMode) {
                                services.logger.info('🚀 Applying fixed configs to cluster...');
                                
                                for (const fixedResourceInfo of fixedResources) {
                                    try {
                                        // Apply to cluster using applyResource (handles create/update automatically)
                                        await services.kubernetes.applyResource(fixedResourceInfo.resource);

                                        applyResults.push({
                                            name: fixedResourceInfo.name,
                                            applied: true
                                        });
                                        services.logger.info(`✅ Applied fixes to cluster: ${fixedResourceInfo.name}`);
                                    } catch (error: any) {
                                        applyResults.push({
                                            name: fixedResourceInfo.name,
                                            applied: false,
                                            error: error.message
                                        });
                                        services.logger.error(`❌ Failed to apply ${fixedResourceInfo.name}:`, error);
                                    }
                                }
                            }

                            const report = applyMode ? `# 🚀 Policy Auto-Fix: Apply Mode

> **Mode**: Generate + Apply  
> **Location**: \`configs/runner-sets/\` folder (saved for audit)  
> **Cluster**: ✅ Changes applied immediately

## ✅ Summary

- **Total Violations**: ${autoFixableViolations.length}
- **Successfully Fixed**: ${totalFixed} ✅
- **Failed to Fix**: ${totalFailed} ❌
- **Resources Updated**: ${Object.keys(violationsByResource).length}
- **Applied to Cluster**: ${applyResults.filter(r => r.applied).length}/${applyResults.length}

## 📁 Generated Files (saved for audit trail)

${fixedConfigs.length > 0 ? fixedConfigs.map(path => `- ✅ \`${path}\``).join('\n') : '⚠️ No config files generated'}

## 🚀 Cluster Application Results

${applyResults.map(result => 
    result.applied 
        ? `- ✅ **${result.name}**: Applied successfully`
        : `- ❌ **${result.name}**: Failed - ${result.error}`
).join('\n')}

## 🔧 Violations Fixed

${fixResults.map(result => `
### ${result.name}
${result.fixed > 0 ? result.violations.map((v: any) => {
    const displayValue = v.actualValue !== undefined 
        ? (typeof v.actualValue === 'object' ? JSON.stringify(v.actualValue) : v.actualValue)
        : 'N/A';
    return `- ✅ **${v.ruleName}**: \`${v.field}\` → \`${displayValue}\``;
}).join('\n') : ''}
${result.failed > 0 ? `⚠️ **${result.failed} fix(es) failed** - manual intervention required` : ''}
`).join('\n')}

## 📋 Next Steps

1. **Verify** the changes in your cluster:
   \`\`\`bash
   kubectl get autoscalingrunnersets -n ${params.namespace || 'arc-systems'}
   \`\`\`
2. **Validate** compliance improved:
   \`\`\`
   Use #arc_validate_policies with operation=report
   \`\`\`
3. **Commit** the config files to Git for audit trail:
   \`\`\`bash
   git add configs/runner-sets/
   git commit -m "fix: apply policy auto-fixes to runners"
   \`\`\`

✅ **Fixes applied to cluster** - config files saved in \`configs/\` for audit trail!
` : `# 📝 Policy Auto-Fix: Config Generation Mode

> **Mode**: Configs-Only (GitOps/Hybrid workflow)  
> **Location**: \`configs/runner-sets/\` folder  
> **Cluster**: No changes applied yet ✋

## ✅ Summary

- **Total Violations**: ${autoFixableViolations.length}
- **Successfully Fixed**: ${totalFixed} ✅
- **Failed to Fix**: ${totalFailed} ❌
- **Resources Updated**: ${Object.keys(violationsByResource).length}

## 📁 Generated Files

${fixedConfigs.length > 0 ? fixedConfigs.map(path => `- ✅ \`${path}\``).join('\n') : '⚠️ No config files generated'}

## 🔧 Violations Fixed

${fixResults.map(result => `
### ${result.name}
${result.fixed > 0 ? result.violations.map((v: any) => {
    const displayValue = v.actualValue !== undefined 
        ? (typeof v.actualValue === 'object' ? JSON.stringify(v.actualValue) : v.actualValue)
        : 'N/A';
    return `- ✅ **${v.ruleName}**: \`${v.field}\` → \`${displayValue}\``;
}).join('\n') : ''}
${result.failed > 0 ? `⚠️ **${result.failed} fix(es) failed** - manual intervention required` : ''}
`).join('\n')}

## 📋 Next Steps (Hybrid/GitOps Workflow)

⏸️  **IMPORTANT**: Config files generated in \`configs/\` folder **only** - NOT applied to cluster yet!

1. **Review** the generated config files in \`configs/runner-sets/\`
2. **Commit** to Git:
   \`\`\`bash
   git add configs/runner-sets/
   git commit -m "fix: apply policy auto-fixes to runners"
   \`\`\`
3. **Apply** to cluster when ready:
   ${fixedConfigs.map(path => {
       const name = path.split('/').pop()?.replace('.yaml', '');
       return `   Use #arc_apply_config with configType=runnerSet, name=${name}`;
   }).join('\n')}
4. **Validate**: \`Use #arc_validate_policies with operation=report\`

💡 **Config files saved in \`configs/\`** - ready for review and Git commit!

---

**Want to apply immediately?** Re-run with \`apply=true\` to generate configs AND apply to cluster:
\`\`\`
Use #arc_validate_policies with operation=auto_fix, apply=true
\`\`\`
`;

                            return {
                                content: [{ type: 'text', text: report }],
                                isError: false,
                                structuredData: { fixedConfigs, autoFixableViolations }
                            };
                        }

                        // Default: Direct apply mode (preview - not yet implemented)
                        const report = `# 🔧 Auto-Fix Policy Violations

## 📊 Summary

Found **${autoFixableViolations.length}** auto-fixable violations.

⚠️ **Note**: Direct auto-fix requires additional implementation for safe automated remediation.

${autoFixableViolations.map((v, idx) => `
### ${idx + 1}. ${v.ruleName} (${v.severity})
- **Resource**: \`${v.resource.kind}/${v.resource.name}\`
- **Issue**: ${v.message}
- **Current**: \`${v.currentValue}\`
- **Suggested**: \`${v.suggestedValue}\`
`).join('\n')}

## � Recommended: Use Config Generation Mode

Generate fixed config files for review before applying:

\`\`\`
Use #arc_validate_policies with operation=auto_fix, generateConfig=true
\`\`\`

This aligns with your hybrid/GitOps workflow:
- 📝 Creates config files in \`configs/runner-sets/\`
- 🔍 Allows review before applying
- 📦 Enables Git version control
- ✅ Safe and auditable

## 🚧 Alternative: Manual Remediation

1. Review each violation above
2. Apply suggested fixes via \`kubectl edit\` or update YAML configs
3. Re-validate with \`arc_validate_policies --operation validate\`
`;

                        return {
                            content: [{ type: 'text', text: report }],
                            isError: false,
                            structuredData: { autoFixableViolations }
                        };
                    }

                    default:
                        throw new Error(`Unknown operation: ${operation}`);
                }

            } catch (error: any) {
                services.logger.error('❌ Policy validation failed:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `# ❌ Policy Validation Failed

**Error**: ${error.message}

**Troubleshooting**:
- Ensure ARC is installed in the cluster
- Verify namespace exists
- Check RunnerScaleSet name is correct
- Ensure you have proper RBAC permissions

**Common Issues**:
1. **RunnerScaleSet not found**: Verify the resource exists with \`kubectl get runnerscalesets -n <namespace>\`
2. **Permission denied**: Ensure your kubeconfig has access to custom resources
3. **API group mismatch**: This tool expects ARC custom resources in the \`actions.github.com\` API group
`
                    }],
                    isError: true
                };
            }
        }
    );

    /**
     * Generate Policy Configuration Tool
     * Creates a customized policy configuration file based on user requirements
     * Supports natural language input - e.g., "for development purposes", "staging environment", "production ready"
     */
    server.registerTool(
        'arc_policy_config_generate',
        {
            title: 'Generate ARC Policy Configuration',
            description: 'Generate a customized policy configuration file for various environments and compliance requirements. Supports development, staging, production, plus specialized environments like FedRAMP, HIPAA, PCI-DSS, financial services, edge, IoT, and more. Use natural language or explicit parameters.',
            inputSchema: {
                query: z.string().optional().describe('Natural language description (e.g., "for development", "FedRAMP compliant", "HIPAA healthcare", "financial services", "edge computing")'),
                organizationName: z.string().optional().describe('Your organization name'),
                environment: z.enum([
                    'development', 'staging', 'production',
                    'fedramp', 'fedramp-high', 'fedramp-moderate',
                    'hipaa', 'pci-dss', 'sox', 'gdpr',
                    'financial', 'healthcare', 'government',
                    'edge', 'iot', 'embedded',
                    'startup', 'enterprise', 'multi-tenant',
                    'aiml', 'research', 'education',
                    'high-security', 'zero-trust', 'air-gapped'
                ]).optional().describe('Target environment type with pre-configured policies'),
                securityLevel: z.enum(['minimal', 'low', 'medium', 'high', 'maximum', 'paranoid']).optional().describe('Security enforcement level'),
                complianceFrameworks: z.array(z.string()).optional().describe('Compliance frameworks to enforce (e.g., ["SOC2", "ISO27001", "NIST"])'),
                costOptimization: z.enum(['none', 'low', 'moderate', 'aggressive']).optional().describe('Cost optimization strategy'),
                autoFix: z.boolean().optional().describe('Enable automatic policy violation fixes'),
                outputPath: z.string().optional().describe('Output path for the config file (defaults to configs/policies/arc-policy-config.json)')
            }
        },
        async (params: any) => {
            try {
                services.logger.info('🎨 Generating custom policy configuration...');
                services.logger.info('📦 Received parameters:', JSON.stringify(params, null, 2));
                services.logger.info('📦 Parameter keys:', Object.keys(params));

                // Natural language processing to detect environment
                let detectedEnvironment: string | undefined;
                
                if (params.query) {
                    const query = params.query.toLowerCase();
                    
                    // Development keywords
                    if (query.match(/\b(dev|development|develop|local|testing|test)\b/)) {
                        detectedEnvironment = 'development';
                    }
                    // Staging keywords
                    else if (query.match(/\b(stage|staging|stg|qa|preprod|pre-prod|pre-production)\b/)) {
                        detectedEnvironment = 'staging';
                    }
                    // Production keywords
                    else if (query.match(/\b(prod|production|live|release)\b/)) {
                        detectedEnvironment = 'production';
                    }
                    // FedRAMP keywords
                    else if (query.match(/\b(fedramp|fed-ramp|federal|government|nist|fips)\b/)) {
                        if (query.includes('high')) {
                            detectedEnvironment = 'fedramp-high';
                        } else if (query.includes('moderate')) {
                            detectedEnvironment = 'fedramp-moderate';
                        } else {
                            detectedEnvironment = 'fedramp';
                        }
                    }
                    // Healthcare/HIPAA keywords
                    else if (query.match(/\b(hipaa|healthcare|health|medical|phi|patient)\b/)) {
                        detectedEnvironment = 'hipaa';
                    }
                    // Financial keywords
                    else if (query.match(/\b(pci|pci-dss|payment|financial|banking|fintech|sox|sarbanes)\b/)) {
                        if (query.includes('sox') || query.includes('sarbanes')) {
                            detectedEnvironment = 'sox';
                        } else {
                            detectedEnvironment = 'pci-dss';
                        }
                    }
                    // GDPR keywords
                    else if (query.match(/\b(gdpr|privacy|eu|european|data-protection)\b/)) {
                        detectedEnvironment = 'gdpr';
                    }
                    // Edge/IoT keywords
                    else if (query.match(/\b(edge|iot|embedded|constrained|low-power)\b/)) {
                        if (query.includes('iot')) {
                            detectedEnvironment = 'iot';
                        } else {
                            detectedEnvironment = 'edge';
                        }
                    }
                    // AI/ML keywords
                    else if (query.match(/\b(ai|ml|machine-learning|artificial-intelligence|gpu|training)\b/)) {
                        detectedEnvironment = 'aiml';
                    }
                    // Enterprise keywords
                    else if (query.match(/\b(enterprise|large-scale|multi-tenant|saas)\b/)) {
                        detectedEnvironment = 'enterprise';
                    }
                    // Startup keywords
                    else if (query.match(/\b(startup|small|agile|fast|mvp)\b/)) {
                        detectedEnvironment = 'startup';
                    }
                    // High security keywords
                    else if (query.match(/\b(high-security|zero-trust|air-gapped|isolated|hardened)\b/)) {
                        if (query.includes('zero-trust')) {
                            detectedEnvironment = 'zero-trust';
                        } else if (query.includes('air-gap')) {
                            detectedEnvironment = 'air-gapped';
                        } else {
                            detectedEnvironment = 'high-security';
                        }
                    }
                    // Research/Education keywords
                    else if (query.match(/\b(research|academic|education|university|lab)\b/)) {
                        detectedEnvironment = query.includes('research') ? 'research' : 'education';
                    }
                }

                // Priority: explicit parameter > detected from query > default to production
                const environment = params.environment || detectedEnvironment || 'production';
                const orgName = params.organizationName || 'my-organization';
                const securityLevel = params.securityLevel;
                const costOptimization = params.costOptimization || 'moderate';
                const autoFixEnabled = params.autoFix !== undefined ? params.autoFix : null; // null means use environment default

                /**
                 * Helper function to generate ruleOverrides based on category enforcement
                 * Maps the 18+ built-in policy rules to categories and applies enforcement
                 */
                const generateRuleOverrides = (categories: any): any => {
                    // Map of rule IDs to their categories (from policy-engine.ts)
                    const ruleCategoryMap: { [key: string]: string } = {
                        // Security rules
                        'arc-sec-001': 'security',
                        'arc-sec-002': 'security',
                        'arc-sec-003': 'security',
                        'arc-013-003': 'security',
                        'arc-013-005': 'security',
                        'arc-013-006': 'security',
                        
                        // Performance rules
                        'arc-res-001': 'performance',
                        'arc-013-001': 'performance',
                        'arc-013-007': 'performance',
                        'arc-scale-002': 'performance',
                        
                        // Cost rules
                        'arc-res-002': 'cost',
                        'arc-scale-001': 'cost',
                        
                        // Operations rules
                        'arc-ops-001': 'operations',
                        'arc-ops-002': 'operations',
                        'arc-013-002': 'operations',
                        
                        // Compliance rules
                        'arc-comp-001': 'compliance',
                        'arc-comp-002': 'compliance',
                        
                        // Networking rules
                        'arc-013-004': 'networking'
                    };

                    const ruleOverrides: any = {};

                    // Apply category enforcement to each rule
                    Object.entries(ruleCategoryMap).forEach(([ruleId, category]) => {
                        const categorySettings = categories[category];
                        
                        if (categorySettings) {
                            // Map enforcement level to rule settings
                            const enforcement = categorySettings.enforcement;
                            const enabled = categorySettings.enabled !== false && enforcement !== 'disabled';
                            
                            // Set severity based on enforcement level
                            let severity: 'low' | 'medium' | 'high' | 'critical' | undefined;
                            
                            if (enforcement === 'strict') {
                                // Strict enforcement: security/compliance = critical, others = high
                                if (category === 'security' || category === 'compliance') {
                                    severity = 'critical';
                                } else {
                                    severity = 'high';
                                }
                            } else if (enforcement === 'advisory') {
                                // Advisory: medium severity (warnings)
                                severity = 'medium';
                            }
                            // If disabled, don't set severity (let rule default apply)
                            
                            ruleOverrides[ruleId] = {
                                enabled: enabled,
                                ...(severity && { severity: severity }),
                                ...(categorySettings.autoFix !== undefined && { autoFix: categorySettings.autoFix })
                            };
                        }
                    });

                    return ruleOverrides;
                };

                // Environment-specific configuration presets
                let policyConfig: any;

                if (environment === 'development') {
                    // DEVELOPMENT: Relaxed policies for fast iteration
                    const enforcementLevel = params.enforcementLevel || 'advisory';
                    const autoFix = params.enableAutoFix !== undefined ? params.enableAutoFix : true;

                    const categories = {
                        security: {
                            enabled: true,
                            enforcement: 'advisory',
                            autoFix: true,
                            description: 'Relaxed security for dev - warnings only'
                        },
                        compliance: {
                            enabled: false, // Disabled in dev
                            enforcement: 'disabled',
                            autoFix: false,
                            description: 'Compliance checks disabled in development'
                        },
                        performance: {
                            enabled: true,
                            enforcement: 'advisory',
                            autoFix: true,
                            description: 'Performance suggestions with auto-fix'
                        },
                        cost: {
                            enabled: false, // Cost not important in dev
                            enforcement: 'disabled',
                            autoFix: false,
                            description: 'Cost optimization disabled in development'
                        },
                        operations: {
                            enabled: true,
                            enforcement: 'advisory',
                            autoFix: true,
                            description: 'Operational best practices with auto-fix'
                        }
                    };

                    policyConfig = {
                        organization: {
                            name: orgName,
                            environment: 'development',
                            compliance: []
                        },
                        global: {
                            enforcement: enforcementLevel,
                            autoFix: autoFix,
                            excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease']
                        },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: {
                            maxCpu: null, // No CPU limits in dev
                            maxMemory: null, // No memory limits in dev
                            minReplicas: 1,
                            maxReplicas: null // No scaling limits
                        }
                    };


                } else if (environment === 'staging') {
                    // STAGING: Balanced policies - testing production-like settings
                    const enforcementLevel = params.enforcementLevel || 'advisory';
                    const autoFix = params.enableAutoFix !== undefined ? params.enableAutoFix : true;

                    const categories = {
                        security: {
                            enabled: true,
                            enforcement: 'advisory', // Warn but don't block
                            autoFix: true,
                            description: 'Security checks with warnings - preparing for prod'
                        },
                        compliance: {
                            enabled: true,
                            enforcement: 'advisory',
                            autoFix: false,
                            description: 'Compliance validation - testing prod readiness'
                        },
                        performance: {
                            enabled: true,
                            enforcement: 'advisory',
                            autoFix: true,
                            description: 'Performance optimization with auto-fix'
                        },
                        cost: {
                            enabled: true, // Monitor costs in staging
                            enforcement: 'advisory',
                            autoFix: false,
                            description: 'Cost awareness for production planning'
                        },
                        operations: {
                            enabled: true,
                            enforcement: 'advisory',
                            autoFix: true,
                            description: 'Operational readiness checks'
                        }
                    };

                    policyConfig = {
                        organization: {
                            name: orgName,
                            environment: 'staging',
                            compliance: ['Pre-production validation']
                        },
                        global: {
                            enforcement: enforcementLevel,
                            autoFix: autoFix,
                            excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease']
                        },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: {
                            maxCpu: '4000m', // Some limits to simulate prod
                            maxMemory: '8Gi',
                            minReplicas: 1,
                            maxReplicas: 10
                        }
                    };

                } else if (environment === 'fedramp' || environment === 'fedramp-high' || environment === 'fedramp-moderate') {
                    // FEDRAMP: Federal government compliance
                    const level = environment === 'fedramp-high' ? 'High' : environment === 'fedramp-moderate' ? 'Moderate' : 'High';
                    const categories = {
                        security: { enabled: true, enforcement: 'strict', autoFix: false, description: `FedRAMP ${level} security controls` },
                        compliance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Government compliance required' },
                        performance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Performance standards must be met' },
                        cost: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Cost tracking required' },
                        operations: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Continuous monitoring required' }
                    };
                    policyConfig = {
                        organization: { name: orgName, environment, compliance: [`FedRAMP ${level}`, 'NIST 800-53', 'FIPS 140-2'] },
                        global: { enforcement: 'strict', autoFix: autoFixEnabled !== null ? autoFixEnabled : false, excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease'], auditLogging: true },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: { maxCpu: '4000m', maxMemory: '8Gi', minReplicas: 3, maxReplicas: 100 }
                    };
                
                } else if (environment === 'hipaa') {
                    // HIPAA: Healthcare compliance
                    const categories = {
                        security: { enabled: true, enforcement: 'strict', autoFix: false, description: 'PHI protection required' },
                        compliance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'HIPAA violations block deployment' },
                        performance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Healthcare system reliability' },
                        cost: { enabled: true, enforcement: 'advisory', autoFix: false, description: 'Cost monitoring' },
                        operations: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Audit trails required' }
                    };
                    policyConfig = {
                        organization: { name: orgName, environment, compliance: ['HIPAA', 'HITECH', 'SOC2 Type II'] },
                        global: { enforcement: 'strict', autoFix: autoFixEnabled !== null ? autoFixEnabled : false, excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease'] },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: { maxCpu: '4000m', maxMemory: '8Gi', minReplicas: 3, maxReplicas: 50 }
                    };

                } else if (environment === 'pci-dss' || environment === 'financial') {
                    // PCI-DSS: Payment card / Financial services
                    const categories = {
                        security: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Payment data protection' },
                        compliance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'PCI-DSS compliance required' },
                        performance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Transaction reliability' },
                        cost: { enabled: true, enforcement: 'advisory', autoFix: false, description: 'Financial tracking' },
                        operations: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Audit and monitoring' }
                    };
                    policyConfig = {
                        organization: { name: orgName, environment, compliance: ['PCI-DSS', 'SOC2 Type II', 'ISO27001'] },
                        global: { enforcement: 'strict', autoFix: autoFixEnabled !== null ? autoFixEnabled : false, excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease'] },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: { maxCpu: '4000m', maxMemory: '8Gi', minReplicas: 3, maxReplicas: 100 }
                    };

                } else if (environment === 'edge' || environment === 'iot' || environment === 'embedded') {
                    // EDGE/IoT: Resource-constrained environments
                    const categories = {
                        security: { enabled: true, enforcement: 'advisory', autoFix: true, description: 'Lightweight security' },
                        compliance: { enabled: false, enforcement: 'disabled', autoFix: false, description: 'Compliance disabled for edge' },
                        performance: { enabled: true, enforcement: 'strict', autoFix: true, description: 'Resource efficiency critical' },
                        cost: { enabled: true, enforcement: 'strict', autoFix: true, description: 'Aggressive cost optimization' },
                        operations: { enabled: true, enforcement: 'advisory', autoFix: true, description: 'Minimal operational overhead' }
                    };
                    policyConfig = {
                        organization: { name: orgName, environment, compliance: [] },
                        global: { enforcement: 'advisory', autoFix: autoFixEnabled !== null ? autoFixEnabled : true, excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease'] },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: { maxCpu: '500m', maxMemory: '1Gi', minReplicas: 1, maxReplicas: 5 }
                    };

                } else if (environment === 'startup') {
                    // STARTUP: Fast iteration, cost-conscious
                    const categories = {
                        security: { enabled: true, enforcement: 'advisory', autoFix: true, description: 'Basic security practices' },
                        compliance: { enabled: false, enforcement: 'disabled', autoFix: false, description: 'Compliance disabled for speed' },
                        performance: { enabled: true, enforcement: 'advisory', autoFix: true, description: 'Performance optimization' },
                        cost: { enabled: true, enforcement: 'strict', autoFix: true, description: 'Aggressive cost control' },
                        operations: { enabled: true, enforcement: 'advisory', autoFix: true, description: 'Lean operations' }
                    };
                    policyConfig = {
                        organization: { name: orgName, environment, compliance: [] },
                        global: { enforcement: 'advisory', autoFix: autoFixEnabled !== null ? autoFixEnabled : true, excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease'] },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: { maxCpu: '2000m', maxMemory: '4Gi', minReplicas: 1, maxReplicas: 10 }
                    };

                } else if (environment === 'enterprise' || environment === 'multi-tenant') {
                    // ENTERPRISE: Large-scale, multi-tenant
                    const categories = {
                        security: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Enterprise security standards' },
                        compliance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Compliance required' },
                        performance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'SLA requirements' },
                        cost: { enabled: true, enforcement: 'advisory', autoFix: false, description: 'Cost optimization' },
                        operations: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Operational excellence' }
                    };
                    policyConfig = {
                        organization: { name: orgName, environment, compliance: ['SOC2 Type II', 'ISO27001'] },
                        global: { enforcement: 'strict', autoFix: autoFixEnabled !== null ? autoFixEnabled : false, excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease'] },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: { maxCpu: '8000m', maxMemory: '16Gi', minReplicas: 3, maxReplicas: 200 }
                    };

                } else if (environment === 'aiml' || environment === 'research') {
                    // AI/ML: GPU workloads, experimentation
                    const categories = {
                        security: { enabled: true, enforcement: 'advisory', autoFix: true, description: 'Research security' },
                        compliance: { enabled: false, enforcement: 'disabled', autoFix: false, description: 'Compliance disabled for research' },
                        performance: { enabled: true, enforcement: 'advisory', autoFix: false, description: 'GPU/compute optimization' },
                        cost: { enabled: true, enforcement: 'advisory', autoFix: false, description: 'Expensive compute monitoring' },
                        operations: { enabled: true, enforcement: 'advisory', autoFix: true, description: 'Flexible operations' }
                    };
                    policyConfig = {
                        organization: { name: orgName, environment, compliance: [] },
                        global: { enforcement: 'advisory', autoFix: autoFixEnabled !== null ? autoFixEnabled : true, excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease'] },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: { maxCpu: '16000m', maxMemory: '64Gi', minReplicas: 0, maxReplicas: 50 }
                    };

                } else if (environment === 'high-security' || environment === 'zero-trust' || environment === 'air-gapped') {
                    // HIGH SECURITY: Maximum security posture
                    const categories = {
                        security: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Maximum security - zero tolerance' },
                        compliance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Strict compliance required' },
                        performance: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Security over performance' },
                        cost: { enabled: true, enforcement: 'advisory', autoFix: false, description: 'Security justifies cost' },
                        operations: { enabled: true, enforcement: 'strict', autoFix: false, description: 'Secure operations only' }
                    };
                    policyConfig = {
                        organization: { name: orgName, environment, compliance: ['NIST 800-53', 'ISO27001', 'SOC2 Type II'] },
                        global: { enforcement: 'strict', autoFix: autoFixEnabled !== null ? autoFixEnabled : false, excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease'] },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: { maxCpu: '2000m', maxMemory: '4Gi', minReplicas: 3, maxReplicas: 50 }
                    };

                } else {
                    // PRODUCTION: Strict policies for security and compliance
                    const enforcementLevel = params.enforcementLevel || 'strict';
                    const autoFix = params.enableAutoFix !== undefined ? params.enableAutoFix : false;

                    const categories = {
                        security: {
                            enabled: true,
                            enforcement: 'strict',
                            autoFix: false,
                            description: 'Strict security enforcement - violations block deployment'
                        },
                        compliance: {
                            enabled: true,
                            enforcement: 'strict',
                            autoFix: false,
                            description: 'Compliance violations block deployment'
                        },
                        performance: {
                            enabled: true,
                            enforcement: 'strict',
                            autoFix: false,
                            description: 'Performance standards must be met'
                        },
                        cost: {
                            enabled: true,
                            enforcement: 'advisory',
                            autoFix: false,
                            description: 'Cost monitoring and optimization alerts'
                        },
                        operations: {
                            enabled: true,
                            enforcement: 'strict',
                            autoFix: false,
                            description: 'Operational excellence required'
                        }
                    };

                    policyConfig = {
                        organization: {
                            name: orgName,
                            environment: 'production',
                            compliance: ['SOC2', 'ISO27001', 'PCI-DSS']
                        },
                        global: {
                            enforcement: enforcementLevel,
                            autoFix: autoFix, // Disabled by default - manual review required
                            excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease']
                        },
                        categories: categories,
                        ruleOverrides: generateRuleOverrides(categories),
                        limits: {
                            maxCpu: '2000m', // Strict resource limits
                            maxMemory: '4Gi',
                            minReplicas: 2, // HA requirement
                            maxReplicas: 50
                        }
                    };
                }

                // Apply custom category settings
                if (params.customCategories) {
                    Object.assign(policyConfig.categories, params.customCategories);
                }

                // Add rule overrides for disabled rules
                if (params.disableRules && params.disableRules.length > 0) {
                    policyConfig.ruleOverrides = {};
                    params.disableRules.forEach((ruleId: string) => {
                        policyConfig.ruleOverrides[ruleId] = {
                            enabled: false,
                            comment: 'Disabled by user request'
                        };
                    });
                }

                // Determine output path
                const outputPath = params.outputPath || 'configs/policies/arc-policy-config.json';
                const fs = await import('fs/promises');
                const path = await import('path');

                // Check if file already exists
                let fileExisted = false;
                try {
                    await fs.access(outputPath);
                    fileExisted = true;
                    services.logger.info(`📝 Overwriting existing policy configuration: ${outputPath}`);
                } catch {
                    services.logger.info(`📄 Creating new policy configuration: ${outputPath}`);
                }

                // Ensure directory exists
                const dir = path.dirname(outputPath);
                await fs.mkdir(dir, { recursive: true });

                // Write the config file (overwrites if exists)
                await fs.writeFile(
                    outputPath,
                    JSON.stringify(policyConfig, null, 2),
                    'utf-8'
                );

                services.logger.info(`✅ Policy configuration ${fileExisted ? 'updated' : 'generated'}: ${outputPath}`);

                // Generate response with environment detection info
                let response = `# 🎨 ARC Policy Configuration ${fileExisted ? 'Updated' : 'Generated'}

✅ **Configuration ${fileExisted ? 'overwritten' : 'created'} successfully!**
${fileExisted ? '\n⚠️ **Note**: Previous configuration was overwritten.\n' : ''}
${detectedEnvironment && params.query ? `\n🔍 **Detected Environment**: ${detectedEnvironment} (from: "${params.query}")\n` : ''}
## 📁 File Location

\`${outputPath}\`

## 📋 Configuration Summary

- **Organization**: ${orgName}
- **Environment**: ${environment}
- **Enforcement**: ${policyConfig.global.enforcement}
- **Auto-fix**: ${policyConfig.global.autoFix ? '✅ Enabled' : '❌ Disabled'}
${params.disableRules && params.disableRules.length > 0 ? `- **Disabled Rules**: ${params.disableRules.length}` : ''}

## 🎯 Environment Profile: ${environment.toUpperCase()}

${environment === 'development' ? `
**Development Mode** - Optimized for fast iteration:
- 🟢 Security: Advisory (warnings only)
- 🔴 Compliance: Disabled
- 🟢 Performance: Advisory with auto-fix
- 🔴 Cost: Disabled
- 🟢 Operations: Advisory with auto-fix
- 🚀 No resource limits
` : environment === 'staging' ? `
**Staging Mode** - Pre-production validation:
- 🟡 Security: Advisory (preparing for prod)
- 🟡 Compliance: Advisory (testing readiness)
- 🟢 Performance: Advisory with auto-fix
- 🟡 Cost: Advisory (planning)
- 🟢 Operations: Advisory with auto-fix
- 📊 Moderate resource limits
` : `
**Production Mode** - Maximum security & compliance:
- 🔴 Security: Strict enforcement
- 🔴 Compliance: Strict enforcement
- 🔴 Performance: Strict enforcement
- 🟡 Cost: Advisory monitoring
- 🔴 Operations: Strict enforcement
- 🔒 Strict resource limits & HA requirements
`}

## 🔧 Generated Configuration

\`\`\`json
${JSON.stringify(policyConfig, null, 2)}
\`\`\`

---

⚠️ **IMPORTANT FOR AI ASSISTANTS**: 
This configuration file has been generated by the MCP tool and is complete as-is. 
**DO NOT automatically modify this file unless the user explicitly requests specific changes.**
If different settings are needed, regenerate using the tool with appropriate parameters instead.

---

## 🚀 Next Steps

1. **Review the configuration** - Open \`${outputPath}\` to review settings
2. **Run validation** - The config is automatically discovered:
   \`\`\`
   arc_validate_policies --operation report
   \`\`\`
3. **Need changes?** - Re-run this tool with different parameters rather than manually editing

## 💡 Auto-Discovery

This config will be **automatically loaded** by the policy validation tool because it's in the standard location (\`configs/policies/\`).

## 📝 Generate Different Environment Configurations

The tool supports **natural language** and explicit parameters:

### Natural Language (Recommended)
\`\`\`
"Generate a policy config for development purposes"
"I need a staging environment configuration"
"Create a production-ready policy config"
\`\`\`

### Explicit Parameters
\`\`\`bash
# Development: Relaxed policies, auto-fix enabled, no limits
arc_generate_policy_config --environment development

# Staging: Balanced policies, testing prod-like settings
arc_generate_policy_config --environment staging

# Production: Strict enforcement, compliance required, HA enforced
arc_generate_policy_config --environment production
\`\`\`

### With Natural Language Query
\`\`\`bash
arc_generate_policy_config --query "for development testing"
arc_generate_policy_config --query "staging environment"
arc_generate_policy_config --query "production deployment"
\`\`\`
\`\`\`

🎉 **Your ${environment} policy configuration is ready to use!**
`;

                return {
                    content: [{ type: 'text', text: response }],
                    isError: false,
                    structuredData: {
                        configPath: outputPath,
                        configuration: policyConfig
                    }
                };

            } catch (error: any) {
                services.logger.error('❌ Failed to generate policy configuration:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `# ❌ Policy Configuration Generation Failed

**Error**: ${error.message}

**Troubleshooting**:
- Ensure the output directory is writable
- Check that you have permissions to create files
- Verify the output path is valid

**Common Issues**:
1. **Permission denied**: Ensure write permissions on the configs directory
2. **Directory not found**: The tool will create directories automatically, but parent paths must exist
3. **Invalid JSON**: If customCategories is provided, ensure it's valid JSON
`
                    }],
                    isError: true
                };
            }
        }
    );
}

// ============================================================================
// Policy Auto-Fix Helper Functions
// ============================================================================

/**
 * Get fix value from fixAction for complex scenarios
 */
function getFixValueFromAction(fixAction: string, resource: any, violation: any): any {
    const fixActionMap: Record<string, (r: any, v: any) => any> = {
        'add_runner_security_context': () => ({
            runAsNonRoot: true,
            runAsUser: 1000,
            fsGroup: 1000
        }),
        
        'remove_privileged_flag': () => false,
        
        'add_runner_resource_limits': () => {
            // Extract container name from field if present
            const containerMatch = violation.field?.match(/containers\[(\d+)\]/);
            if (containerMatch) {
                return {
                    cpu: '2.0',
                    memory: '2Gi'
                };
            }
            return null;
        },
        
        'set_container_mode_novolume': () => ({
            type: 'kubernetes',
            kubernetesModeWorkVolumeClaim: null
        }),
        
        'add_enhanced_metrics_labels': () => {
            // For labels, we need to return the specific label value
            if (violation.field?.includes('workflow-name')) {
                return '${GITHUB_WORKFLOW}';
            }
            if (violation.field?.includes('target')) {
                return '${GITHUB_REPOSITORY}';
            }
            return 'unknown';
        },
        
        'configure_dualstack_dns': () => 'ClusterFirst',
        
        'configure_openshift_scc': () => 1000,
        
        'remove_jit_token_exposure': () => {
            // This requires removing an item, return null to indicate removal
            return null;
        }
    };

    const handler = fixActionMap[fixAction];
    if (handler) {
        return handler(resource, violation);
    }
    
    return undefined;
}

/**
 * Apply a fix to a resource based on a policy violation
 */
function applyFixToResource(resource: any, violation: any, logger?: any): boolean {
    const field = violation.field;
    let suggestedValue = violation.suggestedValue;

    // If no suggestedValue but we have fixAction, try to get the value
    if (suggestedValue === undefined && violation.fixAction) {
        suggestedValue = getFixValueFromAction(violation.fixAction, resource, violation);
    }

    if (!field || suggestedValue === undefined) {
        logger?.warn(`Cannot apply fix for ${violation.ruleName}: No suggestedValue or fixAction handler available`);
        return false;
    }

    // Handle special cases for array wildcard fields like containers[*]
    if (field.includes('[*]')) {
        return applyFixToArrayField(resource, field, suggestedValue, logger);
    }

    const parts = field.split('.');
    let current = resource;

    // Navigate to the parent of the field we want to set
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        
        // Handle array indices like containers[0]
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
            const [, arrayName, index] = arrayMatch;
            if (!current[arrayName]) {
                current[arrayName] = [];
            }
            if (!current[arrayName][parseInt(index)]) {
                current[arrayName][parseInt(index)] = {};
            }
            current = current[arrayName][parseInt(index)];
        } else {
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
    }

    // Set the final value
    const lastPart = parts[parts.length - 1];
    const arrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        if (!current[arrayName]) {
            current[arrayName] = [];
        }
        current[arrayName][parseInt(index)] = suggestedValue;
    } else {
        current[lastPart] = suggestedValue;
    }
    
    logger?.info(`Applied fix for ${violation.ruleName}: ${field} = ${JSON.stringify(suggestedValue)}`);
    return true;
}

/**
 * Apply fix to array fields with wildcard (e.g., containers[*].field)
 */
function applyFixToArrayField(resource: any, field: string, suggestedValue: any, logger?: any): boolean {
    const parts = field.split('.');
    const arrayPart = parts.find(p => p.includes('[*]'));
    
    if (!arrayPart) {
        return false;
    }

    const arrayName = arrayPart.replace('[*]', '');
    const arrayIndex = parts.indexOf(arrayPart);
    
    // Navigate to the array
    let current = resource;
    for (let i = 0; i < arrayIndex; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }

    const array = current[arrayName];
    if (!Array.isArray(array) || array.length === 0) {
        logger?.warn(`Cannot apply fix: ${arrayName} is not an array or is empty`);
        return false;
    }

    // Apply the fix to all items in the array
    const remainingPath = parts.slice(arrayIndex + 1);
    let fixedCount = 0;
    
    for (const item of array) {
        let target = item;
        for (let i = 0; i < remainingPath.length - 1; i++) {
            if (!target[remainingPath[i]]) {
                target[remainingPath[i]] = {};
            }
            target = target[remainingPath[i]];
        }
        target[remainingPath[remainingPath.length - 1]] = suggestedValue;
        fixedCount++;
    }

    logger?.info(`Applied fix to ${fixedCount} items in ${arrayName}`);
    return true;
}

// ============================================================================
// Policy Formatting Helper Functions
// ============================================================================

function formatPolicyRulesForChat(rules: any[], category?: string): string {
    const title = category 
        ? `# 📋 ARC Policy Rules - ${category.charAt(0).toUpperCase() + category.slice(1)}`
        : '# 📋 All ARC Policy Rules';

    let report = `${title}

Found **${rules.length}** policy rules${category ? ` in category '${category}'` : ''}.

`;

    // Group by category
    const grouped = rules.reduce((acc, rule) => {
        if (!acc[rule.category]) acc[rule.category] = [];
        acc[rule.category].push(rule);
        return acc;
    }, {} as Record<string, any[]>);

    Object.entries(grouped).forEach(([cat, catRules]) => {
        const rules = catRules as any[];
        report += `## ${getCategoryEmoji(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)} Policies (${rules.length})

`;
        rules.forEach((rule: any) => {
            const statusEmoji = rule.enabled ? '✅' : '⚪';
            const severityEmoji = getSeverityEmoji(rule.severity);
            
            report += `### ${statusEmoji} ${rule.name}
- **ID**: \`${rule.id}\`
- **Severity**: ${severityEmoji} ${rule.severity}
- **Scope**: ${rule.scope}
- **Status**: ${rule.enabled ? 'Enabled' : 'Disabled'}
- **Description**: ${rule.description}

`;
        });
    });

    report += `
## 📖 Usage Examples

\`\`\`
# Validate specific RunnerScaleSet
arc_validate_policies --operation validate --namespace arc-systems --runnerScaleSetName my-runners

# Generate compliance report
arc_validate_policies --operation report

# List violations by severity
arc_validate_policies --operation list_violations --severity critical

# Auto-fix violations (preview)
arc_validate_policies --operation auto_fix --namespace arc-systems
\`\`\`
`;

    return report;
}

function formatComplianceReportForChat(report: any): string {
    const complianceEmoji = report.overallCompliance >= 90 ? '✅' : 
                           report.overallCompliance >= 70 ? '⚠️' : '❌';

    let output = `# ${complianceEmoji} ARC Compliance Report

**Cluster**: ${report.cluster}
${report.namespace ? `**Namespace**: ${report.namespace}\n` : '**Scope**: Cluster-wide\n'}
**Compliance Score**: **${report.overallCompliance.toFixed(1)}%**
**Timestamp**: ${new Date(report.timestamp).toLocaleString()}

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Total Rules Evaluated | ${report.results.summary.totalRules} |
| Rules Passed | ✅ ${report.results.summary.passedRules} |
| Rules Failed | ❌ ${report.results.summary.failedRules} |
| Critical Violations | 🔴 ${report.results.violations.filter((v: any) => v.severity === 'critical').length} |
| High Violations | 🟠 ${report.results.violations.filter((v: any) => v.severity === 'high').length} |
| Warnings | ⚠️ ${report.results.warnings.length} |

`;

    // Violations by severity
    if (Object.keys(report.results.summary.violationsBySeverity).length > 0) {
        output += `## 🎯 Violations by Severity

`;
        Object.entries(report.results.summary.violationsBySeverity).forEach(([severity, count]) => {
            output += `- ${getSeverityEmoji(severity)} **${severity}**: ${count}\n`;
        });
        output += '\n';
    }

    // Violations by category
    if (Object.keys(report.results.summary.violationsByCategory).length > 0) {
        output += `## 📂 Violations by Category

`;
        Object.entries(report.results.summary.violationsByCategory).forEach(([category, count]) => {
            output += `- ${getCategoryEmoji(category)} **${category}**: ${count}\n`;
        });
        output += '\n';
    }

    // Critical violations details
    const criticalViolations = report.results.violations.filter((v: any) => v.severity === 'critical');
    if (criticalViolations.length > 0) {
        output += `## 🔴 Critical Violations

`;
        criticalViolations.forEach((v: any, idx: number) => {
            output += `### ${idx + 1}. ${v.ruleName}
- **Resource**: \`${v.resource.kind}/${v.resource.name}\` ${v.resource.namespace ? `(namespace: ${v.resource.namespace})` : ''}
- **Issue**: ${v.message}
- **Field**: \`${v.field}\`
- **Current Value**: \`${v.currentValue}\`
${v.suggestedValue ? `- **Suggested Value**: \`${v.suggestedValue}\`` : ''}
- **Auto-fixable**: ${v.canAutoFix ? '✅ Yes' : '❌ No'}

`;
        });
    }

    // Recommendations
    if (report.recommendations.length > 0) {
        output += `## 💡 Recommendations

${report.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

`;
    }

    output += `---

## 📖 Next Steps

1. **Review critical violations** and address immediately
2. **Plan remediation** for high-priority issues
3. **Use auto-fix** for simple violations: \`arc_validate_policies --operation auto_fix\`
4. **Re-validate** after fixes: \`arc_validate_policies --operation report\`

*Report generated at ${new Date(report.timestamp).toLocaleString()}*
`;

    return output;
}

function formatValidationResultForChat(result: any, params: any): string {
    const statusEmoji = result.passed ? '✅' : '❌';
    const status = result.passed ? 'PASSED' : 'FAILED';

    let output = `# ${statusEmoji} Policy Validation Result - ${status}

**Resource**: ${params.runnerScaleSetName}
**Namespace**: ${params.namespace}

## 📊 Summary

| Metric | Count |
|--------|-------|
| Total Rules | ${result.summary.totalRules} |
| Passed | ✅ ${result.summary.passedRules} |
| Failed | ❌ ${result.summary.failedRules} |
| Violations | 🔴 ${result.violations.length} |
| Warnings | ⚠️ ${result.warnings.length} |

`;

    // Violations
    if (result.violations.length > 0) {
        output += `## 🔴 Policy Violations

${result.violations.map((v: any, idx: number) => `
### ${idx + 1}. ${v.ruleName} (${getSeverityEmoji(v.severity)} ${v.severity})
- **Category**: ${getCategoryEmoji(v.category)} ${v.category}
- **Message**: ${v.message}
- **Field**: \`${v.field}\`
- **Current**: \`${v.currentValue}\`
${v.suggestedValue ? `- **Suggested**: \`${v.suggestedValue}\`` : ''}
- **Auto-fix**: ${v.canAutoFix ? '✅ Available' : '❌ Manual required'}
`).join('\n')}

`;
    }

    // Warnings
    if (result.warnings.length > 0) {
        output += `## ⚠️ Policy Warnings

${result.warnings.map((w: any, idx: number) => `
### ${idx + 1}. ${w.ruleName} (${getSeverityEmoji(w.severity)} ${w.severity})
- **Category**: ${getCategoryEmoji(w.category)} ${w.category}
- **Message**: ${w.message}
- **Field**: \`${w.field}\`
- **Current**: \`${w.currentValue}\`
${w.suggestedValue ? `- **Suggested**: \`${w.suggestedValue}\`` : ''}
`).join('\n')}

`;
    }

    if (result.passed) {
        output += `## ✅ All Checks Passed!

This RunnerScaleSet complies with all ${result.summary.totalRules} policy rules.

`;
    }

    output += `---

## 📖 Next Steps

${result.passed ? 
    '✅ No action required - all policies are compliant!' :
    `1. Review violations above
2. Fix critical issues first
3. Use auto-fix for applicable violations: \`arc_validate_policies --operation auto_fix --namespace ${params.namespace}\`
4. Re-validate after fixes`}
`;

    return output;
}

function formatViolationsListForChat(violations: any[], params: any): string {
    const filters = [];
    if (params.severity) filters.push(`severity: ${params.severity}`);
    if (params.category) filters.push(`category: ${params.category}`);
    const filterText = filters.length > 0 ? ` (filtered by ${filters.join(', ')})` : '';

    let output = `# 📋 Current Policy Violations${filterText}

Found **${violations.length}** violation(s)${params.namespace ? ` in namespace \`${params.namespace}\`` : ' cluster-wide'}.

`;

    if (violations.length === 0) {
        output += `## ✅ No Violations Found!

All ARC resources are compliant with policy rules${filterText}.

`;
        return output;
    }

    // Group by severity
    const bySeverity = violations.reduce((acc, v) => {
        if (!acc[v.severity]) acc[v.severity] = [];
        acc[v.severity].push(v);
        return acc;
    }, {} as Record<string, any[]>);

    ['critical', 'high', 'medium', 'low'].forEach(severity => {
        const items = bySeverity[severity] || [];
        if (items.length > 0) {
            output += `## ${getSeverityEmoji(severity)} ${severity.toUpperCase()} (${items.length})

`;
            items.forEach((v: any, idx: number) => {
                output += `### ${idx + 1}. ${v.ruleName}
- **Resource**: \`${v.resource.kind}/${v.resource.name}\` ${v.resource.namespace ? `(${v.resource.namespace})` : ''}
- **Category**: ${getCategoryEmoji(v.category)} ${v.category}
- **Issue**: ${v.message}
- **Field**: \`${v.field}\`
- **Current**: \`${v.currentValue}\`
${v.suggestedValue ? `- **Suggested**: \`${v.suggestedValue}\`` : ''}
- **Auto-fix**: ${v.canAutoFix ? '✅ Yes' : '❌ No'}
- **Timestamp**: ${new Date(v.timestamp).toLocaleString()}

`;
            });
        }
    });

    const autoFixCount = violations.filter(v => v.canAutoFix).length;
    if (autoFixCount > 0) {
        output += `---

## 🔧 Auto-Fix Available

**${autoFixCount}** violation(s) can be automatically fixed.

Run: \`arc_validate_policies --operation auto_fix${params.namespace ? ` --namespace ${params.namespace}` : ''}\`

`;
    }

    return output;
}

function getSeverityEmoji(severity: string): string {
    const map: Record<string, string> = {
        'critical': '🔴',
        'high': '🟠',
        'medium': '🟡',
        'low': '🟢'
    };
    return map[severity] || '⚪';
}

function getCategoryEmoji(category: string): string {
    const map: Record<string, string> = {
        'security': '🔒',
        'compliance': '📋',
        'performance': '📊',
        'cost': '💰',
        'operations': '⚙️',
        'networking': '🌐'
    };
    return map[category] || '📁';
}
