# AI Test Automation Workflow

This document explains the complete end-to-end workflow of how test cases are generated and added to BrowserStack.

## Overview

The system automates test case creation by combining:
1. **Jira Task Information** (requirements, descriptions, context)
2. **Product Rules** (detailed .mdc files with product specifications)
3. **Claude AI** (generates comprehensive test cases)
4. **BrowserStack** (stores and organizes test cases)

## Operating Modes

The system supports **two modes** based on Claude CLI availability:

| Mode | Description | Requirements |
|------|-------------|--------------|
| **Automatic** | Fully automated - Claude CLI handles AI generation | `npm i -g @anthropic-ai/claude-code` + `claude login` |
| **Manual** | Copy-paste workflow via Claude.ai or Claude Desktop | Just a Claude.ai account |

> **Important:** Claude API Key is NOT required! The system uses Claude CLI (automatic) or your Claude.ai account (manual).

### How the System Decides

The system automatically detects which mode to use:

```typescript
// Backend (orchestrator.ts)
const claudeAvailable = await this.isClaudeAvailable();
// If claude CLI is installed → Automatic Mode
// Otherwise → Manual Mode
```

---

## Complete Workflow (8 Steps)

### Step 1: Fetch Task from Jira ✅ Automated

```typescript
const taskInfo = await jiraService.getTask(taskId);
```

**What's Retrieved:**
- Task ID (e.g., PA-34858)
- Title (e.g., "Overall Analytics | Save As Default Refactor")
- Description (Full task description from Jira)
- Root Cause (For bugs)
- Test Case Description (If provided)
- Figma URL (If provided)
- Confluence URL (If provided)

**Example:**
```json
{
  "id": "PA-34858",
  "title": "Overall Analytics | Save As Default Refactor",
  "description": "Refactor Save As Default to prevent bugs...",
  "rootCause": "Previous implementation had state management issues",
  "testCaseDescription": "Test save/load across sessions",
  "figmaUrl": "https://figma.com/...",
  "confluenceUrl": "https://confluence.com/..."
}
```

---

### Step 2: Resolve Analytics Type ✅ Automated

```typescript
const analyticsType = ruleResolver.resolve(taskInfo.title);
```

**Keyword Detection:**
- "Overall Analytics" → `AnalyticsType.Overall`
- "Homepage" → `AnalyticsType.Homepage`
- "Onsite" → `AnalyticsType.Onsite`
- "Usage" → `AnalyticsType.Usage`
- No match → Interactive prompt or default

**Interactive Prompt (if no keywords found):**
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

**Result:**
- `analyticsType = AnalyticsType.Overall`
- Determines which .mdc file to load
- Determines which BrowserStack folder to use

---

### Step 3: Load Product Rules ✅ Automated

```typescript
const ruleFilePath = ruleResolver.getRuleFilePath(analyticsType);
const ruleContent = promptGenerator.readRuleFile(ruleFilePath);
```

**File Mapping:**
| Analytics Type | File Path |
|----------------|-----------|
| Overall | `rules/product_rules/Valorem/overall-analytics/overall-analytics.mdc` |
| Homepage | `rules/product_rules/Valorem/homepage/homepage.mdc` |
| Onsite | `rules/product_rules/Valorem/onsite-analytics/onsite-analytics.mdc` |
| Usage | `rules/product_rules/Valorem/usage-analytics/usage-analytics.mdc` |

**What's Loaded:**
- **Overall Analytics**: 271 lines of detailed specs
  - Multi-Product Dashboard features
  - Single Journey Analytics metrics
  - All product cards (Onsite, Web Push, Email, etc.)
  - Datepicker, Drag & Drop, Save as Default behavior
  - Export functionality
  - Metric formulas and calculations

- **Homepage**: 137 lines
  - Executive Summary Dashboard
  - ROI metrics (incremental conversions, AOV uplift)
  - Campaign analytics
  - Filter logic and comparison states

- **Usage Analytics**: 107 lines
  - MRR tracking, billing assets
  - Monthly/Combined/No-Plan product limits
  - MTU Bundle, Data Points
  - Multi-domain handling

