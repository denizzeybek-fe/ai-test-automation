import { ref, watch } from 'vue';

const STORAGE_KEY = 'ai-test-automation-dark-mode';

// Shared state across all instances
const isDark = ref(false);
let initialized = false;

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
      return stored === 'true';
    } else {
      // Default to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  } catch (error) {
    console.error('Failed to load dark mode preference:', error);
    return false;
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

// Initialize once
if (!initialized) {
  isDark.value = loadFromStorage();
  applyDarkMode(isDark.value);
  initialized = true;

  // Watch for changes
  watch(isDark, (value) => {
    applyDarkMode(value);
    saveToStorage(value);
  });
}

export function useDarkMode() {
  const toggle = () => {
    isDark.value = !isDark.value;
  };

  const enable = () => {
    isDark.value = true;
  };

  const disable = () => {
    isDark.value = false;
  };

  return {
    isDark,
    toggle,
    enable,
    disable,
  };
}
