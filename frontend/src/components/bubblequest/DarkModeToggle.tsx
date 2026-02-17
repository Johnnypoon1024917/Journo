/**
 * DarkModeToggle Component
 * 
 * A toggle switch for enabling/disabling dark mode with smooth animations.
 * Changes are applied immediately.
 * 
 * Features:
 * - Toggle switch with smooth animation
 * - Apply dark mode immediately
 * - Sun/Moon icons for visual feedback
 * - Touch-optimized with 44px minimum target
 * - Animated transition between states
 * 
 * Requirements: 6.4
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useBubbleQuestThemeStore } from '@/stores/bubbleQuestThemeStore';
import { cn } from '@/utils/cn';
import { Card } from './Card';

export interface DarkModeToggleProps {
  className?: string;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  className,
}) => {
  const { darkMode, setDarkMode } = useBubbleQuestThemeStore();

  const handleToggle = () => {
    // Dark mode is currently disabled
    // setDarkMode(!darkMode);
  };

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-bubblequest-neutral-800 dark:text-bubblequest-neutral-100 mb-2">
            Dark Mode
          </h3>
          <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
            Currently disabled for better visibility
          </p>
        </div>

        {/* Toggle Switch - Disabled */}
        <button
          onClick={handleToggle}
          disabled={true}
          className={cn(
            'relative inline-flex items-center h-12 w-24 rounded-full',
            'min-h-[44px] min-w-[88px]',
            'transition-colors duration-300',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bubblequest-primary-500',
            'bg-gradient-to-r from-amber-400 to-orange-400',
            'opacity-50 cursor-not-allowed'
          )}
          role="switch"
          aria-checked={false}
          aria-label="Dark mode (disabled)"
        >
          {/* Toggle Thumb */}
          <motion.div
            className={cn(
              'absolute w-10 h-10 rounded-full bg-white shadow-lg',
              'flex items-center justify-center'
            )}
            animate={{
              x: 4, // Always in light mode position
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          >
            {/* Icon */}
            <motion.div
              key="sun"
              initial={{ rotate: 0, opacity: 1 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Sun Icon */}
              <svg
                className="w-6 h-6 text-amber-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
          </motion.div>

          {/* Background Icons */}
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
            {/* Sun icon on left */}
            <motion.div
              animate={{
                opacity: 0,
                scale: 0.8,
              }}
              transition={{ duration: 0.3 }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>

            {/* Moon icon on right */}
            <motion.div
              animate={{
                opacity: 0.3,
                scale: 0.8,
              }}
              transition={{ duration: 0.3 }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                />
              </svg>
            </motion.div>
          </div>
        </button>
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-3 rounded-lg bg-bubblequest-neutral-50 dark:bg-bubblequest-neutral-800 border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700"
      >
        <p className="text-xs text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
          <span className="font-medium">Light mode is active.</span> Dark mode is temporarily disabled for better visibility and contrast.
        </p>
      </motion.div>
    </Card>
  );
};
