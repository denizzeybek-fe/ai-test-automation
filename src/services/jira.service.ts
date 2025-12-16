import axios, { AxiosInstance, AxiosError } from 'axios';
import { TaskInfo } from '../types/index.js';

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description?: string;
    customfield_10037?: string; // Root Cause
    customfield_10038?: string; // Test Case Description
    [key: string]: unknown;
  };
}

interface JiraSprintIssuesResponse {
  issues: Array<{ key: string }>;
}

export class JiraService {
  private client: AxiosInstance;

  constructor(baseUrl: string, email: string, apiToken: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      auth: {
        username: email,
        password: apiToken,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Get task information from Jira
   * @param taskId - Jira task ID (e.g., PA-12345)
   * @returns Task information
   */
  async getTask(taskId: string): Promise<TaskInfo> {
    try {
      const response = await this.client.get<JiraIssue>(
        `/rest/api/3/issue/${taskId}`
      );

      const issue = response.data;
      // Description can be string or object (ADF format)
      const description = this.parseDescription(issue.fields.description);

      // Extract URLs from description
      const figmaUrl = this.extractFigmaUrl(description);
      const confluenceUrl = this.extractConfluenceUrl(description);

      return {
        id: issue.key,
        title: issue.fields.summary,
        description: description,
        rootCause: issue.fields.customfield_10037 || undefined,
        testCaseDescription: issue.fields.customfield_10038 || undefined,
        figmaUrl,
        confluenceUrl,
      };
    } catch (error) {
      throw this.handleError(error, `Failed to get task ${taskId}`);
    }
  }

  /**
   * Get all tasks in a sprint
   * @param sprintId - Sprint ID
   * @returns Array of task IDs
   */
  async getTasksInSprint(sprintId: string): Promise<string[]> {
    try {
      const response = await this.client.get<JiraSprintIssuesResponse>(
        `/rest/agile/1.0/sprint/${sprintId}/issue`
      );

      return response.data.issues.map((issue) => issue.key);
    } catch (error) {
      throw this.handleError(error, `Failed to get tasks in sprint ${sprintId}`);
    }
  }

  /**
   * Parse Jira description (handles both string and ADF format)
   * @param description - Description field from Jira
   * @returns Plain text description
   */
  private parseDescription(description: unknown): string {
    if (!description) return '';

    // If it's already a string, return it
    if (typeof description === 'string') {
      return description;
    }

    // If it's an object (ADF format), extract text content
    if (typeof description === 'object') {
      return JSON.stringify(description);
    }

    return '';
  }

  /**
   * Extract Figma URL from text
   * @param text - Text to search
   * @returns Figma URL or undefined
   */
  private extractFigmaUrl(text: string): string | undefined {
    const figmaPattern = /https?:\/\/(?:www\.)?figma\.com\/[^\s)]+/gi;
    const match = text.match(figmaPattern);
    return match ? match[0] : undefined;
  }

  /**
   * Extract Confluence URL from text
   * @param text - Text to search
   * @returns Confluence URL or undefined
   */
  private extractConfluenceUrl(text: string): string | undefined {
    const confluencePattern = /https?:\/\/[^\s]*atlassian\.net\/wiki\/[^\s)]+/gi;
    const match = text.match(confluencePattern);
    return match ? match[0] : undefined;
  }

  /**
   * Error handler with categorization
   */
  private handleError(error: unknown, message: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as { errorMessages?: string[] };

      // Categorize errors
      if (status === 401 || status === 403) {
        return new Error(`${message}: Authentication failed`);
      }
      if (status === 404) {
        return new Error(`${message}: Task not found`);
      }
      if (status === 429) {
        return new Error(`${message}: Rate limit exceeded`);
      }

      const errorMessage = data?.errorMessages?.[0] || axiosError.message;
      return new Error(`${message}: ${errorMessage}`);
    }

    return new Error(`${message}: ${String(error)}`);
  }
}
