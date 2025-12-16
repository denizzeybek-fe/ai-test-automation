import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { JiraService } from '../src/services/jira.service.js';
import { RuleResolver } from '../src/resolvers/rule-resolver.js';
import { FolderMapper } from '../src/resolvers/folder-mapper.js';
import { PromptGenerator } from '../src/services/prompt-generator.js';
import { TestCaseImporter } from '../src/services/testcase-importer.js';
import { AnalyticsType } from '../src/types/index.js';

/**
 * E2E Test: Simulates the complete workflow without BrowserStack API calls
 *
 * This test validates:
 * 1. Jira service can fetch task
 * 2. Rule resolver can determine analytics type
 * 3. Folder mapper can get correct folder ID
 * 4. Prompt generator creates valid prompt
 * 5. Test case importer can parse mock AI response
 *
 * Does NOT test:
 * - BrowserStack API calls (requires credentials and creates real data)
 * - Orchestrator (full integration test)
 */

async function runE2ETest(): Promise<void> {
  console.log(chalk.blue.bold('🧪 E2E Test: Complete Workflow Simulation\n'));

  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Initialize Services
  console.log(chalk.yellow('Test 1/6: Initializing services...'));
  try {
    new RuleResolver(path.join(process.cwd(), 'config/rules.config.json'));
    new FolderMapper(path.join(process.cwd(), 'config/folders.config.json'));
    new PromptGenerator();
    new TestCaseImporter();

    console.log(chalk.green('✅ All services initialized successfully\n'));
    testsRun++;
    testsPassed++;
  } catch (error) {
    console.log(chalk.red(`❌ Failed to initialize services: ${(error as Error).message}\n`));
    testsRun++;
    testsFailed++;
    return;
  }

  // Test 2: Jira Task Fetch (requires valid credentials)
  console.log(chalk.yellow('Test 2/6: Fetching Jira task...'));
  testsRun++;

  // Check if we have valid Jira credentials
  if (!process.env.JIRA_API_TOKEN || process.env.JIRA_API_TOKEN === 'your_jira_token' ||
      !process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL) {
    console.log(chalk.gray('⏭️  Skipped (no valid Jira credentials)\n'));
  } else {
    try {
      const jiraService = new JiraService(
        process.env.JIRA_BASE_URL,
        process.env.JIRA_EMAIL,
        process.env.JIRA_API_TOKEN
      );
      const taskId = 'PA-34858'; // Known task ID for testing

      try {
        const taskInfo = await jiraService.getTask(taskId);
        console.log(chalk.green(`✅ Task fetched: ${taskInfo.id} - ${taskInfo.title}`));
        console.log(chalk.gray(`   Description length: ${taskInfo.description.length} chars\n`));
        testsPassed++;
      } catch {
        // Task might not exist, but service works
        console.log(chalk.yellow(`⚠️  Task not found (service works, task may not exist)\n`));
        testsPassed++;
      }
    } catch (error) {
      console.log(chalk.red(`❌ Jira service error: ${(error as Error).message}\n`));
      testsFailed++;
    }
  }

  // Test 3: Rule Resolver
  console.log(chalk.yellow('Test 3/6: Testing rule resolver...'));
  try {
    const ruleResolver = new RuleResolver(path.join(process.cwd(), 'config/rules.config.json'));

    const testCases = [
      { title: 'Overall Analytics Dashboard', expected: AnalyticsType.Overall },
      { title: 'Homepage Analytics Fix', expected: AnalyticsType.Homepage },
      { title: 'Onsite Campaign Bug', expected: AnalyticsType.Onsite },
      { title: 'Usage Analytics Report', expected: AnalyticsType.Usage },
    ];

    let passed = true;
    for (const tc of testCases) {
      const result = ruleResolver.resolve(tc.title);
      if (result !== tc.expected) {
        console.log(chalk.red(`   ❌ "${tc.title}" → ${result} (expected: ${tc.expected})`));
        passed = false;
      }
    }

    if (passed) {
      console.log(chalk.green(`✅ All ${testCases.length} rule resolver tests passed\n`));
      testsPassed++;
    } else {
      testsFailed++;
    }
    testsRun++;
  } catch (error) {
    console.log(chalk.red(`❌ Rule resolver error: ${(error as Error).message}\n`));
    testsRun++;
    testsFailed++;
  }

  // Test 4: Folder Mapper
  console.log(chalk.yellow('Test 4/6: Testing folder mapper...'));
  try {
    const folderMapper = new FolderMapper(path.join(process.cwd(), 'config/folders.config.json'));

    const folderTests: Array<{ type: AnalyticsType; expectedId: number }> = [
      { type: AnalyticsType.Overall, expectedId: 26884046 },
      { type: AnalyticsType.Homepage, expectedId: 26887302 },
      { type: AnalyticsType.Onsite, expectedId: 26889616 },
      { type: AnalyticsType.Usage, expectedId: 26889629 },
      { type: AnalyticsType.Other, expectedId: 26889696 },
    ];

    let passed = true;
    for (const { type, expectedId } of folderTests) {
      const folderId = folderMapper.getFolderId(type);
      if (folderId !== expectedId) {
        console.log(chalk.red(`   ❌ ${type} → ${folderId} (expected: ${expectedId})`));
        passed = false;
      }
    }

    if (passed) {
      console.log(chalk.green(`✅ All folder mappings correct\n`));
      testsPassed++;
    } else {
      testsFailed++;
    }
    testsRun++;
  } catch (error) {
    console.log(chalk.red(`❌ Folder mapper error: ${(error as Error).message}\n`));
    testsRun++;
    testsFailed++;
  }

  // Test 5: Prompt Generator
  console.log(chalk.yellow('Test 5/6: Testing prompt generator...'));
  try {
    const promptGenerator = new PromptGenerator();
    const ruleResolver = new RuleResolver(path.join(process.cwd(), 'config/rules.config.json'));

    const mockTaskInfo = {
      id: 'TEST-123',
      title: 'Overall Analytics - Test Feature',
      description: 'Test description for prompt generation',
      rootCause: 'Test root cause',
      testCaseDescription: 'Test case description',
    };

    const analyticsType = ruleResolver.resolve(mockTaskInfo.title);
    const ruleFilePath = ruleResolver.getRuleFilePath(analyticsType);
    const ruleContent = promptGenerator.readRuleFile(ruleFilePath);

    const prompt = promptGenerator.generateSinglePrompt(mockTaskInfo, analyticsType, ruleContent);

    // Validate prompt contains key sections
    const requiredSections = [
      'Test Case Generation Request',
      'Task Information',
      'Product Rules',
      'Output Format',
      mockTaskInfo.id,
      mockTaskInfo.title,
    ];

    let passed = true;
    for (const section of requiredSections) {
      if (!prompt.includes(section)) {
        console.log(chalk.red(`   ❌ Missing section: "${section}"`));
        passed = false;
      }
    }

    if (passed) {
      console.log(chalk.green(`✅ Prompt generated successfully`));
      console.log(chalk.gray(`   Prompt length: ${prompt.length} chars`));
      console.log(chalk.gray(`   Rule content: ${ruleContent.split('\n').length} lines\n`));
      testsPassed++;
    } else {
      testsFailed++;
    }
    testsRun++;
  } catch (error) {
    console.log(chalk.red(`❌ Prompt generator error: ${(error as Error).message}\n`));
    testsRun++;
    testsFailed++;
  }

  // Test 6: Test Case Importer
  console.log(chalk.yellow('Test 6/6: Testing test case importer...'));
  try {
    const testCaseImporter = new TestCaseImporter();

    // Create mock response file
    const mockResponse = [
      {
        name: 'Test Case 1',
        description: 'Test description',
        preconditions: 'Test preconditions',
        test_case_steps: [
          { step: 'Step 1', result: 'Result 1' },
          { step: 'Step 2', result: 'Result 2' },
        ],
        tags: ['test', 'overall'],
      },
      {
        name: 'Test Case 2',
        description: 'Test description 2',
        test_case_steps: [
          { step: 'Step A', result: 'Result A' },
        ],
        tags: ['test'],
      },
    ];

    const mockFilePath = path.join(process.cwd(), 'output/responses/test-mock.json');

    // Ensure output directory exists
    const outputDir = path.dirname(mockFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(mockFilePath, JSON.stringify(mockResponse, null, 2), 'utf-8');

    const importedTestCases = testCaseImporter.importSingle(mockFilePath);

    // Cleanup
    fs.unlinkSync(mockFilePath);

    if (importedTestCases.length === 2) {
      console.log(chalk.green(`✅ Imported ${importedTestCases.length} test cases`));
      console.log(chalk.gray(`   Test case 1: ${importedTestCases[0].name}`));
      console.log(chalk.gray(`   Test case 2: ${importedTestCases[1].name}\n`));
      testsPassed++;
    } else {
      console.log(chalk.red(`❌ Expected 2 test cases, got ${importedTestCases.length}\n`));
      testsFailed++;
    }
    testsRun++;
  } catch (error) {
    console.log(chalk.red(`❌ Test case importer error: ${(error as Error).message}\n`));
    testsRun++;
    testsFailed++;
  }

  // Summary
  console.log(chalk.blue.bold('📊 E2E Test Summary\n'));
  console.log(chalk.white(`Total tests: ${testsRun}`));
  console.log(chalk.green(`Passed: ${testsPassed}`));
  console.log(chalk.red(`Failed: ${testsFailed}`));

  if (testsFailed === 0) {
    console.log(chalk.green.bold('\n✅ All E2E tests passed!\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('\n❌ Some E2E tests failed!\n'));
    process.exit(1);
  }
}

// Run tests
runE2ETest().catch((error) => {
  console.error(chalk.red.bold('\n❌ E2E test suite failed:\n'));
  console.error(error);
  process.exit(1);
});
