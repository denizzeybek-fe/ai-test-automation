# AI Test Automation - API & CLI

> **💡 Note**: This README covers the API and CLI usage. For the **Web UI (recommended for most users)**, see the [main README](../README.md).

Automated test case generation system that integrates **Jira**, **BrowserStack Test Management**, and **Claude AI** to automatically create and organize test cases for sprint tasks.

## What This System Does

This tool automates the entire test case creation workflow:

1. Fetches task information from Jira
2. Analyzes task title and determines analytics type (overall/homepage/onsite/usage/other)
3. Generates AI prompts with product rules
4. Imports Claude AI-generated test cases
5. Creates organized folder structure in BrowserStack
6. Links test cases to existing test runs

**Everything is automated except one step**: You paste the generated prompt to Claude Desktop and save the response.

## Usage Modes

This system offers two interfaces:

1. **🎨 Web UI** (Recommended): User-friendly interface with real-time monitoring
   - Start with: `npm run dev:api` (API) + `npm run dev` (UI in `../ai-test-ui`)
   - See [main README](../README.md) for details

2. **⌨️ CLI** (This document): Command-line interface for automation and scripting
   - Ideal for CI/CD pipelines and batch operations
   - Read below for CLI usage

---

## Features

- **Smart Type Detection**: Automatically detects analytics type from task titles using keyword patterns
- **Interactive Selection**: When no keywords found, prompts you to choose the type
- **Batch Processing**: Process multiple tasks with a single AI prompt
- **Organized Folders**: Creates task-specific subfolders (e.g., "PA-34858 - Task Title")
- **Auto Test Run Linking**: Automatically finds and links test cases to test runs
- **Error Handling**: Comprehensive error logging with exponential backoff retry
- **Type-Safe**: Written in TypeScript with strict ESLint rules

---

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# BrowserStack
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_access_key
BROWSERSTACK_PROJECT_ID=PR-8

# Jira
JIRA_BASE_URL=https://winsider.atlassian.net
JIRA_EMAIL=your.email@useinsider.com
JIRA_API_TOKEN=your_jira_token

# AI Prompt Generation
AI_BATCH_SIZE=20
```

**How to get credentials:**
- **BrowserStack**: Settings → Account → Username & Access Key
- **Jira API Token**: Account Settings → Security → API Tokens → Create Token

### 3. Verify Installation

```bash
npm run check  # Runs TypeScript + ESLint validation
```

---

## Usage

### Single Task

Process a single Jira task:

```bash
npm run dev run -- --tasks PA-34859
```

**Workflow (8 steps):**

1. ✅ Fetch task from Jira
2. ✅ Detect analytics type (or ask you to select)
3. ✅ Load product rules
4. ✅ Generate prompt and save to `output/prompts/`
5. ⏸️ **MANUAL**: Paste prompt to Claude Desktop, save response to `output/responses/response-PA-34859.json`
6. ✅ Import test cases from response
7. ✅ Create subfolder in BrowserStack: `AI Cases Valorem/Overall AI Cases/PA-34859 - Task Title/`
8. ✅ Create test cases and link to test run

### Multiple Tasks (Batch Mode)

Process multiple tasks with a single AI prompt:

```bash
npm run dev run -- --tasks PA-34859,PA-34860,PA-34861
```

**Workflow:**

1. ✅ Fetch all tasks from Jira
2. ✅ Detect/select analytics types
3. ✅ Generate **single batch prompt** with all tasks
4. ⏸️ **MANUAL**: Paste batch prompt to Claude Desktop, save response to `output/responses/response-batch-{timestamp}.json`
5. ✅ Process all tasks: create subfolders, test cases, and link to test runs

**Batch Response Format:**
```json
{
  "PA-34859": [
    { "name": "Test 1", "description": "...", "test_case_steps": [...] }
  ],
  "PA-34860": [
    { "name": "Test 2", "description": "...", "test_case_steps": [...] }
  ]
}
```

### Process Entire Sprint

```bash
npm run dev run -- --sprint-id 123
```

This fetches all tasks in the sprint and processes them in batch mode.

---

## Analytics Types

The system supports 5 analytics types that map to BrowserStack folders:

| Type | Folder in BrowserStack | Keywords |
|------|------------------------|----------|
| **Overall** | Overall Analytics AI Cases (ID: 26884046) | "overall analytics", "overall-analytics" |
| **Homepage** | Homepage Analytics AI Cases (ID: 26887302) | "homepage analytics", "homepage-analytics" |
| **Onsite** | Onsite Analytics AI Cases (ID: 26889616) | "onsite analytics", "onsite-analytics" |
| **Usage** | Usage Analytics AI Cases (ID: 26889629) | "usage analytics", "usage-analytics" |
| **Other** | Other AI Cases (ID: 26889696) | No keywords (manual selection) |

### Interactive Type Selection

When a task title has no matching keywords (e.g., "Enigma - Mobile API"), the system asks:

```
❌ No analytics type keyword found in task title.

