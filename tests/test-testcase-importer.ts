import chalk from 'chalk';
import { TestCaseImporter } from '../src/services/testcase-importer.js';

async function testTestCaseImporter(): Promise<void> {
  console.log(chalk.blue('🧪 Testing Test Case Importer\n'));

  const importer = new TestCaseImporter();

  // Test 1: Import single
  console.log(chalk.yellow('1️⃣  Testing importSingle()...\n'));

  try {
    const testCases = importer.importSingle('output/responses/sample-single.json');

    console.log(chalk.green(`✅ Success! Imported ${testCases.length} test cases\n`));

    testCases.forEach((testCase, index) => {
      console.log(chalk.blue(`   Test Case ${index + 1}:`));
      console.log(chalk.gray(`   - Name: ${testCase.name}`));
      console.log(chalk.gray(`   - Steps: ${testCase.test_case_steps.length}`));
      console.log(chalk.gray(`   - Tags: ${testCase.tags?.join(', ') || 'none'}`));
      console.log('');
    });
  } catch (error) {
    console.log(chalk.red(`❌ Failed: ${(error as Error).message}\n`));
    process.exit(1);
  }

  // Test 2: Import batch
  console.log(chalk.yellow('2️⃣  Testing importBatch()...\n'));

  try {
    const batchResults = importer.importBatch('output/responses/sample-batch.json');

    const taskIds = Object.keys(batchResults);
    const totalTestCases = Object.values(batchResults).reduce(
      (sum, cases) => sum + cases.length,
      0
    );

    console.log(chalk.green(`✅ Success! Imported ${totalTestCases} test cases for ${taskIds.length} tasks\n`));

    for (const taskId of taskIds) {
      console.log(chalk.blue(`   Task: ${taskId}`));
      console.log(chalk.gray(`   - Test cases: ${batchResults[taskId].length}`));

      batchResults[taskId].forEach((testCase, index) => {
        console.log(chalk.gray(`     ${index + 1}. ${testCase.name}`));
      });

      console.log('');
    }
  } catch (error) {
    console.log(chalk.red(`❌ Failed: ${(error as Error).message}\n`));
    process.exit(1);
  }

  // Test 3: Invalid JSON (missing required fields)
  console.log(chalk.yellow('3️⃣  Testing validation (invalid JSON)...\n'));

  // Create invalid JSON file
  const fs = await import('fs');
  const invalidJson = JSON.stringify([
    {
      name: 'Test without required fields',
      description: 'Missing test_case_steps and tags',
    },
  ]);

  fs.writeFileSync('output/responses/invalid-test.json', invalidJson, 'utf-8');

  try {
    importer.importSingle('output/responses/invalid-test.json');
    console.log(chalk.red('❌ Should have thrown validation error!\n'));
    process.exit(1);
  } catch (error) {
    console.log(chalk.green(`✅ Validation works! Error caught:\n`));
    console.log(chalk.gray(`   ${(error as Error).message}\n`));
  }

  // Cleanup
  fs.unlinkSync('output/responses/invalid-test.json');

  // Test 4: File not found
  console.log(chalk.yellow('4️⃣  Testing file not found error...\n'));

  try {
    importer.importSingle('output/responses/non-existent-file.json');
    console.log(chalk.red('❌ Should have thrown file not found error!\n'));
    process.exit(1);
  } catch (error) {
    console.log(chalk.green(`✅ Error handling works:\n`));
    console.log(chalk.gray(`   ${(error as Error).message}\n`));
  }

  console.log(chalk.green.bold('🎉 All Tests Passed!\n'));
  console.log(chalk.blue('📊 Summary:'));
  console.log(chalk.gray('   ✅ Single import: Working'));
  console.log(chalk.gray('   ✅ Batch import: Working'));
  console.log(chalk.gray('   ✅ Validation: Working'));
  console.log(chalk.gray('   ✅ Error handling: Working'));
}

void testTestCaseImporter();
