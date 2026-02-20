/**
 * CountryCard Component
 * 
 * Displays a country recommendation with travel metadata including
 * name, description, temperature range, region, and best travel months.
 * 
 * Features:
 * - BubbleQuest theming with rounded corners and soft shadows
 * - Visual badges for best travel months
 * - Optional distance indicator for geolocation
 * - Keyboard accessible with proper focus states
 * - ARIA labels for screen readers
 * - Responsive design
 * 
 * Requirements: 5.2, 5.3, 5.6, 11.2
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CountryRecommendation } from '../../types/countryRecommendation';
import { cn } from '../../utils/cn';

export interface CountryCardProps {
  country: CountryRecommendation;
  onSelect?: (country: CountryRecommendation) => void;
  distance?: number; // Optional distance in km for geolocation
}

// Month names for badge display
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Region emoji mapping for visual interest
const REGION_EMOJI: Record<string, string> = {
  'Asia': '🌏',
  'Europe': '🇪🇺',
  'Americas': '🌎',
  'Africa': '🌍',
  'Oceania': '🏝️',
  'Middle East': '🕌'
};

export const CountryCard: React.FC<CountryCardProps> = ({
  country,
  onSelect,
  distance
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(country);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(country);
    }
  };

  const isClickable = !!onSelect;

  return (
    <motion.article
      className={cn(
        'bg-white dark:bg-bubblequest-neutral-800',
        'rounded-2xl p-6',
        'border-2 border-[#d5d0c2] dark:border-bubblequest-neutral-700',
        'shadow-md hover:shadow-lg',
        'transition-all duration-300',
        isClickable && 'cursor-pointer',
        'focus-within:ring-3 focus-within:ring-bubblequest-primary-500 focus-within:ring-offset-2'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isClickable ? { y: -4, scale: 1.02 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : 'article'}
      aria-label={`${country.country_name} in ${country.region}. ${country.description}. Temperature range: ${country.temp_range}. Best months to visit: ${country.best_months.map(m => MONTH_NAMES[m - 1]).join(', ')}`}
    >
      {/* Header with country name and region */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-bubblequest-neutral-900 dark:text-white mb-1">
            {country.country_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
            <span aria-label={`Region: ${country.region}`}>
              {REGION_EMOJI[country.region] || '🌍'} {country.region}
            </span>
            {distance !== undefined && (
              <>
                <span className="text-bubblequest-neutral-400" aria-hidden="true">•</span>
                <span aria-label={`Distance: ${distance} kilometers`}>
                  📍 {distance.toFixed(0)} km away
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 text-sm leading-relaxed mb-4">
        {country.description}
      </p>

      {/* Temperature range */}
      <div className="flex items-center gap-2 mb-4">
        <span 
          className="text-2xl" 
          role="img" 
          aria-label="Temperature"
        >
          🌡️
        </span>
        <span 
          className="text-sm font-medium text-bubblequest-neutral-800 dark:text-bubblequest-neutral-200"
          aria-label={`Temperature range: ${country.temp_range}`}
        >
          {country.temp_range}
        </span>
      </div>

      {/* Best months badges */}
      <div className="space-y-2">
        <h4 
          id={`best-months-${country.id}`}
          className="text-xs font-semibold text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 uppercase tracking-wide"
        >
          Best Months to Visit
        </h4>
        <div 
          className="flex flex-wrap gap-2"
          role="list"
          aria-labelledby={`best-months-${country.id}`}
        >
          {country.best_months.map((month) => (
            <span
              key={month}
              role="listitem"
              className={cn(
                'inline-flex items-center justify-center',
                'px-3 py-1.5 rounded-full',
                'text-xs font-medium',
                'bg-bubblequest-primary-100 dark:bg-bubblequest-primary-900/30',
                'text-bubblequest-primary-700 dark:text-bubblequest-primary-300',
                'border border-bubblequest-primary-200 dark:border-bubblequest-primary-800',
                'transition-colors'
              )}
              aria-label={`Best month: ${MONTH_NAMES[month - 1]}`}
            >
              {MONTH_NAMES[month - 1]}
            </span>
          ))}
        </div>
      </div>

      {/* Avoid months indicator (if any) */}
      {country.avoid_months && country.avoid_months.length > 0 && (
        <div className="mt-3 pt-3 border-t border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700">
          <p 
            className="text-xs text-bubblequest-neutral-500 dark:text-bubblequest-neutral-500"
            aria-label={`Months to avoid: ${country.avoid_months.map(m => MONTH_NAMES[m - 1]).join(', ')}`}
          >
            <span className="font-semibold">Avoid:</span>{' '}
            {country.avoid_months.map(m => MONTH_NAMES[m - 1]).join(', ')}
          </p>
        </div>
      )}
    </motion.article>
  );
};