Which analytics type should this be?

  1. Overall Analytics
  2. Homepage Analytics
  3. Onsite Analytics
  4. Usage Analytics
  5. Other
  6. Skip this task

Your choice [1-6]:
```

- **Options 1-5**: Assigns the selected type
- **Option 6**: Skips the task (non-blocking, continues with other tasks)

---

## Folder Structure

### BrowserStack Hierarchy

```
AI Cases Valorem (ID: 26884017)
├── Overall Analytics AI Cases (ID: 26884046)
│   ├── PA-34858 - Task Title/
│   │   ├── Test Case 1
│   │   ├── Test Case 2
│   │   └── Test Case 3
│   └── PA-34859 - Another Task/
├── Homepage Analytics AI Cases (ID: 26887302)
├── Onsite Analytics AI Cases (ID: 26889616)
├── Usage Analytics AI Cases (ID: 26889629)
└── Other AI Cases (ID: 26889696)
```

### Project Structure

```
ai-test-automation/
├── src/
│   ├── services/
│   │   ├── browserstack.service.ts   # BrowserStack API wrapper
│   │   ├── jira.service.ts           # Jira API wrapper
│   │   ├── orchestrator.ts           # Main workflow coordinator
│   │   ├── prompt-generator.ts       # AI prompt generation
│   │   └── test-case-importer.ts     # JSON response parser
│   ├── resolvers/
│   │   ├── rule-resolver.ts          # Keyword → analytics type mapping
│   │   └── folder-mapper.ts          # Analytics type → folder ID mapping
│   ├── utils/
│   │   ├── error-logger.ts           # Markdown error logs
│   │   └── retry.ts                  # Exponential backoff retry
│   └── types/index.ts                # TypeScript definitions
├── config/
│   ├── rules.config.json             # Keyword patterns
│   └── folders.config.json           # Folder ID mappings
├── rules/
│   └── product_rules/Valorem/        # Product rule .mdc files
├── output/
│   ├── prompts/                      # Generated AI prompts (gitignored)
│   └── responses/                    # AI responses (gitignored)
├── errors/                           # Error logs (gitignored)
└── .env                              # Environment variables (gitignored)
```

---

## Examples

### Example 1: Single Task with Keyword

```bash
$ npm run dev run -- --tasks PA-34858

🚀 Processing Task: PA-34858

Step 1/8: Fetching task from Jira...
✅ Task fetched: "Overall Analytics - New Feature"

Step 2/8: Resolving analytics type...
✅ Analytics type resolved: overall

Step 3/8: Loading product rules...
✅ Rules loaded: rules/product_rules/Valorem/overall/overall.mdc

Step 4/8: Generating prompt...
✅ Prompt saved: output/prompts/prompt-PA-34858-1765888390496.md

⏸️  MANUAL STEP:
1. Copy prompt from: output/prompts/prompt-PA-34858-1765888390496.md
2. Paste to Claude Desktop
3. Save response to: output/responses/response-PA-34858.json
4. Press Enter to continue...

Step 5/8: Importing test cases...
✅ 3 test cases imported

Step 6/8: Creating task-specific subfolder...
📁 Creating new subfolder: PA-34858 - Overall Analytics - New Feature
✅ Subfolder created: ID 26889700

Step 7/8: Creating test cases in BrowserStack...
✅ Test case created: "Verify overall analytics tracking" (ID: TC-12345)
✅ Test case created: "Validate analytics data format" (ID: TC-12346)
✅ Test case created: "Test analytics error handling" (ID: TC-12347)

