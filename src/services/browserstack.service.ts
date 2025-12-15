import axios, { AxiosInstance, AxiosError } from 'axios';
import { BrowserStackTestCase, BrowserStackTestRun, TestCase } from '../types/index.js';

export interface BrowserStackFolder {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface CreateTestCasePayload {
  name: string;
  description: string;
  preconditions?: string;
  test_case_steps: Array<{
    step: string;
    result: string;
  }>;
  tags?: string[];
}

export class BrowserStackService {
  private client: AxiosInstance;
  private projectId: string;

  constructor(username: string, accessKey: string, projectId: string) {
    this.projectId = projectId;
    this.client = axios.create({
      baseURL: 'https://test-management.browserstack.com/api/v2',
      auth: {
        username,
        password: accessKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * List all test runs in the project
   */
  async listTestRuns(): Promise<BrowserStackTestRun[]> {
    try {
      const response = await this.client.get(
        `/projects/${this.projectId}/test-runs`
      );
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to list test runs');
    }
  }

  /**
   * Get a specific test run by ID
   */
  async getTestRun(testRunId: string): Promise<BrowserStackTestRun> {
    try {
      const response = await this.client.get(
        `/projects/${this.projectId}/test-runs/${testRunId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get test run ${testRunId}`);
    }
  }

  /**
   * Find test run by task ID (searches in title/description)
   */
  async findTestRunByTaskId(taskId: string): Promise<BrowserStackTestRun | null> {
    try {
      const testRuns = await this.listTestRuns();
      const found = testRuns.find(
        (run) =>
          run.title.includes(taskId) || run.description?.includes(taskId)
      );
      return found || null;
    } catch (error) {
      throw this.handleError(error, `Failed to find test run for task ${taskId}`);
    }
  }

  /**
   * List all folders in the project
   */
  async listFolders(): Promise<BrowserStackFolder[]> {
    try {
      const response = await this.client.get(
        `/projects/${this.projectId}/folders`
      );
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to list folders');
    }
  }

  /**
   * Find subfolder by parent ID and name
   */
  async findSubfolder(
    parentId: number,
    name: string
  ): Promise<BrowserStackFolder | null> {
    try {
      const response = await this.client.get(
        `/projects/${this.projectId}/folders/${parentId}/sub-folders`
      );
      const subfolders: BrowserStackFolder[] = response.data.data || [];
      const found = subfolders.find(
        (folder) => folder.name.toLowerCase() === name.toLowerCase()
      );
      return found || null;
    } catch (error) {
      throw this.handleError(error, `Failed to find subfolder '${name}'`);
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(
    name: string,
    parentId: number
  ): Promise<BrowserStackFolder> {
    try {
      const response = await this.client.post(
        `/projects/${this.projectId}/folders`,
        {
          name,
          parent_id: parentId,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to create folder '${name}'`);
    }
  }

  /**
   * Create a test case in a folder
   */
  async createTestCase(
    folderId: number,
    testCase: CreateTestCasePayload
  ): Promise<BrowserStackTestCase> {
    try {
      const response = await this.client.post(
        `/projects/${this.projectId}/folders/${folderId}/test-cases`,
        testCase
      );
      return {
        identifier: response.data.identifier,
        title: response.data.name,
        folder_id: folderId,
      };
    } catch (error) {
      throw this.handleError(error, `Failed to create test case '${testCase.name}'`);
    }
  }

  /**
   * Update test run with test cases (PATCH - replaces the list)
   */
  async updateTestRunCases(
    testRunId: string,
    testCaseIds: string[]
  ): Promise<void> {
    try {
      await this.client.patch(
        `/projects/${this.projectId}/test-runs/${testRunId}/update`,
        {
          test_run: {
            test_cases: testCaseIds,
          },
        }
      );
    } catch (error) {
      throw this.handleError(error, `Failed to update test run ${testRunId}`);
    }
  }

  /**
   * Error handler with categorization
   */
  private handleError(error: unknown, message: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as { message?: string };

      // Categorize errors
      if (status === 401 || status === 403) {
        return new Error(`${message}: Authentication failed`);
      }
      if (status === 404) {
        return new Error(`${message}: Resource not found`);
      }
      if (status === 409) {
        return new Error(`${message}: Duplicate resource (conflict)`);
      }
      if (status === 429) {
        return new Error(`${message}: Rate limit exceeded`);
      }

      const errorMessage = data?.message || axiosError.message;
      return new Error(`${message}: ${errorMessage}`);
    }

    return new Error(`${message}: ${String(error)}`);
  }
}
