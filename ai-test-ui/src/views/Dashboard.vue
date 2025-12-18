<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { useSocketStore } from '@/stores/socketStore';
import { useDarkMode } from '@/composables/useDarkMode';
import { useTaskGeneration } from '@/composables/useTaskGeneration';
import DashboardHeader from './_components/DashboardHeader.vue';
import TaskInput from './_components/TaskInput.vue';
import TaskList from './_components/TaskList.vue';
import ExecutionViewer from './_components/ExecutionViewer.vue';

const taskStore = useTaskStore();
const socketStore = useSocketStore();
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
} = useTaskGeneration();

// Wrapper to auto-clear on success
const handleSubmitResponse = async (taskId: string, response: string) => {
  try {
    await handleSubmitResponseBase(taskId, response);
    // Auto-clear inputs after successful submission
    handleClear();
  } catch {
    // Error is already handled in handleSubmitResponseBase
    // Don't clear inputs on error so user can retry
  }
};

// Initialize WebSocket connection on mount
onMounted(() => {
  socketStore.connect();
});

// Cleanup on unmount
onUnmounted(() => {
  socketStore.disconnect();
});
</script>

<template>
  <div class="min-h-screen bg-[#f0f0f0] dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <DashboardHeader
      :connection-status="connectionStatus"
      :is-dark="isDark"
      @toggle-dark-mode="toggleDarkMode"
    />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            @generate-prompt="handleGeneratePrompt"
            @submit-response="handleSubmitResponse"
            @clear="handleClear"
            @update-analytics-type="handleUpdateAnalyticsType"
            @toggle-skip="handleToggleSkip"
          />
        </div>

        <!-- Right Column: Monitoring (1/3 width) -->
        <div class="space-y-6">
          <!-- Stats Cards -->
          <!-- <StatsCards /> -->

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
