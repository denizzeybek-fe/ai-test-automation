import chalk from 'chalk';
import path from 'path';
import { JiraService } from './jira.service.js';
import { RuleResolver } from '../resolvers/rule-resolver.js';
import { FolderMapper } from '../resolvers/folder-mapper.js';
import { PromptGenerator } from './prompt-generator.js';
import { TestCaseImporter } from './testcase-importer.js';
import { BrowserStackService } from './browserstack.service.js';
import { ErrorLogger } from '../utils/error-logger.js';
import { withRetry } from '../utils/with-retry.js';

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
      // Step 1: Fetch task from Jira (with retry)
      console.log(chalk.yellow('Step 1/6: Fetching task from Jira...'));
      const taskInfo = await withRetry(() => this.jiraService.getTask(taskId), {
        maxRetries: 3,
      });
      console.log(chalk.green(`✅ Task fetched: ${taskInfo.title}\n`));

      // Step 2: Resolve analytics type
      console.log(chalk.yellow('Step 2/8: Resolving analytics type...'));
      const analyticsType = this.ruleResolver.resolve(taskInfo.title);
      console.log(chalk.green(`✅ Analytics type: ${analyticsType}\n`));

      // Step 3: Get parent folder and create task-specific subfolder
      console.log(chalk.yellow('Step 3/8: Setting up folder structure...'));
      const parentFolderId = this.folderMapper.getFolderId(analyticsType);
      const subfolderName = `${taskId} - ${taskInfo.title}`;
      const subfolder = await this.browserStackService.findOrCreateSubfolder(
        parentFolderId,
        subfolderName
      );
      console.log(chalk.green(`✅ Subfolder ready: ${subfolderName} (ID: ${subfolder.id})\n`));

      // Step 4: Read rule file
      console.log(chalk.yellow('Step 4/8: Reading product rules...'));
      const ruleFilePath = this.ruleResolver.getRuleFilePath(analyticsType);
      const ruleContent = this.promptGenerator.readRuleFile(ruleFilePath);
      console.log(chalk.green(`✅ Rules loaded from: ${ruleFilePath}\n`));

      // Step 5: Generate prompt and create empty response file
      console.log(chalk.yellow('Step 5/8: Generating AI prompt...'));
      const prompt = this.promptGenerator.generateSinglePrompt(
        taskInfo,
        analyticsType,
        ruleContent
      );
      const promptFileName = `prompt-${taskId}-${Date.now()}.md`;
      this.promptGenerator.savePromptToFile(prompt, promptFileName);

      // Create empty response file for user to fill
      const responseFileName = `response-${taskId}.json`;
      const responseFilePath = `output/responses/${responseFileName}`;
      const fs = await import('fs/promises');
      await fs.writeFile(responseFilePath, '[\n  \n]', 'utf-8');

      console.log(chalk.green(`✅ Prompt saved: output/prompts/${promptFileName}`));
      console.log(chalk.green(`✅ Empty response file created: ${responseFilePath}\n`));

      // Manual step: User interaction required
      console.log(chalk.cyan.bold('⏸️  MANUAL STEP REQUIRED\n'));
      console.log(chalk.white('Please follow these steps:\n'));
      console.log(chalk.gray('1. Open the prompt file:'));
      console.log(chalk.gray(`   output/prompts/${promptFileName}\n`));
      console.log(chalk.gray('2. Copy the entire content'));
      console.log(chalk.gray('3. Paste it into Claude Desktop'));
      console.log(chalk.gray('4. Copy the JSON response from Claude'));
      console.log(chalk.gray('5. Paste it into the pre-created file:'));
      console.log(chalk.yellow(`   ${responseFilePath}\n`));
      console.log(chalk.gray('   (File is already open and waiting for your response!)\n'));
      console.log(chalk.yellow('Press Enter when you have pasted the response...'));

      // Wait for user input
      await this.waitForUserInput();

      // Step 6: Import test cases
      console.log(chalk.yellow('\nStep 6/8: Importing test cases from AI response...'));

      // Wait for file to have content (with timeout)
      await this.testCaseImporter.waitForFile(responseFilePath, 60000); // 1 minute timeout

      const testCases = this.testCaseImporter.importSingle(responseFilePath);
      console.log(chalk.green(`✅ Imported ${testCases.length} test cases\n`));

      // Step 7: Create test cases in BrowserStack subfolder (with retry)
      console.log(chalk.yellow('Step 7/8: Creating test cases in BrowserStack...'));
      const createdTestCaseIds: string[] = [];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(chalk.gray(`  Creating: ${testCase.name}...`));

        try {
          const createdTestCase = await withRetry(
            () =>
              this.browserStackService.createTestCase(subfolder.id, {
                name: testCase.name,
                description: testCase.description,
                preconditions: testCase.preconditions,
                test_case_steps: testCase.test_case_steps,
                tags: testCase.tags,
              }),
            { maxRetries: 3 }
          );
          createdTestCaseIds.push(createdTestCase.identifier);
        } catch (error) {
          // Log error but continue with other test cases
          ErrorLogger.log(
            ErrorLogger.createLog(
              error as Error,
              taskId,
              `Create test case: ${testCase.name}`
            )
          );
          console.log(chalk.red(`  ⚠️  Failed to create: ${testCase.name}`));
        }
      }

      console.log(chalk.green(`✅ Created ${createdTestCaseIds.length} test cases in BrowserStack\n`));

      // Step 8: Link test cases to test run
      console.log(chalk.yellow('Step 8/8: Linking test cases to test run...'));
      try {
        const testRun = await withRetry(
          () => this.browserStackService.findTestRunByTaskId(taskId),
          { maxRetries: 3 }
        );

        if (!testRun) {
          console.log(chalk.red(`⚠️  Test run not found for task ${taskId}`));
          ErrorLogger.log(
            ErrorLogger.createLog(
              new Error(`Test run not found for task ${taskId}`),
              taskId,
              'Find test run'
            )
          );
        } else {
          await withRetry(
            () => this.browserStackService.updateTestRunCases(testRun.identifier, createdTestCaseIds),
            { maxRetries: 3 }
          );
          console.log(chalk.green(`✅ Linked ${createdTestCaseIds.length} test cases to test run ${testRun.identifier}\n`));
        }
      } catch (error) {
        ErrorLogger.log(
          ErrorLogger.createLog(
            error as Error,
            taskId,
            'Link test cases to test run'
          )
        );
        console.log(chalk.red(`⚠️  Failed to link test cases to test run`));
      }

      console.log(chalk.green.bold(`🎉 Task ${taskId} processed successfully!\n`));

      return true;
    } catch (error) {
      // Log error to file
      ErrorLogger.log(
        ErrorLogger.createLog(error as Error, taskId, 'Process single task')
      );

      console.log(chalk.red.bold(`\n❌ Error processing task ${taskId}:\n`));
      console.log(chalk.red((error as Error).message));
      console.log(chalk.gray(`\nError logged to: errors/\n`));
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
