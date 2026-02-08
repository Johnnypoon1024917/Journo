/**
 * Centralized Theme Store
 * 
 * Manages both system-wide and trip-specific Kawaii themes.
 * Fetches theme configuration from database and applies CSS custom properties.
 */

import { create } from 'zustand';
import { themeService } from '@/services/themeService';
import type { KawaiiColorTheme } from '@/types/theme';

interface CentralizedThemeState {
  // Current active theme
  currentTheme: KawaiiColorTheme | null;
  
  // System theme (fallback)
  systemTheme: KawaiiColorTheme | null;
  
  // Trip-specific theme (if viewing a trip)
  tripTheme: KawaiiColorTheme | null;
  currentTripId: string | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadSystemTheme: () => Promise<void>;
  loadUserTheme: () => Promise<void>;
  loadTripTheme: (tripId: string) => Promise<void>;
  updateSystemTheme: (updates: Partial<KawaiiColorTheme>) => Promise<void>;
  updateTripTheme: (tripId: string, updates: Partial<KawaiiColorTheme>) => Promise<void>;
  deleteTripTheme: (tripId: string) => Promise<void>;
  applyTheme: (theme: KawaiiColorTheme) => void;
  setCurrentTheme: (theme: KawaiiColorTheme) => void;
  resetToSystemTheme: () => void;
}

// Apply theme colors to CSS custom properties
const applyCSSVariables = (theme: KawaiiColorTheme) => {
  const root = document.documentElement;
  
  // Primary colors
  root.style.setProperty('--kawaii-primary-50', theme.primary_50);
  root.style.setProperty('--kawaii-primary-100', theme.primary_100);
  root.style.setProperty('--kawaii-primary-200', theme.primary_200);
  root.style.setProperty('--kawaii-primary-300', theme.primary_300);
  root.style.setProperty('--kawaii-primary-400', theme.primary_400);
  root.style.setProperty('--kawaii-primary-500', theme.primary_500);
  root.style.setProperty('--kawaii-primary-600', theme.primary_600);
  root.style.setProperty('--kawaii-primary-700', theme.primary_700);
  root.style.setProperty('--kawaii-primary-800', theme.primary_800);
  root.style.setProperty('--kawaii-primary-900', theme.primary_900);
  root.style.setProperty('--kawaii-primary-950', theme.primary_950);
  
  // Background
  root.style.setProperty('--kawaii-cream', theme.cream_bg);
  
  // Neutral colors
  root.style.setProperty('--kawaii-neutral-50', theme.neutral_50);
  root.style.setProperty('--kawaii-neutral-100', theme.neutral_100);
  root.style.setProperty('--kawaii-neutral-200', theme.neutral_200);
  root.style.setProperty('--kawaii-neutral-300', theme.neutral_300);
  root.style.setProperty('--kawaii-neutral-400', theme.neutral_400);
  root.style.setProperty('--kawaii-neutral-500', theme.neutral_500);
  root.style.setProperty('--kawaii-neutral-600', theme.neutral_600);
  root.style.setProperty('--kawaii-neutral-700', theme.neutral_700);
  root.style.setProperty('--kawaii-neutral-800', theme.neutral_800);
  root.style.setProperty('--kawaii-neutral-900', theme.neutral_900);
  root.style.setProperty('--kawaii-neutral-950', theme.neutral_950);
};

export const useCentralizedThemeStore = create<CentralizedThemeState>((set, get) => ({
  currentTheme: null,
  systemTheme: null,
  tripTheme: null,
  currentTripId: null,
  isLoading: false,
  error: null,

  loadSystemTheme: async () => {
    set({ isLoading: true, error: null });
    try {
      const theme = await themeService.getSystemTheme();
      set({ systemTheme: theme, isLoading: false });
      
      // Apply system theme if no trip theme is active
      if (!get().currentTripId) {
        get().applyTheme(theme);
      }
    } catch (error) {
      console.error('Failed to load system theme:', error);
      // Don't block the app - just use default CSS variables
      set({ error: 'Failed to load system theme', isLoading: false });
      // Theme will use default values from CSS
    }
  },

  loadTripTheme: async (tripId: string) => {
    set({ isLoading: true, error: null, currentTripId: tripId });
    try {
      const theme = await themeService.getTripTheme(tripId);
      set({ tripTheme: theme, isLoading: false });
      // Always apply the trip theme when loaded
      get().applyTheme(theme);
    } catch (error) {
      console.error('Failed to load trip theme:', error);
      // Fallback to system theme
      const { systemTheme } = get();
      if (systemTheme) {
        get().applyTheme(systemTheme);
      }
      // Don't block the app - theme will use defaults
      set({ error: 'Failed to load trip theme', isLoading: false });
    }
  },

  updateSystemTheme: async (updates: Partial<KawaiiColorTheme>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTheme = await themeService.updateSystemTheme(updates);
      set({ systemTheme: updatedTheme, isLoading: false });
      
      // Apply if no trip theme is active
      if (!get().currentTripId) {
        get().applyTheme(updatedTheme);
      }
    } catch (error) {
      console.error('Failed to update system theme:', error);
      set({ error: 'Failed to update system theme', isLoading: false });
    }
  },

  updateTripTheme: async (tripId: string, updates: Partial<KawaiiColorTheme>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTheme = await themeService.updateTripTheme(tripId, updates);
      set({ tripTheme: updatedTheme, currentTripId: tripId, isLoading: false });
      
      // Always apply the updated theme immediately
      get().applyTheme(updatedTheme);
    } catch (error) {
      console.error('Failed to update trip theme:', error);
      set({ error: 'Failed to update trip theme', isLoading: false });
    }
  },

  deleteTripTheme: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      await themeService.deleteTripTheme(tripId);
      set({ tripTheme: null, isLoading: false });
      
      // Revert to system theme
      const { systemTheme } = get();
      if (systemTheme) {
        get().applyTheme(systemTheme);
      }
    } catch (error) {
      console.error('Failed to delete trip theme:', error);
      set({ error: 'Failed to delete trip theme', isLoading: false });
    }
  },

  loadUserTheme: async () => {
    try {
      const userTheme = await themeService.getUserTheme();
      
      // If user has a saved theme color, apply it
      if (userTheme.primary_500) {
        const { systemTheme } = get();
        if (systemTheme) {
          // Create a modified theme with user's color
          const customTheme = {
            ...systemTheme,
            primary_500: userTheme.primary_500,
          };
          get().applyTheme(customTheme);
        }
      }
    } catch (error) {
      console.warn('Failed to load user theme:', error);
      // Don't block - just use system theme
    }
  },

  applyTheme: (theme: KawaiiColorTheme) => {
    applyCSSVariables(theme);
    set({ currentTheme: theme });
  },

  setCurrentTheme: (theme: KawaiiColorTheme) => {
    // Apply CSS variables immediately when theme changes
    applyCSSVariables(theme);
    set({ currentTheme: theme });
  },

  resetToSystemTheme: () => {
    const { systemTheme } = get();
    if (systemTheme) {
      get().applyTheme(systemTheme);
      set({ currentTripId: null, tripTheme: null });
    }
  },
}));
