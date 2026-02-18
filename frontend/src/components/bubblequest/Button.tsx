/**
 * BubbleQuest Button Component
 * 
 * A reusable button with BubbleQuest styling and Framer Motion animations.
 * Supports multiple variants, sizes, and states.
 * 
 * Features:
 * - Scale on tap animation (0.95)
 * - Hover effects with scale (1.02)
 * - Icon placement (left/right)
 * - Disabled states with reduced opacity
 * - Loading state with spinner
 * - Touch-optimized with 44px minimum height
 * 
 * Requirements: 1.1, 1.4
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-xl',
    'transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'touch-manipulation' // Prevent double-tap zoom on mobile
  );
  
  const variantClasses = {
    primary: cn(
      // Use direct colors to ensure visibility
      'bg-blue-600 text-white shadow-lg',
      'hover:bg-blue-700',
      'focus:ring-blue-500',
      'disabled:bg-gray-400 disabled:opacity-60',
      // Alternative: use inline style if Tailwind fails
      '!bg-[#2563eb]', // Force blue background
      'hover:!bg-[#1d4ed8]',
      // Dark mode
      'dark:bg-blue-600 dark:hover:bg-blue-700',
      // High contrast mode
      'high-contrast:bg-[#0369a1] high-contrast:text-white high-contrast:border-2 high-contrast:border-black',
      'high-contrast:hover:bg-[#075985]'
    ),
    secondary: cn(
      'bg-bubblequest-neutral-100 text-bubblequest-neutral-800',
      'border-2 border-[#b8b3a5]', // Darker border for better contrast (was #d5d0c2)
      'hover:bg-bubblequest-neutral-200 hover:border-bubblequest-neutral-400',
      'focus:ring-bubblequest-neutral-400',
      'dark:bg-bubblequest-neutral-700 dark:text-bubblequest-neutral-100',
      'dark:border-bubblequest-neutral-600 dark:hover:bg-bubblequest-neutral-600',
      // High contrast mode
      'high-contrast:bg-white high-contrast:text-black high-contrast:border-black high-contrast:border-3',
      'high-contrast:hover:bg-gray-100'
    ),
    ghost: cn(
      'bg-transparent text-bubblequest-primary-700', // Darker text for better contrast (was primary-600)
      'hover:bg-bubblequest-primary-50',
      'focus:ring-bubblequest-primary-500',
      'dark:text-bubblequest-primary-300 dark:hover:bg-bubblequest-primary-900/20',
      // High contrast mode
      'high-contrast:text-black high-contrast:border high-contrast:border-black',
      'high-contrast:hover:bg-gray-200'
    ),
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[44px]', // 44px minimum for touch
    lg: 'px-8 py-4 text-lg min-h-[48px]',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Framer Motion animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.95 },
  };
  
  return (
    // @ts-ignore - Framer Motion type conflict with React types
    <motion.button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClass,
        className
      )}
      style={
        variant === 'primary' && !disabled && !loading
          ? {
              backgroundColor: '#2563eb',
              color: '#ffffff',
            }
          : undefined
      }
      disabled={disabled || loading}
      variants={buttonVariants}
      initial="initial"
      whileHover={!disabled && !loading ? "hover" : undefined}
      whileTap={!disabled && !loading ? "tap" : undefined}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5 flex-shrink-0"
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
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children && <span className="truncate">{children}</span>}
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
    </motion.button>
  );
};
