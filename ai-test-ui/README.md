# AI Test Automation - Web UI 🎨

Modern web interface for automated test case generation with real-time monitoring and batch processing capabilities.

> **📚 Main Documentation**: See [main README](../README.md) for full system overview and setup instructions.

## Overview

The Web UI provides a user-friendly interface for the AI Test Automation system, offering:

- **📝 Intuitive Input**: Single or multiple task ID support
- **⚡ Real-time Updates**: Live execution logs via WebSocket
- **🎯 Smart Detection**: AI-powered analytics type detection with manual override
- **📊 Task History**: Track all processed tasks with status indicators
- **🌓 Dark Mode**: Comfortable viewing in any lighting condition
- **✅ Auto-clear**: Inputs automatically clear after successful creation
- **🎨 Toast Notifications**: Clear feedback for all operations

## Quick Start

### Prerequisites

- Node.js 18+
- API server running (see [API README](../ai-test-api/README.md))

### Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open http://localhost:5173 in your browser.

## Features

### 1. Task Input
- Enter one or more Jira task IDs
- Format: `PA-12345` (single) or `PA-123, PA-456` (multiple)
- Real-time validation with helpful error messages

### 2. Analytics Type Detection
- Automatic detection based on task title keywords
- Manual selection from dropdown for each task
- Skip unwanted tasks from batch processing

### 3. Prompt Generation
- Click "Generate Prompt" to create AI-optimized prompts
- Supports both single and batch formats
- Copy button for easy clipboard access

### 4. Response Processing
- Paste Claude's JSON response
- Automatic validation and parsing
- Creates test cases in BrowserStack with proper folder organization

### 5. Execution Monitoring
- Real-time logs with color-coded messages (info/success/warning/error)
- Clear logs button for clean slate
- WebSocket connection status indicator

### 6. Task History
- View all processed tasks with timestamps
- Status indicators (success/failed/pending)
- Test case counts for each task

## Development

### Generate API Client

After API changes, regenerate the client:

```bash
npm run gcl
```

### Type Checking & Linting

```bash
npm run type-check
npm run lint
npm run check  # Both type-check + lint
```

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Configuration

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

## Workflow

### Single Task

1. Enter task ID (e.g., `PA-12345`)
2. Review detected analytics type
3. Click "Generate Prompt"
4. Copy prompt to Claude Desktop
5. Paste Claude's response back
6. Click "Submit Response"
7. Test cases created ✅

### Multiple Tasks

1. Enter multiple IDs (e.g., `PA-123, PA-456`)
2. Review each task's type
3. Skip tasks if needed
4. Generate combined prompt
5. Get single Claude response
6. Submit and create all test cases ✅

## Tech Stack

- Vue 3 + Composition API
- Pinia (State Management)
- Tailwind CSS
- TypeScript
- Socket.IO (WebSocket)
- Auto-generated OpenAPI Client

## Project Structure

```
src/
├── views/              # Main views
├── components/         # Reusable components
├── composables/        # Vue composables
├── stores/             # Pinia stores
├── client/             # Auto-generated API client
└── types/              # TypeScript types
```

## Resources

- [Main README](../README.md) - Full documentation
- [API README](../ai-test-api/README.md) - API details
- [Vue 3 Docs](https://vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
