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

    // Variant styles with responsive typography
    const variantStyles = {
      display: cn(
        'font-bold tracking-tight',
        isMobileLayout 
          ? 'text-3xl sm:text-4xl leading-tight' 
          : 'text-4xl lg:text-5xl xl:text-6xl leading-tight'
      ),
      heading: cn(
        'font-semibold tracking-tight',
        isMobileLayout 
          ? 'text-2xl sm:text-3xl leading-tight' 
          : 'text-3xl lg:text-4xl leading-tight'
      ),
      subheading: cn(
        'font-medium tracking-tight',
        isMobileLayout 
          ? 'text-xl sm:text-2xl leading-snug' 
          : 'text-2xl lg:text-3xl leading-snug'
      ),
      body: cn(
        'leading-relaxed',
        isMobileLayout 
          ? 'text-base leading-relaxed' 
          : 'text-base lg:text-lg leading-relaxed'
      ),
      caption: cn(
        'leading-normal',
        isMobileLayout 
          ? 'text-sm leading-normal' 
          : 'text-sm lg:text-base leading-normal'
      ),
      overline: cn(
        'font-medium uppercase tracking-wider leading-tight',
        isMobileLayout 
          ? 'text-xs leading-tight' 
          : 'text-xs lg:text-sm leading-tight'
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