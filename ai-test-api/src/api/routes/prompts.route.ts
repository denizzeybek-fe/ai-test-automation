import { Router } from 'express';
import { JiraService } from '../../services/jira.service.js';
import { RuleResolver } from '../../resolvers/rule-resolver.js';
import { FolderMapper } from '../../resolvers/folder-mapper.js';
import { PromptGenerator } from '../../services/prompt-generator.js';
import { TestCaseImporter } from '../../services/testcase-importer.js';
import { BrowserStackService } from '../../services/browserstack.service.js';
import { ErrorLogger } from '../../utils/error-logger.js';
import { withRetry } from '../../utils/with-retry.js';
import path from 'path';

const router = Router();

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
 *       404:
 *         description: Task not found in Jira
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
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
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

    // 2. Parse test cases from response
    const testCases = testCaseImporter.importSingle(responseFilePath);

    // 3. Get task info if not provided
    let finalTaskTitle = taskTitle;
    let finalAnalyticsType = analyticsType;

    if (!finalTaskTitle || !finalAnalyticsType) {
      const taskInfo = await jiraService.getTask(taskId);
      finalTaskTitle = finalTaskTitle || taskInfo.title;
      finalAnalyticsType = finalAnalyticsType || ruleResolver.resolve(taskInfo.title);
    }

    // 4. Create BrowserStack folder and test cases
    const parentFolderId = folderMapper.getFolderId(finalAnalyticsType as any);
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
