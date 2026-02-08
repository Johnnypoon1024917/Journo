/**
 * Kawaii CountdownTimer Component
 * 
 * Displays time remaining until trip departure with animated transitions.
 * 
 * Features:
 * - Calculates and displays days, hours, minutes, seconds until departure
 * - Updates every second with smooth number transitions
 * - Progress bar with plane icon
 * - Framer Motion animations for number changes
 * - Touch-optimized layout
 * 
 * Requirements: 2.2, 9.1
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface CountdownTimerProps {
  departureDate: Date;
  createdDate?: Date; // When the trip was created/scheduled
  className?: string;
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  progress: number; // 0-100
  isExpired: boolean;
}

/**
 * Calculate countdown from current time to departure date
 * Also calculates progress from creation date to departure date
 */
const calculateCountdown = (departureDate: Date, createdDate?: Date): CountdownState => {
  const now = new Date();
  const departure = new Date(departureDate);
  const diff = departure.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      progress: 0, // Empty bar when trip has started (countdown complete)
      isExpired: true,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // Calculate progress from creation date to departure date
  let progress = 0;
  if (createdDate) {
    const created = new Date(createdDate);
    const totalDuration = departure.getTime() - created.getTime();
    const remaining = departure.getTime() - now.getTime();
    
    if (totalDuration > 0) {
      // Progress shows remaining time as percentage (100% at creation, 0% at departure)
      progress = (remaining / totalDuration) * 100;
    }
  } else {
    // Fallback: use 30 days as reference if no creation date
    const referenceDays = 30;
    const totalReferenceSeconds = referenceDays * 24 * 60 * 60;
    const remainingSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
    
    if (remainingSeconds >= totalReferenceSeconds) {
      progress = 100; // Full bar if more than 30 days away
    } else {
      // Progress from 100% (30 days away) to 0% (departure)
      progress = (remainingSeconds / totalReferenceSeconds) * 100;
    }
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    progress: Math.max(0, Math.min(100, progress)),
    isExpired: false,
  };
};

/**
 * Animated number display with flip animation
 */
const AnimatedNumber: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-3xl sm:text-4xl font-bold text-kawaii-primary-600 dark:text-kawaii-primary-400">
              {value.toString().padStart(2, '0')}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-xs sm:text-sm font-medium text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mt-1">
        {label}
      </span>
    </div>
  );
};

/**
 * Plane icon for progress bar
 */
const PlaneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
);

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  departureDate,
  createdDate,
  className,
}) => {
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    calculateCountdown(departureDate, createdDate)
  );

  useEffect(() => {
    // Update countdown every second
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(departureDate, createdDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [departureDate, createdDate]);

  // Format departure date
  const formattedDate = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(departureDate));

  // If trip has started, show zeros
  const displayDays = countdown.isExpired ? 0 : countdown.days;
  const displayHours = countdown.isExpired ? 0 : countdown.hours;
  const displayMinutes = countdown.isExpired ? 0 : countdown.minutes;
  const displaySeconds = countdown.isExpired ? 0 : countdown.seconds;
  const displayProgress = countdown.isExpired ? 100 : countdown.progress;

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-800',
        'rounded-3xl p-6 shadow-kawaii-sm',
        'border-2 border-neutral-200 dark:border-neutral-700',
        className
      )}
    >
      {/* Label */}
      <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
        距離出發
      </h3>

      {/* Countdown Display - Compact Format */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-5xl font-bold text-kawaii-600 dark:text-kawaii-400">
          {displayDays}
        </span>
        <span className="text-lg text-neutral-600 dark:text-neutral-400">天</span>
        
        <span className="text-3xl font-bold text-kawaii-600 dark:text-kawaii-400 ml-2">
          {displayHours.toString().padStart(2, '0')}
        </span>
        <span className="text-lg text-neutral-600 dark:text-neutral-400">:</span>
        
        <span className="text-3xl font-bold text-kawaii-600 dark:text-kawaii-400">
          {displayMinutes.toString().padStart(2, '0')}
        </span>
        <span className="text-lg text-neutral-600 dark:text-neutral-400">:</span>
        
        <span className="text-3xl font-bold text-kawaii-600 dark:text-kawaii-400">
          {displaySeconds.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Progress Bar with Plane Icon */}
      <div className="relative mb-4">
        {/* Progress Bar Background */}
        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          {/* Progress Bar Fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-kawaii-400 to-kawaii-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Plane Icon */}
        <motion.div
          className="absolute -top-2 transform -translate-x-1/2"
          initial={{ left: '0%' }}
          animate={{ left: `${displayProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <PlaneIcon className="w-8 h-8 text-neutral-800 dark:text-neutral-200 drop-shadow-md" />
          </motion.div>
        </motion.div>
      </div>

      {/* Departure Date */}
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {formattedDate} 出發
      </p>
    </div>
  );
};
