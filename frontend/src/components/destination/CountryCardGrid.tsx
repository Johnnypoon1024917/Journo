/**
 * CountryCardGrid Component
 * 
 * Displays a responsive grid of country recommendation cards.
 * Handles loading states, empty states, and keyboard navigation.
 * 
 * Features:
 * - Responsive grid layout (1/2/3-4 columns based on viewport)
 * - Loading skeleton state
 * - Empty state with helpful message
 * - BubbleQuest theming
 * - Keyboard navigation support
 * - ARIA labels for accessibility
 * 
 * Requirements: 5.1, 5.4, 5.5, 5.6, 11.1
 */

import React from 'react';
import { CountryCard } from './CountryCard';
import { CountryRecommendation } from '../../types/countryRecommendation';
import { cn } from '../../utils/cn';

export interface CountryCardGridProps {
  countries: CountryRecommendation[];
  isLoading?: boolean;
  onCountrySelect?: (country: CountryRecommendation) => void;
}

/**
 * Loading skeleton card for grid
 */
const LoadingCard: React.FC = () => (
  <div
    className={cn(
      'bg-white dark:bg-bubblequest-neutral-800',
      'rounded-2xl p-6',
      'border-2 border-[#d5d0c2] dark:border-bubblequest-neutral-700',
      'shadow-md',
      'animate-pulse'
    )}
    aria-hidden="true"
  >
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-6 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-3/4" />
        <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-1/2" />
      </div>
      
      {/* Description skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded" />
        <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded" />
        <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-5/6" />
      </div>
      
      {/* Temperature skeleton */}
      <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-1/3" />
      
      {/* Badges skeleton */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-7 w-12 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded-full"
          />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Empty state component
 */
const EmptyState: React.FC = () => (
  <div
    className="col-span-full flex flex-col items-center justify-center py-16 px-4"
    role="status"
    aria-live="polite"
  >
    <div className="text-6xl mb-4" role="img" aria-label="No results">
      🌍
    </div>
    <h3 className="text-xl font-bold text-bubblequest-neutral-900 dark:text-white mb-2">
      No destinations found
    </h3>
    <p className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 text-center max-w-md">
      Try adjusting your travel month or weather preferences to discover more destinations.
    </p>
  </div>
);

/**
 * CountryCardGrid Component
 */
export const CountryCardGrid: React.FC<CountryCardGridProps> = ({
  countries,
  isLoading = false,
  onCountrySelect
}) => {
  // Show loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-6',
          'grid-cols-1',
          'sm:grid-cols-2',
          'lg:grid-cols-3',
          'xl:grid-cols-4'
        )}
        role="status"
        aria-label="Loading country recommendations"
        aria-live="polite"
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (countries.length === 0) {
    return <EmptyState />;
  }

  // Show country cards
  return (
    <div
      className={cn(
        'grid gap-6',
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4'
      )}
      role="list"
      aria-label={`${countries.length} country recommendations`}
    >
      {countries.map((country) => (
        <div key={country.id} role="listitem">
          <CountryCard
            country={country}
            onSelect={onCountrySelect}
          />
        </div>
      ))}
    </div>
  );
};
