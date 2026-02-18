/**
 * High Contrast Mode Hook
 * 
 * Detects and responds to high contrast mode preferences
 * Supports Windows High Contrast Mode and forced-colors media query
 */

import { useEffect, useState } from 'react';

export interface HighContrastMode {
  isHighContrast: boolean;
  contrastLevel: 'normal' | 'high' | 'forced';
  updateContrastStyles: () => void;
}

export function useHighContrast(): HighContrastMode {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [contrastLevel, setContrastLevel] = useState<'normal' | 'high' | 'forced'>('normal');

  useEffect(() => {
    // Check for forced-colors (Windows High Contrast Mode)
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
    
    // Check for prefers-contrast
    const prefersContrastQuery = window.matchMedia('(prefers-contrast: more)');

    const updateContrastMode = () => {
      if (forcedColorsQuery.matches) {
        setIsHighContrast(true);
        setContrastLevel('forced');
        document.documentElement.classList.add('forced-colors');
        document.documentElement.setAttribute('data-contrast', 'forced');
      } else if (prefersContrastQuery.matches) {
        setIsHighContrast(true);
        setContrastLevel('high');
        document.documentElement.classList.add('high-contrast');
        document.documentElement.setAttribute('data-contrast', 'high');
      } else {
        setIsHighContrast(false);
        setContrastLevel('normal');
        document.documentElement.classList.remove('forced-colors', 'high-contrast');
        document.documentElement.setAttribute('data-contrast', 'normal');
      }
    };

    // Initial check
    updateContrastMode();

    // Listen for changes
    forcedColorsQuery.addEventListener('change', updateContrastMode);
    prefersContrastQuery.addEventListener('change', updateContrastMode);

    return () => {
      forcedColorsQuery.removeEventListener('change', updateContrastMode);
      prefersContrastQuery.removeEventListener('change', updateContrastMode);
    };
  }, []);

  const updateContrastStyles = () => {
    // Force re-check of contrast preferences
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
    const prefersContrastQuery = window.matchMedia('(prefers-contrast: more)');
    
    if (forcedColorsQuery.matches || prefersContrastQuery.matches) {
      document.documentElement.style.setProperty('--contrast-multiplier', '1.5');
    } else {
      document.documentElement.style.setProperty('--contrast-multiplier', '1');
    }
  };

  return {
    isHighContrast,
    contrastLevel,
    updateContrastStyles,
  };
}
