<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Props {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000,
});

const emit = defineEmits<{
  close: [];
}>();

const isVisible = ref(false);

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 10);

  if (props.duration > 0) {
    setTimeout(() => {
      close();
    }, props.duration);
  }
});

const close = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300);
};

const colors = {
  success: 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700',
  error: 'bg-red-500 dark:bg-red-600 border-red-600 dark:border-red-700',
  info: 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-700',
  warning: 'bg-yellow-500 dark:bg-yellow-600 border-yellow-600 dark:border-yellow-700',
};

const iconColors = {
  success: 'text-white',
  error: 'text-white',
  info: 'text-white',
  warning: 'text-white',
};
</script>

<template>
  <div
    :class="[
      'flex items-center justify-between gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 min-w-80',
      colors[type],
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    ]"
  >
    <!-- Icon + Message -->
    <div class="flex items-center gap-3">
      <!-- Icon -->
      <div>
        <!-- Success Icon -->
        <svg
          v-if="type === 'success'"
          :class="['w-6 h-6', iconColors[type]]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <!-- Error Icon -->
        <svg
          v-else-if="type === 'error'"
          :class="['w-6 h-6', iconColors[type]]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <!-- Info Icon -->
        <svg
          v-else-if="type === 'info'"
          :class="['w-6 h-6', iconColors[type]]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <!-- Warning Icon -->
        <svg
          v-else
          :class="['w-6 h-6', iconColors[type]]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <!-- Message -->
      <p class="text-sm font-semibold text-white">
        {{ message }}
      </p>
    </div>

    <!-- Close Button -->
    <button
      class="text-white/80 hover:text-white transition-colors flex-shrink-0"
      @click="close"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</template>
