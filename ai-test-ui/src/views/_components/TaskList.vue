<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { Card, Badge, InputText } from '@/components/ds';
import { TaskStatus } from '@/types';
import type { TaskInfo } from '@/types';

const taskStore = useTaskStore();

const searchQuery = ref('');

const filteredTasks = computed(() => {
  if (!searchQuery.value) {
    return taskStore.recentTasks;
  }

  const query = searchQuery.value.toLowerCase();
  return taskStore.recentTasks.filter(task =>
    task.id.toLowerCase().includes(query) ||
    task.title.toLowerCase().includes(query) ||
    task.analyticsType.toLowerCase().includes(query)
  );
});

const tasks = computed(() => filteredTasks.value);

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusVariant = (status: TaskInfo['status']) => {
  const map: Record<string, 'success' | 'failed' | 'pending' | 'progress'> = {
    [TaskStatus.Success]: 'success',
    [TaskStatus.Failed]: 'failed',
    [TaskStatus.Pending]: 'pending',
    [TaskStatus.InProgress]: 'progress',
  };
  return map[status] || 'info';
};
</script>

<template>
  <Card>
    <template #title>
      <h3 class="text-lg font-semibold">
        Recent Tasks
      </h3>
    </template>
    <template #content>
      <div class="space-y-4">
        <!-- Search Bar -->
        <InputText
          v-model="searchQuery"
          type="search"
          placeholder="Search by ID, title, or type..."
          class="w-full"
        />
        <p
          v-if="searchQuery && tasks.length === 0"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          No tasks found matching "{{ searchQuery }}"
        </p>
        <p
          v-else-if="searchQuery"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          Found {{ tasks.length }} task(s)
        </p>

        <div class="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
          <!-- Empty State -->
          <div
            v-if="tasks.length === 0"
            class="p-8 text-center"
          >
            <i class="pi pi-file text-5xl text-gray-400 mb-3" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No tasks yet
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by running your first task.
            </p>
          </div>

          <!-- Task Items -->
          <div
            v-for="task in tasks"
            :key="task.id"
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ task.id }}
                  </p>
                  <Badge
                    :variant="getStatusVariant(task.status)"
                    size="sm"
                  >
                    {{ task.status }}
                  </Badge>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 truncate mb-2">
                  {{ task.title }}
                </p>
                <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ task.analyticsType }}</span>
                  <span>{{ formatDate(task.timestamp) }}</span>
                  <span v-if="task.testCasesCreated">
                    {{ task.testCasesCreated }} test cases
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
