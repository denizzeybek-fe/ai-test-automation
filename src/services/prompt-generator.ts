import fs from 'fs';
import path from 'path';
import { TaskInfo, AnalyticsType } from '../types/index.js';

export interface TaskPromptData {
  taskInfo: TaskInfo;
  analyticsType: AnalyticsType;
  ruleContent: string;
}

export class PromptGenerator {
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
- Generate 2-5 comprehensive test cases
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
${task.taskInfo.description.substring(0, 500)}${task.taskInfo.description.length > 500 ? '...' : ''}

${task.taskInfo.figmaUrl ? `**Figma:** ${task.taskInfo.figmaUrl}\n` : ''}
${task.taskInfo.confluenceUrl ? `**Docs:** ${task.taskInfo.confluenceUrl}\n` : ''}

**Product Rules:**
${task.ruleContent.substring(0, 300)}...
`;
      })
      .join('\n---\n\n');

    return `# Batch Test Case Generation Request

Generate test cases for BrowserStack Test Management for ${tasks.length} tasks.

## Tasks

${taskSections}

## Output Format

Return **ONLY** valid JSON (no markdown, no code blocks, no explanation):

\`\`\`json
{
  "${tasks[0].taskInfo.id}": [
    {
      "name": "Test case name",
      "description": "What this test validates",
      "test_case_steps": [
        { "step": "Action", "result": "Expected outcome" }
      ],
      "tags": ["tag1", "tag2"]
    }
  ],
  "${tasks.length > 1 ? tasks[1].taskInfo.id : 'TASK-ID'}": [
    // ... test cases for this task
  ]
}
\`\`\`

**Important:**
- Generate 2-3 test cases per task
- Use task ID as the key in the JSON object
- Each test case should be comprehensive and actionable
- Include relevant tags
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
