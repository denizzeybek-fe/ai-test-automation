import { ref, watch, onMounted } from 'vue';

const STORAGE_KEY = 'ai-test-automation-dark-mode';

export function useDarkMode() {
  const isDark = ref(false);

  const toggle = () => {
    isDark.value = !isDark.value;
  };

  const enable = () => {
    isDark.value = true;
  };

  const disable = () => {
    isDark.value = false;
  };

  // Apply dark mode class to document
  const applyDarkMode = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load from localStorage
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        isDark.value = stored === 'true';
      } else {
        // Default to system preference
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch (error) {
      console.error('Failed to load dark mode preference:', error);
    }
  };

  // Save to localStorage
  const saveToStorage = (value: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };

  // Watch for changes
  watch(isDark, (value) => {
    applyDarkMode(value);
    saveToStorage(value);
  });

  // Initialize on mount
  onMounted(() => {
    loadFromStorage();
    applyDarkMode(isDark.value);
  });

  return {
    isDark,
    toggle,
    enable,
    disable,
  };
}
