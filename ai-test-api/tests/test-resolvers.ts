import path from 'path';
import chalk from 'chalk';
import { RuleResolver } from '../src/resolvers/rule-resolver.js';
import { FolderMapper } from '../src/resolvers/folder-mapper.js';
import { AnalyticsType } from '../src/types/index.js';

function testResolvers(): void {
  console.log(chalk.blue('🧪 Testing Rule Resolver & Folder Mapper\n'));

  // Initialize services
  const rulesConfigPath = path.join(process.cwd(), 'config/rules.config.json');
  const foldersConfigPath = path.join(process.cwd(), 'config/folders.config.json');

  const ruleResolver = new RuleResolver(rulesConfigPath);
  const folderMapper = new FolderMapper(foldersConfigPath);

  console.log(chalk.green('✅ Services initialized\n'));

  // Test cases
  const testCases = [
    {
      title: 'Overall Analytics Dashboard Bug',
      expected: AnalyticsType.Overall,
    },
    {
      title: 'Fix HomePage Banner Issue',
      expected: AnalyticsType.Homepage,
    },
    {
      title: 'Onsite-Analytics Performance',
      expected: AnalyticsType.Onsite,
    },
    {
      title: 'Usage Analytics Export',
      expected: AnalyticsType.Usage,
    },
    {
      title: 'Random Task Without Keywords',
      expected: AnalyticsType.Overall, // default
    },
    {
      title: 'OVERALL-ANALYTICS-METRICS',
      expected: AnalyticsType.Overall, // case-insensitive
    },
    {
      title: 'homepage redesign',
      expected: AnalyticsType.Homepage, // lowercase
    },
    {
      title: 'Homepage Analytics - Overall Performance',
      expected: AnalyticsType.Homepage, // homepage appears first
    },
    {
      title: 'Overall Analytics - Homepage Metrics',
      expected: AnalyticsType.Overall, // overall appears first
    },
    {
      title: 'Fix Usage in Onsite Analytics',
      expected: AnalyticsType.Usage, // usage appears first (position 4)
    },
  ];

  console.log(chalk.yellow('1️⃣  Testing RuleResolver.resolve()...\n'));

  let passedTests = 0;
  let failedTests = 0;

  testCases.forEach((testCase, index) => {
    const result = ruleResolver.resolve(testCase.title);
    const passed = result === testCase.expected;

    if (passed) {
      passedTests++;
      console.log(
        chalk.green(`   ✅ Test ${index + 1}: "${testCase.title}"`)
      );
      console.log(chalk.gray(`      Result: ${result} (expected: ${testCase.expected})`));
    } else {
      failedTests++;
      console.log(
        chalk.red(`   ❌ Test ${index + 1}: "${testCase.title}"`)
      );
      console.log(
        chalk.red(`      Result: ${result}, Expected: ${testCase.expected}`)
      );
    }
  });

  console.log('');

  // Test FolderMapper
  console.log(chalk.yellow('2️⃣  Testing FolderMapper...\n'));

  const types = ruleResolver.getTypes();

  types.forEach((type) => {
    const folderId = folderMapper.getFolderId(type);
    const folderName = folderMapper.getFolderName(type);

    console.log(chalk.green(`   ✅ ${type}:`));
    console.log(chalk.gray(`      Folder ID: ${folderId}`));
    console.log(chalk.gray(`      Folder Name: ${folderName}`));
  });

  console.log('');

  // Test getRuleFilePath
  console.log(chalk.yellow('3️⃣  Testing getRuleFilePath()...\n'));

  types.forEach((type) => {
    const rulePath = ruleResolver.getRuleFilePath(type);
    console.log(chalk.green(`   ✅ ${type}:`));
    console.log(chalk.gray(`      ${rulePath}`));
  });

  console.log('');

  // Summary
  if (failedTests === 0) {
    console.log(chalk.green.bold('🎉 All tests passed!\n'));
  } else {
    console.log(chalk.red.bold(`❌ ${failedTests} test(s) failed!\n`));
  }

  console.log(chalk.blue('📊 Summary:'));
  console.log(chalk.gray(`   - Tests passed: ${passedTests}/${testCases.length}`));
  console.log(chalk.gray(`   - Tests failed: ${failedTests}/${testCases.length}`));
  console.log(chalk.gray(`   - Analytics types: ${types.length}`));
  console.log(chalk.gray(`   - Default type: ${ruleResolver.getDefaultType()}`));

  process.exit(failedTests > 0 ? 1 : 0);
}

testResolvers();
