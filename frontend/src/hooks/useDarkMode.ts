import { useEffect, useState } from 'react';

const DARK_MODE_KEY = 'journo-dark-mode';

type DarkModePreference = 'light' | 'dark' | 'system';

export function useDarkMode() {
  // FORCE LIGHT MODE - Dark mode is disabled
  const [darkMode] = useState<boolean>(false);
  const [preference] = useState<DarkModePreference>('light');

  // Apply light mode class to HTML element
  useEffect(() => {
    const root = document.documentElement;
    
    // Always remove dark class
    root.classList.remove('dark');
    
    // Force light mode in localStorage
    localStorage.setItem(DARK_MODE_KEY, 'light');
  }, []);

  // Disabled functions - dark mode is not available
  const setDarkModePreference = (newPreference: DarkModePreference) => {
    console.log('Dark mode is currently disabled');
  };

  const toggleDarkMode = () => {
    console.log('Dark mode is currently disabled');
  };

  return {
    darkMode: false, // Always false
    preference: 'light' as const, // Always light
    setDarkModePreference,
    toggleDarkMode,
  };
}
