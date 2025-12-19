# AI Test Automation Project

## Project Overview

Automated test case generation system that integrates Jira, BrowserStack, and Claude AI to automatically create and link test cases for sprint tasks.

## Architecture

- **Tech Stack**: Node.js + TypeScript + Vue 3 + PrimeVue
- **Backend**: Express API + WebSocket for real-time logs
- **Frontend**: Vue 3 SPA with PrimeVue components
- **APIs**: BrowserStack, Jira
- **AI Integration**: Claude CLI (automatic) or Claude.ai (manual copy-paste)
- **Input**: Jira task IDs via Web UI or CLI
- **Output**: Test cases created in BrowserStack and linked to test runs

## Claude Integration

> **Claude API Key is NOT required!**

The system operates in two modes:

| Mode | How it works | Requirements |
|------|--------------|--------------|
| **Automatic** | Claude CLI runs in backend | `npm i -g @anthropic-ai/claude-code` + `claude login` |
| **Manual** | Copy prompt → Paste to Claude.ai → Copy response back | Just a Claude.ai account |

## Key Components

### Services
- `BrowserStackService`: BrowserStack API integration (test runs, test cases, folders)
- `JiraService`: Jira API integration (fetch tasks, sprint tasks)
- `Orchestrator`: Coordinates workflow, detects Claude CLI availability

### Resolvers
- `RuleResolver`: Maps task title keywords to analytics type (overall/homepage/onsite/usage)
- `FolderMapper`: Maps analytics type to BrowserStack folder IDs

### Utils
- `ErrorLogger`: Logs errors to markdown files in errors/ directory
- `withRetry`: Exponential backoff retry mechanism for API calls

### Orchestrator
Main workflow coordinator that processes tasks end-to-end

## Critical Business Rules

### Rule Resolution
- **Default**: If no keyword match → "overall"
- **Priority**: overall > homepage > onsite > usage (first match wins)
- **Case-insensitive**: "Overall", "overall-analytics", "OVERALL" all match

### Folder Mapping (Hardcoded)
```json
{
  "overall": 26884046,
  "homepage": 26884047,
  "onsite": 26884048,
  "usage": 26884049
}
```

### Error Handling
- **Duplicate test case**: Skip and log to errors/
- **Test run not found**: Log error, don't proceed with linking
- **Retry strategy**: 3 retries with exponential backoff for network errors
- **All errors**: Logged to `errors/YYYY-MM-DD-HH-mm.md`

## Phase Status

- [x] Phase 0: Project Setup & Configuration
- [x] Phase 1: BrowserStack API Service
- [x] Phase 2: Rule Resolver & Folder Mapper
- [x] Phase 3: Jira Service
- [x] Phase 4: AI Test Case Generation (Claude CLI + Manual Mode)
- [x] Phase 5: Orchestrator (End-to-End)
- [x] Phase 6: CLI Interface & Batch Processing
- [x] Phase 7: Error Handling & Retry
- [x] Phase 8: Web UI (Vue 3 + PrimeVue)

## Development Workflow

### Setup
```bash
npm install
cp .env.example .env
# Fill in credentials in .env
```

### Development
```bash
npm run dev run -- --tasks PA-12345
npm run dev run -- --sprint-id SPRINT-42
```

### Quality Checks
```bash
npm run type-check  # TypeScript validation
npm run lint        # ESLint validation
npm run check       # Both type-check + lint
```

## Important Notes for Claude

1. **Always run type-check and lint** after completing each phase
2. **Folder IDs are hardcoded** - BrowserStack API doesn't return folder paths
3. **Test run linking** uses PATCH endpoint, not POST
4. **Error logs** must be markdown format in errors/ directory
5. **Rule files** location: `rules/product_rules/Valorem/{analytics_type}/{analytics_type}.mdc`

## Project Complete

All phases have been implemented. The system is fully functional with:
- Web UI for easy task management
- Automatic mode with Claude CLI integration
- Manual mode fallback for environments without Claude CLI
- Real-time WebSocket logging
- Batch processing support

### Maintenance Notes
1. Always run `npm run check` before committing
2. Test both Automatic and Manual modes when making changes
3. Keep documentation in sync with code changes
