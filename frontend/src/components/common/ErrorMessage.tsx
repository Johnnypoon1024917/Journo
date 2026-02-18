/**
 * ErrorMessage Component
 * 
 * Reusable error message component with consistent styling
 * Includes ARIA live region for screen reader announcements
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'banner' | 'modal';
  className?: string;
}

export function ErrorMessage({
  message,
  onRetry,
  onDismiss,
  variant = 'inline',
  className,
}: ErrorMessageProps) {
  const variantStyles = {
    inline: 'p-4 rounded-lg border-2',
    banner: 'p-4 border-l-4',
    modal: 'p-6 rounded-xl border-2 shadow-lg',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'bg-error-50 border-error-500 text-error-900',
        'dark:bg-error-900/20 dark:border-error-500 dark:text-error-100',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <svg
          className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md',
                'bg-error-600 text-white',
                'hover:bg-error-700',
                'focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
              aria-label="Retry action"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                'p-1 rounded-md',
                'text-error-500 hover:text-error-700',
                'hover:bg-error-100 dark:hover:bg-error-900/30',
                'focus:outline-none focus:ring-2 focus:ring-error-500',
                'transition-colors duration-200'
              )}
              aria-label="Dismiss error"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