- **Onsite**: 60 lines
  - Campaign analytics
  - Control group vs non-control group
  - Metrics and filters

**Example Content (Overall Analytics):**
```markdown
# Overall Analytics

## Save as Default
- User can click Save as Default button to save metric and product selections
- Date picker, drag&drop, conversion criteria NOT saved as default
- Works per-user and partner basis
- Reset when panel switched
- Valid across sessions, browsers, devices with same user

## Product Cards
- 2-6 metrics selectable per card
- Each card has filters (Statuses, Campaign Types, Tags, etc.)
- Link to detailed analytics page per product
```

---

### Step 4: Generate AI Prompt ✅ Automated

```typescript
const prompt = promptGenerator.generateSinglePrompt(
  taskInfo,
  analyticsType,
  ruleContent
);
```

**Prompt Structure:**
```markdown
# Test Case Generation Request

Generate test cases for BrowserStack Test Management based on the task information below.

## Task Information

**Task ID:** PA-34858
**Title:** Overall Analytics | Save As Default Refactor
**Analytics Type:** overall

**Description:**
Refactor Save As Default to prevent bugs...

**Root Cause:**
Previous implementation had state management issues

**Test Case Description:**
Test save/load across sessions

**Figma Design:** https://figma.com/...
**Documentation:** https://confluence.com/...

## Product Rules

[271 lines of overall-analytics.mdc content]

- Save as Default button saves metric and product selections
- Date picker, drag&drop, conversion criteria NOT saved
- Works per-user and partner basis
- Reset when panel switched
- Valid across sessions, browsers, devices
- 2-6 metrics selectable per product card
- ... (all detailed specs)

## Output Format

Return **ONLY** valid JSON (no markdown, no code blocks, no explanation):

\`\`\`json
[
  {
    "name": "Test case name (clear and descriptive)",
    "description": "What this test validates",
    "preconditions": "Optional: Any setup required before test",
    "test_case_steps": [
      {
        "step": "Action to perform",
        "result": "Expected outcome"
      }
    ],
    "tags": ["overall", "tag2", "tag3"]
  }
]
\`\`\`

**Important:**
- Generate 2-5 comprehensive test cases
- Each test case should cover different scenarios
- Steps should be clear and actionable
- Expected results should be specific and verifiable
- Include relevant tags for categorization
```

**Configuration (from .env):**
- `AI_MIN_TEST_CASES=2` (minimum test cases to generate)
- `AI_MAX_TEST_CASES=5` (maximum test cases to generate)

**Prompt Saved To:**
- `output/prompts/prompt-PA-34858-{timestamp}.md`

**Empty Response File Created:**
- `output/responses/response-PA-34858.json` (with `[]` content)

---

### Step 5: AI Interaction

#### Automatic Mode ✅ (No manual step)

When Claude CLI is available, this step is fully automated:
- Claude CLI receives the prompt
- Generates test cases
- Returns JSON response directly
- **No user interaction needed!**

#### Manual Mode ⏸️ (User action required)

When Claude CLI is not available:
```
⏸️  MANUAL STEP:
1. Copy prompt from: output/prompts/prompt-PA-34858-1765888390496.md
2. Paste to Claude Desktop or Claude.ai
3. Save response to: output/responses/response-PA-34858.json
4. Press Enter to continue...
```

**What Claude AI Sees:**
1. ✅ Complete Jira task context (title, description, root cause, etc.)
2. ✅ 271 lines of specific Overall Analytics product rules
3. ✅ Save as Default feature specifications
4. ✅ Metric formulas and business logic
5. ✅ UI behaviors and edge cases

**What Claude AI Generates:**

