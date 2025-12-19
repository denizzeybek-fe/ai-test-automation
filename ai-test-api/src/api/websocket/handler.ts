import { Server as SocketIOServer, Socket } from 'socket.io';
import { Orchestrator } from '../../services/orchestrator.js';

enum WebSocketEvent {
  // Client -> Server
  RunTasks = 'run-tasks',
  Cancel = 'cancel',

  // Server -> Client
  Progress = 'progress',
  Step = 'step',
  Completed = 'completed',
  Error = 'error',
}

interface RunTasksPayload {
  taskIds: string[];
}

interface StepPayload {
  taskId: string;
  step: number;
  total: number;
  message: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export function initializeWebSocket(io: SocketIOServer): void {
  const orchestrator = new Orchestrator();

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Handle run-tasks event
    socket.on(WebSocketEvent.RunTasks, async (payload: RunTasksPayload) => {
      console.log(`📥 Received run-tasks:`, payload);

      try {
        const { taskIds } = payload;

        if (!taskIds || taskIds.length === 0) {
          socket.emit(WebSocketEvent.Error, {
            success: false,
            error: 'taskIds array is required',
          });
          return;
        }

        // Process tasks with orchestrator
        // Note: This uses batch mode which requires manual prompt/response interaction
        // For API mode, we'll need to modify the orchestrator to accept callbacks

        const totalTasks = taskIds.length;
        let completedTasks = 0;

        for (let i = 0; i < taskIds.length; i++) {
          const taskId = taskIds[i];

          // Emit starting step
          socket.emit(WebSocketEvent.Step, {
            taskId,
            step: i + 1,
            total: totalTasks,
            message: `Processing ${taskId}...`,
            status: 'in-progress',
          } as StepPayload);

          try {
            // Process single task using batch flow
            const successCount = await orchestrator.processBatchTasks([taskId], false);

            if (successCount > 0) {
              completedTasks++;
              socket.emit(WebSocketEvent.Step, {
                taskId,
                step: i + 1,
                total: totalTasks,
                message: `Completed ${taskId}`,
                status: 'completed',
              } as StepPayload);
            } else {
              socket.emit(WebSocketEvent.Step, {
                taskId,
                step: i + 1,
                total: totalTasks,
                message: `Failed ${taskId}`,
                status: 'failed',
              } as StepPayload);
            }
          } catch (error) {
            socket.emit(WebSocketEvent.Step, {
              taskId,
              step: i + 1,
              total: totalTasks,
              message: `Error: ${(error as Error).message}`,
              status: 'failed',
            } as StepPayload);
          }
        }

        // All done
        socket.emit(WebSocketEvent.Completed, {
          success: true,
          taskIds,
          completed: completedTasks,
          failed: totalTasks - completedTasks,
          message: `Processed ${completedTasks}/${totalTasks} task(s) successfully`,
        });
      } catch (error) {
        socket.emit(WebSocketEvent.Error, {
          success: false,
          error: (error as Error).message,
        });
      }
    });

    // Handle cancel event
    socket.on(WebSocketEvent.Cancel, () => {
      console.log(`🛑 Client cancelled: ${socket.id}`);
      // TODO: Implement cancellation logic
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}
