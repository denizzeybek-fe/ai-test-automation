import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TaskInfo, TaskStats, ExecutionLog } from '@/types';
import { TaskStatus } from '@/types';

const STORAGE_KEY = 'ai-test-automation-tasks';

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<TaskInfo[]>([]);
  const currentExecution = ref<string[]>([]);
  const executionLogs = ref<ExecutionLog[]>([]);
  const isExecuting = ref(false);

  // Computed - Stats
  const stats = computed<TaskStats>(() => {
    const total = tasks.value.length;
    const success = tasks.value.filter(t => t.status === TaskStatus.Success).length;
    const failed = tasks.value.filter(t => t.status === TaskStatus.Failed).length;
    const testCases = tasks.value.reduce((sum, t) => sum + (t.testCasesCreated || 0), 0);

    return {
      totalTasks: total,
      successTasks: success,
      failedTasks: failed,
      testCasesCreated: testCases,
    };
  });

  // Computed - Recent tasks (limit 20)
  const recentTasks = computed(() => {
    return [...tasks.value]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  });

  // Actions
  const addTask = (task: TaskInfo) => {
    tasks.value.unshift(task);
    saveToLocalStorage();
  };

  const updateTask = (taskId: string, updates: Partial<TaskInfo>) => {
    const index = tasks.value.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...updates } as TaskInfo;
      saveToLocalStorage();
    }
  };

  const addLog = (message: string, level: ExecutionLog['level'] = 'info') => {
    executionLogs.value.push({
      message,
      timestamp: Date.now(),
      level,
    });
  };

  const clearLogs = () => {
    executionLogs.value = [];
  };

  const startExecution = (taskIds: string[]) => {
    isExecuting.value = true;
    currentExecution.value = taskIds;
    clearLogs();
    addLog(`Starting execution for ${taskIds.length} task(s)...`, 'info');
    addLog(`Task IDs: ${taskIds.join(', ')}`, 'info');
  };

  const stopExecution = () => {
    isExecuting.value = false;
    currentExecution.value = [];
  };

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        tasks.value = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
    }
  };

  const clearTasks = () => {
    tasks.value = [];
    saveToLocalStorage();
  };

  // Initialize
  loadFromLocalStorage();

  return {
    // State
    tasks,
    currentExecution,
    executionLogs,
    isExecuting,

    // Computed
    stats,
    recentTasks,

    // Actions
    addTask,
    updateTask,
    addLog,
    clearLogs,
    startExecution,
    stopExecution,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearTasks,
  };
});
