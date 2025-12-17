<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { useSocketStore } from '@/stores/socketStore';
import { useDarkMode } from '@/composables/useDarkMode';
import TaskInput from './_components/TaskInput.vue';
import StatsCards from './_components/StatsCards.vue';
import TaskList from './_components/TaskList.vue';
import ExecutionViewer from './_components/ExecutionViewer.vue';

const taskStore = useTaskStore();
const socketStore = useSocketStore();
const { isDark, toggle: toggleDarkMode } = useDarkMode();

const executionLogs = computed(() => taskStore.executionLogs.map(log => log.message));
const connectionStatus = computed(() => socketStore.connectionStatus);

// Two-step flow state
const isGenerating = ref(false);
const generatedPrompt = ref<string | null>(null);
const currentTaskId = ref<string | null>(null);

// Step 1: Generate prompt from Jira task
const handleGeneratePrompt = async (taskId: string) => {
  isGenerating.value = true;
  generatedPrompt.value = null;
  currentTaskId.value = taskId;
  taskStore.clearLogs();

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    taskStore.addLog(`📥 Fetching task ${taskId} from Jira...`, 'info');

    const response = await fetch(`${apiUrl}/api/prompts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate prompt');
    }

    const data = await response.json();
    generatedPrompt.value = data.prompt;
    taskStore.addLog(`✅ Prompt generated successfully!`, 'success');
    taskStore.addLog(`📋 Copy the prompt above and paste it into Claude Desktop`, 'info');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    taskStore.addLog(`❌ Error: ${message}`, 'error');
    generatedPrompt.value = null;
  } finally {
    isGenerating.value = false;
  }
};

// Step 2: Submit Claude's response and create test cases
const handleSubmitResponse = async (taskId: string, response: string) => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    taskStore.addLog(`📤 Submitting response for task ${taskId}...`, 'info');

    const res = await fetch(`${apiUrl}/api/prompts/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, response }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to submit response');
    }

    const data = await res.json();
    taskStore.addLog(`✅ Response processed successfully!`, 'success');
    taskStore.addLog(`📊 Test cases created: ${data.testCases?.length || 0}`, 'success');

    // Clear state for next task
    generatedPrompt.value = null;
    currentTaskId.value = null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    taskStore.addLog(`❌ Error: ${message}`, 'error');
  }
};

const handleClear = () => {
  taskStore.clearLogs();
  generatedPrompt.value = null;
  currentTaskId.value = null;
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
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white transition-colors">AI Test Automation</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">Automated test case generation</p>
          </div>
          <div class="flex items-center gap-3">
            <span
              v-if="connectionStatus === 'connected'"
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              <span class="w-2 h-2 bg-green-600 rounded-full mr-1.5" />
              Connected
            </span>
            <span
              v-else-if="connectionStatus === 'error'"
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
            >
              <span class="w-2 h-2 bg-red-600 rounded-full mr-1.5" />
              Error
            </span>
            <span
              v-else
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              <span class="w-2 h-2 bg-gray-600 rounded-full mr-1.5" />
              Disconnected
            </span>

            <!-- Dark Mode Toggle -->
            <button
              @click="toggleDarkMode"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <svg
                v-if="isDark"
                class="w-5 h-5 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <!-- Stats Cards -->
        <StatsCards />

        <!-- Task Input -->
        <TaskInput
          :is-generating="isGenerating"
          :generated-prompt="generatedPrompt"
          @generate-prompt="handleGeneratePrompt"
          @submit-response="handleSubmitResponse"
          @clear="handleClear"
        />

        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Execution Viewer (Left) -->
          <ExecutionViewer
            :logs="executionLogs"
            :is-executing="isGenerating"
          />

          <!-- Task List (Right) -->
          <TaskList />
        </div>
      </div>
    </main>
  </div>
</template>
