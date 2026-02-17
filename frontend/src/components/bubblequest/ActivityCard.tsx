/**
 * ActivityCard Component
 * 
 * Displays an individual activity/place in the schedule with time, location, and drag handle.
 * Supports drag-and-drop reordering and click to edit.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import type { Place } from '@/types/trip';

interface ActivityCardProps {
  activity: Place;
  time?: string;
  duration?: number;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  className?: string;
}

/**
 * Get category emoji
 */
const getCategoryEmoji = (placeType?: string): string => {
  if (!placeType) return '📍';
  
  const lowerType = placeType.toLowerCase();
  
  if (lowerType.includes('food')) return '🍽️';
  if (lowerType.includes('attraction')) return '🎨';
  if (lowerType.includes('hotel')) return '🏨';
  if (lowerType.includes('transport')) return '🚉';
  if (lowerType.includes('other')) return '📍';
  
  return '📍';
};

/**
 * Format duration in minutes to readable string
 */
const formatDuration = (minutes?: number): string => {
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

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  time,
  duration,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false,
  className,
}) => {
  const { t } = useTranslation('bubbleQuest');
  
  const categoryEmoji = getCategoryEmoji(activity.place_type || undefined);
  const durationText = formatDuration(duration);

  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-bubblequest-neutral-800 rounded-2xl p-4',
        'border-2 border-[#d5d0c2] dark:border-bubblequest-neutral-700',
        'shadow-bubblequest-sm hover:shadow-bubblequest-md transition-all',
        'cursor-pointer select-none',
        isDragging && 'opacity-50 scale-95',
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      layout
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="flex flex-col items-center gap-1 pt-1 cursor-grab active:cursor-grabbing">
          <div className="w-1 h-1 rounded-full bg-bubblequest-neutral-400 dark:bg-bubblequest-neutral-500" />
          <div className="w-1 h-1 rounded-full bg-bubblequest-neutral-400 dark:bg-bubblequest-neutral-500" />
          <div className="w-1 h-1 rounded-full bg-bubblequest-neutral-400 dark:bg-bubblequest-neutral-500" />
          <div className="w-1 h-1 rounded-full bg-bubblequest-neutral-400 dark:bg-bubblequest-neutral-500" />
          <div className="w-1 h-1 rounded-full bg-bubblequest-neutral-400 dark:bg-bubblequest-neutral-500" />
          <div className="w-1 h-1 rounded-full bg-bubblequest-neutral-400 dark:bg-bubblequest-neutral-500" />
        </div>

        {/* Time */}
        {time && (
          <div className="flex flex-col items-center min-w-[60px]">
            <span className="text-lg font-bold text-bubblequest-primary-600 dark:text-bubblequest-primary-400">
              {time}
            </span>
            {durationText && (
              <span className="text-xs text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
                {durationText}
              </span>
            )}
          </div>
        )}

        {/* Category Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-bubblequest-primary-100 dark:bg-bubblequest-primary-900/30 flex items-center justify-center text-2xl">
            {categoryEmoji}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-1 truncate">
            {activity.name}
          </h4>
          
          {activity.address && (
            <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 truncate">
              {activity.address}
            </p>
          )}

          {activity.notes && (
            <p className="text-sm text-bubblequest-neutral-500 dark:text-bubblequest-neutral-500 mt-2 line-clamp-2">
              {activity.notes}
            </p>
          )}
        </div>

        {/* More Options */}
        <motion.button
          className="flex-shrink-0 min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-bubblequest-neutral-100 dark:hover:bg-bubblequest-neutral-700 transition-colors flex items-center justify-center"
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Show options menu
          }}
          aria-label={t('common.more')}
        >
          <svg
            className="w-5 h-5 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};
