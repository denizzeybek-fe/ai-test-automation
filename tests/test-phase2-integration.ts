import 'dotenv/config';
import path from 'path';
import chalk from 'chalk';
import { BrowserStackService } from '../src/services/browserstack.service.js';
import { RuleResolver } from '../src/resolvers/rule-resolver.js';
import { FolderMapper } from '../src/resolvers/folder-mapper.js';

async function testPhase2Integration(): Promise<void> {
  console.log(chalk.blue('🧪 Phase 2 Integration Test\n'));

  // Get credentials
  const username = process.env.BROWSERSTACK_USERNAME;
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
  const projectId = process.env.BROWSERSTACK_PROJECT_ID;

  if (!username || !accessKey || !projectId) {
    console.log(chalk.red('❌ Missing credentials in .env file'));
    process.exit(1);
  }

  // Initialize services
  const browserstack = new BrowserStackService(username, accessKey, projectId);
  const rulesConfigPath = path.join(process.cwd(), 'config/rules.config.json');
  const foldersConfigPath = path.join(process.cwd(), 'config/folders.config.json');
  const ruleResolver = new RuleResolver(rulesConfigPath);
  const folderMapper = new FolderMapper(foldersConfigPath);

  console.log(chalk.green('✅ Services initialized\n'));

  // Test 1: Fetch folders from BrowserStack and verify IDs
  console.log(chalk.yellow('1️⃣  Testing BrowserStack Folder IDs...\n'));

  try {
    const folders = await browserstack.listFolders();
    console.log(chalk.green(`✅ Fetched ${folders.length} folders from BrowserStack\n`));

    if (folders.length > 0) {
      console.log(chalk.gray('   BrowserStack folders:'));
      folders.forEach((folder) => {
        console.log(chalk.gray(`   - ${folder.name} (ID: ${folder.id})`));
      });
      console.log('');
    }

    // Verify our configured folder IDs exist in BrowserStack
    const configuredMappings = folderMapper.getAllMappings();
    let allFound = true;

    console.log(chalk.yellow('   Verifying configured folder IDs:\n'));

    for (const [type, folderId] of Object.entries(configuredMappings)) {
      const found = folders.find((f) => f.id === folderId);

      if (found) {
        console.log(chalk.green(`   ✅ ${type}: ${folderId} → "${found.name}"`));
      } else {
        console.log(chalk.red(`   ❌ ${type}: ${folderId} → NOT FOUND in BrowserStack`));
        allFound = false;
      }
    }

    console.log('');

    if (!allFound) {
      console.log(chalk.red('⚠️  Some configured folder IDs do not exist in BrowserStack!'));
      console.log(chalk.yellow('   Update config/folders.config.json with correct IDs\n'));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Failed to fetch folders: ${(error as Error).message}\n`));
  }

  // Test 2: Test with real-world task titles
  console.log(chalk.yellow('2️⃣  Testing with Real Task Titles...\n'));

  const realTaskTitles = [
    'PA-34859 - Overall Analytics Dashboard Performance Issue',
    'PA-12345 - Homepage Banner Not Loading',
    'PA-67890 - Onsite Analytics Export Bug',
    'PA-11111 - Usage Analytics Metrics Missing',
    'PA-22222 - Fix Button Color in Settings',
    'VALOREM-123 - Overall-Analytics API Integration',
    'VALOREM-456 - Homepage Redesign Phase 1',
  ];

  realTaskTitles.forEach((title) => {
    const type = ruleResolver.resolve(title);
    const folderId = folderMapper.getFolderId(type);
    const folderName = folderMapper.getFolderName(type);

    console.log(chalk.gray(`   Title: "${title}"`));
    console.log(chalk.green(`   → Type: ${type}, Folder: ${folderName} (${folderId})`));
    console.log('');
  });

  // Test 3: End-to-end flow simulation
  console.log(chalk.yellow('3️⃣  Simulating End-to-End Flow...\n'));

  const mockTaskTitle = 'PA-99999 - Overall Analytics - Homepage Section Bug';

  console.log(chalk.gray(`   Task Title: "${mockTaskTitle}"`));
  console.log('');

  // Step 1: Resolve type
  const resolvedType = ruleResolver.resolve(mockTaskTitle);
  console.log(chalk.green(`   Step 1: Resolve type → ${resolvedType}`));

  // Step 2: Get folder info
  const folderId = folderMapper.getFolderId(resolvedType);
  const folderName = folderMapper.getFolderName(resolvedType);
  console.log(chalk.green(`   Step 2: Get folder → ${folderName} (ID: ${folderId})`));

  // Step 3: Get rule file path
  const ruleFilePath = ruleResolver.getRuleFilePath(resolvedType);
  console.log(chalk.green(`   Step 3: Get rule file → ${ruleFilePath}`));

  console.log('');
  console.log(chalk.green.bold('🎉 Phase 2 Integration Test Complete!\n'));
  console.log(chalk.blue('📊 Next Phase: Jira Service (fetch real task data)'));
}

void testPhase2Integration();
