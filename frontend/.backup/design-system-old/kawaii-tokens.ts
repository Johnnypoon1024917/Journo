/**
 * Kawaii Design System Tokens
 * 
 * Nostalgic, joyful color palette and design tokens inspired by
 * decorating physical travel schedule books.
 */

import type { 
  ColorPalette, 
  SemanticColors, 
  TypographyScale, 
  SpacingScale, 
  Breakpoints, 
  AnimationTokens,
  ThemeConfig 
} from './types';

// ============================================
// Kawaii Color Tokens
// ============================================

export const kawaiiColors = {
  // Primary kawaii colors - Soft pink/coral
  primary: {
    50: '#fff5f7',
    100: '#ffe3e8',
    200: '#ffc7d1',
    300: '#ffaaba',
    400: '#ff8ea3',
    500: '#FFB3BA',  // Main kawaii pink
    600: '#ff6b7f',
    700: '#ff4d63',
    800: '#ff2f47',
    900: '#e6002b',
    950: '#b30021',
  } as ColorPalette,

  // Theme color options
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#F4A460',  // Kawaii orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  } as ColorPalette,

  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#6B9BD1',  // Kawaii blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  } as ColorPalette,

  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#7ECEC4',  // Kawaii teal
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  } as ColorPalette,

  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#FFB3BA',  // Kawaii pink (same as primary)
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  } as ColorPalette,

  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#C5B3E6',  // Kawaii purple
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  } as ColorPalette,

  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#FFD97D',  // Kawaii yellow
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  } as ColorPalette,

  // Neutral colors - Soft and warm
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  } as ColorPalette,

  // Cream background for day cards
  cream: '#FFF8F0',
  
  // Semantic colors with kawaii twist
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#86D293',  // Soft success green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#FFD97D',  // Soft warning yellow
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#FF9AA2',  // Soft error red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#6B9BD1',  // Soft info blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  } as SemanticColors,
};

// ============================================
// Kawaii Typography Tokens
// ============================================

export const kawaiiTypography = {
  fontFamily: {
    sans: [
      'Noto Sans TC',
      'Noto Sans',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ],
    display: [
      'Fredoka',
      'Noto Sans TC',
      'Noto Sans',
      'sans-serif',
    ],
  },

  scale: {
    // Display text - Hero sections
    display: {
      fontSize: '2.5rem',     // 40px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.02em',
    } as TypographyScale,

    // Headings - Section titles
    heading: {
      fontSize: '1.875rem',   // 30px
      lineHeight: '1.3',
      fontWeight: '600',
      letterSpacing: '-0.015em',
    } as TypographyScale,

    // Subheadings - Card titles
    subheading: {
      fontSize: '1.25rem',    // 20px
      lineHeight: '1.4',
      fontWeight: '500',
      letterSpacing: '-0.01em',
    } as TypographyScale,

    // Body text - Main content
    body: {
      fontSize: '1rem',       // 16px (default, adjustable 12-24px)
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0',
    } as TypographyScale,

    // Caption text - Helper text
    caption: {
      fontSize: '0.875rem',   // 14px
      lineHeight: '1.4',
      fontWeight: '400',
      letterSpacing: '0.01em',
    } as TypographyScale,

    // Overline text - Labels
    overline: {
      fontSize: '0.75rem',    // 12px
      lineHeight: '1.3',
      fontWeight: '500',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    } as TypographyScale,
  },

  // Font size range for user customization
  fontSizeRange: {
    min: 12,
    max: 24,
    default: 16,
  },
};

// ============================================
// Kawaii Spacing Tokens (Touch-Optimized)
// ============================================

export const kawaiiSpacing: SpacingScale = {
  xs: '0.5rem',     // 8px
  sm: '0.75rem',    // 12px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
};

// Minimum touch target size
export const touchTarget = {
  min: '44px',      // iOS/Android minimum
  comfortable: '48px',
  large: '56px',
};

// ============================================
// Kawaii Animation Tokens
// ============================================

