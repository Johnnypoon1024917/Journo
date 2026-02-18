/**
 * React Hook for Authentication Error Handling
 * 
 * Provides a convenient way to handle auth errors in React components
 */

import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { handleAuthError, withAuthErrorHandling } from '../utils/authErrorHandler';

/**
 * Hook that provides auth error handling utilities
 */
export function useAuthErrorHandler() {
  const location = useLocation();
  
  /**
   * Handle an error and redirect to login if it's an auth error
   */
  const handleError = useCallback((error: unknown) => {
    handleAuthError(error, location.pathname);
  }, [location.pathname]);
  
  /**
   * Wrap an async function with automatic auth error handling
   */
  const withErrorHandling = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T
  ): T => {
    return withAuthErrorHandling(fn, location.pathname);
  }, [location.pathname]);
  
  return {
    handleError,
    withErrorHandling,
  };
}
