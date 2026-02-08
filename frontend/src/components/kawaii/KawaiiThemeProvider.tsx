/**
 * Kawaii Theme Provider
 * 
 * Wraps the application and provides kawaii theme context.
 * Manages CSS custom properties and theme state.
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useKawaiiThemeStore, AnimationType } from '@/stores/kawaiiThemeStore';

interface KawaiiThemeContextValue {
  primaryColor: string;
  fontSize: number;
  darkMode: boolean;
  animations: AnimationType;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setDarkMode: (enabled: boolean) => void;
  setAnimations: (type: AnimationType) => void;
}

const KawaiiThemeContext = createContext<KawaiiThemeContextValue | undefined>(undefined);

export const useKawaiiTheme = () => {
  const context = useContext(KawaiiThemeContext);
  if (!context) {
    throw new Error('useKawaiiTheme must be used within KawaiiThemeProvider');
  }
  return context;
};

interface KawaiiThemeProviderProps {
  children: React.ReactNode;
}

export const KawaiiThemeProvider: React.FC<KawaiiThemeProviderProps> = ({ children }) => {
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

  // Update document title color for mobile browsers
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', primaryColor);
    }
  }, [primaryColor]);

  const contextValue: KawaiiThemeContextValue = {
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
    <KawaiiThemeContext.Provider value={contextValue}>
      {children}
    </KawaiiThemeContext.Provider>
  );
};
