/**
 * Hybrid Model Tools
 * New deployment tools that follow GitOps best practices with config file management
 */

import { z } from 'zod';
import type { ServiceContext } from '../types/arc.js';
import { HybridDeploymentService } from '../services/hybrid-deployment.js';
import { ConfigFileManager } from '../services/config-file-manager.js';
import { GitIntegration } from '../services/git-integration.js';

export function registerHybridTools(server: any, services: ServiceContext): void {
  
  /**
   * Install ARC Controller with Hybrid Model approach
   */
  server.registerTool(
    'arc_install_controller_hybrid',
    {
      title: 'Install ARC Controller (Hybrid GitOps Model)',
      description: 'Install GitHub Actions Runner Controller with configuration versioning. Generates controller config in your repo, allows review, then installs via Helm.',
      inputSchema: {
        namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)"),
        version: z.string().optional().describe("ARC version to install (defaults to latest)"),
        mode: z.enum(['hybrid', 'gitops', 'direct']).optional().describe("Deployment mode: hybrid (generate+apply), gitops (generate only), direct (apply without saving)"),
        autoCommit: z.boolean().optional().describe("Automatically commit generated configs to Git"),
        apply: z.boolean().optional().describe("Apply configuration to cluster immediately (defaults to false - generate only)")
      }
    },
    async (params: any) => {
      const hybridService = new HybridDeploymentService(services);
      const configManager = new ConfigFileManager();
      const gitIntegration = new GitIntegration();
      
      let response = '# 🎯 ARC Controller Installation (Hybrid Model)\n\n';
      
      try {
        const namespace = params.namespace || 'arc-systems';
        const version = params.version || 'latest';
        const mode = params.mode || 'hybrid';
        
        response += `**Namespace**: ${namespace}\n`;
        response += `**Version**: ${version}\n`;
        response += `**Mode**: ${mode}\n\n`;
        
        // Step 1: Generate and save configuration
        response += '## 📝 Step 1: Configuration Generation\n\n';
        
        const result = await hybridService.deployController({
          namespace,
          version,
          ...params
        }, {
          mode,
          autoCommit: params.autoCommit || false,
          apply: params.apply
        });

        if (!result.success) {
          response += `❌ **Failed**: ${result.message}\n`;
          return {
            content: [{ type: 'text', text: response }],
            type: 'controller_deployment_error'
          };
        }

        response += `✅ Configuration generated: \`${result.configPath}\`\n\n`;

        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          response += '### ⚠️ Warnings\n\n';
          result.warnings.forEach(warning => {
            response += `- ${warning}\n`;
          });
          response += '\n';
        }

        // Step 2: Git status
        const gitStatus = await gitIntegration.getStatus();
        if (gitStatus.isRepo) {
          response += '## 📊 Step 2: Git Status\n\n';
          response += `**Branch**: ${gitStatus.branch || 'unknown'}\n`;
          const hasChanges = gitStatus.uncommittedChanges.length > 0 || gitStatus.untrackedFiles.length > 0;
          response += `**Status**: ${hasChanges ? 'Uncommitted changes' : 'Clean'}\n\n`;
          
          if (result.commitHash) {
            response += `✅ **Committed**: ${result.commitHash}\n\n`;
          }
        }

        // Step 3: Next steps or completion
        if (mode === 'gitops') {
          response += '## 📋 Step 3: Next Steps (GitOps Mode)\n\n';
          response += `1. **Review**: \`cat ${result.configPath}\`\n`;
          response += `2. **Commit**: \`git add configs/ && git commit -m "Add ARC controller config"\`\n`;
          response += `3. **Apply with ArgoCD/Flux** or manually: \`helm install...\`\n\n`;
        } else if (result.applied) {
          response += '## ✅ Step 3: Applied to Cluster\n\n';
          response += 'Controller configuration has been **applied to the cluster**.\n\n';
          response += `💡 **Tip**: Configuration is saved at \`${result.configPath}\` for version control.\n`;
        } else {
          response += '## 📋 Step 3: Configuration Generated (Not Applied)\n\n';
          response += `⚠️  **Configuration generated but NOT applied to cluster** (--apply false)\n\n`;
          response += `### To install the ARC controller:\n\n`;
          response += `**Option 1: Use the apply tool**\n`;
          response += `\`\`\`\n`;
          response += `#arc_apply_config --configType controller\n`;
          response += `\`\`\`\n\n`;
          response += `**Option 2: Install manually with Helm**\n`;
          response += `\`\`\`bash\n`;
          response += `helm install arc-controller \\\n`;
          response += `  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller \\\n`;
          response += `  --namespace ${namespace} \\\n`;
          response += `  --create-namespace`;
          if (version !== 'latest') {
            response += ` \\\n  --version ${version}`;
          }
          response += `\n\`\`\`\n\n`;
          response += `� **Configuration saved** at \`${result.configPath}\` for review and version control.\n`;
        }

        return {
          content: [{ type: 'text', text: response }],
          type: 'controller_deployment_success',
          result
        };

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        response += `\n\n❌ **Error**: ${errorMsg}\n`;
        return {
          content: [{ type: 'text', text: response }],
          type: 'controller_deployment_error'
        };
      }
    }
  );
  
  /**
   * Deploy runners with Hybrid Model approach
   */
  server.registerTool(
    'arc_deploy_runners_hybrid',
    {
      title: 'Deploy ARC Runners (Hybrid GitOps Model)',
      description: 'Deploy GitHub Actions runners with configuration versioning. Generates config files in your repo, allows review, then optionally applies to cluster.',
      inputSchema: {
        organization: z.string().optional().describe("GitHub organization name (auto-detects from GITHUB_ORG or repo context)"),
        minRunners: z.number().optional().describe("Minimum number of runners (for auto-scaling)"),
        maxRunners: z.number().optional().describe("Maximum number of runners (for auto-scaling)"),
        runnerName: z.string().optional().describe("Custom name for the runner deployment"),
        namespace: z.string().optional().describe("Kubernetes namespace (defaults to arc-systems)"),
        containerMode: z.enum(['kubernetes', 'kubernetes-novolume', 'dind']).optional().describe("Container mode: dind (Docker-in-Docker, recommended), kubernetes-novolume (ephemeral storage), or kubernetes (legacy with volumes)"),
        mode: z.enum(['hybrid', 'gitops', 'direct']).optional().describe("Deployment mode: hybrid (generate+apply), gitops (generate only), direct (apply without saving)"),
        autoCommit: z.boolean().optional().describe("Automatically commit generated configs to Git"),
        apply: z.boolean().optional().describe("Apply configuration to cluster immediately (defaults to false - generate only)")
      }
    },
    async (params: any) => {
      const hybridService = new HybridDeploymentService(services);
      const configManager = new ConfigFileManager();
      const gitIntegration = new GitIntegration();
      
      let response = '# 🚀 ARC Runner Deployment (Hybrid Model)\n\n';
      
      try {
        // Step 1: Resolve organization
        const organization = params.organization || process.env.GITHUB_ORG;
        if (!organization) {
          return {
            content: [{
              type: 'text',
              text: '❌ **Error**: Organization required. Set GITHUB_ORG environment variable or provide organization parameter.'
            }]
          };
        }

        // Log organization source for transparency
        const orgSource = params.organization 
          ? `provided via parameter (overriding GITHUB_ORG=${process.env.GITHUB_ORG || 'not set'})` 
          : `from GITHUB_ORG environment variable`;
        
        response += `**Organization**: ${organization} (${orgSource})\n`;
        response += `**Mode**: ${params.mode || 'hybrid'}\n\n`;

        // Step 2: Determine runner name with intelligent fallback strategy
        let runnerName: string;
        if (process.env.RUNNER_LABEL) {
          runnerName = process.env.RUNNER_LABEL;
          services.logger.info(`Using RUNNER_LABEL from environment: ${runnerName}`);
        } else if (params.runnerName) {
          runnerName = params.runnerName;
          services.logger.info(`Using explicit runnerName parameter: ${runnerName}`);
        } else {
          runnerName = `${organization}-runners`;
          services.logger.warn(`⚠️ RUNNER_LABEL not set in mcp.json. Using default: ${runnerName}`);
        }
        
        // Step 3: Check for existing config and merge with parameters
        const existingConfig = await configManager.getConfigMetadata('runnerSet', runnerName);
        
        let minRunners = params.minRunners;
        let maxRunners = params.maxRunners;
        
        // If parameters not provided, try to read from existing config file
        if (existingConfig.exists && existingConfig.content) {
          if (minRunners === undefined && existingConfig.content.values?.minRunners !== undefined) {
            minRunners = existingConfig.content.values.minRunners;
            response += `ℹ️ Using minRunners from existing config: ${minRunners}\n`;
          }
          if (maxRunners === undefined && existingConfig.content.values?.maxRunners !== undefined) {
            maxRunners = existingConfig.content.values.maxRunners;
            response += `ℹ️ Using maxRunners from existing config: ${maxRunners}\n`;
          }
        }
        
        // Apply defaults only if still not set
        minRunners = minRunners ?? 5;
        maxRunners = maxRunners ?? 20;
        
        // Validate parameters
        if (minRunners > maxRunners) {
          return {
            content: [{
              type: 'text',
              text: `❌ **Error**: minRunners (${minRunners}) cannot be greater than maxRunners (${maxRunners})`
            }]
          };
        }

        response += `**Scaling**: ${minRunners} - ${maxRunners} runners\n\n`;

        // Step 3: Generate and save configuration
        response += '## 📝 Step 1: Configuration Generation\n\n';
        
        const deploymentParams = {
          organization,
          minRunners,
          maxRunners,
          runnerName: params.runnerName || runnerName,
          namespace: params.namespace
        };

        const result = await hybridService.deployRunnerSet(deploymentParams, {
          mode: params.mode || 'hybrid',
          autoCommit: params.autoCommit || false,
          apply: params.apply
        });

        if (!result.success) {
          response += `❌ **Failed**: ${result.message}\n`;
          return {
            content: [{ type: 'text', text: response }]
          };
        }

        response += `✅ Configuration generated: \`${result.configPath}\`\n\n`;

        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          response += '### ⚠️ Warnings\n\n';
          result.warnings.forEach(warning => {
            response += `- ${warning}\n`;
          });
          response += '\n';
        }

        // Step 4: Show Git status
        const gitStatus = await gitIntegration.getStatus();
        if (gitStatus.isRepo) {
          response += '## 📊 Step 2: Git Status\n\n';
          response += `**Branch**: ${gitStatus.branch}\n`;
          
          if (result.commitHash) {
            response += `**Committed**: ${result.commitHash}\n\n`;
          } else if (gitStatus.untrackedFiles.length > 0 || gitStatus.uncommittedChanges.length > 0) {
            response += `**Status**: Changes not yet committed\n\n`;
            response += '### 📝 Next Steps:\n\n';
            response += '1. Review the generated configuration file\n';
            response += '2. Commit changes:\n';
            response += '   ```bash\n';
            response += `   git add ${result.configPath}\n`;
            response += `   git commit -m "chore(arc): Deploy ${minRunners}-${maxRunners} runners for ${organization}"\n`;
            response += '   ```\n\n';
          }
        }
        // Note: We assume hybrid/gitops workflows are used in Git-controlled projects
        // No warning needed about Git repository status

        // Step 5: Apply or show apply command
        if (params.apply !== false && (params.mode === 'hybrid' || params.mode === 'direct' || !params.mode)) {
          response += '## 🚀 Step 3: Application to Cluster\n\n';
          
          if (result.applied) {
            response += '✅ **Configuration ready for application**\n\n';
            response += '### To apply this configuration:\n\n';
            response += '```bash\n';
            response += `kubectl apply -f ${result.configPath}\n`;
            response += '```\n\n';
            response += 'Or use the `arc_apply_config` tool to apply from the config file.\n\n';
          }
        } else {
          response += '## 📋 GitOps Mode\n\n';
          response += 'Configuration generated but not applied. Apply manually:\n\n';
          response += '```bash\n';
          response += `kubectl apply -f ${result.configPath}\n`;
          response += '```\n\n';
        }

        // Step 6: Summary
        response += '## ✅ Summary\n\n';
        response += `- **Config File**: \`${result.configPath}\`\n`;
        response += `- **Organization**: ${organization}\n`;
        response += `- **Runners**: ${minRunners} - ${maxRunners}\n`;
        response += `- **Git Status**: ${result.commitHash ? `Committed (${result.commitHash})` : 'Uncommitted'}\n`;
        response += `- **Applied**: ${result.applied ? '✅ Yes' : '❌ No (manual apply required)'}\n\n`;

        response += '### 💡 Benefits of Hybrid Model:\n\n';
        response += '- ✅ Version control for all infrastructure changes\n';
        response += '- ✅ Audit trail via Git history\n';
        response += '- ✅ Review configurations before applying\n';
        response += '- ✅ Rollback capability via Git\n';
        response += '- ✅ Team collaboration via PRs\n\n';

        return {
          content: [{ type: 'text', text: response }],
          structuredContent: {
            type: 'hybrid_deployment_success',
            result
          }
        };

      } catch (error) {
        response += `\n❌ **Error**: ${error instanceof Error ? error.message : String(error)}\n`;
        return {
          content: [{ type: 'text', text: response }]
        };
      }
    }
  );

  /**
   * Apply configuration from repo
   */
  server.registerTool(
    'arc_apply_config',
    {
      title: 'Apply ARC Config from Repository',
      description: 'Apply ARC configuration from generated config files in your repository to the Kubernetes cluster.',
      inputSchema: {
        configType: z.enum(['controller', 'runnerSet']).describe("Type of configuration to apply"),
        name: z.string().optional().describe("Name of the runner set (required for runnerSet type)")
      }
    },
    async (params: any) => {
      const configManager = new ConfigFileManager();
      
      let response = '# 🚀 Applying ARC Configuration\n\n';
      
      try {
        // Read config from file
        const configPath = await configManager.getConfigPath(
          params.configType === 'controller' ? 'controller' : 'runnerSet',
          params.name
        );

        response += `**Config File**: \`${configPath}\`\n\n`;

        // Read and parse the config file
        const config = await configManager.readConfig(
          params.configType === 'controller' ? 'controller' : 'runnerSet',
          params.name
        );

        // Check if this is a Helm chart config
        const isHelmConfig = config.chart && config.release;

        if (isHelmConfig) {
          // Apply using Helm
          response += '## 📋 Applying with Helm...\n\n';
          
          const releaseName = config.release.name;
          const namespace = config.release.namespace;
          const chartRepo = config.chart.repository;
          const chartVersion = config.chart.version;
          
          // Build Helm install/upgrade command
          let helmArgs = [
            'upgrade',
            releaseName,
            chartRepo,
            '--install', // Install if not exists, upgrade if exists
            '--namespace', namespace
          ];

          if (config.release.createNamespace) {
            helmArgs.push('--create-namespace');
          }

          if (chartVersion && chartVersion !== 'latest') {
            helmArgs.push('--version', chartVersion);
          }

          // Add values from config
          if (config.values) {
            // For controller, values might be empty
            // For runner sets, we need to pass GitHub token and other values
            const valuesToSet: string[] = [];
            
            // Special handling for GitHub token
            if (config.values.githubConfigSecret) {
              const githubToken = process.env.GITHUB_TOKEN;
              if (!githubToken) {
                response += '❌ **Error**: GITHUB_TOKEN environment variable not set\n\n';
                response += 'Runner sets require a GitHub token for authentication.\n';
                response += 'Set GITHUB_TOKEN environment variable and try again.\n';
                return {
                  content: [{ type: 'text', text: response }]
                };
              }
              valuesToSet.push(`githubConfigSecret.github_token=${githubToken}`);
            }

            // Add other values
            const flattenValues = (obj: any, prefix = ''): void => {
              for (const [key, value] of Object.entries(obj)) {
                if (key === 'githubConfigSecret') continue; // Already handled
                
                const fullKey = prefix ? `${prefix}.${key}` : key;
                
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                  flattenValues(value, fullKey);
                } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                  valuesToSet.push(`${fullKey}=${value}`);
                }
              }
            };

            flattenValues(config.values);

            // Add --set arguments
            valuesToSet.forEach(setValue => {
              helmArgs.push('--set', setValue);
            });
          }

          // Ensure all helmArgs are strings and filter out any undefined/null values
          const sanitizedHelmArgs = helmArgs.filter(arg => arg != null).map(arg => String(arg));
          const helmCommand = `helm ${sanitizedHelmArgs.join(' ')}`;
          
          response += '**Command**:\n```bash\n';
          // Safely replace token if it exists
          const safeCommand = typeof helmCommand === 'string' 
            ? helmCommand.replace(process.env.GITHUB_TOKEN || '', '***')
            : String(helmCommand);
          response += safeCommand;
          response += '\n```\n\n';

          // Execute Helm command with sanitized args (join array to string)
          const result = await services.installer.commandExecutor.execute(
            'helm',
            sanitizedHelmArgs.join(' ')
          );

          if (result.exitCode === 0) {
            response += '✅ **Successfully applied!**\n\n';
            response += '```\n';
            response += result.stdout;
            response += '\n```\n\n';

            // For controller, ensure proper RBAC permissions
            if (params.configType === 'controller') {
              response += '## 🔐 Configuring RBAC Permissions\n\n';
              try {
                const hybridService = new HybridDeploymentService(services);
                await (hybridService as any).ensureControllerRBAC(namespace);
                response += '✅ Controller RBAC permissions configured successfully\n\n';
              } catch (rbacError: any) {
                response += `⚠️ RBAC setup warning: ${rbacError.message}\n\n`;
              }
            }

            // Get status of the applied resource
            if (params.configType === 'controller') {
              response += '## 📊 Controller Status\n\n';
              const statusResult = await services.installer.commandExecutor.kubectl(
                `get deployment -n ${namespace} -l app.kubernetes.io/name=gha-runner-scale-set-controller`
              );
              response += '```\n';
              response += statusResult.stdout;
              response += '\n```\n\n';
            } else if (params.configType === 'runnerSet') {
              response += '## 📊 Runner Set Status\n\n';
              const statusResult = await services.installer.commandExecutor.kubectl(
                `get pods -n ${namespace} -l app.kubernetes.io/name=gha-runner-scale-set`
              );
              response += '```\n';
              response += statusResult.stdout;
              response += '\n```\n\n';
            }
          } else {
            response += '❌ **Error**: Helm command failed\n\n';
            response += '```\n';
            response += result.stderr || result.stdout;
            response += '\n```\n\n';
            
            // Check for common errors
            if (result.stderr.includes('not found') || result.stderr.includes('no matches for kind')) {
              response += '### � Possible Solutions:\n\n';
              if (params.configType === 'runnerSet') {
                response += '1. Ensure the ARC controller is installed first:\n';
                response += '   ```\n';
                response += '   #arc_apply_config --configType controller\n';
                response += '   ```\n\n';
              }
              response += '2. Check that Helm is installed: `helm version`\n';
              response += '3. Verify your kubeconfig: `kubectl cluster-info`\n';
            }
          }
        } else {
          // Fallback: Apply using kubectl (for backwards compatibility)
          response += '## 📋 Applying with kubectl...\n\n';
          
          const result = await services.installer.commandExecutor.kubectl(
            `apply -f ${configPath}`
          );

          if (result.exitCode === 0) {
            response += '✅ **Successfully applied!**\n\n';
            response += '```\n';
            response += result.stdout;
            response += '\n```\n\n';

            // Get status of the applied resource
            if (params.configType === 'runnerSet') {
              response += '## 📊 Runner Set Status\n\n';
              const statusResult = await services.installer.commandExecutor.kubectl(
                `get autoscalingrunnersets ${params.name} -n arc-systems -o wide`
              );
              response += '```\n';
              response += statusResult.stdout;
              response += '\n```\n\n';
            }
          } else {
            // Check if error is due to missing CRDs (controller not installed)
            const isMissingCRD = result.stderr.includes('no matches for kind') || 
                                 result.stderr.includes('ensure CRDs are installed');
            
            if (isMissingCRD && params.configType === 'runnerSet') {
              response += '❌ **Error**: ARC Controller not installed yet\n\n';
              response += 'Runner deployments require the ARC Controller to be installed first.\n\n';
              response += '### 🔧 Solution:\n\n';
              response += '**Step 1:** Install the controller:\n';
              response += '```\n';
              response += '#arc_apply_config --configType controller\n';
              response += '```\n\n';
              response += '**Step 2:** Then apply the runner configuration:\n';
              response += '```\n';
              response += `#arc_apply_config --configType runnerSet --name ${params.name}\n`;
              response += '```\n\n';
              response += '### 📋 Technical Details:\n';
              response += '```\n';
              response += result.stderr;
              response += '\n```\n\n';
            } else {
              response += '❌ **Error**: Command failed\n\n';
              response += '```\n';
              response += result.stderr;
              response += '\n```\n\n';
            }
          }
        }

        return {
          content: [{ type: 'text', text: response }]
        };

      } catch (error) {
        response += `\n❌ **Error**: ${error instanceof Error ? error.message : String(error)}\n`;
        return {
          content: [{ type: 'text', text: response }]
        };
      }
    }
  );

  /**
   * List all configurations
   */
  server.registerTool(
    'arc_list_configs',
    {
      title: 'List ARC Configurations',
      description: 'List all ARC configurations stored in your repository.',
      inputSchema: {}
    },
    async () => {
      const hybridService = new HybridDeploymentService(services);
      
      let response = '# 📋 ARC Configurations\n\n';
      
      try {
        const configs = await hybridService.listConfigs();

        // Controller config
        if (configs.controller) {
          response += '## 🎛️ Controller\n\n';
          response += `**Path**: \`${configs.controller.path}\`\n`;
          response += `**Last Modified**: ${configs.controller.lastModified}\n\n`;
        } else {
          response += '## 🎛️ Controller\n\n';
          response += '_No controller configuration found_\n\n';
        }

        // Runner sets
        response += '## 🏃‍♂️ Runner Sets\n\n';
        if (configs.runnerSets.length > 0) {
          configs.runnerSets.forEach(rs => {
            const name = rs.config?.metadata?.name || 'unknown';
            const min = rs.config?.spec?.minRunners || 0;
            const max = rs.config?.spec?.maxRunners || 0;
            const org = rs.config?.spec?.githubConfigUrl?.split('/').pop() || 'unknown';
            
            response += `### ${name}\n\n`;
            response += `- **Organization**: ${org}\n`;
            response += `- **Scaling**: ${min} - ${max} runners\n`;
            response += `- **Path**: \`${rs.path}\`\n`;
            response += `- **Last Modified**: ${rs.lastModified}\n\n`;
          });
        } else {
          response += '_No runner set configurations found_\n\n';
        }

        response += '---\n\n';
        response += '💡 **Tip**: Use `arc_deploy_runners_hybrid` to create new configurations\n';

        return {
          content: [{ type: 'text', text: response }],
          structuredContent: { configs }
        };

      } catch (error) {
        response += `\n❌ **Error**: ${error instanceof Error ? error.message : String(error)}\n`;
        return {
          content: [{ type: 'text', text: response }]
        };
      }
    }
  );

  /**
   * Detect drift between repo and cluster
   */
  server.registerTool(
    'arc_detect_drift',
    {
      title: 'Detect Configuration Drift',
      description: 'Compare configurations in your repository with what is actually deployed in the cluster. By default, automatically fixes drift by recreating missing config files.',
      inputSchema: {
        runnerName: z.string().optional().describe("Name of specific runner set to check (checks all if not provided)"),
        autoFix: z.boolean().optional().default(true).describe("Automatically fix drift by recreating missing config files (default: true)")
      }
    },
    async (params: any) => {
      const hybridService = new HybridDeploymentService(services);
      const autoFix = params.autoFix !== false; // Default to true
      
      let response = '# 🔍 Configuration Drift Detection\n\n';
      
      try {
        const driftResult = await hybridService.detectDrift(params.runnerName);

        if (!driftResult.hasDrift) {
          response += '✅ **No drift detected!**\n\n';
          response += 'Your repository configurations match what is deployed in the cluster.\n\n';
        } else {
          response += '⚠️ **Drift Detected!**\n\n';
          response += 'The following differences were found between your repository and the cluster:\n\n';
          
          driftResult.details.forEach(detail => {
            response += `- ${detail}\n`;
          });
          
          // Auto-fix drift if enabled
          if (autoFix) {
            response += '\n### 🔧 Auto-Fixing Drift...\n\n';
            const fixResult = await hybridService.fixDrift(driftResult.details);
            
            if (fixResult.fixed.length > 0) {
              response += '✅ **Successfully fixed:**\n\n';
              fixResult.fixed.forEach(fix => {
                response += `- ${fix}\n`;
              });
              response += '\n';
            }
            
            if (fixResult.failed.length > 0) {
              response += '❌ **Failed to fix:**\n\n';
              fixResult.failed.forEach(failure => {
                response += `- ${failure}\n`;
              });
              response += '\n';
            }
          } else {
            response += '\n### 🔧 Recommended Actions:\n\n';
            response += '1. Review the differences above\n';
            response += '2. Update your repository configs if cluster is correct\n';
            response += '3. Or apply your repository configs if they are correct:\n';
            response += '   ```bash\n';
            response += '   # Apply all configs\n';
            response += '   kubectl apply -f configs/runner-sets/\n';
            response += '   ```\n\n';
          }
        }

        return {
          content: [{ type: 'text', text: response }],
          structuredContent: { drift: driftResult }
        };

      } catch (error) {
        response += `\n❌ **Error**: ${error instanceof Error ? error.message : String(error)}\n`;
        return {
          content: [{ type: 'text', text: response }]
        };
      }
    }
  );
}
