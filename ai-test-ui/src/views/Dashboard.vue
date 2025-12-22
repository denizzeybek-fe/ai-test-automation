<template>
  <div class="min-h-screen bg-surface-100 dark:bg-surface-900 transition-colors">
    <!-- Header -->
    <DashboardHeader
      :connection-status="connectionStatus"
      :is-dark="isDark"
      @toggle-dark-mode="toggleDarkMode"
    />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Mode Badge -->
      <ModeBadge
        :mode="modeStore.mode"
        :is-loading="modeStore.isLoading"
        :message="modeStore.message"
        :on-toggle="modeStore.toggleMode"
      />

      <!-- Two Column Layout: Left (Workflow) + Right (Monitoring) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Workflow (2/3 width) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Task Input -->
          <TaskInput
            :is-generating="isGenerating"
            :is-submitting="isSubmitting"
            :generated-prompt="generatedPrompt"
            :task-analytics-infos="taskAnalyticsInfos"
            :available-types="availableTypes"
            :mode="modeStore.mode"
            @generate-prompt="handleGeneratePrompt"
            @submit-response="handleSubmitResponse"
            @clear="handleClear"
            @update-analytics-type="handleUpdateAnalyticsType"
            @toggle-skip="handleToggleSkip"
            @confirm-and-generate="handleConfirmAndGenerate"
            @generate-manual-prompt="handleGenerateManualPrompt"
          />
        </div>

        <!-- Right Column: Monitoring (1/3 width) -->
        <div class="space-y-6">
          <!-- Execution Viewer -->
          <ExecutionViewer
            :logs="executionLogs"
            :is-executing="isGenerating"
            @clear-logs="taskStore.clearLogs"
          />

          <!-- Task List -->
          <TaskList />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { useSocketStore } from '@/stores/socketStore';
import { useModeStore } from '@/stores/modeStore';
import { useDarkMode } from '@/composables/useDarkMode';
import { useTaskGeneration } from './_composables/useTaskGeneration';
import DashboardHeader from './_components/DashboardHeader.vue';
import TaskInput from './_components/TaskInput.vue';
import TaskList from './_components/TaskList.vue';
import ExecutionViewer from './_components/ExecutionViewer.vue';
import ModeBadge from '@/components/ModeBadge.vue';

const taskStore = useTaskStore();
const socketStore = useSocketStore();
const modeStore = useModeStore();
const { isDark, toggle: toggleDarkMode } = useDarkMode();

const executionLogs = computed(() => taskStore.executionLogs.map(log => log.message));
const connectionStatus = computed(() => socketStore.connectionStatus);

// Use task generation composable
const {
  isGenerating,
  isSubmitting,
  generatedPrompt,
  taskAnalyticsInfos,
  availableTypes,
  handleGeneratePrompt,
  handleSubmitResponse: handleSubmitResponseBase,
  handleClear,
  handleUpdateAnalyticsType,
  handleToggleSkip,
  handleConfirmAndGenerate,
  handleGenerateManualPrompt,
} = useTaskGeneration();

// Wrapper to handle response submission
const handleSubmitResponse = async (taskId: string, response: string) => {
  try {
    await handleSubmitResponseBase(taskId, response);
    // Note: Don't clear logs - keep them visible for user reference
    // Only clear inputs via taskAnalyticsInfos reset in useTaskGeneration
  } catch {
    // Error is already handled in handleSubmitResponseBase
    // Don't clear inputs on error so user can retry
  }
};

// Initialize WebSocket connection and detect mode on mount
onMounted(() => {
  socketStore.connect();
  modeStore.detectMode();
});

// Cleanup on unmount
onUnmounted(() => {
  socketStore.disconnect();
});
</script>
