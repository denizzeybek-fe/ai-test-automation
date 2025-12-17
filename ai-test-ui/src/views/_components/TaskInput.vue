<script setup lang="ts">
import { ref, computed } from 'vue';
import { Card, Input, Button } from '@/components/ds';

interface Props {
  isGenerating: boolean;
  generatedPrompt: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  generatePrompt: [taskId: string];
  submitResponse: [taskId: string, response: string];
  clear: [];
}>();

// Step 1: Task ID Input
const taskInput = ref('');
const error = ref('');

// Step 2: Response Input
const responseInput = ref('');
const responseError = ref('');

const isValidTaskId = computed(() => {
  return taskInput.value.trim().length > 0 && /^[A-Z]+-\d+$/.test(taskInput.value.trim());
});

const handleGeneratePrompt = () => {
  error.value = '';

  if (!taskInput.value.trim()) {
    error.value = 'Please enter a task ID';
    return;
  }

  if (!isValidTaskId.value) {
    error.value = 'Invalid task ID format. Expected format: PA-12345';
    return;
  }

  emit('generatePrompt', taskInput.value.trim());
};

const handleSubmitResponse = () => {
  responseError.value = '';

  if (!responseInput.value.trim()) {
    responseError.value = 'Please paste the response from Claude';
    return;
  }

  // Try to parse as JSON to validate
  try {
    JSON.parse(responseInput.value);
  } catch {
    responseError.value = 'Invalid JSON format. Please paste the complete response from Claude.';
    return;
  }

  emit('submitResponse', taskInput.value.trim(), responseInput.value.trim());
};

const handleClear = () => {
  taskInput.value = '';
  responseInput.value = '';
  error.value = '';
  responseError.value = '';
  emit('clear');
};

const copyPrompt = () => {
  if (props.generatedPrompt) {
    navigator.clipboard.writeText(props.generatedPrompt);
  }
};
</script>

<template>
  <Card title="Generate Test Cases">
    <div class="space-y-6">
      <!-- Step 1: Task ID Input -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">1</span>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Enter Task ID</h3>
        </div>

        <Input
          v-model="taskInput"
          type="text"
          label="Task ID"
          placeholder="PA-12345"
          :disabled="isGenerating || !!generatedPrompt"
          :error="error"
          required
        />

        <Button
          variant="primary"
          :disabled="!isValidTaskId || isGenerating || !!generatedPrompt"
          :loading="isGenerating"
          @click="handleGeneratePrompt"
        >
          {{ isGenerating ? 'Generating Prompt...' : 'Generate Prompt' }}
        </Button>
      </div>

      <!-- Step 2: Prompt Display -->
      <div v-if="generatedPrompt" class="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 mb-2">
          <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">2</span>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Copy Prompt to Claude</h3>
        </div>

        <div class="relative">
          <div class="max-h-60 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-sm">
            <pre class="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{{ generatedPrompt }}</pre>
          </div>
          <Button
            variant="secondary"
            size="sm"
            class="absolute top-2 right-2"
            @click="copyPrompt"
          >
            Copy
          </Button>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          Copy this prompt and paste it into Claude Desktop. Then paste Claude's response below.
        </p>
      </div>

      <!-- Step 3: Response Input -->
      <div v-if="generatedPrompt" class="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 mb-2">
          <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">3</span>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Paste Claude Response</h3>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Response JSON <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="responseInput"
            rows="8"
            placeholder='Paste Claude response here (JSON format)...'
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'border-red-500': responseError }"
          />
          <p v-if="responseError" class="mt-1 text-sm text-red-600">
            {{ responseError }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <Button
            variant="primary"
            :disabled="!responseInput.trim()"
            @click="handleSubmitResponse"
          >
            Submit Response
          </Button>

          <Button
            variant="secondary"
            @click="handleClear"
          >
            Clear All
          </Button>
        </div>
      </div>

      <!-- Help Text (Step 1 only) -->
      <div v-if="!generatedPrompt" class="text-sm text-gray-500 dark:text-gray-400">
        <p>Enter a single task ID (e.g., PA-12345) to generate a prompt for test case creation.</p>
      </div>
    </div>
  </Card>
</template>
