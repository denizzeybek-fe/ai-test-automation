import chalk from 'chalk';
import path from 'path';
import { JiraService } from './jira.service.js';
import { RuleResolver } from '../resolvers/rule-resolver.js';
import { FolderMapper } from '../resolvers/folder-mapper.js';
import { PromptGenerator } from './prompt-generator.js';
import { TestCaseImporter } from './testcase-importer.js';
import { BrowserStackService } from './browserstack.service.js';

export class Orchestrator {
  private jiraService: JiraService;
  private ruleResolver: RuleResolver;
  private folderMapper: FolderMapper;
  private promptGenerator: PromptGenerator;
  private testCaseImporter: TestCaseImporter;
  private browserStackService: BrowserStackService;

  constructor() {
    const jiraBaseUrl = process.env.JIRA_BASE_URL || '';
    const jiraEmail = process.env.JIRA_EMAIL || '';
    const jiraApiToken = process.env.JIRA_API_TOKEN || '';

    const browserStackUsername = process.env.BROWSERSTACK_USERNAME || '';
    const browserStackAccessKey = process.env.BROWSERSTACK_ACCESS_KEY || '';
    const browserStackProjectId = process.env.BROWSERSTACK_PROJECT_ID || '';

    const rulesConfigPath = path.join(process.cwd(), 'config/rules.config.json');
    const foldersConfigPath = path.join(
      process.cwd(),
      'config/folders.config.json'
    );

    this.jiraService = new JiraService(jiraBaseUrl, jiraEmail, jiraApiToken);
    this.ruleResolver = new RuleResolver(rulesConfigPath);
    this.folderMapper = new FolderMapper(foldersConfigPath);
    this.promptGenerator = new PromptGenerator();
    this.testCaseImporter = new TestCaseImporter();
    this.browserStackService = new BrowserStackService(
      browserStackUsername,
      browserStackAccessKey,
      browserStackProjectId
    );
  }

  /**
   * Process a single task end-to-end
   * @param taskId - Jira task ID (e.g., "PA-12345")
   * @returns Success status
   */
  async processSingleTask(taskId: string): Promise<boolean> {
    console.log(chalk.blue.bold(`\n🚀 Processing Task: ${taskId}\n`));

    try {
      // Step 1: Fetch task from Jira
      console.log(chalk.yellow('Step 1/6: Fetching task from Jira...'));
      const taskInfo = await this.jiraService.getTask(taskId);
      console.log(chalk.green(`✅ Task fetched: ${taskInfo.title}\n`));

      // Step 2: Resolve analytics type
      console.log(chalk.yellow('Step 2/6: Resolving analytics type...'));
      const analyticsType = this.ruleResolver.resolve(taskInfo.title);
      console.log(chalk.green(`✅ Analytics type: ${analyticsType}\n`));

      // Step 3: Read rule file
      console.log(chalk.yellow('Step 3/6: Reading product rules...'));
      const ruleFilePath = this.ruleResolver.getRuleFilePath(analyticsType);
      const ruleContent = this.promptGenerator.readRuleFile(ruleFilePath);
      console.log(chalk.green(`✅ Rules loaded from: ${ruleFilePath}\n`));

      // Step 4: Generate prompt
      console.log(chalk.yellow('Step 4/6: Generating AI prompt...'));
      const prompt = this.promptGenerator.generateSinglePrompt(
        taskInfo,
        analyticsType,
        ruleContent
      );
      const promptFileName = `prompt-${taskId}-${Date.now()}.md`;
      this.promptGenerator.savePromptToFile(prompt, promptFileName);
      console.log(chalk.green(`✅ Prompt saved: output/prompts/${promptFileName}\n`));

      // Manual step: User interaction required
      console.log(chalk.cyan.bold('⏸️  MANUAL STEP REQUIRED\n'));
      console.log(chalk.white('Please follow these steps:\n'));
      console.log(chalk.gray('1. Open the prompt file:'));
      console.log(chalk.gray(`   output/prompts/${promptFileName}\n`));
      console.log(chalk.gray('2. Copy the entire content'));
      console.log(chalk.gray('3. Paste it into Claude Desktop'));
      console.log(chalk.gray('4. Copy the JSON response from Claude'));
      console.log(chalk.gray('5. Save it as:'));
      console.log(chalk.gray(`   output/responses/response-${taskId}.json\n`));
      console.log(chalk.yellow('Press Enter when you have saved the response file...'));

      // Wait for user input
      await this.waitForUserInput();

      // Step 5: Import test cases
      console.log(chalk.yellow('\nStep 5/6: Importing test cases from AI response...'));
      const responseFilePath = `output/responses/response-${taskId}.json`;

      // Wait for file to exist (with timeout)
      await this.testCaseImporter.waitForFile(responseFilePath, 60000); // 1 minute timeout

      const testCases = this.testCaseImporter.importSingle(responseFilePath);
      console.log(chalk.green(`✅ Imported ${testCases.length} test cases\n`));

      // Step 6: Create test cases in BrowserStack
      console.log(chalk.yellow('Step 6/6: Creating test cases in BrowserStack...'));
      const folderId = this.folderMapper.getFolderId(analyticsType);

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(chalk.gray(`  Creating: ${testCase.name}...`));

        await this.browserStackService.createTestCase(folderId, {
          name: testCase.name,
          description: testCase.description,
          preconditions: testCase.preconditions,
          test_case_steps: testCase.test_case_steps,
          tags: testCase.tags,
        });
      }

      console.log(chalk.green(`✅ Created ${testCases.length} test cases in BrowserStack\n`));
      console.log(chalk.green.bold(`🎉 Task ${taskId} processed successfully!\n`));

      return true;
    } catch (error) {
      console.log(chalk.red.bold(`\n❌ Error processing task ${taskId}:\n`));
      console.log(chalk.red((error as Error).message));
      return false;
    }
  }

  /**
   * Wait for user to press Enter
   */
  private async waitForUserInput(): Promise<void> {
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }

  /**
   * Process multiple tasks in batch
   * @param taskIds - Array of Jira task IDs
   * @returns Number of successfully processed tasks
   */
  async processBatchTasks(taskIds: string[]): Promise<number> {
    console.log(chalk.blue.bold(`\n🚀 Processing ${taskIds.length} Tasks in Batch\n`));

    let successCount = 0;

    for (const taskId of taskIds) {
      const success = await this.processSingleTask(taskId);
      if (success) {
        successCount++;
      }
      console.log(chalk.gray('─'.repeat(50) + '\n'));
    }

    console.log(chalk.blue.bold(`\n📊 Batch Processing Complete\n`));
    console.log(chalk.white(`✅ Successful: ${successCount}/${taskIds.length}`));
    console.log(chalk.white(`❌ Failed: ${taskIds.length - successCount}/${taskIds.length}\n`));

    return successCount;
  }
}
