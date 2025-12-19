<script setup lang="ts">
import { ref, computed } from 'vue';
import { Input, Button } from '@/components/ds';
import { Mode } from '@/enums';

interface Props {
  isGenerating: boolean;
  isSubmitting: boolean;
  hasGeneratedPrompt: boolean;
  mode?: Mode;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  generatePrompt: [taskId: string];
}>();

const taskInput = ref('');
const error = ref('');

const isValidTaskId = computed(() => {
  if (!taskInput.value.trim()) return false;

  // Support both single and multiple task IDs separated by comma or space
  const taskIds = taskInput.value.trim().split(/[,\s]+/).filter(id => id.length > 0);

  // Each task ID must match format: PA-12345
  return taskIds.every(id => /^[A-Z]+-\d+$/.test(id));
});

const handleGeneratePrompt = () => {
  error.value = '';

  if (!taskInput.value.trim()) {
    error.value = 'Please enter a task ID';
    return;
  }

  if (!isValidTaskId.value) {
    error.value = 'Invalid task ID format. Expected format: PA-12345 or PA-123, PA-456';
    return;
  }

  emit('generatePrompt', taskInput.value.trim());
};

// Expose method for parent to clear input
const clear = () => {
  taskInput.value = '';
  error.value = '';
};

defineExpose({ clear });
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
      <h3 class="text-xs font-semibold text-gray-900 dark:text-white">
        Enter Task ID
      </h3>
    </div>

    <Input
      v-model="taskInput"
      type="text"
      label="Task ID"
      placeholder="PA-12345 or PA-123, PA-456, PA-789"
      :disabled="isGenerating || hasGeneratedPrompt"
      :error="error"
      required
    />

    <Button
      variant="primary"
      :disabled="!isValidTaskId || isGenerating || isSubmitting || hasGeneratedPrompt"
      :loading="isGenerating || (mode === Mode.Automatic && isSubmitting)"
      @click="handleGeneratePrompt"
    >
      {{ (isGenerating || isSubmitting) ? (mode === Mode.Automatic ? 'Processing Tasks...' : 'Generating Prompt...') : (mode === Mode.Automatic ? 'Process Tasks' : 'Generate Prompt') }}
    </Button>
  </div>
</template>
