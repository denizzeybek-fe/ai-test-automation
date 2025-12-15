# AI Test Automation

Automated test case generation and BrowserStack integration for Jira tasks.

## Features

- 🤖 AI-powered test case generation using Claude
- 🔄 Automatic BrowserStack integration
- 📋 Jira task synchronization
- 🎯 Smart rule-based folder mapping
- 📝 Comprehensive error logging

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and fill in your credentials
   ```

3. **Verify installation:**
   ```bash
   npm run type-check
   npm run lint
   npm run build
   ```

## Usage

### Process single or multiple tasks
```bash
npm run dev run -- --tasks PA-34859
npm run dev run -- --tasks PA-34859,PA-34860,PA-34861
```

### Process entire sprint
```bash
npm run dev run -- --sprint-id SPRINT-42
```

## Development

### Quality Checks
```bash
npm run type-check  # TypeScript validation
npm run lint        # ESLint validation
npm run lint:fix    # Auto-fix lint issues
npm run check       # Run both type-check and lint
```

### Build
```bash
npm run build       # Compile to dist/
```

## Project Structure

```
ai-test-automation/
├── src/
│   ├── services/           # API integrations
│   │   ├── browserstack.service.ts
│   │   ├── jira.service.ts
│   │   └── ai.service.ts
│   ├── resolvers/          # Business logic
│   │   ├── rule-resolver.ts
│   │   └── folder-mapper.ts
│   ├── utils/              # Utilities
│   │   ├── error-logger.ts
│   │   └── retry.ts
│   ├── types/              # TypeScript types
│   ├── orchestrator.ts     # Main workflow
│   └── index.ts            # CLI entry
├── config/                 # Configuration files
│   ├── rules.config.json
│   └── folders.config.json
├── errors/                 # Error logs (auto-generated)
└── .env                    # Environment variables (not in git)
```

## Phase Status

- [x] Phase 0: Project Setup & Configuration
- [ ] Phase 1: BrowserStack API Service
- [ ] Phase 2: Rule Resolver & Folder Mapper
- [ ] Phase 3: Jira Service
- [ ] Phase 4: AI Test Case Generation
- [ ] Phase 5: Orchestrator (End-to-End)
- [ ] Phase 6: CLI Interface & Batch Processing
- [ ] Phase 7: Error Handling & Retry
- [ ] Phase 8: Final Polish & Documentation

## License

MIT
