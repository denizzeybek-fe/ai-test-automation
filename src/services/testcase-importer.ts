import fs from 'fs';
import path from 'path';
import { TestCase } from '../types/index.js';

export class TestCaseImporter {
  /**
   * Import test cases from a single task JSON file
   * @param filePath - Relative or absolute path to JSON file
   * @returns Array of test cases
   */
  importSingle(filePath: string): TestCase[] {
    const absolutePath = this.resolveFilePath(filePath);

    // Read file
    const content = this.readJsonFile(absolutePath);

    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Invalid JSON in file: ${filePath}\n${(error as Error).message}`
      );
    }

    // Validate it's an array
    if (!Array.isArray(data)) {
      throw new Error(
        `Expected JSON array, got ${typeof data} in file: ${filePath}`
      );
    }

    // Validate each test case
    const testCases: TestCase[] = [];
    for (let i = 0; i < data.length; i++) {
      const testCase = this.validateTestCase(data[i], i);
      testCases.push(testCase);
    }

    return testCases;
  }

  /**
   * Import test cases from a batch JSON file
   * @param filePath - Relative or absolute path to JSON file
   * @returns Record of task ID to test cases
   */
  importBatch(filePath: string): Record<string, TestCase[]> {
    const absolutePath = this.resolveFilePath(filePath);

    // Read file
    const content = this.readJsonFile(absolutePath);

    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Invalid JSON in file: ${filePath}\n${(error as Error).message}`
      );
    }

    // Validate it's an object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error(
        `Expected JSON object with task IDs as keys, got ${typeof data} in file: ${filePath}`
      );
    }

    // Validate each task's test cases
    const result: Record<string, TestCase[]> = {};

    for (const [taskId, testCasesData] of Object.entries(data)) {
      if (!Array.isArray(testCasesData)) {
        throw new Error(
          `Expected array of test cases for task ${taskId}, got ${typeof testCasesData}`
        );
      }

      const testCases: TestCase[] = [];
      for (let i = 0; i < testCasesData.length; i++) {
        const testCase = this.validateTestCase(testCasesData[i], i, taskId);
        testCases.push(testCase);
      }

      result[taskId] = testCases;
    }

    return result;
  }

  /**
   * Wait for file to exist (with polling)
   * @param filePath - File path to wait for
   * @param timeout - Timeout in milliseconds (default: 5 minutes)
   * @param interval - Polling interval in milliseconds (default: 2 seconds)
   */
  async waitForFile(
    filePath: string,
    timeout: number = 5 * 60 * 1000,
    interval: number = 2000
  ): Promise<void> {
    const absolutePath = this.resolveFilePath(filePath);
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkFile = (): void => {
        if (fs.existsSync(absolutePath)) {
          resolve();
          return;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= timeout) {
          reject(new Error(`Timeout waiting for file: ${filePath}`));
          return;
        }

        setTimeout(checkFile, interval);
      };

      checkFile();
    });
  }

  /**
   * Validate test case structure and return typed object
   * @param data - Unknown data to validate
   * @param index - Index in array (for error messages)
   * @param taskId - Optional task ID (for batch imports)
   * @returns Validated TestCase
   */
  private validateTestCase(
    data: unknown,
    index: number,
    taskId?: string
  ): TestCase {
    const prefix = taskId ? `Task ${taskId}, ` : '';
    const position = `${prefix}Test case #${index + 1}`;

    // Check it's an object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error(`${position}: Expected object, got ${typeof data}`);
    }

    const testCase = data as Record<string, unknown>;

    // Validate required fields
    const requiredFields = ['name', 'description', 'test_case_steps'];
    const missingFields = requiredFields.filter((field) => !(field in testCase));

    if (missingFields.length > 0) {
      throw new Error(
        `${position}: Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validate field types
    if (typeof testCase.name !== 'string') {
      throw new Error(`${position}: 'name' must be a string`);
    }

    if (typeof testCase.description !== 'string') {
      throw new Error(`${position}: 'description' must be a string`);
    }

    if (
      testCase.preconditions !== undefined &&
      typeof testCase.preconditions !== 'string'
    ) {
      throw new Error(`${position}: 'preconditions' must be a string if provided`);
    }

    if (!Array.isArray(testCase.test_case_steps)) {
      throw new Error(`${position}: 'test_case_steps' must be an array`);
    }

    if (testCase.tags !== undefined && !Array.isArray(testCase.tags)) {
      throw new Error(`${position}: 'tags' must be an array if provided`);
    }

    // Validate test_case_steps structure
    for (let i = 0; i < testCase.test_case_steps.length; i++) {
      const step = testCase.test_case_steps[i] as unknown;

      if (typeof step !== 'object' || step === null || Array.isArray(step)) {
        throw new Error(
          `${position}, Step #${i + 1}: Expected object, got ${typeof step}`
        );
      }

      const stepObj = step as Record<string, unknown>;

      if (typeof stepObj.step !== 'string') {
        throw new Error(`${position}, Step #${i + 1}: 'step' must be a string`);
      }

      if (typeof stepObj.result !== 'string') {
        throw new Error(
          `${position}, Step #${i + 1}: 'result' must be a string`
        );
      }
    }

    // Build and return validated test case
    // All types have been validated above
    return {
      name: String(testCase.name),
      description: String(testCase.description),
      preconditions:
        testCase.preconditions !== undefined
          ? String(testCase.preconditions)
          : undefined,
      test_case_steps: (testCase.test_case_steps as unknown[]).map((s) => ({
        step: String((s as Record<string, unknown>).step),
        result: String((s as Record<string, unknown>).result),
      })),
      tags:
        testCase.tags !== undefined
          ? (testCase.tags as unknown[]).map((t) => String(t))
          : undefined,
    };
  }

  /**
   * Read JSON file content
   * @param filePath - Absolute file path
   * @returns File content as string
   */
  private readJsonFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}\n${(error as Error).message}`);
    }
  }

  /**
   * Resolve file path (handle relative and absolute paths)
   * @param filePath - Input file path
   * @returns Absolute file path
   */
  private resolveFilePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    return path.join(process.cwd(), filePath);
  }
}
