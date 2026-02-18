/**
 * Accessibility Provider
 * 
 * Centralized provider for all accessibility features:
 * - High contrast mode
 * - Reduced motion
 * - Dynamic text sizing
 * - Keyboard navigation preferences
 * - Screen reader announcements
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useHighContrast } from '../hooks/useHighContrast';
import { useReducedMotion } from '../hooks/useAccessibility';
import { useDynamicTextSize } from '../hooks/useDynamicTextSize';

interface AccessibilityContextValue {
  // High contrast
  isHighContrast: boolean;
  contrastLevel: 'normal' | 'high' | 'forced';
  updateContrastStyles: () => void;
  
  // Reduced motion
  prefersReducedMotion: boolean;
  shouldAnimate: boolean;
  getAnimationDuration: (duration: number) => number;
  getTransitionDuration: (duration: number) => number;
  
  // Dynamic text sizing
  fontSize: number;
  fontScale: number;
  isTextScaled: boolean;
  updateFontSize: (newSize: number) => void;
  resetFontSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const highContrast = useHighContrast();
  const reducedMotion = useReducedMotion();
  const dynamicTextSize = useDynamicTextSize();

  const value: AccessibilityContextValue = {
    // High contrast
    isHighContrast: highContrast.isHighContrast,
    contrastLevel: highContrast.contrastLevel,
    updateContrastStyles: highContrast.updateContrastStyles,
    
    // Reduced motion
    prefersReducedMotion: reducedMotion.prefersReducedMotion,
    shouldAnimate: reducedMotion.shouldAnimate,
    getAnimationDuration: reducedMotion.getAnimationDuration,
    getTransitionDuration: reducedMotion.getTransitionDuration,
    
    // Dynamic text sizing
    fontSize: dynamicTextSize.fontSize,
    fontScale: dynamicTextSize.scale,
    isTextScaled: dynamicTextSize.isScaled,
    updateFontSize: dynamicTextSize.updateFontSize,
    resetFontSize: dynamicTextSize.resetFontSize,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}
