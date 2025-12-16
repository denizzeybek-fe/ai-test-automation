import 'dotenv/config';
import chalk from 'chalk';
import { JiraService } from './services/jira.service.js';

async function testJiraService(): Promise<void> {
  console.log(chalk.blue('🧪 Testing Jira API Service\n'));

  // Get credentials from .env
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    console.log(chalk.red('❌ Missing Jira credentials in .env file'));
    console.log(chalk.yellow('Required: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN'));
    process.exit(1);
  }

  const jiraService = new JiraService(baseUrl, email, apiToken);

  console.log(chalk.green('✅ JiraService initialized\n'));

  // Test 1: Get a specific task
  console.log(chalk.yellow('1️⃣  Testing getTask()...\n'));

  const testTaskId = 'PA-34859'; // Use a real task ID from your project

  try {
    console.log(chalk.gray(`   Fetching task: ${testTaskId}...`));
    const task = await jiraService.getTask(testTaskId);

    console.log(chalk.green(`\n✅ Success! Task fetched:\n`));
    console.log(chalk.blue(`   ID: ${task.id}`));
    console.log(chalk.blue(`   Title: ${task.title}`));
    console.log(chalk.blue(`   Description: ${task.description.substring(0, 100)}...`));

    if (task.rootCause) {
      console.log(chalk.blue(`   Root Cause: ${task.rootCause.substring(0, 100)}...`));
    }

    if (task.testCaseDescription) {
      console.log(chalk.blue(`   Test Case Description: ${task.testCaseDescription.substring(0, 100)}...`));
    }

    if (task.figmaUrl) {
      console.log(chalk.green(`   📐 Figma URL: ${task.figmaUrl}`));
    } else {
      console.log(chalk.gray(`   📐 Figma URL: Not found`));
    }

    if (task.confluenceUrl) {
      console.log(chalk.green(`   📄 Confluence URL: ${task.confluenceUrl}`));
    } else {
      console.log(chalk.gray(`   📄 Confluence URL: Not found`));
    }

    console.log('');
  } catch (error) {
    console.log(chalk.red(`\n❌ Failed to fetch task: ${(error as Error).message}\n`));
    process.exit(1);
  }

  // Test 2: Get tasks in sprint (optional - uncomment if you have a sprint ID)
  /*
  console.log(chalk.yellow('2️⃣  Testing getTasksInSprint()...\n'));

  const testSprintId = 'SPRINT-ID'; // Replace with real sprint ID

  try {
    console.log(chalk.gray(`   Fetching tasks in sprint: ${testSprintId}...`));
    const taskIds = await jiraService.getTasksInSprint(testSprintId);

    console.log(chalk.green(`\n✅ Success! Found ${taskIds.length} tasks:\n`));
    taskIds.slice(0, 10).forEach((id) => {
      console.log(chalk.gray(`   - ${id}`));
    });

    if (taskIds.length > 10) {
      console.log(chalk.gray(`   ... and ${taskIds.length - 10} more`));
    }

    console.log('');
  } catch (error) {
    console.log(chalk.red(`\n❌ Failed to fetch sprint tasks: ${(error as Error).message}\n`));
  }
  */

  console.log(chalk.green.bold('🎉 Jira Service Test Complete!\n'));
  console.log(chalk.blue('📊 JiraService is ready to use'));
}

void testJiraService();
