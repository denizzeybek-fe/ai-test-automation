import { ref } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { useModeStore } from '@/stores/modeStore';
import { AnalyticsType, TaskStatus } from '@/types';
import { PromptsService } from '@/client';
import { useToast } from './useToast';
import { Mode } from '@/enums';
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
  const modeStore = useModeStore();
  const { showSuccess, showError } = useToast();

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

      const taskInfos: TaskAnalyticsInfo[] = [];
      let combinedTitle = '';
      let combinedAnalyticsType = '';

      // AUTOMATIC MODE: Different logging approach
      if (modeStore.mode === Mode.Automatic) {
        taskStore.addLog(`🤖 Automatic Mode - Processing ${taskIds.length} task(s)...`, 'info');
        taskStore.addLog(`📥 Fetching task details from Jira...`, 'info');
      } else {
        // MANUAL MODE: Show detailed logging
        taskStore.addLog(`📥 Fetching ${taskIds.length} task(s) from Jira: ${taskIds.join(', ')}`, 'info');
      }

      // First, fetch each task to get analytics type info
      for (const taskId of taskIds) {
        const data = await PromptsService.postApiPromptsGenerate({
          taskId: taskId.trim(),
        });

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

      // AUTOMATIC MODE: Complete end-to-end without user intervention
      if (modeStore.mode === Mode.Automatic) {
        taskStore.addLog(`✅ Task details fetched successfully`, 'success');
        taskStore.addLog(`🤖 Calling Claude CLI to generate test cases...`, 'info');
        taskStore.addLog(`⏳ This may take a few minutes depending on task complexity...`, 'info');

        const batchTasks = taskInfos.map(info => ({
          taskId: info.taskId,
          analyticsType: info.selectedType,
        }));

        // Call backend automatic endpoint
        const automaticResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/prompts/automatic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks: batchTasks }),
        });

        if (!automaticResponse.ok) {
          const errorData = await automaticResponse.json().catch(() => ({
            error: 'Failed to process tasks automatically'
          }));
          throw new Error(errorData.error || 'Failed to process tasks automatically');
        }

        const automaticData = await automaticResponse.json();

        // Process results
        let totalCreated = 0;
        let successCount = 0;
        let failedCount = 0;

        taskStore.addLog(`📤 Processing ${taskInfos.length} task(s)...`, 'info');

        for (const task of taskInfos) {
          const result = automaticData.results?.find((r: { taskId: string }) => r.taskId === task.taskId);

          if (result?.success) {
            const testCasesCount = result.testCasesCreated || 0;
            taskStore.addLog(`  ✅ ${task.taskId}: ${testCasesCount} test cases created`, 'success');
            totalCreated += testCasesCount;
            successCount++;

            // Add or update task in store
            const existingTask = taskStore.tasks.find(t => t.id === task.taskId);
            if (existingTask) {
              taskStore.updateTask(task.taskId, {
                status: TaskStatus.Success,
                testCasesCreated: testCasesCount,
                timestamp: Date.now(),
              });
            } else {
              taskStore.addTask({
                id: task.taskId,
                title: task.title || `Test cases for ${task.taskId}`,
                status: TaskStatus.Success,
                analyticsType: (task.selectedType as AnalyticsType) || AnalyticsType.Overall,
                testCasesCreated: testCasesCount,
                timestamp: Date.now(),
              });
            }
          } else {
            const errorMessage = result?.error || 'Unknown error';
            taskStore.addLog(`  ❌ ${task.taskId}: ${errorMessage}`, 'error');
            failedCount++;

            // Add or update task with failed status
            const existingTask = taskStore.tasks.find(t => t.id === task.taskId);
            if (existingTask) {
              taskStore.updateTask(task.taskId, {
                status: TaskStatus.Failed,
                error: errorMessage,
                timestamp: Date.now(),
              });
            } else {
              taskStore.addTask({
                id: task.taskId,
                title: task.title || `Test cases for ${task.taskId}`,
                status: TaskStatus.Failed,
                analyticsType: (task.selectedType as AnalyticsType) || AnalyticsType.Overall,
                error: errorMessage,
                timestamp: Date.now(),
              });
            }
          }
        }

        // Summary
        taskStore.addLog('', 'info'); // Empty line
        taskStore.addLog(`🎉 Automatic Processing Complete!`, 'success');
        taskStore.addLog(`✅ Successful: ${successCount}/${taskInfos.length}`, 'success');
        if (failedCount > 0) {
          taskStore.addLog(`❌ Failed: ${failedCount}/${taskInfos.length}`, 'error');
        }
        taskStore.addLog(`📊 Total test cases created: ${totalCreated}`, 'success');

        // Show notification
        if (successCount > 0) {
          showSuccess(
            `Successfully processed ${successCount} task${successCount > 1 ? 's' : ''} with ${totalCreated} test case${totalCreated !== 1 ? 's' : ''}`
          );
        }
        if (failedCount > 0) {
          showError(
            `${failedCount} task${failedCount > 1 ? 's' : ''} failed to process`
          );
        }

        // Clear state for next batch
        taskAnalyticsInfos.value = [];
        availableTypes.value = [];
        currentTaskId.value = null;

        return; // Exit early - automatic mode complete
      }

      // MANUAL MODE: Generate and show prompt for user to copy
      // Generate batch prompt if multiple tasks, otherwise use single prompt
      if (taskIds.length > 1) {
        // Use batch prompt generation endpoint
        taskStore.addLog(`📝 Generating batch prompt for ${taskIds.length} tasks...`, 'info');

        const batchTasks = taskInfos.map(info => ({
          taskId: info.taskId,
          analyticsType: info.selectedType,
        }));

        const batchResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/prompts/generate/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks: batchTasks }),
        });

        if (!batchResponse.ok) {
          const errorData = await batchResponse.json().catch(() => ({
            error: 'Failed to generate batch prompt'
          }));
          throw new Error(errorData.error || 'Failed to generate batch prompt');
        }

        const batchData = await batchResponse.json();
        generatedPrompt.value = batchData.prompt;
      } else {
        // Single task: use existing single prompt
        const data = await PromptsService.postApiPromptsGenerate({
          taskId: taskIds[0]!.trim(), // Non-null assertion: length check above guarantees this exists
        });
        generatedPrompt.value = data.prompt || '';
      }

      currentTaskTitle.value = taskIds.length > 1
        ? `Multiple Tasks (${taskIds.length})`
        : combinedTitle || `Task ${taskIds[0]!}`; // Non-null assertion: length check above guarantees this exists
      currentAnalyticsType.value = combinedAnalyticsType || AnalyticsType.Overall;

      // Manual mode: Show success with copy instruction
      taskStore.addLog(`✅ Generated prompts for ${taskIds.length} task(s) successfully!`, 'success');
      taskStore.addLog(`📋 Analytics Type: ${currentAnalyticsType.value}`, 'info');
      taskStore.addLog(`📋 Copy the combined prompt above and paste it into Claude Desktop`, 'info');

      // Show success toast
      showSuccess(`Successfully generated prompt for ${taskIds.length} task${taskIds.length > 1 ? 's' : ''}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      taskStore.addLog(`❌ Error: ${message}`, 'error');
      generatedPrompt.value = null;

      // Show error toast - backend already provides user-friendly message
      showError(message);
    } finally {
      isGenerating.value = false;
    }
  };

  // Step 2: Submit Claude's response and create test cases
  const handleSubmitResponse = async (
    _taskId: string,
    response: string
  ) => {
    isSubmitting.value = true;
    try {
      // Filter out skipped tasks
      const activeTasks = taskAnalyticsInfos.value.filter(t => !t.skipped);

      if (activeTasks.length === 0) {
        throw new Error('All tasks are skipped. Please include at least one task.');
      }

      taskStore.addLog(`📤 Submitting response for ${activeTasks.length} task(s)...`, 'info');

      // Process each non-skipped task
      let totalCreated = 0;
      let totalFailed = 0;
      const results: Array<{ taskId: string; success: boolean; error?: string }> = [];

      for (let i = 0; i < activeTasks.length; i++) {
        const task = activeTasks[i]!; // Non-null assertion: loop guarantee
        taskStore.addLog(`[${i + 1}/${activeTasks.length}] Processing ${task.taskId}...`, 'info');

        try {
          const data = await PromptsService.postApiPromptsResponse({
            taskId: task.taskId,
            response,
            taskTitle: task.title,
            analyticsType: task.selectedType,
          });

          const testCasesCount = data.testCases?.length || 0;
          const browserStack = data.browserStack;

          taskStore.addLog(`  ✅ ${task.taskId}: ${testCasesCount} test cases parsed`, 'success');

          if (browserStack) {
            taskStore.addLog(`  📁 Folder: ${browserStack.folderName}`, 'info');
            taskStore.addLog(`  ✅ Created: ${browserStack.createdCount}/${testCasesCount}`, 'success');

            if (browserStack.failedCount > 0) {
              taskStore.addLog(`  ⚠️  Failed: ${browserStack.failedCount} test case(s)`, 'warning');
            }

            totalCreated += browserStack.createdCount;
            totalFailed += browserStack.failedCount;
          }

          // Add or update task in store
          const existingTask = taskStore.tasks.find(t => t.id === task.taskId);
          if (existingTask) {
            taskStore.updateTask(task.taskId, {
              status: TaskStatus.Success,
              testCasesCreated: testCasesCount,
              timestamp: Date.now(),
            });
          } else {
            taskStore.addTask({
              id: task.taskId,
              title: task.title || `Test cases for ${task.taskId}`,
              status: TaskStatus.Success,
              analyticsType: (task.selectedType as AnalyticsType) || AnalyticsType.Overall,
              testCasesCreated: testCasesCount,
              timestamp: Date.now(),
            });
          }

          results.push({ taskId: task.taskId, success: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          taskStore.addLog(`  ❌ ${task.taskId}: ${errorMessage}`, 'error');

          // Add or update task with failed status
          const existingTask = taskStore.tasks.find(t => t.id === task.taskId);
          if (existingTask) {
            taskStore.updateTask(task.taskId, {
              status: TaskStatus.Failed,
              error: errorMessage,
              timestamp: Date.now(),
            });
          } else {
            taskStore.addTask({
              id: task.taskId,
              title: task.title || `Test cases for ${task.taskId}`,
              status: TaskStatus.Failed,
              analyticsType: (task.selectedType as AnalyticsType) || AnalyticsType.Overall,
              error: errorMessage,
              timestamp: Date.now(),
            });
          }

          results.push({ taskId: task.taskId, success: false, error: errorMessage });
        }
      }

      // Summary
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      taskStore.addLog('', 'info'); // Empty line
      taskStore.addLog(`🎉 Batch Processing Complete!`, 'success');
      taskStore.addLog(`✅ Successful: ${successCount}/${activeTasks.length}`, 'success');
      if (failedCount > 0) {
        taskStore.addLog(`❌ Failed: ${failedCount}/${activeTasks.length}`, 'error');
      }
      taskStore.addLog(`📊 Total test cases created: ${totalCreated}`, 'success');
      if (totalFailed > 0) {
        taskStore.addLog(`⚠️  Total test cases failed: ${totalFailed}`, 'warning');
      }

      // Show notification
      if (successCount > 0) {
        showSuccess(
          `Successfully processed ${successCount} task${successCount > 1 ? 's' : ''} with ${totalCreated} test case${totalCreated !== 1 ? 's' : ''}`
        );
      }
      if (failedCount > 0) {
        showError(
          `${failedCount} task${failedCount > 1 ? 's' : ''} failed to process`
        );
      }

      // Clear state for next batch
      generatedPrompt.value = null;
      currentTaskId.value = null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      taskStore.addLog(`❌ Fatal Error: ${message}`, 'error');
      showError(`Failed to process tasks: ${message}`);
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
