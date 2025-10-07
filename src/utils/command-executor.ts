/**
 * Command Executor Utility
 * 
 * Provides safe and robust CLI command execution for kubectl, helm, and other tools.
 * Includes logging, error handling, and command validation.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    command: string;
    duration: number;
}

export interface CommandOptions {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
    maxBuffer?: number;
    dryRun?: boolean;
}

export class CommandExecutor {
    private logger: any;
    private commandHistory: CommandResult[] = [];

    constructor(logger: any) {
        this.logger = logger;
    }

    /**
     * Execute a kubectl command
     */
    async kubectl(args: string, options?: CommandOptions): Promise<CommandResult> {
        return this.execute('kubectl', args, options);
    }

    /**
     * Execute a kubectl command silently (for expected failures)
     */
    async kubectlSilently(args: string, options?: CommandOptions): Promise<CommandResult> {
        return this.executeSilently('kubectl', args, options);
    }

    /**
     * Execute a helm command
     */
    async helm(args: string, options?: CommandOptions): Promise<CommandResult> {
        return this.execute('helm', args, options);
    }

    /**
     * Execute a git command
     */
    async git(args: string, options?: CommandOptions): Promise<CommandResult> {
        return this.execute('git', args, options);
    }

    /**
     * Execute an arbitrary command (use with caution)
     */
    async execute(command: string, args: string, options: CommandOptions = {}): Promise<CommandResult> {
        const fullCommand = `${command} ${args}`;
        const startTime = Date.now();

        // Redact sensitive information from logs
        const sanitizedCommand = this.sanitizeCommand(fullCommand);
        const sanitizedArgs = this.sanitizeCommand(args);

        this.logger.info(`Executing command: ${sanitizedCommand}`, {
            command,
            args: sanitizedArgs,
            dryRun: options.dryRun || false
        });

        // Dry run mode - just log and return mock result
        if (options.dryRun) {
            this.logger.info(`[DRY RUN] Would execute: ${fullCommand}`);
            return {
                stdout: `[DRY RUN] ${fullCommand}`,
                stderr: '',
                exitCode: 0,
                command: fullCommand,
                duration: 0
            };
        }

        try {
            const execOptions = {
                timeout: options.timeout || 300000, // 5 minutes default
                cwd: options.cwd || process.cwd(),
                env: { ...process.env, ...options.env },
                maxBuffer: options.maxBuffer || 10 * 1024 * 1024, // 10MB default
            };

            const { stdout, stderr } = await execAsync(fullCommand, execOptions);
            const duration = Date.now() - startTime;

            const result: CommandResult = {
                stdout: stdout.toString().trim(),
                stderr: stderr.toString().trim(),
                exitCode: 0,
                command: fullCommand,
                duration
            };

            this.commandHistory.push(result);
            this.logger.info(`Command completed successfully`, {
                command: fullCommand,
                duration: `${duration}ms`,
                stdoutLength: result.stdout.length
            });

            return result;

        } catch (error: any) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            const result: CommandResult = {
                stdout: error.stdout?.toString().trim() || '',
                stderr: error.stderr?.toString().trim() || errorMessage,
                exitCode: error.code || 1,
                command: fullCommand,
                duration
            };

            this.commandHistory.push(result);
            
            // Use different logging level for expected vs critical failures
            if (this.isExpectedFailure(fullCommand, result.stderr)) {
                this.logger.info(`Command completed with expected failure`, {
                    command: fullCommand,
                    exitCode: result.exitCode,
                    stderr: result.stderr,
                    duration: `${duration}ms`
                });
            } else {
                this.logger.error(`Command failed`, {
                    command: fullCommand,
                    exitCode: result.exitCode,
                    stderr: result.stderr,
                    duration: `${duration}ms`
                });
            }

            throw new Error(`Command failed: ${fullCommand}\n${result.stderr}`);
        }
    }

    /**
     * Execute a command silently (suppresses error logging for expected failures)
     * Use this for operations that might fail due to resources not existing, etc.
     */
    async executeSilently(command: string, args: string, options: CommandOptions = {}): Promise<CommandResult> {
        const fullCommand = `${command} ${args}`;
        const startTime = Date.now();

        // Create a silent logger that doesn't forward errors to progress reporter
        const silentLogger = {
            info: this.logger.info.bind(this.logger),
            warn: this.logger.warn.bind(this.logger),
            error: (message: string, meta?: any) => {
                // Only log to base logger, don't trigger ChatAwareLogger.error()
                if (this.logger.baseLogger) {
                    this.logger.baseLogger.error(message, meta);
                } else {
                    // Fallback if not using ChatAwareLogger
                    this.logger.error(message, meta);
                }
            }
        };

        // Temporarily swap logger
        const originalLogger = this.logger;
        this.logger = silentLogger;

        try {
            const result = await this.execute(command, args, options);
            this.logger = originalLogger;
            return result;
        } catch (error) {
            this.logger = originalLogger;
            throw error;
        }
    }

    /**
     * Check if a CLI tool is available
     */
    async checkTool(tool: string): Promise<{ available: boolean; version?: string }> {
        try {
            const result = await this.execute(tool, '--version', { timeout: 5000 });
            return {
                available: true,
                version: result.stdout.split('\n')[0]
            };
        } catch (error) {
            return { available: false };
        }
    }

    /**
     * Validate all required tools are installed
     */
    async validatePrerequisites(required: string[] = ['kubectl', 'helm']): Promise<{
        allPresent: boolean;
        missing: string[];
        available: Record<string, string>;
    }> {
        this.logger.info('Validating CLI prerequisites', { required });

        const results = await Promise.all(
            required.map(async (tool) => ({
                tool,
                check: await this.checkTool(tool)
            }))
        );

        const missing = results
            .filter(r => !r.check.available)
            .map(r => r.tool);

        const available = results
            .filter(r => r.check.available)
            .reduce((acc, r) => {
                acc[r.tool] = r.check.version || 'unknown';
                return acc;
            }, {} as Record<string, string>);

        const allPresent = missing.length === 0;

        if (allPresent) {
            this.logger.info('✅ All prerequisites available', { available });
        } else {
            this.logger.warn('⚠️ Missing prerequisites', { missing, available });
        }

        return { allPresent, missing, available };
    }

    /**
     * Get command execution history
     */
    getHistory(): CommandResult[] {
        return [...this.commandHistory];
    }

    /**
     * Clear command history
     */
    clearHistory(): void {
        this.commandHistory = [];
    }

    /**
     * Sanitize commands by redacting sensitive information
     */
    private sanitizeCommand(command: string): string {
        // Redact GitHub tokens (various patterns)
        let sanitized = command.replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_[REDACTED]');
        
        // Redact other common token patterns
        sanitized = sanitized.replace(/ghs_[a-zA-Z0-9]{36}/g, 'ghs_[REDACTED]');
        sanitized = sanitized.replace(/github_pat_[a-zA-Z0-9_]{22,255}/g, 'github_pat_[REDACTED]');
        
        // Redact from-literal patterns
        sanitized = sanitized.replace(/--from-literal=github_token="[^"]*"/g, '--from-literal=github_token="[REDACTED]"');
        sanitized = sanitized.replace(/--from-literal=github_token=[^\s]*/g, '--from-literal=github_token=[REDACTED]');
        
        // Redact environment variables
        sanitized = sanitized.replace(/GITHUB_TOKEN=[^\s]*/g, 'GITHUB_TOKEN=[REDACTED]');
        
        // Redact Helm set values
        sanitized = sanitized.replace(/--set\s+[^=]*\.token=[^\s]*/g, '--set auth.token=[REDACTED]');
        sanitized = sanitized.replace(/--set\s+auth\.token=[^\s]*/g, '--set auth.token=[REDACTED]');
        
        // Redact password fields
        sanitized = sanitized.replace(/--password\s+[^\s]*/g, '--password [REDACTED]');
        sanitized = sanitized.replace(/--password=[^\s]*/g, '--password=[REDACTED]');
        sanitized = sanitized.replace(/--docker-password=[^\s]*/g, '--docker-password=[REDACTED]');
        
        return sanitized;
    }

    /**
     * Get statistics about command execution
     */
    getStats(): {
        totalCommands: number;
        successfulCommands: number;
        failedCommands: number;
        averageDuration: number;
        totalDuration: number;
    } {
        const total = this.commandHistory.length;
        const successful = this.commandHistory.filter(r => r.exitCode === 0).length;
        const failed = total - successful;
        const totalDuration = this.commandHistory.reduce((sum, r) => sum + r.duration, 0);
        const avgDuration = total > 0 ? totalDuration / total : 0;

        return {
            totalCommands: total,
            successfulCommands: successful,
            failedCommands: failed,
            averageDuration: Math.round(avgDuration),
            totalDuration
        };
    }

    /**
     * Determine if a command failure is expected (like trying to delete non-existent resources)
     */
    private isExpectedFailure(command: string, stderr: string): boolean {
        const expectedFailurePatterns = [
            // Kubernetes not found errors
            { command: 'kubectl.*get', error: 'not found' },
            { command: 'kubectl.*delete', error: 'not found' },
            { command: 'kubectl.*delete', error: 'No resources found' },
            
            // Helm not found errors
            { command: 'helm.*delete', error: 'not found' },
            { command: 'helm.*uninstall', error: 'not found' },
            
            // Already exists errors (race conditions)
            { command: 'kubectl.*create', error: 'already exists' },
            
            // Resource already deleted (parallel operations)
            { command: 'kubectl.*patch', error: 'not found' },
            { command: 'kubectl.*annotate', error: 'not found' }
        ];

        return expectedFailurePatterns.some(pattern => {
            const commandMatch = new RegExp(pattern.command, 'i').test(command);
            const errorMatch = stderr.toLowerCase().includes(pattern.error.toLowerCase());
            return commandMatch && errorMatch;
        });
    }
}
