/**
 * Kawaii Theme Provider
 * 
 * Provides theme context and injects CSS custom properties for dynamic theming.
 * Manages theme state and applies changes to the document root.
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useKawaiiThemeStore, type AnimationType } from '@/stores/kawaiiThemeStore';

interface ThemeContextValue {
  primaryColor: string;
  fontSize: number;
  darkMode: boolean;
  animations: AnimationType;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setDarkMode: (enabled: boolean) => void;
  setAnimations: (type: AnimationType) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const {
    primaryColor,
    fontSize,
    darkMode,
    animations,
    setPrimaryColor,
    setFontSize,
    setDarkMode,
    setAnimations,
    loadTheme,
  } = useKawaiiThemeStore();

  // Load theme on mount
  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const value: ThemeContextValue = {
    primaryColor,
    fontSize,
    darkMode,
    animations,
    setPrimaryColor,
    setFontSize,
    setDarkMode,
    setAnimations,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
