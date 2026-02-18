/**
 * Theme Context Provider
 * 
 * Manages theme state including dark mode, high contrast, and color adjustments
 * Integrates with system preferences and provides runtime contrast checking
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useHighContrast } from '../hooks/useHighContrast';
import { useDarkMode } from '../hooks/useDarkMode';
import { prefersHighContrast, adjustForHighContrast } from '../utils/contrastChecker';

interface ThemeContextValue {
  darkMode: boolean;
  highContrast: boolean;
  contrastLevel: 'normal' | 'high' | 'forced';
  toggleDarkMode: () => void;
  adjustColor: (color: string, isBackground?: boolean) => string;
  getTextColor: (backgroundColor: string) => string;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { isHighContrast, contrastLevel, updateContrastStyles } = useHighContrast();
  const [mounted, setMounted] = useState(false);

  // Apply theme classes to document root
  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;

    // Apply dark mode class
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply high contrast class
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Update contrast styles
    updateContrastStyles();
  }, [darkMode, isHighContrast, updateContrastStyles]);

  // Adjust color based on high contrast mode
  const adjustColor = (color: string, isBackground: boolean = false): string => {
    if (!isHighContrast) return color;
    
    const multiplier = contrastLevel === 'forced' ? 2 : 1.5;
    return adjustForHighContrast(color, isBackground, multiplier);
  };

  // Get appropriate text color for a background
  const getTextColor = (backgroundColor: string): string => {
    // In high contrast mode, use pure black or white
    if (isHighContrast) {
      // Simple luminance check
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    // Normal mode: use design system colors
    return darkMode ? '#e2e8f0' : '#1e293b';
  };

  const value: ThemeContextValue = {
    darkMode,
    highContrast: isHighContrast,
    contrastLevel,
    toggleDarkMode,
    adjustColor,
    getTextColor,
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
