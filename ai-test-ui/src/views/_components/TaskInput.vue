<script setup lang="ts">
import { ref, computed } from 'vue';
import { Card, Input, Button } from '@/components/ds';

interface Props {
  isGenerating: boolean;
  isSubmitting: boolean;
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
    <div class="space-y-4 min-h-[280px]">
      <!-- Step 1: Task ID Input -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
          <h3 class="text-xs font-semibold text-gray-900 dark:text-white">Enter Task ID</h3>
        </div>

        <Input
          v-model="taskInput"
          type="text"
          label="Task ID"
          placeholder="PA-12345 or PA-123, PA-456, PA-789"
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

      <!-- Step 2 & 3: Prompt and Response Side by Side -->
      <div v-if="generatedPrompt" class="pt-6 border-t border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Step 2: Prompt Display -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
              <h3 class="text-xs font-semibold text-gray-900 dark:text-white">Copy Prompt to Claude</h3>
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
                Copy
              </Button>
            </div>
          </div>

          <!-- Step 3: Response Input -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
              <h3 class="text-xs font-semibold text-gray-900 dark:text-white">Paste Claude Response</h3>
            </div>

            <div>
              <textarea
                v-model="responseInput"
                rows="11"
                placeholder='Paste Claude response here (JSON format)...'
                :disabled="isSubmitting"
                class="w-full h-64 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="{ 'border-red-500': responseError }"
              />
              <p v-if="responseError" class="mt-1 text-sm text-red-600">
                {{ responseError }}
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 mt-4">
          <Button
            variant="primary"
            :disabled="!responseInput.trim() || isSubmitting"
            :loading="isSubmitting"
            @click="handleSubmitResponse"
          >
            {{ isSubmitting ? 'Creating Test Cases...' : 'Submit Response' }}
          </Button>

          <Button
            variant="secondary"
            :disabled="isSubmitting"
            @click="handleClear"
          >
            Clear All
          </Button>
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Copy the prompt above and paste it into Claude Desktop. Then paste Claude's response in the right panel.
        </p>
      </div>

      <!-- Help Text (Step 1 only) -->
      <div v-if="!generatedPrompt" class="text-sm text-gray-500 dark:text-gray-400">
        <p>Enter a single task ID (e.g., PA-12345) to generate a prompt for test case creation.</p>
      </div>
    </div>
  </Card>
</template>
