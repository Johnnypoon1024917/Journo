/**
 * Authentication Error Handler
 * 
 * Global handler for authentication errors that automatically redirects
 * users to the login page when authentication fails
 */

import { ApiError } from '../services/api';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';

let isRedirecting = false;

/**
 * Handle authentication errors globally
 * Redirects to login page and clears auth state
 */
export function handleAuthError(error: unknown, currentPath?: string): void {
  // Check if it's an authentication error
  if (error instanceof ApiError && error.status === 401) {
    // Prevent multiple simultaneous redirects
    if (isRedirecting) {
      return;
    }
    
    isRedirecting = true;
    
    console.log('🔐 Authentication error detected, redirecting to login...');
    
    // Clear auth state
    const authStore = useEnhancedAuthStore.getState();
    authStore.logout();
    
    // Store the current path to redirect back after login
    const returnPath = currentPath || window.location.pathname;
    if (returnPath !== '/login' && returnPath !== '/register') {
      sessionStorage.setItem('returnPath', returnPath);
    }
    
    // Redirect to login page
    window.location.href = '/login';
    
    // Reset flag after a delay
    setTimeout(() => {
      isRedirecting = false;
    }, 1000);
  }
}

/**
 * Wrap async functions with automatic auth error handling
 */
export function withAuthErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  currentPath?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleAuthError(error, currentPath);
      throw error; // Re-throw for local error handling
    }
  }) as T;
}

/**
 * Check if user should be redirected back after login
 */
export function getReturnPath(): string | null {
  const returnPath = sessionStorage.getItem('returnPath');
  if (returnPath) {
    sessionStorage.removeItem('returnPath');
    return returnPath;
  }
  return null;
}
