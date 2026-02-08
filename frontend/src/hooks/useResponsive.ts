import { useState, useEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';

export interface ResponsiveBreakpoints {
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2Xl: boolean;
  is3Xl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

export interface ViewportDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Hook for responsive design utilities
 * Provides breakpoint detection and viewport information
 */
export function useResponsive(): ResponsiveBreakpoints & {
  viewport: ViewportDimensions;
  isMobileLayout: boolean;
  isTabletLayout: boolean;
  isDesktopLayout: boolean;
} {
  // Breakpoint queries
  const isXs = useMediaQuery('(min-width: 320px)');
  const isSm = useMediaQuery('(min-width: 640px)');
  const isMd = useMediaQuery('(min-width: 768px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const is2Xl = useMediaQuery('(min-width: 1536px)');
  const is3Xl = useMediaQuery('(min-width: 1920px)');

  // Device type queries
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Touch and orientation queries
  const isTouch = useMediaQuery('(hover: none) and (pointer: coarse)');
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');

  // Viewport dimensions
  const [viewport, setViewport] = useState<ViewportDimensions>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    aspectRatio: typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1,
  }));

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({
        width,
        height,
        aspectRatio: width / height,
      });
    };

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure dimensions are updated after orientation change
      setTimeout(updateViewport, 100);
    });

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  // Layout helpers
  const isMobileLayout = isMobile || (isTouch && viewport.width < 768);
  const isTabletLayout = isTablet && !isMobileLayout;
  const isDesktopLayout = isDesktop && !isMobileLayout && !isTabletLayout;

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    is3Xl,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    isPortrait,
    isLandscape,
    viewport,
    isMobileLayout,
    isTabletLayout,
    isDesktopLayout,
  };
}

/**
 * Hook for responsive grid columns
 * Returns appropriate column count based on screen size
 */
export function useResponsiveColumns(options: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
  wide?: number;
} = {}): number {
  const { isMobile, isTablet, isDesktop, is2Xl } = useResponsive();
  
  const {
    mobile = 1,
    tablet = 2,
    desktop = 3,
    wide = 4,
  } = options;

  if (isMobile) return mobile;
  if (isTablet) return tablet;
  if (isDesktop && !is2Xl) return desktop;
  return wide;
}

/**
 * Hook for responsive spacing
 * Returns appropriate spacing values based on screen size
 */
export function useResponsiveSpacing(options: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
} = {}): string {
  const { isMobile, isTablet } = useResponsive();
  
  const {
    mobile = '1rem',
    tablet = '1.5rem',
    desktop = '2rem',
  } = options;

  if (isMobile) return mobile;
  if (isTablet) return tablet;
  return desktop;
}

/**
 * Hook for responsive font sizes
 * Returns appropriate font size based on screen size and content type
 */
export function useResponsiveFontSize(baseSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'): string {
  const { isMobile } = useResponsive();
  
  const mobileSizes = {
    'xs': 'text-mobile-xs',
    'sm': 'text-mobile-sm',
    'base': 'text-mobile-base',
    'lg': 'text-mobile-lg',
    'xl': 'text-lg',
    '2xl': 'text-xl',
    '3xl': 'text-2xl',
    '4xl': 'text-3xl',
  };

  const desktopSizes = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  return isMobile ? mobileSizes[baseSize] : desktopSizes[baseSize];
}

/**
 * Hook for responsive container classes
 * Returns appropriate container classes based on screen size
 */
export function useResponsiveContainer(): string {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  if (isMobile) return 'container mx-auto px-4 max-w-mobile';
  if (isTablet) return 'container mx-auto px-6 max-w-tablet';
  if (isDesktop) return 'container mx-auto px-8 max-w-desktop';
  return 'container mx-auto px-8 max-w-wide';
}