Step 8/8: Linking test cases to test run...
✅ Test run found: PA-34858 (identifier: TR-789)
✅ 3 test cases linked to test run

✅ Task PA-34858 processed successfully!
```

### Example 2: Multiple Tasks (Batch)

```bash
$ npm run dev run -- --tasks PA-34858,PA-34859,PA-34860

🚀 Processing 3 Tasks in Batch Mode

Step 1/8: Fetching task PA-34858 from Jira...
✅ Task fetched: "Overall Analytics - Feature A"
✅ Analytics type: overall

Step 1/8: Fetching task PA-34859 from Jira...
✅ Task fetched: "Homepage Analytics - Feature B"
✅ Analytics type: homepage

Step 1/8: Fetching task PA-34860 from Jira...
✅ Task fetched: "Enigma - Mobile API"
❌ No analytics type keyword found in task title.

Which analytics type should this be?

  1. Overall Analytics
  2. Homepage Analytics
  3. Onsite Analytics
  4. Usage Analytics
  5. Other
  6. Skip this task

Your choice [1-6]: 5
✅ Analytics type: other

Step 4/8: Generating batch prompt...
✅ Batch prompt saved: output/prompts/prompt-batch-1765888500000.md
✅ Empty response file created: output/responses/response-batch-1765888500000.json

⏸️  MANUAL STEP:
1. Copy prompt from: output/prompts/prompt-batch-1765888500000.md
2. Paste to Claude Desktop
3. Save response to: output/responses/response-batch-1765888500000.json
4. Press Enter to continue...

Processing task PA-34858...
📁 Creating subfolder: PA-34858 - Overall Analytics - Feature A
✅ 3 test cases created and linked

Processing task PA-34859...
📁 Using existing subfolder: PA-34859 - Homepage Analytics - Feature B
✅ 4 test cases created and linked

Processing task PA-34860...
📁 Creating subfolder: PA-34860 - Enigma - Mobile API
✅ 2 test cases created and linked

✅ Batch processing complete: 3/3 tasks successful
```

### Example 3: Task Without Keywords

```bash
$ npm run dev run -- --tasks PA-34876

🚀 Processing Task: PA-34876

Step 1/8: Fetching task from Jira...
✅ Task fetched: "Gachapon Game Feature"

Step 2/8: Resolving analytics type...
❌ No analytics type keyword found in task title.

Which analytics type should this be?

  1. Overall Analytics
  2. Homepage Analytics
  3. Onsite Analytics
  4. Usage Analytics
  5. Other
  6. Skip this task

Your choice [1-6]: 6

⏭️  Skipping task PA-34876
```

---

## Error Handling

### Automatic Retry

The system automatically retries failed API calls with exponential backoff:

- **Max retries**: 3
- **Initial delay**: 1 second
- **Max delay**: 10 seconds
- **Backoff multiplier**: 2x

**Retryable errors:**
- Network timeouts
- Connection refused/reset
- Rate limits (429)
- Server errors (500, 502, 503, 504)

**Non-retryable errors** (fail immediately):
- Authentication (401, 403)
- Not found (404)
- Validation errors

### Error Logs

All errors are logged to `errors/YYYY-MM-DD-HH-mm.md`:

```markdown
# Error Log - 2025-12-16 14:30

## API Error

**Time:** 2025-12-16T14:30:15.123Z
**Task ID:** PA-34858
**Operation:** Create test case: Verify analytics tracking
**Message:** Request failed with status code 401
**Details:**
```
Error: Unauthorized
    at BrowserStackService.createTestCase (browserstack.service.ts:123)
```

---
```

---

## Development

### Quality Checks

```bash
npm run type-check      # TypeScript validation
npm run lint            # ESLint validation
npm run lint:fix        # Auto-fix lint issues
npm run check           # Both type-check + lint
```

### Build

```bash
npm run build           # Compile to dist/
```

### Run Compiled Version

```bash
npm start -- --tasks PA-34858
```

---

## Architecture

### Workflow Overview

```
┌─────────────┐
│   Jira API  │ ─── Fetch task info
└─────────────┘
       │
       ▼
