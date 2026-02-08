/**
 * Badge Atom Component
 * 
 * Small status and labeling component with various styles and states.
 * Supports dot indicators and different semantic variants.
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import type { BadgeAtomProps } from '../types';

const Badge = forwardRef<HTMLSpanElement, BadgeAtomProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      className,
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = cn(
      'inline-flex items-center justify-center',
      'font-medium text-center',
      'rounded-full',
      'transition-colors duration-200',
      dot ? 'w-2 h-2 p-0' : 'px-2 py-0.5 gap-1'
    );

    // Variant styles
    const variantStyles = {
      default: cn(
        'bg-neutral-100 text-neutral-800',
        'dark:bg-neutral-700 dark:text-neutral-200'
      ),
      primary: cn(
        'bg-primary-100 text-primary-800',
        'dark:bg-primary-900 dark:text-primary-200'
      ),
      secondary: cn(
        'bg-secondary-100 text-secondary-800',
        'dark:bg-secondary-900 dark:text-secondary-200'
      ),
      success: cn(
        'bg-success-100 text-success-800',
        'dark:bg-success-900 dark:text-success-200'
      ),
      warning: cn(
        'bg-warning-100 text-warning-800',
        'dark:bg-warning-900 dark:text-warning-200'
      ),
      error: cn(
        'bg-error-100 text-error-800',
        'dark:bg-error-900 dark:text-error-200'
      ),
      info: cn(
        'bg-info-100 text-info-800',
        'dark:bg-info-900 dark:text-info-200'
      ),
    };

    // Size styles (only applies when not dot)
    const sizeStyles = {
      xs: 'text-xs px-1.5 py-0.5',
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-0.5',
      lg: 'text-sm px-3 py-1',
      xl: 'text-base px-4 py-1',
    };

    // Dot size styles
    const dotSizeStyles = {
      xs: 'w-1 h-1',
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
      xl: 'w-3 h-3',
    };

    // Combine styles
    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      dot ? dotSizeStyles[size] : sizeStyles[size],
      className
    );

    return (
      <span
        ref={ref}
        className={combinedClassName}
        data-testid={testId}
        {...props}
      >
        {!dot && children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };