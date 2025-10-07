/**
 * Progress Reporter for Real-time Updates in Copilot Chat
 * 
 * Provides streaming progress updates that appear in the Copilot chat interface
 * instead of requiring users to check Docker logs separately.
 */

export interface ProgressUpdate {
    phase: string;
    progress: number; // 0-100
    message: string;
    timestamp: string;
    details?: string;
    diagram?: string;
    aiInsight?: string;
}

export interface ProgressReporter {
    updateProgress(update: ProgressUpdate): void;
    complete(finalMessage: string): void;
    error(errorMessage: string): void;
}

/**
 * Creates a progress reporter that can send real-time updates to Copilot
 */
export function createProgressReporter(
    onProgress: (update: ProgressUpdate) => void,
    onComplete: (message: string) => void,
    onError: (error: string) => void
): ProgressReporter {
    return {
        updateProgress: onProgress,
        complete: onComplete,
        error: onError
    };
}

/**
 * Formats progress updates for optimal display in Copilot chat
 */
export function formatProgressForChat(update: ProgressUpdate): string {
    const progressBar = createProgressBar(update.progress);
    const timestamp = new Date(update.timestamp).toLocaleTimeString();
    
    let output = `## 🚀 ${update.phase}\n\n`;
    output += `**Progress:** ${update.progress}% ${progressBar}\n\n`;
    output += `**Status:** ${update.message}\n\n`;
    output += `*Updated at ${timestamp}*\n\n`;
    
    if (update.details) {
        output += `**Details:** ${update.details}\n\n`;
    }
    
    if (update.aiInsight) {
        output += `🧠 **AI Insight:** ${update.aiInsight}\n\n`;
    }
    
    if (update.diagram) {
        output += `\`\`\`\n${update.diagram}\n\`\`\`\n\n`;
    }
    
    return output;
}

/**
 * Creates a visual progress bar for the chat interface
 */
function createProgressBar(progress: number, width: number = 20): string {
    const filled = Math.floor((progress / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

/**
 * Enhanced logger that provides real-time chat updates
 */
export class ChatAwareLogger {
    private progressReporter?: ProgressReporter;
    private baseLogger: any;
    
    constructor(baseLogger: any, progressReporter?: ProgressReporter) {
        this.baseLogger = baseLogger;
        this.progressReporter = progressReporter;
    }
    
    info(message: string, meta?: any): void {
        this.baseLogger.info(message, meta);
        
        // Send to chat if this looks like a progress update
        if (this.progressReporter && this.isProgressMessage(message)) {
            const update = this.parseProgressMessage(message, meta);
            if (update) {
                this.progressReporter.updateProgress(update);
            }
        }
    }
    
    warn(message: string, meta?: any): void {
        this.baseLogger.warn(message, meta);
    }
    
    error(message: string, meta?: any): void {
        this.baseLogger.error(message, meta);
        
        // Only forward critical errors to chat, suppress expected failures
        if (this.progressReporter && this.isCriticalError(message)) {
            this.progressReporter.error(message);
        }
    }
    
    private isCriticalError(message: string): boolean {
        // Don't show these expected/recoverable errors in chat
        const expectedErrors = [
            'Command failed',
            'not found',
            'already exists',
            'No resources found',
            'connection refused',
            'timeout',
            'EOF'
        ];
        
        // Don't show if it's an expected error
        if (expectedErrors.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()))) {
            return false;
        }
        
        // Only show truly critical errors
        const criticalPatterns = [
            'All strategies failed',
            'manual intervention required',
            'Installation recovery failed',
            'authentication failed',
            'permission denied'
        ];
        
        return criticalPatterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()));
    }
    
    private isProgressMessage(message: string): boolean {
        const progressIndicators = [
            '🔍', '📊', '🚀', '🛡️', '✅', '🏃‍♂️',
            'Phase', 'Installing', 'Configuring', 'Validating'
        ];
        return progressIndicators.some(indicator => message.includes(indicator));
    }
    
    private parseProgressMessage(message: string, meta?: any): ProgressUpdate | null {
        // Extract phase information from the message
        let phase = 'Unknown';
        let progress = 0;
        
        if (message.includes('Phase 1') || message.includes('Prerequisites')) {
            phase = 'Prerequisites Validation';
            progress = 15;
        } else if (message.includes('Phase 2') || message.includes('Assessment')) {
            phase = 'Environment Assessment';
            progress = 30;
        } else if (message.includes('Phase 3') || message.includes('Installation')) {
            phase = 'ARC Installation';
            progress = 60;
        } else if (message.includes('Phase 4') || message.includes('Security')) {
            phase = 'Security Hardening';
            progress = 75;
        } else if (message.includes('Phase 5') || message.includes('Validation')) {
            phase = 'Validation & Testing';
            progress = 90;
        } else if (message.includes('Phase 6') || message.includes('Runner')) {
            phase = 'Runner Configuration';
            progress = 100;
        }
        
        return {
            phase,
            progress,
            message: message.replace(/^[🔍📊🚀🛡️✅🏃‍♂️]\s*/, '').trim(),
            timestamp: new Date().toISOString(),
            details: meta?.details,
            aiInsight: meta?.aiInsight
        };
    }
}