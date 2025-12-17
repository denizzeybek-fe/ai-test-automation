import 'dotenv/config';
import chalk from 'chalk';
import { BrowserStackService } from './services/browserstack.service.js';

async function listAllFolders(): Promise<void> {
  console.log(chalk.blue('📂 BrowserStack Folders List\n'));

  const username = process.env.BROWSERSTACK_USERNAME;
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
  const projectId = process.env.BROWSERSTACK_PROJECT_ID;

  if (!username || !accessKey || !projectId) {
    console.log(chalk.red('❌ Missing credentials'));
    process.exit(1);
  }

  const service = new BrowserStackService(username, accessKey, projectId);

  try {
    const folders = await service.listFolders();

    if (folders.length === 0) {
      console.log(chalk.yellow('⚠️  No folders found in BrowserStack project'));
      console.log(chalk.gray('\nYou need to create folders first:'));
      console.log(chalk.gray('1. Go to: https://test-management.browserstack.com/'));
      console.log(chalk.gray(`2. Open project: ${projectId}`));
      console.log(chalk.gray('3. Create folders: Overall Analytics AI Cases, Homepage AI Cases, etc.'));
      console.log(chalk.gray('4. Then run this script again to get folder IDs\n'));
      process.exit(0);
    }

    console.log(chalk.green(`✅ Found ${folders.length} folders:\n`));

    // Group by parent_id for better visualization
    const rootFolders = folders.filter((f) => f.parent_id === null || f.parent_id === 0);
    const childFolders = folders.filter((f) => f.parent_id !== null && f.parent_id !== 0);

    if (rootFolders.length > 0) {
      console.log(chalk.yellow('📁 Root Folders:\n'));
      rootFolders.forEach((folder) => {
        console.log(chalk.blue(`   ${folder.name}`));
        console.log(chalk.gray(`      ID: ${folder.id}`));
        console.log(chalk.gray(`      Parent: None (root)`));
        console.log('');
      });
    }

    if (childFolders.length > 0) {
      console.log(chalk.yellow('📁 Subfolders:\n'));
      childFolders.forEach((folder) => {
        console.log(chalk.blue(`   ${folder.name}`));
        console.log(chalk.gray(`      ID: ${folder.id}`));
        console.log(chalk.gray(`      Parent ID: ${folder.parent_id}`));
        console.log('');
      });
    }

    // Generate config suggestion
    console.log(chalk.yellow('💡 Suggested config for folders.config.json:\n'));
    console.log(chalk.gray('{'));
    console.log(chalk.gray('  "folderMapping": {'));

    const suggestions: Record<string, string> = {
      overall: 'Overall Analytics AI Cases',
      homepage: 'Homepage AI Cases',
      onsite: 'Onsite Analytics AI Cases',
      usage: 'Usage Analytics AI Cases',
    };

    Object.entries(suggestions).forEach(([type, searchName]) => {
      const found = folders.find((f) =>
        f.name.toLowerCase().includes(searchName.toLowerCase()) ||
        f.name.toLowerCase().includes(type)
      );

      if (found) {
        console.log(chalk.green(`    "${type}": ${found.id},  // ${found.name}`));
      } else {
        console.log(chalk.red(`    "${type}": ?????,  // Not found - create folder: "${searchName}"`));
      }
    });

    console.log(chalk.gray('  }'));
    console.log(chalk.gray('}\n'));

  } catch (error) {
    console.log(chalk.red(`❌ Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

void listAllFolders();
