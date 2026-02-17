/**
 * BubbleQuest Checkbox Component
 * 
 * A checkbox input with BubbleQuest styling and animations.
 * 
 * Features:
 * - Touch-optimized with 44px minimum target size
 * - BubbleQuest styling with rounded corners
 * - Smooth check/uncheck animations
 * - Label support
 * - Disabled state
 * 
 * Requirements: 1.3, 1.4
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  helperText,
  className,
  id,
  checked,
  disabled,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
  const checkmarkVariants = {
    unchecked: { pathLength: 0, opacity: 0 },
    checked: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        pathLength: { type: "spring" as const, duration: 0.3, bounce: 0 },
        opacity: { duration: 0.1 }
      }
    }
  };
  
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="relative flex items-center justify-center min-h-[44px] min-w-[44px]">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <label
          htmlFor={checkboxId}
          className={cn(
            'flex items-center justify-center',
            'w-6 h-6 rounded-lg border-2',
            'transition-all duration-200 cursor-pointer',
            'peer-checked:bg-bubblequest-primary-500 peer-checked:border-bubblequest-primary-500',
            'peer-focus:ring-2 peer-focus:ring-bubblequest-primary-500/20 peer-focus:ring-offset-1',
            'border-bubblequest-neutral-300 dark:border-bubblequest-neutral-600',
            'hover:border-bubblequest-primary-400 dark:hover:border-bubblequest-primary-400',
            'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
            'bg-white dark:bg-bubblequest-neutral-800'
          )}
        >
          <motion.svg
            className="w-4 h-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial="unchecked"
            animate={checked ? "checked" : "unchecked"}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              variants={checkmarkVariants}
            />
          </motion.svg>
        </label>
      </div>
      {(label || helperText) && (
        <div className="flex-1 pt-2">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'block text-sm font-medium cursor-pointer',
                'text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {label}
            </label>
          )}
          {helperText && (
            <p className="mt-1 text-sm text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
