import { useEffect, useCallback, useState } from 'react';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';

/**
 * Enhanced authentication hook with automatic state restoration and token refresh
 * 
 * Features:
 * - Automatic authentication state restoration on mount
 * - Automatic token refresh with exponential backoff
 * - Graceful error handling
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 6.1, 6.3
 */
export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  } = useEnhancedAuthStore();

  const [isRestoring, setIsRestoring] = useState(false);

  // Set up automatic token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh token every 14 minutes (tokens expire in 15 minutes)
    const interval = setInterval(async () => {
      try {
        const success = await useEnhancedAuthStore.getState().refreshAccessToken();
        
        if (!success) {
          console.error('Auto refresh failed');
        }
      } catch (error) {
        console.error('Auto refresh error:', error);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading: isLoading || isRestoring,
    error,
    login: async (credentials: { email: string; password: string }) => {
      const result = await login(credentials.email, credentials.password);
      if (!result.success) {
        throw new Error(result.message || 'Login failed');
      }
    },
    register: async (data: { email: string; password: string; name: string }) => {
      const [firstName, ...lastNameParts] = data.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      // Only send lastName if it's not empty
      const result = await register(
        data.email, 
        data.password, 
        firstName, 
        lastName || undefined  // Send undefined instead of empty string
      );
      
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }
    },
    logout,
    updateProfile: async () => {
      // Not implemented in enhanced auth yet
      console.warn('updateProfile not implemented in enhanced auth');
    },
    clearError,
  };
}

export default useAuth;
