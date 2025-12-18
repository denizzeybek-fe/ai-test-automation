export type TaskStatus = 'success' | 'failed' | 'pending' | 'in-progress';

export const TaskStatus = {
  Success: 'success' as const,
  Failed: 'failed' as const,
  Pending: 'pending' as const,
  InProgress: 'in-progress' as const,
};

export type AnalyticsType = 'overall' | 'homepage' | 'onsite' | 'usage' | 'event-conversion' | 'enigma-sentinel' | 'other';

export const AnalyticsType = {
  Overall: 'overall' as const,
  Homepage: 'homepage' as const,
  Onsite: 'onsite' as const,
  Usage: 'usage' as const,
  EventConversion: 'event-conversion' as const,
  EnigmaSentinel: 'enigma-sentinel' as const,
  Other: 'other' as const,
};

export interface TaskInfo {
  id: string;
  title: string;
  status: TaskStatus;
  analyticsType: AnalyticsType;
  timestamp: number;
  testCasesCreated?: number;
  error?: string;
}

export interface TaskStats {
  totalTasks: number;
  successTasks: number;
  failedTasks: number;
  testCasesCreated: number;
}

export interface ExecutionLog {
  message: string;
  timestamp: number;
  level: 'info' | 'success' | 'error' | 'warning';
}

// WebSocket Events
export type WebSocketEvent = 'run-tasks' | 'cancel' | 'progress' | 'step' | 'completed' | 'error';

export const WebSocketEvent = {
  // Client -> Server
  RunTasks: 'run-tasks' as const,
  Cancel: 'cancel' as const,

  // Server -> Client
  Progress: 'progress' as const,
  Step: 'step' as const,
  Completed: 'completed' as const,
  Error: 'error' as const,
};

export interface RunTasksPayload {
  taskIds: string[];
}

export interface StepPayload {
  taskId: string;
  step: number;
  total: number;
  message: string;
  status: TaskStatus;
}

export interface CompletedPayload {
  success: boolean;
  taskIds: string[];
  completed: number;
  failed: number;
  message: string;
}

export interface ErrorPayload {
  success: false;
  error: string;
}
