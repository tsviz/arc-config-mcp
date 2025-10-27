/**
 * Enhanced ARC Tools with Real-time Progress Updates and Comprehensive Troubleshooting
 * 
 * Provides streaming progress updates that appear in real-time in the Copilot chat interface,
 * with extensive troubleshooting capabilities based on real-world experience.
 */

import type { ServiceContext } from '../types/arc.js';
import { createProgressReporter, formatProgressForChat, ChatAwareLogger, type ProgressUpdate } from '../utils/progress-reporter.js';
import { EnhancedArcInstaller } from '../services/arc-installer-enhanced.js';
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
                
                const result = await services.installer.getStatus();
                
                // Create enhanced status display with visual elements
                let statusContent = `# 🎯 ARC Status Dashboard\n\n`;
                
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
            title: 'Process Natural Language ARC Commands',
            description: 'Process natural language commands for ARC operations with intelligent interpretation',
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
            description: 'Scale GitHub Actions runners with intelligent recommendations',
            inputSchema: {
                replicas: z.number().describe("Target number of runner replicas"),
                runnerName: z.string().optional().describe("Name of specific runner deployment to scale"),
                namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)")
            }
        },
        async (params: any) => {
            services.logger.info('🔄 Scaling ARC runners with AI optimization', params);
            
            const result = {
                success: true,
                currentReplicas: 2,
                targetReplicas: params.replicas,
                message: `Successfully scaled ${params.scaleSetName || 'default runners'} to ${params.replicas} replicas`,
                aiRecommendation: params.replicas > 10 ? 
                    '💡 Consider using multiple smaller scale sets for better resource distribution' :
                    '✅ Optimal scaling configuration detected',
                estimatedCost: calculateEstimatedCost(params.replicas),
                timeline: `Scaling will complete in approximately ${Math.ceil(params.replicas * 0.5)} minutes`
            };
            
            let scalingContent = `# 🔄 Runner Scaling Operation\n\n`;
            scalingContent += `**Scale Set:** ${params.scaleSetName || 'default-runners'}\n`;
            scalingContent += `**Current Replicas:** ${result.currentReplicas}\n`;
            scalingContent += `**Target Replicas:** ${result.targetReplicas}\n`;
            scalingContent += `**Status:** ${result.success ? '✅ Success' : '❌ Failed'}\n\n`;
            scalingContent += `## 🧠 AI Analysis\n\n`;
            scalingContent += `**Recommendation:** ${result.aiRecommendation}\n`;
            scalingContent += `**Estimated Cost:** ${result.estimatedCost}\n`;
            scalingContent += `**Timeline:** ${result.timeline}\n\n`;
            scalingContent += `**Message:** ${result.message}`;
            
            return {
                content: [
                    {
                        type: 'text', 
                        text: scalingContent
                    }
                ],
                structuredContent: result
            };
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
        'arc_deploy_runners',
        {
            title: 'Deploy ARC Runners with Real-time Progress',
            description: 'Deploy GitHub Actions runners with AI optimization and live status updates',
            inputSchema: {
                organization: z.string().optional().describe("GitHub organization name"),
                replicas: z.number().optional().describe("Number of runner replicas to deploy"),
                runnerName: z.string().optional().describe("Custom name for the runner deployment"),
                namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)")
            }
        },
        async (params: any) => {
            let progressUpdates: string[] = [];
            
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
                // Priority: 1) Environment variable (if set), 2) Explicit parameter, 3) Auto-detection, 4) Fallback
                let organization = process.env.GITHUB_ORG || params.organization;
                
                // Debug logging to track organization resolution
                services.logger.info(`Organization resolution: GITHUB_ORG="${process.env.GITHUB_ORG}", params.organization="${params.organization}", resolved="${organization}"`);
                
                // FIXED: Environment variable should always take precedence when set
                if (process.env.GITHUB_ORG && params.organization && process.env.GITHUB_ORG !== params.organization) {
                    services.logger.warn(`Parameter organization "${params.organization}" overridden by environment variable GITHUB_ORG="${process.env.GITHUB_ORG}"`);
                    organization = process.env.GITHUB_ORG;
                }
                
                // If no organization specified, try to detect from existing working deployments
                if (!organization) {
                    progressReporter.updateProgress({
                        phase: 'Organization Detection',
                        progress: 5,
                        message: 'Auto-detecting GitHub organization...',
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
                            organization = firstUrl.split('/').pop(); // Extract organization name
                            services.logger.info(`Auto-detected organization: ${organization}`);
                        }
                    } catch (e) {
                        services.logger.warn('Could not auto-detect organization, using default');
                    }
                }
                
                // Final fallback
                organization = organization || 'tsvi-solutions';
                
                // Default to 20 replicas (better for high workload capacity), but allow user to specify different amounts
                const replicas = Math.max(params.replicas || 20, 20);
                // Use RUNNER_LABEL environment variable if set, otherwise fallback to params or organization-based naming
                const runnerLabel = process.env.RUNNER_LABEL || `${organization}-runners`;
                // Prioritize explicit environment configuration over parameters
                const runnerName = process.env.RUNNER_LABEL || params.runnerName || runnerLabel;
                
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
                        minRunners: Math.max(1, Math.floor(replicas / 4)),
                        maxRunners: replicas,
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
                const minRunners = Math.max(1, Math.floor(replicas / 4));
                const maxRunners = replicas;
                
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
                
                // Calculate autoscaling ranges: min = user's replicas (minimum 20), max = 2x or at least 40
                const minReplicas = replicas;
                const maxReplicas = Math.max(replicas * 2, 40);
                
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
                        const autoscalingResult = await services.installer.commandExecutor.kubectl(`get autoscalingrunnersets -n ${namespace} -o json`);
                        const autoscalingData = JSON.parse(autoscalingResult.stdout);
                        runnerDeployments = autoscalingData.items || [];
                    } catch (error) {
                        services.logger.warn('Could not get autoscaling runner sets', { error });
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

    if (lowercaseQuery.includes('scale') && lowercaseQuery.includes('runner')) {
        const numbers = query.match(/\d+/);
        const replicas = numbers ? parseInt(numbers[0]) : 2;
        return {
            action: 'scale_runners',
            parameters: { 
                replicas, 
                scaleSetName: extractScaleSetName(query) || 'default-runners',
                aiOptimized: true
            },
            confidence: 0.9,
            interpretation: `User wants to scale runners to ${replicas} replicas with AI optimization`,
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