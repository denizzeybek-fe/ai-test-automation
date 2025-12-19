import { useToast as usePrimeToast } from 'primevue/usetoast';

export function useToast() {
  const toast = usePrimeToast();

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warn' = 'info') => {
    toast.add({
      severity,
      summary: severity.charAt(0).toUpperCase() + severity.slice(1),
      detail: message,
      life: 3000,
    });
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
    showToast(message, 'warn');
  };

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
