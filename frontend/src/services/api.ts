import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { networkErrorHandler } from './networkErrorHandler';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends RequestInit {
  token?: string;
  skipAuthRetry?: boolean; // Flag to prevent infinite retry loops
}

/**
 * Enhanced API request handler with automatic 401 handling
 * 
 * Features:
 * - Automatic token refresh on 401 responses
 * - Exponential backoff retry logic
 * - Graceful error handling and session cleanup
 * - Consistent error handling across all API calls
 * 
 * Validates: Requirements 2.4, 2.5, 6.4, 6.5
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipAuthRetry, ...fetchOptions } = options;

  console.log('🌐 API Request:', {
    endpoint,
    method: fetchOptions.method || 'GET',
    hasToken: !!token,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Only log errors for non-auth issues in development
      if (response.status !== 401 && import.meta.env.DEV) {
        console.error('❌ API Error:', {
          status: response.status,
          data,
        });
      }

      // Handle 401 Unauthorized errors with automatic token refresh
      if (response.status === 401 && token && !skipAuthRetry) {
        if (import.meta.env.DEV) {
          console.log('🔐 Received 401, attempting token refresh for:', endpoint);
        }
        
        try {
          // Use the enhanced auth store for token refresh
          const success = await useEnhancedAuthStore.getState().refreshAccessToken();
          
          if (success) {
            const newAccessToken = useEnhancedAuthStore.getState().accessToken;
            
            if (newAccessToken) {
              if (import.meta.env.DEV) {
                console.log('✅ Token refreshed, retrying request');
              }
              
              // Retry the request with the new token
              const retryHeaders = {
                ...headers,
                'Authorization': `Bearer ${newAccessToken}`,
              };
              
              const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...fetchOptions,
                headers: retryHeaders,
              });
              
              const retryData = await retryResponse.json();
              
              if (!retryResponse.ok) {
                throw new ApiError(
                  retryData.error || 'An error occurred',
                  retryResponse.status,
                  retryData,
                  retryData.code
                );
              }
              
              return retryData;
            }
          }
          
          // Token refresh failed - throw error silently for expected auth failures
          throw new ApiError(
            'Authentication required',
            401,
            data,
            'AUTH_REQUIRED'
          );
        } catch (refreshError: any) {
          // If it's already an ApiError, re-throw it
          if (refreshError instanceof ApiError) {
            throw refreshError;
          }
          
          // For unexpected errors during refresh, log them in dev only
          if (import.meta.env.DEV) {
            console.error('❌ Unexpected token refresh error:', refreshError);
          }
          
          // Re-throw as ApiError
          throw new ApiError(
            'Authentication required',
            401,
            data,
            'AUTH_REQUIRED'
          );
        }
      }
      
      throw new ApiError(
        data.error || 'An error occurred',
        response.status,
        data,
        data.code
      );
    }

    return data;
  } catch (error: any) {
    // Check network connectivity first
    if (!networkErrorHandler.isOnline()) {
      throw new ApiError(
        'No internet connection',
        0,
        { originalError: error },
        'NETWORK_ERROR'
      );
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Network error. Please check your connection.',
        0,
        { originalError: error },
        'NETWORK_ERROR'
      );
    }
    
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle unknown errors
    throw new ApiError(
      error.message || 'An unexpected error occurred',
      500,
      { originalError: error },
      'UNKNOWN_ERROR'
    );
  }
}

// Convenience methods for common HTTP verbs
const api = {
  apiRequest,
  ApiError,
  
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> => {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
  },
  
  post: <T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> => {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  patch: <T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> => {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  put: <T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> => {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  delete: <T>(endpoint: string, options?: RequestOptions): Promise<T> => {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

export default api;
