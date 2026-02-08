/**
 * Input Atom Component
 * 
 * Modern, accessible input field with validation states and touch optimization.
 * Supports various types, states, and real-time validation feedback.
 */

import React, { forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { useResponsive } from '../../hooks/useResponsive';
import type { InputAtomProps } from '../types';

const Input = forwardRef<HTMLInputElement, InputAtomProps>(
  (
    {
      type = 'text',
      size = 'md',
      variant = 'default',
      placeholder,
      value,
      defaultValue,
      onChange,
      onKeyDown,
      onFocus,
      onBlur,
      required = false,
      disabled = false,
      readOnly = false,
      autoComplete,
      autoFocus = false,
      maxLength,
      minLength,
      pattern,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const { isTouch } = useResponsive();
    const [isFocused, setIsFocused] = useState(false);

    // Base styles with accessibility and touch optimization
    const baseStyles = cn(
      // Layout and sizing
      'w-full px-3 py-2',
      'border rounded-lg',
      'font-medium text-base',
      
      // Touch optimization - prevent zoom on iOS
      'text-base',
      isTouch && 'min-h-touch',
      
      // Accessibility and interaction
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'read-only:cursor-default read-only:bg-neutral-50',
      
      // Transitions
      'transition-all duration-200 ease-out',
      'placeholder:text-neutral-400 placeholder:transition-colors',
      
      // Dark mode support
      'dark:bg-neutral-800 dark:border-neutral-600',
      'dark:text-white dark:placeholder:text-neutral-500',
      'dark:read-only:bg-neutral-700'
    );

    // Variant styles
    const variantStyles = {
      default: cn(
        'bg-white text-neutral-900 border-neutral-300',
        'hover:border-neutral-400',
        'focus:border-primary-500 focus:ring-primary-500',
        isFocused && 'border-primary-500 ring-2 ring-primary-500 ring-opacity-20'
      ),
      error: cn(
        'bg-white text-neutral-900 border-error-500',
        'hover:border-error-600',
        'focus:border-error-500 focus:ring-error-500',
        isFocused && 'border-error-500 ring-2 ring-error-500 ring-opacity-20'
      ),
      success: cn(
        'bg-white text-neutral-900 border-success-500',
        'hover:border-success-600',
        'focus:border-success-500 focus:ring-success-500',
        isFocused && 'border-success-500 ring-2 ring-success-500 ring-opacity-20'
      ),
      warning: cn(
        'bg-white text-neutral-900 border-warning-500',
        'hover:border-warning-600',
        'focus:border-warning-500 focus:ring-warning-500',
        isFocused && 'border-warning-500 ring-2 ring-warning-500 ring-opacity-20'
      ),
    };

    // Size styles
    const sizeStyles = {
      xs: cn(
        'px-2 py-1 text-xs rounded-md',
        isTouch && 'px-3 py-2 min-h-touch-sm'
      ),
      sm: cn(
        'px-2.5 py-1.5 text-sm rounded-md',
        isTouch && 'px-3 py-2 min-h-touch'
      ),
      md: cn(
        'px-3 py-2 text-base rounded-lg',
        isTouch && 'px-4 py-2.5 min-h-touch-lg'
      ),
      lg: cn(
        'px-4 py-3 text-lg rounded-lg',
        isTouch && 'px-5 py-3.5 min-h-touch-xl'
      ),
      xl: cn(
        'px-5 py-4 text-xl rounded-xl',
        isTouch && 'px-6 py-4.5 min-h-touch-xl'
      ),
    };

    // Handle focus events
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(event);
    };

    // Handle keyboard events
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
    };

    // Combine all styles
    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant as keyof typeof variantStyles] || variantStyles.default,
      sizeStyles[size],
      className
    );

    return (
      <input
        ref={ref}
        type={type}
        className={combinedClassName}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        data-testid={testId}
        aria-invalid={variant === 'error'}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };