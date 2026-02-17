/**
 * RouteDisplay Component
 * 
 * Displays route information between locations (e.g., "難波 → 梅田 → 天満").
 * Shows transportation method and travel time.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

interface RouteStop {
  name: string;
  arrivalTime?: string;
}

interface RouteDisplayProps {
  stops: RouteStop[];
  transportMode?: 'train' | 'bus' | 'car' | 'walk' | 'bike' | 'flight';
  travelTime?: number; // in minutes
  className?: string;
}

/**
 * Get transport emoji
 */
const getTransportEmoji = (mode?: string): string => {
  switch (mode) {
    case 'train':
      return '🚃';
    case 'bus':
      return '🚌';
    case 'car':
      return '🚗';
    case 'walk':
      return '🚶';
    case 'bike':
      return '🚴';
    case 'flight':
      return '✈️';
    default:
      return '🚃';
  }
};

/**
 * Format travel time
 */
const formatTravelTime = (minutes?: number): string => {
  if (!minutes) return '';
  
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
};

export const RouteDisplay: React.FC<RouteDisplayProps> = ({
  stops,
  transportMode = 'train',
  travelTime,
  className,
}) => {
  const { t } = useTranslation('bubbleQuest');
  
  const transportEmoji = getTransportEmoji(transportMode);
  const travelTimeText = formatTravelTime(travelTime);

  if (stops.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        'bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-800/50',
        'rounded-xl p-3 border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {/* Transport Icon */}
        <span className="text-lg">{transportEmoji}</span>

        {/* Route Stops */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {stops.map((stop, index) => (
            <React.Fragment key={index}>
              <span className="text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                {stop.name}
              </span>
              {index < stops.length - 1 && (
                <span className="text-bubblequest-neutral-400 dark:text-bubblequest-neutral-600">
                  →
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Travel Time */}
        {travelTimeText && (
          <span className="text-xs px-2 py-1 rounded-full bg-white dark:bg-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 whitespace-nowrap">
            {travelTimeText}
          </span>
        )}
      </div>
    </motion.div>
  );
};
