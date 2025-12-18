<script setup lang="ts">
import { computed } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { Card } from '@/components/ds';

const taskStore = useTaskStore();

const stats = computed(() => taskStore.stats);

const successRate = computed(() => {
  if (stats.value.totalTasks === 0) return 0;
  return Math.round((stats.value.successTasks / stats.value.totalTasks) * 100);
});
</script>

<template>
  <Card padding="sm" :shadow="true">
    <div class="grid grid-cols-2 gap-3">
      <!-- Total Tasks -->
      <div class="flex flex-col items-center text-center p-3 bg-blue-50/60 dark:bg-blue-900/20 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
        <div class="w-10 h-10 bg-blue-100/80 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-2">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalTasks }}</p>
        <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">Total Tasks</p>
      </div>

      <!-- Success Tasks -->
      <div class="flex flex-col items-center text-center p-3 bg-emerald-50/60 dark:bg-green-900/20 rounded-lg border border-emerald-100/50 dark:border-green-900/30">
        <div class="w-10 h-10 bg-emerald-100/80 dark:bg-green-900 rounded-lg flex items-center justify-center mb-2">
          <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-2xl font-bold text-emerald-600 dark:text-green-400">{{ stats.successTasks }}</p>
        <p class="text-xs font-medium text-slate-600 dark:text-gray-400 mt-1">Successful</p>
        <p class="text-xs text-slate-500 dark:text-gray-500">{{ successRate }}%</p>
      </div>

      <!-- Failed Tasks -->
      <div class="flex flex-col items-center text-center p-3 bg-rose-50/60 dark:bg-red-900/20 rounded-lg border border-rose-100/50 dark:border-red-900/30">
        <div class="w-10 h-10 bg-rose-100/80 dark:bg-red-900 rounded-lg flex items-center justify-center mb-2">
          <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-2xl font-bold text-rose-600 dark:text-red-400">{{ stats.failedTasks }}</p>
        <p class="text-xs font-medium text-slate-600 dark:text-gray-400 mt-1">Failed</p>
      </div>

      <!-- Test Cases Created -->
      <div class="flex flex-col items-center text-center p-3 bg-violet-50/60 dark:bg-purple-900/20 rounded-lg border border-violet-100/50 dark:border-purple-900/30">
        <div class="w-10 h-10 bg-violet-100/80 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-2">
          <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <p class="text-2xl font-bold text-violet-600 dark:text-purple-400">{{ stats.testCasesCreated }}</p>
        <p class="text-xs font-medium text-slate-600 dark:text-gray-400 mt-1">Test Cases</p>
      </div>
    </div>
  </Card>
</template>
