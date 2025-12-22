import { ref } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { useModeStore } from '@/stores/modeStore';
import { usePromptStore, type TaskAnalyticsInfo } from '@/stores/promptStore';
import { AnalyticsType, TaskStatus } from '@/types';
import { useToast } from '@/composables/useToast';
import { Mode } from '@/enums';

export function useTaskGeneration() {
  const taskStore = useTaskStore();
  const modeStore = useModeStore();
  const promptStore = usePromptStore();
  const { showSuccess, showError } = useToast();

  // UI State
  const isGenerating = ref(false);
  const isSubmitting = ref(false);
  const generatedPrompt = ref<string | null>(null);
  const currentTaskId = ref<string | null>(null);
  const currentTaskTitle = ref<string | null>(null);
  const currentAnalyticsType = ref<string | null>(null);
  const taskAnalyticsInfos = ref<TaskAnalyticsInfo[]>([]);
  const availableTypes = ref<string[]>([]);

  // Parse task IDs from input
  const parseTaskIds = (input: string): string[] => {
    return input.trim().split(/[,\s]+/).filter(id => id.length > 0);
  };

  // Step 1: Generate prompt from Jira task(s)
  const handleGeneratePrompt = async (taskIdInput: string) => {
    isGenerating.value = true;
    generatedPrompt.value = null;
    currentTaskId.value = taskIdInput;
    taskStore.clearLogs();

    try {
      const taskIds = parseTaskIds(taskIdInput);
      if (taskIds.length === 0) {
        throw new Error('No valid task IDs provided');
      }

      const taskInfos: TaskAnalyticsInfo[] = [];
      let hasSetAvailableTypes = false;

      // Log based on mode
      if (modeStore.mode === Mode.Automatic) {
        taskStore.addLog(`🤖 Automatic Mode - Processing ${taskIds.length} task(s)...`, 'info');
        taskStore.addLog(`📥 Fetching task details from Jira...`, 'info');
      } else {
        taskStore.addLog(`📥 Fetching ${taskIds.length} task(s) from Jira: ${taskIds.join(', ')}`, 'info');
      }

      // Fetch each task using store action
      for (const taskId of taskIds) {
        const data = await promptStore.fetchTaskDetails(taskId);
        const hasMatch = data.hasKeywordMatch;
        const detectedType = data.analyticsType || AnalyticsType.Other;

        taskInfos.push({
          taskId: taskId.trim(),
          title: data.taskTitle,
          detectedType,
          hasKeywordMatch: hasMatch,
          selectedType: hasMatch ? detectedType : AnalyticsType.Other,
          skipped: false,
        });

        if (!hasSetAvailableTypes) {
          availableTypes.value = data.availableTypes;
          hasSetAvailableTypes = true;
        }
      }

      taskAnalyticsInfos.value = taskInfos;

      // Both modes: wait for user to review/confirm analytics types
      taskStore.addLog(`✅ Task details fetched successfully`, 'success');

      if (modeStore.mode === Mode.Automatic) {
        taskStore.addLog(`👀 Please review analytics types below and click "Confirm & Generate"`, 'info');
      } else {
        taskStore.addLog(`👀 Please review analytics types below and click "Generate Prompt"`, 'info');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      taskStore.addLog(`❌ Error: ${message}`, 'error');
      generatedPrompt.value = null;
      showError(message);
    } finally {
      isGenerating.value = false;
    }
  };

  // Step 2: Submit Claude's response (Manual mode)
  const handleSubmitResponse = async (_taskId: string, response: string) => {
    isSubmitting.value = true;
    try {
      const activeTasks = taskAnalyticsInfos.value.filter(t => !t.skipped);
      if (activeTasks.length === 0) {
        throw new Error('All tasks are skipped. Please include at least one task.');
      }

      taskStore.addLog(`📤 Submitting response for ${activeTasks.length} task(s)...`, 'info');

      let totalCreated = 0;
      let totalFailed = 0;
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < activeTasks.length; i++) {
        const task = activeTasks[i]!;
        taskStore.addLog(`[${i + 1}/${activeTasks.length}] Processing ${task.taskId}...`, 'info');

        try {
          const result = await promptStore.submitResponse(
            task.taskId,
            response,
            task.title,
            task.selectedType
          );

          const testCasesCount = result.testCases?.length || 0;
          taskStore.addLog(`  ✅ ${task.taskId}: ${testCasesCount} test cases parsed`, 'success');

          if (result.browserStack) {
            logBrowserStackResult(result.browserStack, result.testCases || []);
            totalCreated += result.browserStack.createdCount;
            totalFailed += result.browserStack.failedCount;
          }

          updateTaskStatus(task, TaskStatus.Success, testCasesCount);
          successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          taskStore.addLog(`  ❌ ${task.taskId}: ${errorMessage}`, 'error');
          updateTaskStatus(task, TaskStatus.Failed, 0, errorMessage);
          failedCount++;
        }
      }

      logSummary(successCount, failedCount, activeTasks.length, totalCreated, totalFailed);
      resetState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      taskStore.addLog(`❌ Fatal Error: ${message}`, 'error');
      showError(`Failed to process tasks: ${message}`);
    } finally {
      isSubmitting.value = false;
    }
  };

  // Manual mode: Generate prompt after user confirms analytics types
  const handleGenerateManualPrompt = async () => {
    if (modeStore.mode !== Mode.Manual || taskAnalyticsInfos.value.length === 0) {
      return;
    }

    isGenerating.value = true;
    try {
      const activeTasks = taskAnalyticsInfos.value.filter(t => !t.skipped);
      if (activeTasks.length === 0) {
        throw new Error('All tasks are skipped. Please include at least one task.');
      }

      taskStore.addLog(`📝 Generating batch prompt for ${activeTasks.length} task(s)...`, 'info');

      const batchTasks = activeTasks.map(info => ({
        taskId: info.taskId,
        analyticsType: info.selectedType,
      }));

      const batchData = await promptStore.generateBatchPrompt(batchTasks);
      generatedPrompt.value = batchData.prompt;

      const firstTask = activeTasks[0]!;
      currentTaskTitle.value = activeTasks.length > 1
        ? `Multiple Tasks (${activeTasks.length})`
        : firstTask.title || `Task ${firstTask.taskId}`;
      currentAnalyticsType.value = firstTask.selectedType || AnalyticsType.Overall;

      taskStore.addLog(`✅ Prompt generated successfully!`, 'success');
      taskStore.addLog(`📋 Copy the prompt above and paste it into Claude Desktop`, 'info');

      showSuccess(`Prompt generated for ${activeTasks.length} task${activeTasks.length > 1 ? 's' : ''}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      taskStore.addLog(`❌ Error: ${message}`, 'error');
      showError(message);
    } finally {
      isGenerating.value = false;
    }
  };

  // Automatic mode: Confirm and generate test cases
  const handleConfirmAndGenerate = async () => {
    if (modeStore.mode !== Mode.Automatic || taskAnalyticsInfos.value.length === 0) {
      return;
    }

    isSubmitting.value = true;
    try {
      const activeTasks = taskAnalyticsInfos.value.filter(t => !t.skipped);
      if (activeTasks.length === 0) {
        throw new Error('All tasks are skipped. Please include at least one task.');
      }

      logAutomaticStart(activeTasks);

      const batchTasks = activeTasks.map(info => ({
        taskId: info.taskId,
        analyticsType: info.selectedType,
      }));

      const automaticData = await promptStore.runAutomatic(batchTasks);

      taskStore.addLog(`✅ Received response from Claude CLI for ${activeTasks.length} tasks`, 'success');
      taskStore.addLog(``, 'info');
      taskStore.addLog(`📦 Phase 2: Creating Test Cases in BrowserStack`, 'info');

      let totalCreated = 0;
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < activeTasks.length; i++) {
        const task = activeTasks[i]!;
        const result = automaticData.results?.find(r => r.taskId === task.taskId);

        taskStore.addLog(`[${i + 1}/${activeTasks.length}] Processing ${task.taskId}...`, 'info');

        if (result?.success) {
          const testCasesCount = result.testCasesCreated || 0;
          taskStore.addLog(`  ✅ Created ${testCasesCount} test cases`, 'success');
          totalCreated += testCasesCount;
          successCount++;
          updateTaskStatus(task, TaskStatus.Success, testCasesCount);
        } else {
          const errorMessage = result?.error || 'Unknown error';
          taskStore.addLog(`  ❌ ${errorMessage}`, 'error');
          failedCount++;
          updateTaskStatus(task, TaskStatus.Failed, 0, errorMessage);
        }
      }

      logSummary(successCount, failedCount, activeTasks.length, totalCreated, 0);
      resetState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      taskStore.addLog(`❌ Error: ${message}`, 'error');
      showError(message);
    } finally {
      isSubmitting.value = false;
    }
  };

  // Helper: Log BrowserStack results
  const logBrowserStackResult = (
    browserStack: NonNullable<Awaited<ReturnType<typeof promptStore.submitResponse>>['browserStack']>,
    testCases: Array<{ name: string }>
  ) => {
    taskStore.addLog(`  📁 Creating subfolder: ${browserStack.folderName}`, 'info');
    taskStore.addLog(`  ✅ Created folder: ${browserStack.folderName} (ID: ${browserStack.folderId})`, 'success');

    if (browserStack.createdTestCaseIds.length > 0) {
      browserStack.createdTestCaseIds.forEach((testCaseId, index) => {
        const testCaseName = testCases[index]?.name || 'Unknown test case';
        taskStore.addLog(`  ✅ Created test case: ${testCaseId} - ${testCaseName}`, 'success');
      });
    }

    taskStore.addLog(`  📊 Summary: ${browserStack.createdCount}/${testCases.length} test cases created`, 'success');

    if (browserStack.failedCount > 0) {
      taskStore.addLog(`  ⚠️  Failed: ${browserStack.failedCount} test case(s)`, 'warning');
      browserStack.failedTestCases.forEach(failedName => {
        taskStore.addLog(`    ❌ ${failedName}`, 'error');
      });
    }
  };

  // Helper: Log automatic mode start
  const logAutomaticStart = (activeTasks: TaskAnalyticsInfo[]) => {
    taskStore.addLog(`🚀 Processing ${activeTasks.length} Task${activeTasks.length > 1 ? 's' : ''}`, 'info');
    taskStore.addLog(`📝 Phase 1: Generating Prompts for All Tasks`, 'info');

    for (let i = 0; i < activeTasks.length; i++) {
      const task = activeTasks[i]!;
      taskStore.addLog(`[${i + 1}/${activeTasks.length}] Processing ${task.taskId}...`, 'info');
      taskStore.addLog(`  ✅ Fetched: ${task.title}`, 'success');
      taskStore.addLog(`  ✅ Type: ${task.selectedType}`, 'success');
    }

    taskStore.addLog(`📝 Generating Single Batch Prompt`, 'info');
    taskStore.addLog(`🤖 Automatic mode enabled - Calling Claude CLI...`, 'info');
  };

  // Helper: Log summary
  const logSummary = (
    successCount: number,
    failedCount: number,
    totalCount: number,
    totalCreated: number,
    totalFailed: number
  ) => {
    taskStore.addLog(`🎉 Batch Processing Complete!`, 'success');
    taskStore.addLog(`✅ Successful: ${successCount}/${totalCount}`, 'success');

    if (failedCount > 0) {
      taskStore.addLog(`❌ Failed: ${failedCount}/${totalCount}`, 'error');
    }

    taskStore.addLog(`📊 Total test cases created: ${totalCreated}`, 'success');

    if (totalFailed > 0) {
      taskStore.addLog(`⚠️  Total test cases failed: ${totalFailed}`, 'warning');
    }

    if (successCount > 0) {
      showSuccess(`Successfully processed ${successCount} task${successCount > 1 ? 's' : ''} with ${totalCreated} test case${totalCreated !== 1 ? 's' : ''}`);
    }
    if (failedCount > 0) {
      showError(`${failedCount} task${failedCount > 1 ? 's' : ''} failed to process`);
    }
  };

  // Helper: Update task status in store
  const updateTaskStatus = (
    task: TaskAnalyticsInfo,
    status: TaskStatus,
    testCasesCreated: number,
    error?: string
  ) => {
    const existingTask = taskStore.tasks.find(t => t.id === task.taskId);
    const updates = {
      status,
      testCasesCreated,
      error,
      timestamp: Date.now(),
    };

    if (existingTask) {
      taskStore.updateTask(task.taskId, updates);
    } else {
      taskStore.addTask({
        id: task.taskId,
        title: task.title || `Test cases for ${task.taskId}`,
        analyticsType: (task.selectedType as AnalyticsType) || AnalyticsType.Overall,
        ...updates,
      });
    }
  };

  // Helper: Reset state after completion
  const resetState = () => {
    generatedPrompt.value = null;
    currentTaskId.value = null;
    taskAnalyticsInfos.value = [];
    availableTypes.value = [];
  };

  const handleClear = () => {
    taskStore.clearLogs();
    resetState();
  };

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
    handleConfirmAndGenerate,
    handleGenerateManualPrompt,
  };
}
