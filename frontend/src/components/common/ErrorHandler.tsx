import React from 'react';
import { Button } from './Button';

export interface ErrorInfo {
  type: 'network' | 'api' | 'validation' | 'timeout' | 'service_unavailable' | 'unknown';
  message: string;
  details?: string;
  code?: string;
  retryable?: boolean;
  suggestions?: string[];
}

export interface ErrorHandlerProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onCancel?: () => void;
  onFallback?: () => void;
  fallbackLabel?: string;
  preservedData?: any;
  showDetails?: boolean;
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onCancel,
  onFallback,
  fallbackLabel = 'Use Basic Mode',
  preservedData,
  showDetails = false
}) => {
  const getErrorIcon = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'network':
        return '📡';
      case 'api':
        return '⚠️';
      case 'validation':
        return '❌';
      case 'timeout':
        return '⏰';
      case 'service_unavailable':
        return '🔧';
      default:
        return '⚠️';
    }
  };

  const getErrorTitle = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'network':
        return 'Connection Problem';
      case 'api':
        return 'Service Error';
      case 'validation':
        return 'Invalid Input';
      case 'timeout':
        return 'Request Timeout';
      case 'service_unavailable':
        return 'Service Temporarily Unavailable';
      default:
        return 'Something Went Wrong';
    }
  };

  const getDefaultSuggestions = (type: ErrorInfo['type']): string[] => {
    switch (type) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable VPN if you\'re using one'
        ];
      case 'api':
        return [
          'The service may be temporarily down',
          'Try again in a few minutes',
          'Contact support if the problem persists'
        ];
      case 'validation':
        return [
          'Check your input for any errors',
          'Make sure all required fields are filled',
          'Verify date ranges are valid'
        ];
      case 'timeout':
        return [
          'The request took too long to complete',
          'Try with fewer places or a shorter trip',
          'Check your internet connection speed'
        ];
      case 'service_unavailable':
        return [
          'Our servers are temporarily busy',
          'Try again in a few minutes',
          'Use basic mode for simpler planning'
        ];
      default:
        return [
          'Try refreshing the page',
          'Check your internet connection',
          'Contact support if the issue continues'
        ];
    }
  };

  const suggestions = error.suggestions || getDefaultSuggestions(error.type);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6 max-w-2xl mx-auto">
      {/* Error Icon and Title */}
      <div className="text-center">
        <div className="text-6xl mb-4">{getErrorIcon(error.type)}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {getErrorTitle(error.type)}
        </h3>
        <p className="text-gray-600 mb-4 max-w-md">
          {error.message}
        </p>
      </div>

      {/* Error Details (Collapsible) */}
      {showDetails && error.details && (
        <div className="w-full max-w-md">
          <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Technical Details
            </summary>
            <div className="mt-3 text-sm text-gray-600">
              <p className="mb-2">{error.details}</p>
              {error.code && (
                <p className="text-xs text-gray-500">Error Code: {error.code}</p>
              )}
            </div>
          </details>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            What you can try:
          </h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Preservation Notice */}
      {preservedData && (
        <div className="w-full max-w-md bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-green-500 mt-0.5">✅</div>
            <div>
              <h4 className="text-sm font-medium text-green-900 mb-1">
                Your Data is Safe
              </h4>
              <p className="text-sm text-green-800">
                Don't worry! We've saved all your travel preferences and form data. 
                You won't need to start over.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        {error.retryable !== false && onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <span>🔄</span>
            <span>Try Again</span>
          </Button>
        )}
        
        {onFallback && (
          <Button
            variant="secondary"
            onClick={onFallback}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <span>⚡</span>
            <span>{fallbackLabel}</span>
          </Button>
        )}
        
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Back to Form
          </Button>
        )}
      </div>

      {/* Help Link */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Still having trouble?{' '}
          <a 
            href="/help" 
            className="text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

// Helper function to create error objects
export const createError = (
  type: ErrorInfo['type'],
  message: string,
  options: Partial<ErrorInfo> = {}
): ErrorInfo => ({
  type,
  message,
  retryable: true,
  ...options
});

// Common error creators
export const ErrorCreators = {
  network: (message = 'Unable to connect to our servers') =>
    createError('network', message, { retryable: true }),
    
  api: (message = 'Our service encountered an error', code?: string) =>
    createError('api', message, { code, retryable: true }),
    
  timeout: (message = 'The request took too long to complete') =>
    createError('timeout', message, { retryable: true }),
    
  serviceUnavailable: (message = 'Service is temporarily unavailable') =>
    createError('service_unavailable', message, { 
      retryable: true,
      suggestions: [
        'Our servers are experiencing high traffic',
        'Try again in a few minutes',
        'Use basic mode for simpler trip planning'
      ]
    }),
    
  validation: (message = 'Please check your input', field?: string) =>
    createError('validation', message, { 
      retryable: false,
      details: field ? `Issue with field: ${field}` : undefined
    }),
    
  unknown: (message = 'An unexpected error occurred') =>
    createError('unknown', message, { retryable: true })
};