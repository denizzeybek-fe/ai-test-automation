import chalk from 'chalk';
import { Orchestrator } from '../src/services/orchestrator.js';

async function testOrchestrator(): Promise<void> {
  console.log(chalk.blue.bold('🧪 Testing Orchestrator - End-to-End Flow\n'));

  const orchestrator = new Orchestrator();

  // Test with a real Jira task
  // Note: This will require manual interaction at Step 4/6
  const taskId = 'PA-34859'; // Replace with actual task ID if needed

  console.log(chalk.white('This test will demonstrate the full workflow:\n'));
  console.log(chalk.gray('1. Fetch task from Jira'));
  console.log(chalk.gray('2. Resolve analytics type'));
  console.log(chalk.gray('3. Generate AI prompt'));
  console.log(chalk.gray('4. MANUAL: Copy prompt to Claude Desktop'));
  console.log(chalk.gray('5. Import AI-generated test cases'));
  console.log(chalk.gray('6. Create test cases in BrowserStack\n'));

  console.log(
    chalk.yellow('Note: You can skip the manual step by pressing Ctrl+C\n')
  );

  await orchestrator.processSingleTask(taskId);
}

void testOrchestrator();
