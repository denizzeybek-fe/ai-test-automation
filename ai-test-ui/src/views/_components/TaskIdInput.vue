<template>
  <form
    class="space-y-3"
    @submit.prevent="onSubmit"
  >
    <div class="flex items-center gap-2">
      <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
      <h3 class="text-xs font-semibold text-gray-900 dark:text-white">
        Enter Task ID
      </h3>
    </div>

    <div class="flex flex-col gap-2">
      <label
        for="taskId"
        class="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Task ID <span class="text-red-500">*</span>
      </label>
      <InputText
        id="taskId"
        v-model="taskInput"
        placeholder="PA-12345 or PA-123, PA-456, PA-789"
        :disabled="isGenerating || hasGeneratedPrompt"
        :invalid="!!errorMessage"
        class="w-full"
      />
      <small
        v-if="errorMessage"
        class="text-red-600 dark:text-red-400"
      >{{ errorMessage }}</small>
    </div>

    <Button
      type="submit"
      :disabled="isGenerating || isSubmitting || hasGeneratedPrompt"
      :loading="isGenerating || (mode === Mode.Automatic && isSubmitting)"
      class="w-full"
    >
      {{ (isGenerating || isSubmitting) ? (mode === Mode.Automatic ? 'Processing Tasks...' : 'Fetching Task...') : (mode === Mode.Automatic ? 'Process Tasks' : 'Fetch Task') }}
    </Button>
  </form>
</template>

<script setup lang="ts">
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import { InputText, Button } from '@/components/ds';
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

// VeeValidate schema
const schema = yup.object({
  taskId: yup
    .string()
    .required('Please enter a task ID')
    .test('valid-task-id', 'Invalid task ID format. Expected format: PA-12345 or PA-123, PA-456', (value) => {
      if (!value) return false;
      const taskIds = value.trim().split(/[,\s]+/).filter(id => id.length > 0);
      return taskIds.every(id => /^[A-Z]+-\d+$/.test(id));
    }),
});

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
});

const { value: taskInput, errorMessage } = useField<string>('taskId');

const onSubmit = handleSubmit((values) => {
  emit('generatePrompt', values.taskId.trim());
});

// Expose method for parent to clear input
const clear = () => {
  resetForm();
};

defineExpose({ clear });
</script>
