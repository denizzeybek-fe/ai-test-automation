import fs from 'fs';
import path from 'path';
import { TaskInfo, AnalyticsType } from '../types/index.js';

export interface TaskPromptData {
  taskInfo: TaskInfo;
  analyticsType: AnalyticsType;
  ruleContent: string;
}

export class PromptGenerator {
  private minTestCases: number;
  private maxTestCases: number;

  constructor() {
    this.minTestCases = parseInt(process.env.AI_MIN_TEST_CASES || '2', 10);
    this.maxTestCases = parseInt(process.env.AI_MAX_TEST_CASES || '5', 10);
  }

  /**
   * Generate prompt for a single task
   * @param taskInfo - Task information from Jira
   * @param analyticsType - Analytics type (overall, homepage, etc.)
   * @param ruleContent - Content of the .mdc rule file
   * @returns Formatted prompt string
   */
  generateSinglePrompt(
    taskInfo: TaskInfo,
    analyticsType: AnalyticsType,
    ruleContent: string
  ): string {
    return `# Test Case Generation Request

Generate test cases for BrowserStack Test Management based on the task information below.

## Task Information

**Task ID:** ${taskInfo.id}
**Title:** ${taskInfo.title}
**Analytics Type:** ${analyticsType}

**Description:**
${taskInfo.description}

${taskInfo.rootCause ? `**Root Cause:**\n${taskInfo.rootCause}\n` : ''}
${taskInfo.testCaseDescription ? `**Test Case Description:**\n${taskInfo.testCaseDescription}\n` : ''}
${taskInfo.figmaUrl ? `**Figma Design:** ${taskInfo.figmaUrl}\n` : ''}
${taskInfo.confluenceUrl ? `**Documentation:** ${taskInfo.confluenceUrl}\n` : ''}

## Product Rules

${ruleContent}

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
    "tags": ["${analyticsType}", "tag2", "tag3"]
  }
]
\`\`\`

**Important:**
- Generate ${this.minTestCases}-${this.maxTestCases} comprehensive test cases
- Each test case should cover different scenarios
- Steps should be clear and actionable
- Expected results should be specific and verifiable
- Include relevant tags for categorization
`;
  }

  /**
   * Generate prompt for multiple tasks (batch)
   * @param tasks - Array of task data
   * @returns Formatted batch prompt string
   */
  generateBatchPrompt(tasks: TaskPromptData[]): string {
    const taskSections = tasks
      .map((task, index) => {
        return `### Task ${index + 1}: ${task.taskInfo.id}

**Title:** ${task.taskInfo.title}
**Analytics Type:** ${task.analyticsType}

**Description:**
${task.taskInfo.description}

${task.taskInfo.rootCause ? `**Root Cause:**\n${task.taskInfo.rootCause}\n` : ''}
${task.taskInfo.testCaseDescription ? `**Test Case Description:**\n${task.taskInfo.testCaseDescription}\n` : ''}
${task.taskInfo.figmaUrl ? `**Figma:** ${task.taskInfo.figmaUrl}\n` : ''}
${task.taskInfo.confluenceUrl ? `**Docs:** ${task.taskInfo.confluenceUrl}\n` : ''}

**Product Rules:**
${task.ruleContent}
`;
      })
      .join('\n---\n\n');

    // Generate example keys for JSON format
    const exampleKeys = tasks.map(t => `"${t.taskInfo.id}"`).join(', ');

    return `# Batch Test Case Generation Request

Generate test cases for BrowserStack Test Management for **${tasks.length} tasks** below.

## Tasks

${taskSections}

## Output Format

Return **ONLY** valid JSON (no markdown, no code blocks, no explanation).

The JSON must be an object where each key is a task ID, and the value is an array of test cases:

\`\`\`json
{
  "${tasks[0].taskInfo.id}": [
    {
      "name": "Test case name (clear and descriptive)",
      "description": "What this test validates",
      "preconditions": "Optional: Any setup required",
      "test_case_steps": [
        {
          "step": "Action to perform",
          "result": "Expected outcome"
        }
      ],
      "tags": ["${tasks[0].analyticsType}", "tag2"]
    }
  ]${tasks.length > 1 ? `,\n  "${tasks[1].taskInfo.id}": [\n    // ... 2-5 test cases\n  ]` : ''}
}
\`\`\`

**Important:**
- Generate ${this.minTestCases}-${this.maxTestCases} comprehensive test cases per task
- Keys must be exact task IDs: ${exampleKeys}
- Each test case should cover different scenarios
- Steps should be clear and actionable
- Expected results should be specific and verifiable
- Include relevant tags for categorization
`;
  }

  /**
   * Save prompt to file
   * @param prompt - Prompt content
   * @param filename - Filename (without path)
   */
  savePromptToFile(prompt: string, filename: string): void {
    const outputDir = path.join(process.cwd(), 'output/prompts');

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, prompt, 'utf-8');
  }

  /**
   * Read rule file content
   * @param ruleFilePath - Absolute path to rule file
   * @returns Rule file content
   */
  readRuleFile(ruleFilePath: string): string {
    try {
      return fs.readFileSync(ruleFilePath, 'utf-8');
    } catch {
      throw new Error(`Failed to read rule file: ${ruleFilePath}`);
    }
  }
}
