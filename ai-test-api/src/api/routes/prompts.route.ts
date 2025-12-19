import { Router } from 'express';
import { JiraService } from '../../services/jira.service.js';
import { RuleResolver } from '../../resolvers/rule-resolver.js';
import { FolderMapper } from '../../resolvers/folder-mapper.js';
import { PromptGenerator } from '../../services/prompt-generator.js';
import { TestCaseImporter } from '../../services/testcase-importer.js';
import { BrowserStackService } from '../../services/browserstack.service.js';
import { ErrorLogger } from '../../utils/error-logger.js';
import { withRetry } from '../../utils/with-retry.js';
import { AnalyticsType, ErrorCode, ErrorMessages } from '../../types/index.js';
import { orchestrator } from '../../services/orchestrator.js';
import path from 'path';

const router = Router();

/**
 * Helper function to determine error code from error message
 */
function getErrorCodeFromMessage(errorMessage: string): ErrorCode {
  if (errorMessage.includes('Task not found') || errorMessage.includes('404')) {
    return ErrorCode.TASK_NOT_FOUND;
  }
  if (errorMessage.includes('Authentication failed') || errorMessage.includes('401') || errorMessage.includes('403')) {
    return ErrorCode.AUTH_FAILED;
  }
  if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
    return ErrorCode.RATE_LIMIT_EXCEEDED;
  }
  if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
    return ErrorCode.RULE_FILE_NOT_FOUND;
  }
  return ErrorCode.INTERNAL_SERVER_ERROR;
}

/**
 * Helper function to get HTTP status code from error code
 */
function getStatusCodeFromErrorCode(errorCode: ErrorCode): number {
  switch (errorCode) {
    case ErrorCode.TASK_NOT_FOUND:
    case ErrorCode.RULE_FILE_NOT_FOUND:
    case ErrorCode.RESPONSE_FILE_NOT_FOUND:
      return 404;
    case ErrorCode.AUTH_FAILED:
    case ErrorCode.AUTH_UNAUTHORIZED:
      return 401;
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;
    case ErrorCode.INVALID_REQUEST:
    case ErrorCode.INVALID_JSON:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.TASK_INVALID_FORMAT:
      return 400;
    default:
      return 500;
  }
}

