export enum TaskStatus {
  Success = 'success',
  Failed = 'failed',
  Pending = 'pending',
  InProgress = 'in-progress',
}

export enum AnalyticsType {
  Overall = 'overall',
  Homepage = 'homepage',
  Onsite = 'onsite',
  Usage = 'usage',
  EventConversion = 'event-conversion',
  EnigmaSentinel = 'enigma-sentinel',
  Other = 'other',
}

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
export enum WebSocketEvent {
  // Client -> Server
  RunTasks = 'run-tasks',
  Cancel = 'cancel',

  // Server -> Client
  Progress = 'progress',
  Step = 'step',
  Completed = 'completed',
  Error = 'error',
}

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
