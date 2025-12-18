<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { Card, Spinner, Button } from '@/components/ds';

interface Props {
  logs: string[];
  isExecuting: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  clearLogs: [];
}>();

const logsContainer = ref<HTMLElement | null>(null);

// Auto-scroll to bottom when new logs arrive
watch(
  () => props.logs.length,
  async () => {
    await nextTick();
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  }
);

const formatTimestamp = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
</script>

<template>
  <Card>
    <div class="h-[400px] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Execution Logs
        </h3>
        <Button
          v-if="logs.length > 0"
          variant="secondary"
          size="sm"
          @click="emit('clearLogs')"
        >
          Clear Logs
        </Button>
      </div>
      <!-- Logs Container -->
      <div
        ref="logsContainer"
        class="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-gray-900 font-mono text-sm"
      >
        <!-- Empty State -->
        <div
          v-if="logs.length === 0 && !isExecuting"
          class="h-full flex items-center justify-center text-gray-500 dark:text-gray-400"
        >
          <div class="text-center">
            <svg
              class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p class="text-sm">
              No execution running
            </p>
            <p class="text-xs mt-1">
              Logs will appear here when tasks are executed
            </p>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-if="logs.length === 0 && isExecuting"
          class="h-full flex items-center justify-center"
        >
          <Spinner
            size="lg"
            label="Initializing..."
          />
        </div>

        <!-- Log Lines -->
        <div
          v-if="logs.length > 0"
          class="space-y-1"
        >
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="text-slate-700 dark:text-gray-300 hover:bg-slate-100/70 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors"
          >
            <span class="text-gray-500 dark:text-gray-500 mr-2">[{{ formatTimestamp() }}]</span>
            <span
              :class="{
                'text-green-600 dark:text-green-400': log.includes('✅') || log.includes('success'),
                'text-red-600 dark:text-red-400': log.includes('❌') || log.includes('error') || log.includes('failed'),
                'text-yellow-600 dark:text-yellow-400': log.includes('⚠️') || log.includes('warning'),
                'text-blue-600 dark:text-blue-400': log.includes('ℹ️') || log.includes('info'),
              }"
            >{{ log }}</span>
          </div>
        </div>
      </div>

      <!-- Footer with Status -->
      <div class="px-4 py-2 bg-slate-100/50 dark:bg-gray-800 border-t border-slate-200/60 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
          <span
            v-if="isExecuting"
            class="flex items-center gap-1"
          >
            <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Executing...
          </span>
          <span
            v-else
            class="flex items-center gap-1"
          >
            <span class="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full" />
            Idle
          </span>
        </div>
        <div class="text-xs text-slate-600 dark:text-gray-400">
          {{ logs.length }} log line(s)
        </div>
      </div>
    </div>
  </Card>
</template>
