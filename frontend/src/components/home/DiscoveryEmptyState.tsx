/**
 * DiscoveryEmptyState Component
 * 
 * Friendly empty state for the discovery widget when no destinations are found.
 * 
 * Features:
 * - Cute sad suitcase illustration
 * - Encouraging message to try different preferences
 * - Consistent with BubbleQuest design language
 * - Smooth animations
 * - Accessible with proper ARIA attributes
 * 
 * Requirements: Task 3.3
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface DiscoveryEmptyStateProps {
  className?: string;
  message?: string;
}

export const DiscoveryEmptyState: React.FC<DiscoveryEmptyStateProps> = ({
  className,
  message = "Try selecting a different month or weather!"
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'bg-white dark:bg-bubblequest-neutral-800',
        'rounded-2xl p-8 md:p-12',
        'text-center',
        'border-2 border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700',
        'shadow-sm',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Sad Suitcase Illustration */}
      <motion.div
        className="mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
      >
        <div className="relative inline-block">
          {/* Main Suitcase */}
          <motion.div
            animate={{
              rotate: [-2, 2, -2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <span className="text-7xl md:text-8xl" role="img" aria-label="Sad suitcase">
              🧳
            </span>
          </motion.div>
          
          {/* Sad Face Overlay */}
          <motion.div
            className="absolute -bottom-2 -right-2"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <span className="text-3xl" role="img" aria-hidden="true">
              😔
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h3 className="text-xl md:text-2xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-3">
          No destinations found
        </h3>
        <p className="text-base md:text-lg text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mb-6">
          {message}
        </p>
        
        {/* Helpful Tips */}
        <div className="max-w-md mx-auto">
          <div className="bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 rounded-xl p-4 border border-bubblequest-primary-200 dark:border-bubblequest-primary-800">
            <p className="text-sm text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 flex items-start gap-2">
              <span className="text-lg flex-shrink-0" role="img" aria-hidden="true">💡</span>
              <span>
                <strong className="font-semibold">Tip:</strong> Try changing your travel month or selecting "Any" weather preference for more options!
              </span>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
