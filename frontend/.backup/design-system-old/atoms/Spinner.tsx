/**
 * Spinner Atom Component
 * 
 * Loading spinner with various sizes and styles.
 * Includes accessibility support and smooth animations.
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import type { AtomProps } from '../types';

interface SpinnerProps extends AtomProps {
  variant?: 'default' | 'primary' | 'white';
  speed?: 'slow' | 'normal' | 'fast';
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      size = 'md',
      variant = 'default',
      speed = 'normal',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Size styles
    const sizeStyles = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
    };

    // Variant styles
    const variantStyles = {
      default: 'text-neutral-600 dark:text-neutral-400',
      primary: 'text-primary-600 dark:text-primary-400',
      white: 'text-white',
    };

    // Speed styles
    const speedStyles = {
      slow: 'animate-spin [animation-duration:2s]',
      normal: 'animate-spin [animation-duration:1s]',
      fast: 'animate-spin [animation-duration:0.5s]',
    };

    // Base styles
    const baseStyles = cn(
      'inline-block',
      sizeStyles[size],
      variantStyles[variant],
      speedStyles[speed]
    );

    return (
      <div
        ref={ref}
        className={cn(baseStyles, className)}
        role="status"
        aria-label="Loading"
        data-testid={testId}
        {...props}
      >
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner };