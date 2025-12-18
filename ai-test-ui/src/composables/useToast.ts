import { ref } from 'vue';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Global state
const toasts = ref<ToastMessage[]>([]);
let toastIdCounter = 0;

export function useToast() {
  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = ++toastIdCounter;
    toasts.value.push({ id, message, type });
  };

  const showSuccess = (message: string) => {
    showToast(message, 'success');
  };

  const showError = (message: string) => {
    showToast(message, 'error');
  };

  const showInfo = (message: string) => {
    showToast(message, 'info');
  };

  const showWarning = (message: string) => {
    showToast(message, 'warning');
  };

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast,
  };
}
