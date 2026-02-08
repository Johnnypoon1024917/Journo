import React, { useState } from 'react';
import { useDestinationSuggestions } from '../../hooks/useDestinationSuggestions';
import { DestinationLoadingState } from './DestinationLoadingState';
import { DestinationErrorDisplay } from './DestinationErrorDisplay';
import { DestinationEmptyState } from './DestinationEmptyState';
import { ManualDestinationEntry } from './ManualDestinationEntry';
import { Text } from '../../design-system/atoms/Text';

interface DestinationSuggestionsContainerProps {
  month?: number;
  onDestinationSelect?: (destinationName: string, country: string) => void;
  className?: string;
}

/**
 * Complete destination suggestions container with error handling and recovery
 * Implements Requirements 3.2, 3.5, 7.6, 7.7
 */
export const DestinationSuggestionsContainer: React.FC<DestinationSuggestionsContainerProps> = ({
  month,
  onDestinationSelect,
  className = ''
}) => {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const {
    suggestions,
    loading,
    error,
    isUsingCache,
    refresh,
    clearError
  } = useDestinationSuggestions({ month, autoLoad: true });

  const handleManualEntry = (destinationName: string, country: string) => {
    if (onDestinationSelect) {
      onDestinationSelect(destinationName, country);
    }
    setShowManualEntry(false);
  };

  const handleRetry = () => {
    clearError();
    refresh();
  };

  // Show loading state
  if (loading && suggestions.length === 0) {
    return (
      <DestinationLoadingState
        message="Discovering amazing destinations for you..."
        className={className}
      />
    );
  }

  // Show manual entry form if requested
  if (showManualEntry) {
    return (
      <ManualDestinationEntry
        onSubmit={handleManualEntry}
        onCancel={() => setShowManualEntry(false)}
        className={className}
      />
    );
  }

  // Show error state with recovery options
  if (error && suggestions.length === 0) {
    return (
      <DestinationErrorDisplay
        errorType={error.type}
        errorMessage={error.message}
        canRetry={error.canRetry}
        hasCachedData={error.hasCachedData}
        onRetry={handleRetry}
        onManualEntry={() => setShowManualEntry(true)}
        className={className}
      />
    );
  }

  // Show empty state if no suggestions
  if (!loading && suggestions.length === 0) {
    return (
      <DestinationEmptyState
        onManualEntry={() => setShowManualEntry(true)}
        onRefresh={refresh}
        className={className}
      />
    );
  }

  // Show suggestions with cache warning if applicable
  return (
    <div className={className}>
      {/* Cache warning banner */}
      {isUsingCache && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <Text variant="body" className="text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                Showing Cached Destinations
              </Text>
              <Text variant="caption" className="text-yellow-700 dark:text-yellow-400">
                We're having trouble connecting to our servers. These destinations may not be up to date.
              </Text>
            </div>
            <button
              onClick={refresh}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Error banner (when we have suggestions but encountered an error) */}
      {error && suggestions.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <Text variant="body" className="text-red-800 dark:text-red-300 font-medium mb-1">
                {error.message}
              </Text>
              {error.canRetry && (
                <button
                  onClick={handleRetry}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
                >
                  Try Again
                </button>
              )}
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Destination suggestions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onDestinationSelect?.(suggestion.destination_name, suggestion.country)}
          >
            {/* Destination image */}
            {suggestion.image_url ? (
              <img
                src={suggestion.image_url}
                alt={suggestion.destination_name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}

            {/* Destination info */}
            <div className="p-4">
              <Text variant="body" weight="semibold" className="mb-1">
                {suggestion.destination_name}
              </Text>
              <Text variant="caption" className="text-gray-600 dark:text-gray-400 mb-2">
                {suggestion.country}
              </Text>
              {suggestion.why_now && (
                <Text variant="caption" className="text-gray-500 dark:text-gray-500">
                  {suggestion.why_now}
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
