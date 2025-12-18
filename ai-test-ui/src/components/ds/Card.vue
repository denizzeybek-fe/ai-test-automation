<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  shadow?: boolean;
  border?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  shadow: true,
  border: true,
});

const cardClasses = computed(() => {
  const base = 'bg-[#ffffff] dark:bg-gray-800 rounded-lg transition-colors';
  const shadowClass = props.shadow ? 'shadow-sm' : '';
  const borderClass = props.border ? 'border border-[#d3d3d3] dark:border-gray-700' : '';

  return `${base} ${shadowClass} ${borderClass}`;
});
</script>

<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>
