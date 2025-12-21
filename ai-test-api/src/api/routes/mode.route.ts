import { Router } from 'express';
import { claudeCliService } from '../../services/claude-cli.service.js';
import { Mode } from '../../types/index.js';

const router = Router();

/**
 * @swagger
 * /api/mode:
 *   get:
 *     summary: Get current mode (automatic or manual)
 *     description: Checks if Claude CLI is available and returns the current mode
 *     tags:
 *       - Mode
 *     responses:
 *       200:
 *         description: Mode information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                   description: Whether Claude CLI is available
 *                 mode:
 *                   type: string
 *                   enum: [automatic, manual]
 *                   description: Current mode
 *                 message:
 *                   type: string
 *                   description: Status message
 */
router.get('/', async (_req, res) => {
  try {
    const available = await claudeCliService.isAvailable();
    const message = await claudeCliService.getStatusMessage();

    res.json({
      available,
      mode: available ? Mode.Automatic : Mode.Manual,
      message,
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      mode: Mode.Manual,
      message: 'Error checking Claude CLI status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
