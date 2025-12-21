import { ErrorCode } from '../types/index.js';

/**
 * Determine error code from error message
 */
export function getErrorCodeFromMessage(errorMessage: string): ErrorCode {
  if (errorMessage.includes('Task not found') || errorMessage.includes('404')) {
    return ErrorCode.TASK_NOT_FOUND;
  }
  if (
    errorMessage.includes('Authentication failed') ||
    errorMessage.includes('401') ||
    errorMessage.includes('403')
  ) {
    return ErrorCode.AUTH_FAILED;
  }
  if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
    return ErrorCode.RATE_LIMIT_EXCEEDED;
  }
  if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
    return ErrorCode.RULE_FILE_NOT_FOUND;
  }
  return ErrorCode.INTERNAL_SERVER_ERROR;
}

/**
 * Get HTTP status code from error code
 */
export function getStatusCodeFromErrorCode(errorCode: ErrorCode): number {
  switch (errorCode) {
    case ErrorCode.TASK_NOT_FOUND:
    case ErrorCode.RULE_FILE_NOT_FOUND:
    case ErrorCode.RESPONSE_FILE_NOT_FOUND:
      return 404;
    case ErrorCode.AUTH_FAILED:
    case ErrorCode.AUTH_UNAUTHORIZED:
      return 401;
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;
    case ErrorCode.INVALID_REQUEST:
    case ErrorCode.INVALID_JSON:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.TASK_INVALID_FORMAT:
      return 400;
    default:
      return 500;
  }
}
