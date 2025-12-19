<script setup lang="ts">
import { ref, watch } from 'vue';
import { Card } from '@/components/ds';
import TaskIdInput from './TaskIdInput.vue';
import AutomaticModeConfirmation from './AutomaticModeConfirmation.vue';
import ManualModePromptResponse from './ManualModePromptResponse.vue';
import { Mode } from '@/enums';

interface TaskAnalyticsInfo {
  taskId: string;
  title: string;
  detectedType: string;
  hasKeywordMatch: boolean;
  selectedType: string;
  skipped: boolean;
}

interface Props {
  isGenerating: boolean;
  isSubmitting: boolean;
  generatedPrompt: string | null;
  taskAnalyticsInfos: TaskAnalyticsInfo[];
  availableTypes: string[];
  mode?: Mode;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  generatePrompt: [taskId: string];
  submitResponse: [taskId: string, response: string];
  clear: [];
  updateAnalyticsType: [taskId: string, type: string];
  toggleSkip: [taskId: string];
  confirmAndGenerate: [];
}>();

const taskIdInputRef = ref<InstanceType<typeof TaskIdInput> | null>(null);
const manualModeRef = ref<InstanceType<typeof ManualModePromptResponse> | null>(null);

// Watch for external clear trigger (when taskAnalyticsInfos is emptied after successful submit)
watch(() => props.taskAnalyticsInfos.length, (newLength, oldLength) => {
  // If we had tasks and now we don't (cleared after successful submit), clear inputs
  if (oldLength > 0 && newLength === 0) {
    taskIdInputRef.value?.clear();
    manualModeRef.value?.clear();
  }
});

const handleSubmitResponse = (response: string) => {
  // Get the task ID from somewhere - we need to track it
  // For now, emit with empty taskId since backend uses taskAnalyticsInfos
  emit('submitResponse', '', response);
};

const handleClear = () => {
  taskIdInputRef.value?.clear();
  manualModeRef.value?.clear();
  emit('clear');
};
</script>

<template>
  <Card>
    <div class="p-6 space-y-4">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
        Generate Test Cases
      </h3>

      <!-- Step 1: Task ID Input -->
      <TaskIdInput
        ref="taskIdInputRef"
        :is-generating="isGenerating"
        :is-submitting="isSubmitting"
        :has-generated-prompt="!!generatedPrompt"
        :mode="mode"
        @generate-prompt="(taskId) => emit('generatePrompt', taskId)"
      />

      <!-- Automatic Mode: Analytics Type Selection & Confirmation -->
      <AutomaticModeConfirmation
        v-if="mode === Mode.Automatic && taskAnalyticsInfos.length > 0 && !isSubmitting"
        :task-analytics-infos="taskAnalyticsInfos"
        :available-types="availableTypes"
        :is-submitting="isSubmitting"
        @update-analytics-type="(taskId, type) => emit('updateAnalyticsType', taskId, type)"
        @toggle-skip="(taskId) => emit('toggleSkip', taskId)"
        @confirm-and-generate="emit('confirmAndGenerate')"
        @cancel="handleClear"
      />

      <!-- Manual Mode: Prompt and Response -->
      <ManualModePromptResponse
        v-if="generatedPrompt && mode !== Mode.Automatic"
        ref="manualModeRef"
        :generated-prompt="generatedPrompt"
        :task-analytics-infos="taskAnalyticsInfos"
        :available-types="availableTypes"
        :is-submitting="isSubmitting"
        @submit-response="handleSubmitResponse"
        @update-analytics-type="(taskId, type) => emit('updateAnalyticsType', taskId, type)"
        @toggle-skip="(taskId) => emit('toggleSkip', taskId)"
        @clear="handleClear"
      />

      <!-- Help Text (Step 1 only) -->
      <div
        v-if="!generatedPrompt && taskAnalyticsInfos.length === 0"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        <p>Enter one or more task IDs (e.g., PA-12345 or PA-123, PA-456) to generate AI prompts for automated test case creation.</p>
      </div>
    </div>
  </Card>
</template>
