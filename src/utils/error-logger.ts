import fs from 'fs';
import path from 'path';

export interface ErrorLog {
  timestamp: string;
  taskId?: string;
  errorType: 'API' | 'File' | 'Validation' | 'Network' | 'Unknown';
  operation: string;
  message: string;
  details?: string;
}

export class ErrorLogger {
  private static errorDir = path.join(process.cwd(), 'errors');

  /**
   * Log an error to markdown file
   * @param error - Error log entry
   */
  static log(error: ErrorLog): void {
    // Ensure errors directory exists
    if (!fs.existsSync(this.errorDir)) {
      fs.mkdirSync(this.errorDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date();
    const filename = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}-${String(timestamp.getMinutes()).padStart(2, '0')}.md`;
    const filePath = path.join(this.errorDir, filename);

    // Format error as markdown
    const markdown = this.formatErrorAsMarkdown(error);

    // Append to file (or create if doesn't exist)
    if (fs.existsSync(filePath)) {
      fs.appendFileSync(filePath, '\n' + markdown, 'utf-8');
    } else {
      const header = `# Error Log - ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}\n\n`;
      fs.writeFileSync(filePath, header + markdown, 'utf-8');
    }
  }

  /**
   * Format error as markdown
   * @param error - Error log entry
   * @returns Markdown formatted string
   */
  private static formatErrorAsMarkdown(error: ErrorLog): string {
    let markdown = `## ${error.errorType} Error\n\n`;
    markdown += `**Time:** ${error.timestamp}\n`;

    if (error.taskId) {
      markdown += `**Task ID:** ${error.taskId}\n`;
    }

    markdown += `**Operation:** ${error.operation}\n`;
    markdown += `**Message:** ${error.message}\n`;

    if (error.details) {
      markdown += `\n**Details:**\n\`\`\`\n${error.details}\n\`\`\`\n`;
    }

    markdown += '\n---\n';

    return markdown;
  }

  /**
   * Create error log entry from Error object
   * @param error - Error object
   * @param taskId - Optional task ID
   * @param operation - Operation that failed
   * @returns ErrorLog entry
   */
  static createLog(
    error: Error,
    taskId: string | undefined,
    operation: string
  ): ErrorLog {
    return {
      timestamp: new Date().toISOString(),
      taskId,
      errorType: this.categorizeError(error),
      operation,
      message: error.message,
      details: error.stack,
    };
  }

  /**
   * Categorize error by type
   * @param error - Error object
   * @returns Error type
   */
  private static categorizeError(
    error: Error
  ): 'API' | 'File' | 'Validation' | 'Network' | 'Unknown' {
    const message = error.message.toLowerCase();

    if (
      message.includes('authentication') ||
      message.includes('401') ||
      message.includes('403') ||
      message.includes('404') ||
      message.includes('429')
    ) {
      return 'API';
    }

    if (
      message.includes('enoent') ||
      message.includes('file') ||
      message.includes('no such file') ||
      message.includes('read')
    ) {
      return 'File';
    }

    if (
      message.includes('validation') ||
      message.includes('missing required') ||
      message.includes('must be') ||
      message.includes('invalid json')
    ) {
      return 'Validation';
    }

    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset')
    ) {
      return 'Network';
    }

    return 'Unknown';
  }
}
