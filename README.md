# AI Test Automation 🤖✅

Automated test case generation system powered by Claude AI that integrates Jira, BrowserStack, and AI to automatically create and manage test cases for sprint tasks.

## 🌟 Features

- **🎯 Dual Interface**: Web UI (recommended) and CLI for different workflows
- **🤖 AI-Powered**: Uses Claude AI to generate comprehensive test cases from Jira tasks
- **📊 Smart Analytics**: Automatically detects analytics type from task titles (Overall, Homepage, Onsite, Usage, Event Conversion, Enigma Sentinel)
- **🔄 Batch Processing**: Handle multiple tasks simultaneously
- **🔗 Full Integration**: Seamlessly connects Jira, BrowserStack, and Claude AI
- **✨ Real-time Updates**: WebSocket-powered live execution monitoring
- **📝 Structured Error Handling**: User-friendly error messages with detailed logging

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Jira account with API access
- BrowserStack account with Test Management enabled
- Claude account (free or paid) - for Claude.ai or Claude Desktop

#### About Claude Integration

> **Claude API Key is NOT required!** The system works in two modes:

| Mode | How it works | Requirements |
|------|--------------|--------------|
| **Automatic** | Claude CLI runs in backend | `npm i -g @anthropic-ai/claude-code` + `claude login` |
| **Manual** | Copy prompt → Paste to Claude.ai → Copy response back | Just a Claude.ai account |

The system automatically detects which mode to use based on Claude CLI availability.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-test-automation

# Install API dependencies
cd ai-test-api
npm install
cp .env.example .env
# Configure your credentials in .env

# Install UI dependencies
cd ../ai-test-ui
npm install
```

### Configuration

Create `.env` file in `ai-test-api` directory:

```env
# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# BrowserStack Configuration
BROWSERSTACK_USERNAME=your-username
BROWSERSTACK_ACCESS_KEY=your-access-key
BROWSERSTACK_PROJECT_ID=your-project-id

# Server Configuration
PORT=3000

# Note: Claude API Key is NOT needed!
# The system uses Claude CLI (automatic mode) or Claude.ai (manual mode)
```

## 💻 Usage

### Option 1: Web UI (Recommended) 🎨

The Web UI provides a user-friendly interface with real-time monitoring and batch processing.

```bash
# Terminal 1: Start the API server
cd ai-test-api
npm run dev:api

# Terminal 2: Start the Web UI
cd ai-test-ui
npm run dev
```

Then open http://localhost:5173 in your browser.

**Features:**
- 📝 Single or multiple task ID input (e.g., `PA-12345` or `PA-123, PA-456`)
- 🎯 Interactive analytics type selection with AI detection
- ⚡ Real-time execution logs and progress tracking
- 📊 Task history with success/failure status
- 🌓 Dark mode support
- 🎨 Toast notifications for user feedback
- ✅ Auto-clear inputs after successful creation

**Workflow:**
1. Enter one or more Jira task IDs
2. Review AI-detected analytics types and adjust if needed
3. Click "Generate Prompt" to create AI prompts
4. Copy the generated prompt to Claude Desktop
5. Paste Claude's JSON response back to the UI
6. Test cases are automatically created in BrowserStack

### Option 2: CLI (Advanced) ⌨️

The CLI is ideal for automation, scripting, and CI/CD pipelines.

```bash
cd ai-test-api

# Single task
npm run dev:cli -- run --tasks PA-12345

# Multiple tasks (space or comma-separated)
npm run dev:cli -- run --tasks PA-123 PA-456 PA-789
npm run dev:cli -- run --tasks PA-123,PA-456,PA-789

# Entire sprint
npm run dev:cli -- run --sprint-id 123

