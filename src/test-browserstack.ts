import 'dotenv/config';
import { BrowserStackService } from './services/browserstack.service.js';
import chalk from 'chalk';

async function testBrowserStackService() {
  console.log(chalk.blue('🧪 Testing BrowserStack API Service\n'));

  // Get credentials from .env
  const username = process.env.BROWSERSTACK_USERNAME;
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
  const projectId = process.env.BROWSERSTACK_PROJECT_ID;

  if (!username || !accessKey || !projectId) {
    console.log(chalk.red('❌ Missing credentials in .env file'));
    console.log(chalk.yellow('Required: BROWSERSTACK_USERNAME, BROWSERSTACK_ACCESS_KEY, BROWSERSTACK_PROJECT_ID'));
    process.exit(1);
  }

  const service = new BrowserStackService(username, accessKey, projectId);

  try {
    // Test 1: List test runs
    console.log(chalk.yellow('1️⃣  Testing listTestRuns()...'));
    const testRuns = await service.listTestRuns();
    console.log(chalk.green(`✅ Success! Found ${testRuns.length} test runs`));

    if (testRuns.length > 0) {
      console.log(chalk.gray(`   Sample: ${testRuns[0].title} (ID: ${testRuns[0].id})`));
    }
    console.log('');

    // Test 2: List folders
    console.log(chalk.yellow('2️⃣  Testing listFolders()...'));
    const folders = await service.listFolders();
    console.log(chalk.green(`✅ Success! Found ${folders.length} folders`));

    if (folders.length > 0) {
      console.log(chalk.gray(`   Sample folders:`));
      folders.slice(0, 5).forEach(folder => {
        console.log(chalk.gray(`   - ${folder.name} (ID: ${folder.id}, Parent: ${folder.parent_id})`));
      });
    }
    console.log('');

    // Test 3: Get specific test run (if available)
    if (testRuns.length > 0) {
      const firstRunId = testRuns[0].id;
      console.log(chalk.yellow(`3️⃣  Testing getTestRun() with ID: ${firstRunId}...`));
      const testRun = await service.getTestRun(firstRunId);
      console.log(chalk.green(`✅ Success! Retrieved test run: ${testRun.title}`));
      console.log('');
    }

    console.log(chalk.green.bold('🎉 All tests passed!\n'));
    console.log(chalk.blue('📊 Summary:'));
    console.log(chalk.gray(`   - Test Runs: ${testRuns.length}`));
    console.log(chalk.gray(`   - Folders: ${folders.length}`));
    console.log(chalk.gray(`   - API Connection: Working ✅`));

  } catch (error) {
    console.log(chalk.red('\n❌ Test failed:'));
    console.log(chalk.red((error as Error).message));
    process.exit(1);
  }
}

testBrowserStackService();
