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

        this.logger.info(`Executing command: ${fullCommand}`, {
            command,
            args,
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
            this.logger.error(`Command failed`, {
                command: fullCommand,
                exitCode: result.exitCode,
                stderr: result.stderr,
                duration: `${duration}ms`
            });

            throw new Error(`Command failed: ${fullCommand}\n${result.stderr}`);
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
}
