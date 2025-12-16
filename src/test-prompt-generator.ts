import 'dotenv/config';
import path from 'path';
import chalk from 'chalk';
import { JiraService } from './services/jira.service.js';
import { RuleResolver } from './resolvers/rule-resolver.js';
import { PromptGenerator } from './services/prompt-generator.js';

async function testPromptGenerator(): Promise<void> {
  console.log(chalk.blue('🧪 Testing Prompt Generator\n'));

  // Initialize services
  const jiraService = new JiraService(
    process.env.JIRA_BASE_URL!,
    process.env.JIRA_EMAIL!,
    process.env.JIRA_API_TOKEN!
  );

  const rulesConfigPath = path.join(process.cwd(), 'config/rules.config.json');
  const ruleResolver = new RuleResolver(rulesConfigPath);
  const promptGenerator = new PromptGenerator();

  console.log(chalk.green('✅ Services initialized\n'));

  // Test with real task
  const testTaskId = 'PA-34859';

  try {
    // Step 1: Fetch task from Jira
    console.log(chalk.yellow(`1️⃣  Fetching task: ${testTaskId}...\n`));
    const taskInfo = await jiraService.getTask(testTaskId);
    console.log(chalk.green(`✅ Task fetched: ${taskInfo.title}\n`));

    // Step 2: Resolve analytics type
    console.log(chalk.yellow('2️⃣  Resolving analytics type...\n'));
    const analyticsType = ruleResolver.resolve(taskInfo.title);
    console.log(chalk.green(`✅ Analytics type: ${analyticsType}\n`));

    // Step 3: Get rule file path and read content
    console.log(chalk.yellow('3️⃣  Reading rule file...\n'));
    const ruleFilePath = ruleResolver.getRuleFilePath(analyticsType);
    const ruleContent = promptGenerator.readRuleFile(ruleFilePath);
    console.log(chalk.green(`✅ Rule file read: ${ruleFilePath}`));
    console.log(chalk.gray(`   Content length: ${ruleContent.length} characters\n`));

    // Step 4: Generate prompt
    console.log(chalk.yellow('4️⃣  Generating prompt...\n'));
    const prompt = promptGenerator.generateSinglePrompt(
      taskInfo,
      analyticsType,
      ruleContent
    );
    console.log(chalk.green('✅ Prompt generated\n'));

    // Step 5: Save prompt to file
    const filename = `${testTaskId}-prompt.txt`;
    console.log(chalk.yellow(`5️⃣  Saving prompt to file: ${filename}...\n`));
    promptGenerator.savePromptToFile(prompt, filename);
    console.log(chalk.green(`✅ Prompt saved: output/prompts/${filename}\n`));

    // Display prompt preview
    console.log(chalk.blue('📋 Prompt Preview (first 500 characters):\n'));
    console.log(chalk.gray('─'.repeat(80)));
    console.log(chalk.white(prompt.substring(0, 500) + '...'));
    console.log(chalk.gray('─'.repeat(80)));
    console.log('');

    // Instructions
    console.log(chalk.green.bold('🎉 Prompt Generation Test Complete!\n'));
    console.log(chalk.blue('📝 Next Steps:\n'));
    console.log(chalk.yellow(`   1. Open: output/prompts/${filename}`));
    console.log(chalk.yellow('   2. Copy the entire prompt'));
    console.log(chalk.yellow('   3. Paste into Claude Desktop'));
    console.log(chalk.yellow('   4. Save the JSON response to: output/responses/PA-34859-testcases.json'));
    console.log('');

  } catch (error) {
    console.log(chalk.red(`\n❌ Test failed: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

void testPromptGenerator();
