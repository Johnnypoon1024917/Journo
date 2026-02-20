/**
 * DiscoveryForm Component
 * 
 * Interactive form for selecting travel preferences:
 * - Month dropdown selector (12 months)
 * - Weather preference selector (Warm ☀️ / Cool ❄️ / Any)
 * - "Find My Spot" CTA button
 * 
 * Features:
 * - BubbleQuest theming with rounded corners and soft shadows
 * - Keyboard accessible with proper focus states
 * - ARIA labels for screen readers
 * - Loading states
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { WeatherPreference } from '../../types/countryRecommendation';

export interface DiscoveryFormProps {
  month: number;
  weatherPreference: WeatherPreference;
  onMonthChange: (month: number) => void;
  onWeatherChange: (weather: WeatherPreference) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

// Month names for display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Weather preference options
const WEATHER_OPTIONS: { value: WeatherPreference; label: string; emoji: string }[] = [
  { value: 'Any', label: 'Any', emoji: '🌍' },
  { value: 'Warm', label: 'Warm', emoji: '☀️' },
  { value: 'Cold', label: 'Cool', emoji: '❄️' }
];

export const DiscoveryForm: React.FC<DiscoveryFormProps> = ({
  month,
  weatherPreference,
  onMonthChange,
  onWeatherChange,
  onSubmit,
  isLoading = false
}) => {
  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="space-y-2">
        <label
          htmlFor="discovery-month-select"
          className="block text-sm font-semibold text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300"
        >
          When are you traveling?
        </label>
        <select
          id="discovery-month-select"
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          disabled={isLoading}
          className={cn(
            'w-full px-4 py-3 rounded-xl',
            'bg-white dark:bg-bubblequest-neutral-800',
            'border-2 border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700',
            'text-bubblequest-neutral-900 dark:text-white',
            'focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500 focus:ring-offset-2 focus:border-bubblequest-primary-500',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'cursor-pointer',
            'text-base'
          )}
          aria-label="Select travel month"
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={index + 1} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Weather Preference Selector */}
      <div className="space-y-2">
        <label 
          id="discovery-weather-label"
          className="block text-sm font-semibold text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300"
        >
          What's your vibe?
        </label>
        <div
          className="grid grid-cols-3 gap-3"
          role="radiogroup"
          aria-labelledby="discovery-weather-label"
        >
          {WEATHER_OPTIONS.map((option) => {
            const isSelected = weatherPreference === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onWeatherChange(option.value)}
                disabled={isLoading}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${option.label} weather preference${isSelected ? ', currently selected' : ''}`}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'px-4 py-4 rounded-xl',
                  'border-2 transition-all duration-200',
                  'focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isSelected
                    ? 'bg-bubblequest-primary-100 dark:bg-bubblequest-primary-900/30 border-bubblequest-primary-500 dark:border-bubblequest-primary-500 shadow-md'
                    : 'bg-white dark:bg-bubblequest-neutral-800 border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 hover:border-bubblequest-primary-300 dark:hover:border-bubblequest-primary-700 hover:shadow-sm',
                  !isLoading && 'cursor-pointer'
                )}
              >
                <span className="text-3xl mb-2" role="img" aria-hidden="true">
                  {option.emoji}
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold',
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
      </div>

      {/* Submit Button */}
      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={isLoading}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
        className={cn(
          'w-full px-6 py-4 rounded-xl',
          'bg-gradient-to-r from-bubblequest-primary-500 to-bubblequest-primary-600',
          'text-white font-bold text-lg',
          'shadow-lg hover:shadow-xl',
          'transition-all duration-200',
          'focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          !isLoading && 'hover:from-bubblequest-primary-600 hover:to-bubblequest-primary-700'
        )}
        aria-label={isLoading ? 'Finding destinations...' : 'Find my perfect destination'}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.div
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            Finding Your Spot...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Find My Spot
            <span className="text-xl">🎯</span>
          </span>
        )}
      </motion.button>
    </div>
  );
};