// Initialize services
const jiraService = new JiraService(
  process.env.JIRA_BASE_URL || '',
  process.env.JIRA_EMAIL || '',
  process.env.JIRA_API_TOKEN || ''
);
const ruleResolver = new RuleResolver(path.join(process.cwd(), 'config/rules.config.json'));
const folderMapper = new FolderMapper(path.join(process.cwd(), 'config/folders.config.json'));
const promptGenerator = new PromptGenerator();
const testCaseImporter = new TestCaseImporter();
const browserStackService = new BrowserStackService(
  process.env.BROWSERSTACK_USERNAME || '',
  process.env.BROWSERSTACK_ACCESS_KEY || '',
  process.env.BROWSERSTACK_PROJECT_ID || ''
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorCode:
 *       type: string
 *       enum:
 *         - TASK_NOT_FOUND
 *         - TASK_INVALID_FORMAT
 *         - AUTH_FAILED
 *         - AUTH_UNAUTHORIZED
 *         - RATE_LIMIT_EXCEEDED
 *         - RULE_FILE_NOT_FOUND
 *         - RESPONSE_FILE_NOT_FOUND
 *         - BROWSERSTACK_API_ERROR
 *         - TEST_CASE_CREATION_FAILED
 *         - INVALID_REQUEST
 *         - INVALID_JSON
 *         - MISSING_REQUIRED_FIELD
 *         - INTERNAL_SERVER_ERROR
 *         - UNKNOWN_ERROR
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: User-friendly error message
 *           example: Task not found in Jira. Please check the task ID.
 *         errorCode:
 *           $ref: '#/components/schemas/ErrorCode'
 *         details:
 *           type: string
 *           description: Technical error details for debugging
 *           example: 'Failed to get task PA-99999: Task not found'
 *     GeneratePromptRequest:
 *       type: object
 *       required:
 *         - taskId
 *       properties:
 *         taskId:
 *           type: string
 *           example: PA-12345
 *     PromptResponse:
 *       type: object
 *       properties:
 *         taskId:
 *           type: string
 *         taskTitle:
 *           type: string
 *         prompt:
 *           type: string
 *         analyticsType:
 *           type: string
 *         hasKeywordMatch:
 *           type: boolean
 *         availableTypes:
 *           type: array
 *           items:
 *             type: string
 *         timestamp:
 *           type: number
 *     SaveResponseRequest:
 *       type: object
 *       required:
 *         - taskId
 *         - response
 *       properties:
 *         taskId:
 *           type: string
 *         response:
 *           type: string
 *           description: JSON string from Claude AI
 *         taskTitle:
 *           type: string
 *         analyticsType:
 *           type: string
 */

/**
 * @swagger
 * /api/prompts/generate/batch:
 *   post:
 *     summary: Generate batch AI prompt for multiple tasks
 *     tags: [Prompts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tasks
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - taskId
 *                     - analyticsType
 *                   properties:
 *                     taskId:
 *                       type: string
 *                     analyticsType:
 *                       type: string
 *     responses:
 *       200:
 *         description: Batch prompt generated successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/generate/batch', async (req, res) => {
  try {
    const { tasks } = req.body as {
      tasks?: Array<{ taskId: string; analyticsType: string }>;
    };

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tasks array is required and must not be empty',
      });
    }

    // Fetch all tasks and prepare batch prompt data
    const batchPromptData = [];

    for (const taskConfig of tasks) {
      const { taskId, analyticsType } = taskConfig;

      // 1. Fetch task from Jira
      const taskInfo = await jiraService.getTask(taskId);

      // 2. Load rule file for analytics type
      const ruleFilePath = ruleResolver.getRuleFilePath(analyticsType as AnalyticsType);
      const ruleContent = promptGenerator.readRuleFile(ruleFilePath);

      batchPromptData.push({
        taskInfo,
        analyticsType: analyticsType as AnalyticsType,
        ruleContent,
      });
    }

    // 3. Generate batch prompt
    const batchPrompt = promptGenerator.generateBatchPrompt(batchPromptData);

    // 4. Save prompt to file
    const promptFileName = `prompt-batch-${Date.now()}.md`;
    promptGenerator.savePromptToFile(batchPrompt, promptFileName);

    return res.json({
      success: true,
      prompt: batchPrompt,
      taskCount: tasks.length,
      taskIds: tasks.map(t => t.taskId),
      promptFile: `output/prompts/${promptFileName}`,
      timestamp: Date.now(),
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    const errorCode = getErrorCodeFromMessage(errorMessage);
    const statusCode = getStatusCodeFromErrorCode(errorCode);

    return res.status(statusCode).json({
      success: false,
      error: ErrorMessages[errorCode],
      errorCode,
      details: errorMessage,
    });
  }
});

/**
 * @swagger
 * /api/prompts/automatic:
 *   post:
 *     summary: Automatic end-to-end test case generation using Claude CLI
 *     tags: [Prompts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tasks
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - taskId
 *                     - analyticsType
 *                   properties:
 *                     taskId:
 *                       type: string
 *                     analyticsType:
 *                       type: string
 *     responses:
 *       200:
 *         description: Tasks processed successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post('/automatic', async (req, res) => {
  try {
    const { tasks } = req.body as {
      tasks?: Array<{ taskId: string; analyticsType: string }>;
    };

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tasks array is required and must not be empty',
      });
    }

    const taskIds = tasks.map(t => t.taskId);

    // Use orchestrator to process tasks automatically
    const createdCount = await orchestrator.processBatchTasks(taskIds, false);

    // Return results
    const results = taskIds.map(taskId => ({
      taskId,
      success: true,
      testCasesCreated: Math.floor(createdCount / taskIds.length), // Approximate
    }));

    return res.json({
      success: true,
      results,
      totalCreated: createdCount,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;

    return res.status(500).json({
      success: false,
      error: errorMessage,
      results: [],
    });
  }
});

/**
 * @swagger
 * /api/prompts/generate:
 *   post:
 *     summary: Generate AI prompt for a task
 *     tags: [Prompts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneratePromptRequest'
 *     responses:
 *       200:
 *         description: Prompt generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PromptResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Task not found in Jira
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/generate', async (req, res) => {
  try {
    const { taskId } = req.body as { taskId?: string };

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'taskId is required',
      });
    }

    // 1. Fetch task from Jira
    const taskInfo = await jiraService.getTask(taskId);

    // 2. Resolve analytics type
    const analyticsType = ruleResolver.resolve(taskInfo.title);
    const hasKeywordMatch = ruleResolver.hasKeywordMatch(taskInfo.title);
    const availableTypes = ruleResolver.getTypes();

    // 3. Load rule file
    const ruleFilePath = ruleResolver.getRuleFilePath(analyticsType);
    const ruleContent = promptGenerator.readRuleFile(ruleFilePath);

    // 4. Generate prompt
    const prompt = promptGenerator.generateSinglePrompt(taskInfo, analyticsType, ruleContent);

    // 5. Save prompt to file
    const promptFileName = `prompt-${taskId}-${Date.now()}.md`;
    promptGenerator.savePromptToFile(prompt, promptFileName);

    return res.json({
      success: true,
      taskId,
      taskTitle: taskInfo.title,
      prompt,
      analyticsType,
      hasKeywordMatch,
      availableTypes,
      promptFile: `output/prompts/${promptFileName}`,
      timestamp: Date.now(),
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    const errorCode = getErrorCodeFromMessage(errorMessage);
    const statusCode = getStatusCodeFromErrorCode(errorCode);

    return res.status(statusCode).json({
      success: false,
      error: ErrorMessages[errorCode],
      errorCode,
      details: errorMessage,
    });
  }
});

/**
 * @swagger
 * /api/prompts/response:
 *   post:
 *     summary: Save AI response from user
 *     tags: [Prompts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaveResponseRequest'
 *     responses:
 *       200:
 *         description: Response saved successfully
 *       400:
 *         description: Invalid request
 */
router.post('/response', async (req, res) => {
  try {
    const { taskId, response, taskTitle, analyticsType } = req.body as {
      taskId?: string;
      response?: string;
      taskTitle?: string;
      analyticsType?: string;
    };

    if (!taskId || !response) {
      return res.status(400).json({
        success: false,
        error: 'taskId and response are required',
      });
    }

    // 1. Save response to file
    const responseFileName = `response-${taskId}-${Date.now()}.json`;
    const responseFilePath = `output/responses/${responseFileName}`;
    const fs = await import('fs/promises');
    await fs.writeFile(responseFilePath, response, 'utf-8');

    // 2. Detect if response is batch format or single format
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(response);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${(error as Error).message}`);
    }

    // Check if it's batch format (object with task IDs as keys)
    const isBatchFormat =
      typeof parsedResponse === 'object' &&
      parsedResponse !== null &&
      !Array.isArray(parsedResponse) &&
      Object.keys(parsedResponse).some(key => /^[A-Z]+-\d+$/.test(key));

    let testCases;
    if (isBatchFormat) {
      // Batch format: { "PA-12345": [...], "PA-67890": [...] }
      const batchTestCases = testCaseImporter.importBatch(responseFilePath);
      testCases = batchTestCases[taskId];

      if (!testCases || testCases.length === 0) {
        throw new Error(`No test cases found for task ${taskId} in batch response`);
      }
    } else {
      // Single format: [...]
      testCases = testCaseImporter.importSingle(responseFilePath);
    }

    // 3. Get task info if not provided
    let finalTaskTitle = taskTitle;
    let finalAnalyticsType = analyticsType;

    if (!finalTaskTitle || !finalAnalyticsType) {
      const taskInfo = await jiraService.getTask(taskId);
      finalTaskTitle = finalTaskTitle || taskInfo.title;
      finalAnalyticsType = finalAnalyticsType || ruleResolver.resolve(taskInfo.title);
    }

    // 4. Create BrowserStack folder and test cases
    const parentFolderId = folderMapper.getFolderId(finalAnalyticsType as AnalyticsType);
    const subfolderName = `${taskId} - ${finalTaskTitle}`;
    const subfolder = await browserStackService.findOrCreateSubfolder(
      parentFolderId,
      subfolderName
    );

    // 5. Create test cases in BrowserStack
    const createdTestCaseIds: string[] = [];
    const failedTestCases: string[] = [];

    for (const testCase of testCases) {
      try {
        const createdTestCase = await withRetry(
          () =>
            browserStackService.createTestCase(subfolder.id, {
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

    return res.json({
      success: true,
      message: 'Test cases created in BrowserStack',
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
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * @swagger
 * /api/prompts/{taskId}:
 *   get:
 *     summary: Get generated prompt for a task
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prompt retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PromptResponse'
 *       404:
 *         description: Prompt not found
 */
router.get('/:taskId', (req, res) => {
  const { taskId } = req.params;

  // TODO: Fetch from storage
  res.json({
    taskId,
    prompt: 'Sample prompt...',
    timestamp: Date.now(),
  });
});

export default router;
