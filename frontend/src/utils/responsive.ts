/**
 * Responsive Design Utilities
 * 
 * Helper functions and constants for responsive design.
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.6
 */

/**
 * Breakpoint constants matching Tailwind config
 */
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const;

/**
 * Device type ranges
 */
export const DEVICE_RANGES = {
  mobile: { min: 320, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: Infinity },
} as const;

/**
 * Minimum touch target size (44px) for accessibility
 * Requirements: 17.6
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Check if current viewport width matches a device type
 */
export function isDeviceType(type: keyof typeof DEVICE_RANGES): boolean {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const range = DEVICE_RANGES[type];
  
  return width >= range.min && width <= range.max;
}

/**
 * Get current device type based on viewport width
 */
export function getCurrentDeviceType(): keyof typeof DEVICE_RANGES {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < DEVICE_RANGES.tablet.min) return 'mobile';
  if (width < DEVICE_RANGES.desktop.min) return 'tablet';
  return 'desktop';
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get safe area insets for devices with notches
 * Requirements: 17.7
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === 'undefined' || !CSS.supports('padding-top', 'env(safe-area-inset-top)')) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10),
  };
}

/**
 * Calculate responsive value based on viewport width
 * 
 * @example
 * const fontSize = getResponsiveValue({ mobile: 14, tablet: 16, desktop: 18 });
 */
export function getResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T {
  const deviceType = getCurrentDeviceType();
  
  if (deviceType === 'mobile') return values.mobile;
  if (deviceType === 'tablet') return values.tablet ?? values.mobile;
  return values.desktop ?? values.tablet ?? values.mobile;
}

/**
 * Get responsive padding based on device type
 */
export function getResponsivePadding(): string {
  return getResponsiveValue({
    mobile: '1rem',
    tablet: '1.5rem',
    desktop: '2rem',
  });
}

/**
 * Get responsive gap based on device type
 */
export function getResponsiveGap(size: 'sm' | 'md' | 'lg' = 'md'): string {
  const gaps = {
    sm: { mobile: '0.5rem', tablet: '0.75rem', desktop: '1rem' },
    md: { mobile: '1rem', tablet: '1.25rem', desktop: '1.5rem' },
    lg: { mobile: '1.5rem', tablet: '2rem', desktop: '2.5rem' },
  };
  
  return getResponsiveValue(gaps[size]);
}

/**
 * Get responsive columns for grid layouts
 */
export function getResponsiveColumns(options: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
} = {}): number {
  const { mobile = 1, tablet = 2, desktop = 3 } = options;
  
  return getResponsiveValue({
    mobile,
    tablet,
    desktop,
  });
}

/**
 * Check if element meets minimum touch target size
 * Requirements: 17.6
 */
export function meetsMinTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_TOUCH_TARGET && rect.height >= MIN_TOUCH_TARGET;
}

/**
 * Ensure element meets minimum touch target size
 * Returns adjusted dimensions if needed
 * Requirements: 17.6
 */
export function ensureMinTouchTarget(
  width: number,
  height: number
): { width: number; height: number } {
  return {
    width: Math.max(width, MIN_TOUCH_TARGET),
    height: Math.max(height, MIN_TOUCH_TARGET),
  };
}

/**
 * Get responsive font size based on base size
 */
export function getResponsiveFontSize(
  baseSize: number,
  options: {
    mobileScale?: number;
    tabletScale?: number;
    desktopScale?: number;
  } = {}
): number {
  const {
    mobileScale = 0.875,
    tabletScale = 1,
    desktopScale = 1.125,
  } = options;
  
  const deviceType = getCurrentDeviceType();
  
  if (deviceType === 'mobile') return baseSize * mobileScale;
  if (deviceType === 'tablet') return baseSize * tabletScale;
  return baseSize * desktopScale;
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions(): {
  width: number;
  height: number;
  aspectRatio: number;
} {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, aspectRatio: 1 };
  }
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    width,
    height,
    aspectRatio: width / height,
  };
}

/**
 * Check if viewport is in portrait orientation
 */
export function isPortrait(): boolean {
  if (typeof window === 'undefined') return true;
  
  return window.innerHeight > window.innerWidth;
}

/**
 * Check if viewport is in landscape orientation
 */
export function isLandscape(): boolean {
  return !isPortrait();
}

/**
 * Responsive class name generator
 * Generates Tailwind classes for responsive values
 */
export function responsiveClass(
  property: string,
  values: {
    mobile: string | number;
    tablet?: string | number;
    desktop?: string | number;
  }
): string {
  const classes: string[] = [];
  
  // Mobile (base)
  classes.push(`${property}-${values.mobile}`);
  
  // Tablet
  if (values.tablet !== undefined) {
    classes.push(`md:${property}-${values.tablet}`);
  }
  
  // Desktop
  if (values.desktop !== undefined) {
    classes.push(`lg:${property}-${values.desktop}`);
  }
  
  return classes.join(' ');
}

/**
 * Generate responsive padding classes
 */
export function responsivePadding(
  mobile: number | string,
  tablet?: number | string,
  desktop?: number | string
): string {
  return responsiveClass('p', {
    mobile,
    tablet: tablet ?? mobile,
    desktop: desktop ?? tablet ?? mobile,
  });
}

/**
 * Generate responsive margin classes
 */
export function responsiveMargin(
  mobile: number | string,
  tablet?: number | string,
  desktop?: number | string
): string {
  return responsiveClass('m', {
    mobile,
    tablet: tablet ?? mobile,
    desktop: desktop ?? tablet ?? mobile,
  });
}

/**
 * Generate responsive gap classes
 */
export function responsiveGapClass(
  mobile: number | string,
  tablet?: number | string,
  desktop?: number | string
): string {
  return responsiveClass('gap', {
    mobile,
    tablet: tablet ?? mobile,
    desktop: desktop ?? tablet ?? mobile,
  });
}
