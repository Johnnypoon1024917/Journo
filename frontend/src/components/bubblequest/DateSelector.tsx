/**
 * BubbleQuest DateSelector Component
 * 
 * Horizontal scrollable date pills for navigating between trip days.
 * 
 * Features:
 * - Horizontal scrollable date pills with rounded capsule design
 * - Selected date highlighting with pink theme
 * - Smooth scroll animations with snap-to-center
 * - Touch-optimized with swipe gestures
 * - Auto-scroll to selected date
 * - Responsive design matching exact specification
 * 
 * Requirements: 9.2
 */

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay, isToday, isPast } from 'date-fns';
import { cn } from '@/utils/cn';

export interface DateSelectorProps {
  dates: Date[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

/**
 * Individual date pill component matching exact design specification
 */
const DatePill: React.FC<{
  date: Date;
  isSelected: boolean;
  onClick: () => void;
}> = ({ date, isSelected, onClick }) => {
  const dayOfWeek = format(date, 'EEE'); // Wed, Thu, Fri
  const dayOfMonth = format(date, 'd'); // 14, 15, 16
  const isPastDay = isPast(date) && !isToday(date) && !isSelected;
  const isTodayDate = isToday(date);

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 flex flex-col items-center justify-center',
        'relative',
        'min-w-[72px] sm:min-w-[88px] min-h-[84px] sm:min-h-[100px]',
        'rounded-[24px] sm:rounded-[32px]', // Slightly less rounded on mobile
        'transition-all duration-200',
        'focus:outline-none',
        'touch-manipulation',
        // Background
        isSelected
          ? 'bg-gradient-to-br from-pink-50 to-pink-100' // Very light pink fill
          : 'bg-white',
        // Border
        isSelected
          ? 'border-2 border-pink-400' // Solid pink border
          : 'border border-gray-200', // Subtle light gray border
        // Shadow
        isSelected && 'shadow-md'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      animate={{
        scale: isSelected ? 1.05 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
      {/* Day of week pill at top */}
      <div
        className={cn(
          'rounded-xl sm:rounded-2xl px-2 sm:px-3 py-0.5 sm:py-1 mb-1.5 sm:mb-2',
          'text-[10px] sm:text-xs font-semibold uppercase tracking-wide',
          isSelected
            ? 'bg-pink-400 text-white' // Solid pink background with white text
            : isPastDay
            ? 'bg-gray-100 text-gray-400 opacity-70' // Desaturated for past days
            : 'bg-gray-100 text-gray-600' // Light gray for default
        )}
      >
        {dayOfWeek}
      </div>

      {/* Date number */}
      <div
        className={cn(
          'text-3xl sm:text-4xl font-black leading-none',
          isSelected
            ? 'text-pink-500' // Pink for selected
            : isPastDay
            ? 'text-gray-400 opacity-60' // Desaturated for past days
            : 'text-gray-900' // Dark gray/black for default
        )}
      >
        {dayOfMonth}
      </div>

      {/* Today indicator */}
      {isTodayDate && !isSelected && (
        <div className="absolute bottom-1.5 sm:bottom-2 w-1.5 h-1.5 rounded-full bg-pink-400" />
      )}
    </motion.button>
  );
};

export const DateSelector: React.FC<DateSelectorProps> = ({
  dates,
  selectedDate,
  onDateSelect,
  className,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedDateRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected date when it changes
  useEffect(() => {
    if (scrollContainerRef.current && selectedDateRef.current) {
      const container = scrollContainerRef.current;
      const selectedElement = selectedDateRef.current;

      // Calculate the scroll position to center the selected date
      const containerWidth = container.offsetWidth;
      const elementLeft = selectedElement.offsetLeft;
      const elementWidth = selectedElement.offsetWidth;
      const scrollPosition = elementLeft - containerWidth / 2 + elementWidth / 2;

      // Smooth scroll to the calculated position
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth',
        });
      } else {
        // Fallback for environments without scrollTo
        container.scrollLeft = scrollPosition;
      }
    }
  }, [selectedDate]);

  if (!dates || dates.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative bg-transparent', className)}>
      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex gap-2 sm:gap-3 overflow-x-auto',
          'px-3 sm:px-5 py-2 sm:py-3', // Reduced padding on mobile
          // Hide scrollbar
          '[&::-webkit-scrollbar]:hidden',
          '[-ms-overflow-style:none]',
          '[scrollbar-width:none]',
          // Smooth inertia scroll
          'scroll-smooth'
        )}
        style={{
          scrollSnapType: 'x mandatory',
        }}
      >
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          return (
            <div
              key={date.toISOString()}
              ref={isSelected ? selectedDateRef : null}
              style={{ scrollSnapAlign: 'center' }}
            >
              <DatePill
                date={date}
                isSelected={isSelected}
                onClick={() => onDateSelect(date)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
