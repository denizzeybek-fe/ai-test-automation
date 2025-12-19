<template>
  <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Step 2: Prompt Display -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
          <h3 class="text-xs font-semibold text-gray-900 dark:text-white">
            Copy Prompt to Claude
          </h3>
        </div>

        <div class="relative">
          <div class="h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-xs">
            <pre class="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{{ generatedPrompt }}</pre>
          </div>
          <Button
            variant="secondary"
            size="sm"
            class="absolute top-2 right-2"
            @click="copyPrompt"
          >
            {{ isCopied ? 'Copied!' : 'Copy' }}
          </Button>
        </div>
      </div>

      <!-- Step 3: Response Input -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
          <h3 class="text-xs font-semibold text-gray-900 dark:text-white">
            Paste Claude Response
          </h3>
        </div>

        <div class="flex flex-col gap-2">
          <Textarea
            v-model="responseInput"
            :rows="11"
            placeholder="Paste Claude's complete response here..."
            :disabled="isSubmitting"
            :invalid="!!errorMessage"
            class="w-full font-mono text-xs"
          />
          <small
            v-if="errorMessage"
            class="text-red-600 dark:text-red-400"
          >{{ errorMessage }}</small>
        </div>
      </div>
    </div>

    <!-- Analytics Type Selection -->
    <AnalyticsTypeSelector
      :task-analytics-infos="taskAnalyticsInfos"
      :available-types="availableTypes"
      :is-submitting="isSubmitting"
      @update-analytics-type="(taskId, type) => emit('updateAnalyticsType', taskId, type)"
      @toggle-skip="(taskId) => emit('toggleSkip', taskId)"
    />

    <!-- Action Buttons -->
    <div class="flex items-center gap-3 mt-4">
      <Button
        :disabled="isSubmitting"
        :loading="isSubmitting"
        @click="onSubmit"
      >
        {{ isSubmitting ? 'Creating Test Cases...' : 'Submit Response' }}
      </Button>

      <Button
        severity="secondary"
        :disabled="isSubmitting"
        @click="emit('clear')"
      >
        Clear All
      </Button>
    </div>

    <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <p class="text-xs text-blue-900 dark:text-blue-300 font-medium mb-2">
        <i class="pi pi-info-circle mr-1" />
        Important Instructions:
      </p>
      <ol class="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
        <li>Copy the prompt above and paste it into Claude Desktop or Claude.ai</li>
        <li>Wait for Claude to generate the complete JSON response</li>
        <li>Copy the <strong>entire JSON response</strong> (starting with <code class="bg-blue-100 dark:bg-blue-950 px-1 rounded">&#123;</code> and ending with <code class="bg-blue-100 dark:bg-blue-950 px-1 rounded">&#125;</code>)</li>
        <li>Paste it in the "Paste Claude Response" field on the right</li>
      </ol>
      <p class="text-xs text-blue-700 dark:text-blue-400 mt-2">
        <strong>Expected format:</strong> <code class="bg-blue-100 dark:bg-blue-950 px-1 rounded">&#123; "TASK-ID": [test cases...] &#125;</code>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import { Button, Textarea } from '@/components/ds';
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
  generatedPrompt: string;
  taskAnalyticsInfos: TaskAnalyticsInfo[];
  availableTypes: string[];
  isSubmitting: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submitResponse: [response: string];
  updateAnalyticsType: [taskId: string, type: string];
  toggleSkip: [taskId: string];
  clear: [];
}>();

const isCopied = ref(false);

// VeeValidate schema
const schema = yup.object({
  response: yup
    .string()
    .required('Please paste the response from Claude')
    .min(10, 'Response seems too short. Please paste the complete response from Claude.')
    .test('has-content', 'Response cannot be empty or whitespace only', (value) => {
      return !!value && value.trim().length > 0;
    }),
});

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
});

const { value: responseInput, errorMessage } = useField<string>('response');

const onSubmit = handleSubmit((values) => {
  emit('submitResponse', values.response.trim());
});

const copyPrompt = async () => {
  await navigator.clipboard.writeText(props.generatedPrompt);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2000);
};

// Expose method for parent to clear input
const clear = () => {
  resetForm();
};

defineExpose({ clear });
</script>
