import path from 'path';
import fs from 'fs/promises';
import { JiraService } from './jira.service.js';
import { RuleResolver } from '../resolvers/rule-resolver.js';
import { FolderMapper } from '../resolvers/folder-mapper.js';
import { PromptGenerator } from './prompt-generator.js';
import { TestCaseImporter } from './testcase-importer.js';
import { BrowserStackService } from './browserstack.service.js';
import { ErrorLogger } from '../utils/error-logger.js';
import { withRetry } from '../utils/with-retry.js';
import { AnalyticsType } from '../types/index.js';

// Types
export interface TaskConfig {
  taskId: string;
  analyticsType: string;
}

export interface GeneratePromptResult {
  taskId: string;
  taskTitle: string;
  prompt: string;
  analyticsType: AnalyticsType;
  hasKeywordMatch: boolean;
  availableTypes: AnalyticsType[];
  promptFile: string;
  timestamp: number;
}

export interface BatchPromptResult {
  prompt: string;
  taskCount: number;
  taskIds: string[];
  promptFile: string;
  timestamp: number;
}

export interface ProcessResponseResult {
  taskId: string;
  responseFile: string;
  testCasesCount: number;
  testCases: unknown[];
  browserStack: {
    folderId: number;
    folderName: string;
    createdCount: number;
    failedCount: number;
    createdTestCaseIds: string[];
    failedTestCases: string[];
    testRun?: {
      identifier: string;
      name: string;
      testPlanId?: string;
    };
  };
}

/**
 * Service for handling prompt generation and response processing workflows
 */
export class PromptWorkflowService {
  private jiraService: JiraService;
  private ruleResolver: RuleResolver;
  private folderMapper: FolderMapper;
  private promptGenerator: PromptGenerator;
  private testCaseImporter: TestCaseImporter;
  private browserStackService: BrowserStackService;

  constructor() {
    this.jiraService = new JiraService(
      process.env.JIRA_BASE_URL || '',
      process.env.JIRA_EMAIL || '',
      process.env.JIRA_API_TOKEN || ''
    );
    this.ruleResolver = new RuleResolver(
      path.join(process.cwd(), 'config/rules.config.json')
    );
    this.folderMapper = new FolderMapper(
      path.join(process.cwd(), 'config/folders.config.json')
    );
    this.promptGenerator = new PromptGenerator();
    this.testCaseImporter = new TestCaseImporter();
    this.browserStackService = new BrowserStackService(
      process.env.BROWSERSTACK_USERNAME || '',
      process.env.BROWSERSTACK_ACCESS_KEY || '',
      process.env.BROWSERSTACK_PROJECT_ID || ''
    );
  }

