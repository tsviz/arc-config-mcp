/**
 * GitHub Service for ARC MCP Server
 * 
 * Handles GitHub API operations including repository management,
 * runner registration, and authentication.
 */

export class GitHubService {
    private logger: any;

    constructor(logger: any) {
        this.logger = logger;
    }

    /**
     * Get repository information
     */
    async getRepository(owner: string, repo: string): Promise<any> {
        this.logger.info(`Getting repository info: ${owner}/${repo}`);

        // Placeholder implementation
        return {
            full_name: `${owner}/${repo}`,
            private: false,
            default_branch: 'main',
            actions_enabled: true
        };
    }

    /**
     * List repository runners
     */
    async listRunners(owner: string, repo: string): Promise<any[]> {
        this.logger.info(`Listing runners for: ${owner}/${repo}`);

        // Placeholder implementation
        return [
            {
                id: 1,
                name: 'arc-runner-1',
                os: 'linux',
                status: 'online',
                busy: false,
                labels: ['self-hosted', 'linux', 'x64']
            }
        ];
    }

    /**
     * Generate registration token
     */
    async generateRegistrationToken(owner: string, repo: string): Promise<string> {
        this.logger.info(`Generating registration token for: ${owner}/${repo}`);

        // Placeholder implementation
        return 'AXXXXXXXXXXXXXXXXXXXXXXXXX';
    }

    /**
     * Validate GitHub token
     */
    async validateToken(token: string): Promise<boolean> {
        this.logger.info('Validating GitHub token');

        // Placeholder implementation
        return true;
    }

    /**
     * Get current authenticated user
     * @tier1 - Basic implementation
     */
    async getCurrentUser(githubToken?: string): Promise<any> {
        this.logger.info('Getting current authenticated GitHub user');

        // Get token from environment if not provided
        const token = githubToken || process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GitHub token not provided');
        }

        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'ARC-MCP-Server'
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            const user = await response.json();
            this.logger.info(`✅ Authenticated as GitHub user: ${user.login}`);
            return user;
        } catch (error) {
            this.logger.error(`❌ Failed to get current user: ${error}`);
            throw error;
        }
    }

    /**
     * List organization runners
     */
    async listOrganizationRunners(organization: string, githubToken?: string): Promise<any[]> {
        this.logger.info(`Listing runners for organization: ${organization}`);

        const token = githubToken || process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GitHub token not provided');
        }

        try {
            const response = await fetch(`https://api.github.com/orgs/${organization}/actions/runners`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'ARC-MCP-Server'
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            const data = await response.json();
            return data.runners || [];
        } catch (error) {
            this.logger.error(`❌ Failed to list organization runners: ${error}`);
            throw error;
        }
    }

    /**
     * Remove runner from organization
     */
    async removeOrganizationRunner(organization: string, runnerId: number, githubToken?: string): Promise<boolean> {
        this.logger.info(`Removing runner ${runnerId} from organization: ${organization}`);

        const token = githubToken || process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GitHub token not provided');
        }

        try {
            const response = await fetch(`https://api.github.com/orgs/${organization}/actions/runners/${runnerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'ARC-MCP-Server'
                }
            });

            if (response.status === 204) {
                this.logger.info(`✅ Successfully removed runner ${runnerId}`);
                return true;
            } else {
                const errorBody = await response.text();
                this.logger.warn(`⚠️ Failed to remove runner ${runnerId}: ${response.status} ${errorBody}`);
                return false;
            }
        } catch (error) {
            this.logger.error(`❌ Error removing runner ${runnerId}: ${error}`);
            return false;
        }
    }

    /**
     * Clean up offline runners for organization
     */
    async cleanupOfflineRunners(organization: string, githubToken?: string): Promise<{removed: number, failed: number, errors: string[]}> {
        this.logger.info(`🧹 Cleaning up offline runners for organization: ${organization}`);

        try {
            // Add delay to allow GitHub to mark runners as offline after Kubernetes termination
            this.logger.info('⏳ Waiting 10 seconds for GitHub to update runner status...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Try multiple times with increasing delays to catch runners that might be slow to update
            let allTargetRunners: any[] = [];
            const maxRetries = 3;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                this.logger.info(`🔍 Attempt ${attempt}/${maxRetries}: Checking for offline runners...`);
                
                const runners = await this.listOrganizationRunners(organization, githubToken);
                const offlineRunners = runners.filter(runner => runner.status === 'offline');
                
                // Also look for runners with ARC naming patterns that might not be marked offline yet
                const arcRunners = runners.filter(runner => 
                    runner.name && (
                        runner.name.includes('runner-') || 
                        runner.name.includes('tsvi-runners-') ||
                        runner.name.match(/^[a-z]+-runners-[a-z0-9]+-runner-[a-z0-9]+$/i)
                    )
                );
                
                // Combine offline runners and ARC pattern runners, removing duplicates
                const targetRunners = [...offlineRunners];
                arcRunners.forEach(runner => {
                    if (!targetRunners.find(existing => existing.id === runner.id)) {
                        this.logger.info(`🎯 Found ARC runner (not marked offline yet): ${runner.name} (${runner.status})`);
                        targetRunners.push(runner);
                    }
                });
                
                this.logger.info(`Found ${offlineRunners.length} offline runners and ${targetRunners.length - offlineRunners.length} ARC pattern runners`);
                
                // If we found runners, use them. Otherwise, try again after a delay
                if (targetRunners.length > 0) {
                    allTargetRunners = targetRunners;
                    break;
                } else if (attempt < maxRetries) {
                    this.logger.info(`⏳ No runners found, waiting 5 seconds before retry ${attempt + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
            
            if (allTargetRunners.length === 0) {
                this.logger.info('✅ No offline or ARC runners found');
                return { removed: 0, failed: 0, errors: [] };
            }

            this.logger.info(`Found ${allTargetRunners.length} runners to remove`);
            
            let removed = 0;
            let failed = 0;
            const errors: string[] = [];

                        // Remove runners in parallel with concurrency limit
            const concurrency = 5;
            for (let i = 0; i < allTargetRunners.length; i += concurrency) {
                const batch = allTargetRunners.slice(i, i + concurrency);
                const promises = batch.map(async (runner: any) => {
                    try {
                        const success = await this.removeOrganizationRunner(organization, runner.id, githubToken);
                        if (success) {
                            removed++;
                            this.logger.info(`✅ Removed runner: ${runner.name} (${runner.id}) - Status was: ${runner.status}`);
                        } else {
                            failed++;
                            const error = `Failed to remove runner: ${runner.name} (${runner.id})`;
                            errors.push(error);
                        }
                    } catch (error) {
                        failed++;
                        const errorMsg = `Error removing runner ${runner.name} (${runner.id}): ${error}`;
                        errors.push(errorMsg);
                        this.logger.error(`❌ ${errorMsg}`);
                    }
                });

                await Promise.all(promises);
                
                // Small delay between batches to avoid rate limiting
                if (i + concurrency < allTargetRunners.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            this.logger.info(`🎯 Cleanup complete: ${removed} removed, ${failed} failed`);
            return { removed, failed, errors };

        } catch (error) {
            this.logger.error(`❌ Failed to cleanup offline runners: ${error}`);
            throw error;
        }
    }
}