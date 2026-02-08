/**
 * Kawaii ActivityItem Component
 * 
 * Displays a single activity/place item with time, location, icon, and notes.
 * 
 * Features:
 * - Display time, location, icon, and notes
 * - Completion checkbox with visual indicator
 * - Google Maps integration for location tap
 * - Drag handle for reordering
 * - Hover and tap animations
 * - Support for different place types with appropriate icons
 * 
 * Requirements: 2.6, 3.1, 9.6
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import {
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { Place, PlaceType } from '@/types/trip';

export interface ActivityItemProps {
  activity: Place;
  completed?: boolean;
  onClick?: () => void;
  onCompletionToggle?: (completed: boolean) => void;
  isDragging?: boolean;
  showDragHandle?: boolean;
  className?: string;
}

/**
 * Get icon emoji based on place type
 */
const getPlaceIcon = (type: PlaceType | null): string => {
  switch (type) {
    case 'attraction':
      return '🎭';
    case 'food':
      return '🍜';
    case 'hotel':
      return '🏨';
    case 'transport':
      return '🚗';
    case 'other':
      return '📍';
    default:
      return '📍';
  }
};

/**
 * Generate Google Maps URL for a location
 */
const generateGoogleMapsUrl = (
  name: string,
  address: string | null,
  lat: number | null,
  lng: number | null
): string => {
  // Prefer coordinates if available
  if (lat !== null && lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  
  // Fall back to address
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  
  // Fall back to name
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
};

/**
 * ActivityItem component
 */
export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  completed = false,
  onClick,
  onCompletionToggle,
  isDragging = false,
  showDragHandle = false,
  className,
}) => {
  const handleLocationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateGoogleMapsUrl(
      activity.name,
      activity.address,
      activity.lat,
      activity.lng
    );
    window.open(url, '_blank');
  };

  const handleCompletionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompletionToggle?.(!completed);
  };

  const hasLocation = activity.address || (activity.lat !== null && activity.lng !== null);

  return (
    <motion.div
      layout
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg',
        'bg-white dark:bg-kawaii-neutral-800',
        'border border-kawaii-neutral-200 dark:border-kawaii-neutral-700',
        'hover:border-kawaii-primary-300 dark:hover:border-kawaii-primary-600',
        'transition-colors duration-200',
        onClick && 'cursor-pointer',
        isDragging && 'opacity-50 shadow-lg',
        completed && 'opacity-75',
        className
      )}
      onClick={onClick}
      whileHover={!isDragging ? { scale: 1.01 } : undefined}
      whileTap={!isDragging && onClick ? { scale: 0.99 } : undefined}
    >
      {/* Drag handle */}
      {showDragHandle && (
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
          <Bars3Icon className="w-5 h-5 text-kawaii-neutral-400 dark:text-kawaii-neutral-500" />
        </div>
      )}

      {/* Time or Icon */}
      <div className="flex-shrink-0 w-16 text-center">
        {activity.time_start ? (
          <div className="flex flex-col items-center">
            <ClockIcon className="w-4 h-4 text-kawaii-neutral-400 mb-1" />
            <span className="text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
              {activity.time_start}
            </span>
          </div>
        ) : (
          <span className="text-2xl">{getPlaceIcon(activity.place_type)}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'font-medium text-kawaii-neutral-900 dark:text-kawaii-neutral-100',
              completed && 'line-through text-kawaii-neutral-500 dark:text-kawaii-neutral-500'
            )}
          >
            {activity.name}
          </h4>
          
          {/* Completion checkbox */}
          <button
            onClick={handleCompletionClick}
            className={cn(
              'flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 rounded',
              'transition-colors duration-200',
              onCompletionToggle ? 'cursor-pointer' : 'cursor-default'
            )}
            disabled={!onCompletionToggle}
            aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {completed ? (
              <CheckCircleIconSolid className="w-5 h-5 text-kawaii-primary-500 dark:text-kawaii-primary-400" />
            ) : (
              <CheckCircleIcon className="w-5 h-5 text-kawaii-neutral-300 dark:text-kawaii-neutral-600 hover:text-kawaii-primary-400 dark:hover:text-kawaii-primary-500" />
            )}
          </button>
        </div>

        {/* Location with Google Maps link */}
        {hasLocation && (
          <button
            onClick={handleLocationClick}
            className={cn(
              'flex items-center gap-1 mt-1 text-sm',
              'text-kawaii-primary-600 dark:text-kawaii-primary-400',
              'hover:underline focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 rounded',
              completed && 'text-kawaii-neutral-500 dark:text-kawaii-neutral-500'
            )}
            aria-label={`Open ${activity.name} in Google Maps`}
          >
            <MapPinIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{activity.address || 'View on map'}</span>
          </button>
        )}

        {/* Notes */}
        {activity.notes && (
          <p
            className={cn(
              'mt-1 text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 line-clamp-2',
              completed && 'text-kawaii-neutral-500 dark:text-kawaii-neutral-500'
            )}
          >
            {activity.notes}
          </p>
        )}

        {/* Travel time info (if available) */}
        {activity.travel_time_text && (
          <div className="mt-1 flex items-center gap-1 text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-500">
            <span>🚶</span>
            <span>{activity.travel_time_text}</span>
            {activity.travel_distance_text && (
              <>
                <span>•</span>
                <span>{activity.travel_distance_text}</span>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
