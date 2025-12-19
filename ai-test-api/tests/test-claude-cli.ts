import chalk from 'chalk';
import { claudeCliService } from '../src/services/claude-cli.service.js';

console.log(chalk.blue.bold('\n🧪 Claude CLI Service Tests\n'));

async function testClaudeCliService() {
  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Check if Claude CLI is available
  console.log(chalk.cyan('Test 1/3: Checking Claude CLI availability...'));
  try {
    const isAvailable = await claudeCliService.isAvailable();
    if (isAvailable) {
      console.log(chalk.green('✅ Claude CLI is installed and available'));
      testsPassed++;
    } else {
      console.log(chalk.yellow('⚠️  Claude CLI not found - automatic mode will not work'));
      console.log(chalk.gray('   To install: npm install -g @anthropics/claude-code'));
      console.log(chalk.gray('   Then login: claude login'));
      testsPassed++; // Not a failure, just unavailable
    }
    testsRun++;
  } catch (error) {
    console.log(chalk.red('❌ Failed to check Claude CLI availability'));
    console.log(chalk.red(`   Error: ${(error as Error).message}`));
    testsFailed++;
    testsRun++;
  }

  // Test 2: Get status message
  console.log(chalk.cyan('\nTest 2/3: Getting Claude CLI status message...'));
  try {
    const message = await claudeCliService.getStatusMessage();
    console.log(chalk.green(`✅ Status message: ${message}`));
    testsPassed++;
    testsRun++;
  } catch (error) {
    console.log(chalk.red('❌ Failed to get status message'));
    console.log(chalk.red(`   Error: ${(error as Error).message}`));
    testsFailed++;
    testsRun++;
  }

  // Test 3: Generate test cases (only if CLI is available)
  console.log(chalk.cyan('\nTest 3/3: Testing Claude CLI test case generation...'));
  try {
    const isAvailable = await claudeCliService.isAvailable();

    if (!isAvailable) {
      console.log(chalk.yellow('⏭️  Skipped (Claude CLI not available)'));
      testsRun++;
      return;
    }

    const testPrompt = `Generate test cases for this feature:

Feature: User Login
Description: Users should be able to log in with email and password

Return ONLY a JSON array of test cases in this exact format:
[
  {
    "name": "Test case name",
    "description": "Test case description",
    "preconditions": "Prerequisites",
    "test_case_steps": [
      { "step_number": 1, "action": "Action", "expected_result": "Result" }
    ],
    "tags": ["tag1", "tag2"]
  }
]`;

    console.log(chalk.gray('   Calling Claude CLI (this may take 30-60 seconds)...'));
    const response = await claudeCliService.generateTestCases(testPrompt);

    // Try to parse the response
    const testCases = JSON.parse(response);

    if (Array.isArray(testCases) && testCases.length > 0) {
      console.log(chalk.green(`✅ Successfully generated ${testCases.length} test case(s)`));
      const firstTestCase = testCases[0] as { name?: string };
      console.log(chalk.gray(`   First test case: ${firstTestCase.name || 'Unknown'}`));
      testsPassed++;
    } else {
      console.log(chalk.red('❌ Response is not a valid test case array'));
      testsFailed++;
    }
    testsRun++;
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
      console.log(chalk.yellow('⏭️  Skipped (Claude CLI not available)'));
    } else {
      console.log(chalk.red('❌ Failed to generate test cases'));
      console.log(chalk.red(`   Error: ${errorMessage}`));
      testsFailed++;
    }
    testsRun++;
  }

  // Summary
  console.log(chalk.blue.bold('\n📊 Test Summary\n'));
  console.log(chalk.white(`Total tests: ${testsRun}`));
  console.log(chalk.green(`Passed: ${testsPassed}`));
  if (testsFailed > 0) {
    console.log(chalk.red(`Failed: ${testsFailed}`));
  }

  if (testsFailed === 0) {
    console.log(chalk.green.bold('\n✅ All tests passed!\n'));
  } else {
    console.log(chalk.red.bold('\n❌ Some tests failed\n'));
    process.exit(1);
  }
}

testClaudeCliService();
