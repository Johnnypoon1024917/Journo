import { useEffect, useState } from 'react';

/**
 * Hook to support Dynamic Type (text scaling)
 * Detects system font size preferences and applies scaling
 * 
 * iOS Dynamic Type scale factors:
 * - xSmall: 0.82
 * - Small: 0.88
 * - Medium: 0.94
 * - Large (default): 1.0
 * - xLarge: 1.12
 * - xxLarge: 1.24
 * - xxxLarge: 1.35
 * - Accessibility sizes: up to 2.0
 */

export type TextScale = number;

interface DynamicTypeConfig {
  minScale: number;
  maxScale: number;
  defaultScale: number;
}

const DEFAULT_CONFIG: DynamicTypeConfig = {
  minScale: 0.82,
  maxScale: 2.0,
  defaultScale: 1.0,
};

/**
 * Get current text scale from system preferences
 */
function getSystemTextScale(): number {
  // Check if running in iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isIOS) {
    // iOS provides text size through CSS environment variable
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const baseFontSize = 16; // Default base font size
    return rootFontSize / baseFontSize;
  }
  
  // For web, check if user has set a custom font size
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );
  const baseFontSize = 16;
  return rootFontSize / baseFontSize;
}

/**
 * Detect if browser zoom is active
 */
function getBrowserZoomLevel(): number {
  // Check device pixel ratio vs window.devicePixelRatio
  const screenCssPixelRatio = (window.outerWidth - 8) / window.innerWidth;
  return screenCssPixelRatio || 1;
}

/**
 * Hook to manage Dynamic Type scaling
 */
export function useDynamicType(config: Partial<DynamicTypeConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [textScale, setTextScale] = useState<TextScale>(getSystemTextScale());
  const [zoomLevel, setZoomLevel] = useState<number>(getBrowserZoomLevel());
  
  useEffect(() => {
    // Update scale when font size changes
    const updateScale = () => {
      const newScale = getSystemTextScale();
      const newZoom = getBrowserZoomLevel();
      const clampedScale = Math.max(
        finalConfig.minScale,
        Math.min(finalConfig.maxScale, newScale)
      );
      setTextScale(clampedScale);
      setZoomLevel(newZoom);
      
      // Apply scale to CSS custom property
      setDynamicTypeCustomProperty(clampedScale);
    };
    
    // Initial update
    updateScale();
    
    // Listen for font size changes
    const observer = new MutationObserver(updateScale);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
    
    // Also listen for window resize (can indicate font size change or zoom)
    window.addEventListener('resize', updateScale);
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', updateScale);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, [finalConfig.minScale, finalConfig.maxScale]);
  
  return {
    textScale,
    zoomLevel,
    isScaled: textScale !== finalConfig.defaultScale,
    isLargeText: textScale > 1.2,
    isAccessibilitySize: textScale >= 1.5,
    effectiveScale: textScale * zoomLevel,
  };
}

/**
 * Apply Dynamic Type scaling to root element
 */
export function applyDynamicTypeScale(scale: number): void {
  const baseFontSize = 16;
  const scaledFontSize = baseFontSize * scale;
  document.documentElement.style.fontSize = `${scaledFontSize}px`;
}

/**
 * Hook to apply Dynamic Type scaling automatically
 */
export function useAutoDynamicType(config?: Partial<DynamicTypeConfig>) {
  const { textScale } = useDynamicType(config);
  
  useEffect(() => {
    applyDynamicTypeScale(textScale);
  }, [textScale]);
  
  return textScale;
}

/**
 * Get scaled font size for a given base size
 */
export function getScaledFontSize(baseSize: number, scale: number): number {
  return baseSize * scale;
}

/**
 * CSS custom property for Dynamic Type
 * Use in CSS: font-size: calc(1rem * var(--text-scale));
 */
export function setDynamicTypeCustomProperty(scale: number): void {
  document.documentElement.style.setProperty('--text-scale', scale.toString());
}
