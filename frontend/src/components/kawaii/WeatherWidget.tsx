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
 * Get weather emoji and gradient based on condition
 */
const getWeatherStyle = (condition: string): { emoji: string; gradient: string; illustration: string } => {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return {
      emoji: '🌧️',
      gradient: 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30',
      illustration: '☔'
    };
  }
  if (lowerCondition.includes('cloud')) {
    return {
      emoji: '☁️',
      gradient: 'from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30',
      illustration: '🍜'
    };
  }
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return {
      emoji: '☀️',
      gradient: 'from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30',
      illustration: '🍜'
    };
  }
  if (lowerCondition.includes('snow')) {
    return {
      emoji: '❄️',
      gradient: 'from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30',
      illustration: '⛄'
    };
  }
  if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
    return {
      emoji: '⛈️',
      gradient: 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30',
      illustration: '⚡'
    };
  }
  
  // Partly cloudy as default
  return {
    emoji: '🌤️',
    gradient: 'from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-900/30',
    illustration: '🍜'
  };
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
          'rounded-3xl p-6 shadow-kawaii-sm',
          'border-2 border-neutral-200 dark:border-neutral-700',
          'relative overflow-hidden',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditingLocation ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedLocation}
                  onChange={(e) => setEditedLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLocationSave();
                    if (e.key === 'Escape') handleLocationCancel();
                  }}
                  className="px-3 py-1 rounded-lg border-2 border-kawaii-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-kawaii-500"
                  autoFocus
                />
                <button
                  onClick={handleLocationSave}
                  className="px-3 py-1 bg-kawaii-500 text-white rounded-lg text-sm hover:bg-kawaii-600 transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={handleLocationCancel}
                  className="px-3 py-1 bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg text-sm hover:bg-neutral-400 dark:hover:bg-neutral-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {location}
                </h3>
                {onLocationChange && (
                  <button
                    onClick={() => setIsEditingLocation(true)}
                    className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center"
                    aria-label="Edit location"
                  >
                    <PencilIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">🌤️</span>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t('weather.noData')}
          </p>
        </div>
      </motion.div>
    );
  }

  const weatherStyle = getWeatherStyle(forecast.condition);
  const tempHigh = Math.round(forecast.temperature_high);
  const tempLow = Math.round(forecast.temperature_low);
  const feelsLike = Math.round((forecast.temperature_high + forecast.temperature_low) / 2);

  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-neutral-800',
        'rounded-3xl p-6 shadow-kawaii-sm',
        'border-2 border-neutral-200 dark:border-neutral-700',
        'relative overflow-hidden',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-6">
        {/* Refresh Button (top-left) */}
        <motion.button
          className="absolute top-4 left-4 min-w-[44px] min-h-[44px] p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
          whileTap={{ scale: 0.95, rotate: 180 }}
          aria-label={t('weather.refresh')}
        >
          <svg
            className="w-5 h-5 text-neutral-400 dark:text-neutral-500"
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

        {/* Weather Icon with subtle background */}
        <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 flex items-center justify-center">
          <motion.div
            className="text-5xl"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {weatherStyle.emoji}
          </motion.div>
        </div>

        {/* Temperature */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-5xl font-bold text-neutral-900 dark:text-neutral-100">
              {tempHigh}°C
            </span>
            <span className="text-2xl text-neutral-500 dark:text-neutral-400">
              / {tempLow}°C
            </span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            體感: {feelsLike}°C
          </p>
        </div>

        {/* Location and Condition */}
        <div className="flex-shrink-0 text-right">
          {isEditingLocation ? (
            <div className="flex flex-col items-end gap-2">
              <input
                type="text"
                value={editedLocation}
                onChange={(e) => setEditedLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLocationSave();
                  if (e.key === 'Escape') handleLocationCancel();
                }}
                className="px-3 py-1 rounded-lg border-2 border-kawaii-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-kawaii-500 text-right"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleLocationSave}
                  className="px-4 py-3 min-h-[44px] bg-kawaii-500 text-white rounded-lg text-sm hover:bg-kawaii-600 transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={handleLocationCancel}
                  className="px-4 py-3 min-h-[44px] bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg text-sm hover:bg-neutral-400 dark:hover:bg-neutral-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {forecast.condition}
              </div>
              <div className="flex items-center justify-end gap-1">
                <span className="text-lg text-neutral-700 dark:text-neutral-300">
                  {location}
                </span>
                {onLocationChange && (
                  <button
                    onClick={() => setIsEditingLocation(true)}
                    className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
                    aria-label="Edit location"
                  >
                    <PencilIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
