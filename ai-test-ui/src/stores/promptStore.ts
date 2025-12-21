import { defineStore } from 'pinia';
import { PromptsService } from '@/client';
import '@/client/config';

// Types for store
export interface TaskAnalyticsInfo {
  taskId: string;
  title: string;
  detectedType: string;
  hasKeywordMatch: boolean;
  selectedType: string;
  skipped: boolean;
}

export interface GeneratePromptResult {
  taskTitle: string;
  analyticsType: string;
  hasKeywordMatch: boolean;
  availableTypes: string[];
}

export interface BatchPromptResult {
  prompt: string;
}

export interface SubmitResponseResult {
  testCases: Array<{ name: string }> | null;
  browserStack: {
    folderName: string;
    folderId: string;
    createdTestCaseIds: string[];
    createdCount: number;
    failedCount: number;
    failedTestCases: string[];
  } | null;
}

export interface AutomaticTaskResult {
  taskId: string;
  success: boolean;
  testCasesCreated?: number;
  error?: string;
}

export interface AutomaticResult {
  results: AutomaticTaskResult[];
}

export interface BatchTask {
  taskId: string;
  analyticsType: string;
}

export const usePromptStore = defineStore('prompt', () => {
  // API Actions - No state, just pure API calls

  /**
   * Fetch task details from Jira and detect analytics type
   */
  const fetchTaskDetails = async (taskId: string): Promise<GeneratePromptResult> => {
    const data = await PromptsService.postApiPromptsGenerate({
      taskId: taskId.trim(),
    });

    return {
      taskTitle: data.taskTitle || '',
      analyticsType: data.analyticsType || 'other',
      hasKeywordMatch: data.hasKeywordMatch ?? false,
      availableTypes: data.availableTypes || [],
    };
  };

  /**
   * Generate batch prompt for multiple tasks
   */
  const generateBatchPrompt = async (tasks: BatchTask[]): Promise<BatchPromptResult> => {
    const data = await PromptsService.postApiPromptsGenerateBatch({ tasks });
    return { prompt: data.prompt };
  };

  /**
   * Submit Claude's response to create test cases (Manual mode)
   */
  const submitResponse = async (
    taskId: string,
    response: string,
    taskTitle: string,
    analyticsType: string
  ): Promise<SubmitResponseResult> => {
    const data = await PromptsService.postApiPromptsResponse({
      taskId,
      response,
      taskTitle,
      analyticsType,
    });

    return {
      testCases: data.testCases || null,
      browserStack: data.browserStack
        ? {
            folderName: data.browserStack.folderName || '',
            folderId: data.browserStack.folderId || '',
            createdTestCaseIds: data.browserStack.createdTestCaseIds || [],
            createdCount: data.browserStack.createdCount || 0,
            failedCount: data.browserStack.failedCount || 0,
            failedTestCases: data.browserStack.failedTestCases || [],
          }
        : null,
    };
  };

  /**
   * Run automatic mode - calls Claude CLI on backend
   */
  const runAutomatic = async (tasks: BatchTask[]): Promise<AutomaticResult> => {
    const data = await PromptsService.postApiPromptsAutomatic({ tasks });
    return { results: data.results || [] };
  };

  return {
    // API Actions
    fetchTaskDetails,
    generateBatchPrompt,
    submitResponse,
    runAutomatic,
  };
});
