<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'success' | 'failed' | 'pending' | 'progress' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  size: 'md',
});

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center font-medium rounded-full';

  const variants = {
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    progress: 'bg-blue-100 text-blue-800',
    info: 'bg-gray-100 text-gray-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return `${base} ${variants[props.variant]} ${sizes[props.size]}`;
});

const dotClasses = computed(() => {
  const variants = {
    success: 'bg-green-600',
    failed: 'bg-red-600',
    pending: 'bg-yellow-600',
    progress: 'bg-blue-600',
    info: 'bg-gray-600',
  };

  return `w-2 h-2 rounded-full mr-1.5 ${variants[props.variant]}`;
});
</script>

<template>
  <span :class="badgeClasses">
    <span :class="dotClasses" />
    <slot />
  </span>
</template>
