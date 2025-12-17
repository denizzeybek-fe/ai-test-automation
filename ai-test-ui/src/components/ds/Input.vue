<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  error: '',
  label: '',
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputClasses = computed(() => {
  const base = 'w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white';
  const errorClass = props.error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500';
  return `${base} ${errorClass}`;
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="inputClasses"
      @input="handleInput"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
