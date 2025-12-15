// Base types
export interface TaskInfo {
  id: string;
  title: string;
  description: string;
  rootCause?: string;
  testCaseDescription?: string;
  figmaUrl?: string;
  confluenceUrl?: string;
}

export type AnalyticsType = 'overall' | 'homepage' | 'onsite' | 'usage';

export interface TestCase {
  name: string;
  description: string;
  preconditions?: string;
  test_case_steps: Array<{
    step: string;
    result: string;
  }>;
  tags?: string[];
}

export interface BrowserStackTestCase {
  identifier: string;
  title: string;
  folder_id: number;
}

export interface BrowserStackTestRun {
  id: string;
  title: string;
  description: string;
  run_state: string;
}

export interface Config {
  browserstack: {
    username: string;
    accessKey: string;
    projectId: string;
  };
  jira: {
    baseUrl: string;
    email: string;
    apiToken: string;
  };
  ai: {
    apiKey: string;
  };
}

export interface FolderConfig {
  folderMapping: Record<AnalyticsType, number>;
  folderNames: Record<AnalyticsType, string>;
}

export interface RuleConfig {
  keywordPatterns: Record<AnalyticsType, string[]>;
  priorityOrder: AnalyticsType[];
  defaultType: AnalyticsType;
  ruleFiles: Record<AnalyticsType, string>;
}
