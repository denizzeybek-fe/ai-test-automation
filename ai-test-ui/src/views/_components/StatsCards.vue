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
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Total Tasks -->
    <Card padding="md" :shadow="true">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Total Tasks</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2 transition-colors">
            {{ stats.totalTasks }}
          </p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      </div>
    </Card>

    <!-- Success Tasks -->
    <Card padding="md" :shadow="true">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Successful</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-2 transition-colors">
            {{ stats.successTasks }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">{{ successRate }}% success rate</p>
        </div>
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </Card>

    <!-- Failed Tasks -->
    <Card padding="md" :shadow="true">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Failed</p>
          <p class="text-3xl font-bold text-red-600 dark:text-red-400 mt-2 transition-colors">
            {{ stats.failedTasks }}
          </p>
        </div>
        <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </Card>

    <!-- Test Cases Created -->
    <Card padding="md" :shadow="true">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Test Cases</p>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2 transition-colors">
            {{ stats.testCasesCreated }}
          </p>
        </div>
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
    </Card>
  </div>
</template>
