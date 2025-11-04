import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Configuration file manager for the Hybrid Model
 * Handles reading/writing YAML configs to the filesystem
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
    
    // Ensure directory exists
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      if (error.code === 'EPERM' || error.code === 'EACCES') {
        throw new Error(
          `❌ Failed to create configs directory due to insufficient permissions.\n\n` +
          `📁 Attempted path: ${dirPath}\n\n` +
          `Possible causes:\n` +
          `1. ⚠️  No sufficient permissions to configs folder\n` +
          `2. 🐳 MCP configuration is not set correctly - missing volume mount:\n` +
          `   Add this to your MCP config (mcp.json):\n` +
          `   -v /path/to/workspace/configs:/app/configs\n` +
          `   \n` +
          `   Example:\n` +
          `   "args": [\n` +
          `     "run", "--rm", "-i",\n` +
          `     "-v", "\${HOME}/.kube:/home/mcp/.kube:ro",\n` +
          `     "-v", "\${PWD}/configs:/app/configs",  # Add this line\n` +
          `     ...\n` +
          `   ]\n` +
          `3. 📂 'configs' folder does not exist at the root project level\n` +
          `   Run: mkdir -p ${this.configPath}/configs\n\n` +
          `💡 If using Docker, ensure the workspace directory is mounted.\n` +
          `💡 If running locally, ensure write permissions on the project directory.`
        );
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
    } catch (error: any) {
      if (error.code === 'EPERM' || error.code === 'EACCES') {
        throw new Error(
          `❌ Failed to write config file due to insufficient permissions.\n\n` +
          `📁 Attempted path: ${filePath}\n\n` +
          `Please check file permissions and MCP volume mount configuration.`
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
