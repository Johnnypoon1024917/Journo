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
 * Requirements: 4.1, 17.6
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Minimum spacing between touch targets (8px)
 * Requirements: 4.2
 */
export const MIN_TOUCH_SPACING = 8;

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
 * Safe area inset type
 */
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Get safe area insets for devices with notches
 * Requirements: 3.4, 7.1, 7.2, 7.3, 7.4
 */
export function getSafeAreaInsets(): SafeAreaInsets {
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
 * Apply safe area insets to an element's style
 * Requirements: 3.4, 7.1, 7.2, 7.3
 */
export function applySafeAreaInsets(
  element: HTMLElement,
  options: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  } = { top: true, right: true, bottom: true, left: true }
): void {
  if (options.top) {
    element.style.paddingTop = 'max(env(safe-area-inset-top), var(--padding-top, 0px))';
  }
  if (options.right) {
    element.style.paddingRight = 'max(env(safe-area-inset-right), var(--padding-right, 0px))';
  }
  if (options.bottom) {
    element.style.paddingBottom = 'max(env(safe-area-inset-bottom), var(--padding-bottom, 0px))';
  }
  if (options.left) {
    element.style.paddingLeft = 'max(env(safe-area-inset-left), var(--padding-left, 0px))';
  }
}

/**
 * Generate CSS safe area padding string
 * Requirements: 3.4, 7.1, 7.2, 7.3
 */
export function getSafeAreaPadding(
  side: 'top' | 'right' | 'bottom' | 'left',
  fallback: string = '0px'
): string {
  return `max(env(safe-area-inset-${side}), ${fallback})`;
}

/**
 * Generate CSS safe area inset variable
 * Requirements: 7.9
 */
export function getSafeAreaInsetVar(side: 'top' | 'right' | 'bottom' | 'left'): string {
  return `env(safe-area-inset-${side})`;
}

/**
 * Check if device has safe area insets (notch/home indicator)
 * Requirements: 7.7
 */
export function hasSafeAreaInsets(): boolean {
  const insets = getSafeAreaInsets();
  return insets.top > 0 || insets.bottom > 0 || insets.left > 0 || insets.right > 0;
}

/**
 * Subscribe to safe area inset changes
 * Requirements: 3.4
 */
export function subscribeSafeAreaChanges(
  callback: (insets: SafeAreaInsets) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleResize = () => {
    callback(getSafeAreaInsets());
  };

  const handleOrientationChange = () => {
    // Delay to allow browser to update safe area insets
    setTimeout(() => {
      callback(getSafeAreaInsets());
    }, 100);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleOrientationChange);

  // Initial call
  callback(getSafeAreaInsets());

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleOrientationChange);
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
 * Requirements: 3.5
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
 * Calculate responsive column count based on viewport width
 * Requirements: 3.5
 */
export function calculateResponsiveColumns(
  viewportWidth?: number
): number {
  const width = viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 0);

  if (width < DEVICE_RANGES.tablet.min) {
    return 1; // Mobile: 1 column
  } else if (width < DEVICE_RANGES.desktop.min) {
    return 2; // Tablet: 2 columns
  } else {
    return 3; // Desktop: 3+ columns
  }
}

/**
 * Get responsive column count with custom breakpoints
 * Requirements: 3.5
 */
export function getResponsiveColumnCount(
  containerWidth: number,
  options: {
    minColumnWidth?: number;
    maxColumns?: number;
    minColumns?: number;
  } = {}
): number {
  const {
    minColumnWidth = 250,
    maxColumns = 6,
    minColumns = 1,
  } = options;

  const calculatedColumns = Math.floor(containerWidth / minColumnWidth);
  return Math.max(minColumns, Math.min(maxColumns, calculatedColumns));
}

/**
 * Generate responsive grid columns CSS class
 * Requirements: 3.5
 */
export function getResponsiveGridClass(options: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
} = {}): string {
  const { mobile = 1, tablet = 2, desktop = 3 } = options;
  
  const classes: string[] = [];
  
  classes.push(`grid-cols-${mobile}`);
  
  if (tablet !== mobile) {
    classes.push(`md:grid-cols-${tablet}`);
  }
  
  if (desktop !== tablet) {
    classes.push(`lg:grid-cols-${desktop}`);
  }
  
  return classes.join(' ');
}

/**
 * Check if element meets minimum touch target size
 * Requirements: 4.1, 17.6
 */
export function meetsMinTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_TOUCH_TARGET && rect.height >= MIN_TOUCH_TARGET;
}

/**
 * Validate touch target size and return validation result
 * Requirements: 4.1
 */
export function validateTouchTargetSize(element: HTMLElement): {
  valid: boolean;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    valid: rect.width >= MIN_TOUCH_TARGET && rect.height >= MIN_TOUCH_TARGET,
    width: rect.width,
    height: rect.height,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
  };
}

/**
 * Validate spacing between two touch targets
 * Requirements: 4.2
 */
export function validateTouchTargetSpacing(
  element1: HTMLElement,
  element2: HTMLElement
): {
  valid: boolean;
  spacing: number;
  minSpacing: number;
} {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  // Calculate minimum distance between rectangles
  const horizontalSpacing = Math.max(
    0,
    Math.max(rect1.left, rect2.left) - Math.min(rect1.right, rect2.right)
  );
  const verticalSpacing = Math.max(
    0,
    Math.max(rect1.top, rect2.top) - Math.min(rect1.bottom, rect2.bottom)
  );

  const spacing = Math.min(horizontalSpacing, verticalSpacing);

  return {
    valid: spacing >= MIN_TOUCH_SPACING,
    spacing,
    minSpacing: MIN_TOUCH_SPACING,
  };
}

/**
 * Ensure element meets minimum touch target size
 * Returns adjusted dimensions if needed
 * Requirements: 4.1, 17.6
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
 * Get touch target padding needed to meet minimum size
 * Requirements: 4.1
 */
export function getTouchTargetPadding(
  currentWidth: number,
  currentHeight: number
): {
  horizontal: number;
  vertical: number;
} {
  const widthDiff = Math.max(0, MIN_TOUCH_TARGET - currentWidth);
  const heightDiff = Math.max(0, MIN_TOUCH_TARGET - currentHeight);

  return {
    horizontal: widthDiff / 2,
    vertical: heightDiff / 2,
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
