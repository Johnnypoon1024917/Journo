/**
 * RecommendationSelector Component
 * 
 * Provides user interface for selecting travel preferences:
 * - Month selector (1-12)
 * - Weather preference (Warm/Cold/Any)
 * - Optional geolocation toggle
 * 
 * Features:
 * - Integrates with useFormHandler for form state management
 * - Uses useDebouncedUpdate for query debouncing
 * - Calls destinationService for API requests
 * - BubbleQuest theming with rounded corners and soft shadows
 * - Keyboard accessible with proper focus states
 * - ARIA labels for screen readers
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.1, 9.2
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useFormHandler } from '../../hooks/useFormHandler';
import { useDebouncedUpdate } from '../../hooks/useDebouncedUpdate';
import { DestinationService } from '../../services/destinationService';
import { RecommendationFilters, WeatherPreference, CountryRecommendation } from '../../types/countryRecommendation';
import { cn } from '../../utils/cn';

export interface RecommendationSelectorProps {
  onSearch: (countries: CountryRecommendation[]) => void;
  onFiltersChange?: (filters: RecommendationFilters) => void;
  isLoading?: boolean;
}

// Month names for display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Weather preference options
const WEATHER_OPTIONS: { value: WeatherPreference; label: string; emoji: string }[] = [
  { value: 'Any', label: 'Any Weather', emoji: '🌍' },
  { value: 'Warm', label: 'Warm', emoji: '☀️' },
  { value: 'Cold', label: 'Cold', emoji: '❄️' }
];

export const RecommendationSelector: React.FC<RecommendationSelectorProps> = ({
  onSearch,
  onFiltersChange,
  isLoading = false
}) => {
  // Get current month as default
  const currentMonth = new Date().getMonth() + 1;

  // Form state management using useFormHandler
  const { values, setValue, handleChange } = useFormHandler(
    {
      fields: {
        month: {
          type: 'number',
          required: true,
          min: 1,
          max: 12
        },
        weatherPreference: {
          type: 'text',
          required: true
        },
        useGeolocation: {
          type: 'checkbox',
          required: false
        }
      }
    },
    {
      initialValues: {
        month: currentMonth,
        weatherPreference: 'Any' as WeatherPreference,
        useGeolocation: false
      }
    }
  );

  const [error, setError] = useState<string | null>(null);

  // Fetch country recommendations
  const fetchRecommendations = async (filters: RecommendationFilters) => {
    try {
      setError(null);
      const countries = await DestinationService.getCountryRecommendations(filters);
      onSearch(countries);
    } catch (err) {
      console.error('Error fetching country recommendations:', err);
      setError('Failed to load recommendations. Please try again.');
    }
  };

  // Debounced update for query optimization
  const { scheduleUpdate } = useDebouncedUpdate<RecommendationFilters>(
    fetchRecommendations,
    {
      delay: 500,
      onError: (err) => {
        console.error('Debounced update error:', err);
        setError('Failed to load recommendations. Please try again.');
      }
    }
  );

  // Update filters when form values change
  useEffect(() => {
    const filters: RecommendationFilters = {
      month: values.month as number,
      weatherPreference: values.weatherPreference as WeatherPreference,
      useGeolocation: values.useGeolocation as boolean
    };

    // Notify parent of filter changes
    if (onFiltersChange) {
      onFiltersChange(filters);
    }

    // Schedule debounced API call
    scheduleUpdate('recommendations', filters);
  }, [values.month, values.weatherPreference, values.useGeolocation]);

  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-bubblequest-neutral-800',
        'rounded-2xl p-6',
        'border-2 border-[#d5d0c2] dark:border-bubblequest-neutral-700',
        'shadow-md',
        'space-y-6'
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-bubblequest-neutral-900 dark:text-white mb-2">
          Find Your Perfect Destination
        </h2>
        <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
          Select your travel month and weather preference to discover ideal destinations
        </p>
      </div>

      {/* Month Selector */}
      <div className="space-y-2">
        <label
          htmlFor="month-select"
          className="block text-sm font-semibold text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300"
        >
          Travel Month
          <span className="sr-only">
            {' '}(Required field, select a month from 1 to 12)
          </span>
        </label>
        <select
          id="month-select"
          name="month"
          value={values.month}
          onChange={handleChange}
          disabled={isLoading}
          required
          aria-required="true"
          aria-describedby="month-description"
          className={cn(
            'w-full px-4 py-3 rounded-xl',
            'bg-bubblequest-neutral-50 dark:bg-bubblequest-neutral-900',
            'border-2 border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700',
            'text-bubblequest-neutral-900 dark:text-white',
            'focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500 focus:ring-offset-2 focus:border-bubblequest-primary-500',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'cursor-pointer',
            'min-h-touch'
          )}
          aria-label="Select travel month"
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={index + 1} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
        <p id="month-description" className="sr-only">
          Choose the month you plan to travel to see destinations with ideal weather during that time
        </p>
      </div>

      {/* Weather Preference Selector */}
      <div className="space-y-2">
        <label 
          id="weather-preference-label"
          className="block text-sm font-semibold text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300"
        >
          Weather Preference
          <span className="sr-only">
            {' '}(Required field, choose between warm, cold, or any weather)
          </span>
        </label>
        <div
          className="grid grid-cols-3 gap-3"
          role="radiogroup"
          aria-labelledby="weather-preference-label"
          aria-required="true"
          aria-describedby="weather-description"
        >
          {WEATHER_OPTIONS.map((option) => {
            const isSelected = values.weatherPreference === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('weatherPreference', option.value)}
                disabled={isLoading}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${option.label} weather preference${isSelected ? ', currently selected' : ''}`}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'px-4 py-3 rounded-xl',
                  'border-2 transition-all duration-200',
                  'focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'min-h-touch min-w-touch',
                  isSelected
                    ? 'bg-bubblequest-primary-100 dark:bg-bubblequest-primary-900/30 border-bubblequest-primary-500 dark:border-bubblequest-primary-500'
                    : 'bg-bubblequest-neutral-50 dark:bg-bubblequest-neutral-900 border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 hover:border-bubblequest-primary-300 dark:hover:border-bubblequest-primary-700',
                  !isLoading && 'cursor-pointer'
                )}
              >
                <span className="text-2xl mb-1" role="img" aria-hidden="true">
                  {option.emoji}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isSelected
                      ? 'text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                      : 'text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300'
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        <p id="weather-description" className="sr-only">
          Select your preferred climate type to filter destinations by temperature
        </p>
      </div>

      {/* Geolocation Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-bubblequest-neutral-50 dark:bg-bubblequest-neutral-900">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="Location">
            📍
          </span>
          <div>
            <label
              htmlFor="geolocation-toggle"
              className="block text-sm font-medium text-bubblequest-neutral-900 dark:text-white cursor-pointer"
            >
              Prioritize Nearby Destinations
            </label>
            <p 
              id="geolocation-description"
              className="text-xs text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400"
            >
              Show closer destinations first
            </p>
          </div>
        </div>
        <button
          id="geolocation-toggle"
          type="button"
          role="switch"
          aria-checked={values.useGeolocation}
          aria-describedby="geolocation-description"
          aria-label={`Prioritize nearby destinations, currently ${values.useGeolocation ? 'enabled' : 'disabled'}`}
          onClick={() => setValue('useGeolocation', !values.useGeolocation)}
          disabled={isLoading}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-touch min-w-touch',
            values.useGeolocation
              ? 'bg-bubblequest-primary-500'
              : 'bg-bubblequest-neutral-300 dark:bg-bubblequest-neutral-700'
          )}
        >
          <span className="sr-only">
            {values.useGeolocation ? 'Disable' : 'Enable'} nearby destination prioritization
          </span>
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
              values.useGeolocation ? 'translate-x-6' : 'translate-x-1'
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
          <motion.div
            className="w-4 h-4 border-2 border-bubblequest-primary-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span>Loading recommendations...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
