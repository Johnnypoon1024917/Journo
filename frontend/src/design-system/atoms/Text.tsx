/**
 * Text Atom Component
 * 
 * Semantic text component with responsive typography and accessibility support.
 * Provides consistent text styling across the application.
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { useResponsive } from '../../hooks/useResponsive';
import type { TextAtomProps } from '../types';

const Text = forwardRef<HTMLElement, TextAtomProps>(
  (
    {
      as: Component = 'p',
      variant = 'body',
      size = 'md',
      weight = 'normal',
      color = 'primary',
      align = 'left',
      truncate = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobileLayout } = useResponsive();

    // Base styles
    const baseStyles = cn(
      'font-sans',
      truncate && 'truncate',
      
      // Text alignment
      {
        'text-left': align === 'left',
        'text-center': align === 'center',
        'text-right': align === 'right',
        'text-justify': align === 'justify',
      }
    );

    // Variant styles with responsive typography and dynamic scaling
    const variantStyles = {
      display: cn(
        'font-bold tracking-tight',
        isMobileLayout 
          ? 'leading-tight' 
          : 'leading-tight',
        // Dynamic font scaling with clamp
        'text-[clamp(1.875rem,4vw,3.75rem)]' // 30px-60px
      ),
      heading: cn(
        'font-semibold tracking-tight',
        isMobileLayout 
          ? 'leading-tight' 
          : 'leading-tight',
        // Dynamic font scaling with clamp
        'text-[clamp(1.5rem,3vw,2.25rem)]' // 24px-36px
      ),
      subheading: cn(
        'font-medium tracking-tight',
        isMobileLayout 
          ? 'leading-snug' 
          : 'leading-snug',
        // Dynamic font scaling with clamp
        'text-[clamp(1.25rem,2.5vw,1.875rem)]' // 20px-30px
      ),
      body: cn(
        'leading-relaxed',
        // Dynamic font scaling with clamp to prevent overflow
        'text-[clamp(1rem,1.5vw,1.125rem)]' // 16px-18px
      ),
      caption: cn(
        'leading-normal',
        // Dynamic font scaling with clamp
        'text-[clamp(0.875rem,1.25vw,1rem)]' // 14px-16px
      ),
      overline: cn(
        'font-medium uppercase tracking-wider leading-tight',
        // Dynamic font scaling with clamp
        'text-[clamp(0.75rem,1vw,0.875rem)]' // 12px-14px
      ),
    };

    // Size styles (can override variant sizes)
    const sizeStyles = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    };

    // Weight styles
    const weightStyles = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    // Color styles
    const colorStyles = {
      primary: 'text-neutral-900 dark:text-neutral-100',
      secondary: 'text-neutral-700 dark:text-neutral-300',
      muted: 'text-neutral-500 dark:text-neutral-400',
      success: 'text-success-700 dark:text-success-400',
      warning: 'text-warning-700 dark:text-warning-400',
      error: 'text-error-700 dark:text-error-400',
      info: 'text-info-700 dark:text-info-400',
    };

    // Combine all styles
    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      size !== 'md' && sizeStyles[size], // Only apply size if not default
      weight !== 'normal' && weightStyles[weight], // Only apply weight if not default
      colorStyles[color],
      className
    );

    // Semantic element mapping for better accessibility
    const getSemanticElement = () => {
      if (Component !== 'p') return Component;
      
      // Auto-select semantic element based on variant
      switch (variant) {
        case 'display':
          return 'h1';
        case 'heading':
          return 'h2';
        case 'subheading':
          return 'h3';
        case 'overline':
          return 'span';
        case 'caption':
          return 'small';
        default:
          return 'p';
      }
    };

    const ElementType = getSemanticElement() as any;

    return (
      <ElementType
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {children}
      </ElementType>
    );
  }
);

Text.displayName = 'Text';

export { Text };