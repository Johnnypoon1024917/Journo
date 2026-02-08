import { ErrorInfo, ErrorCreators } from '../components/common/ErrorHandler';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
  retryableErrors: string[]; // Error types that should be retried
}

export interface FallbackConfig {
  enableFallback: boolean;
  fallbackEndpoint?: string;
  fallbackMethod?: () => Promise<any>;
  gracefulDegradation?: boolean;
}

export interface ErrorRecoveryOptions {
  preserveUserData?: boolean;
  showUserFriendlyMessage?: boolean;
  logError?: boolean;
  notifyUser?: boolean;
  fallbackConfig?: FallbackConfig;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private retryConfig: RetryConfig;
  private errorLog: Array<{ timestamp: Date; error: ErrorInfo; context?: any }> = [];

  private constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['network', 'timeout', 'service_unavailable', 'api']
    };
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Execute an operation with automatic retry and error handling
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    options: ErrorRecoveryOptions = {}
  ): Promise<T> {
    let lastError: Error | null = null;
    let retryCount = 0;

    while (retryCount <= this.retryConfig.maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        const errorInfo = this.classifyError(error, context);
        
        // Log the error
        if (options.logError !== false) {
          this.logError(errorInfo, { context, retryCount });
        }

        // Check if error is retryable
        if (!this.isRetryableError(errorInfo) || retryCount >= this.retryConfig.maxRetries) {
          // Try fallback if available
          if (options.fallbackConfig?.enableFallback) {
            try {
              return await this.executeFallback(options.fallbackConfig);
            } catch (fallbackError) {
              // If fallback also fails, throw original error
              throw this.enhanceError(errorInfo, options);
            }
          }
          
          throw this.enhanceError(errorInfo, options);
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
          this.retryConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await this.sleep(jitteredDelay);
        retryCount++;
      }
    }

    throw this.enhanceError(this.classifyError(lastError!, context), options);
  }

  /**
   * Classify an error into our error system
   */
  public classifyError(error: any, context: string): ErrorInfo {
    // Network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return ErrorCreators.network('Unable to connect to our servers. Please check your internet connection.');
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return ErrorCreators.timeout('The request took too long to complete. Please try again.');
    }

    // API errors based on HTTP status codes
    if (error.response) {
      const status = error.response.status;
      
      if (status >= 500) {
        return ErrorCreators.serviceUnavailable(
          'Our servers are experiencing issues. Please try again in a few minutes.'
        );
      }
      
      if (status === 429) {
        return ErrorCreators.api(
          'Too many requests. Please wait a moment before trying again.',
          'RATE_LIMIT'
        );
      }
      
      if (status === 404) {
        return ErrorCreators.api(
          'The requested resource was not found.',
          'NOT_FOUND'
        );
      }
      
      if (status >= 400 && status < 500) {
        return ErrorCreators.validation(
          error.response.data?.message || 'Invalid request. Please check your input.'
        );
      }
    }

    // Service-specific errors
    if (context.includes('location') || context.includes('places')) {
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        return ErrorCreators.serviceUnavailable(
          'Location service is temporarily unavailable. Please try again later.'
        );
      }
    }

    if (context.includes('weather')) {
      return ErrorCreators.api(
        'Weather service is temporarily unavailable. Your trip will be created without weather data.',
        'WEATHER_UNAVAILABLE'
      );
    }

    if (context.includes('route') || context.includes('optimization')) {
      return ErrorCreators.api(
        'Route optimization failed. Places will be arranged in a basic order.',
        'ROUTE_OPTIMIZATION_FAILED'
      );
    }

    // Generic unknown error
    return ErrorCreators.unknown(
      error.message || 'An unexpected error occurred. Please try again.'
    );
  }

  /**
   * Check if an error type is retryable
   */
  private isRetryableError(error: ErrorInfo): boolean {
    return this.retryConfig.retryableErrors.includes(error.type) && 
           error.retryable !== false;
  }

  /**
   * Execute fallback operation
   */
  private async executeFallback<T>(config: FallbackConfig): Promise<T> {
    if (config.fallbackMethod) {
      return await config.fallbackMethod();
    }
    
    if (config.fallbackEndpoint) {
      // Implement basic fetch to fallback endpoint
      const response = await fetch(config.fallbackEndpoint);
      if (!response.ok) {
        throw new Error(`Fallback failed: ${response.statusText}`);
      }
      return await response.json();
    }
    
    throw new Error('No fallback method available');
  }

  /**
   * Enhance error with additional context and user-friendly messages
   */
  private enhanceError(error: ErrorInfo, options: ErrorRecoveryOptions): ErrorInfo {
    const enhanced = { ...error };
    
    if (options.showUserFriendlyMessage !== false) {
      // Add context-specific suggestions
      if (!enhanced.suggestions || enhanced.suggestions.length === 0) {
        enhanced.suggestions = this.getContextualSuggestions(error.type);
      }
    }
    
    return enhanced;
  }

  /**
   * Get contextual suggestions based on error type
   */
  private getContextualSuggestions(errorType: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      network: [
        'Check your internet connection',
        'Try switching to a different network',
        'Disable VPN if you\'re using one',
        'Try again in a few minutes'
      ],
      api: [
        'Our service may be temporarily busy',
        'Try again in a few minutes',
        'Contact support if the problem continues'
      ],
      timeout: [
        'Try with a shorter trip duration',
        'Reduce the number of interests selected',
        'Check your internet connection speed'
      ],
      service_unavailable: [
        'Our servers are experiencing high traffic',
        'Try again in 5-10 minutes',
        'Use basic mode for simpler planning'
      ],
      validation: [
        'Check all required fields are filled',
        'Verify your dates are in the correct format',
        'Make sure end date is after start date'
      ]
    };
    
    return suggestions[errorType] || suggestions.api;
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(error: ErrorInfo, context: any): void {
    const logEntry = {
      timestamp: new Date(),
      error,
      context
    };
    
    this.errorLog.push(logEntry);
    
    // Keep only last 100 errors in memory
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', logEntry);
    }
    
    // In production, you might want to send to an error tracking service
    // this.sendToErrorTracking(logEntry);
  }

  /**
   * Get recent error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByType: { [key: string]: number };
    recentErrors: Array<{ timestamp: Date; type: string; message: string }>;
  } {
    const errorsByType: { [key: string]: number } = {};
    
    this.errorLog.forEach(entry => {
      errorsByType[entry.error.type] = (errorsByType[entry.error.type] || 0) + 1;
    });
    
    const recentErrors = this.errorLog
      .slice(-10)
      .map(entry => ({
        timestamp: entry.timestamp,
        type: entry.error.type,
        message: entry.error.message
      }));
    
    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      recentErrors
    };
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Update retry configuration
   */
  public updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check service health and connectivity
   */
  public async checkServiceHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: { [key: string]: boolean };
    latency: number;
  }> {
    const startTime = Date.now();
    const services: { [key: string]: boolean } = {};
    
    try {
      // Check main API
      const apiResponse = await fetch('/api/health', { 
        method: 'GET',
        timeout: 5000 
      } as any);
      services.api = apiResponse.ok;
      
      // Check other services as needed
      // services.weather = await this.checkWeatherService();
      // services.maps = await this.checkMapsService();
      
      const latency = Date.now() - startTime;
      const healthyServices = Object.values(services).filter(Boolean).length;
      const totalServices = Object.keys(services).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyServices === totalServices) {
        status = 'healthy';
      } else if (healthyServices > 0) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return { status, services, latency };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        services,
        latency: Date.now() - startTime
      };
    }
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();