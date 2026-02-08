/**
 * Network and API Error Handler
 * 
 * Provides comprehensive network connectivity detection and API error handling
 * with specific error messages based on failure types.
 * 
 * Validates: Requirements 4.2, 4.3
 */

import { ApiErrorCode } from '../types/api';

export type NetworkStatus = 'online' | 'offline' | 'slow';

export interface NetworkErrorDetails {
  type: 'network' | 'api' | 'timeout' | 'server' | 'client' | 'unknown';
  status?: number;
  code?: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestions: string[];
}

export interface NetworkState {
  isOnline: boolean;
  status: NetworkStatus;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  lastChecked: Date;
}

class NetworkErrorHandler {
  private static instance: NetworkErrorHandler;
  private networkState: NetworkState;
  private listeners: Set<(state: NetworkState) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.networkState = {
      isOnline: navigator.onLine,
      status: navigator.onLine ? 'online' : 'offline',
      lastChecked: new Date(),
    };

    this.initializeNetworkMonitoring();
  }

  public static getInstance(): NetworkErrorHandler {
    if (!NetworkErrorHandler.instance) {
      NetworkErrorHandler.instance = new NetworkErrorHandler();
    }
    return NetworkErrorHandler.instance;
  }

  /**
   * Initialize network monitoring with online/offline events and connection quality detection
   * Validates: Requirements 4.3
   */
  private initializeNetworkMonitoring(): void {
    // Listen to online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Monitor connection quality if Network Information API is available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', this.handleConnectionChange);
        this.updateConnectionInfo();
      }
    }

    // Periodic connectivity check (every 30 seconds when online)
    this.startPeriodicCheck();
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('Network: Online');
    this.updateNetworkState({
      isOnline: true,
      status: 'online',
      lastChecked: new Date(),
    });
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('Network: Offline');
    this.updateNetworkState({
      isOnline: false,
      status: 'offline',
      lastChecked: new Date(),
    });
  };

  /**
   * Handle connection quality changes
   */
  private handleConnectionChange = (): void => {
    this.updateConnectionInfo();
  };

  /**
   * Update connection information from Network Information API
   */
  private updateConnectionInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;
        const rtt = connection.rtt;

        // Determine network status based on connection quality
        let status: NetworkStatus = 'online';
        if (!navigator.onLine) {
          status = 'offline';
        } else if (effectiveType === 'slow-2g' || effectiveType === '2g' || rtt > 1000) {
          status = 'slow';
        }

        this.updateNetworkState({
          isOnline: navigator.onLine,
          status,
          effectiveType,
          downlink,
          rtt,
          lastChecked: new Date(),
        });
      }
    }
  }

  /**
   * Start periodic connectivity check
   */
  private startPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      if (navigator.onLine) {
        this.performConnectivityCheck();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform actual connectivity check by making a lightweight request
   */
  private async performConnectivityCheck(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        if (this.networkState.status === 'offline') {
          this.handleOnline();
        }
      }
    } catch (error) {
      // If check fails but browser says we're online, mark as slow
      if (navigator.onLine && this.networkState.status === 'online') {
        this.updateNetworkState({
          ...this.networkState,
          status: 'slow',
          lastChecked: new Date(),
        });
      }
    }
  }

  /**
   * Update network state and notify listeners
   */
  private updateNetworkState(newState: Partial<NetworkState>): void {
    const oldState = this.networkState;
    this.networkState = { ...this.networkState, ...newState };

    // Notify listeners if state changed
    if (
      oldState.isOnline !== this.networkState.isOnline ||
      oldState.status !== this.networkState.status
    ) {
      this.notifyListeners();
    }
  }

  /**
   * Notify all listeners of network state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.networkState);
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });
  }

  /**
   * Subscribe to network state changes
   */
  public subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.networkState);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current network state
   */
  public getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    return this.networkState.isOnline;
  }

  /**
   * Classify and enhance API errors with user-friendly messages
   * Validates: Requirements 4.2
   */
  public classifyError(error: any): NetworkErrorDetails {
    // Network connectivity errors
    if (!navigator.onLine || this.networkState.status === 'offline') {
      return {
        type: 'network',
        message: 'No internet connection',
        userMessage: 'You appear to be offline. Please check your internet connection.',
        retryable: true,
        suggestions: [
          'Check your WiFi or mobile data connection',
          'Try moving to an area with better signal',
          'Restart your router if using WiFi',
        ],
      };
    }

    // Timeout errors
    if (
      error.name === 'AbortError' ||
      error.message?.includes('timeout') ||
      error.message?.includes('timed out')
    ) {
      return {
        type: 'timeout',
        message: 'Request timed out',
        userMessage: 'The request took too long to complete. Please try again.',
        retryable: true,
        suggestions: [
          'Check your internet connection speed',
          'Try again in a moment',
          'Contact support if this persists',
        ],
      };
    }

    // Network fetch errors
    if (
      error.name === 'TypeError' &&
      (error.message?.includes('fetch') || error.message?.includes('network'))
    ) {
      return {
        type: 'network',
        message: 'Network request failed',
        userMessage: 'Unable to connect to the server. Please check your connection.',
        retryable: true,
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the problem continues',
        ],
      };
    }

    // API errors with status codes
    if (error.status) {
      return this.classifyHttpError(error);
    }

    // API errors with error codes
    if (error.code) {
      return this.classifyApiErrorCode(error);
    }

    // Unknown errors
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred',
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
      suggestions: [
        'Try refreshing the page',
        'Clear your browser cache',
        'Contact support if the issue persists',
      ],
    };
  }

  /**
   * Classify HTTP status code errors
   */
  private classifyHttpError(error: any): NetworkErrorDetails {
    const status = error.status;

    // 400-499: Client errors
    if (status >= 400 && status < 500) {
      switch (status) {
        case 400:
          return {
            type: 'client',
            status,
            message: 'Bad request',
            userMessage: 'Invalid request. Please check your input and try again.',
            retryable: false,
            suggestions: ['Verify all required fields are filled correctly'],
          };

        case 401:
          return {
            type: 'client',
            status,
            message: 'Unauthorized',
            userMessage: 'Your session has expired. Please log in again.',
            retryable: false,
            suggestions: ['Log in again to continue'],
          };

        case 403:
          return {
            type: 'client',
            status,
            message: 'Forbidden',
            userMessage: "You don't have permission to perform this action.",
            retryable: false,
            suggestions: ['Contact an administrator if you need access'],
          };

        case 404:
          return {
            type: 'client',
            status,
            message: 'Not found',
            userMessage: 'The requested resource was not found.',
            retryable: false,
            suggestions: ['Check the URL and try again', 'Go back to the home page'],
          };

        case 409:
          return {
            type: 'client',
            status,
            message: 'Conflict',
            userMessage: 'This action conflicts with existing data.',
            retryable: false,
            suggestions: ['Refresh the page and try again'],
          };

        case 422:
          return {
            type: 'client',
            status,
            message: 'Validation error',
            userMessage: 'Please check your input and correct any errors.',
            retryable: false,
            suggestions: ['Review the highlighted fields and fix any errors'],
          };

        case 429:
          return {
            type: 'client',
            status,
            message: 'Too many requests',
            userMessage: 'Too many requests. Please wait a moment and try again.',
            retryable: true,
            suggestions: ['Wait a few minutes before trying again'],
          };

        default:
          return {
            type: 'client',
            status,
            message: error.message || 'Client error',
            userMessage: 'There was a problem with your request. Please try again.',
            retryable: false,
            suggestions: ['Check your input and try again'],
          };
      }
    }

    // 500-599: Server errors
    if (status >= 500 && status < 600) {
      return {
        type: 'server',
        status,
        message: 'Server error',
        userMessage: 'Our servers are experiencing issues. Please try again later.',
        retryable: true,
        suggestions: [
          'Try again in a few minutes',
          'Contact support if the problem persists',
        ],
      };
    }

    // Other status codes
    return {
      type: 'unknown',
      status,
      message: error.message || 'Unknown error',
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: true,
      suggestions: ['Try again', 'Contact support if the issue continues'],
    };
  }

  /**
   * Classify API error codes
   */
  private classifyApiErrorCode(error: any): NetworkErrorDetails {
    const code = error.code;

    switch (code) {
      case ApiErrorCode.NETWORK_ERROR:
        return {
          type: 'network',
          code,
          message: 'Network error',
          userMessage: 'Network connection lost. Please check your internet.',
          retryable: true,
          suggestions: ['Check your internet connection', 'Try again in a moment'],
        };

      case ApiErrorCode.TIMEOUT:
        return {
          type: 'timeout',
          code,
          message: 'Request timeout',
          userMessage: 'The request took too long. Please try again.',
          retryable: true,
          suggestions: ['Check your connection speed', 'Try again'],
        };

      case ApiErrorCode.OFFLINE:
        return {
          type: 'network',
          code,
          message: 'Offline',
          userMessage: 'You are currently offline. Some features may be unavailable.',
          retryable: true,
          suggestions: ['Connect to the internet to access all features'],
        };

      case ApiErrorCode.RATE_LIMIT_EXCEEDED:
        return {
          type: 'client',
          code,
          message: 'Rate limit exceeded',
          userMessage: 'Too many requests. Please wait before trying again.',
          retryable: true,
          suggestions: ['Wait a few minutes before trying again'],
        };

      case ApiErrorCode.EXTERNAL_API_ERROR:
      case ApiErrorCode.GOOGLE_MAPS_ERROR:
      case ApiErrorCode.WEATHER_API_ERROR:
      case ApiErrorCode.CURRENCY_API_ERROR:
        return {
          type: 'api',
          code,
          message: 'External service error',
          userMessage: 'An external service is temporarily unavailable.',
          retryable: true,
          suggestions: ['Try again in a few minutes', 'Some features may be limited'],
        };

      case ApiErrorCode.INTERNAL_SERVER_ERROR:
      case ApiErrorCode.DATABASE_ERROR:
      case ApiErrorCode.STORAGE_ERROR:
        return {
          type: 'server',
          code,
          message: 'Server error',
          userMessage: 'Our servers are experiencing issues. Please try again later.',
          retryable: true,
          suggestions: ['Try again in a few minutes', 'Contact support if this persists'],
        };

      default:
        return {
          type: 'unknown',
          code,
          message: error.message || 'Unknown error',
          userMessage: 'An unexpected error occurred. Please try again.',
          retryable: true,
          suggestions: ['Try again', 'Contact support if needed'],
        };
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.removeEventListener('change', this.handleConnectionChange);
      }
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.listeners.clear();
  }
}

// Export singleton instance
export const networkErrorHandler = NetworkErrorHandler.getInstance();
