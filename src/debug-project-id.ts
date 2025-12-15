import 'dotenv/config';
import axios, { AxiosError } from 'axios';
import chalk from 'chalk';

async function debugProjectId(): Promise<void> {
  console.log(chalk.blue('🔍 Debugging BrowserStack Project ID\n'));

  const username = process.env.BROWSERSTACK_USERNAME!;
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY!;

  // Test both project ID formats
  const projectIds = ['265152', 'PR-8'];

  for (const projectId of projectIds) {
    console.log(chalk.yellow(`Testing with project ID: ${projectId}\n`));

    try {
      const response = await axios.get(
        `https://test-management.browserstack.com/api/v2/projects/${projectId}/folders`,
        {
          auth: { username, password: accessKey },
          timeout: 10000,
        }
      );

      console.log(chalk.green(`✅ SUCCESS with project ID: ${projectId}`));
      console.log(chalk.gray(`Response data:`));
      console.log(JSON.stringify(response.data, null, 2));
      console.log('\n');
    } catch (error) {
      const axiosError = error as AxiosError;
      console.log(chalk.red(`❌ FAILED with project ID: ${projectId}`));
      console.log(chalk.red(`Error: ${axiosError.response?.status} - ${axiosError.response?.statusText || axiosError.message}`));
      console.log('\n');
    }
  }
}

void debugProjectId();
