/**
 * useResponsiveLayout Hook
 * 
 * Enhanced responsive layout hook with tablet/desktop detection
 * Provides layout-specific utilities and breakpoint detection
 */

import { useState, useEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type LayoutMode = 'single-column' | 'two-column' | 'three-column' | 'grid';

export interface ResponsiveLayout {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  layoutMode: LayoutMode;
  columns: number;
  showSidebar: boolean;
  compactMode: boolean;
}

export function useResponsiveLayout(): ResponsiveLayout {
  // Breakpoint queries
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');
  const isExtraLarge = useMediaQuery('(min-width: 1536px)');

  // Determine device type
  const deviceType: DeviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  // Determine layout mode based on screen size
  const layoutMode: LayoutMode = 
    isMobile ? 'single-column' :
    isTablet ? 'two-column' :
    isLargeDesktop ? 'three-column' :
    'two-column';

  // Determine number of columns for grid layouts
  const columns = 
    isMobile ? 1 :
    isTablet ? 2 :
    isLargeDesktop ? 3 :
    isExtraLarge ? 4 :
    2;

  // Show sidebar on larger screens
  const showSidebar = isDesktop;

  // Compact mode for smaller screens
  const compactMode = isMobile || isTablet;

  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    layoutMode,
    columns,
    showSidebar,
    compactMode,
  };
}

/**
 * Hook for adaptive grid columns
 */
export function useAdaptiveColumns(options: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
  largeDesktop?: number;
} = {}): number {
  const {
    mobile = 1,
    tablet = 2,
    desktop = 3,
    largeDesktop = 4,
  } = options;

  const { deviceType } = useResponsiveLayout();
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

  if (deviceType === 'mobile') return mobile;
  if (deviceType === 'tablet') return tablet;
  if (isLargeDesktop) return largeDesktop;
  return desktop;
}

/**
 * Hook for responsive spacing
 */
export function useResponsiveSpacing(): {
  gap: string;
  padding: string;
  margin: string;
} {
  const { deviceType } = useResponsiveLayout();

  const spacing = {
    mobile: { gap: '0.5rem', padding: '1rem', margin: '0.5rem' },
    tablet: { gap: '1rem', padding: '1.5rem', margin: '1rem' },
    desktop: { gap: '1.5rem', padding: '2rem', margin: '1.5rem' },
  };

  return spacing[deviceType];
}
