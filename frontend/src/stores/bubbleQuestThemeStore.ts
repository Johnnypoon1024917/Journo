/**
 * BubbleQuest Theme Store (Backward Compatibility Wrapper)
 * 
 * This is a compatibility wrapper around the centralized theme store.
 * It maintains the old API for components that haven't been migrated yet.
 * 
 * @deprecated Use useCentralizedThemeStore instead
 */

import { useCentralizedThemeStore } from './centralizedThemeStore';
import { themeService } from '../services/themeService';

export type AnimationType = 'none' | 'snow' | 'sakura';

export interface KawaiiThemePreset {
  name: string;
  value: string;  // Changed from 'color' to 'value' to match ThemeCustomization component
  description: string;
}

// BubbleQuest theme presets (for backward compatibility)
export const bubbleQuestThemePresets: KawaiiThemePreset[] = [
  {
    name: 'BubbleQuest Pink',
    value: '#FFB3BA',
    description: 'Soft pink theme - default',
  },
  {
    name: 'BubbleQuest Orange',
    value: '#F4A460',
    description: 'Warm orange theme',
  },
  {
    name: 'BubbleQuest Blue',
    value: '#6B9BD1',
    description: 'Calm blue theme',
  },
  {
    name: 'BubbleQuest Teal',
    value: '#7ECEC4',
    description: 'Fresh teal theme',
  },
  {
    name: 'BubbleQuest Purple',
    value: '#C5B3E6',
    description: 'Dreamy purple theme',
  },
  {
    name: 'BubbleQuest Yellow',
    value: '#FFD97D',
    description: 'Cheerful yellow theme',
  },
];

/**
 * @deprecated Use useCentralizedThemeStore instead
 */
export const useBubbleQuestThemeStore = () => {
  const centralizedStore = useCentralizedThemeStore();
  
  return {
    // Map centralized store to old API
    primaryColor: centralizedStore.currentTheme?.primary_500 || '#FFB3BA',
    fontSize: 16, // Default font size
    darkMode: false, // Always false (dark mode disabled)
    animations: 'none' as AnimationType,
    
    // Actions
    setPrimaryColor: async (color: string) => {
      // Update local state immediately for instant feedback
      if (centralizedStore.currentTheme) {
        centralizedStore.setCurrentTheme({
          ...centralizedStore.currentTheme,
          primary_500: color,
        });
      }
      
      // Save user's theme preference to database (non-blocking)
      try {
        console.log('💾 Saving user theme color to database:', color);
        await themeService.updateUserTheme(color);
        console.log('✅ User theme saved successfully');
      } catch (error: any) {
        console.error('❌ Failed to save user theme:', error);
        
        // Check if it's an auth error
        if (error.response?.status === 401) {
          console.warn('⚠️ Authentication required to save theme. Please log in.');
        } else {
          console.error('Theme save error details:', error.response?.data || error.message);
        }
        
        // Don't throw - we already updated locally
        // User can still use the theme, it just won't persist
      }
    },
    setFontSize: (_size: number) => {
      // Font size not supported in centralized theme
      console.warn('Font size customization moved to browser settings');
    },
    setDarkMode: (_enabled: boolean) => {
      // Dark mode disabled
      console.warn('Dark mode is currently disabled');
    },
    setAnimations: (_type: AnimationType) => {
      // Animations not part of centralized theme
      console.warn('Animation settings moved to separate configuration');
    },
    loadTheme: () => {
      centralizedStore.loadSystemTheme();
    },
    saveTheme: () => {
      // Auto-saved in centralized store
    },
    resetTheme: () => {
      centralizedStore.resetToSystemTheme();
    },
  };
};
