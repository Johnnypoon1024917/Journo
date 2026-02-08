/**
 * Error Handling Utilities
 * Provides retry logic and error classification
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export class RetryableError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(lastError, attempt)) {
        // Calculate delay with exponential backoff
        const delay = exponentialBackoff
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;
        
        // Call retry callback
        onRetry?.(lastError, attempt + 1);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw lastError;
      }
    }
  }
  
  throw lastError!;
}

/**
 * Default retry logic - retry on network errors and 5xx server errors
 */
function defaultShouldRetry(error: Error, _attempt: number): boolean {
  // Don't retry NonRetryableError
  if (error instanceof NonRetryableError) {
    return false;
  }
  
  // Always retry RetryableError
  if (error instanceof RetryableError) {
    return true;
  }
  
  // Check for network errors
  if (isNetworkError(error)) {
    return true;
  }
  
  // Check for server errors (5xx)
  if (isServerError(error)) {
    return true;
  }
  
  // Check for timeout errors
  if (isTimeoutError(error)) {
    return true;
  }
  
  return false;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.message.includes('Failed to fetch') ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError'
  );
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: any): boolean {
  return error.status >= 500 && error.status < 600;
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: Error): boolean {
  return (
    error.message.includes('timeout') ||
    error.message.includes('timed out') ||
    error.name === 'TimeoutError'
  );
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: any): boolean {
  return error.status >= 400 && error.status < 500;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  if (isNetworkError(error)) {
    return 'Network connection lost. Please check your internet connection.';
  }
  
  if (isServerError(error)) {
    return 'Server error occurred. Please try again later.';
  }
  
  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again.';
  }
  
  if (isClientError(error)) {
    return error.message || 'Invalid request. Please check your input.';
  }
  
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Create a retryable error
 */
export function createRetryableError(message: string, originalError?: Error): RetryableError {
  return new RetryableError(message, originalError);
}

/**
 * Create a non-retryable error
 */
export function createNonRetryableError(message: string, originalError?: Error): NonRetryableError {
  return new NonRetryableError(message, originalError);
}
