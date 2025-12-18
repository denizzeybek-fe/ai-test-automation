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

interface StatCard {
  label: string;
  value: number;
  bgColor: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  icon: string;
  subtitle?: string;
  borderColor: string;
}

const statCards = computed<StatCard[]>(() => [
  {
    label: 'Successful',
    value: stats.value.successTasks,
    bgColor: 'bg-emerald-50/60 dark:bg-green-900/20',
    iconBg: 'bg-emerald-100/80 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-emerald-600 dark:text-green-400',
    borderColor: 'border-emerald-100/50 dark:border-green-900/30',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    subtitle: `${successRate.value}%`,
  },
  {
    label: 'Failed',
    value: stats.value.failedTasks,
    bgColor: 'bg-rose-50/60 dark:bg-red-900/20',
    iconBg: 'bg-rose-100/80 dark:bg-red-900',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-rose-600 dark:text-red-400',
    borderColor: 'border-rose-100/50 dark:border-red-900/30',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Total Tasks',
    value: stats.value.totalTasks,
    bgColor: 'bg-blue-50/60 dark:bg-blue-900/20',
    iconBg: 'bg-blue-100/80 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-gray-900 dark:text-blue-400',
    borderColor: 'border-blue-100/50 dark:border-blue-900/30',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    label: 'Test Cases',
    value: stats.value.testCasesCreated,
    bgColor: 'bg-violet-50/60 dark:bg-purple-900/20',
    iconBg: 'bg-violet-100/80 dark:bg-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
    textColor: 'text-violet-600 dark:text-purple-400',
    borderColor: 'border-violet-100/50 dark:border-purple-900/30',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
]);
</script>

<template>
  <Card :shadow="true">
    <div class="p-3 grid grid-cols-2 gap-3 content-center">
      <div
        v-for="(card, index) in statCards"
        :key="index"
        :class="['flex flex-col items-center text-center p-3 rounded-lg border', card.bgColor, card.borderColor]"
      >
        <div :class="['w-8 h-8 rounded-lg flex items-center justify-center mb-2', card.iconBg]">
          <svg
            :class="['w-5 h-5', card.iconColor]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="card.icon"
            />
          </svg>
        </div>
        <p :class="['text-2xl font-bold', card.textColor]">
          {{ card.value }}
        </p>
        <p class="text-xs font-medium text-slate-600 dark:text-gray-400 mt-1">
          {{ card.label }}
        </p>
        <p
          v-if="card.subtitle"
          class="text-xs text-slate-500 dark:text-gray-500"
        >
          {{ card.subtitle }}
        </p>
      </div>
    </div>
  </Card>
</template>
