import { Router } from 'express';

const router = Router();

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
 *         prompt:
 *           type: string
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
router.post('/generate', (req, res) => {
  try {
    const { taskId } = req.body as { taskId?: string };

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'taskId is required',
      });
    }

    // TODO:
    // 1. Fetch task from Jira
    // 2. Resolve analytics type
    // 3. Load rule file
    // 4. Generate prompt using PromptManager

    const samplePrompt = `# Test Case Generation Request

Generate test cases for task ${taskId}...`;

    return res.json({
      success: true,
      taskId,
      prompt: samplePrompt,
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
router.post('/response', (req, res) => {
  try {
    const { taskId, response } = req.body as { taskId?: string; response?: string };

    if (!taskId || !response) {
      return res.status(400).json({
        success: false,
        error: 'taskId and response are required',
      });
    }

    // TODO: Save response and parse test cases
    // Use PromptManager.saveResponse()

    return res.json({
      success: true,
      message: 'Response saved successfully',
      taskId,
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
