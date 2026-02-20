/**
 * SkeletonCard Component
 * 
 * Reusable skeleton loader component for displaying loading states.
 * Matches card dimensions and uses BubbleQuest colors for consistency.
 * 
 * Features:
 * - Multiple variants (trip, destination, default)
 * - Smooth fade-in animation when content loads
 * - Matches actual card dimensions
 * - Uses BubbleQuest color palette
 * - Accessible loading state
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface SkeletonCardProps {
  variant?: 'trip' | 'destination' | 'default';
  className?: string;
  count?: number;
}

/**
 * Individual skeleton card component
 */
const SkeletonCardItem: React.FC<{ variant: 'trip' | 'destination' | 'default'; className?: string }> = ({ 
  variant, 
  className 
}) => {
  if (variant === 'trip') {
    return (
      <motion.div
        className={cn(
          'bg-white dark:bg-bubblequest-neutral-800',
          'rounded-3xl overflow-hidden',
          'shadow-lg',
          'animate-pulse',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Cover Photo Skeleton */}
        <div className="relative h-56 bg-gradient-to-br from-bubblequest-primary-100 to-bubblequest-secondary-100 dark:from-bubblequest-primary-900/30 dark:to-bubblequest-secondary-900/30">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div className="h-7 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded-lg w-3/4"></div>
          
          {/* Date Badge */}
          <div className="flex items-center gap-2">
            <div className="h-8 bg-bubblequest-primary-100 dark:bg-bubblequest-primary-900/30 rounded-full w-32"></div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-full"></div>
            <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-5/6"></div>
          </div>

          {/* Collaborators */}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-8 h-8 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded-full"></div>
            <div className="w-8 h-8 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded-full"></div>
            <div className="w-8 h-8 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded-full"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'destination') {
    return (
      <motion.div
        className={cn(
          'bg-white dark:bg-bubblequest-neutral-800',
          'rounded-2xl overflow-hidden',
          'shadow-md',
          'flex-shrink-0',
          'w-80',
          'animate-pulse',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Cover Photo Skeleton */}
        <div className="relative h-48 bg-gradient-to-br from-bubblequest-teal-100 to-bubblequest-blue-100 dark:from-bubblequest-teal-900/30 dark:to-bubblequest-blue-900/30">
          <div className="absolute top-3 right-3">
            <div className="h-8 w-16 bg-white/30 dark:bg-black/30 rounded-full"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-5 space-y-3">
          {/* Country Name */}
          <div className="h-6 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded-lg w-2/3"></div>
          
          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-full"></div>
            <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-4/5"></div>
          </div>

          {/* Button */}
          <div className="h-10 bg-bubblequest-primary-100 dark:bg-bubblequest-primary-900/30 rounded-xl w-full mt-4"></div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-bubblequest-neutral-800',
        'rounded-2xl',
        'p-6',
        'shadow-md',
        'animate-pulse',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        {/* Icon/Image Skeleton */}
        <div className="w-16 h-16 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded-xl flex-shrink-0"></div>
        
        {/* Content Skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-3/4"></div>
          <div className="h-4 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 rounded w-1/2"></div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Main SkeletonCard component that can render multiple skeleton cards
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  variant = 'default', 
  className,
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCardItem 
          key={index} 
          variant={variant} 
          className={className}
        />
      ))}
    </>
  );
};

/**
 * Skeleton loader specifically for trip cards grid
 */
export const TripCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="status" aria-label="Loading trips">
      <SkeletonCard variant="trip" count={count} />
      <span className="sr-only">Loading trips...</span>
    </div>
  );
};

/**
 * Skeleton loader specifically for destination results
 */
export const DestinationCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div 
      className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar"
      role="status" 
      aria-label="Loading destinations"
    >
      <SkeletonCard variant="destination" count={count} />
      <span className="sr-only">Loading destinations...</span>
    </div>
  );
};
