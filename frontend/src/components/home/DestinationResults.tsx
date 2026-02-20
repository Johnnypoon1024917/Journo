/**
 * DestinationResults Component
 * 
 * Horizontal scrollable container for displaying 3-6 destination result cards.
 * 
 * Features:
 * - Horizontal scrollable container
 * - Smooth scroll behavior
 * - Touch-friendly swipe on mobile
 * - Displays 3-6 destination cards
 * - Responsive design
 * - Keyboard navigation support
 * 
 * Requirements: Task 3.2
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { CountryRecommendation } from '../../types/countryRecommendation';
import { DestinationResultCard } from './DestinationResultCard';
import { cn } from '../../utils/cn';

export interface DestinationResultsProps {
  countries: CountryRecommendation[];
  onPlanTrip?: (country: CountryRecommendation) => void;
  className?: string;
}

export const DestinationResults: React.FC<DestinationResultsProps> = ({
  countries,
  onPlanTrip,
  className
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll left/right handlers for navigation buttons
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -360,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 360,
        behavior: 'smooth'
      });
    }
  };

  if (countries.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Header */}
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="text-2xl md:text-3xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-2">
          Perfect destinations for you ✨
        </h3>
        <p className="text-base text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
          Swipe to explore more amazing places
        </p>
      </motion.div>

      {/* Scroll Container */}
      <div className="relative">
        {/* Left Scroll Button - Hidden on mobile */}
        {countries.length > 2 && (
          <button
            onClick={scrollLeft}
            className={cn(
              'hidden md:flex',
              'absolute left-0 top-1/2 -translate-y-1/2 z-10',
              'w-12 h-12 rounded-full',
              'bg-white dark:bg-bubblequest-neutral-800',
              'shadow-xl border-2 border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700',
              'items-center justify-center',
              'hover:scale-110 active:scale-95',
              'transition-all duration-200',
              'focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500',
              '-ml-6'
            )}
            aria-label="Scroll left"
          >
            <svg
              className="w-6 h-6 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Scrollable Cards Container */}
        <div
          ref={scrollContainerRef}
          className={cn(
            'flex gap-6 overflow-x-auto',
            'pb-4 px-2',
            'scroll-smooth',
            // Hide scrollbar but keep functionality
            'scrollbar-hide',
            // Enable momentum scrolling on iOS
            '[overflow-scrolling:touch]',
            // Snap to cards on scroll
            'snap-x snap-mandatory'
          )}
          role="list"
          aria-label="Destination recommendations"
        >
          {countries.map((country, index) => (
            <div
              key={country.id}
              className="snap-start"
              role="listitem"
            >
              <DestinationResultCard
                country={country}
                onPlanTrip={onPlanTrip}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Right Scroll Button - Hidden on mobile */}
        {countries.length > 2 && (
          <button
            onClick={scrollRight}
            className={cn(
              'hidden md:flex',
              'absolute right-0 top-1/2 -translate-y-1/2 z-10',
              'w-12 h-12 rounded-full',
              'bg-white dark:bg-bubblequest-neutral-800',
              'shadow-xl border-2 border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700',
              'items-center justify-center',
              'hover:scale-110 active:scale-95',
              'transition-all duration-200',
              'focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500',
              '-mr-6'
            )}
            aria-label="Scroll right"
          >
            <svg
              className="w-6 h-6 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Scroll Indicator - Mobile only */}
      <div className="md:hidden mt-4 text-center">
        <p className="text-xs text-bubblequest-neutral-500 dark:text-bubblequest-neutral-500">
          ← Swipe to see more →
        </p>
      </div>
    </div>
  );
};
