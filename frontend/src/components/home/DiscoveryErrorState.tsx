/**
 * DiscoveryErrorState Component
 * 
 * Friendly error state for the discovery widget when API calls fail.
 * 
 * Features:
 * - Network error and API error handling
 * - Retry button for failed requests
 * - Friendly error messages
 * - Consistent with BubbleQuest design language
 * - Smooth animations
 * - Accessible with proper ARIA attributes
 * 
 * Requirements: Task 3.3
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface DiscoveryErrorStateProps {
  className?: string;
  error?: string;
  onRetry?: () => void;
}

export const DiscoveryErrorState: React.FC<DiscoveryErrorStateProps> = ({
  className,
  error = 'Something went wrong. Please try again.',
  onRetry
}) => {
  // Determine error type for better messaging
  const isNetworkError = error.toLowerCase().includes('network') || 
                         error.toLowerCase().includes('fetch') ||
                         error.toLowerCase().includes('connection');

  const errorTitle = isNetworkError 
    ? 'Connection Issue' 
    : 'Oops! Something went wrong';

  const errorEmoji = isNetworkError ? '📡' : '😔';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'bg-red-50 dark:bg-red-900/20',
        'border-2 border-red-200 dark:border-red-800',
        'rounded-2xl p-8 md:p-12',
        'text-center',
        'shadow-sm',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <motion.div
        className="mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
      >
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <span className="text-7xl md:text-8xl" role="img" aria-label={errorTitle}>
            {errorEmoji}
          </span>
        </motion.div>
      </motion.div>

      {/* Error Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h3 className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-300 mb-3">
          {errorTitle}
        </h3>
        <p className="text-base md:text-lg text-red-600 dark:text-red-400 mb-6 max-w-md mx-auto">
          {error}
        </p>
        {/* Retry Button */}
        {onRetry && (
          <motion.button
            onClick={onRetry}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'px-8 py-3 rounded-xl',
              'bg-red-600 hover:bg-red-700',
              'dark:bg-red-700 dark:hover:bg-red-800',
              'text-white font-semibold text-base',
              'shadow-md hover:shadow-lg',
              'transition-all duration-200',
              'focus:outline-none focus:ring-3 focus:ring-red-500 focus:ring-offset-2',
              'inline-flex items-center gap-2'
            )}
            aria-label="Retry loading destinations"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </motion.button>
        )}

        {/* Helpful Tips for Network Errors */}
        {isNetworkError && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-xl p-4 border border-red-300 dark:border-red-700">
              <p className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                <span className="text-lg flex-shrink-0" role="img" aria-hidden="true">💡</span>
                <span>
                  <strong className="font-semibold">Tip:</strong> Check your internet connection and try again. If the problem persists, we might be experiencing technical difficulties.
                </span>
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
