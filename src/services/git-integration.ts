import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Git integration service for the Hybrid Model
 * Handles Git operations for config files
 */

export interface GitStatus {
  isRepo: boolean;
  branch?: string;
  uncommittedChanges: string[];
  untrackedFiles: string[];
}

export interface CommitResult {
  success: boolean;
  commitHash?: string;
  message: string;
}

export class GitIntegration {
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || process.cwd();
  }

  /**
   * Execute a Git command
   */
  private async execGit(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const { stdout, stderr } = await execAsync(`git ${args.join(' ')}`, {
        cwd: this.workspaceRoot,
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  /**
   * Check if the workspace is a Git repository
   */
  async isGitRepo(): Promise<boolean> {
    try {
      const result = await this.execGit(['rev-parse', '--git-dir']);
      return result.exitCode === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current Git status
   */
  async getStatus(): Promise<GitStatus> {
    const isRepo = await this.isGitRepo();
    
    if (!isRepo) {
      return {
        isRepo: false,
        uncommittedChanges: [],
        untrackedFiles: [],
      };
    }

    // Get current branch
    const branchResult = await this.execGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    const branch = branchResult.stdout.trim();

    // Get uncommitted changes
    const statusResult = await this.execGit(['status', '--porcelain']);

    const uncommittedChanges: string[] = [];
    const untrackedFiles: string[] = [];

    statusResult.stdout.split('\n').forEach((line: string) => {
      if (line.trim()) {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        
        if (status.includes('??')) {
          untrackedFiles.push(file);
        } else if (status.trim()) {
          uncommittedChanges.push(file);
        }
      }
    });

    return {
      isRepo: true,
      branch,
      uncommittedChanges,
      untrackedFiles,
    };
  }

  /**
   * Check if specific files have uncommitted changes
   */
  async hasUncommittedChanges(files: string[]): Promise<boolean> {
    const status = await this.getStatus();
    
    const allChanges = [
      ...status.uncommittedChanges,
      ...status.untrackedFiles,
    ];

    return files.some(file => 
      allChanges.some(changed => changed.includes(file))
    );
  }

  /**
   * Stage files for commit
   */
  async stageFiles(files: string[]): Promise<boolean> {
    if (files.length === 0) {
      return false;
    }

    try {
      const result = await this.execGit(['add', ...files]);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to stage files:', error);
      return false;
    }
  }

  /**
   * Commit staged files with a message
   */
  async commit(message: string, files?: string[]): Promise<CommitResult> {
    try {
      // Stage files if provided
      if (files && files.length > 0) {
        const staged = await this.stageFiles(files);
        if (!staged) {
          return {
            success: false,
            message: 'Failed to stage files for commit',
          };
        }
      }

      // Commit
      const result = await this.execGit(['commit', '-m', message]);

      if (result.exitCode !== 0) {
        return {
          success: false,
          message: result.stderr || 'Commit failed',
        };
      }

      // Get commit hash
      const hashResult = await this.execGit(['rev-parse', 'HEAD']);
      const commitHash = hashResult.stdout.trim();

      return {
        success: true,
        commitHash,
        message: `Committed successfully: ${commitHash.substring(0, 7)}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Commit failed: ${error}`,
      };
    }
  }

  /**
   * Generate a commit message from template
   */
  generateCommitMessage(
    template: string,
    action: string,
    description: string
  ): string {
    return template
      .replace('${action}', action)
      .replace('${description}', description);
  }

  /**
   * Get the diff for specific files
   */
  async getDiff(files?: string[]): Promise<string> {
    try {
      const args = ['diff'];
      if (files && files.length > 0) {
        args.push(...files);
      }

      const result = await this.execGit(args);
      return result.stdout;
    } catch (error) {
      return '';
    }
  }

  /**
   * Get Git log for specific files
   */
  async getLog(files?: string[], limit: number = 10): Promise<string> {
    try {
      const args = ['log', `--max-count=${limit}`, '--pretty=format:%h - %s (%an, %ar)'];
      if (files && files.length > 0) {
        args.push('--', ...files);
      }

      const result = await this.execGit(args);
      return result.stdout;
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if a file is tracked by Git
   */
  async isFileTracked(file: string): Promise<boolean> {
    try {
      const result = await this.execGit(['ls-files', '--error-unmatch', file]);
      return result.exitCode === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the last commit that modified a file
   */
  async getLastCommit(file: string): Promise<string | null> {
    try {
      const result = await this.execGit(['log', '-1', '--pretty=format:%H', '--', file]);
      return result.stdout.trim() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a .gitignore entry if it doesn't exist
   */
  async ensureGitignoreEntry(pattern: string): Promise<boolean> {
    const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
    
    try {
      const { readFile, writeFile } = await import('fs/promises');
      
      let content = '';
      try {
        content = await readFile(gitignorePath, 'utf-8');
      } catch {
        // File doesn't exist, will create it
      }

      if (content.includes(pattern)) {
        return true; // Already exists
      }

      const newContent = content + (content.endsWith('\n') ? '' : '\n') + pattern + '\n';
      await writeFile(gitignorePath, newContent, 'utf-8');
      
      return true;
    } catch (error) {
      console.error('Failed to update .gitignore:', error);
      return false;
    }
  }
}
