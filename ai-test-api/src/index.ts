#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { Orchestrator } from './services/orchestrator.js';
import { JiraService } from './services/jira.service.js';
import { BatchManager } from './utils/batch-manager.js';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('ai-test-automation')
  .description('Automated test case generation and BrowserStack integration')
  .version('1.0.0');

program
  .command('run')
  .description('Generate and create test cases')
  .option('-t, --tasks <taskIds...>', 'Jira task IDs (space or comma-separated: PA-12345 PA-67890 or PA-12345,PA-67890)')
  .option('-s, --sprint-id <sprintId>', 'Jira sprint ID to process all tasks')
  .option(
    '-b, --batch-size <size>',
    'Batch size for AI prompt generation',
    process.env.AI_BATCH_SIZE || '20'
  )
  .action(async (options: { tasks?: string[]; sprintId?: string; batchSize: string }) => {
    try {
      console.log(chalk.blue.bold('\n🤖 AI Test Automation Tool\n'));

      // Validate options
      if (!options.tasks && !options.sprintId) {
        console.log(
          chalk.red('❌ Error: Please provide either --tasks or --sprint-id\n')
        );
        console.log(chalk.gray('Examples:'));
        console.log(chalk.gray('  npm run dev run -- --tasks PA-12345'));
        console.log(chalk.gray('  npm run dev run -- --tasks PA-12345 PA-67890'));
        console.log(chalk.gray('  npm run dev run -- --tasks PA-12345,PA-67890,PA-89012'));
        console.log(chalk.gray('  npm run dev run -- --sprint-id 123\n'));
        process.exit(1);
      }

      if (options.tasks && options.sprintId) {
        console.log(
          chalk.red('❌ Error: Cannot use both --tasks and --sprint-id\n')
        );
        process.exit(1);
      }

      const orchestrator = new Orchestrator();
      let taskIds: string[] = [];

      // Get task IDs
      if (options.tasks) {
        // Support both comma-separated and space-separated
        // "PA-123,PA-456" or "PA-123 PA-456" both work
        taskIds = options.tasks
          .flatMap((task) => task.split(','))
          .map((task) => task.trim())
          .filter((task) => task.length > 0);
        console.log(chalk.white(`📋 Processing ${taskIds.length} task(s)\n`));
      } else if (options.sprintId) {
        console.log(chalk.yellow(`🔍 Fetching tasks from sprint ${options.sprintId}...\n`));

        const jiraService = new JiraService(
          process.env.JIRA_BASE_URL || '',
          process.env.JIRA_EMAIL || '',
          process.env.JIRA_API_TOKEN || ''
        );

        const sprintTasks = await jiraService.getSprintTasks(
          parseInt(options.sprintId, 10)
        );

        taskIds = sprintTasks.map((task: { id: string; title: string }) => task.id);
        console.log(chalk.green(`✅ Found ${taskIds.length} tasks in sprint\n`));

        if (taskIds.length === 0) {
          console.log(chalk.yellow('⚠️  No tasks found in this sprint\n'));
          process.exit(0);
        }

        // Show tasks and ask for confirmation
        console.log(chalk.white('Tasks to process:\n'));
        sprintTasks.forEach((task: { id: string; title: string }, index: number) => {
          console.log(chalk.gray(`  ${index + 1}. ${task.id}: ${task.title}`));
        });
        console.log('');

        // Simple confirmation (in production, use inquirer or similar)
        console.log(chalk.yellow('Continue with all tasks? (Ctrl+C to cancel)\n'));
        await waitForUserInput();
      }

      // Batch processing based on AI_BATCH_SIZE
      const batchSize = parseInt(options.batchSize, 10);

      if (taskIds.length > batchSize) {
        console.log(
          chalk.blue(
            `📦 Splitting ${taskIds.length} tasks into batches of ${batchSize}\n`
          )
        );

        const batches = BatchManager.splitIntoBatches(taskIds, batchSize);

        console.log(chalk.white(`Total batches: ${batches.length}\n`));

        let totalSuccess = 0;

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          console.log(
            chalk.blue.bold(`\n📦 Batch ${i + 1}/${batches.length} (${batch.length} tasks)\n`)
          );

          const successCount = await orchestrator.processBatchTasks(batch);
          totalSuccess += successCount;

          if (i < batches.length - 1) {
            console.log(
              chalk.yellow('\n⏸️  Batch complete. Ready for next batch?\n')
            );
            console.log(chalk.gray('Press Enter to continue to next batch...\n'));
            await waitForUserInput();
          }
        }

        console.log(chalk.green.bold(`\n🎉 All Batches Complete!\n`));
        console.log(chalk.white(`✅ Total successful: ${totalSuccess}/${taskIds.length}`));
        console.log(
          chalk.white(`❌ Total failed: ${taskIds.length - totalSuccess}/${taskIds.length}\n`)
        );
        process.exit(0);
      } else {
        // Single batch processing
        console.log(chalk.blue(`📦 Processing ${taskIds.length} task(s)\n`));
        const successCount = await orchestrator.processBatchTasks(taskIds);

        console.log(chalk.green.bold(`\n🎉 Processing Complete!\n`));
        console.log(chalk.white(`✅ Successful: ${successCount}/${taskIds.length}`));
        console.log(
          chalk.white(`❌ Failed: ${taskIds.length - successCount}/${taskIds.length}\n`)
        );
        process.exit(0);
      }
    } catch (error) {
      console.log(chalk.red.bold('\n❌ Fatal Error:\n'));
      console.log(chalk.red((error as Error).message + '\n'));
      process.exit(1);
    }
  });

program.parse();

/**
 * Wait for user to press Enter
 */
function waitForUserInput(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
}
