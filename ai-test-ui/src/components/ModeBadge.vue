<script setup lang="ts">
import { computed } from 'vue';
import { Mode } from '@/enums';

const props = defineProps<{
  mode: Mode;
  isLoading: boolean;
  message: string;
  onToggle: () => void;
}>();

const badgeClass = computed(() => ({
  'mode-badge': true,
  'mode-automatic': props.mode === Mode.Automatic,
  'mode-manual': props.mode === Mode.Manual,
  'loading': props.isLoading,
}));

const iconClass = computed(() => {
  if (props.isLoading) return 'pi pi-clock';
  return props.mode === Mode.Automatic ? 'pi pi-bolt' : 'pi pi-user';
});

const modeText = computed(() => {
  if (props.isLoading) return 'Detecting mode...';
  return props.mode === Mode.Automatic ? 'Automatic Mode' : 'Manual Mode';
});

const toggleMode = () => {
  props.onToggle();
};
</script>

<template>
  <div class="mode-badge-container">
    <div :class="badgeClass">
      <i :class="['icon', iconClass]" />
      <div class="content">
        <span class="title">{{ modeText }}</span>
        <span class="message">{{ message }}</span>
      </div>
      <button
        v-if="!isLoading"
        class="toggle-btn"
        :title="`Switch to ${mode === Mode.Automatic ? 'Manual' : 'Automatic'} Mode`"
        @click="toggleMode"
      >
        <i :class="mode === Mode.Automatic ? 'pi pi-user' : 'pi pi-bolt'" />
        {{ mode === Mode.Automatic ? ' Manual' : ' Auto' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.mode-badge-container {
  margin-bottom: 1.5rem;
}

.mode-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  border: 2px solid;
  transition: all 0.3s ease;
}

.mode-automatic {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #22c55e;
  color: #15803d;
}

.mode-manual {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
  color: #92400e;
}

.loading {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-color: #9ca3af;
  color: #4b5563;
  opacity: 0.7;
}

.icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.title {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.message {
  font-size: 0.75rem;
  opacity: 0.8;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid currentColor;
  background: white;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.mode-automatic .toggle-btn:hover {
  background: #22c55e;
  color: white;
  border-color: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.mode-manual .toggle-btn:hover {
  background: #f59e0b;
  color: white;
  border-color: #d97706;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.toggle-btn:active {
  transform: translateY(0);
}
</style>
