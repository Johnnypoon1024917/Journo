/**
 * Button Atom Component
 * 
 * Modern, accessible button with touch optimization and micro-interactions.
 * Supports multiple variants, sizes, and states with smooth animations.
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { useResponsive } from '../../hooks/useResponsive';
import type { ButtonAtomProps } from '../types';

const Button = forwardRef<HTMLButtonElement, ButtonAtomProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      className,
      children,
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const { isTouch } = useResponsive();

    // Base styles with accessibility and touch optimization
    const baseStyles = cn(
      // Layout and display
      'inline-flex items-center justify-center gap-2',
      'font-medium text-center',
      'border border-transparent',
      'cursor-pointer select-none',
      
      // Accessibility
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      
      // Touch optimization
      'touch-manipulation tap-highlight-transparent',
      'min-h-touch min-w-touch',
      
      // Animations and transitions
      'transition-all duration-200 ease-out',
      'transform-gpu will-change-transform',
      
      // Micro-interactions
      !disabled && !loading && [
        'hover:shadow-md hover:-translate-y-0.5',
        'active:scale-95 active:translate-y-0',
        isTouch && 'active:bg-opacity-90'
      ]
    );

    // Variant styles
    const variantStyles = {
      primary: cn(
        'bg-primary-600 text-white border-primary-600',
        'hover:bg-primary-700 hover:border-primary-700',
        'focus-visible:ring-primary-500',
        'active:bg-primary-800',
        'dark:bg-primary-500 dark:hover:bg-primary-600'
      ),
      secondary: cn(
        'bg-white text-neutral-700 border-neutral-300',
        'hover:bg-neutral-50 hover:border-neutral-400',
        'focus-visible:ring-neutral-500',
        'active:bg-neutral-100',
        'dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-600',
        'dark:hover:bg-neutral-700 dark:hover:border-neutral-500'
      ),
      tertiary: cn(
        'bg-neutral-100 text-neutral-700 border-neutral-200',
        'hover:bg-neutral-200 hover:border-neutral-300',
        'focus-visible:ring-neutral-500',
        'active:bg-neutral-300',
        'dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600',
        'dark:hover:bg-neutral-600'
      ),
      danger: cn(
        'bg-error-600 text-white border-error-600',
        'hover:bg-error-700 hover:border-error-700',
        'focus-visible:ring-error-500',
        'active:bg-error-800',
        'dark:bg-error-500 dark:hover:bg-error-600'
      ),
      ghost: cn(
        'bg-transparent text-neutral-700 border-transparent',
        'hover:bg-neutral-100',
        'focus-visible:ring-neutral-500',
        'active:bg-neutral-200',
        'dark:text-neutral-200 dark:hover:bg-neutral-800'
      ),
      link: cn(
        'bg-transparent text-primary-600 border-transparent p-0 h-auto min-h-0 min-w-0',
        'hover:text-primary-700 hover:underline',
        'focus-visible:ring-primary-500',
        'active:text-primary-800',
        'dark:text-primary-400 dark:hover:text-primary-300'
      ),
    };

    // Size styles with touch-friendly targets
    const sizeStyles = {
      xs: cn(
        'px-2.5 py-1.5 text-xs rounded-md',
        isTouch && 'px-3 py-2 min-h-touch-sm'
      ),
      sm: cn(
        'px-3 py-2 text-sm rounded-md',
        isTouch && 'px-4 py-2.5 min-h-touch'
      ),
      md: cn(
        'px-4 py-2.5 text-base rounded-lg',
        isTouch && 'px-5 py-3 min-h-touch-lg'
      ),
      lg: cn(
        'px-6 py-3 text-lg rounded-lg',
        isTouch && 'px-7 py-4 min-h-touch-xl'
      ),
      xl: cn(
        'px-8 py-4 text-xl rounded-xl',
        isTouch && 'px-10 py-5 min-h-touch-xl'
      ),
    };

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4 flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
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
    );

    // Content rendering with icon support
    const renderContent = () => {
      if (loading) {
        return (
          <>
            <LoadingSpinner />
            <span className="sr-only">Loading...</span>
            {children && <span className="truncate">{children}</span>}
          </>
        );
      }

      if (icon && children) {
        return (
          <>
            {iconPosition === 'left' && (
              <span className="flex-shrink-0" aria-hidden="true">
                {icon}
              </span>
            )}
            <span className="truncate">{children}</span>
            {iconPosition === 'right' && (
              <span className="flex-shrink-0" aria-hidden="true">
                {icon}
              </span>
            )}
          </>
        );
      }

      if (icon && !children) {
        return (
          <span className="flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        );
      }

      return children;
    };

    // Combine all styles
    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      widthStyles,
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClassName}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        onClick={onClick}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };