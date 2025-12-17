import { Server as SocketIOServer, Socket } from 'socket.io';

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
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Handle run-tasks event
    socket.on(WebSocketEvent.RunTasks, async (payload: RunTasksPayload) => {
      console.log(`📥 Received run-tasks:`, payload);

      try {
        const { taskIds } = payload;

        // TODO: Integrate with Orchestrator
        // For now, simulate progress
        for (let i = 0; i < taskIds.length; i++) {
          const taskId = taskIds[i];

          // Emit step progress
          const stepPayload: StepPayload = {
            taskId,
            step: i + 1,
            total: taskIds.length,
            message: `Processing ${taskId}...`,
            status: 'in-progress',
          };

          socket.emit(WebSocketEvent.Step, stepPayload);

          // Simulate work
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Mark completed
          socket.emit(WebSocketEvent.Step, {
            ...stepPayload,
            message: `Completed ${taskId}`,
            status: 'completed',
          });
        }

        // All done
        socket.emit(WebSocketEvent.Completed, {
          success: true,
          taskIds,
          message: `Successfully processed ${taskIds.length} task(s)`,
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
