import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as os from 'os';

/**
 * Configuration file manager for the Hybrid Model
 * Handles reading/writing YAML configs to the filesystem with environment detection
 */

export interface ArcConfig {
  version: string;
  configPath: string;
  defaultMode: 'hybrid' | 'gitops' | 'direct';
  preferences: {
    autoCommit: boolean;
    commitMessageTemplate: string;
    applyConfirmation: boolean;
    driftDetection: boolean;
  };
  paths: {
    controller: string;
    runnerSets: string;
    policies: string;
  };
}

export interface ConfigFileMetadata {
  path: string;
  exists: boolean;
  lastModified?: Date;
  content?: any;
}

export class ConfigFileManager {
  private configPath: string;
  private arcConfig: ArcConfig | null = null;

  constructor(workspaceRoot?: string) {
    this.configPath = workspaceRoot || process.cwd();
  }

  /**
   * Detect if we're running in a Docker container
   */
  private async isRunningInDocker(): Promise<boolean> {
    try {
      // Method 1: Check for /.dockerenv file
      await fs.access('/.dockerenv');
      return true;
    } catch {
      try {
        // Method 2: Check cgroup for docker
        const cgroup = await fs.readFile('/proc/1/cgroup', 'utf-8');
        return cgroup.includes('docker') || cgroup.includes('containerd');
      } catch {
        // Method 3: Check hostname pattern (docker containers often have short hex hostnames)
        const hostname = os.hostname();
        return /^[0-9a-f]{12}$/.test(hostname);
      }
    }
  }

  /**
   * Detect the environment type and potential issues
   */
  private async detectEnvironment(): Promise<{
    isDocker: boolean;
    isVolumeMount: boolean;
    workspaceMounted: boolean;
    isConfigsOnlyMount: boolean;
    suggestions: string[];
  }> {
    const isDocker = await this.isRunningInDocker();
    const suggestions: string[] = [];
    
    let isVolumeMount = false;
    let workspaceMounted = false;
    let isConfigsOnlyMount = false;
    
    if (isDocker) {
      // Check if configs directory is a volume mount
      try {
        const configsPath = path.join(this.configPath, 'configs');
        const stat = await fs.stat(configsPath);
        isVolumeMount = true;
        workspaceMounted = true;
        suggestions.push('✅ Configs directory is mounted correctly');
      } catch {
        // configs directory doesn't exist - check mount type
        try {
          const testFile = path.join(this.configPath, '.arc-config.json');
          await fs.access(testFile);
          workspaceMounted = true;
          suggestions.push('✅ Workspace is mounted correctly');
          suggestions.push('📁 Will create configs directory automatically');
        } catch {
          // Neither configs nor workspace are accessible
          // This suggests configs-only mount where host directory doesn't exist
          isConfigsOnlyMount = true;
          workspaceMounted = false;
          suggestions.push('🐳 Detected configs-only volume mount');
          suggestions.push('❌ Host configs directory does not exist');
          suggestions.push('🔧 Create on host: mkdir -p $(pwd)/configs');
          suggestions.push('� RESTART MCP server after creating directory');
          suggestions.push('�💡 Or use full workspace mount: -v "$(pwd):/app"');
        }
      }
    }
    
    return {
      isDocker,
      isVolumeMount,
      workspaceMounted,
      isConfigsOnlyMount,
      suggestions
    };
  }

  /**
   * Load ARC configuration from .arc-config.json
   */
  async loadArcConfig(): Promise<ArcConfig> {
    if (this.arcConfig) {
      return this.arcConfig;
    }

    const configFile = path.join(this.configPath, '.arc-config.json');
    
    try {
      const content = await fs.readFile(configFile, 'utf-8');
      this.arcConfig = JSON.parse(content) as ArcConfig;
      return this.arcConfig;
    } catch (error) {
      // Return default config if file doesn't exist
      this.arcConfig = {
        version: '1.0.0',
        configPath: './configs',
        defaultMode: 'hybrid',
        preferences: {
          autoCommit: false,
          commitMessageTemplate: 'chore(arc): ${action} - ${description}',
          applyConfirmation: true,
          driftDetection: true,
        },
        paths: {
          controller: 'configs/controller.yaml',
          runnerSets: 'configs/runner-sets',
          policies: 'configs/policies',
        },
      };
      return this.arcConfig;
    }
  }

