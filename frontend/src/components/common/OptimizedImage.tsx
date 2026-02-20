/**
 * OptimizedImage Component
 * 
 * A high-performance image component with:
 * - WebP/AVIF format support with fallbacks
 * - Responsive image sizes
 * - Lazy loading
 * - Blur-up placeholders
 * - Core Web Vitals optimization
 */

import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface OptimizedImageProps {
  /** Base image URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image width (for aspect ratio calculation) */
  width?: number;
  /** Image height (for aspect ratio calculation) */
  height?: number;
  /** CSS classes */
  className?: string;
  /** Loading priority */
  priority?: 'high' | 'low';
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Object fit style */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Blur placeholder color (CSS color value) */
  blurColor?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image errors */
  onError?: () => void;
}

/**
 * Generate srcset for responsive images
 * Supports multiple widths for different screen sizes
 */
function generateSrcSet(src: string, widths: number[] = [640, 750, 828, 1080, 1200, 1920]): string {
  // Check if URL is from Unsplash (supports dynamic resizing)
  if (src.includes('unsplash.com')) {
    return widths
      .map(width => `${src.split('?')[0]}?w=${width}&q=75 ${width}w`)
      .join(', ');
  }
  
  // For other URLs, return original
  return '';
}

/**
 * Generate WebP and AVIF sources for modern browsers
 */
function generateModernSources(src: string): { avif: string; webp: string } {
  const srcWithoutQuery = src.split('?')[0];
  const queryParams = src.includes('?') ? src.split('?')[1] : '';
  
  // For Unsplash, we can request WebP format
  if (src.includes('unsplash.com')) {
    return {
      avif: `${srcWithoutQuery}?${queryParams}&fm=avif`,
      webp: `${srcWithoutQuery}?${queryParams}&fm=webp`
    };
  }
  
  // For other sources, assume they might have .webp/.avif versions
  return {
    avif: srcWithoutQuery.replace(/\.(jpg|jpeg|png)$/i, '.avif'),
    webp: srcWithoutQuery.replace(/\.(jpg|jpeg|png)$/i, '.webp')
  };
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = 'low',
  sizes = '100vw',
  objectFit = 'cover',
  blurColor = 'rgb(229, 231, 235)',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Calculate aspect ratio for placeholder
  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  // Generate responsive sources
  const srcSet = generateSrcSet(src);
  const modernSources = generateModernSources(src);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Preload high-priority images
  useEffect(() => {
    if (priority === 'high') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.imageSrcset = srcSet;
      link.imageSizes = sizes;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, srcSet, sizes, priority]);

  return (
    <div 
      className={cn('relative overflow-hidden', className)}
      style={aspectRatio ? { paddingBottom: `${aspectRatio}%` } : undefined}
    >
      {/* Blur placeholder */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          isLoaded ? 'opacity-0' : 'opacity-100'
        )}
        style={{
          backgroundColor: blurColor,
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
        }}
        aria-hidden="true"
      />

      {/* Actual image with modern format support */}
      {!hasError && (
        <picture>
          {/* AVIF format (best compression) */}
          <source
            type="image/avif"
            srcSet={modernSources.avif}
            sizes={sizes}
          />
          
          {/* WebP format (good compression, wide support) */}
          <source
            type="image/webp"
            srcSet={modernSources.webp}
            sizes={sizes}
          />
          
          {/* Fallback to original format */}
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading={priority === 'high' ? 'eager' : 'lazy'}
            decoding={priority === 'high' ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'absolute inset-0 w-full h-full transition-opacity duration-500',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              objectFit,
            }}
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700"
          role="img"
          aria-label={alt}
        >
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
