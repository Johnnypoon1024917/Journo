/**
 * Avatar Atom Component
 * 
 * User avatar component with fallback support, status indicators,
 * and accessibility features.
 */

import React, { forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';
import type { AvatarAtomProps } from '../types';

const Avatar = forwardRef<HTMLDivElement, AvatarAtomProps>(
  (
    {
      src,
      alt = '',
      fallback,
      size = 'md',
      status,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Size styles
    const sizeStyles = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
    };

    // Status indicator styles
    const statusStyles = {
      online: 'bg-success-500',
      offline: 'bg-neutral-400',
      away: 'bg-warning-500',
      busy: 'bg-error-500',
    };

    // Status indicator sizes
    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    };

    // Base styles
    const baseStyles = cn(
      'relative inline-flex items-center justify-center',
      'rounded-full overflow-hidden',
      'bg-neutral-100 dark:bg-neutral-700',
      'font-medium text-neutral-600 dark:text-neutral-300',
      'select-none',
      sizeStyles[size]
    );

    // Generate fallback text from name or alt
    const getFallbackText = () => {
      if (fallback) return fallback;
      if (alt) {
        return alt
          .split(' ')
          .map(word => word.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2);
      }
      return '?';
    };

    // Handle image load error
    const handleImageError = () => {
      setImageError(true);
      setImageLoaded(false);
    };

    // Handle image load success
    const handleImageLoad = () => {
      setImageError(false);
      setImageLoaded(true);
    };

    // Determine what to show
    const showImage = src && !imageError;
    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={cn(baseStyles, className)}
        data-testid={testId}
        {...props}
      >
        {/* Image */}
        {showImage && (
          <img
            src={src}
            alt={alt}
            className={cn(
              'w-full h-full object-cover',
              'transition-opacity duration-200',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}

        {/* Fallback */}
        {showFallback && (
          <span className="font-medium">
            {getFallbackText()}
          </span>
        )}

        {/* Loading state */}
        {showImage && !imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700">
            <div className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Status indicator */}
        {status && (
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5',
              'rounded-full border-2 border-white dark:border-neutral-800',
              statusStyles[status],
              statusSizes[size]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };