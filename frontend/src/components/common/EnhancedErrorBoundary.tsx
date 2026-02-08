import React, { Component, ErrorInfo as ReactErrorInfo, ReactNode } from 'react';
import { ErrorHandler, ErrorCreators, ErrorInfo } from './ErrorHandler';
import { errorHandlingService } from '../../services/errorHandlingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ReactErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    // Log the error
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Classify the error using our error handling service
    const classifiedError = errorHandlingService.classifyError(error, 'error-boundary');
    
    this.setState({
      errorInfo: classifiedError
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo, classifiedError);
    }
  }

  /**
   * Sanitize error data to remove sensitive information
   * Validates: Requirements 4.5 - Secure error logging without sensitive data exposure
   */
  private sanitizeErrorData = (data: any): any => {
    if (!data) return data;
    
    // List of sensitive keys to redact
    const sensitiveKeys = [
      'password', 'token', 'apiKey', 'secret', 'authorization',
      'cookie', 'session', 'creditCard', 'ssn', 'email', 'phone',
      'accessToken', 'refreshToken', 'privateKey', 'apiSecret'
    ];
    
    // If it's a string, check for patterns that might contain sensitive data
    if (typeof data === 'string') {
      // Redact JWT tokens
      data = data.replace(/eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[REDACTED_JWT]');
      // Redact email addresses
      data = data.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
      // Redact phone numbers
      data = data.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
      return data;
    }
    
    // If it's an object, recursively sanitize
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};
      
      for (const key in data) {
        // Check if key is sensitive
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some(sensitiveKey => 
          lowerKey.includes(sensitiveKey.toLowerCase())
        );
        
        if (isSensitive) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeErrorData(data[key]);
        }
      }
      
      return sanitized;
    }
    
    return data;
  };

  private logErrorToService = (
    error: Error, 
    errorInfo: ReactErrorInfo, 
    classifiedError: ErrorInfo
  ) => {
    // Sanitize error data before logging
    // Validates: Requirements 4.5 - Secure error logging without sensitive data exposure
    const sanitizedError = {
      message: this.sanitizeErrorData(error.message),
      stack: this.sanitizeErrorData(error.stack),
      name: error.name,
    };
    
    const sanitizedClassifiedError = {
      ...classifiedError,
      message: this.sanitizeErrorData(classifiedError.message),
      details: this.sanitizeErrorData(classifiedError.details),
    };
    
    const errorReport = {
      error: sanitizedError,
      componentStack: this.sanitizeErrorData(errorInfo.componentStack),
      classifiedError: sanitizedClassifiedError,
      userAgent: navigator.userAgent,
      url: window.location.href.split('?')[0], // Remove query params that might contain sensitive data
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      // Include only non-sensitive context
      context: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        online: navigator.onLine,
        language: navigator.language
      }
    };

    // Log to console in development (sanitized)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error report prepared (sanitized):', errorReport);
    }
    
    // In production, send to error tracking service
    // Example: Send to error tracking service
    // errorTrackingService.captureException(errorReport);
  };

  /**
   * Handle retry with user feedback
   * Validates: Requirements 4.4 - Recoverable error options
   */
  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      
      // Log retry attempt
      console.log(`Retry attempt ${this.retryCount}/${this.maxRetries} for error:`, this.state.errorId);
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    } else {
      // Max retries reached, show permanent error state with clear recovery options
      // Validates: Requirements 4.4 - Clear retry or resolution options
      const currentError = this.state.errorInfo;
      if (currentError) {
        this.setState({
          errorInfo: {
            ...currentError,
            retryable: false,
            suggestions: [
              'Refresh the page to start fresh',
              'Clear your browser cache and cookies',
              'Try using a different browser',
              'Contact support with Error ID: ' + this.state.errorId
            ]
          }
        });
      }
    }
  };

  /**
   * Reload the page - useful for clearing corrupted state
   * Validates: Requirements 4.4 - Recovery options
   */
  private handleReload = () => {
    // Save error ID to session storage for support purposes
    if (this.state.errorId) {
      sessionStorage.setItem('lastErrorId', this.state.errorId);
    }
    window.location.reload();
  };

  /**
   * Navigate to home page - safe fallback
   * Validates: Requirements 4.4 - Recovery options
   */
  private handleGoHome = () => {
    // Save error ID to session storage for support purposes
    if (this.state.errorId) {
      sessionStorage.setItem('lastErrorId', this.state.errorId);
    }
    window.location.href = '/';
  };

  /**
   * Clear local storage and reload - nuclear option for persistent errors
   * Validates: Requirements 4.4 - Recovery options
   */
  private handleClearAndReload = () => {
    if (confirm('This will clear all locally stored data and reload the page. Continue?')) {
      // Save error ID before clearing
      const errorId = this.state.errorId;
      
      // Clear all local storage except error tracking
      const keysToPreserve = ['lastErrorId', 'errorHistory'];
      const preserved: { [key: string]: string | null } = {};
      
      keysToPreserve.forEach(key => {
        preserved[key] = localStorage.getItem(key);
      });
      
      localStorage.clear();
      
      // Restore preserved keys
      Object.entries(preserved).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });
      
      if (errorId) {
        sessionStorage.setItem('lastErrorId', errorId);
      }
      
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI using our ErrorHandler component
      // Validates: Requirements 4.1 - User-friendly error messages
      // Validates: Requirements 4.4 - Clear recovery options
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <ErrorHandler
              error={this.state.errorInfo || ErrorCreators.unknown('An unexpected error occurred')}
              onRetry={this.retryCount < this.maxRetries ? this.handleRetry : undefined}
              onCancel={this.handleGoHome}
              onFallback={this.handleReload}
              fallbackLabel="Reload Page"
              showDetails={this.props.showErrorDetails}
            />
            
            {/* Additional recovery options */}
            {this.retryCount >= this.maxRetries && (
              <div className="mt-6 text-center">
                <button
                  onClick={this.handleClearAndReload}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Clear all data and reload (last resort)
                </button>
              </div>
            )}
            
            {/* Technical Information - Validates: Requirements 4.5 - Sufficient context for debugging */}
            <div className="mt-6 text-center">
              <details className="text-sm text-gray-600">
                <summary className="cursor-pointer hover:text-gray-800">
                  Technical Information
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded-lg text-left">
                  <p><strong>Error ID:</strong> {this.state.errorId}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Save this ID when contacting support
                  </p>
                  <p className="mt-2"><strong>Component:</strong> Error Boundary</p>
                  <p><strong>Retry Count:</strong> {this.retryCount}/{this.maxRetries}</p>
                  <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
                  {this.state.error && (
                    <>
                      <p className="mt-2"><strong>Error Type:</strong> {this.state.error.name}</p>
                      <p><strong>Error Message:</strong> {this.state.error.message}</p>
                      {this.props.showErrorDetails && this.state.error.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs">Stack Trace</summary>
                          <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded">
                            {this.state.error.stack}
                          </pre>
                        </details>
                      )}
                    </>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for manual error reporting
export const useErrorReporting = () => {
  const reportError = (error: Error, context?: string) => {
    const classifiedError = errorHandlingService.classifyError(error, context || 'manual-report');
    
    // Log the error
    console.error('Manual error report:', error, classifiedError);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // errorTrackingService.captureException({
      //   error,
      //   classifiedError,
      //   context,
      //   timestamp: new Date().toISOString()
      // });
    }
    
    return classifiedError;
  };

  return { reportError };
};