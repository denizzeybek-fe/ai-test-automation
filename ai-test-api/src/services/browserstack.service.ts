import axios, { AxiosInstance, AxiosError } from 'axios';
import { BrowserStackTestCase, BrowserStackTestRun } from '../types/index.js';

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
      const response = await this.client.get<{ success: boolean; test_runs: BrowserStackTestRun[] }>(
        `/projects/${this.projectId}/test-runs`
      );
      return response.data.test_runs || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to list test runs');
    }
  }

  /**
   * Get a specific test run by ID
   */
  async getTestRun(testRunId: string): Promise<BrowserStackTestRun> {
    try {
      const response = await this.client.get<{ success: boolean; data: BrowserStackTestRun }>(
        `/projects/${this.projectId}/test-runs/${testRunId}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get test run ${testRunId}`);
    }
  }

  /**
   * Find test run by task ID (searches in name field which contains task ID)
   */
  async findTestRunByTaskId(taskId: string): Promise<BrowserStackTestRun | null> {
    try {
      const testRuns = await this.listTestRuns();
      // In BrowserStack API, the "name" field contains task ID (e.g., "PA-34858")
      // UI shows this as TITLE column with description below
      const found = testRuns.find((run) => {
        if (!run.name) return false;
        // Check if name equals task ID exactly or contains it
        return run.name === taskId || run.name.includes(taskId);
      });
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
      const response = await this.client.get<{ success: boolean; folders: BrowserStackFolder[] }>(
        `/projects/${this.projectId}/folders`
      );
      return response.data.folders || [];
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
      // Get all folders and filter by parent_id
      const allFolders = await this.listFolders();
      const found = allFolders.find(
        (folder) =>
          folder.parent_id === parentId &&
          folder.name.toLowerCase() === name.toLowerCase()
      );
      return found || null;
    } catch (error) {
      throw this.handleError(error, `Failed to find subfolder '${name}'`);
    }
  }

  /**
   * Find subfolder by name or create if doesn't exist
   */
  async findOrCreateSubfolder(
    parentId: number,
    name: string
  ): Promise<BrowserStackFolder> {
    try {
      // First try to find existing subfolder
      const existing = await this.findSubfolder(parentId, name);
      if (existing) {
        console.log(`📁 Using existing subfolder: ${name} (ID: ${existing.id})`);
        return existing;
      }

      // If not found, create new subfolder
      console.log(`📁 Creating new subfolder: ${name}`);
      return await this.createFolder(name, parentId);
    } catch (error) {
      throw this.handleError(error, `Failed to find or create subfolder '${name}'`);
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
      const response = await this.client.post<{ success: boolean; folder: BrowserStackFolder }>(
        `/projects/${this.projectId}/folders`,
        {
          folder: {
            name,
            parent_id: parentId,
          },
        }
      );

      // Extract folder data from response
      const folderData = response.data.folder;
      console.log(`✅ Created folder: ${folderData.name} (ID: ${folderData.id})`);
      return {
        id: folderData.id,
        name: folderData.name,
        parent_id: folderData.parent_id,
      };
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
      // BrowserStack API expects the payload wrapped in "test_case" key
      // Docs: https://www.browserstack.com/docs/test-management/api-reference/test-cases
      const payload = {
        test_case: {
          name: testCase.name,
          description: testCase.description,
          preconditions: testCase.preconditions,
          test_case_steps: testCase.test_case_steps.map((step) => ({
            step: step.step,
            result: step.result,
          })),
          tags: testCase.tags,
        },
      };

      const response = await this.client.post(
        `/projects/${this.projectId}/folders/${folderId}/test-cases`,
        payload
      );

      // BrowserStack returns nested response: { data: { test_case: {...} } }
      const responseData = response.data as { data?: { test_case?: Record<string, unknown> } };
      const testCaseData = responseData.data?.test_case || {};

      const identifier = (testCaseData.identifier || testCaseData.id) as string;
      const title = (testCaseData.title || testCaseData.name) as string;

      console.log(`✅ Created test case: ${identifier} - ${title}`);

      return {
        identifier,
        title,
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
   * Find test plan by name
   */
  async findTestPlanByName(name: string): Promise<{ identifier: string; name: string } | null> {
    try {
      const response = await this.client.get<{
        success: boolean;
        test_plans: Array<{ identifier: string; name: string }>;
      }>(`/projects/${this.projectId}/test-plans`);

      const testPlans = response.data.test_plans || [];
      const found = testPlans.find(
        (plan) => plan.name.toLowerCase() === name.toLowerCase()
      );

      return found || null;
    } catch (error) {
      console.warn(`Could not search test plans: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Create a new test run
   */
  async createTestRun(
    name: string,
    description?: string,
    testPlanId?: string
  ): Promise<BrowserStackTestRun> {
    try {
      const payload: {
        test_run: {
          name: string;
          description: string;
          test_plan_id?: string;
        };
      } = {
        test_run: {
          name,
          description: description || `Test run for ${name}`,
        },
      };

      if (testPlanId) {
        payload.test_run.test_plan_id = testPlanId;
      }

      const response = await this.client.post<{ success: boolean; test_run: BrowserStackTestRun }>(
        `/projects/${this.projectId}/test-runs`,
        payload
      );

      const testRun = response.data.test_run;
      const planInfo = testPlanId ? ` (linked to ${testPlanId})` : '';
      console.log(`✅ Created test run: ${testRun.identifier} - ${testRun.name}${planInfo}`);
      return testRun;
    } catch (error) {
      throw this.handleError(error, `Failed to create test run '${name}'`);
    }
  }

  /**
   * Find test run by task ID or create if not exists
   * @param taskId - Task ID (e.g., PA-12345)
   * @param taskTitle - Task title for description
   * @param sprintName - Sprint name to find matching test plan
   */
  async findOrCreateTestRun(
    taskId: string,
    taskTitle?: string,
    sprintName?: string
  ): Promise<BrowserStackTestRun> {
    // First try to find existing test run
    const existing = await this.findTestRunByTaskId(taskId);
    if (existing) {
      console.log(`📋 Using existing test run: ${existing.identifier}`);
      return existing;
    }

    // Try to find test plan by sprint name
    let testPlanId: string | undefined;
    if (sprintName) {
      const testPlan = await this.findTestPlanByName(sprintName);
      if (testPlan) {
        testPlanId = testPlan.identifier;
        console.log(`📋 Found matching test plan: ${testPlan.identifier} (${testPlan.name})`);
      } else {
        console.log(`⚠️  No test plan found for sprint: ${sprintName}`);
      }
    }

    // Create new test run (with test plan if found)
    console.log(`📋 Creating new test run for ${taskId}...`);
    return await this.createTestRun(taskId, taskTitle, testPlanId);
  }

  /**
   * Error handler with categorization
   */
  private handleError(error: unknown, message: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as { message?: string; errors?: unknown };

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

      // For 400 errors, include full response data for debugging
      if (status === 400) {
        const errorDetails = data?.errors
          ? JSON.stringify(data.errors, null, 2)
          : JSON.stringify(data, null, 2);
        return new Error(`${message}: Bad Request - ${errorDetails}`);
      }

      const errorMessage = data?.message || axiosError.message;
      return new Error(`${message}: ${errorMessage}`);
    }

    return new Error(`${message}: ${String(error)}`);
  }
}
