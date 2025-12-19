<script setup lang="ts">
interface Props {
  connectionStatus: 'connected' | 'disconnected' | 'error';
  isDark: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  toggleDarkMode: [];
}>();
</script>

<template>
  <header class="bg-[#ffffff] dark:bg-gray-800 shadow-sm border-b border-[#d3d3d3] dark:border-gray-700 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-[#1a1a40] dark:text-white transition-colors">
            AI Test Automation
          </h1>
          <p class="text-sm text-[#a9a9a9] dark:text-gray-400 mt-1 transition-colors">
            Automated test case generation
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="connectionStatus === 'connected'"
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
          >
            <span class="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
            Connected
          </span>
          <span
            v-else-if="connectionStatus === 'error'"
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
          >
            <span class="w-2 h-2 bg-red-500 rounded-full mr-1.5" />
            Error
          </span>
          <span
            v-else
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#d3d3d3] dark:bg-gray-700 text-[#a9a9a9] dark:text-gray-300"
          >
            <span class="w-2 h-2 bg-[#a9a9a9] dark:bg-gray-400 rounded-full mr-1.5" />
            Disconnected
          </span>

          <!-- Dark Mode Toggle -->
          <button
            class="p-2 rounded-lg bg-[#f0f0f0] dark:bg-gray-700 hover:bg-[#d3d3d3] dark:hover:bg-gray-600 transition-colors"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="emit('toggleDarkMode')"
          >
            <i
              v-if="isDark"
              class="pi pi-sun text-lg text-yellow-400"
            />
            <i
              v-else
              class="pi pi-moon text-lg text-[#1a1a40]"
            />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
