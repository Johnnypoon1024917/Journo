/**
 * Centralized auth utilities
 * Provides consistent access to authentication state across all services
 */

import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';

/**
 * Get the current access token from the auth store
 * @returns The access token or null if not authenticated
 */
export const getAuthToken = (): string | null => {
  const state = useEnhancedAuthStore.getState();
  return state.accessToken;
};

/**
 * Check if user is currently authenticated
 * @returns True if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const state = useEnhancedAuthStore.getState();
  return state.isAuthenticated && !!state.accessToken;
};

/**
 * Get the current user from the auth store
 * @returns The current user or null if not authenticated
 */
export const getCurrentUser = () => {
  const state = useEnhancedAuthStore.getState();
  return state.user;
};
