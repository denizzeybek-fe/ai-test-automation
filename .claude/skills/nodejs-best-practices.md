# Node.js Best Practices Skill

**Name:** nodejs-best-practices
**Version:** 1.0.0
**Last Updated:** 2025-12-21
**Description:** Node.js + TypeScript best practices for ai-test-api project. Enforces folder structure, service patterns, Swagger integration, enum usage, and error handling.

---

## Table of Contents

1. [Overview](#overview)
2. [Priority Levels](#priority-levels)
3. [Quick Decision Guide](#quick-decision-guide)
4. [Project Context](#project-context)
5. [Instructions](#instructions)
   - [Folder Structure](#-1-folder-structure)
   - [ESM Module Usage](#-2-esm-module-usage)
   - [Enum Usage](#-3-enum-usage-mandatory)
   - [Service Pattern](#-4-service-pattern)
   - [API Route Pattern](#-5-api-route-pattern)
   - [Swagger Documentation](#-6-swagger-jsdoc)
   - [Error Handling](#-7-error-handling)
   - [Utils Pattern](#-8-utils-pattern)
6. [Common Anti-Patterns](#common-anti-patterns-to-avoid)
7. [Troubleshooting](#troubleshooting)
8. [Examples](#examples)
9. [Checklist](#checklist)

---

## Overview

This skill enforces Node.js + TypeScript best practices for `ai-test-api`:

- 🗂️ Strict folder structure (services, routes, types, utils)
- 🔢 Enum-first approach (no string literals)
- 🏗️ Class-based service pattern
- 📚 Swagger JSDoc for API documentation
- ⚠️ Structured error handling
- 🔄 ESM module system

**When to apply:** Every `.ts` file in the backend project.

---

## Priority Levels

- 🔴 **CRITICAL (Must)**: Breaks build/runtime if violated
- 🟡 **IMPORTANT (Should)**: Causes maintainability issues
- 🟢 **RECOMMENDED (Nice to have)**: Improves code quality

---

## Quick Decision Guide

**"Where should this code go?"**
```
Is it an external API integration? (BrowserStack, Jira, etc.)
├─ Yes → src/services/[name].service.ts
└─ No ↓

Is it an HTTP endpoint?
├─ Yes → src/api/routes/[name].route.ts
└─ No ↓

Is it a utility function? (retry, logging, etc.)
├─ Yes → src/utils/[name].ts
└─ No ↓

Is it business logic resolution? (mapping, rules)
├─ Yes → src/resolvers/[name].ts
└─ No → src/types/ for types, or reconsider structure
```

**"Is this value a defined state?"**
```
Does this value have limited, known options?
├─ Yes → Create enum in src/types/
└─ No → Can use string (user input, dynamic text)
```

**"How should I handle this error?"**
```
Is it a known, recoverable error?
├─ Yes → Use custom error class with error code
├─ No, network/transient → Use withRetry utility
└─ No, critical → Log and throw
```

---

## Project Context

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| TypeScript | 5.7+ | Type safety, strict mode |
| Express | 5+ | HTTP framework |
| Socket.io | 4+ | Real-time WebSocket |
| Swagger JSDoc | 6+ | API documentation |
| Axios | 1+ | HTTP client |
| Commander | 12+ | CLI framework |

---

## Instructions

### 🔴 1. Folder Structure

**Why:** Consistent structure enables quick navigation and clear separation of concerns.

```
src/
├── index.ts                   # CLI entry point
│
├── api/
│   ├── server.ts              # Express + Socket.io setup
│   ├── routes/                # HTTP route handlers
│   │   ├── tasks.route.ts
│   │   ├── prompts.route.ts
│   │   └── mode.route.ts
│   ├── swagger/               # Swagger configuration
│   │   └── config.ts
│   └── websocket/             # WebSocket handlers
│       └── handler.ts
│
├── services/                  # External API integrations
│   ├── browserstack.service.ts
│   ├── jira.service.ts
│   ├── claude-cli.service.ts
│   └── orchestrator.ts        # Workflow coordinator
│
├── resolvers/                 # Business logic / mapping
│   ├── rule-resolver.ts
│   └── folder-mapper.ts
│
├── types/                     # TypeScript types & enums
│   ├── index.ts               # Barrel export
│   └── error-codes.ts         # Error code enums
│
├── utils/                     # Utility functions
│   ├── with-retry.ts
│   ├── error-logger.ts
│   └── batch-manager.ts
│
└── config/                    # Configuration files (JSON)
    ├── folders.config.json
    └── rules.config.json
```

---

### 🔴 2. ESM Module Usage

**Why:** Project uses `"type": "module"` in package.json. CommonJS syntax will break.

#### ✅ Correct (ESM)
```typescript
// Imports
import { Router } from 'express';
import { Orchestrator } from '../services/orchestrator.js'; // .js extension!

// Exports
export class MyService { }
export default router;
export { AnalyticsType } from './types.js';
```

#### ❌ Wrong (CommonJS)
```typescript
const express = require('express'); // WRONG!
module.exports = router; // WRONG!
```

#### File Extension Rule
Always use `.js` extension in imports (TypeScript compiles to .js):
```typescript
import { Config } from '../types/index.js';  // ✅ Correct
import { Config } from '../types/index';     // ❌ Wrong
```

---

### 🔴 3. Enum Usage (MANDATORY)

**Why:** String literals are typo-prone, can't be refactored safely, and autocomplete doesn't work.

**NEVER use string literals for values that have defined states. ALWAYS use enums.**

#### ❌ Bad (String Literals)
```typescript
const status = 'success';
if (type === 'overall') { ... }
res.json({ status: 'failed' });
```

#### ✅ Good (Enums)
```typescript
import { TaskStatus, AnalyticsType } from '../types/index.js';

const status = TaskStatus.Success;
if (type === AnalyticsType.Overall) { ... }
res.json({ status: TaskStatus.Failed });
```

#### Creating Enums
```typescript
// src/types/index.ts
export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Success = 'success',
  Failed = 'failed',
}

export enum AnalyticsType {
  Overall = 'overall',
  Homepage = 'homepage',
  Onsite = 'onsite',
  Usage = 'usage',
  Other = 'other',
}
```

#### Barrel Export Pattern
```typescript
// src/types/index.ts
export * from './error-codes.js';
export { TaskStatus, AnalyticsType, /* ... */ };
```

---

### 🔴 4. Service Pattern

**Why:** Class-based services encapsulate external API logic, are testable, and follow single responsibility.

```typescript
// src/services/example.service.ts
import axios, { AxiosInstance } from 'axios';

export class ExampleService {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.example.com',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
  }

  async getItems(): Promise<Item[]> {
    try {
      const response = await this.client.get<{ items: Item[] }>('/items');
      return response.data.items;
    } catch (error) {
      throw this.handleError(error, 'Failed to get items');
    }
  }

  private handleError(error: unknown, message: string): Error {
    if (axios.isAxiosError(error)) {
      return new Error(`${message}: ${error.response?.data?.message || error.message}`);
    }
    return new Error(`${message}: ${(error as Error).message}`);
  }
}
```

---

### 🔴 5. API Route Pattern

**Why:** Consistent route structure with Swagger docs makes API predictable and documented.

```typescript
// src/api/routes/example.route.ts
import { Router } from 'express';
import { ExampleService } from '../../services/example.service.js';

const router = Router();
const service = new ExampleService(process.env.API_KEY!);

/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Get all examples
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', async (req, res) => {
  try {
    const items = await service.getItems();
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
```

---

### 🟡 6. Swagger JSDoc

**Why:** API documentation is auto-generated from JSDoc comments. Frontend uses this to generate client.

#### Route Documentation
```typescript
/**
 * @swagger
 * /api/tasks/run:
 *   post:
 *     summary: Run test case generation
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RunTasksRequest'
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid request
 */
```

#### Schema Documentation
```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     TaskStatus:
 *       type: string
 *       enum: [pending, in-progress, success, failed]
 *     TaskInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: PA-12345
 *         status:
 *           $ref: '#/components/schemas/TaskStatus'
 */
```

#### After API Changes
Frontend regenerates client with:
```bash
cd ai-test-ui && yarn gcl
```

---

### 🟡 7. Error Handling

**Why:** Consistent error handling with codes makes debugging easier.

#### Error Codes Enum
```typescript
// src/types/error-codes.ts
export enum ErrorCode {
  // Jira Errors (1xxx)
  JIRA_TASK_NOT_FOUND = 'JIRA_1001',
  JIRA_AUTH_FAILED = 'JIRA_1002',

  // BrowserStack Errors (2xxx)
  BS_FOLDER_NOT_FOUND = 'BS_2001',
  BS_DUPLICATE_TEST_CASE = 'BS_2002',

  // AI Errors (3xxx)
  AI_INVALID_RESPONSE = 'AI_3001',
}
```

#### Custom Error Class
```typescript
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Usage
throw new AppError(ErrorCode.JIRA_TASK_NOT_FOUND, `Task ${taskId} not found`, 404);
```

#### Retry Utility
```typescript
// src/utils/with-retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  throw lastError!;
}
```

---

### 🟢 8. Utils Pattern

**Why:** Utilities should be pure functions, reusable, and well-typed.

```typescript
// src/utils/batch-manager.ts
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Usage
const batches = chunk(['a', 'b', 'c', 'd'], 2);
// [['a', 'b'], ['c', 'd']]
```

---

## Common Anti-Patterns to Avoid

### ❌ String Literals for State Values

```typescript
if (status === 'succes') { } // Typo won't be caught!
```

**Fix:** Use `TaskStatus.Success` enum

---

### ❌ Missing .js Extension in Imports

```typescript
import { Config } from '../types/index'; // ESM will fail!
```

**Fix:** Add `.js` extension: `'../types/index.js'`

---

### ❌ CommonJS in ESM Project

```typescript
const express = require('express');
module.exports = router;
```

**Fix:** Use ESM: `import express from 'express'` and `export default router`

---

### ❌ Inline Error Messages

```typescript
throw new Error('Failed to fetch task from Jira');
// Hard to search, no error code
```

**Fix:** Use error codes: `throw new AppError(ErrorCode.JIRA_TASK_NOT_FOUND, ...)`

---

### ❌ Business Logic in Routes

```typescript
router.post('/run', async (req, res) => {
  // 50 lines of business logic here... WRONG!
});
```

**Fix:** Move to service or orchestrator

---

## After Every Change

```bash
# TypeScript validation
npm run type-check

# ESLint fix
npm run lint:fix
```

Both must pass before committing.

### After Swagger Changes

If you modified any `@swagger` JSDoc comments (added/changed endpoints, schemas, or request/response types):

```bash
# Regenerate frontend API client
cd ../ai-test-ui && npm run gcl
```

**Important:** Always regenerate the client after:
- Adding new endpoints
- Changing request/response schemas
- Adding new models/enums to swagger
- Modifying endpoint paths or methods

---

## Troubleshooting

### "Cannot find module" with .ts extension
Ensure you're using `.js` extension in imports (ESM requirement).

### "Type errors after adding new endpoint"
1. Update Swagger JSDoc schemas
2. Run `npm run type-check`
3. Frontend: `cd ai-test-ui && yarn gcl`

### "Where to put this error code?"
Add to `src/types/error-codes.ts` with appropriate prefix (JIRA_, BS_, AI_).

### "Service getting too large"
- Split into multiple services by domain
- Extract complex logic to separate methods
- Consider creating sub-services

---

## Examples

### Creating a New Service

```typescript
// src/services/notification.service.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface NotificationPayload {
  title: string;
  message: string;
  channel: NotificationChannel;
}

export enum NotificationChannel {
  Slack = 'slack',
  Email = 'email',
}

export class NotificationService {
  private client: AxiosInstance;

  constructor(webhookUrl: string) {
    this.client = axios.create({
      baseURL: webhookUrl,
      timeout: 5000,
    });
  }

  async send(payload: NotificationPayload): Promise<void> {
    try {
      await this.client.post('/', payload);
    } catch (error) {
      throw this.handleError(error, 'Failed to send notification');
    }
  }

  private handleError(error: unknown, message: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return new Error(`${message}: ${axiosError.message}`);
    }
    return new Error(`${message}: ${(error as Error).message}`);
  }
}
```

### Creating a New Route

```typescript
// src/api/routes/notifications.route.ts
import { Router } from 'express';
import { NotificationService, NotificationChannel } from '../../services/notification.service.js';

const router = Router();
const service = new NotificationService(process.env.WEBHOOK_URL!);

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationChannel:
 *       type: string
 *       enum: [slack, email]
 *     SendNotificationRequest:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - channel
 *       properties:
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         channel:
 *           $ref: '#/components/schemas/NotificationChannel'
 */

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Send a notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendNotificationRequest'
 *     responses:
 *       200:
 *         description: Notification sent
 *       400:
 *         description: Invalid request
 */
router.post('/', async (req, res) => {
  try {
    const { title, message, channel } = req.body;

    if (!title || !message || !channel) {
      return res.status(400).json({
        success: false,
        error: 'title, message, and channel are required',
      });
    }

    if (!Object.values(NotificationChannel).includes(channel)) {
      return res.status(400).json({
        success: false,
        error: `Invalid channel. Must be one of: ${Object.values(NotificationChannel).join(', ')}`,
      });
    }

    await service.send({ title, message, channel });

    return res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
```

---

## Checklist

Before submitting code, verify:

- [ ] 🔴 No string literals for defined states (use enums)
- [ ] 🔴 ESM syntax (`import`/`export`, `.js` extensions)
- [ ] 🔴 Services follow class pattern with error handling
- [ ] 🔴 Routes have Swagger JSDoc comments
- [ ] 🔴 Types/enums in `src/types/` with barrel export
- [ ] 🟡 Error codes in `error-codes.ts`
- [ ] 🟡 Business logic in services, not routes
- [ ] 🟢 Utils are pure functions
- [ ] ✅ `npm run type-check` passes
- [ ] ✅ `npm run lint:fix` passes
