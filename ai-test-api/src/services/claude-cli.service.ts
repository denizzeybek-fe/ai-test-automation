import { exec } from 'child_process';
import { promisify } from 'util';
import { ErrorCode } from '../types/error-codes.js';

const execAsync = promisify(exec);

/**
 * Service for interacting with Claude CLI for automatic test case generation
 * Uses local Claude CLI installation (user's subscription, no extra API cost)
 */
export class ClaudeCliService {
  /**
   * Check if Claude CLI is installed and available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('which claude');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get human-friendly status message about CLI availability
   */
  async getStatusMessage(): Promise<string> {
    const available = await this.isAvailable();
    if (available) {
      return 'Claude CLI is installed. Using local Claude (your subscription, no extra cost).';
    }
    return 'Claude CLI not found. Install with: npm install -g @anthropics/claude-code';
  }

  /**
   * Generate test cases from a prompt using Claude CLI
   * @param prompt The prompt to send to Claude
   * @returns Claude's response as string
   * @throws Error if CLI is not available or execution fails
   */
  async generateTestCases(prompt: string): Promise<string> {
    const available = await this.isAvailable();
    if (!available) {
      const error = new Error('Claude CLI not installed. Please install with: npm install -g @anthropics/claude-code') as Error & { code: ErrorCode };
      error.code = ErrorCode.CLAUDE_TOKEN_NOT_CONFIGURED;
      throw error;
    }

    try {
      // Write prompt to temporary file to avoid shell escaping issues
      const fs = await import('fs/promises');
      const os = await import('os');
      const path = await import('path');

      const tmpFile = path.join(os.tmpdir(), `claude-prompt-${Date.now()}.txt`);
      await fs.writeFile(tmpFile, prompt, 'utf-8');

      try {
        // Execute Claude CLI with prompt from file
        // --tools "" disables all tools to prevent external API calls
        // Inherit environment but remove variables that may interfere with Claude CLI
        const cleanEnv = { ...process.env };
        delete cleanEnv.NODE_TLS_REJECT_UNAUTHORIZED;
        delete cleanEnv.ANTHROPIC_API_KEY; // Remove invalid OAuth token from .env

        const { stdout, stderr } = await execAsync(
          `cat "${tmpFile}" | claude -p --tools ""`,
          {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large responses
            timeout: 120000, // 2 minute timeout
            env: cleanEnv,
          }
        );

        // Clean up temp file
        await fs.unlink(tmpFile).catch(() => {
          /* ignore cleanup errors */
        });

        if (stderr && stderr.trim().length > 0) {
          // Log stderr but don't fail (Claude CLI may write info to stderr)
          console.warn('Claude CLI stderr:', stderr);
        }

        if (!stdout || stdout.trim().length === 0) {
          const error = new Error('Claude CLI returned empty response') as Error & {
            code: ErrorCode;
          };
          error.code = ErrorCode.INVALID_RESPONSE;
          throw error;
        }

        // Extract JSON from markdown code blocks if present
        let response = stdout.trim();
        const jsonMatch = response.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          response = jsonMatch[1].trim();
        }

        return response;
      } catch (execError) {
        // Clean up temp file on error
        await fs.unlink(tmpFile).catch(() => {
          /* ignore cleanup errors */
        });

        // Extract error message from exec error
        if (execError && typeof execError === 'object') {
          if ('stderr' in execError) {
            const stderr = (execError as { stderr: string }).stderr;
            if (stderr && stderr.trim().length > 0) {
              const error = new Error(`Claude CLI failed: ${stderr}`) as Error & {
                code: ErrorCode;
              };
              error.code = ErrorCode.CLAUDE_API_ERROR;
              throw error;
            }
          }
          // If no stderr, check stdout for error messages
          if ('stdout' in execError) {
            const stdout = (execError as { stdout: string }).stdout;
            if (stdout && stdout.includes('Invalid API key')) {
              const error = new Error(
                'Claude CLI authentication failed. Please ensure Claude CLI is properly authenticated with "claude login"'
              ) as Error & {
                code: ErrorCode;
              };
              error.code = ErrorCode.CLAUDE_TOKEN_NOT_CONFIGURED;
              throw error;
            }
          }
        }

        throw execError;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Check if it's already our custom error
        if ('code' in error) {
          throw error;
        }

        // Wrap exec errors
        const wrappedError = new Error(`Claude CLI execution failed: ${error.message}`) as Error & { code: ErrorCode };
        wrappedError.code = ErrorCode.CLAUDE_API_ERROR;
        throw wrappedError;
      }

      // Unknown error
      const unknownError = new Error('Unknown error occurred while calling Claude CLI') as Error & { code: ErrorCode };
      unknownError.code = ErrorCode.INTERNAL_SERVER_ERROR;
      throw unknownError;
    }
  }
}

// Export singleton instance
export const claudeCliService = new ClaudeCliService();
