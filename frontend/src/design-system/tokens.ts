/**
 * Design System Tokens
 * 
 * Modern color palette, typography, and spacing tokens inspired by
 * market-leading travel platforms like Wanderlog, with WCAG AA compliance.
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
// Color Tokens
// ============================================

export const colors = {
  // Primary brand colors - Travel-inspired blue (WCAG AA compliant)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0284c7',  // Main brand color - darker for better contrast (was #0ea5e9)
    600: '#0369a1',  // Enhanced contrast
    700: '#075985',
    800: '#0c4a6e',
    900: '#082f49',
    950: '#051e34',
  } as ColorPalette,

  // Secondary colors - Warm accent
  secondary: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',  // Warm yellow
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  } as ColorPalette,

  // Neutral grays - Modern and accessible (WCAG AA compliant)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',  // Mid-tone gray
    600: '#475569',  // Enhanced for text on white (6.2:1 contrast)
    700: '#334155',  // Strong contrast (10.7:1)
    800: '#1e293b',  // Very strong (14.8:1)
    900: '#0f172a',
    950: '#020617',
  } as ColorPalette,

  // Semantic colors
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // Success green
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
      500: '#f59e0b',  // Warning amber
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
      500: '#ef4444',  // Error red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',  // Info blue (same as primary)
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
  } as SemanticColors,

  // Travel-specific theme colors
  adventure: {
    50: '#fef3c7',
    100: '#fde68a',
    200: '#fcd34d',
    300: '#fbbf24',
    400: '#f59e0b',
    500: '#d97706',  // Adventure orange
    600: '#b45309',
    700: '#92400e',
    800: '#78350f',
    900: '#451a03',
  } as ColorPalette,

  romantic: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',  // Romantic pink
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  } as ColorPalette,

  foodie: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Foodie red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  } as ColorPalette,

  chill: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Chill green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  } as ColorPalette,
};

// ============================================
// Typography Tokens
// ============================================

export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ],
    serif: [
      'Playfair Display',
      'Georgia',
      'Times New Roman',
      'serif',
    ],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Monaco',
      'Consolas',
      'monospace',
    ],
  },

  scale: {
    // Display text - Hero sections, landing pages
    display: {
      fontSize: '3.75rem',    // 60px
      lineHeight: '1.1',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    } as TypographyScale,

    // Headings - Section titles, page headers
    heading: {
      fontSize: '2.25rem',    // 36px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.015em',
    } as TypographyScale,

    // Subheadings - Card titles, subsection headers
    subheading: {
      fontSize: '1.5rem',     // 24px
      lineHeight: '1.3',
      fontWeight: '500',
      letterSpacing: '-0.01em',
    } as TypographyScale,

    // Body text - Main content, descriptions
    body: {
      fontSize: '1rem',       // 16px
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0',
    } as TypographyScale,

    // Caption text - Helper text, metadata
    caption: {
      fontSize: '0.875rem',   // 14px
      lineHeight: '1.4',
      fontWeight: '400',
      letterSpacing: '0.01em',
    } as TypographyScale,

    // Overline text - Labels, categories
    overline: {
      fontSize: '0.75rem',    // 12px
      lineHeight: '1.3',
      fontWeight: '500',
      letterSpacing: '0.05em',
    } as TypographyScale,
  },

  // Responsive typography modifiers
  responsive: {
    mobile: {
      display: { fontSize: '2.5rem', lineHeight: '1.1' },
      heading: { fontSize: '1.875rem', lineHeight: '1.2' },
      subheading: { fontSize: '1.25rem', lineHeight: '1.3' },
      body: { fontSize: '1rem', lineHeight: '1.5' },
      caption: { fontSize: '0.875rem', lineHeight: '1.4' },
      overline: { fontSize: '0.75rem', lineHeight: '1.3' },
    },
    tablet: {
      display: { fontSize: '3rem', lineHeight: '1.1' },
      heading: { fontSize: '2rem', lineHeight: '1.2' },
      subheading: { fontSize: '1.375rem', lineHeight: '1.3' },
      body: { fontSize: '1rem', lineHeight: '1.5' },
      caption: { fontSize: '0.875rem', lineHeight: '1.4' },
      overline: { fontSize: '0.75rem', lineHeight: '1.3' },
    },
  },
};

// ============================================
// Spacing Tokens
// ============================================

export const spacing: SpacingScale = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
};

// Touch-friendly spacing for mobile
export const touchSpacing = {
  xs: '0.5rem',     // 8px
  sm: '0.75rem',    // 12px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
};

// ============================================
// Breakpoint Tokens
// ============================================

export const breakpoints: Breakpoints = {
  xs: '320px',      // Small phones
  sm: '640px',      // Large phones / small tablets
  md: '768px',      // Tablets
  lg: '1024px',     // Small laptops
  xl: '1280px',     // Laptops / desktops
  '2xl': '1536px',  // Large desktops
};

// ============================================
// Animation Tokens
// ============================================

export const animations: AnimationTokens = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.6, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  transitions: {
    all: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================
// Shadow Tokens
// ============================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// ============================================
// Border Radius Tokens
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
};

// ============================================
// Z-Index Scale
// ============================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1020,
  banner: 1030,
  overlay: 1040,
  modal: 1050,
  popover: 1060,
  skipLink: 1070,
  toast: 1080,
  tooltip: 1090,
};

// ============================================
// Complete Theme Configuration
// ============================================

export const defaultTheme: ThemeConfig = {
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    neutral: colors.neutral,
    semantic: colors.semantic,
  },
  typography,
  spacing,
  breakpoints,
  animations,
  shadows,
  borderRadius,
};

// ============================================
// Utility Functions
// ============================================

export const getColorValue = (palette: ColorPalette, shade: keyof ColorPalette): string => {
  return palette[shade];
};

export const getResponsiveValue = <T>(
  values: { mobile?: T; tablet?: T; desktop?: T },
  fallback: T
): T => {
  // This would be used with a responsive hook in components
  return values.desktop || values.tablet || values.mobile || fallback;
};

export const createColorVariants = (baseColor: string) => ({
  50: `${baseColor}0D`,   // 5% opacity
  100: `${baseColor}1A`,  // 10% opacity
  200: `${baseColor}33`,  // 20% opacity
  300: `${baseColor}4D`,  // 30% opacity
  400: `${baseColor}66`,  // 40% opacity
  500: baseColor,         // 100% opacity
  600: `${baseColor}E6`,  // 90% opacity
  700: `${baseColor}CC`,  // 80% opacity
  800: `${baseColor}B3`,  // 70% opacity
  900: `${baseColor}99`,  // 60% opacity
});

// ============================================
// CSS Custom Properties Export
// ============================================

export const cssVariables = {
  // Colors
  '--color-primary-50': colors.primary[50],
  '--color-primary-500': colors.primary[500],
  '--color-primary-600': colors.primary[600],
  '--color-primary-700': colors.primary[700],
  
  // Typography
  '--font-family-sans': typography.fontFamily.sans.join(', '),
  '--font-size-body': typography.scale.body.fontSize,
  '--line-height-body': typography.scale.body.lineHeight,
  
  // Spacing
  '--spacing-xs': spacing.xs,
  '--spacing-sm': spacing.sm,
  '--spacing-md': spacing.md,
  '--spacing-lg': spacing.lg,
  '--spacing-xl': spacing.xl,
  
  // Animations
  '--duration-fast': animations.duration.fast,
  '--duration-normal': animations.duration.normal,
  '--duration-slow': animations.duration.slow,
  '--easing-ease-out': animations.easing.easeOut,
  '--easing-ease-in-out': animations.easing.easeInOut,
  '--easing-spring': animations.easing.spring,
  
  // Shadows
  '--shadow-sm': shadows.sm,
  '--shadow-md': shadows.md,
  '--shadow-lg': shadows.lg,
  '--shadow-xl': shadows.xl,
  
  // Border radius
  '--radius-sm': borderRadius.sm,
  '--radius-md': borderRadius.md,
  '--radius-lg': borderRadius.lg,
  '--radius-xl': borderRadius.xl,
};