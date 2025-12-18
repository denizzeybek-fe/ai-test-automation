<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  border?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  padding: 'md',
  shadow: true,
  border: true,
});

const cardClasses = computed(() => {
  const base = 'bg-[#ffffff] dark:bg-gray-800 rounded-lg transition-colors';
  const shadowClass = props.shadow ? 'shadow-sm' : '';
  const borderClass = props.border ? 'border border-[#d3d3d3] dark:border-gray-700' : '';

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return `${base} ${shadowClass} ${borderClass} ${paddingClasses[props.padding]}`;
});
</script>

<template>
  <div :class="cardClasses">
    <h3 v-if="title" class="text-xl font-semibold text-gray-900 dark:text-white px-6 py-6 transition-colors">
      {{ title }}
    </h3>
    <slot />
  </div>
</template>
