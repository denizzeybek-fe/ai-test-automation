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
import { AnalyticsType, TaskInfo } from '../types/index.js';

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
      let analyticsType = this.ruleResolver.resolve(taskInfo.title);

      // If no keyword found, ask user
      if (analyticsType === this.ruleResolver.getDefaultType()) {
        // Check if any keyword actually matched
        const hasKeyword = this.hasKeywordMatch(taskInfo.title);

        if (!hasKeyword) {
          console.log(chalk.yellow(`⚠️  No keyword found in: "${taskInfo.title}"\n`));

          const userChoice = await this.promptAnalyticsType();

          if (userChoice === 'skip') {
            console.log(chalk.gray(`⏭️  Skipping task ${taskId}\n`));
            return false; // Skip this task
          }

          analyticsType = userChoice;
        }
      }

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
   * Check if task title has any keyword match
   */
  private hasKeywordMatch(title: string): boolean {
    const types = this.ruleResolver.getTypes();

    for (const type of types) {
      if (type === 'other') continue; // Skip 'other' type

      const patterns = this.ruleResolver.getPatterns(type);
      if (!patterns || patterns.length === 0) continue;

      for (const pattern of patterns) {
        if (pattern.test(title)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Prompt user to select analytics type
   */
  private async promptAnalyticsType(): Promise<'overall' | 'homepage' | 'onsite' | 'usage' | 'other' | 'skip'> {
    console.log(chalk.cyan('Which analytics type should this be?\n'));
    console.log(chalk.white('  1. Overall Analytics'));
    console.log(chalk.white('  2. Homepage Analytics'));
    console.log(chalk.white('  3. Onsite Analytics'));
    console.log(chalk.white('  4. Usage Analytics'));
    console.log(chalk.white('  5. Other'));
    console.log(chalk.gray('  6. Skip this task\n'));

    return new Promise((resolve) => {
      process.stdout.write(chalk.yellow('Your choice [1-6]: '));

      const onData = (data: Buffer): void => {
        const choice = data.toString().trim();

        // Remove listener immediately
        process.stdin.off('data', onData);

        switch (choice) {
          case '1':
            resolve('overall');
            break;
          case '2':
            resolve('homepage');
            break;
          case '3':
            resolve('onsite');
            break;
          case '4':
            resolve('usage');
            break;
          case '5':
            resolve('other');
            break;
          case '6':
            resolve('skip');
            break;
          default:
            console.log(chalk.red('\n❌ Invalid choice. Defaulting to "other"\n'));
            resolve('other');
        }
      };

      process.stdin.once('data', onData);
    });
  }

  /**
   * Process multiple tasks in batch
   * @param taskIds - Array of Jira task IDs
   * @returns Number of successfully processed tasks
   */
  async processBatchTasks(taskIds: string[]): Promise<number> {
    // Single task: use sequential flow (unchanged)
    if (taskIds.length === 1) {
      console.log(chalk.blue.bold(`\n🚀 Processing ${taskIds.length} Task\n`));
      const success = await this.processSingleTask(taskIds[0]);
      return success ? 1 : 0;
    }

    // Multiple tasks: use batch flow
    console.log(chalk.blue.bold(`\n🚀 Processing ${taskIds.length} Tasks in Batch Mode\n`));
    console.log(chalk.gray('Batch mode: All prompts generated first, then process all at once\n'));

    const taskDataList: Array<{
      taskId: string;
      taskInfo: TaskInfo | null;
      analyticsType: AnalyticsType;
      skip: boolean;
      ruleContent?: string;
    }> = [];

    // Phase 1: Generate all prompts
    console.log(chalk.blue.bold('📝 Phase 1: Generating Prompts for All Tasks\n'));

    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i];
      console.log(chalk.cyan(`[${i + 1}/${taskIds.length}] Processing ${taskId}...\n`));

      try {
        // Step 1: Fetch task
        const taskInfo = await withRetry(() => this.jiraService.getTask(taskId), {
          maxRetries: 3,
        });
        console.log(chalk.green(`  ✅ Fetched: ${taskInfo.title}`));

        // Step 2: Resolve analytics type
        let analyticsType = this.ruleResolver.resolve(taskInfo.title);
        let skip = false;

        if (analyticsType === this.ruleResolver.getDefaultType()) {
          const hasKeyword = this.hasKeywordMatch(taskInfo.title);

          if (!hasKeyword) {
            console.log(chalk.yellow(`  ⚠️  No keyword found\n`));
            const userChoice = await this.promptAnalyticsType();

            if (userChoice === 'skip') {
              console.log(chalk.gray(`  ⏭️  Skipping\n`));
              skip = true;
            } else {
              analyticsType = userChoice;
            }
          }
        }

        if (!skip) {
          console.log(chalk.green(`  ✅ Type: ${analyticsType}`));

          // Collect task data for batch prompt generation
          const ruleFilePath = this.ruleResolver.getRuleFilePath(analyticsType);
          const ruleContent = this.promptGenerator.readRuleFile(ruleFilePath);

          taskDataList.push({
            taskId,
            taskInfo,
            analyticsType,
            skip: false,
            ruleContent
          });
        }
      } catch (error) {
        ErrorLogger.log(
          ErrorLogger.createLog(error as Error, taskId, 'Generate prompt')
        );
        console.log(chalk.red(`  ❌ Failed to generate prompt\n`));
        taskDataList.push({ taskId, taskInfo: null, analyticsType: 'overall', skip: true });
      }
    }

    // Generate single batch prompt for all valid tasks
    const validTasks = taskDataList.filter((t) => !t.skip);

    if (validTasks.length === 0) {
      console.log(chalk.yellow('\n⚠️  All tasks were skipped or failed\n'));
      return 0;
    }

    console.log(chalk.blue.bold('\n📝 Generating Single Batch Prompt\n'));

    // Prepare batch prompt data
    const batchPromptData = validTasks.map((task) => ({
      taskInfo: task.taskInfo!,
      analyticsType: task.analyticsType,
      ruleContent: task.ruleContent!,
    }));

    const batchPrompt = this.promptGenerator.generateBatchPrompt(batchPromptData);
    const timestamp = Date.now();
    const batchPromptFileName = `prompt-batch-${timestamp}.md`;
    this.promptGenerator.savePromptToFile(batchPrompt, batchPromptFileName);

    // Create empty batch response file
    const batchResponseFileName = `response-batch-${timestamp}.json`;
    const batchResponseFilePath = `output/responses/${batchResponseFileName}`;
    const fs = await import('fs/promises');

    // Create empty object with task IDs as keys
    const emptyResponse: Record<string, unknown[]> = {};
    validTasks.forEach((task) => {
      emptyResponse[task.taskId] = [];
    });
    await fs.writeFile(batchResponseFilePath, JSON.stringify(emptyResponse, null, 2), 'utf-8');

    console.log(chalk.green(`✅ Batch prompt saved: output/prompts/${batchPromptFileName}`));
    console.log(chalk.green(`✅ Empty response file created: ${batchResponseFilePath}\n`));

    console.log(chalk.blue.bold('📋 Tasks in this batch:\n'));
    validTasks.forEach((task, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${task.taskId} - ${task.taskInfo!.title}`));
    });

    console.log(chalk.cyan.bold('\n⏸️  MANUAL STEP REQUIRED\n'));
    console.log(chalk.white('1. Open the batch prompt file:'));
    console.log(chalk.yellow(`   output/prompts/${batchPromptFileName}\n`));
    console.log(chalk.white('2. Copy the entire content'));
    console.log(chalk.white('3. Paste it into Claude Desktop'));
    console.log(chalk.white('4. Copy the JSON response from Claude'));
    console.log(chalk.white('5. Paste it into the response file:'));
    console.log(chalk.yellow(`   ${batchResponseFilePath}\n`));
    console.log(chalk.gray('   (File already has the correct structure with task IDs as keys)\n'));
    console.log(chalk.yellow('Press Enter when the batch response is ready...\n'));

    await this.waitForUserInput();

    // Phase 2: Process all tasks
    console.log(chalk.blue.bold('\n📦 Phase 2: Creating Test Cases in BrowserStack\n'));

    // Import batch response
    await this.testCaseImporter.waitForFile(batchResponseFilePath, 5000);
    const batchTestCases = this.testCaseImporter.importBatch(batchResponseFilePath);
    console.log(chalk.green(`✅ Imported test cases for ${Object.keys(batchTestCases).length} tasks\n`));

    let successCount = 0;

    for (let i = 0; i < taskDataList.length; i++) {
      const taskData = taskDataList[i];

      if (taskData.skip) {
        console.log(chalk.gray(`[${i + 1}/${taskDataList.length}] Skipped ${taskData.taskId}\n`));
        continue;
      }

      console.log(chalk.cyan(`[${i + 1}/${taskDataList.length}] Processing ${taskData.taskId}...\n`));

      try {
        // Get test cases for this task from batch
        const testCases = batchTestCases[taskData.taskId];

        if (!testCases || testCases.length === 0) {
          throw new Error(`No test cases found for ${taskData.taskId} in batch response`);
        }

        console.log(chalk.green(`  ✅ Found ${testCases.length} test cases`));

        // Create subfolder
        if (!taskData.taskInfo) {
          throw new Error('Task info is missing');
        }

        const parentFolderId = this.folderMapper.getFolderId(taskData.analyticsType);
        const subfolderName = `${taskData.taskId} - ${taskData.taskInfo.title}`;
        const subfolder = await this.browserStackService.findOrCreateSubfolder(
          parentFolderId,
          subfolderName
        );
        console.log(chalk.green(`  ✅ Subfolder: ${subfolder.id}`));

        // Create test cases
        const createdTestCaseIds: string[] = [];
        for (const testCase of testCases) {
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
        }
        console.log(chalk.green(`  ✅ Created ${createdTestCaseIds.length} test cases`));

        // Link to test run
        const testRun = await withRetry(
          () => this.browserStackService.findTestRunByTaskId(taskData.taskId),
          { maxRetries: 3 }
        );

        if (testRun) {
          await withRetry(
            () => this.browserStackService.updateTestRunCases(testRun.identifier, createdTestCaseIds),
            { maxRetries: 3 }
          );
          console.log(chalk.green(`  ✅ Linked to test run ${testRun.identifier}\n`));
        } else {
          console.log(chalk.yellow(`  ⚠️  Test run not found\n`));
        }

        successCount++;
      } catch (error) {
        ErrorLogger.log(
          ErrorLogger.createLog(error as Error, taskData.taskId, 'Process task in batch')
        );
        console.log(chalk.red(`  ❌ Failed\n`));
      }
    }

    console.log(chalk.blue.bold(`\n📊 Batch Processing Complete\n`));
    console.log(chalk.white(`✅ Successful: ${successCount}/${taskIds.length}`));
    console.log(chalk.white(`❌ Failed: ${taskIds.length - successCount}/${taskIds.length}\n`));

    return successCount;
  }
}