export const kawaiiAnimations: AnimationTokens = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.6, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // Bouncy spring
  },
  transitions: {
    all: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',  // Spring transform
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================
// Kawaii Shadow Tokens (Softer)
// ============================================

export const kawaiiShadows = {
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
  md: '0 4px 8px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 20px -5px rgba(0, 0, 0, 0.12)',
  xl: '0 20px 30px -8px rgba(0, 0, 0, 0.15)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  none: 'none',
  // Colored shadows for kawaii effect
  coloredSm: '0 2px 8px -2px',
  coloredMd: '0 4px 12px -3px',
  coloredLg: '0 8px 20px -5px',
};

// ============================================
// Kawaii Border Radius Tokens (Rounder)
// ============================================

export const kawaiiBorderRadius = {
  none: '0',
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  '3xl': '3rem',    // 48px
  full: '9999px',
};

// ============================================
// Kawaii Theme Presets
// ============================================

export const kawaiiThemePresets = [
  {
    name: 'Pink',
    value: '#FFB3BA',
    palette: kawaiiColors.pink,
  },
  {
    name: 'Orange',
    value: '#F4A460',
    palette: kawaiiColors.orange,
  },
  {
    name: 'Blue',
    value: '#6B9BD1',
    palette: kawaiiColors.blue,
  },
  {
    name: 'Teal',
    value: '#7ECEC4',
    palette: kawaiiColors.teal,
  },
  {
    name: 'Purple',
    value: '#C5B3E6',
    palette: kawaiiColors.purple,
  },
  {
    name: 'Yellow',
    value: '#FFD97D',
    palette: kawaiiColors.yellow,
  },
];

// ============================================
// Complete Kawaii Theme Configuration
// ============================================

export const defaultKawaiiTheme: ThemeConfig = {
  colors: {
    primary: kawaiiColors.primary,
    secondary: kawaiiColors.yellow,
    neutral: kawaiiColors.neutral,
    semantic: kawaiiColors.semantic,
  },
  typography: kawaiiTypography,
  spacing: kawaiiSpacing,
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  animations: kawaiiAnimations,
  shadows: kawaiiShadows,
  borderRadius: kawaiiBorderRadius,
};

// ============================================
// CSS Custom Properties for Kawaii Theme
// ============================================

export const kawaiiCSSVariables = {
  // Primary colors
  '--kawaii-primary-50': kawaiiColors.primary[50],
  '--kawaii-primary-100': kawaiiColors.primary[100],
  '--kawaii-primary-200': kawaiiColors.primary[200],
  '--kawaii-primary-300': kawaiiColors.primary[300],
  '--kawaii-primary-400': kawaiiColors.primary[400],
  '--kawaii-primary-500': kawaiiColors.primary[500],
  '--kawaii-primary-600': kawaiiColors.primary[600],
  '--kawaii-primary-700': kawaiiColors.primary[700],
  '--kawaii-primary-800': kawaiiColors.primary[800],
  '--kawaii-primary-900': kawaiiColors.primary[900],
  
  // Cream background
  '--kawaii-cream': kawaiiColors.cream,
  
  // Typography
  '--kawaii-font-family': kawaiiTypography.fontFamily.sans.join(', '),
  '--kawaii-font-size-body': kawaiiTypography.scale.body.fontSize,
  '--kawaii-line-height-body': kawaiiTypography.scale.body.lineHeight,
  
  // Spacing
  '--kawaii-spacing-xs': kawaiiSpacing.xs,
  '--kawaii-spacing-sm': kawaiiSpacing.sm,
  '--kawaii-spacing-md': kawaiiSpacing.md,
  '--kawaii-spacing-lg': kawaiiSpacing.lg,
  '--kawaii-spacing-xl': kawaiiSpacing.xl,
  
  // Touch targets
  '--kawaii-touch-min': touchTarget.min,
  '--kawaii-touch-comfortable': touchTarget.comfortable,
  '--kawaii-touch-large': touchTarget.large,
  
  // Animations
  '--kawaii-duration-fast': kawaiiAnimations.duration.fast,
  '--kawaii-duration-normal': kawaiiAnimations.duration.normal,
  '--kawaii-duration-slow': kawaiiAnimations.duration.slow,
  '--kawaii-easing-spring': kawaiiAnimations.easing.spring,
  
  // Shadows
  '--kawaii-shadow-sm': kawaiiShadows.sm,
  '--kawaii-shadow-md': kawaiiShadows.md,
  '--kawaii-shadow-lg': kawaiiShadows.lg,
  
  // Border radius
  '--kawaii-radius-sm': kawaiiBorderRadius.sm,
  '--kawaii-radius-md': kawaiiBorderRadius.md,
  '--kawaii-radius-lg': kawaiiBorderRadius.lg,
  '--kawaii-radius-xl': kawaiiBorderRadius.xl,
};

// ============================================
// Utility Functions
// ============================================

export const getKawaiiThemeColor = (themeName: string): string => {
  const preset = kawaiiThemePresets.find(p => p.name === themeName);
  return preset?.value || kawaiiColors.primary[500];
};

export const getKawaiiThemePalette = (themeName: string): ColorPalette => {
  const preset = kawaiiThemePresets.find(p => p.name === themeName);
  return preset?.palette || kawaiiColors.primary;
};

export const applyKawaiiTheme = (primaryColor: string, fontSize: number = 16): Record<string, string> => {
  return {
    '--kawaii-primary': primaryColor,
    '--kawaii-font-size': `${fontSize}px`,
    '--kawaii-font-size-sm': `${fontSize * 0.875}px`,
    '--kawaii-font-size-lg': `${fontSize * 1.125}px`,
    '--kawaii-font-size-xl': `${fontSize * 1.25}px`,
  };
};
