/**
 * Authentication Error Handler Hook
 * 
 * Provides consistent authentication error handling across components
 * 
 * Requirements: 2.4, 2.5, 6.4, 6.5
 */

import { useState, useCallback } from 'react';
import {
  AuthErrorDetails,
  getAuthErrorDetails,
  handleAuthError,
  isAuthError,
  withAuthErrorHandling,
} from '../services/authErrorHandler';
import { AuthError } from '../services/authenticationStateManager';

export interface UseAuthErrorHandlerReturn {
  error: AuthErrorDetails | null;
  showError: (error: any) => void;
  clearError: () => void;
  handleAuthOperation: <T>(operation: () => Promise<T>) => Promise<T | null>;
  isAuthenticationError: (error: any) => boolean;
}

/**
 * Hook for handling authentication errors with consistent UI feedback
 */
export function useAuthErrorHandler(): UseAuthErrorHandlerReturn {
  const [error, setError] = useState<AuthErrorDetails | null>(null);

  /**
   * Show an authentication error with user-friendly details
   */
  const showError = useCallback((err: any) => {
    // Convert to AuthError format if needed
    const authError: AuthError = {
      type: err.type || 'UNKNOWN',
      message: err.message || 'An authentication error occurred',
      status: err.status,
      originalError: err,
    };

    // Get user-friendly error details
    const errorDetails = getAuthErrorDetails(authError);
    setError(errorDetails);

    // Also handle through the state manager
    handleAuthError(err).catch(console.error);
  }, []);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Wrap an authentication operation with error handling
   */
  const handleAuthOperation = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T | null> => {
      try {
        clearError();
        return await withAuthErrorHandling(operation, showError);
      } catch (err) {
        // Non-auth errors are re-thrown by withAuthErrorHandling
        throw err;
      }
    },
    [showError, clearError]
  );

  /**
   * Check if an error is an authentication error
   */
  const isAuthenticationError = useCallback((err: any): boolean => {
    return isAuthError(err);
  }, []);

  return {
    error,
    showError,
    clearError,
    handleAuthOperation,
    isAuthenticationError,
  };
}

export default useAuthErrorHandler;
