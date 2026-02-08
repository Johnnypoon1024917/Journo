import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { handleAuthError } from '../services/authErrorHandler';
import { logAllCookies } from '../utils/cookieDebug';

export interface User {
  id: string; // UUID as string
  email: string;
  firstName?: string;
  lastName?: string;
  role: string; // User role (user, admin, moderator)
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null; // Store in memory
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; requiresTwoFactor?: boolean }>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>; // Renamed to avoid conflict with refreshToken property
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  resendEmailVerification: (email: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  getSecurityEvents: () => Promise<any[]>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useEnhancedAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null, // Store in memory
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🔐 Login attempt:', { email, rememberMe });
          
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, rememberMe }),
          });

          const data = await response.json();
          console.log('📥 Login response:', { 
            success: data.success, 
            hasUser: !!data.user, 
            hasAccessToken: !!data.accessToken,
            hasRefreshToken: !!data.refreshToken 
          });

          // Check cookies after login - CRITICAL DEBUG
          console.log('🍪 === COOKIE CHECK AFTER LOGIN ===');
          const cookieCheck = logAllCookies();
          console.log('🍪 === END COOKIE CHECK ===');

          if (data.success) {
            console.log('✅ Setting auth state with access token:', data.accessToken.substring(0, 20) + '...');
            console.log('✅ Storing refresh token in memory:', data.refreshToken ? data.refreshToken.substring(0, 20) + '...' : 'none');
            
            set({
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken, // Store in memory
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            // Verify state was set
            const currentState = get();
            console.log('✅ Auth state after login:', {
              isAuthenticated: currentState.isAuthenticated,
              hasAccessToken: !!currentState.accessToken,
              hasRefreshToken: !!currentState.refreshToken,
              accessTokenPreview: currentState.accessToken?.substring(0, 20) + '...'
            });
            
            // Load user's theme preference after successful login (not on token refresh)
            try {
              const { useCentralizedThemeStore } = await import('./centralizedThemeStore');
              const { loadUserTheme } = useCentralizedThemeStore.getState();
              await loadUserTheme();
            } catch (error) {
              console.warn('Failed to load user theme after login:', error);
            }
            
            return { success: true };
          } else {
            set({ isLoading: false, error: data.message });
            return { 
              success: false, 
              message: data.message,
              requiresTwoFactor: data.requiresTwoFactor 
            };
          }
        } catch (error) {
          console.error('❌ Login error:', error);
          const errorMessage = 'Login failed. Please try again.';
          set({ isLoading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      register: async (email: string, password: string, firstName?: string, lastName?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const requestBody = { email, password, firstName, lastName };
          console.log('📤 Registration request:', { email, firstName, lastName, passwordLength: password.length });
          
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          console.log('📥 Registration response:', { status: response.status, data });
          set({ isLoading: false });

          if (data.success) {
            return { success: true, message: data.message };
          } else {
            // Handle validation errors with detailed messages
            let errorMessage = data.message;
            if (data.errors && Array.isArray(data.errors)) {
              console.log('❌ Validation errors:', data.errors);
              errorMessage = data.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
            }
            set({ error: errorMessage });
            return { success: false, message: errorMessage };
          }
        } catch (error) {
          console.error('❌ Registration error:', error);
          const errorMessage = 'Registration failed. Please try again.';
          set({ isLoading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      logout: async () => {
        console.log('🚨 enhancedAuthStore.logout called!');
        console.log('📍 Call stack:', new Error().stack);
        set({ isLoading: true });
        
        try {
          const refreshToken = get().refreshToken;
          
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });
        } catch (error) {
          console.error('Logout error:', error);
        }

        // Clear state regardless of API call success
        set({
          user: null,
          accessToken: null,
          refreshToken: null, // Clear refresh token
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        
        // Also clear localStorage to ensure clean state
        try {
          localStorage.removeItem('enhanced-auth-storage');
        } catch (e) {
          console.error('Failed to clear localStorage:', e);
        }
      },

      refreshAccessToken: async () => {
        try {
          console.log('🔄 Attempting token refresh...');
          
          const currentRefreshToken = get().refreshToken;
          if (!currentRefreshToken) {
            console.log('❌ No refresh token available');
            return false;
          }
          
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });

          const data = await response.json();

          if (data.success && data.accessToken) {
            console.log('✅ Token refresh successful');
            set({ 
              accessToken: data.accessToken,
              refreshToken: data.refreshToken // Update refresh token too
            });
            return true;
          } else {
            // Token refresh failed - this is expected when session expires
            // Don't log as error, just debug info
            if (import.meta.env.DEV) {
              console.debug('Token refresh failed:', data.message || 'No access token in response');
            }
            return false;
          }
        } catch (error) {
          // Network or unexpected errors
          if (import.meta.env.DEV) {
            console.debug('Token refresh error:', error);
          }
          return false;
        }
      },

      requestPasswordReset: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();
          set({ isLoading: false });

          return { success: data.success, message: data.message };
        } catch (error) {
          const errorMessage = 'Password reset request failed. Please try again.';
          set({ isLoading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      resetPassword: async (token: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
          });

          const data = await response.json();
          set({ isLoading: false });

          return { success: data.success, message: data.message };
        } catch (error) {
          const errorMessage = 'Password reset failed. Please try again.';
          set({ isLoading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          const data = await response.json();
          set({ isLoading: false });

          return { success: data.success, message: data.message };
        } catch (error) {
          const errorMessage = 'Email verification failed. Please try again.';
          set({ isLoading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      resendEmailVerification: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();
          set({ isLoading: false });

          return { success: data.success, message: data.message };
        } catch (error) {
          const errorMessage = 'Failed to resend verification email. Please try again.';
          set({ isLoading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const { accessToken } = get();
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          });

          const data = await response.json();
          set({ isLoading: false });

          return { success: data.success, message: data.message };
        } catch (error) {
          const errorMessage = 'Password change failed. Please try again.';
          set({ isLoading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      getSecurityEvents: async () => {
        const { accessToken } = get();
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/security-events`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          const data = await response.json();

          if (data.success) {
            return data.events;
          } else {
            return [];
          }
        } catch (error) {
          console.error('Failed to get security events:', error);
          return [];
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'enhanced-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auto-refresh token setup
let refreshInterval: NodeJS.Timeout | null = null;

export const setupTokenRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  refreshInterval = setInterval(async () => {
    const { isAuthenticated, refreshToken } = useEnhancedAuthStore.getState();
    
    if (isAuthenticated) {
      const success = await refreshToken();
      if (!success) {
        console.log('Token refresh failed, user logged out');
      }
    }
  }, 14 * 60 * 1000); // Refresh every 14 minutes (tokens expire in 15 minutes)
};

// Initialize token refresh on store creation
if (typeof window !== 'undefined') {
  setupTokenRefresh();
  // Expose store to window for debugging
  (window as any).useEnhancedAuthStore = useEnhancedAuthStore;
}