Example output:
```json
[
  {
    "name": "Verify Save As Default persists user preferences across sessions",
    "description": "Validates that Save As Default correctly saves metric and product selections and persists them across different sessions, browsers, and devices for the same user",
    "preconditions": "User is logged into Overall Analytics page with valid partner access",
    "test_case_steps": [
      {
        "step": "Navigate to Overall Analytics page",
        "result": "Overall Analytics page loads with default view"
      },
      {
        "step": "Select specific metrics (e.g., 4 out of available metrics) for Onsite Campaigns card",
        "result": "Selected metrics are displayed in the card"
      },
      {
        "step": "Apply filters (e.g., Status: Active, Campaign Type: A/B Test)",
        "result": "Filters are applied and reflected in Applied Filters section"
      },
      {
        "step": "Click 'Save as Default' button",
        "result": "Success message shown, settings saved"
      },
      {
        "step": "Logout and login again in same browser",
        "result": "Previously saved metric selections and filters are loaded automatically"
      },
      {
        "step": "Open page in different browser with same user credentials",
        "result": "Same saved preferences are loaded"
      },
      {
        "step": "Open page on different device (mobile/tablet) with same user",
        "result": "Same saved preferences are loaded"
      }
    ],
    "tags": ["overall", "save-as-default", "persistence", "PA-34858"]
  },
  {
    "name": "Verify Save As Default does NOT save date picker and drag&drop changes",
    "description": "Validates that date picker, drag&drop positions, conversion criteria are NOT saved when using Save As Default",
    "preconditions": "User is logged into Overall Analytics page",
    "test_case_steps": [
      {
        "step": "Change date range to 'Last 30 days'",
        "result": "Date range updated on page"
      },
      {
        "step": "Drag Onsite card to bottom position",
        "result": "Card position changed"
      },
      {
        "step": "Change conversion criteria dropdown",
        "result": "Conversion criteria updated"
      },
      {
        "step": "Select specific metrics for a product card and click 'Save as Default'",
        "result": "Only metric selections saved"
      },
      {
        "step": "Refresh the page",
        "result": "Date range resets to default, card positions reset, conversion criteria resets, but metric selections persist"
      }
    ],
    "tags": ["overall", "save-as-default", "exclusions", "PA-34858"]
  },
  {
    "name": "Verify Save As Default resets when switching partner",
    "description": "Validates that Save As Default preferences are reset when user switches to a different partner",
    "preconditions": "User has access to multiple partners",
    "test_case_steps": [
      {
        "step": "Login to Partner A, navigate to Overall Analytics",
        "result": "Overall Analytics page loaded for Partner A"
      },
      {
        "step": "Customize metric selections and save as default",
        "result": "Preferences saved for Partner A"
      },
      {
        "step": "Switch to Partner B",
        "result": "Panel switches to Partner B"
      },
      {
        "step": "Navigate to Overall Analytics for Partner B",
        "result": "Default view shown (not Partner A's saved preferences)"
      },
      {
        "step": "Switch back to Partner A",
        "result": "Partner A's saved preferences are loaded correctly"
      }
    ],
    "tags": ["overall", "save-as-default", "partner-switch", "PA-34858"]
  }
]
```

**Key Points:**
- AI combines Jira task context + Product rules
- Generates specific, actionable test steps
- Includes preconditions and expected results
- Adds relevant tags for traceability

---

### Step 6: Import Test Cases ✅ Automated

```typescript
const testCases = testCaseImporter.importFromFile(`output/responses/response-PA-34858.json`);
```

**Validation:**
- Parses JSON response
- Validates structure (name, description, test_case_steps)
- Converts to internal TestCase format

**Example Parsed:**
```typescript
[
  {
    name: "Verify Save As Default persists user preferences across sessions",
    description: "Validates that Save As Default correctly saves...",
    preconditions: "User is logged into Overall Analytics page...",
    test_case_steps: [
      { step: "Navigate to Overall Analytics page", result: "Overall Analytics page loads..." },
      { step: "Select specific metrics...", result: "Selected metrics are displayed..." }
    ],
    tags: ["overall", "save-as-default", "persistence", "PA-34858"]
  }
]
```

---

### Step 7: Create Test Cases in BrowserStack ✅ Automated

