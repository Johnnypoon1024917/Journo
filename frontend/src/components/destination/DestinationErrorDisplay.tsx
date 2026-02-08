import React from 'react';
import { Button } from '../../design-system/atoms/Button';
import { Text } from '../../design-system/atoms/Text';
import { DestinationServiceErrorType } from '../../services/destinationService';

interface DestinationErrorDisplayProps {
  errorType: DestinationServiceErrorType;
  errorMessage: string;
  canRetry: boolean;
  hasCachedData: boolean;
  onRetry: () => void;
  onManualEntry?: () => void;
  className?: string;
}

/**
 * Error display component for destination suggestions
 * Implements Requirements 3.2: Helpful error messages with retry options
 */
export const DestinationErrorDisplay: React.FC<DestinationErrorDisplayProps> = ({
  errorType,
  errorMessage,
  canRetry,
  hasCachedData,
  onRetry,
  onManualEntry,
  className = ''
}) => {
  const getErrorIcon = () => {
    switch (errorType) {
      case DestinationServiceErrorType.NETWORK_ERROR:
        return (
          <svg className="w-16 h-16 text-orange-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        );
      case DestinationServiceErrorType.SERVICE_UNAVAILABLE:
        return (
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case DestinationServiceErrorType.AUTHENTICATION_ERROR:
        return (
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getHelpfulMessage = () => {
    switch (errorType) {
      case DestinationServiceErrorType.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      case DestinationServiceErrorType.SERVICE_UNAVAILABLE:
        return 'Our destination service is temporarily unavailable. We\'re working to restore it.';
      case DestinationServiceErrorType.AUTHENTICATION_ERROR:
        return 'Please log in to access personalized destination suggestions.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center ${className}`}>
      {getErrorIcon()}
      
      <Text variant="subheading" className="mb-2">
        Unable to Load Destinations
      </Text>
      
      <Text variant="body" className="text-gray-600 dark:text-gray-400 mb-4">
        {errorMessage}
      </Text>
      
      <Text variant="caption" className="text-gray-500 dark:text-gray-500 mb-6">
        {getHelpfulMessage()}
      </Text>

      {hasCachedData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <Text variant="caption" className="text-blue-800 dark:text-blue-300">
            💡 You're viewing previously loaded destinations. They may not be up to date.
          </Text>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {canRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            className="min-w-[140px]"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </Button>
        )}
        
        {onManualEntry && (
          <Button
            variant="secondary"
            onClick={onManualEntry}
            className="min-w-[140px]"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Enter Manually
          </Button>
        )}
      </div>
    </div>
  );
};
