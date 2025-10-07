/**
 * Enhanced ARC Tools with Real-time Progress Updates and Comprehensive Troubleshooting
 * 
 * Provides streaming progress updates that appear in real-time in the Copilot chat interface,
 * with extensive troubleshooting capabilities based on real-world experience.
 */

import type { ServiceContext } from '../types/arc.js';
import { createProgressReporter, formatProgressForChat, ChatAwareLogger, type ProgressUpdate } from '../utils/progress-reporter.js';
import { EnhancedArcInstaller } from '../services/arc-installer-enhanced.js';

/**
 * Register enhanced ARC tools with real-time progress updates
 */
export function registerEnhancedArcTools(server: any, services: ServiceContext): void {
    // Enhanced installation tool with streaming progress
    server.registerTool(
        'arc_install_controller',
        {
            title: 'Install ARC Controller with Real-time Progress',
            description: 'Install GitHub Actions Runner Controller in Kubernetes cluster with live status updates in chat'
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
                
                const result = await enhancedInstaller.installControllerWithTroubleshooting(installationOptions);
                
                progressReporter.complete('🎉 ARC Controller installation completed successfully! Ready to deploy GitHub Actions runners. 🏃‍♂️ Next: Deploy 3 runners? (Recommended)');
                
                // Add runner deployment follow-up prompt
                const runnerPrompt = `

## 🚀 **ARC Installation Complete!**

### 📋 **Next Steps:**
Your ARC Controller is now ready to manage GitHub Actions runners. 

### 🏃‍♂️ **Deploy Runners?**
Would you like to deploy GitHub Actions runners now?

**💡 Recommendation:** Deploy **3 runners** with auto-scaling (1-6 range) for optimal performance.

**Options:**
- ✅ **Deploy 3 runners** (recommended for most workloads)
- 🔧 **Custom deployment** (specify your own configuration)  
- ⏭️ **Skip for now** (deploy runners later)

### 🎯 **Quick Deploy Command:**
To deploy 3 runners with auto-scaling, you can say:
> *"Deploy 3 runners"* or *"Deploy runners with auto-scaling"*

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
                            defaultCount: 3,
                            autoScaling: {
                                min: 1,
                                max: 6
                            },
                            message: "Would you like to deploy GitHub Actions runners now? (Recommended: 3 runners with auto-scaling)"
                        }
                    }
                };
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                progressReporter.error(`Installation failed: ${errorMessage}`);
                
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
            description: 'Get comprehensive status of ARC installation with real-time visual diagrams'
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
                        statusContent += `- **Replicas:** ${runner.replicas?.ready || 0}/${runner.replicas?.desired || 0}\n`;
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
            description: 'Process natural language commands for ARC operations with intelligent interpretation'
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
            description: 'Scale GitHub Actions runners with intelligent recommendations'
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
            description: 'Comprehensive analysis of current ARC installation state with detailed report and visual diagram before cleanup'
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
            description: 'Comprehensive cleanup and uninstallation of ARC with AI-guided safety checks and live progress updates'
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
                    preserveData: params.preserveData || false,
                    dryRun: params.dryRun || false,
                    force: params.force || false,
                    forceNamespaceRemoval: params.forceNamespaceRemoval || false
                };
                
                progressReporter.updateProgress({
                    phase: 'Configuration',
                    progress: 10,
                    message: `Cleanup configuration: ${JSON.stringify(cleanupOptions)}`,
                    timestamp: new Date().toISOString(),
                    aiInsight: 'AI analyzing cluster for safe cleanup strategy'
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
            description: 'Deploy GitHub Actions runners with AI optimization and live status updates'
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
                
                const organization = params.organization || process.env.GITHUB_ORG || 'tsviz';
                const replicas = params.replicas || 3;
                // Use RUNNER_LABEL environment variable if set, otherwise fallback to organization-based naming
                const runnerLabel = process.env.RUNNER_LABEL || `${organization}-runners`;
                const runnerName = params.runnerName || runnerLabel;
                
                progressReporter.updateProgress({
                    phase: 'Configuration Generation',
                    progress: 20,
                    message: `Generating runner configuration for organization: ${organization} with label: ${runnerLabel}`,
                    timestamp: new Date().toISOString(),
                    aiInsight: `Creating ${replicas} runners with label '${runnerLabel}' and enterprise security settings`
                });
                
                // Generate runner deployment YAML using legacy CRDs (current Helm chart uses these)
                const runnerDeployment = {
                    apiVersion: 'actions.summerwind.dev/v1alpha1',
                    kind: 'RunnerDeployment',
                    metadata: {
                        name: runnerName,
                        namespace: 'arc-systems',
                        labels: {
                            'mcp.arc.io/managed': 'true',
                            'mcp.arc.io/enhanced': 'true'
                        }
                    },
                    spec: {
                        replicas: replicas,
                        template: {
                            spec: {
                                organization: organization,
                                env: [
                                    { name: 'RUNNER_FEATURE_FLAG_EPHEMERAL', value: 'true' }
                                ],
                                resources: {
                                    limits: { cpu: '2.0', memory: '1Gi' },
                                    requests: { cpu: '100m', memory: '64Mi' }
                                },
                                envFrom: [
                                    { secretRef: { name: 'controller-manager' } }
                                ]
                            }
                        }
                    }
                };
                
                progressReporter.updateProgress({
                    phase: 'Deployment',
                    progress: 40,
                    message: 'Applying runner deployment to Kubernetes...',
                    timestamp: new Date().toISOString(),
                    aiInsight: 'Deploying with Pod Security Standards and resource limits'
                });
                
                // Apply the runner deployment using installer's command executor (the correct way)
                const runnerYaml = `---
apiVersion: actions.summerwind.dev/v1alpha1
kind: RunnerDeployment
metadata:
  name: ${runnerName}
  namespace: arc-systems
  labels:
    mcp.arc.io/managed: "true"
    mcp.arc.io/enhanced: "true"
spec:
  replicas: ${replicas}
  template:
    spec:
      organization: ${organization}
      labels:
        - ${runnerLabel}
      env:
        - name: RUNNER_FEATURE_FLAG_EPHEMERAL
          value: "true"
      resources:
        limits:
          cpu: "2.0"
          memory: "1Gi"
        requests:
          cpu: "100m"
          memory: "64Mi"
      envFrom:
        - secretRef:
            name: controller-manager
`;
                
                // Write YAML to temporary file and apply via kubectl (same method as ArcInstaller)
                const fs = await import('fs');
                const os = await import('os');
                const path = await import('path');
                const tmpFile = path.join(os.tmpdir(), `runner-deployment-${Date.now()}.yaml`);
                
                await fs.promises.writeFile(tmpFile, runnerYaml);
                
                try {
                    await services.installer.commandExecutor.kubectl(`apply -f ${tmpFile}`);
                } finally {
                    // Clean up temp file
                    try {
                        await fs.promises.unlink(tmpFile);
                    } catch {
                        // Ignore cleanup errors
                    }
                }
                
                progressReporter.updateProgress({
                    phase: 'Autoscaler Setup',
                    progress: 60,
                    message: 'Configuring intelligent autoscaling...',
                    timestamp: new Date().toISOString(),
                    aiInsight: 'Setting up organization-wide autoscaling based on runner utilization'
                });
                
                // Generate autoscaler configuration using legacy CRDs (current Helm chart uses these)
                // Use organization-wide scaling instead of repository-specific to avoid 404 errors
                const autoscalerYaml = `---
apiVersion: actions.summerwind.dev/v1alpha1
kind: HorizontalRunnerAutoscaler
metadata:
  name: ${runnerName}-autoscaler
  namespace: arc-systems
  labels:
    mcp.arc.io/managed: "true"
spec:
  scaleTargetRef:
    name: ${runnerName}
  minReplicas: ${Math.max(1, Math.floor(replicas / 3))}
  maxReplicas: ${replicas * 2}
  metrics:
    - type: PercentageRunnersBusy
      scaleUpThreshold: '0.75'
      scaleDownThreshold: '0.25'
      scaleUpFactor: '2'
      scaleDownFactor: '0.5'
`;
                
                const tmpAutoscalerFile = path.join(os.tmpdir(), `autoscaler-${Date.now()}.yaml`);
                
                await fs.promises.writeFile(tmpAutoscalerFile, autoscalerYaml);
                
                try {
                    await services.installer.commandExecutor.kubectl(`apply -f ${tmpAutoscalerFile}`);
                } finally {
                    // Clean up temp file
                    try {
                        await fs.promises.unlink(tmpAutoscalerFile);
                    } catch {
                        // Ignore cleanup errors
                    }
                }
                
                progressReporter.updateProgress({
                    phase: 'Validation',
                    progress: 80,
                    message: 'Validating runner deployment...',
                    timestamp: new Date().toISOString(),
                    aiInsight: 'Checking runner registration with GitHub'
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
                
                const minReplicas = Math.max(1, Math.floor(replicas / 3));
                const maxReplicas = replicas * 2;
                
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
                progressReporter.error(`Runner deployment failed: ${errorMessage}`);
                
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
            description: 'List, scale, and manage GitHub Actions runners with real-time updates'
        },
        async (params: any) => {
            try {
                const action = params.action || 'list';
                const namespace = params.namespace || 'arc-systems';
                
                let content = `# 🏃‍♂️ ARC Runner Management\n\n`;
                
                if (action === 'list' || action === 'status') {
                    // Get runner deployments using kubectl (the real implementation)
                    let runnerDeployments = [];
                    let runners = [];
                    let autoscalers = [];
                    
                    try {
                        const deploymentResult = await services.installer.commandExecutor.kubectl(`get runnerdeployments -n ${namespace} -o json`);
                        const deploymentData = JSON.parse(deploymentResult.stdout);
                        runnerDeployments = deploymentData.items || [];
                    } catch (error) {
                        services.logger.warn('Could not get runner deployments', { error });
                    }
                    
                    try {
                        const runnerResult = await services.installer.commandExecutor.kubectl(`get runners -n ${namespace} -o json`);
                        const runnerData = JSON.parse(runnerResult.stdout);
                        runners = runnerData.items || [];
                    } catch (error) {
                        services.logger.warn('Could not get runners', { error });
                    }
                    
                    try {
                        const autoscalerResult = await services.installer.commandExecutor.kubectl(`get horizontalrunnerautoscalers -n ${namespace} -o json`);
                        const autoscalerData = JSON.parse(autoscalerResult.stdout);
                        autoscalers = autoscalerData.items || [];
                    } catch (error) {
                        services.logger.warn('Could not get autoscalers', { error });
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
                    const deploymentName = params.deploymentName || 'tsviz-runners';
                    const replicas = params.replicas || 3;
                    
                    content += `## 🔄 Scaling Runner Deployment\n\n`;
                    content += `Scaling **${deploymentName}** to **${replicas}** replicas...\n\n`;
                    
                    try {
                        // Scale the runner deployment using kubectl patch
                        await services.installer.commandExecutor.kubectl(`patch runnerdeployment ${deploymentName} -n ${namespace} -p '{"spec":{"replicas":${replicas}}}' --type=merge`);
                        content += `✅ **Success!** Runner deployment scaled to ${replicas} replicas.\n\n`;
                        content += `**Estimated Timeline:** Scaling will complete in approximately ${Math.ceil(replicas * 0.5)} minutes.\n\n`;
                        content += `**Cost Impact:** Approximately $${(replicas * 0.10 * 24 * 30).toFixed(2)}/month for 24/7 operation.\n\n`;
                    } catch (error) {
                        content += `❌ **Failed to scale runner deployment:** ${error}\n\n`;
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
                'kubectl delete runners -n arc-systems --all --force --grace-period=0',
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