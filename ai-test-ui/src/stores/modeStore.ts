import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Mode } from '@/enums';

const STORAGE_KEY = 'ai-test-mode-preference';

export const useModeStore = defineStore('mode', () => {
  const mode = ref<Mode>(Mode.Manual);
  const isLoading = ref(true);
  const message = ref('');
  const isCliAvailable = ref(false);

  const detectMode = async () => {
    // Check backend for Claude CLI availability
    try {
      const response = await fetch('http://localhost:3000/api/mode');
      const data = await response.json();

      isCliAvailable.value = data.available;

      // Check localStorage for user preference
      const savedMode = localStorage.getItem(STORAGE_KEY) as Mode | null;

      if (savedMode && Object.values(Mode).includes(savedMode)) {
        // User has a saved preference
        mode.value = savedMode;
        message.value = savedMode === Mode.Automatic
          ? 'Automatic mode (user preference)'
          : 'Manual mode (user preference)';
      } else {
        // No preference, default to Manual
        mode.value = Mode.Manual;
        message.value = 'Manual mode (default)';
      }
    } catch {
      // Fallback to manual mode if backend unavailable
      isCliAvailable.value = false;
      mode.value = Mode.Manual;
      message.value = 'Manual mode (backend unavailable)';
    } finally {
      isLoading.value = false;
    }
  };

  const toggleMode = () => {
    const newMode = mode.value === Mode.Automatic ? Mode.Manual : Mode.Automatic;
    mode.value = newMode;
    message.value = newMode === Mode.Automatic
      ? 'Automatic mode (user preference)'
      : 'Manual mode (user preference)';

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  return {
    mode,
    isLoading,
    message,
    isCliAvailable,
    detectMode,
    toggleMode,
  };
});
