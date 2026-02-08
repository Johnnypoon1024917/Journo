/**
 * Authentication Error Handler
 * 
 * Provides consistent error handling across all authentication methods
 * with user-friendly error messages and recovery options.
 * 
 * Requirements: 2.4, 2.5, 6.4, 6.5
 */

import { authenticationStateManager, AuthError } from './authenticationStateManager';

export interface AuthErrorDetails {
  title: string;
  message: string;
  recoverable: boolean;
  recoveryAction?: () => void;
  recoveryLabel?: string;
}

/**
 * Map authentication errors to user-friendly error details
 */
export function getAuthErrorDetails(error: AuthError): AuthErrorDetails {
  switch (error.type) {
    case 'TOKEN_EXPIRED':
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again to continue.',
        recoverable: true,
        recoveryAction: () => {
          window.location.href = '/login';
        },
        recoveryLabel: 'Log In',
      };

    case 'REFRESH_FAILED':
      return {
        title: 'Session Refresh Failed',
        message: 'We couldn\'t refresh your session. Please log in again.',
        recoverable: true,
        recoveryAction: () => {
          window.location.href = '/login';
        },
        recoveryLabel: 'Log In',
      };

    case 'UNAUTHORIZED':
      return {
        title: 'Unauthorized',
        message: 'You don\'t have permission to access this resource. Please log in.',
        recoverable: true,
        recoveryAction: () => {
          window.location.href = '/login';
        },
        recoveryLabel: 'Log In',
      };

    case 'NETWORK_ERROR':
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        recoverable: true,
        recoveryAction: () => {
          window.location.reload();
        },
        recoveryLabel: 'Retry',
      };

    case 'UNKNOWN':
    default:
      return {
        title: 'Authentication Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        recoverable: true,
        recoveryAction: () => {
          window.location.reload();
        },
        recoveryLabel: 'Retry',
      };
  }
}

/**
 * Handle authentication errors with consistent UI feedback
 */
export async function handleAuthError(
  error: any,
  showNotification?: (details: AuthErrorDetails) => void
): Promise<void> {
  // Convert to AuthError format
  const authError: AuthError = {
    type: determineErrorType(error),
    message: error.message || 'An authentication error occurred',
    status: error.status,
    originalError: error,
  };

  // Get user-friendly error details
  const errorDetails = getAuthErrorDetails(authError);

  // Show notification if callback provided
  if (showNotification) {
    showNotification(errorDetails);
  }

  // Handle the error through the state manager
  await authenticationStateManager.handleAuthenticationError(authError);
}

/**
 * Determine the error type from various error formats
 */
function determineErrorType(error: any): AuthError['type'] {
  // Check status code
  if (error.status === 401) {
    return 'UNAUTHORIZED';
  }

  // Check error message
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('token') && message.includes('expired')) {
    return 'TOKEN_EXPIRED';
  }
  
  if (message.includes('refresh') && message.includes('failed')) {
    return 'REFRESH_FAILED';
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  // Check if it's a TypeError (usually network errors)
  if (error instanceof TypeError) {
    return 'NETWORK_ERROR';
  }

  return 'UNKNOWN';
}

/**
 * Create a standardized error response for authentication failures
 */
export function createAuthErrorResponse(
  type: AuthError['type'],
  message?: string,
  status?: number
): AuthError {
  return {
    type,
    message: message || getDefaultErrorMessage(type),
    status,
  };
}

/**
 * Get default error message for each error type
 */
function getDefaultErrorMessage(type: AuthError['type']): string {
  switch (type) {
    case 'TOKEN_EXPIRED':
      return 'Your session has expired';
    case 'REFRESH_FAILED':
      return 'Failed to refresh your session';
    case 'UNAUTHORIZED':
      return 'You are not authorized to access this resource';
    case 'NETWORK_ERROR':
      return 'Network connection error';
    case 'UNKNOWN':
    default:
      return 'An authentication error occurred';
  }
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return (
    error?.status === 401 ||
    error?.type === 'TOKEN_EXPIRED' ||
    error?.type === 'REFRESH_FAILED' ||
    error?.type === 'UNAUTHORIZED' ||
    error?.message?.toLowerCase().includes('unauthorized') ||
    error?.message?.toLowerCase().includes('authentication')
  );
}

/**
 * Wrap async authentication operations with error handling
 */
export async function withAuthErrorHandling<T>(
  operation: () => Promise<T>,
  showNotification?: (details: AuthErrorDetails) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    if (isAuthError(error)) {
      await handleAuthError(error, showNotification);
    } else {
      // Re-throw non-auth errors
      throw error;
    }
    return null;
  }
}

/**
 * Create a retry function for failed authentication operations
 */
export function createAuthRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): () => Promise<T> {
  return async () => {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry if it's an authorization error
        if (isAuthError(error) && error.status === 401) {
          throw error;
        }
        
        // Wait before retrying
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }
    
    throw lastError;
  };
}

export default {
  getAuthErrorDetails,
  handleAuthError,
  createAuthErrorResponse,
  isAuthError,
  withAuthErrorHandling,
  createAuthRetry,
};
