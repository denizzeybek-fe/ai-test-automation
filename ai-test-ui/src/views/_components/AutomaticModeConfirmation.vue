<script setup lang="ts">
import { Button } from '@/components/ds';
import AnalyticsTypeSelector from './AnalyticsTypeSelector.vue';

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
  confirmAndGenerate: [];
  cancel: [];
}>();
</script>

<template>
  <div class="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
    <div class="flex items-center gap-2">
      <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
      <h3 class="text-xs font-semibold text-gray-900 dark:text-white">
        Review & Confirm Analytics Types
      </h3>
    </div>

    <!-- Analytics Type Selection -->
    <AnalyticsTypeSelector
      :task-analytics-infos="taskAnalyticsInfos"
      :available-types="availableTypes"
      :is-submitting="isSubmitting"
      @update-analytics-type="(taskId, type) => emit('updateAnalyticsType', taskId, type)"
      @toggle-skip="(taskId) => emit('toggleSkip', taskId)"
    />

    <!-- Confirm Button -->
    <div class="flex items-center gap-3">
      <Button
        variant="primary"
        :disabled="isSubmitting"
        :loading="isSubmitting"
        @click="emit('confirmAndGenerate')"
      >
        ✅ Confirm & Generate Test Cases
      </Button>

      <Button
        variant="secondary"
        :disabled="isSubmitting"
        @click="emit('cancel')"
      >
        Cancel
      </Button>
    </div>

    <p class="text-xs text-gray-500 dark:text-gray-400">
      Review the detected analytics types above. You can change them if needed, then click "Confirm & Generate" to proceed.
    </p>
  </div>
</template>