```typescript
// 1. Get parent folder ID based on analytics type
const parentFolderId = folderMapper.getFolderId(analyticsType);
// overall → 26884046 (Overall Analytics AI Cases)

// 2. Create task-specific subfolder
const subfolder = await browserStackService.findOrCreateSubfolder(
  parentFolderId,
  `${taskId} - ${taskInfo.title}`
);
// Creates: "PA-34858 - Overall Analytics | Save As Default Refactor"

// 3. Create test cases in subfolder
for (const testCase of testCases) {
  const createdTestCase = await browserStackService.createTestCase(
    subfolder.id,
    testCase
  );
}
```

**BrowserStack Hierarchy:**
```
AI Cases Valorem (ID: 26884017)
└── Overall Analytics AI Cases (ID: 26884046)
    └── PA-34858 - Overall Analytics | Save As Default Refactor (new subfolder)
        ├── ✅ Test Case 1: Verify Save As Default persists...
        ├── ✅ Test Case 2: Verify Save As Default does NOT save date picker...
        └── ✅ Test Case 3: Verify Save As Default resets when switching partner
```

**API Payload:**
```typescript
{
  test_case: {
    name: "Verify Save As Default persists user preferences across sessions",
    description: "Validates that Save As Default correctly saves...",
    preconditions: "User is logged into Overall Analytics page...",
    test_case_steps: [
      { step: "Navigate to Overall Analytics page", result: "Overall Analytics page loads..." },
      { step: "Select specific metrics...", result: "Selected metrics are displayed..." }
    ],
    tags: ["overall", "save-as-default", "persistence", "PA-34858"]
  }
}
```

---

### Step 8: Link Test Cases to Test Run ✅ Automated

```typescript
// Find test run by task ID
const testRun = await browserStackService.findTestRunByTaskId(taskId);

if (testRun) {
  await browserStackService.updateTestRunCases(
    testRun.identifier,
    createdTestCaseIds
  );
}
```

**Test Run Linking:**
- System searches for test run where `name` contains task ID
- Links all created test cases to the test run
- Uses `identifier` field (not `id`) for API calls

**Example:**
```
Test Run: "PA-34858 Sprint 42 Testing" (identifier: TR-11854)
↓ Links to
Test Cases: TC-12345, TC-12346, TC-12347
```

**If test run not found:**
- Logs warning
- Test cases still created successfully
- Can be manually linked later

---

## Batch Processing (Multiple Tasks)

For multiple tasks, the workflow is optimized:

```bash
npm run dev run -- --tasks PA-34858,PA-34859,PA-34860
```

### Batch Workflow

**Single Prompt for All Tasks:**
1. Fetch all tasks from Jira
2. Resolve analytics types
3. Generate **ONE batch prompt** with all tasks
4. Create **ONE batch response file** with task IDs as keys
5. ⏸️ **Manual**: Paste prompt to Claude, save response
6. Process all tasks: create subfolders, test cases, link to test runs

**Batch Response Format:**
```json
{
  "PA-34858": [
    { "name": "Test 1", "description": "...", "test_case_steps": [...] }
  ],
  "PA-34859": [
    { "name": "Test 2", "description": "...", "test_case_steps": [...] }
  ],
  "PA-34860": [
    { "name": "Test 3", "description": "...", "test_case_steps": [...] }
  ]
}
```

**Benefits:**
- One prompt paste instead of N prompts
- Faster processing for multiple tasks
- Consistent test case quality across tasks

---

## Configuration

