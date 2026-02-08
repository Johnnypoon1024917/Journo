import React from 'react';
import { Text } from '../../design-system/atoms/Text';

interface DestinationLoadingStateProps {
  message?: string;
  showRetryingMessage?: boolean;
  className?: string;
}

/**
 * Loading state component for destination suggestions
 * Implements Requirements 7.6: Elegant loading states
 */
export const DestinationLoadingState: React.FC<DestinationLoadingStateProps> = ({
  message = 'Loading destinations...',
  showRetryingMessage = false,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 ${className}`}>
      {/* Skeleton cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            {/* Image skeleton */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 mb-3"></div>
            {/* Title skeleton */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4 mb-2"></div>
            {/* Subtitle skeleton */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-1/2"></div>
          </div>
        ))}
      </div>

      {/* Loading message */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3">
          {/* Spinner */}
          <svg className="animate-spin h-5 w-5 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          
          <div className="text-left">
            <Text variant="body" className="text-gray-700 dark:text-gray-300">
              {message}
            </Text>
            {showRetryingMessage && (
              <Text variant="caption" className="text-gray-500 dark:text-gray-500">
                Retrying connection...
              </Text>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
