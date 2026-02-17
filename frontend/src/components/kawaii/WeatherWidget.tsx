/**
 * WeatherWidget Component
 * 
 * Displays weather information for a specific day with kawaii styling.
 * Shows temperature, conditions, and weather icon with location editing capability.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import type { DailyForecast } from '@/types/trip';
import { PencilIcon } from '@heroicons/react/24/outline';

interface WeatherWidgetProps {
  forecast?: DailyForecast;
  location?: string;
  onLocationChange?: (newLocation: string) => void;
  className?: string;
}

/**
 * Get weather emoji based on condition
 */
const getWeatherEmoji = (condition: string): string => {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return '🌧️';
  }
  if (lowerCondition.includes('cloud')) {
    return '☁️';
  }
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return '☀️';
  }
  if (lowerCondition.includes('snow')) {
    return '❄️';
  }
  if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
    return '⛈️';
  }
  
  // Partly cloudy as default
  return '🌤️';
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  forecast,
  location = '大阪',
  onLocationChange,
  className,
}) => {
  const { t } = useTranslation('kawaii');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editedLocation, setEditedLocation] = useState(location);

  const handleLocationSave = () => {
    if (editedLocation.trim() && onLocationChange) {
      onLocationChange(editedLocation.trim());
    }
    setIsEditingLocation(false);
  };

  const handleLocationCancel = () => {
    setEditedLocation(location);
    setIsEditingLocation(false);
  };

  if (!forecast) {
    return (
      <motion.div
        className={cn(
          'bg-white dark:bg-neutral-800',
          'rounded-2xl sm:rounded-3xl shadow-lg',
          'border border-neutral-200 dark:border-neutral-700',
          'relative overflow-hidden',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4">
          {/* Top row: Location and buttons */}
          <div className="flex items-start justify-between mb-6">
            {isEditingLocation ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editedLocation}
                  onChange={(e) => setEditedLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLocationSave();
                    if (e.key === 'Escape') handleLocationCancel();
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border-2 border-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                <button
                  onClick={handleLocationSave}
                  className="px-3 py-2 min-h-[44px] bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={handleLocationCancel}
                  className="px-3 py-2 min-h-[44px] bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg text-sm hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    {location}
                  </span>
                  {onLocationChange && (
                    <button
                      onClick={() => setIsEditingLocation(true)}
                      className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
                      aria-label="Edit location"
                    >
                      <PencilIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block">🌤️</span>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('weather.noData')}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const weatherEmoji = getWeatherEmoji(forecast.condition);
  const tempHigh = Math.round(forecast.temperature_high);
  const tempLow = Math.round(forecast.temperature_low);

  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-neutral-800',
        'rounded-2xl sm:rounded-3xl shadow-lg',
        'border border-neutral-200 dark:border-neutral-700',
        'relative overflow-hidden',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* iOS-style compact layout */}
      <div className="p-4">
        {/* Top row: Location and Edit button */}
        <div className="flex items-start justify-between mb-2">
          {isEditingLocation ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editedLocation}
                onChange={(e) => setEditedLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLocationSave();
                  if (e.key === 'Escape') handleLocationCancel();
                }}
                className="flex-1 px-3 py-2 rounded-lg border-2 border-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
              <button
                onClick={handleLocationSave}
                className="px-3 py-2 min-h-[44px] bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                ✓
              </button>
              <button
                onClick={handleLocationCancel}
                className="px-3 py-2 min-h-[44px] bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg text-sm hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  {location}
                </span>
                {onLocationChange && (
                  <button
                    onClick={() => setIsEditingLocation(true)}
                    className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
                    aria-label="Edit location"
                  >
                    <PencilIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  </button>
                )}
              </div>
              <motion.button
                className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
                whileTap={{ scale: 0.95, rotate: 180 }}
                aria-label={t('weather.refresh')}
              >
                <svg
                  className="w-4 h-4 text-neutral-400 dark:text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </motion.button>
            </>
          )}
        </div>

        {/* Main content: Temperature and Icon side by side */}
        <div className="flex items-center justify-between">
          {/* Left: Temperature */}
          <div className="flex-1">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-6xl sm:text-7xl font-light text-neutral-900 dark:text-neutral-100 leading-none">
                {tempHigh}°
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <span className="text-lg font-medium">{forecast.condition}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              <span>H:{tempHigh}°</span>
              <span>L:{tempLow}°</span>
            </div>
          </div>

          {/* Right: Weather Icon */}
          <div className="flex-shrink-0">
            <motion.div
              className="text-7xl sm:text-8xl"
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {weatherEmoji}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