### Environment Variables (.env)

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
AI_MIN_TEST_CASES=2    # Minimum test cases to generate
AI_MAX_TEST_CASES=5    # Maximum test cases to generate
```

### Folder Mapping (config/folders.config.json)

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

### Rule Files

| Analytics Type | File | Lines | Content |
|----------------|------|-------|---------|
| Overall | `overall-analytics.mdc` | 271 | Multi-Product Dashboard + Single Journey Analytics |
| Homepage | `homepage.mdc` | 137 | Executive Summary Dashboard, ROI metrics |
| Onsite | `onsite-analytics.mdc` | 60 | Campaign analytics, control groups |
| Usage | `usage-analytics.mdc` | 107 | MRR tracking, product limits, MTU Bundle |

---

## Key Features

### 1. Smart Type Detection
- Automatic keyword matching from task titles
- Interactive prompt when no match found
- Support for "Other" category and "Skip" option

### 2. Comprehensive Context
- Jira task information (title, description, root cause, etc.)
- Product rules (detailed specifications from .mdc files)
- AI combines both to generate relevant test cases

### 3. Organized Folder Structure
- Task-specific subfolders: `{TaskID} - {Task Title}`
- Easy to find test cases related to specific tasks
- Clean BrowserStack hierarchy

### 4. Automatic Test Run Linking
- Finds test run by task ID
- Links all created test cases automatically
- Non-blocking (continues if test run not found)

### 5. Error Handling
- Comprehensive error logging to `errors/` directory
- Exponential backoff retry for API failures
- Graceful degradation (continues on non-critical errors)

### 6. Configurable Test Count
- `AI_MIN_TEST_CASES`: Minimum test cases per task
- `AI_MAX_TEST_CASES`: Maximum test cases per task
- Easy to adjust based on project needs

---

## Example Output

### Console Output

```
🚀 Processing Task: PA-34858

Step 1/8: Fetching task from Jira...
✅ Task fetched: "Overall Analytics | Save As Default Refactor"

Step 2/8: Resolving analytics type...
✅ Analytics type resolved: overall

Step 3/8: Setting up folder structure...
📁 Creating new subfolder: PA-34858 - Overall Analytics | Save As Default Refactor
✅ Subfolder ready: PA-34858 - Overall Analytics | Save As Default Refactor (ID: 26889700)

Step 4/8: Reading product rules...
✅ Rules loaded from: rules/product_rules/Valorem/overall-analytics/overall-analytics.mdc

Step 5/8: Generating AI prompt...
✅ Prompt saved: output/prompts/prompt-PA-34858-1765888390496.md
✅ Empty response file created: output/responses/response-PA-34858.json

⏸️  MANUAL STEP:
1. Copy prompt from: output/prompts/prompt-PA-34858-1765888390496.md
2. Paste to Claude Desktop
3. Save response to: output/responses/response-PA-34858.json
4. Press Enter to continue...

Step 6/8: Importing test cases...
✅ 3 test cases imported

Step 7/8: Creating test cases in BrowserStack...
✅ Test case created: "Verify Save As Default persists user preferences" (ID: TC-12345)
✅ Test case created: "Verify Save As Default does NOT save date picker" (ID: TC-12346)
✅ Test case created: "Verify Save As Default resets when switching partner" (ID: TC-12347)

Step 8/8: Linking test cases to test run...
✅ Test run found: PA-34858 (identifier: TR-11854)
✅ 3 test cases linked to test run

✅ Task PA-34858 processed successfully!
```

---

## Benefits

1. **Speed**: Manual test case writing takes hours, this system does it in minutes
2. **Coverage**: AI considers scenarios based on detailed product rules (271 lines of specs)
3. **Consistency**: Same structure and quality every time
4. **Traceability**: Direct link from Jira task to test cases via task ID
5. **Scalability**: Works for any number of tasks automatically
6. **Context-Aware**: Combines real task data with comprehensive product knowledge
7. **Organized**: Task-specific subfolders make finding test cases easy

---

## Troubleshooting

### "Test run not found"
- System can't find test run to link test cases
- **Solution**: Test run name must contain task ID (e.g., "PA-34858")
- Test cases are still created successfully

### "No analytics type keyword found"
- Task title doesn't contain keywords from rules.config.json
- **Solution**: Select type interactively or add custom keywords to config

### "Response file is empty"
- JSON response file exists but contains `[]`
- **Solution**: Paste Claude's JSON response into the file (no markdown blocks)

---

## Summary

This system automates the test case creation workflow:

- **Automatic Mode**: All 8 steps are fully automated using Claude CLI
- **Manual Mode**: 7 out of 8 steps are automated, only AI interaction requires copy-paste

By combining Jira task context with detailed product rules (271+ lines of specifications), the system generates comprehensive, actionable test cases that are automatically organized and linked in BrowserStack.

> **Tip:** Install Claude CLI for a fully automated experience:
> ```bash
> npm i -g @anthropic-ai/claude-code
> claude login
> ```
