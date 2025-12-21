import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useTaskStore } from './taskStore';
import {
  WebSocketEvent,
  TaskStatus,
  AnalyticsType,
  type RunTasksPayload,
  type StepPayload,
  type CompletedPayload,
  type ErrorPayload,
  type TaskInfo,
} from '@/types';
import { ConnectionStatus } from '@/enums';

export const useSocketStore = defineStore('socket', () => {
  // State
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);

  // Computed
  const connectionStatus = computed<ConnectionStatus>(() => {
    if (isConnected.value) return ConnectionStatus.Connected;
    if (connectionError.value) return ConnectionStatus.Error;
    return ConnectionStatus.Disconnected;
  });

  // Actions
  const connect = () => {
    const wsUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    socket.value = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.value.on('connect', handleConnect);
    socket.value.on('disconnect', handleDisconnect);
    socket.value.on('connect_error', handleConnectionError);

    // Register event listeners
    socket.value.on(WebSocketEvent.Progress, handleProgress);
    socket.value.on(WebSocketEvent.Step, handleStep);
    socket.value.on(WebSocketEvent.Completed, handleCompleted);
    socket.value.on(WebSocketEvent.Error, handleError);
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
    isConnected.value = false;
  };

  const runTasks = (taskIds: string[]) => {
    if (!socket.value || !isConnected.value) {
      console.error('Socket not connected');
      return;
    }

    const taskStore = useTaskStore();
    taskStore.startExecution(taskIds);

    const payload: RunTasksPayload = { taskIds };
    socket.value.emit(WebSocketEvent.RunTasks, payload);
  };

  const cancel = () => {
    if (!socket.value || !isConnected.value) {
      console.error('Socket not connected');
      return;
    }

    socket.value.emit(WebSocketEvent.Cancel);

    const taskStore = useTaskStore();
    taskStore.stopExecution();
    taskStore.addLog('Execution cancelled by user', 'warning');
  };

  // Event Handlers
  const handleConnect = () => {
    isConnected.value = true;
    connectionError.value = null;
    console.log('✅ Connected to WebSocket server');

    const taskStore = useTaskStore();
    taskStore.addLog('✅ Connected to server', 'success');
  };

  const handleDisconnect = () => {
    isConnected.value = false;
    console.log('❌ Disconnected from WebSocket server');

    const taskStore = useTaskStore();
    taskStore.addLog('❌ Disconnected from server', 'error');
  };

  const handleConnectionError = (error: Error) => {
    connectionError.value = error.message;
    console.error('❌ Connection error:', error);

    const taskStore = useTaskStore();
    taskStore.addLog(`❌ Connection error: ${error.message}`, 'error');
  };

  const handleProgress = (data: unknown) => {
    console.log('📊 Progress:', data);
    const taskStore = useTaskStore();
    taskStore.addLog(`📊 Progress update received`, 'info');
  };

  const handleStep = (data: StepPayload) => {
    console.log('👉 Step:', data);
    const taskStore = useTaskStore();

    // Add log
    const statusEmoji = {
      [TaskStatus.Pending]: '⏳',
      [TaskStatus.InProgress]: '🔄',
      [TaskStatus.Success]: '✅',
      [TaskStatus.Failed]: '❌',
    };

    const emoji = statusEmoji[data.status] || 'ℹ️';
    const level = data.status === TaskStatus.Failed ? 'error' :
                  data.status === TaskStatus.Success ? 'success' : 'info';

    taskStore.addLog(
      `${emoji} [${data.step}/${data.total}] ${data.taskId}: ${data.message}`,
      level
    );

    // Update or create task
    const existingTask = taskStore.tasks.find(t => t.id === data.taskId);
    if (existingTask) {
      taskStore.updateTask(data.taskId, {
        status: data.status,
        timestamp: Date.now(),
      });
    } else {
      const newTask: TaskInfo = {
        id: data.taskId,
        title: data.message,
        status: data.status,
        analyticsType: AnalyticsType.Overall,
        timestamp: Date.now(),
      };
      taskStore.addTask(newTask);
    }
  };

  const handleCompleted = (data: CompletedPayload) => {
    console.log('✅ Completed:', data);
    const taskStore = useTaskStore();

    taskStore.addLog('', 'info'); // Empty line for spacing
    taskStore.addLog(`✅ Execution completed!`, 'success');
    taskStore.addLog(
      `📊 Results: ${data.completed} succeeded, ${data.failed} failed`,
      data.failed > 0 ? 'warning' : 'success'
    );

    taskStore.stopExecution();
  };

  const handleError = (data: ErrorPayload) => {
    console.error('❌ Error:', data);
    const taskStore = useTaskStore();

    taskStore.addLog('', 'info'); // Empty line
    taskStore.addLog(`❌ Error: ${data.error}`, 'error');
    taskStore.stopExecution();
  };

  return {
    // State
    socket,
    isConnected,
    connectionError,

    // Computed
    connectionStatus,

    // Actions
    connect,
    disconnect,
    runTasks,
    cancel,
  };
});
