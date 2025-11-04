/**
 * Hybrid Deployment Service
 * 
 * This service wraps deployment operations with configuration file management and Git integration,
 * implementing a GitOps-friendly approach to ARC deployments.
 * 
 * =============================================================================
 * WORKFLOW OVERVIEW
 * =============================================================================
 * 
 * 1. GENERATE: Create a config file (controller.yaml or runner-set-{name}.yaml)
 *    - Contains: chart info, release details, Helm values, metadata
 *    - Location: configs/ directory (version controlled)
 *    - Purpose: Declarative configuration that can be reviewed, edited, and versioned
 * 
 * 2. REVIEW/EDIT (Optional):
 *    - Users can edit the generated YAML to add custom Helm values
 *    - Example: Add resource limits, node selectors, tolerations, etc.
 *    - All values in the `values:` section become --set arguments
 * 
 * 3. APPLY: Use arc_apply_config tool
 *    - Reads the config file
 *    - Extracts chart, release, and values information
 *    - Builds dynamic Helm command with all --set flags
 *    - Executes helm upgrade --install
 * 
 * =============================================================================
 * CONFIG FILE STRUCTURE
 * =============================================================================
 * 
 * chart:          # Where to get the Helm chart
 *   repository:   # OCI registry URL
 *   name:         # Chart name
 *   version:      # Chart version or 'latest'
 * 
 * release:        # How to install it
 *   name:         # Helm release name
 *   namespace:    # K8s namespace
 *   createNamespace: boolean
 * 
 * values:         # Custom Helm values (gets flattened to --set arguments)
 *   key1: value1  # Becomes: --set key1=value1
 *   nested:
 *     key2: value2  # Becomes: --set nested.key2=value2
 * 
 * metadata:       # Tracking information (not used by Helm)
 *   managedBy:    # Tool identifier
 *   mode:         # Deployment mode
 *   generatedAt:  # Timestamp
 * 
 * =============================================================================
 * BENEFITS
 * =============================================================================
 * 
 * - Version control: Config changes tracked in Git
 * - Audit trail: Git history shows who changed what and when
 * - Review process: PRs for infrastructure changes
 * - Rollback: Git revert to previous configuration
 * - Team collaboration: Multiple people can propose changes
 * - Drift detection: Compare repo config vs. cluster state
 */

import { ConfigFileManager } from './config-file-manager.js';
import { GitIntegration } from './git-integration.js';
import type { ServiceContext } from '../types/arc.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface HybridDeploymentOptions {
  mode?: 'hybrid' | 'gitops' | 'direct';
  autoCommit?: boolean;
  apply?: boolean;
  applyConfirmation?: boolean;
  commitMessage?: string;
}

export interface DeploymentResult {
  success: boolean;
  configPath?: string;
  applied?: boolean;
  commitHash?: string;
  message: string;
  warnings?: string[];
}

export class HybridDeploymentService {
  private configManager: ConfigFileManager;
  private gitIntegration: GitIntegration;
  private services: ServiceContext;

  constructor(services: ServiceContext, workspaceRoot?: string) {
    this.services = services;
    this.configManager = new ConfigFileManager(workspaceRoot);
    this.gitIntegration = new GitIntegration(workspaceRoot);
  }

