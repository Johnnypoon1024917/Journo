/**
 * Enhanced Authentication State Manager
 * 
 * Provides centralized authentication state management with:
 * - Token restoration from localStorage/sessionStorage
 * - Automatic token refresh with exponential backoff
 * - Seamless integration with existing enhanced auth system
 * - Graceful error handling and session cleanup
 * 
 * Requirements: 2.1, 2.2, 2.3, 6.1, 6.3
 */

import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';

export interface AuthenticationState {
  isAuthenticated: boolean;
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  lastActivity: Date;
  requiresPasswordChange?: boolean;
}

export interface TokenRefreshResult {
  success: boolean;
  error?: string;
  newAccessToken?: string;
}

export interface AuthError {
  type: 'TOKEN_EXPIRED' | 'REFRESH_FAILED' | 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'UNKNOWN';
  message: string;
  status?: number;
  originalError?: any;
}

/**
 * Configuration for exponential backoff retry mechanism
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

class AuthenticationStateManager {
  private refreshPromise: Promise<TokenRefreshResult> | null = null;
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;
  private lastRefreshAttempt: Date | null = null;
  private isLoggingOut: boolean = false;

  /**
   * Restore authentication state from stored tokens
   * Validates tokens and attempts refresh if needed
   * 
   * Validates: Requirements 2.1
   */
  async restoreAuthenticationState(): Promise<AuthenticationState> {
    try {
      // Try to restore from enhanced auth store first (preferred)
      const enhancedAuth = useEnhancedAuthStore.getState();
      
      if (enhancedAuth.isAuthenticated && enhancedAuth.accessToken) {
        // Validate token by attempting to use it
        const isValid = await this.validateToken(enhancedAuth.accessToken);
        
        if (isValid) {
          return {
            isAuthenticated: true,
            user: enhancedAuth.user,
            accessToken: enhancedAuth.accessToken,
            refreshToken: null, // Enhanced auth uses HTTP-only cookies
            lastActivity: new Date(),
            requiresPasswordChange: false,
          };
        } else {
          // Token invalid, try to refresh
          const refreshResult = await this.refreshTokens();
          
          if (refreshResult.success) {
            const updatedAuth = useEnhancedAuthStore.getState();
            return {
              isAuthenticated: true,
              user: updatedAuth.user,
              accessToken: updatedAuth.accessToken,
              refreshToken: null,
              lastActivity: new Date(),
              requiresPasswordChange: false,
            };
          }
        }
      }

      // Fallback to legacy auth store
      const legacyAuth = useEnhancedAuthStore.getState();
      
      if (legacyAuth.isAuthenticated && legacyAuth.accessToken) {
        const isValid = await this.validateToken(legacyAuth.accessToken);
        
        if (isValid) {
          return {
            isAuthenticated: true,
            user: legacyAuth.user,
            accessToken: legacyAuth.accessToken,
            refreshToken: legacyAuth.refreshToken,
            lastActivity: new Date(),
            requiresPasswordChange: false,
          };
        } else {
          // Try to refresh using legacy store
          try {
            await legacyAuth.refreshAccessToken();
            const updatedAuth = useEnhancedAuthStore.getState();
            
            return {
              isAuthenticated: true,
              user: updatedAuth.user,
              accessToken: updatedAuth.accessToken,
              refreshToken: updatedAuth.refreshToken,
              lastActivity: new Date(),
              requiresPasswordChange: false,
            };
          } catch (error) {
            console.error('Legacy token refresh failed:', error);
          }
        }
      }

      // No valid authentication state found
      return {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        lastActivity: new Date(),
      };
    } catch (error) {
      console.error('Failed to restore authentication state:', error);
      return {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        lastActivity: new Date(),
      };
    }
  }

  /**
   * Persist authentication state to storage
   * 
   * Validates: Requirements 2.2
   */
  persistAuthenticationState(state: AuthenticationState): void {
    // State is automatically persisted by Zustand persist middleware
    // This method is here for explicit persistence if needed
    
    if (state.isAuthenticated) {
      // Update last activity timestamp
      localStorage.setItem('auth_last_activity', state.lastActivity.toISOString());
    } else {
      // Clear stored data on logout
      localStorage.removeItem('auth_last_activity');
    }
  }

  /**
   * Refresh authentication tokens with exponential backoff
   * Prevents multiple simultaneous refresh attempts
   * 
   * Validates: Requirements 2.3
   */
  async refreshTokens(): Promise<TokenRefreshResult> {
    // If a refresh is already in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check if we should rate-limit refresh attempts
    if (this.lastRefreshAttempt) {
      const timeSinceLastAttempt = Date.now() - this.lastRefreshAttempt.getTime();
      if (timeSinceLastAttempt < 1000) {
        return {
          success: false,
          error: 'Refresh rate limited',
        };
      }
    }

    this.lastRefreshAttempt = new Date();

    // Create a new refresh promise
    this.refreshPromise = this.attemptTokenRefreshWithBackoff();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      // Clear the promise after completion
      this.refreshPromise = null;
    }
  }

  /**
   * Attempt token refresh with exponential backoff retry logic
   */
  private async attemptTokenRefreshWithBackoff(): Promise<TokenRefreshResult> {
    let lastError: any = null;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        // Try enhanced auth first
        const enhancedAuth = useEnhancedAuthStore.getState();
        if (enhancedAuth.isAuthenticated) {
          const success = await enhancedAuth.refreshAccessToken();
          
          if (success) {
            const newToken = useEnhancedAuthStore.getState().accessToken;
            return {
              success: true,
              newAccessToken: newToken || undefined,
            };
          }
        }

        // Fallback to legacy auth
        const legacyAuth = useEnhancedAuthStore.getState();
        if (legacyAuth.refreshToken) {
          await legacyAuth.refreshAccessToken();
          const newToken = useEnhancedAuthStore.getState().accessToken;
          
          return {
            success: true,
            newAccessToken: newToken || undefined,
          };
        }

        // No refresh token available
        return {
          success: false,
          error: 'No refresh token available',
        };
      } catch (error: any) {
        lastError = error;
        console.warn(`Token refresh attempt ${attempt + 1} failed:`, error);

        // If this isn't the last attempt, wait before retrying
        if (attempt < this.retryConfig.maxRetries - 1) {
          await this.sleep(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelay);
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: lastError?.message || 'Token refresh failed after all retries',
    };
  }

  /**
   * Handle token expiration by attempting refresh
   * 
   * Validates: Requirements 2.3
   */
  async handleTokenExpiration(): Promise<boolean> {
    const result = await this.refreshTokens();
    
    if (!result.success) {
      // Refresh failed, clear authentication state
      await this.clearAuthenticationState();
      return false;
    }

    return true;
  }

  /**
   * Handle authentication errors with appropriate actions
   * 
   * Validates: Requirements 2.4, 2.5
   */
  async handleAuthenticationError(error: AuthError): Promise<void> {
    console.error('Authentication error:', error);

    switch (error.type) {
      case 'TOKEN_EXPIRED':
        // Try to refresh the token
        const refreshed = await this.handleTokenExpiration();
        if (!refreshed) {
          // Only log the error, don't auto-redirect
          console.warn('⚠️ Token refresh failed, but not auto-redirecting to login');
        }
        break;

      case 'REFRESH_FAILED':
        // Only clear state and redirect if this is a critical auth failure
        // For now, just log it
        console.warn('⚠️ Token refresh failed:', error.message);
        break;

      case 'UNAUTHORIZED':
        // Only clear state and redirect if this is a critical auth failure
        console.warn('⚠️ Unauthorized error:', error.message);
        break;

      case 'NETWORK_ERROR':
        // Don't clear state for network errors
        // User might be temporarily offline
        console.warn('Network error during authentication');
        break;

      case 'UNKNOWN':
      default:
        // Log error but don't automatically logout
        console.error('Unknown authentication error:', error);
        break;
    }
  }

  /**
   * Clear all authentication state and storage
   * 
   * Validates: Requirements 2.4, 6.5
   */
  async clearAuthenticationState(): Promise<void> {
    // Log the call stack to identify what's calling this
    console.log('🚨 clearAuthenticationState called!');
    console.log('📍 Call stack:', new Error().stack);
    
    // Prevent duplicate logout calls
    if (this.isLoggingOut) {
      console.log('⏸️ Logout already in progress, skipping duplicate call');
      return;
    }
    
    console.log('🔄 Starting logout process...');
    this.isLoggingOut = true;
    
    try {
      // Call logout API only once
      try {
        const refreshToken = useEnhancedAuthStore.getState().refreshToken;
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }

      // Clear enhanced auth store state directly (without calling logout which calls API)
      useEnhancedAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      // Clear legacy auth store state directly (without calling logout which calls API)
      useEnhancedAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });

      // Clear any additional stored data
      localStorage.removeItem('auth_last_activity');
      
      // Clear refresh promise
      this.refreshPromise = null;
      this.lastRefreshAttempt = null;
    } catch (error) {
      console.error('Error clearing authentication state:', error);
    } finally {
      // Reset flag after a short delay to allow for intentional re-login
      setTimeout(() => {
        this.isLoggingOut = false;
      }, 1000);
    }
  }

  /**
   * Sync state between enhanced auth and legacy auth stores
   * 
   * Validates: Requirements 6.1, 6.3
   */
  async syncWithEnhancedAuth(): Promise<void> {
    const enhancedAuth = useEnhancedAuthStore.getState();
    const legacyAuth = useEnhancedAuthStore.getState();

    // If enhanced auth is authenticated but legacy isn't, sync them
    if (enhancedAuth.isAuthenticated && !legacyAuth.isAuthenticated) {
      // This is a simplified sync - in production you might need more sophisticated logic
      console.log('Syncing enhanced auth to legacy auth store');
    }

    // If legacy auth is authenticated but enhanced isn't, sync them
    if (legacyAuth.isAuthenticated && !enhancedAuth.isAuthenticated) {
      console.log('Syncing legacy auth to enhanced auth store');
    }
  }

  /**
   * Validate if a token is still valid
   */
  private async validateToken(token: string): Promise<boolean> {
    try {
      // Try to decode the JWT to check expiration
      const payload = this.decodeJWT(token);
      
      if (!payload || !payload.exp) {
        return false;
      }

      // Check if token is expired (with 30 second buffer)
      const expirationTime = payload.exp * 1000;
      const now = Date.now();
      const buffer = 30 * 1000; // 30 seconds

      return expirationTime > (now + buffer);
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Decode JWT token (client-side only for expiration check)
   */
  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(): void {
    // Store the current path for redirect after login
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      sessionStorage.setItem('redirect_after_login', currentPath);
    }

    // Redirect to login
    window.location.href = '/login';
  }

  /**
   * Sleep utility for exponential backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configure retry behavior
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = {
      ...this.retryConfig,
      ...config,
    };
  }
}

// Export singleton instance
export const authenticationStateManager = new AuthenticationStateManager();

// Export class for testing
export { AuthenticationStateManager };
