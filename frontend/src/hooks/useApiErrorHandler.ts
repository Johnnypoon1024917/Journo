/**
 * useApiErrorHandler Hook
 * 
 * React hook for handling API errors with toast notifications
 * Provides specific error messages based on API failure types
 * 
 * Validates: Requirements 4.2, 4.3
 */

import { useCallback } from 'react';
import { useToast } from './useToast';
import { networkErrorHandler, NetworkErrorDetails } from '../services/networkErrorHandler';

export interface ApiErrorHandlerOptions {
  showToast?: boolean;
  customMessage?: string;
  onError?: (error: NetworkErrorDetails) => void;
}

export const useApiErrorHandler = () => {
  const toast = useToast();

  /**
   * Handle API errors with automatic classification and user notification
   */
  const handleError = useCallback(
    (error: any, options: ApiErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        customMessage,
        onError,
      } = options;

      // Classify the error
      const errorDetails = networkErrorHandler.classifyError(error);

      // Log error for debugging
      console.error('API Error:', {
        type: errorDetails.type,
        message: errorDetails.message,
        userMessage: errorDetails.userMessage,
        retryable: errorDetails.retryable,
        originalError: error,
      });

      // Show toast notification if enabled
      if (showToast) {
        const message = customMessage || errorDetails.userMessage;
        
        // Use appropriate toast type based on error type
        if (errorDetails.type === 'network' || errorDetails.type === 'timeout') {
          toast.warning(message);
        } else if (errorDetails.type === 'server') {
          toast.error(message);
        } else if (errorDetails.type === 'client') {
          // For client errors, use info or warning depending on retryability
          if (errorDetails.retryable) {
            toast.warning(message);
          } else {
            toast.info(message);
          }
        } else {
          toast.error(message);
        }
      }

      // Call custom error handler if provided
      if (onError) {
        onError(errorDetails);
      }

      return errorDetails;
    },
    [toast]
  );

  /**
   * Wrap an async function with automatic error handling
   */
  const withErrorHandling = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      options: ApiErrorHandlerOptions = {}
    ) => {
      return async (...args: T): Promise<R | null> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error, options);
          return null;
        }
      };
    },
    [handleError]
  );

  /**
   * Check if an error is retryable
   */
  const isRetryable = useCallback((error: any): boolean => {
    const errorDetails = networkErrorHandler.classifyError(error);
    return errorDetails.retryable;
  }, []);

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback((error: any): string => {
    const errorDetails = networkErrorHandler.classifyError(error);
    return errorDetails.userMessage;
  }, []);

  /**
   * Get error suggestions
   */
  const getErrorSuggestions = useCallback((error: any): string[] => {
    const errorDetails = networkErrorHandler.classifyError(error);
    return errorDetails.suggestions;
  }, []);

  return {
    handleError,
    withErrorHandling,
    isRetryable,
    getErrorMessage,
    getErrorSuggestions,
  };
};
