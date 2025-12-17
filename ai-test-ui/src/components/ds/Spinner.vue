<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  label: '',
});

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const spinnerColors = {
  primary: 'text-blue-600',
  white: 'text-white',
  gray: 'text-gray-600',
};

const spinnerClasses = computed(() => {
  return `animate-spin ${spinnerSizes[props.size]} ${spinnerColors[props.color]}`;
});
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <svg
      :class="spinnerClasses"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <p v-if="label" class="mt-2 text-sm text-gray-600">
      {{ label }}
    </p>
  </div>
</template>
