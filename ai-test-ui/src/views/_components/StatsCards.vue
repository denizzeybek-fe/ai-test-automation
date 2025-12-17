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
  <Card title="Summary" padding="sm" :shadow="true">
    <div class="space-y-3">
      <!-- Total Tasks -->
      <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
        </div>
        <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stats.totalTasks }}</p>
      </div>

      <!-- Success Tasks -->
      <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Successful</p>
            <p class="text-xs text-gray-500 dark:text-gray-500">{{ successRate }}% rate</p>
          </div>
        </div>
        <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ stats.successTasks }}</p>
      </div>

      <!-- Failed Tasks -->
      <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Failed</p>
        </div>
        <p class="text-lg font-bold text-red-600 dark:text-red-400">{{ stats.failedTasks }}</p>
      </div>

      <!-- Test Cases Created -->
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Test Cases</p>
        </div>
        <p class="text-lg font-bold text-purple-600 dark:text-purple-400">{{ stats.testCasesCreated }}</p>
      </div>
    </div>
  </Card>
</template>
