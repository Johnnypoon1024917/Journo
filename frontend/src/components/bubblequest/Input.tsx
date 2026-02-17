/**
 * BubbleQuest Input Component
 * 
 * A text input field with BubbleQuest styling and validation states.
 * 
 * Features:
 * - Touch-optimized with 44px minimum height
 * - BubbleQuest styling with rounded corners
 * - Validation states (default, error, success)
 * - Error messages and helper text
 * - Label support
 * - Focus ring animations
 * 
 * Requirements: 1.3, 1.4
 */

import React from 'react';
import { cn } from '@/utils/cn';

export type InputVariant = 'default' | 'error' | 'success';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = cn(
    'w-full px-4 py-3',
    'rounded-xl border-2',
    'text-base font-medium',
    'min-h-[44px]', // Touch-optimized minimum height
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'placeholder:text-bubblequest-neutral-400',
    'bg-white dark:bg-bubblequest-neutral-800',
    'text-bubblequest-neutral-900 dark:text-white'
  );
  
  const variantClasses = {
    default: cn(
      'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700',
      'focus:border-bubblequest-primary-500 focus:ring-bubblequest-primary-500/20',
      'hover:border-bubblequest-neutral-300 dark:hover:border-bubblequest-neutral-600'
    ),
    error: cn(
      'border-error-500 dark:border-error-400',
      'focus:border-error-600 focus:ring-error-500/20',
      'hover:border-error-600'
    ),
    success: cn(
      'border-success-500 dark:border-success-400',
      'focus:border-success-600 focus:ring-success-500/20',
      'hover:border-success-600'
    ),
  };
  
  const actualVariant = error ? 'error' : variant;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          baseClasses,
          variantClasses[actualVariant],
          className
        )}
        aria-invalid={actualVariant === 'error'}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="mt-2 text-sm text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
};
