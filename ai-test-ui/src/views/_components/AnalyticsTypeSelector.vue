<script setup lang="ts">
import { Select, Button } from '@/components/ds';
import { SkipButtonLabel } from '../_enums/SkipButtonLabel';

interface TaskAnalyticsInfo {
  taskId: string;
  title: string;
  detectedType: string;
  hasKeywordMatch: boolean;
  selectedType: string;
  skipped: boolean;
}

interface Props {
  taskAnalyticsInfos: TaskAnalyticsInfo[];
  availableTypes: string[];
  isSubmitting: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  updateAnalyticsType: [taskId: string, type: string];
  toggleSkip: [taskId: string];
}>();
</script>

<template>
  <div
    v-if="taskAnalyticsInfos.length > 0"
    class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3"
  >
    <div class="flex items-center gap-2">
      <span
        class="flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold"
      >
        <i class="pi pi-chart-bar text-xs" />
      </span>
      <h3 class="text-xs font-semibold text-gray-900 dark:text-white">
        Analytics Type Selection
      </h3>
    </div>

    <div class="space-y-3">
      <div
        v-for="task in taskAnalyticsInfos"
        :key="task.taskId"
        class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ task.taskId }}
              </span>
              <span
                v-if="!task.hasKeywordMatch"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              >
                <i class="pi pi-exclamation-triangle text-xs" />
                No keyword matched
              </span>
              <span
                v-if="task.skipped"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
              >
                <i class="pi pi-forward text-xs" />
                Skipped
              </span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
              {{ task.title }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <Select
              :model-value="task.selectedType"
              :options="availableTypes"
              :disabled="task.skipped || isSubmitting"
              size="small"
              class="w-40"
              @update:model-value="(value) => emit('updateAnalyticsType', task.taskId, value)"
            />

            <Button
              :severity="task.skipped ? 'success' : 'warn'"
              :disabled="isSubmitting"
              size="small"
              outlined
              @click="emit('toggleSkip', task.taskId)"
            >
              {{ task.skipped ? SkipButtonLabel.Include : SkipButtonLabel.Skip }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
