import { Router } from 'express';
import { ErrorMessages } from '../../types/index.js';
import { orchestrator } from '../../services/orchestrator.js';
import { promptWorkflowService } from '../../services/prompt-workflow.service.js';
import {
  getErrorCodeFromMessage,
  getStatusCodeFromErrorCode,
} from '../../utils/error-handler.js';

const router = Router();

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

    const result = await promptWorkflowService.generateBatchPrompt(tasks);

    return res.json({
      success: true,
      ...result,
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

    const taskIds = tasks.map((t) => t.taskId);

    // Use orchestrator to process tasks automatically
    const createdCount = await orchestrator.processBatchTasks(taskIds, false);

    // Return results
    const results = taskIds.map((taskId) => ({
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

    const result = await promptWorkflowService.generateSinglePrompt(taskId);

    return res.json({
      success: true,
      ...result,
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

    const result = await promptWorkflowService.processResponse(
      taskId,
      response,
      taskTitle,
      analyticsType
    );

    return res.json({
      success: true,
      message: 'Test cases created in BrowserStack',
      ...result,
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
