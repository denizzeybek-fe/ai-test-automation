import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Mode } from '@/enums';

export const useModeStore = defineStore('mode', () => {
  const mode = ref<Mode>(Mode.Manual);
  const isLoading = ref(true);
  const message = ref('');

  const detectMode = async () => {
    // Check for manual mode forced by query parameter
    const params = new URLSearchParams(window.location.search);
    const forcedManual = params.get('manual') === 'true';

    if (forcedManual) {
      mode.value = Mode.Manual;
      message.value = 'Manual mode (forced by query parameter)';
      isLoading.value = false;
      return;
    }

    // Check backend for Claude CLI availability
    try {
      const response = await fetch('http://localhost:3000/api/mode');
      const data = await response.json();

      mode.value = data.mode === 'automatic' ? Mode.Automatic : Mode.Manual;
      message.value = data.message;
    } catch (error) {
      // Fallback to manual mode if backend unavailable
      mode.value = Mode.Manual;
      message.value = 'Manual mode (backend unavailable)';
    } finally {
      isLoading.value = false;
    }
  };

  const toggleMode = () => {
    const currentUrl = new URL(window.location.href);

    if (mode.value === Mode.Automatic) {
      // Switch to manual
      currentUrl.searchParams.set('manual', 'true');
    } else {
      // Switch to automatic
      currentUrl.searchParams.delete('manual');
    }

    window.location.href = currentUrl.toString();
  };

  return {
    mode,
    isLoading,
    message,
    detectMode,
    toggleMode,
  };
});
