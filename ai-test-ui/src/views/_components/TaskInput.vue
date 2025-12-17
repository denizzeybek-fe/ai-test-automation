<script setup lang="ts">
import { ref, computed } from 'vue';
import { Card, Input, Button } from '@/components/ds';

interface Props {
  isExecuting: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  submit: [taskIds: string[]];
  clear: [];
}>();

const taskInput = ref('');
const error = ref('');

const taskIds = computed(() => {
  return taskInput.value
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);
});

const isValid = computed(() => {
  return taskIds.value.length > 0 && taskIds.value.every(id => /^[A-Z]+-\d+$/.test(id));
});

const handleSubmit = () => {
  error.value = '';

  if (taskIds.value.length === 0) {
    error.value = 'Please enter at least one task ID';
    return;
  }

  const invalidIds = taskIds.value.filter(id => !/^[A-Z]+-\d+$/.test(id));
  if (invalidIds.length > 0) {
    error.value = `Invalid task ID format: ${invalidIds.join(', ')}. Expected format: PA-12345`;
    return;
  }

  emit('submit', taskIds.value);
};

const handleClear = () => {
  taskInput.value = '';
  error.value = '';
  emit('clear');
};
</script>

<template>
  <Card title="Run Tasks">
    <div class="space-y-4">
      <Input
        v-model="taskInput"
        type="text"
        label="Task IDs"
        placeholder="PA-12345, PA-67890"
        :disabled="isExecuting"
        :error="error"
        required
      />

      <div class="flex items-center gap-3">
        <Button
          variant="primary"
          :disabled="!isValid || isExecuting"
          :loading="isExecuting"
          @click="handleSubmit"
        >
          {{ isExecuting ? 'Processing...' : 'Run Tasks' }}
        </Button>

        <Button
          variant="secondary"
          :disabled="isExecuting"
          @click="handleClear"
        >
          Clear
        </Button>

        <div v-if="taskIds.length > 0" class="ml-auto text-sm text-gray-600">
          {{ taskIds.length }} task(s) ready
        </div>
      </div>

      <div class="text-sm text-gray-500">
        <p>Enter task IDs separated by commas. Example: PA-12345, PA-67890</p>
      </div>
    </div>
  </Card>
</template>
