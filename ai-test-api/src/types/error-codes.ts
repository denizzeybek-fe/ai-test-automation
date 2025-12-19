/**
 * Error codes for API responses
 */
export enum ErrorCode {
  // Task/Jira errors (1xxx)
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  TASK_INVALID_FORMAT = 'TASK_INVALID_FORMAT',

  // Authentication errors (2xxx)
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',

  // Rate limit errors (3xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // File/Resource errors (4xxx)
  RULE_FILE_NOT_FOUND = 'RULE_FILE_NOT_FOUND',
  RESPONSE_FILE_NOT_FOUND = 'RESPONSE_FILE_NOT_FOUND',

  // BrowserStack errors (5xxx)
  BROWSERSTACK_API_ERROR = 'BROWSERSTACK_API_ERROR',
  TEST_CASE_CREATION_FAILED = 'TEST_CASE_CREATION_FAILED',

  // Validation errors (6xxx)
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_JSON = 'INVALID_JSON',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_RESPONSE = 'INVALID_RESPONSE',

  // Claude API errors (7xxx)
  CLAUDE_API_ERROR = 'CLAUDE_API_ERROR',
  CLAUDE_TOKEN_NOT_CONFIGURED = 'CLAUDE_TOKEN_NOT_CONFIGURED',

  // Server errors (9xxx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * User-friendly error messages for each error code
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Task/Jira errors
  [ErrorCode.TASK_NOT_FOUND]: 'Task not found in Jira. Please check the task ID.',
  [ErrorCode.TASK_INVALID_FORMAT]: 'Invalid task ID format. Expected format: PA-12345',

  // Authentication errors
  [ErrorCode.AUTH_FAILED]: 'Authentication failed. Please check Jira credentials.',
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Unauthorized access. Please contact support.',

  // Rate limit errors
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Please try again later.',

  // File/Resource errors
  [ErrorCode.RULE_FILE_NOT_FOUND]: 'Rule file not found. Please contact support.',
  [ErrorCode.RESPONSE_FILE_NOT_FOUND]: 'Response file not found. Please contact support.',

  // BrowserStack errors
  [ErrorCode.BROWSERSTACK_API_ERROR]: 'BrowserStack API error. Please try again.',
  [ErrorCode.TEST_CASE_CREATION_FAILED]: 'Failed to create test cases in BrowserStack.',

  // Validation errors
  [ErrorCode.INVALID_REQUEST]: 'Invalid request. Please check your input.',
  [ErrorCode.INVALID_JSON]: 'Invalid JSON format. Please check your response.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Missing required field. Please check your input.',
  [ErrorCode.INVALID_RESPONSE]: 'Invalid response format from Claude API.',

  // Claude API errors
  [ErrorCode.CLAUDE_API_ERROR]: 'Claude API error. Please try again or check your token.',
  [ErrorCode.CLAUDE_TOKEN_NOT_CONFIGURED]: 'Claude token not configured. Please add CLAUDE_TOKEN to .env or use manual mode.',

  // Server errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Server error occurred. Please try again or contact support.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please contact support.',
};

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: string;
  errorCode: ErrorCode;
  details?: string;
}
