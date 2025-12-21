<template>
  <header class="bg-surface-0 dark:bg-surface-900 shadow-sm border-b border-surface-200 dark:border-surface-700 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 transition-colors">
            AI Test Automation
          </h1>
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-1 transition-colors">
            Automated test case generation
          </p>
        </div>
        <div class="flex items-center gap-3">
          <Tag
            :severity="statusConfig.severity"
            :value="statusConfig.label"
            :icon="statusConfig.icon"
            rounded
            :class="{ 'animate-pulse': connectionStatus === ConnectionStatus.Connected }"
          />

          <Button
            :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            severity="secondary"
            text
            rounded
            @click="emit('toggleDarkMode')"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { computed } from 'vue';
import { ConnectionStatus } from '@/enums';

interface Props {
  connectionStatus: ConnectionStatus;
  isDark: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  toggleDarkMode: [];
}>();

const statusConfig = computed(() => {
  const configs: Record<ConnectionStatus, { severity: 'success' | 'danger' | 'secondary'; label: string; icon: string }> = {
    [ConnectionStatus.Connected]: {
      severity: 'success',
      label: 'Connected',
      icon: 'pi pi-circle-fill'
    },
    [ConnectionStatus.Error]: {
      severity: 'danger',
      label: 'Error',
      icon: 'pi pi-circle-fill'
    },
    [ConnectionStatus.Disconnected]: {
      severity: 'secondary',
      label: 'Disconnected',
      icon: 'pi pi-circle-fill'
    }
  };
  return configs[props.connectionStatus];
});
</script>
