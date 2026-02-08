import React from 'react';
import { Button } from '../../design-system/atoms/Button';
import { Text } from '../../design-system/atoms/Text';

interface DestinationEmptyStateProps {
  onManualEntry?: () => void;
  onRefresh?: () => void;
  className?: string;
}

/**
 * Empty state component for destination suggestions
 * Implements Requirements 7.7: Empty state guidance with clear calls-to-action
 */
export const DestinationEmptyState: React.FC<DestinationEmptyStateProps> = ({
  onManualEntry,
  onRefresh,
  className = ''
}) => {
  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md p-12 text-center ${className}`}>
      {/* Illustration */}
      <div className="mb-6">
        <svg className="w-32 h-32 mx-auto text-indigo-300 dark:text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <Text variant="heading" className="mb-3">
        No Destinations Yet
      </Text>
      
      <Text variant="body" className="text-gray-600 dark:text-gray-400 mb-2 max-w-md mx-auto">
        We don't have any destination suggestions available right now.
      </Text>
      
      <Text variant="caption" className="text-gray-500 dark:text-gray-500 mb-8 max-w-md mx-auto">
        Start planning your next adventure by adding a destination manually, or check back later for personalized suggestions.
      </Text>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onManualEntry && (
          <Button
            variant="primary"
            onClick={onManualEntry}
            className="min-w-[180px]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Destination
          </Button>
        )}
        
        {onRefresh && (
          <Button
            variant="secondary"
            onClick={onRefresh}
            className="min-w-[180px]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        )}
      </div>

      {/* Helpful tips */}
      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Text variant="caption" className="text-gray-500 dark:text-gray-500 mb-4">
          💡 Tips for finding great destinations:
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <Text variant="caption" className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
              🌍 Explore by Season
            </Text>
            <Text variant="caption" className="text-gray-600 dark:text-gray-400">
              Different destinations shine in different months
            </Text>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <Text variant="caption" className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
              ⭐ Check Reviews
            </Text>
            <Text variant="caption" className="text-gray-600 dark:text-gray-400">
              See what other travelers loved about each place
            </Text>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <Text variant="caption" className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
              📅 Plan Ahead
            </Text>
            <Text variant="caption" className="text-gray-600 dark:text-gray-400">
              Book early for better prices and availability
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