  /**
   * Deploy ARC Controller with Hybrid Model
   * 
   * This method generates a controller configuration file and optionally applies it to the cluster.
   * 
   * WHAT IT DOES:
   * 1. Creates a YAML config file with chart info, release details, and Helm values
   * 2. Optionally commits the file to Git (if autoCommit=true)
   * 3. Optionally applies the config to the cluster (based on mode and apply flag)
   * 
   * MODES:
   * - 'hybrid' (default): Generate config, apply only if apply=true (apply=false by default)
   * - 'gitops': Generate config only, never applies (for ArgoCD/Flux workflows)
   * - 'direct': Apply directly without saving config (always applies, ignores apply flag)
   * 
   * CONFIG FILE LOCATION: configs/controller.yaml
   * 
   * EXAMPLE CONFIG GENERATED:
   * ```yaml
   * chart:
   *   repository: oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller
   *   name: gha-runner-scale-set-controller
   *   version: latest
   * release:
   *   name: arc-controller
   *   namespace: arc-systems
   *   createNamespace: true
   * values: {}  # Users can add custom Helm values here
   * metadata:
   *   managedBy: arc-config-mcp
   *   mode: hybrid
   *   generatedAt: 2025-10-31T19:27:10.002Z
   * ```
   * 
   * HOW TO APPLY THE CONFIG:
   * Use #arc_apply_config --configType controller
   * This reads the config file and executes:
   *   helm upgrade arc-controller <chart-url> --install --namespace <ns> --create-namespace
   *   # Plus any --set flags from the values: section
   * 
   * @param params - Installation parameters (namespace, version, custom values)
   * @param options - Deployment options (mode, autoCommit, apply)
   * @returns DeploymentResult with success status, config path, and warnings
   */
  async deployController(params: any, options: HybridDeploymentOptions = {}): Promise<DeploymentResult> {
    const mode = options.mode || 'hybrid';
    const warnings: string[] = [];

    try {
      // Step 1: Generate controller configuration
      this.services.logger.info('📝 Generating controller configuration...');
      
      const namespace = params.namespace || 'arc-systems';
      const version = params.version || 'latest';
      
      const controllerConfig = {
        // ARC Controller Helm Configuration
        chart: {
          repository: 'oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller',
          name: 'gha-runner-scale-set-controller',
          version: version
        },
        release: {
          name: 'arc-controller',
          namespace: namespace,
          createNamespace: true
        },
        values: {
          // Add any custom Helm values here
          // See: https://github.com/actions/actions-runner-controller/tree/master/charts/gha-runner-scale-set-controller
          ...(params.values || {})
        },
        metadata: {
          managedBy: 'arc-config-mcp',
          mode: mode,
          generatedAt: new Date().toISOString()
        }
      };

      // Step 2: Check for existing config
      const existingConfig = await this.configManager.getConfigMetadata('controller');
      if (existingConfig.exists) {
        this.services.logger.info('⚠️ Controller config already exists, will update');
        warnings.push('Existing controller configuration will be updated');
      }

      // Step 3: Write config to filesystem
      const configPath = await this.configManager.writeConfig('controller', controllerConfig);
      this.services.logger.info(`✅ Controller config written to: ${configPath}`);

      // Step 4: Handle Git operations based on mode
      let commitHash: string | undefined;
      if (mode !== 'direct') {
        const relativePath = await this.configManager.getRelativePath('controller');
        
        if (options.autoCommit) {
          const gitStatus = await this.gitIntegration.getStatus();
          
          if (gitStatus.isRepo) {
            const commitMessage = options.commitMessage || 
              this.gitIntegration.generateCommitMessage(
                'chore(arc): ${action} - ${description}',
                'controller deployment',
                `Deploy ARC controller v${version}`
              );
            
            const commitResult = await this.gitIntegration.commit(commitMessage, [relativePath]);
            
            if (commitResult.success) {
              this.services.logger.info(`✅ Config committed: ${commitResult.commitHash}`);
              commitHash = commitResult.commitHash;
            }
          }
        } else {
          warnings.push(`Config file created at ${relativePath}. Commit when ready: git add ${relativePath} && git commit -m "chore(arc): Add controller config"`);
        }
      }

      // Step 5: Apply to cluster if requested
      const shouldApply = mode === 'direct' 
        ? true 
        : (options.apply === true);
      
      if (shouldApply) {
        this.services.logger.info('🚀 Applying controller configuration to cluster...');
        
        try {
          // Apply using Helm
          const applyResult = await this.applyConfigToCluster(controllerConfig, 'controller');
          
          if (!applyResult.success) {
            return {
              success: false,
              configPath,
              applied: false,
              commitHash,
              message: `Config generated successfully but failed to apply: ${applyResult.stderr}`,
              warnings
            };
          }
          
          this.services.logger.info('✅ Controller applied successfully');
          
          // Step 6: Ensure proper RBAC permissions for controller
          this.services.logger.info('🔐 Ensuring controller has proper RBAC permissions...');
          try {
            await this.ensureControllerRBAC(namespace);
            this.services.logger.info('✅ Controller RBAC permissions configured');
          } catch (rbacError: any) {
            warnings.push(`RBAC setup completed with warnings: ${rbacError.message}`);
            this.services.logger.warn(`⚠️ RBAC warning: ${rbacError.message}`);
          }
          
          return {
            success: true,
            configPath,
            applied: true,
            commitHash,
            message: `Controller config generated${commitHash ? ', committed,' : ''} and applied to cluster successfully`,
            warnings
          };
        } catch (error: any) {
          return {
            success: false,
            configPath,
            applied: false,
            commitHash,
            message: `Config generated successfully but failed to apply: ${error.message}`,
            warnings
          };
        }
      }

      // Config generated but not applied (gitops mode or apply=false)
      return {
        success: true,
        configPath,
        applied: false,
        commitHash,
        message: `Controller config generated (apply manually or use #arc_apply_config)`,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to deploy controller: ${error}`,
        warnings
      };
    }
  }

  /**
   * Deploy Runner Set with Hybrid Model
   * 
   * This method generates a runner set configuration file and optionally applies it to the cluster.
   * 
   * WHAT IT DOES:
   * 1. Creates a YAML config file with runner set specifications
   * 2. Configures auto-scaling (min/max runners)
   * 3. Sets up GitHub authentication (requires GITHUB_TOKEN env var)
   * 4. Optionally commits to Git and/or applies to cluster
   * 
   * CONFIG FILE LOCATION: configs/runner-sets/{runnerName}.yaml
   * 
   * EXAMPLE CONFIG GENERATED:
   * ```yaml
   * chart:
   *   repository: oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set
   *   name: gha-runner-scale-set
   *   version: latest
   * release:
   *   name: my-org-runners
   *   namespace: arc-systems
   *   createNamespace: false
   * values:
   *   githubConfigUrl: https://github.com/my-org
   *   githubConfigSecret:
   *     github_token: ${GITHUB_TOKEN}
   *   minRunners: 5
   *   maxRunners: 20
   *   containerMode:
   *     type: kubernetes
   * metadata:
   *   managedBy: arc-config-mcp
   *   mode: hybrid
   *   generatedAt: 2025-10-31T19:27:10.002Z
   * ```
   * 
   * HOW TO APPLY THE CONFIG:
   * Use #arc_apply_config --configType runnerSet --name my-org-runners
   * This reads the config file and executes:
   *   helm upgrade my-org-runners <chart-url> --install --namespace arc-systems \
   *     --set githubConfigUrl=https://github.com/my-org \
   *     --set githubConfigSecret.github_token=$GITHUB_TOKEN \
   *     --set minRunners=5 \
   *     --set maxRunners=20
   * 
   * PREREQUISITES:
   * - ARC controller must be installed first (#arc_install_controller_hybrid)
   * - GITHUB_TOKEN environment variable must be set
   * - Token must have admin:org or repo permissions
   * 
   * @param params - Runner set parameters (organization, minRunners, maxRunners, etc.)
   * @param options - Deployment options (mode, autoCommit, apply)
   * @returns DeploymentResult with success status, config path, and warnings
   */
  async deployRunnerSet(params: any, options: HybridDeploymentOptions = {}): Promise<DeploymentResult> {
    const mode = options.mode || 'hybrid';
    const warnings: string[] = [];

    try {
      // Step 1: Validate organization
      const organization = params.organization || process.env.GITHUB_ORG;
      if (!organization) {
        throw new Error('Organization is required');
      }

      // Step 1.5: Determine runner name with intelligent fallback strategy
      let runnerName: string;
      
      if (process.env.RUNNER_LABEL) {
        // Highest priority: RUNNER_LABEL environment variable (from mcp.json)
        runnerName = process.env.RUNNER_LABEL;
        this.services.logger.info(`Using RUNNER_LABEL from environment: ${runnerName}`);
      } else if (params.runnerName) {
        // Second priority: Explicit parameter passed to the tool
        runnerName = params.runnerName;
        this.services.logger.info(`Using explicit runnerName parameter: ${runnerName}`);
      } else {
        // Fallback: Try to find existing runner config, or use organization-based default
        try {
          const existingConfigs = await this.configManager.listConfigs('runnerSet');
          if (existingConfigs.length > 0) {
            // Extract runner name from the first config file path
            // Path format: configs/runner-sets/{runnerName}.yaml
            const configPath = existingConfigs[0].path;
            const fileName = configPath.split('/').pop() || '';
            const extractedName = fileName.replace(/\.(yaml|yml)$/, '');
            runnerName = extractedName;
            this.services.logger.info(`⚠️ RUNNER_LABEL not set. Reusing existing runner name: ${runnerName}`);
          } else {
            // No existing configs, use organization-based default
            runnerName = `${organization}-runners`;
            this.services.logger.warn(`⚠️ RUNNER_LABEL not set in mcp.json. Using default: ${runnerName}. Consider setting RUNNER_LABEL for consistent naming.`);
          }
        } catch (error) {
          // If config manager fails, use organization-based default
          runnerName = `${organization}-runners`;
          this.services.logger.warn(`⚠️ RUNNER_LABEL not set. Using default: ${runnerName}`);
        }
      }

      this.services.logger.info(`📝 Generating runner set configuration for ${organization}...`);

      // Step 2: Generate runner set Helm chart configuration
      const runnerSetConfig = {
        chart: {
          repository: 'oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set',
          name: 'gha-runner-scale-set',
          version: params.version || 'latest'
        },
        release: {
          name: runnerName,
          namespace: params.namespace || 'arc-systems',
          createNamespace: false // Controller should already have created this
        },
        values: {
          githubConfigUrl: `https://github.com/${organization}`,
          githubConfigSecret: {
            github_token: '${GITHUB_TOKEN}' // Will be substituted at apply time
          },
          controllerServiceAccount: {
            namespace: params.namespace || 'arc-systems',
            name: 'arc-gha-rs-controller'
          },
          minRunners: params.minReplicas || params.minRunners || 1,
          maxRunners: params.maxReplicas || params.maxRunners || 20,
          runnerGroup: params.runnerGroup || 'default',
          runnerScaleSetName: runnerName,
          // ARC 0.13.0+: Container mode for storage optimization
          // dind: Docker-in-Docker mode (recommended for Docker builds, eliminates storage issues)
          // kubernetes-novolume: Ephemeral storage mode (eliminates RWX storage requirements)
          // kubernetes: Legacy mode with persistent volumes
          containerMode: {
            type: params.containerMode || 'dind'
          },
          template: {
            spec: {
              containers: [{
                name: 'runner',
                image: params.runnerImage || 'ghcr.io/actions/actions-runner:latest',
                command: ['/home/runner/run.sh'],
                env: [
                  { name: 'DOCKER_ENABLED', value: 'true' },
                  { name: 'RUNNER_FEATURE_FLAG_EPHEMERAL', value: 'true' }
                ],
                resources: {
                  limits: { 
                    cpu: params.cpuLimit || '2.0', 
                    memory: params.memoryLimit || '2Gi' 
                  },
                  requests: { 
                    cpu: params.cpuRequest || '200m', 
                    memory: params.memoryRequest || '256Mi' 
                  }
                }
              }]
            }
          }
        },
        metadata: {
          managedBy: 'arc-config-mcp',
          mode: mode,
          generatedAt: new Date().toISOString(),
          organization: organization
        }
      };

      // Step 3: Check for existing config
      const existingConfig = await this.configManager.getConfigMetadata('runnerSet', runnerName);
      if (existingConfig.exists) {
        this.services.logger.info(`⚠️ Runner set '${runnerName}' config already exists, will update`);
        warnings.push(`Existing runner set '${runnerName}' configuration will be updated`);
      }

      // Step 4: Write config to filesystem
      const configPath = await this.configManager.writeConfig('runnerSet', runnerSetConfig, runnerName);
      this.services.logger.info(`✅ Runner set config written to: ${configPath}`);

      // Step 5: Handle Git operations based on mode
      // Note: When using hybrid/gitops modes, we assume the user's workspace is under source control
      // since they explicitly chose a Git-based workflow
      if (mode !== 'direct') {
        const relativePath = await this.configManager.getRelativePath('runnerSet', runnerName);
        
        if (options.autoCommit) {
          // Attempt auto-commit if Git is available
          const gitStatus = await this.gitIntegration.getStatus();
          
          if (gitStatus.isRepo) {
            const commitMessage = options.commitMessage || 
              this.gitIntegration.generateCommitMessage(
                'chore(arc): ${action} - ${description}',
                'runner deployment',
                `Deploy ${runnerSetConfig.values.minRunners}-${runnerSetConfig.values.maxRunners} runners for ${organization}`
              );
            
            const commitResult = await this.gitIntegration.commit(commitMessage, [relativePath]);
            
            if (commitResult.success) {
              this.services.logger.info(`✅ Config committed: ${commitResult.commitHash}`);
              return {
                success: true,
                configPath,
                applied: mode === 'hybrid',
                commitHash: commitResult.commitHash,
                message: `Runner set config generated and committed for ${organization}`,
                warnings
              };
            }
          }
        } else {
          // Not auto-committing - user will commit manually
          warnings.push(`Config file created at ${relativePath}. Commit when ready: git add ${relativePath} && git commit -m "chore(arc): Add runner set config"`);
        }
      }

      // Step 6: Apply if requested
      const shouldApply = mode === 'direct' 
        ? true 
        : (options.apply === true);
      
      if (shouldApply) {
        this.services.logger.info(`🚀 Applying runner set configuration to cluster...`);
        
        try {
          // Apply using Helm
          const applyResult = await this.applyConfigToCluster(runnerSetConfig, 'runnerSet');
          
          if (!applyResult.success) {
            return {
              success: false,
              configPath,
              applied: false,
              message: `Config generated successfully but failed to apply: ${applyResult.stderr}`,
              warnings
            };
          }
          
          this.services.logger.info('✅ Runner set applied successfully');
          
          return {
            success: true,
            configPath,
            applied: true,
            message: `Runner set config generated and applied for ${organization} (${runnerSetConfig.values.minRunners}-${runnerSetConfig.values.maxRunners} runners)`,
            warnings
          };
        } catch (error: any) {
          return {
            success: false,
            configPath,
            applied: false,
            message: `Config generated successfully but failed to apply: ${error.message}`,
            warnings
          };
        }
      }

      // Config generated but not applied (gitops mode or apply=false)
      return {
        success: true,
        configPath,
        applied: false,
        message: `Runner set config generated for ${organization} (apply manually or use #arc_apply_config)`,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to deploy runner set: ${error}`,
        warnings
      };
    }
  }

  /**
   * List all generated configurations
   */
  async listConfigs(): Promise<{ runnerSets: any[]; controller: any | null }> {
    const runnerSets = await this.configManager.listConfigs('runnerSet');
    const controllerMetadata = await this.configManager.getConfigMetadata('controller');
    
    return {
      runnerSets: runnerSets.map(rs => ({
        path: rs.path,
        lastModified: rs.lastModified,
        config: rs.content
      })),
      controller: controllerMetadata.exists ? {
        path: controllerMetadata.path,
        lastModified: controllerMetadata.lastModified,
        config: controllerMetadata.content
      } : null
    };
  }

  /**
   * Detect drift between repo configs and deployed resources
   */
  /**
   * Apply a configuration file to the cluster using Helm
   * 
   * @param config - The configuration object to apply
   * @param configType - Type of config (controller or runnerSet)
   * @returns Result of the Helm operation
   */
  private async applyConfigToCluster(config: any, configType: 'controller' | 'runnerSet'): Promise<{ success: boolean; stdout: string; stderr: string }> {
    // Check if this is a Helm chart config
    const isHelmConfig = config.chart && config.release;
    if (!isHelmConfig) {
      throw new Error('Config is not a Helm chart configuration');
    }

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
      // For complex configurations with nested objects or special characters in keys,
      // use a temporary values file instead of --set arguments
      const hasComplexStructure = this.hasComplexStructure(config.values);
      
      if (hasComplexStructure) {
        // Create temporary values file
        const tmpDir = os.tmpdir();
        const valuesFileName = `arc-values-${configType}-${Date.now()}.yaml`;
        const valuesFilePath = path.join(tmpDir, valuesFileName);
        
        // Prepare values (replace GitHub token placeholder)
        const valuesForFile = JSON.parse(JSON.stringify(config.values));
        if (configType === 'runnerSet' && valuesForFile.githubConfigSecret) {
          const githubToken = process.env.GITHUB_TOKEN;
          if (!githubToken) {
            throw new Error('GITHUB_TOKEN environment variable not set. Runner sets require a GitHub token for authentication.');
          }
          valuesForFile.githubConfigSecret.github_token = githubToken;
        }
        
        // Write values file
        const yaml = require('js-yaml');
        fs.writeFileSync(valuesFilePath, yaml.dump(valuesForFile));
        this.services.logger.info(`Created temporary values file: ${valuesFilePath}`);
        
        // Use --values flag instead of multiple --set flags
        helmArgs.push('--values', valuesFilePath);
        
        // Clean up temp file after execution
        process.on('exit', () => {
          try {
            if (fs.existsSync(valuesFilePath)) {
              fs.unlinkSync(valuesFilePath);
            }
          } catch (err) {
            // Ignore cleanup errors
          }
        });
      } else {
        // Use --set for simple configurations
        const valuesToSet: string[] = [];

        // Special handling for GitHub token (runner sets only)
        if (configType === 'runnerSet' && config.values.githubConfigSecret) {
          const githubToken = process.env.GITHUB_TOKEN;
          if (!githubToken) {
            throw new Error('GITHUB_TOKEN environment variable not set. Runner sets require a GitHub token for authentication.');
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
    }

    // Ensure all helmArgs are strings and filter out any undefined/null values
    const sanitizedHelmArgs = helmArgs.filter(arg => arg != null).map(arg => String(arg));

    // Execute Helm command
    this.services.logger.info(`Executing: helm ${sanitizedHelmArgs.join(' ').replace(process.env.GITHUB_TOKEN || '', '***')}`);
    const result = await this.services.installer.commandExecutor.execute(
      'helm',
      sanitizedHelmArgs.join(' ')
    );

    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  /**
   * Check if values object has complex structure requiring a values file
   * (nested objects with special characters in keys, deep nesting, etc.)
   */
  private hasComplexStructure(obj: any, depth = 0): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    // Check for keys with dots or slashes (common in K8s labels/annotations)
    const keys = Object.keys(obj);
    if (keys.some(k => k.includes('.') || k.includes('/'))) {
      return true;
    }

    // Check for deep nesting (more than 2 levels)
    if (depth > 2) {
      return true;
    }

    // Check nested objects
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (this.hasComplexStructure(value, depth + 1)) {
          return true;
        }
      }
    }

    return false;
  }

  async detectDrift(runnerName?: string): Promise<{ hasDrift: boolean; details: string[] }> {
    const details: string[] = [];
    let hasDrift = false;

    try {
      // Check controller drift first (unless specific runner requested)
      if (!runnerName) {
        const controllerDrift = await this.detectControllerDrift();
        if (controllerDrift.hasDrift) {
          hasDrift = true;
          details.push(...controllerDrift.details);
        }
      }

      // DIRECTION 1: Check repo configs against cluster (repo → cluster)
      const configs = runnerName 
        ? [await this.configManager.getConfigMetadata('runnerSet', runnerName)]
        : await this.configManager.listConfigs('runnerSet');

      const repoRunnerNames = new Set<string>();

      for (const config of configs) {
        if (!config.exists || !config.content) continue;

        // For Helm-style configs, the name is in release.name
        const name = config.content.release?.name || config.content.metadata?.name;
        if (!name) continue;

        repoRunnerNames.add(name);

        // Get deployed resource from cluster
        try {
          const deployed = await this.services.installer.commandExecutor.kubectl(
            `get autoscalingrunnersets ${name} -n arc-systems -o json`
          );

          const deployedConfig = JSON.parse(deployed.stdout);

          // For Helm-style configs, values are under the 'values' key
          const repoValues = config.content.values || config.content.spec || {};
          const repoMin = repoValues.minRunners;
          const repoMax = repoValues.maxRunners;
          const repoGroup = repoValues.runnerGroup;
          
          const deployedMin = deployedConfig.spec?.minRunners;
          const deployedMax = deployedConfig.spec?.maxRunners;
          const deployedGroup = deployedConfig.spec?.runnerGroup;

          const drifts: string[] = [];
          if (repoMin !== deployedMin) {
            drifts.push(`minRunners: repo=${repoMin}, cluster=${deployedMin}`);
          }
          if (repoMax !== deployedMax) {
            drifts.push(`maxRunners: repo=${repoMax}, cluster=${deployedMax}`);
          }
          if (repoGroup !== deployedGroup) {
            drifts.push(`runnerGroup: repo=${repoGroup}, cluster=${deployedGroup}`);
          }

          if (drifts.length > 0) {
            hasDrift = true;
            details.push(`Runner set '${name}': ${drifts.join(', ')}`);
          }
        } catch (error) {
          details.push(`Runner set '${name}' exists in repo but not deployed to cluster`);
          hasDrift = true;
        }
      }

      // DIRECTION 2: Check cluster resources against repo (cluster → repo)
      // Only do this if not checking a specific runner
      if (!runnerName) {
        try {
          const deployed = await this.services.installer.commandExecutor.kubectl(
            `get autoscalingrunnersets -n arc-systems -o json`
          );

          const deployedResources = JSON.parse(deployed.stdout);
          const items = deployedResources.items || [];

          for (const item of items) {
            const clusterName = item.metadata?.name;
            if (clusterName && !repoRunnerNames.has(clusterName)) {
              hasDrift = true;
              details.push(`Runner set '${clusterName}' is deployed in cluster but missing from repo`);
            }
          }
        } catch (error) {
          // If we can't list resources, don't fail - just skip this check
        }
      }

      return { hasDrift, details };
    } catch (error) {
      return {
        hasDrift: false,
        details: [`Drift detection failed: ${error}`]
      };
    }
  }

  /**
   * Fix drift by recreating missing config files from cluster state
   */
  async fixDrift(driftDetails: string[]): Promise<{ fixed: string[]; failed: string[] }> {
    const fixed: string[] = [];
    const failed: string[] = [];

    for (const detail of driftDetails) {
      try {
        // Check if this is a "missing from repo" drift
        if (detail.includes('is deployed in cluster but missing from repo')) {
          // Extract resource type and name
          if (detail.includes('Controller')) {
            // Fix controller drift
            const match = detail.match(/Controller '([^']+)'/);
            if (match) {
              const controllerName = match[1];
              await this.recreateControllerConfig(controllerName);
              fixed.push(`Recreated controller config: configs/controller.yaml`);
            }
          } else if (detail.includes('Runner set')) {
            // Fix runner set drift
            const match = detail.match(/Runner set '([^']+)'/);
            if (match) {
              const runnerName = match[1];
              await this.recreateRunnerSetConfig(runnerName);
              fixed.push(`Recreated runner set config: configs/runner-sets/${runnerName}.yaml`);
            }
          }
        } else {
          // This is a configuration mismatch, not a missing file
          // Skip auto-fix for mismatches (user needs to decide which is correct)
          failed.push(`Skipped: ${detail} (config exists but differs - manual review needed)`);
        }
      } catch (error) {
        failed.push(`Failed to fix: ${detail} - ${error}`);
      }
    }

    return { fixed, failed };
  }

  /**
   * Recreate controller config from cluster state
   */
  private async recreateControllerConfig(controllerName: string): Promise<void> {
    try {
      // Get helm release info
      let helmListOutput: string;
      if (this.services.installer?.commandExecutor?.helm) {
        const result = await this.services.installer.commandExecutor.helm(
          `list -n arc-systems -o json`
        );
        helmListOutput = result.stdout;
      } else {
        const { execSync } = await import('child_process');
        helmListOutput = execSync('helm list -n arc-systems -o json', { encoding: 'utf-8' });
      }

      const releases = JSON.parse(helmListOutput);
      const release = releases.find((r: any) => r.name === controllerName);

      if (!release) {
        throw new Error(`Controller ${controllerName} not found in cluster`);
      }

      // Get deployment for additional details
      let deploymentOutput: string;
      if (this.services.installer?.commandExecutor?.kubectl) {
        const result = await this.services.installer.commandExecutor.kubectl(
          `get deployment -n arc-systems -l app.kubernetes.io/name=gha-rs-controller -o json`
        );
        deploymentOutput = result.stdout;
      } else {
        const { execSync } = await import('child_process');
        deploymentOutput = execSync(
          'kubectl get deployment -n arc-systems -l app.kubernetes.io/name=gha-rs-controller -o json',
          { encoding: 'utf-8' }
        );
      }

      const deploymentData = JSON.parse(deploymentOutput);
      const deployment = deploymentData.items?.[0];

      // Extract version from chart name
      const chartVersion = release.chart?.split('-').pop() || release.app_version || 'latest';

      // Build config from cluster state
      const config: any = {
        chart: {
          repository: 'oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller',
          name: 'gha-runner-scale-set-controller',
          version: chartVersion
        },
        release: {
          name: controllerName,
          namespace: release.namespace || 'arc-systems',
          createNamespace: true
        },
        values: {
          replicaCount: deployment?.spec?.replicas || 1,
          image: {
            tag: chartVersion
          }
        },
        metadata: {
          managedBy: 'arc-config-mcp',
          mode: 'hybrid',
          generatedAt: new Date().toISOString(),
          recreatedFromCluster: true
        }
      };

      // Save config file
      await this.configManager.writeConfig('controller', config);
    } catch (error) {
      throw new Error(`Failed to recreate controller config: ${error}`);
    }
  }

  /**
   * Recreate runner set config from cluster state
   */
  private async recreateRunnerSetConfig(runnerName: string): Promise<void> {
    try {
      // Get AutoscalingRunnerSet from cluster
      let runnerSetOutput: string;
      if (this.services.installer?.commandExecutor?.kubectl) {
        const result = await this.services.installer.commandExecutor.kubectl(
          `get autoscalingrunnersets ${runnerName} -n arc-systems -o json`
        );
        runnerSetOutput = result.stdout;
      } else {
        const { execSync } = await import('child_process');
        runnerSetOutput = execSync(
          `kubectl get autoscalingrunnersets ${runnerName} -n arc-systems -o json`,
          { encoding: 'utf-8' }
        );
      }

      const runnerSet = JSON.parse(runnerSetOutput);

      // Build config from cluster state
      const config: any = {
        chart: {
          repository: 'oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set',
          name: 'gha-runner-scale-set',
          version: 'latest' // We can't easily determine the exact version from the resource
        },
        release: {
          name: runnerName,
          namespace: 'arc-systems',
          createNamespace: false
        },
        values: {
          githubConfigUrl: runnerSet.spec?.githubConfigUrl || '',
          githubConfigSecret: {
            github_token: '${GITHUB_TOKEN}'
          },
          controllerServiceAccount: {
            namespace: 'arc-systems',
            name: 'arc-gha-rs-controller'
          },
          minRunners: runnerSet.spec?.minRunners || 0,
          maxRunners: runnerSet.spec?.maxRunners || 5,
          runnerGroup: runnerSet.spec?.runnerGroup || 'default',
          runnerScaleSetName: runnerName,
          containerMode: {
            type: 'dind'
          },
          template: runnerSet.spec?.template || {
            spec: {
              containers: [{
                name: 'runner',
                image: 'ghcr.io/actions/actions-runner:latest',
                command: ['/home/runner/run.sh'],
                env: [
                  { name: 'DOCKER_ENABLED', value: 'true' },
                  { name: 'RUNNER_FEATURE_FLAG_EPHEMERAL', value: 'true' }
                ],
                resources: {
                  limits: { cpu: '2.0', memory: '2Gi' },
                  requests: { cpu: '200m', memory: '256Mi' }
                }
              }]
            }
          }
        },
        metadata: {
          managedBy: 'arc-config-mcp',
          mode: 'hybrid',
          generatedAt: new Date().toISOString(),
          organization: runnerSet.spec?.githubConfigUrl?.split('/').pop() || '',
          recreatedFromCluster: true
        }
      };

      // Save config file
      await this.configManager.writeConfig('runnerSet', config, runnerName);
    } catch (error) {
      throw new Error(`Failed to recreate runner set config: ${error}`);
    }
  }

  /**
   * Detect drift in controller configuration
   */
  private async detectControllerDrift(): Promise<{ hasDrift: boolean; details: string[] }> {
    const details: string[] = [];
    let hasDrift = false;

    try {
      // Get controller config from repo
      const controllerConfig = await this.configManager.getConfigMetadata('controller');
      
      const hasRepoConfig = controllerConfig.exists && controllerConfig.content;

      // Check if controller is deployed in cluster
      let deployedRelease: any = null;
      let clusterNamespace = 'arc-systems';
      
      try {
        // Check if we have a command executor, otherwise use direct execution
        let helmListOutput: string;
        if (this.services.installer?.commandExecutor?.helm) {
          const helmResult = await this.services.installer.commandExecutor.helm(
            `list -n arc-systems -o json`
          );
          helmListOutput = helmResult.stdout;
        } else {
          // Fallback to direct execution
          const { execSync } = await import('child_process');
          helmListOutput = execSync(
            `helm list -n arc-systems -o json`,
            { encoding: 'utf-8' }
          );
        }
        
        const releases = JSON.parse(helmListOutput);
        deployedRelease = releases.find((r: any) => 
          r.name === 'arc-controller' || r.chart?.includes('gha-runner-scale-set-controller')
        );
        
        if (deployedRelease) {
          clusterNamespace = deployedRelease.namespace;
        }
      } catch (error) {
        // If we can't check cluster, assume no deployment
      }

      // CASE 1: Controller deployed in cluster but missing from repo
      if (deployedRelease && !hasRepoConfig) {
        details.push(`Controller '${deployedRelease.name}' is deployed in cluster but missing from repo`);
        return { hasDrift: true, details };
      }

      // CASE 2: Controller in repo but not deployed
      if (hasRepoConfig && !deployedRelease) {
        const repoRelease = controllerConfig.content.release;
        details.push(`Controller '${repoRelease.name}' exists in repo but not deployed to cluster`);
        return { hasDrift: true, details };
      }

      // CASE 3: Both exist - check for configuration drift
      if (hasRepoConfig && deployedRelease) {
        const repoChart = controllerConfig.content.chart;
        const repoRelease = controllerConfig.content.release;
        const repoValues = controllerConfig.content.values || {};

        const drifts: string[] = [];

        // Check chart version
        if (repoChart.version && repoChart.version !== 'latest') {
          const deployedVersion = deployedRelease.chart?.split('-').pop() || deployedRelease.app_version;
          if (deployedVersion && repoChart.version.toString() !== deployedVersion.toString()) {
            drifts.push(`version: repo=${repoChart.version}, cluster=${deployedVersion}`);
          }
        }

        // Check namespace
        if (deployedRelease.namespace !== repoRelease.namespace) {
          drifts.push(`namespace: repo=${repoRelease.namespace}, cluster=${deployedRelease.namespace}`);
        }

        // Get controller deployment details for replicas and resources
        try {
          let deploymentOutput: string;
          if (this.services.installer?.commandExecutor?.kubectl) {
            const result = await this.services.installer.commandExecutor.kubectl(
              `get deployment -n ${clusterNamespace} -l app.kubernetes.io/name=gha-rs-controller -o json`
            );
            deploymentOutput = result.stdout;
          } else {
            const { execSync } = await import('child_process');
            deploymentOutput = execSync(
              `kubectl get deployment -n ${clusterNamespace} -l app.kubernetes.io/name=gha-rs-controller -o json`,
              { encoding: 'utf-8' }
            );
          }
          
          const deploymentData = JSON.parse(deploymentOutput);
          if (deploymentData.items && deploymentData.items.length > 0) {
            const controllerDep = deploymentData.items[0];
            
            // Check replicas if specified in repo config
            if (repoValues.replicaCount !== undefined) {
              const deployedReplicas = controllerDep.spec?.replicas || 1;
              if (repoValues.replicaCount !== deployedReplicas) {
                drifts.push(`replicas: repo=${repoValues.replicaCount}, cluster=${deployedReplicas}`);
              }
            }

            // Check image if specified in repo config
            if (repoValues.image?.tag) {
              const container = controllerDep.spec?.template?.spec?.containers?.[0];
              const deployedImage = container?.image || '';
              const deployedTag = deployedImage.split(':')[1] || 'latest';
              if (repoValues.image.tag !== deployedTag) {
                drifts.push(`image tag: repo=${repoValues.image.tag}, cluster=${deployedTag}`);
              }
            }
          }
        } catch (error) {
          // Deployment details optional, don't fail if can't get them
        }

        if (drifts.length > 0) {
          hasDrift = true;
          details.push(`Controller '${repoRelease.name}': ${drifts.join(', ')}`);
        }
      }

      return { hasDrift, details };
    } catch (error) {
      return {
        hasDrift: false,
        details: [`Controller drift detection failed: ${error}`]
      };
    }
  }

  /**
   * Ensure the ARC controller service account has proper RBAC permissions
   * 
   * The controller needs to be able to create Roles and RoleBindings in the namespace
   * for runner pods. This is required for the AutoscalingListener to function properly.
   */
  private async ensureControllerRBAC(namespace: string): Promise<void> {
    const serviceAccountName = 'arc-controller-gha-rs-controller';
    const clusterRoleName = 'arc-controller-role-manager';
    const clusterRoleBindingName = 'arc-controller-role-manager-binding';

    // Create ClusterRole YAML
    const clusterRoleYaml = `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ${clusterRoleName}
  labels:
    app.kubernetes.io/name: actions-runner-controller
    app.kubernetes.io/managed-by: arc-config-mcp
rules:
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["roles", "rolebindings"]
  verbs: ["create", "get", "list", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["serviceaccounts"]
  verbs: ["create", "get", "list", "update", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ${clusterRoleBindingName}
  labels:
    app.kubernetes.io/name: actions-runner-controller
    app.kubernetes.io/managed-by: arc-config-mcp
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ${clusterRoleName}
subjects:
- kind: ServiceAccount
  name: ${serviceAccountName}
  namespace: ${namespace}`;

    // Write to temp file and apply (kubectl apply is idempotent)
    const tmpFile = path.join(os.tmpdir(), `arc-rbac-${Date.now()}.yaml`);
    
    try {
      fs.writeFileSync(tmpFile, clusterRoleYaml);
      
      await this.services.installer.commandExecutor.kubectl(
        `apply -f ${tmpFile}`
      );
      
      this.services.logger.info(`✅ Controller RBAC configured (ClusterRole and ClusterRoleBinding)`);
    } finally {
      // Clean up temp file
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  }
}
