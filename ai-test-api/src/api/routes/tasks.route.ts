import { Router } from 'express';
import { Orchestrator } from '../../services/orchestrator.js';

const router = Router();
const orchestrator = new Orchestrator();

/**
 * @swagger
 * components:
 *   schemas:
 *     TaskStatus:
 *       type: string
 *       enum: [success, failed, in-progress, pending]
 *     AnalyticsType:
 *       type: string
 *       enum: [overall, homepage, onsite, usage, event-conversion, enigma-sentinel, other]
 *     TaskInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: PA-12345
 *         title:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/TaskStatus'
 *         analyticsType:
 *           $ref: '#/components/schemas/AnalyticsType'
 *         timestamp:
 *           type: number
 *         testCasesCreated:
 *           type: number
 *         error:
 *           type: string
 *     RunTasksRequest:
 *       type: object
 *       required:
 *         - taskIds
 *       properties:
 *         taskIds:
 *           type: array
 *           items:
 *             type: string
 *           example: ["PA-12345", "PA-67890"]
 */

/**
 * @swagger
 * /api/tasks/run:
 *   post:
 *     summary: Run test case generation for tasks
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RunTasksRequest'
 *     responses:
 *       200:
 *         description: Tasks started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 taskIds:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request
 */
router.post('/run', (req, res) => {
  try {
    const { taskIds } = req.body as { taskIds?: string[] };

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'taskIds array is required',
      });
    }

    // Start processing in background (don't await)
    // WebSocket will emit progress updates
    // This endpoint just acknowledges the request
    void orchestrator
      .processBatchTasks(taskIds)
      .then((successCount) => {
        console.log(`✅ Batch processing completed: ${successCount}/${taskIds.length} tasks`);
      })
      .catch((error) => {
        console.error(`❌ Batch processing error:`, error);
      });

    return res.json({
      success: true,
      message: `Processing ${taskIds.length} task(s) started. Use WebSocket for real-time updates.`,
      taskIds,
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
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task status
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID (e.g., PA-12345)
 *     responses:
 *       200:
 *         description: Task information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskInfo'
 *       404:
 *         description: Task not found
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // TODO: Fetch from database/storage
  res.json({
    id,
    title: 'Sample Task',
    status: 'success',
    analyticsType: 'overall',
    timestamp: Date.now(),
    testCasesCreated: 5,
  });
});

/**
 * @swagger
 * /api/tasks/history:
 *   get:
 *     summary: Get task history
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *         description: Number of tasks to return
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskInfo'
 *                 total:
 *                   type: number
 */
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;

  // TODO: Fetch from database/storage
  res.json({
    tasks: [],
    total: 0,
    limit,
  });
});

export default router;
