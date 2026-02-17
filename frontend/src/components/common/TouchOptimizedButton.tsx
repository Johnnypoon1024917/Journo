/**
 * TouchOptimizedButton Component
 * 
 * A button component optimized for touch interactions with:
 * - Minimum 44x44px touch target
 * - Haptic feedback on press
 * - Long-press gesture support
 * - Visual feedback within 100ms
 * 
 * Implements Requirements 4.1, 4.3
 */

import React, { forwardRef, useRef, useCallback, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { hapticsService } from '../../services/hapticsService';

export interface TouchOptimizedButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onPress'> {
  /** Button press handler */
  onPress?: () => void;
  /** Long press handler (triggered after 400ms) */
  onLongPress?: () => void;
  /** Haptic feedback intensity */
  hapticFeedback?: 'light' | 'medium' | 'heavy';
  /** Minimum touch target size in pixels */
  minTouchTarget?: number;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Icon element */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
}

export const TouchOptimizedButton = forwardRef<HTMLButtonElement, TouchOptimizedButtonProps>(
  (
    {
      onPress,
      onLongPress,
      hapticFeedback = 'light',
      minTouchTarget = 44,
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
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartTimeRef = useRef<number>(0);

    // Handle touch start
    const handleTouchStart = useCallback(
      (e: React.TouchEvent<HTMLButtonElement>) => {
        if (disabled || loading) return;

        setIsPressed(true);
        touchStartTimeRef.current = Date.now();

        // Trigger haptic feedback immediately
        hapticsService.impact(hapticFeedback);

        // Start long press timer
        if (onLongPress) {
          longPressTimerRef.current = setTimeout(() => {
            hapticsService.impact('medium');
            onLongPress();
            setIsPressed(false);
          }, 400);
        }

        // Call original onTouchStart if provided
        props.onTouchStart?.(e);
      },
      [disabled, loading, hapticFeedback, onLongPress, props]
    );

    // Handle touch end
    const handleTouchEnd = useCallback(
      (e: React.TouchEvent<HTMLButtonElement>) => {
        if (disabled || loading) return;

        // Clear long press timer
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        // Only trigger onPress if it wasn't a long press
        const touchDuration = Date.now() - touchStartTimeRef.current;
        if (touchDuration < 400 && onPress) {
          onPress();
        }

        setIsPressed(false);

        // Call original onTouchEnd if provided
        props.onTouchEnd?.(e);
      },
      [disabled, loading, onPress, props]
    );

    // Handle touch cancel
    const handleTouchCancel = useCallback(
      (e: React.TouchEvent<HTMLButtonElement>) => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        setIsPressed(false);

        // Call original onTouchCancel if provided
        props.onTouchCancel?.(e);
      },
      [props]
    );

    // Handle click (for mouse/keyboard)
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || loading) return;
        onPress?.();
        props.onClick?.(e);
      },
      [disabled, loading, onPress, props]
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }
      };
    }, []);

    // Base styles
    const baseStyles = cn(
      // Layout
      'inline-flex items-center justify-center gap-2',
      'font-medium text-center',
      'border border-transparent',
      'cursor-pointer select-none',
      'relative overflow-hidden',

      // Touch optimization
      'touch-manipulation',
      '-webkit-tap-highlight-color: transparent',

      // Accessibility
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',

      // Transitions - fast for immediate feedback
      'transition-all duration-100 ease-out',
      'transform-gpu will-change-transform',

      // Visual feedback when pressed
      isPressed && !disabled && !loading && 'scale-95 opacity-90'
    );

    // Variant styles
    const variantStyles = {
      primary: cn(
        'bg-primary-600 text-white border-primary-600',
        'hover:bg-primary-700',
        'focus-visible:ring-primary-500',
        'dark:bg-primary-500 dark:hover:bg-primary-600'
      ),
      secondary: cn(
        'bg-white text-neutral-700 border-neutral-300',
        'hover:bg-neutral-50',
        'focus-visible:ring-neutral-500',
        'dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-600'
      ),
      tertiary: cn(
        'bg-neutral-100 text-neutral-700 border-neutral-200',
        'hover:bg-neutral-200',
        'focus-visible:ring-neutral-500',
        'dark:bg-neutral-700 dark:text-neutral-200'
      ),
      danger: cn(
        'bg-error-600 text-white border-error-600',
        'hover:bg-error-700',
        'focus-visible:ring-error-500',
        'dark:bg-error-500 dark:hover:bg-error-600'
      ),
      ghost: cn(
        'bg-transparent text-neutral-700 border-transparent',
        'hover:bg-neutral-100',
        'focus-visible:ring-neutral-500',
        'dark:text-neutral-200 dark:hover:bg-neutral-800'
      ),
    };

    // Size styles with minimum touch target
    const sizeStyles = {
      sm: cn('px-3 py-2 text-sm rounded-md'),
      md: cn('px-4 py-2.5 text-base rounded-lg'),
      lg: cn('px-6 py-3 text-lg rounded-lg'),
    };

    // Ensure minimum touch target size
    const touchTargetStyle = {
      minWidth: `${minTouchTarget}px`,
      minHeight: `${minTouchTarget}px`,
    };

    // Loading spinner
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

    // Render content
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

    // Combine styles
    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClassName}
        style={touchTargetStyle}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

TouchOptimizedButton.displayName = 'TouchOptimizedButton';
