/**
 * Theme System Types
 * 
 * Types for centralized Kawaii theme system with system-wide
 * and trip-specific color configurations
 */

export interface KawaiiColorTheme {
  id: string;
  theme_name: string;
  
  // Primary colors (50-950 scale)
  primary_50: string;
  primary_100: string;
  primary_200: string;
  primary_300: string;
  primary_400: string;
  primary_500: string;
  primary_600: string;
  primary_700: string;
  primary_800: string;
  primary_900: string;
  primary_950: string;
  
  // Background
  cream_bg: string;
  
  // Neutral colors (50-950 scale)
  neutral_50: string;
  neutral_100: string;
  neutral_200: string;
  neutral_300: string;
  neutral_400: string;
  neutral_500: string;
  neutral_600: string;
  neutral_700: string;
  neutral_800: string;
  neutral_900: string;
  neutral_950: string;
  
  created_at: Date;
  updated_at: Date;
}

export interface SystemColorTheme extends KawaiiColorTheme {
  is_active: boolean;
}

export interface TripColorTheme extends KawaiiColorTheme {
  trip_id: string;
}

export interface UpdateThemeRequest {
  // Primary colors (optional - only update provided values)
  primary_50?: string;
  primary_100?: string;
  primary_200?: string;
  primary_300?: string;
  primary_400?: string;
  primary_500?: string;
  primary_600?: string;
  primary_700?: string;
  primary_800?: string;
  primary_900?: string;
  primary_950?: string;
  
  // Background
  cream_bg?: string;
  
  // Neutral colors (optional)
  neutral_50?: string;
  neutral_100?: string;
  neutral_200?: string;
  neutral_300?: string;
  neutral_400?: string;
  neutral_500?: string;
  neutral_600?: string;
  neutral_700?: string;
  neutral_800?: string;
  neutral_900?: string;
  neutral_950?: string;
}

export interface ThemePreset {
  name: string;
  description: string;
  colors: UpdateThemeRequest;
}

// Kawaii theme presets
export const KAWAII_THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Kawaii Pink',
    description: 'Soft pink theme - default',
    colors: {
      primary_500: '#FFB3BA',
      primary_600: '#ff6b7f',
      primary_700: '#ff4d63',
    }
  },
  {
    name: 'Kawaii Orange',
    description: 'Warm orange theme',
    colors: {
      primary_500: '#F4A460',
      primary_600: '#ea580c',
      primary_700: '#c2410c',
    }
  },
  {
    name: 'Kawaii Blue',
    description: 'Calm blue theme',
    colors: {
      primary_500: '#6B9BD1',
      primary_600: '#2563eb',
      primary_700: '#1d4ed8',
    }
  },
  {
    name: 'Kawaii Teal',
    description: 'Fresh teal theme',
    colors: {
      primary_500: '#7ECEC4',
      primary_600: '#0d9488',
      primary_700: '#0f766e',
    }
  },
  {
    name: 'Kawaii Purple',
    description: 'Dreamy purple theme',
    colors: {
      primary_500: '#C5B3E6',
      primary_600: '#9333ea',
      primary_700: '#7e22ce',
    }
  },
  {
    name: 'Kawaii Yellow',
    description: 'Cheerful yellow theme',
    colors: {
      primary_500: '#FFD97D',
      primary_600: '#f59e0b',
      primary_700: '#d97706',
    }
  },
];
