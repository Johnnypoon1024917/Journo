/**
 * Dynamic Text Size Hook
 * 
 * Supports system font scaling and dynamic text sizing
 * Ensures text remains readable at different zoom levels and user preferences
 */

import { useEffect, useState } from 'react';

export interface DynamicTextSizeOptions {
  minScale?: number;
  maxScale?: number;
  baseSize?: number;
}

export interface DynamicTextSize {
  fontSize: number;
  scale: number;
  isScaled: boolean;
  updateFontSize: (newSize: number) => void;
  resetFontSize: () => void;
}

export function useDynamicTextSize(options: DynamicTextSizeOptions = {}): DynamicTextSize {
  const {
    minScale = 0.75,
    maxScale = 2.0,
    baseSize = 16,
  } = options;

  const [fontSize, setFontSize] = useState(baseSize);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Detect system font size preference
    const detectSystemFontSize = () => {
      const testElement = document.createElement('div');
      testElement.style.cssText = 'position: absolute; visibility: hidden; font-size: 1rem;';
      document.body.appendChild(testElement);
      
      const computedSize = parseFloat(window.getComputedStyle(testElement).fontSize);
      document.body.removeChild(testElement);
      
      return computedSize;
    };

    const systemFontSize = detectSystemFontSize();
    const calculatedScale = systemFontSize / baseSize;
    const clampedScale = Math.max(minScale, Math.min(maxScale, calculatedScale));

    setScale(clampedScale);
    setFontSize(baseSize * clampedScale);

    // Update CSS custom property for global use
    document.documentElement.style.setProperty('--base-font-size', `${baseSize * clampedScale}px`);
    document.documentElement.style.setProperty('--font-scale', `${clampedScale}`);

    // Listen for zoom changes
    const handleResize = () => {
      const newSystemFontSize = detectSystemFontSize();
      const newScale = newSystemFontSize / baseSize;
      const newClampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      
      setScale(newClampedScale);
      setFontSize(baseSize * newClampedScale);
      document.documentElement.style.setProperty('--base-font-size', `${baseSize * newClampedScale}px`);
      document.documentElement.style.setProperty('--font-scale', `${newClampedScale}`);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [baseSize, minScale, maxScale]);

  const updateFontSize = (newSize: number) => {
    const newScale = newSize / baseSize;
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    setScale(clampedScale);
    setFontSize(baseSize * clampedScale);
    document.documentElement.style.setProperty('--base-font-size', `${baseSize * clampedScale}px`);
    document.documentElement.style.setProperty('--font-scale', `${clampedScale}`);
  };

  const resetFontSize = () => {
    setScale(1);
    setFontSize(baseSize);
    document.documentElement.style.setProperty('--base-font-size', `${baseSize}px`);
    document.documentElement.style.setProperty('--font-scale', '1');
  };

  return {
    fontSize,
    scale,
    isScaled: scale !== 1,
    updateFontSize,
    resetFontSize,
  };
}