# Custom batch size (default: 20)
npm run dev:cli -- run --tasks PA-123 PA-456 --batch-size 10
```

**CLI Options:**
- `--tasks` / `-t`: Task IDs (space or comma-separated)
- `--sprint-id` / `-s`: Process all tasks in a sprint
- `--batch-size` / `-b`: Batch size for AI prompt generation (default: 20)

## 📁 Project Structure

```
ai-test-automation/
├── ai-test-api/          # Backend API & CLI
│   ├── src/
│   │   ├── api/          # Express API routes
│   │   ├── cli/          # CLI commands
│   │   ├── services/     # Core services (Jira, BrowserStack, AI)
│   │   ├── resolvers/    # Business logic (Rule, Folder mapping)
│   │   ├── types/        # TypeScript types & error codes
│   │   └── utils/        # Utilities (retry, error logging)
│   ├── config/           # Configuration files
│   ├── rules/            # Analytics rules & patterns
│   └── output/           # Generated prompts & responses
│
└── ai-test-ui/           # Frontend Web UI
    ├── src/
    │   ├── views/        # Main views (Dashboard)
    │   ├── components/   # Reusable components
    │   ├── composables/  # Vue composables (useToast, useTaskGeneration)
    │   ├── stores/       # Pinia stores (task, socket)
    │   └── client/       # Auto-generated API client
    └── public/           # Static assets
```

## 🔧 API Endpoints

The API server provides RESTful endpoints and Swagger documentation:

- **API Base**: `http://localhost:3000`
- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api-docs-json`

### Key Endpoints

- `POST /api/prompts/generate` - Generate prompt for single task
- `POST /api/prompts/generate/batch` - Generate prompts for multiple tasks
- `POST /api/prompts/response` - Process Claude's response and create test cases
- `POST /api/tasks/run` - Execute full workflow for tasks

## 📊 Analytics Types

The system automatically detects and categorizes tasks:

- **Overall**: General analytics and overview features
- **Homepage**: Homepage-specific functionality
- **Onsite**: On-site messaging and targeting
- **Usage**: Usage analytics and metrics
- **Event Conversion**: Event tracking and conversion analytics
- **Enigma Sentinel**: Enigma Sentinel analytics features
- **Other**: Fallback for unmatched patterns

Each type has its own:
- Rule file with specific test case patterns
- BrowserStack folder for organization
- Keyword patterns for auto-detection

## 🧪 Development

### Run Tests

```bash
# API tests
cd ai-test-api
npm test

# UI tests (if available)
cd ai-test-ui
npm test
```

### Type Checking & Linting

```bash
# API
cd ai-test-api
npm run type-check
npm run lint

# UI
cd ai-test-ui
npm run type-check
npm run lint
```

### Generate API Client

After updating API endpoints, regenerate the frontend client:

```bash
cd ai-test-ui
npm run gcl
```

## 📖 Documentation

- [API README](./ai-test-api/README.md) - Detailed API documentation
- [Workflow Guide](./ai-test-api/WORKFLOW.md) - Step-by-step workflow explanation
- [Batch Workflow](./ai-test-api/BATCH_WORKFLOW.md) - Batch processing details
- [Testing Guide](./ai-test-api/TESTING.md) - Testing strategies and examples
- [How Prompts Work](./ai-test-api/HOW_PROMPT_CREATE_TEST_CASES.md) - Prompt engineering details

## 🐛 Troubleshooting

### Common Issues

**API not starting:**
- Check if port 3000 is available
- Verify all environment variables are set in `.env`
- Ensure credentials are valid

**UI not connecting to API:**
- Verify API is running on port 3000
- Check `VITE_API_URL` in UI `.env` file
- Check browser console for CORS errors

**Test cases not creating:**
- Verify BrowserStack credentials and project ID
- Check folder IDs in `config/folders.config.json`
- Review error logs in `errors/` directory

**Task not found errors:**
- Verify Jira task ID format (e.g., PA-12345)
- Check Jira API token permissions
- Ensure task exists and is accessible

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run type-check and lint
4. Commit with descriptive message
5. Create a pull request

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- Built with [Claude AI](https://www.anthropic.com/claude) by Anthropic
- Integrated with [BrowserStack Test Management](https://www.browserstack.com/)
- Powered by [Vue 3](https://vuejs.org/), [Express](https://expressjs.com/), and [TypeScript](https://www.typescriptlang.org/)