  /**
   * Generate prompt for a single task
   */
  async generateSinglePrompt(taskId: string): Promise<GeneratePromptResult> {
    // 1. Fetch task from Jira
    const taskInfo = await this.jiraService.getTask(taskId);

    // 2. Resolve analytics type
    const analyticsType = this.ruleResolver.resolve(taskInfo.title);
    const hasKeywordMatch = this.ruleResolver.hasKeywordMatch(taskInfo.title);
    const availableTypes = this.ruleResolver.getTypes();

    // 3. Load rule file
    const ruleFilePath = this.ruleResolver.getRuleFilePath(analyticsType);
    const ruleContent = this.promptGenerator.readRuleFile(ruleFilePath);

    // 4. Generate prompt
    const prompt = this.promptGenerator.generateSinglePrompt(
      taskInfo,
      analyticsType,
      ruleContent
    );

    // 5. Save prompt to file
    const promptFileName = `prompt-${taskId}-${Date.now()}.md`;
    this.promptGenerator.savePromptToFile(prompt, promptFileName);

    return {
      taskId,
      taskTitle: taskInfo.title,
      prompt,
      analyticsType,
      hasKeywordMatch,
      availableTypes,
      promptFile: `output/prompts/${promptFileName}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate batch prompt for multiple tasks
   */
  async generateBatchPrompt(tasks: TaskConfig[]): Promise<BatchPromptResult> {
    const batchPromptData = [];

    for (const taskConfig of tasks) {
      const { taskId, analyticsType } = taskConfig;

      // 1. Fetch task from Jira
      const taskInfo = await this.jiraService.getTask(taskId);

      // 2. Load rule file for analytics type
      const ruleFilePath = this.ruleResolver.getRuleFilePath(
        analyticsType as AnalyticsType
      );
      const ruleContent = this.promptGenerator.readRuleFile(ruleFilePath);

      batchPromptData.push({
        taskInfo,
        analyticsType: analyticsType as AnalyticsType,
        ruleContent,
      });
    }

    // 3. Generate batch prompt
    const batchPrompt = this.promptGenerator.generateBatchPrompt(batchPromptData);

    // 4. Save prompt to file
    const promptFileName = `prompt-batch-${Date.now()}.md`;
    this.promptGenerator.savePromptToFile(batchPrompt, promptFileName);

    return {
      prompt: batchPrompt,
      taskCount: tasks.length,
      taskIds: tasks.map((t) => t.taskId),
      promptFile: `output/prompts/${promptFileName}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Process AI response and create test cases in BrowserStack
   */
  async processResponse(
    taskId: string,
    response: string,
    taskTitle?: string,
    analyticsType?: string
  ): Promise<ProcessResponseResult> {
    // 1. Save response to file
    const responseFileName = `response-${taskId}-${Date.now()}.json`;
    const responseFilePath = `output/responses/${responseFileName}`;
    await fs.writeFile(responseFilePath, response, 'utf-8');

    // 2. Parse and validate JSON
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(response);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${(error as Error).message}`);
    }

    // 3. Detect if response is batch format or single format
    const isBatchFormat =
      typeof parsedResponse === 'object' &&
      parsedResponse !== null &&
      !Array.isArray(parsedResponse) &&
      Object.keys(parsedResponse).some((key) => /^[A-Z]+-\d+$/.test(key));

    let testCases;
    if (isBatchFormat) {
      // Batch format: { "PA-12345": [...], "PA-67890": [...] }
      const batchTestCases = this.testCaseImporter.importBatch(responseFilePath);
      testCases = batchTestCases[taskId];

      if (!testCases || testCases.length === 0) {
        throw new Error(
          `No test cases found for task ${taskId} in batch response`
        );
      }
    } else {
      // Single format: [...]
      testCases = this.testCaseImporter.importSingle(responseFilePath);
    }

    // 4. Get task info if not provided
    let finalTaskTitle = taskTitle;
    let finalAnalyticsType = analyticsType;

    if (!finalTaskTitle || !finalAnalyticsType) {
      const taskInfo = await this.jiraService.getTask(taskId);
      finalTaskTitle = finalTaskTitle || taskInfo.title;
      finalAnalyticsType =
        finalAnalyticsType || this.ruleResolver.resolve(taskInfo.title);
    }

    // 5. Create BrowserStack folder and test cases
    const parentFolderId = this.folderMapper.getFolderId(
      finalAnalyticsType as AnalyticsType
    );
    const subfolderName = `${taskId} - ${finalTaskTitle}`;
    const subfolder = await this.browserStackService.findOrCreateSubfolder(
      parentFolderId,
      subfolderName
    );

    // 6. Create test cases in BrowserStack
    const createdTestCaseIds: string[] = [];
    const failedTestCases: string[] = [];

    for (const testCase of testCases) {
      try {
        const createdTestCase = await withRetry(
          () =>
            this.browserStackService.createTestCase(subfolder.id, {
              name: testCase.name,
              description: testCase.description,
              preconditions: testCase.preconditions,
              test_case_steps: testCase.test_case_steps,
              tags: testCase.tags,
            }),
          { maxRetries: 3 }
        );
        createdTestCaseIds.push(createdTestCase.identifier);
      } catch (error) {
        // Log error but continue with other test cases
        ErrorLogger.log(
          ErrorLogger.createLog(
            error as Error,
            taskId,
            `Create test case: ${testCase.name}`
          )
        );
        failedTestCases.push(testCase.name);
      }
    }

    // 7. Get sprint name for test plan linking
    const sprintName = await this.jiraService.getTaskSprintName(taskId);

    // 8. Find or create test run and link test cases
    let testRunInfo: { identifier: string; name: string; testPlanId?: string } | undefined;

    if (createdTestCaseIds.length > 0) {
      try {
        const testRun = await withRetry(
          () =>
            this.browserStackService.findOrCreateTestRun(
              taskId,
              finalTaskTitle,
              sprintName ?? undefined
            ),
          { maxRetries: 3 }
        );

        await withRetry(
          () =>
            this.browserStackService.updateTestRunCases(
              testRun.identifier,
              createdTestCaseIds
            ),
          { maxRetries: 3 }
        );

        testRunInfo = {
          identifier: testRun.identifier,
          name: testRun.name,
        };

        console.log(`✅ Linked ${createdTestCaseIds.length} test cases to test run ${testRun.identifier}`);
      } catch (error) {
        // Log error but don't fail the response
        ErrorLogger.log(
          ErrorLogger.createLog(
            error as Error,
            taskId,
            'Link test cases to test run'
          )
        );
        console.error(`⚠️ Failed to link test cases to test run: ${(error as Error).message}`);
      }
    }

    return {
      taskId,
      responseFile: responseFilePath,
      testCasesCount: testCases.length,
      testCases,
      browserStack: {
        folderId: subfolder.id,
        folderName: subfolderName,
        createdCount: createdTestCaseIds.length,
        failedCount: failedTestCases.length,
        createdTestCaseIds,
        failedTestCases,
        testRun: testRunInfo,
      },
    };
  }
}

// Singleton instance
export const promptWorkflowService = new PromptWorkflowService();