┌─────────────────┐
│  Rule Resolver  │ ─── Keyword → Analytics Type
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Prompt Generator│ ─── Generate AI prompt
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  Claude Desktop │ ─── 🧠 Manual step
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Test Case Import│ ─── Parse JSON response
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ BrowserStack API│ ─── Create folders + test cases
└─────────────────┘
```

### Key Components

| Component | Purpose | File |
|-----------|---------|------|
| **Orchestrator** | Coordinates entire workflow | `orchestrator.ts:712` |
| **BrowserStackService** | BrowserStack API wrapper | `browserstack.service.ts` |
| **JiraService** | Jira API wrapper | `jira.service.ts` |
| **PromptGenerator** | Generates AI prompts | `prompt-generator.ts` |
| **TestCaseImporter** | Parses JSON responses | `test-case-importer.ts` |
| **RuleResolver** | Maps keywords → analytics type | `rule-resolver.ts` |
| **FolderMapper** | Maps analytics type → folder ID | `folder-mapper.ts` |
| **ErrorLogger** | Logs errors to markdown | `error-logger.ts` |
| **withRetry** | Exponential backoff retry | `retry.ts` |

---

## Configuration

### rules.config.json

Defines keyword patterns for analytics type detection:

```json
{
  "keywordPatterns": {
    "overall": ["overall[\\s-]?analytics?"],
    "homepage": ["homepage[\\s-]?analytics?"],
    "onsite": ["onsite[\\s-]?analytics?"],
    "usage": ["usage[\\s-]?analytics?"],
    "other": []
  },
  "priorityOrder": ["overall", "homepage", "onsite", "usage", "other"],
  "defaultType": "overall"
}
```

### folders.config.json

Maps analytics types to BrowserStack folder IDs:

```json
{
  "folderMapping": {
    "overall": 26884046,
    "homepage": 26887302,
    "onsite": 26889616,
    "usage": 26889629,
    "other": 26889696
  }
}
```

---

## Troubleshooting

### "Test run not found"

**Issue**: System can't find test run to link test cases.

**Solution**:
1. Check if test run exists in BrowserStack with matching task ID
2. Test run name must contain the task ID (e.g., "PA-34858" or "Test run for PA-34858")
3. If test run doesn't exist, create it manually in BrowserStack first

### "Failed to create test case: 401 Unauthorized"

**Issue**: Invalid BrowserStack credentials.

**Solution**:
1. Verify `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` in `.env`
2. Get fresh credentials from BrowserStack Settings → Account

### "No analytics type keyword found" appears for every task

**Issue**: Task titles don't contain keywords from `rules.config.json`.

**Solution**:
1. Add custom keywords to `config/rules.config.json`
2. Or use interactive selection (options 1-6)
3. Or choose "5. Other" for non-analytics tasks

### "Response file is empty"

**Issue**: JSON response file exists but contains `[]` or `{}`.

**Solution**:
1. The system auto-creates empty response files
2. You must paste Claude's JSON response into the file
3. Ensure JSON is valid (no markdown code blocks, no extra text)

---

## What Was Built

This project went through several development phases:

### Phase 0-5: Core System
- BrowserStack, Jira, AI service integrations
- Rule resolver and folder mapper
- Orchestrator workflow
- Prompt generation and test case import

### Phase 6: CLI & Batch Processing
- Commander.js CLI interface
- Support for `--tasks` and `--sprint-id` flags
- Comma/space-separated task ID parsing
- Colored console output with Chalk

### Phase 7: Error Handling & Retry
- Markdown error logging
- Exponential backoff retry mechanism
- Graceful error handling (continue on failure)
- Error categorization (API, File, Validation, Network, Unknown)

### Phase 7.5: Folder Structure & Organization
- Task-specific subfolder creation
- `findOrCreateSubfolder` logic
- Automatic test run linking via `identifier` field
- Fixed BrowserStack API endpoints and payload formats

### Phase 6+ Enhancements
- **Interactive Type Selection**: Ask user when no keyword found
- **"Other" Analytics Type**: Support for non-analytics tasks
- **Skip Functionality**: Non-blocking skip option
- **Batch Prompt Mode**: Single prompt for multiple tasks
- **Auto Response Files**: Pre-create empty JSON response files

---

## License

MIT

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review error logs in `errors/` directory
3. Verify `.env` configuration
4. Run `npm run check` to validate codebase
