/**
 * Git Repository Detection Utility
 * 
 * Provides functions to detect GitHub organization and repository from the current workspace
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitRepoInfo {
    owner: string;
    repo: string;
    url: string;
}

export class GitRepositoryDetector {
    private logger: any;

    constructor(logger: any) {
        this.logger = logger;
    }

    /**
     * Detect GitHub repository information from the current working directory
     */
    async detectGitHubRepository(workingDir?: string): Promise<GitRepoInfo | null> {
        try {
            // Get the remote origin URL
            const { stdout } = await execAsync('git remote get-url origin', {
                cwd: workingDir || process.cwd(),
                timeout: 5000
            });

            const remoteUrl = stdout.trim();
            this.logger?.info(`Detected git remote origin: ${remoteUrl}`);

            // Parse GitHub URLs (supports both HTTPS and SSH formats)
            const gitHubInfo = this.parseGitHubUrl(remoteUrl);
            
            if (gitHubInfo) {
                this.logger?.info(`Parsed GitHub info: ${gitHubInfo.owner}/${gitHubInfo.repo}`);
                return gitHubInfo;
            }

            this.logger?.warn('Remote URL is not a GitHub repository');
            return null;

        } catch (error) {
            this.logger?.debug(`Could not detect git repository: ${error}`);
            return null;
        }
    }

    /**
     * Parse GitHub URLs to extract owner and repository name
     * Supports formats:
     * - https://github.com/owner/repo.git
     * - git@github.com:owner/repo.git
     * - https://github.com/owner/repo
     */
    private parseGitHubUrl(url: string): GitRepoInfo | null {
        try {
            // Remove .git suffix if present
            const cleanUrl = url.replace(/\.git$/, '');

            // Match HTTPS format: https://github.com/owner/repo
            let match = cleanUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
            if (match) {
                return {
                    owner: match[1],
                    repo: match[2],
                    url: cleanUrl
                };
            }

            // Match SSH format: git@github.com:owner/repo
            match = cleanUrl.match(/git@github\.com:([^\/]+)\/([^\/]+)/);
            if (match) {
                return {
                    owner: match[1],
                    repo: match[2],
                    url: `https://github.com/${match[1]}/${match[2]}`
                };
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get the GitHub organization from the current workspace
     * Priority: 1) GITHUB_ORG env var, 2) Git repository owner, 3) Fallback
     */
    async resolveGitHubOrganization(explicitOrg?: string, fallback = 'default-org'): Promise<string> {
        // 1. Environment variable takes highest priority
        if (process.env.GITHUB_ORG) {
            this.logger?.info(`Using GITHUB_ORG environment variable: ${process.env.GITHUB_ORG}`);
            return process.env.GITHUB_ORG;
        }

        // 2. Explicit parameter
        if (explicitOrg) {
            this.logger?.info(`Using explicit organization parameter: ${explicitOrg}`);
            return explicitOrg;
        }

        // 3. Auto-detect from current git repository
        const gitInfo = await this.detectGitHubRepository();
        if (gitInfo) {
            this.logger?.info(`Auto-detected organization from git repository: ${gitInfo.owner}`);
            return gitInfo.owner;
        }

        // 4. Fallback
        this.logger?.info(`Using fallback organization: ${fallback}`);
        return fallback;
    }
}