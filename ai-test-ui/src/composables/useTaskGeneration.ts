import { ref } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { AnalyticsType, TaskStatus } from '@/types';
import { PromptsService } from '@/client';
import '@/client/config';

interface TaskAnalyticsInfo {
  taskId: string;
  title: string;
  detectedType: string;
  hasKeywordMatch: boolean;
  selectedType: string;
  skipped: boolean;
}

export function useTaskGeneration() {
  const taskStore = useTaskStore();

  // Two-step flow state
  const isGenerating = ref(false);
  const isSubmitting = ref(false);
  const generatedPrompt = ref<string | null>(null);
  const currentTaskId = ref<string | null>(null);
  const currentTaskTitle = ref<string | null>(null);
  const currentAnalyticsType = ref<string | null>(null);

  // Analytics type selection for each task
  const taskAnalyticsInfos = ref<TaskAnalyticsInfo[]>([]);
  const availableTypes = ref<string[]>([]);

  // Step 1: Generate prompt from Jira task(s)
  const handleGeneratePrompt = async (taskIdInput: string) => {
    isGenerating.value = true;
    generatedPrompt.value = null;
    currentTaskId.value = taskIdInput;
    taskStore.clearLogs();

    try {
      // Parse multiple task IDs (comma or space separated)
      const taskIds = taskIdInput.trim().split(/[,\s]+/).filter(id => id.length > 0);

      if (taskIds.length === 0) {
        throw new Error('No valid task IDs provided');
      }

      taskStore.addLog(`📥 Fetching ${taskIds.length} task(s) from Jira: ${taskIds.join(', ')}`, 'info');

      const prompts: string[] = [];
      const taskInfos: TaskAnalyticsInfo[] = [];
      let combinedTitle = '';
      let combinedAnalyticsType = '';

      // Fetch each task and generate prompt
      for (const taskId of taskIds) {
        const data = await PromptsService.postApiPromptsGenerate({
          taskId: taskId.trim(),
        });

        prompts.push(`# ${taskId}: ${data.taskTitle || ''}\n\n${data.prompt || ''}`);

        // Store analytics info for each task
        const hasMatch = data.hasKeywordMatch ?? false;
        const detectedType = data.analyticsType || AnalyticsType.Other;
        taskInfos.push({
          taskId: taskId.trim(),
          title: data.taskTitle || '',
          detectedType,
          hasKeywordMatch: hasMatch,
          selectedType: hasMatch ? detectedType : AnalyticsType.Other,
          skipped: false,
        });

        if (!combinedTitle) {
          combinedTitle = data.taskTitle || '';
          combinedAnalyticsType = data.analyticsType || AnalyticsType.Other;
          availableTypes.value = data.availableTypes || [];
        }
      }

      taskAnalyticsInfos.value = taskInfos;

      // Combine all prompts
      generatedPrompt.value = prompts.join('\n\n---\n\n');
      currentTaskTitle.value = taskIds.length > 1
        ? `Multiple Tasks (${taskIds.length})`
        : combinedTitle || `Task ${taskIds[0]}`;
      currentAnalyticsType.value = combinedAnalyticsType || AnalyticsType.Overall;

      taskStore.addLog(`✅ Generated prompts for ${taskIds.length} task(s) successfully!`, 'success');
      taskStore.addLog(`📋 Analytics Type: ${currentAnalyticsType.value}`, 'info');
      taskStore.addLog(`📋 Copy the combined prompt above and paste it into Claude Desktop`, 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      taskStore.addLog(`❌ Error: ${message}`, 'error');
      generatedPrompt.value = null;
    } finally {
      isGenerating.value = false;
    }
  };

  // Step 2: Submit Claude's response and create test cases
  const handleSubmitResponse = async (
    _taskId: string,
    response: string,
    showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
  ) => {
    isSubmitting.value = true;
    try {
      // Filter out skipped tasks
      const activeTasks = taskAnalyticsInfos.value.filter(t => !t.skipped);

      if (activeTasks.length === 0) {
        throw new Error('All tasks are skipped. Please include at least one task.');
      }

      taskStore.addLog(`📤 Submitting response for ${activeTasks.length} task(s)...`, 'info');

      // For now, we'll process the first non-skipped task
      // TODO: Update backend to support multiple task submissions
      const firstTask = activeTasks[0];

      if (!firstTask) {
        throw new Error('No active task found.');
      }

      const data = await PromptsService.postApiPromptsResponse({
        taskId: firstTask.taskId,
        response,
        taskTitle: firstTask.title,
        analyticsType: firstTask.selectedType,
      });
      const testCasesCount = data.testCases?.length || 0;
      const browserStack = data.browserStack;

      taskStore.addLog(`✅ Response processed successfully!`, 'success');
      taskStore.addLog(`📊 Test cases parsed: ${testCasesCount}`, 'success');

      if (browserStack) {
        taskStore.addLog(`📁 BrowserStack folder: ${browserStack.folderName}`, 'info');
        taskStore.addLog(`✅ Created in BrowserStack: ${browserStack.createdCount}/${testCasesCount}`, 'success');

        if (browserStack.failedCount > 0) {
          taskStore.addLog(`⚠️  Failed to create: ${browserStack.failedCount} test case(s)`, 'warning');
        }

        // Show success notification
        if (browserStack.createdCount > 0) {
          showToast(
            `Successfully created ${browserStack.createdCount} test case${browserStack.createdCount > 1 ? 's' : ''} in BrowserStack`,
            'success'
          );
        }
      }

      // Add or update task in store
      const existingTask = taskStore.tasks.find(t => t.id === firstTask.taskId);
      if (existingTask) {
        taskStore.updateTask(firstTask.taskId, {
          status: TaskStatus.Success,
          testCasesCreated: testCasesCount,
          timestamp: Date.now(),
        });
      } else {
        taskStore.addTask({
          id: firstTask.taskId,
          title: firstTask.title || `Test cases for ${firstTask.taskId}`,
          status: TaskStatus.Success,
          analyticsType: (firstTask.selectedType as AnalyticsType) || AnalyticsType.Overall,
          testCasesCreated: testCasesCount,
          timestamp: Date.now(),
        });
      }

      // Clear state for next task
      generatedPrompt.value = null;
      currentTaskId.value = null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      taskStore.addLog(`❌ Error: ${message}`, 'error');

      // Show error notification
      showToast(`Failed to create test cases: ${message}`, 'error');

      // Add or update task with failed status
      const activeTasks = taskAnalyticsInfos.value.filter(t => !t.skipped);

      if (activeTasks.length > 0) {
        const firstTask = activeTasks[0]!; // Non-null assertion: length check guarantees element exists
        const existingTask = taskStore.tasks.find(t => t.id === firstTask.taskId);
        if (existingTask) {
          taskStore.updateTask(firstTask.taskId, {
            status: TaskStatus.Failed,
            error: message,
            timestamp: Date.now(),
          });
        } else {
          taskStore.addTask({
            id: firstTask.taskId,
            title: firstTask.title || `Test cases for ${firstTask.taskId}`,
            status: TaskStatus.Failed,
            analyticsType: (firstTask.selectedType as AnalyticsType) || AnalyticsType.Overall,
            error: message,
            timestamp: Date.now(),
          });
        }
      }
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleClear = () => {
    taskStore.clearLogs();
    generatedPrompt.value = null;
    currentTaskId.value = null;
    taskAnalyticsInfos.value = [];
    availableTypes.value = [];
  };

  // Handle analytics type updates
  const handleUpdateAnalyticsType = (taskId: string, type: string) => {
    const task = taskAnalyticsInfos.value.find(t => t.taskId === taskId);
    if (task) {
      task.selectedType = type;
    }
  };

  const handleToggleSkip = (taskId: string) => {
    const task = taskAnalyticsInfos.value.find(t => t.taskId === taskId);
    if (task) {
      task.skipped = !task.skipped;
    }
  };

  return {
    isGenerating,
    isSubmitting,
    generatedPrompt,
    currentTaskId,
    currentTaskTitle,
    currentAnalyticsType,
    taskAnalyticsInfos,
    availableTypes,
    handleGeneratePrompt,
    handleSubmitResponse,
    handleClear,
    handleUpdateAnalyticsType,
    handleToggleSkip,
  };
}
