# Vue.js Best Practices Skill

**Name:** vuejs-best-practices
**Version:** 1.0.0
**Last Updated:** 2025-12-21
**Description:** Vue.js 3 best practices for ai-test-ui project. Enforces folder structure, component limits, enum usage, Pinia patterns, and PrimeVue integration.

---

## Table of Contents

1. [Overview](#overview)
2. [Priority Levels](#priority-levels)
3. [Quick Decision Guide](#quick-decision-guide)
4. [Project Context](#project-context)
5. [Instructions](#instructions)
   - [Folder Structure](#-1-folder-structure)
   - [SFC Block Order](#-2-sfc-block-order)
   - [Component Line Limit](#-3-maximum-250-lines-per-component)
   - [Enum Usage](#-4-enum-usage-mandatory)
   - [API Client Usage](#-5-api-client-usage)
   - [Pinia Store Patterns](#-6-api-calls-in-pinia-store-actions-only)
6. [Common Anti-Patterns](#common-anti-patterns-to-avoid)
7. [Troubleshooting](#troubleshooting)
8. [Examples](#examples)
9. [Checklist](#checklist)

---

## Overview

This skill enforces Vue.js 3 best practices for `ai-test-ui`:

- 🗂️ Strict folder structure
- 📦 Component size limits (250 lines)
- 🔢 Enum-first approach (no string literals)
- 🏪 Pinia for API calls only
- 🎨 PrimeVue + Tailwind integration

**When to apply:** Every `.vue` file, store, and TypeScript code in the project.

---

## Priority Levels

- 🔴 **CRITICAL (Must)**: Breaks build/runtime if violated
- 🟡 **IMPORTANT (Should)**: Causes maintainability issues
- 🟢 **RECOMMENDED (Nice to have)**: Improves code quality

---

## Quick Decision Guide

**"Where should this code go?"**
```
Is it reusable across views?
├─ Yes → src/components/ or src/composables/
└─ No → src/views/[View]/_components/ or _composables/
```

**"Is this value a defined state?"**
```
Does this value have limited, known options? (status, mode, type)
├─ Yes → Create/use enum
└─ No → Can use string literal (user input, dynamic text)
```

**"How should I fetch API data?"**
```
Need to fetch/mutate data from API?
├─ Yes → Create Pinia store action, call from component
└─ No → Use local ref/reactive state
```

**"Where does this enum belong?"**
```
Is this enum used in multiple views?
├─ Yes → src/enums/ (with barrel export)
├─ No, only one view → src/views/[View]/_enums/
└─ From backend API → Use src/client/models/ (auto-generated)
```

---

## Project Context

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue | 3.5+ | Composition API + `<script setup>` |
| TypeScript | 5.9+ | Strict mode enabled |
| Vite | 7+ | Build tool |
| Pinia | 3+ | State management |
| PrimeVue | 4+ | UI components (Aura theme) |
| Tailwind CSS | 4+ | Utility-first CSS |
| VeeValidate + Yup | 4+ | Form validation |

---

## Instructions

### 🔴 1. Folder Structure

**Why:** Consistent structure enables quick navigation and clear ownership of code.

```
src/
├── client/                    # AUTO-GENERATED - Never edit manually!
│   ├── models/                # TypeScript interfaces from Swagger
│   └── services/              # API service classes
│
├── components/                # Global/shared components only
│
├── composables/               # Global composables only
│
├── enums/                     # Global enums with barrel export
│   └── index.ts               # Export all enums
│
├── stores/                    # Pinia stores (API calls here!)
│
├── types/                     # Global TypeScript types
│
└── views/
    ├── [ViewName].vue         # View component
    ├── _components/           # View-specific components
    ├── _composables/          # View-specific composables
    ├── _enums/                # View-specific enums
    └── _types/                # View-specific types
```

---

### 🔴 2. SFC Block Order

**Why:** ESLint `vue/block-order` rule enforces this. Build will fail if violated.

```vue
<template>
  <!-- Template first -->
</template>

<script setup lang="ts">
// Script second
</script>

<style scoped>
/* Style last (optional) */
</style>
```

---

### 🔴 3. Maximum 250 Lines Per Component

**Why:** Large components are hard to read, test, and maintain. Cognitive overload.

If a component exceeds 250 lines:
1. Extract logic → composable (`_composables/`)
2. Extract UI sections → sub-components (`_components/`)
3. Extract types → type files (`_types/`)

---

### 🔴 4. Enum Usage (MANDATORY)

**Why:** String literals are typo-prone, can't be refactored safely, and autocomplete doesn't work.

**NEVER use string literals for values that have defined states. ALWAYS use enums.**

#### ❌ Bad (String Literals)
```typescript
const status = 'pending';
if (mode === 'automatic') { ... }
emit('update:status', 'success');
```

#### ✅ Good (Enums)
```typescript
import { TaskStatus } from '@/client/models/TaskStatus';
import { Mode } from '@/enums';

const status = TaskStatus.Pending;
if (mode === Mode.Automatic) { ... }
emit('update:status', TaskStatus.Success);
```

#### Enum Placement Rules
| Scope | Location |
|-------|----------|
| Used in 2+ views | `src/enums/` |
| One view only | `src/views/[View]/_enums/` |
| From API | Use `src/client/models/` (auto-generated) |

#### Creating New Enums
```typescript
// src/enums/ConnectionStatus.ts
export enum ConnectionStatus {
  Connected = 'connected',
  Disconnected = 'disconnected',
  Error = 'error',
}

// src/enums/index.ts - Add to barrel export
export { ConnectionStatus } from './ConnectionStatus';
```

---

### 🔴 5. API Client Usage

**Why:** Generated client ensures type safety and stays in sync with backend Swagger spec.

#### Always Use Generated Client
```typescript
// ✅ CORRECT
import { PromptsService, TasksService } from '@/client';
import type { GeneratePromptRequest, PromptResponse } from '@/client';

// ❌ WRONG - Never use raw fetch/axios
fetch('/api/prompts/generate', { ... });
```

#### Regenerate After Backend Changes
```bash
yarn gcl
```

---

### 🔴 6. API Calls in Pinia Store Actions Only

**Why:** Separation of concerns. Components handle UI, stores handle data. Easier to test and debug.

#### ✅ Correct Pattern
```typescript
// stores/taskStore.ts
import { TasksService } from '@/client';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<TaskInfo[]>([]);

  const fetchTasks = async () => {
    const response = await TasksService.getApiTasks();
    tasks.value = response;
  };

  return { tasks, fetchTasks };
});

// Component - dispatch action
const taskStore = useTaskStore();
await taskStore.fetchTasks();
```

#### ❌ Wrong Pattern
```typescript
// In component - NEVER do this
const response = await TasksService.getApiTasks();
```

---

### 🟡 7. Composables Structure

**Why:** Consistent structure makes composables predictable and easy to use.

```typescript
// composables/useXxx.ts
import { ref, computed, onMounted } from 'vue';

export function useXxx() {
  // 1. State
  const value = ref('');

  // 2. Computed
  const isEmpty = computed(() => !value.value);

  // 3. Methods
  const reset = () => { value.value = ''; };

  // 4. Lifecycle (if needed)
  onMounted(() => { ... });

  // 5. Return all
  return { value, isEmpty, reset };
}
```

---

### 🟡 8. PrimeVue Integration

**Why:** PrimeVue tokens automatically handle dark mode. Hardcoded colors break theme switching.

```html
<!-- ✅ CORRECT - PrimeVue surface tokens -->
<div class="bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-surface-0">

<!-- ❌ WRONG - Hardcoded colors -->
<div class="bg-white dark:bg-gray-800 text-black dark:text-white">
```

---

### 🟢 9. DRY Principle

**Why:** Duplicated code means duplicated bugs and maintenance burden.

#### Extract Repeated Logic
```typescript
// ❌ Repeated check
if (status === TaskStatus.Pending) { ... }
if (status === TaskStatus.Pending) { ... }

// ✅ Single computed
const isPending = computed(() => status.value === TaskStatus.Pending);
```

#### Extract Repeated UI
If the same UI pattern appears 2+ times, create a component.

---

## Common Anti-Patterns to Avoid

### ❌ Direct API Calls in Components

```typescript
// Component code
const tasks = await TasksService.getApiTasks(); // WRONG!
```

**Why it's bad:** Breaks separation of concerns, hard to test, duplicated error handling
**Fix:** Move to store action

---

### ❌ String Literals for State Values

```typescript
if (status === 'pending') // Typo risk: 'peding' won't be caught!
type Status = 'pending' | 'success'; // No autocomplete
```

**Fix:** Use `TaskStatus.Pending` enum

---

### ❌ Huge Components (>250 lines)

**Why it's bad:** Hard to read, test, and maintain. Violates single responsibility.
**Fix:** Split into composables and sub-components

---

### ❌ Global Composables for View-Specific Logic

```typescript
// src/composables/useDashboardForm.ts  // WRONG location!
```

**Fix:** Move to `src/views/Dashboard/_composables/useDashboardForm.ts`

---

## After Every Change

```bash
# TypeScript validation
yarn type-check

# ESLint fix (includes vue/block-order)
yarn lint:fix
```

Both must pass before committing.

### After Backend API Changes

If the backend modified any Swagger endpoints (new endpoints, changed schemas, etc.):

```bash
# Regenerate API client from backend swagger
yarn gcl
```

**Important:** Always regenerate the client after backend changes to:
- New endpoints added
- Request/response schemas changed
- New models/enums added to swagger
- Endpoint paths or methods modified

---

## Troubleshooting

### "Type errors after backend changes"
```bash
yarn gcl        # Regenerate client
yarn type-check # Verify types
```

### "Component too large (>250 lines)"
1. Extract logic → `_composables/`
2. Extract UI sections → `_components/`
3. Extract types → `_types/`

### "Where to put this enum?"
| Used in... | Location |
|------------|----------|
| 2+ views | `src/enums/` |
| One view only | `src/views/[View]/_enums/` |
| From API | Use `src/client/models/` |

### "ESLint block-order error"
Ensure SFC order is: `<template>` → `<script>` → `<style>`

---

## Examples

### Creating a New View with Full Structure

```bash
src/views/
├── Settings.vue
├── _components/
│   ├── SettingsForm.vue
│   └── SettingsHeader.vue
├── _composables/
│   └── useSettingsForm.ts
├── _enums/
│   └── SettingsTab.ts
└── _types/
    └── SettingsFormData.ts
```

### Using Enums in Components

```vue
<template>
  <Tag :severity="statusConfig.severity" :value="statusConfig.label" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';
import { TaskStatus } from '@/client/models/TaskStatus';

interface Props {
  status: TaskStatus;
}

const props = defineProps<Props>();

const statusConfig = computed(() => {
  const configs: Record<TaskStatus, { severity: string; label: string }> = {
    [TaskStatus.Pending]: { severity: 'info', label: 'Pending' },
    [TaskStatus.Success]: { severity: 'success', label: 'Success' },
    [TaskStatus.Failed]: { severity: 'danger', label: 'Failed' },
  };
  return configs[props.status];
});
</script>
```

### Store with API Integration

```typescript
// stores/settingsStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { SettingsService } from '@/client';
import type { Settings } from '@/client';

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<Settings | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  const fetchSettings = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      settings.value = await SettingsService.getApiSettings();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      isLoading.value = false;
    }
  };

  const updateSettings = async (data: Partial<Settings>) => {
    await SettingsService.patchApiSettings(data);
    await fetchSettings(); // Refresh
  };

  return { settings, isLoading, error, fetchSettings, updateSettings };
});
```

---

## Checklist

Before submitting code, verify:

- [ ] 🔴 No string literals for defined states (use enums)
- [ ] 🔴 API calls only in Pinia store actions
- [ ] 🔴 Components under 250 lines
- [ ] 🔴 SFC order: template → script → style
- [ ] 🔴 Using `src/client/` types and services
- [ ] 🟡 View-specific code in `_components/`, `_enums/`, etc.
- [ ] 🟡 PrimeVue surface tokens for colors
- [ ] 🟢 No duplicated logic (DRY)
- [ ] ✅ `yarn type-check` passes
- [ ] ✅ `yarn lint:fix` passes