  /**
   * Get the full path for a config file
   */
  async getConfigPath(type: 'controller' | 'runnerSet' | 'policy', name?: string): Promise<string> {
    const config = await this.loadArcConfig();
    
    switch (type) {
      case 'controller':
        return path.join(this.configPath, config.paths.controller);
      case 'runnerSet':
        return path.join(this.configPath, config.paths.runnerSets, `${name || 'default'}.yaml`);
      case 'policy':
        return path.join(this.configPath, config.paths.policies, `${name || 'default'}.yaml`);
      default:
        throw new Error(`Unknown config type: ${type}`);
    }
  }

  /**
   * Check if a config file exists and get its metadata
   */
  async getConfigMetadata(type: 'controller' | 'runnerSet' | 'policy', name?: string): Promise<ConfigFileMetadata> {
    const filePath = await this.getConfigPath(type, name);
    
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = yaml.load(content);
      
      return {
        path: filePath,
        exists: true,
        lastModified: stats.mtime,
        content: parsed,
      };
    } catch (error) {
      return {
        path: filePath,
        exists: false,
      };
    }
  }

  /**
   * Write a config file to the filesystem
   */
  async writeConfig(
    type: 'controller' | 'runnerSet' | 'policy',
    content: any,
    name?: string
  ): Promise<string> {
    const filePath = await this.getConfigPath(type, name);
    const dirPath = path.dirname(filePath);
    
    // Detect environment for better error handling and auto-creation
    const env = await this.detectEnvironment();
    
    // Ensure directory exists
    try {
      await fs.mkdir(dirPath, { recursive: true });
      
      // In hybrid/GitOps mode with Docker, inform user about successful directory creation
      if (env.isDocker && env.workspaceMounted) {
        console.log(`📁 Created directory: ${path.relative(this.configPath, dirPath)}`);
      }
      
    } catch (error: any) {
      if (error.code === 'EPERM' || error.code === 'EACCES') {
        
        // Enhanced error message with environment context
        let errorMsg = `❌ Failed to create configs directory due to insufficient permissions.\n\n`;
        errorMsg += `📁 Attempted path: ${dirPath}\n\n`;
        
        if (env.isDocker) {
          errorMsg += `🐳 **Docker Environment Detected**\n\n`;
          
          if (env.isConfigsOnlyMount) {
            errorMsg += `**Issue**: Configs-only volume mount detected, but host directory doesn't exist\n\n`;
            errorMsg += `**Root Cause**: Your mcp.json has a configs-only mount:\n`;
            errorMsg += `  "-v", "$(pwd)/configs:/app/configs"\n`;
            errorMsg += `But the configs directory doesn't exist on your host machine.\n\n`;
            errorMsg += `**Solution**: Create the directory on your host:\n`;
            errorMsg += `\`\`\`bash\n`;
            errorMsg += `mkdir -p "$(pwd)/configs"\n`;
            errorMsg += `\`\`\`\n\n`;
            errorMsg += `**🔄 IMPORTANT**: After creating the directory, you **MUST restart the MCP server**\n`;
            errorMsg += `to refresh the Docker volume mount. Docker mounts are established at container startup\n`;
            errorMsg += `and won't detect the newly created directory until the server is restarted.\n\n`;
            errorMsg += `**Alternative**: Use full workspace mount instead:\n`;
            errorMsg += `  "-v", "$(pwd):/app"\n\n`;
            errorMsg += `This error occurs because Docker can't create volume mount points\n`;
            errorMsg += `when the source directory doesn't exist on the host.\n\n`;
          } else if (!env.workspaceMounted) {
            errorMsg += `**Issue**: Workspace not properly mounted to Docker container\n\n`;
            errorMsg += `**Solution**: Add volume mount to your mcp.json:\n`;
            errorMsg += `  "-v", "$(pwd):/app",  // Mount entire workspace\n`;
            errorMsg += `  // OR for configs only:\n`;
            errorMsg += `  "-v", "$(pwd)/configs:/app/configs"\n\n`;
          } else {
            // This case suggests the configs directory was created after container startup
            errorMsg += `**Issue**: configs directory doesn't exist inside the container\n\n`;
            errorMsg += `**Most Likely Cause**: If you just created the configs directory,\n`;
            errorMsg += `the MCP server may need to be restarted to refresh Docker volume mounts.\n\n`;
            errorMsg += `**🔄 Solution**: Restart the MCP server to refresh volume mounts:\n`;
            errorMsg += `  1. Stop the MCP server\n`;
            errorMsg += `  2. Start it again\n`;
            errorMsg += `  3. Docker will now mount the existing configs directory\n\n`;
            errorMsg += `**Alternative Solutions**:\n`;
            env.suggestions.forEach(suggestion => {
              errorMsg += `  • ${suggestion}\n`;
            });
          }
        } else {
          errorMsg += `**Local Environment**\n\n`;
          errorMsg += `Possible causes:\n`;
          errorMsg += `1. ⚠️  Insufficient permissions\n`;
          errorMsg += `2. 📂 Parent directory doesn't exist\n`;
          errorMsg += `3. � Directory is read-only\n\n`;
          errorMsg += `**Solution**: mkdir -p ${dirPath}\n`;
        }
        
        throw new Error(errorMsg);
      }
      throw error;
    }
    
    // Convert to YAML and write
    const yamlContent = yaml.dump(content, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });
    
    try {
      await fs.writeFile(filePath, yamlContent, 'utf-8');
      
      // Success feedback for hybrid/GitOps mode
      if (env.isDocker && env.workspaceMounted) {
        const relativePath = path.relative(this.configPath, filePath);
        console.log(`✅ Config saved: ${relativePath}`);
        console.log(`💡 Tip: Review and commit with: git add ${relativePath}`);
      }
      
    } catch (error: any) {
      if (error.code === 'EPERM' || error.code === 'EACCES') {
        throw new Error(
          `❌ Failed to write config file due to insufficient permissions.\n\n` +
          `📁 Attempted path: ${filePath}\n\n` +
          `${env.isDocker ? '🐳 Docker environment: Check volume mount configuration' : '💻 Local environment: Check file permissions'}`
        );
      }
      throw error;
    }
    
    return filePath;
  }

  /**
   * Read a config file from the filesystem
   */
  async readConfig(
    type: 'controller' | 'runnerSet' | 'policy',
    name?: string
  ): Promise<any> {
    const metadata = await this.getConfigMetadata(type, name);
    
    if (!metadata.exists) {
      throw new Error(`Config file not found: ${metadata.path}`);
    }
    
    return metadata.content;
  }

  /**
   * List all config files of a specific type
   */
  async listConfigs(type: 'controller' | 'runnerSet' | 'policy'): Promise<ConfigFileMetadata[]> {
    const config = await this.loadArcConfig();
    let dirPath: string;
    
    switch (type) {
      case 'controller':
        return [await this.getConfigMetadata('controller')];
      case 'runnerSet':
        dirPath = path.join(this.configPath, config.paths.runnerSets);
        break;
      case 'policy':
        dirPath = path.join(this.configPath, config.paths.policies);
        break;
      default:
        throw new Error(`Unknown config type: ${type}`);
    }
    
    try {
      const files = await fs.readdir(dirPath);
      const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      
      const metadataPromises = yamlFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = yaml.load(content);
        
        return {
          path: filePath,
          exists: true,
          lastModified: stats.mtime,
          content: parsed,
        };
      });
      
      return await Promise.all(metadataPromises);
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete a config file
   */
  async deleteConfig(type: 'controller' | 'runnerSet' | 'policy', name?: string): Promise<boolean> {
    const metadata = await this.getConfigMetadata(type, name);
    
    if (!metadata.exists) {
      return false;
    }
    
    await fs.unlink(metadata.path);
    return true;
  }

  /**
   * Get relative path from workspace root (for Git operations)
   */
  async getRelativePath(type: 'controller' | 'runnerSet' | 'policy', name?: string): Promise<string> {
    const fullPath = await this.getConfigPath(type, name);
    return path.relative(this.configPath, fullPath);
  }
}
