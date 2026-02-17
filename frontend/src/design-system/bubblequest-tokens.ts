/**
 * BubbleQuest Design System Tokens
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
// BubbleQuest Color Tokens
// ============================================

export const bubblequestColors = {
  // Primary bubblequest colors - Soft pink/coral
  primary: {
    50: '#fff5f7',
    100: '#ffe3e8',
    200: '#ffc7d1',
    300: '#ffaaba',
    400: '#ff8ea3',
    500: '#FFB3BA',  // Main bubblequest pink
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
    500: '#F4A460',  // BubbleQuest orange
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
    500: '#6B9BD1',  // BubbleQuest blue
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
    500: '#7ECEC4',  // BubbleQuest teal
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
    500: '#FFB3BA',  // BubbleQuest pink (same as primary)
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
    500: '#C5B3E6',  // BubbleQuest purple
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
    500: '#FFD97D',  // BubbleQuest yellow
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
  
  // Semantic colors with bubblequest twist
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
// BubbleQuest Typography Tokens
// ============================================

export const bubblequestTypography = {
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
// BubbleQuest Spacing Tokens (Touch-Optimized)
// ============================================

export const bubblequestSpacing: SpacingScale = {
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
// BubbleQuest Animation Tokens
// ============================================

export const bubblequestAnimations: AnimationTokens = {
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
// BubbleQuest Shadow Tokens (Softer)
// ============================================

export const bubblequestShadows = {
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
  md: '0 4px 8px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 20px -5px rgba(0, 0, 0, 0.12)',
  xl: '0 20px 30px -8px rgba(0, 0, 0, 0.15)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  none: 'none',
  // Colored shadows for bubblequest effect
  coloredSm: '0 2px 8px -2px',
  coloredMd: '0 4px 12px -3px',
  coloredLg: '0 8px 20px -5px',
};

// ============================================
// BubbleQuest Border Radius Tokens (Rounder)
// ============================================

export const bubblequestBorderRadius = {
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
// BubbleQuest Theme Presets
// ============================================

export const bubblequestThemePresets = [
  {
    name: 'Pink',
    value: '#FFB3BA',
    palette: bubblequestColors.pink,
  },
  {
    name: 'Orange',
    value: '#F4A460',
    palette: bubblequestColors.orange,
  },
  {
    name: 'Blue',
    value: '#6B9BD1',
    palette: bubblequestColors.blue,
  },
  {
    name: 'Teal',
    value: '#7ECEC4',
    palette: bubblequestColors.teal,
  },
  {
    name: 'Purple',
    value: '#C5B3E6',
    palette: bubblequestColors.purple,
  },
  {
    name: 'Yellow',
    value: '#FFD97D',
    palette: bubblequestColors.yellow,
  },
];

// ============================================
// Complete BubbleQuest Theme Configuration
// ============================================

export const defaultBubbleQuestTheme: ThemeConfig = {
  colors: {
    primary: bubblequestColors.primary,
    secondary: bubblequestColors.yellow,
    neutral: bubblequestColors.neutral,
    semantic: bubblequestColors.semantic,
  },
  typography: bubblequestTypography,
  spacing: bubblequestSpacing,
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  animations: bubblequestAnimations,
  shadows: bubblequestShadows,
  borderRadius: bubblequestBorderRadius,
};

// ============================================
// CSS Custom Properties for BubbleQuest Theme
// ============================================

export const bubblequestCSSVariables = {
  // Primary colors
  '--bubblequest-primary-50': bubblequestColors.primary[50],
  '--bubblequest-primary-100': bubblequestColors.primary[100],
  '--bubblequest-primary-200': bubblequestColors.primary[200],
  '--bubblequest-primary-300': bubblequestColors.primary[300],
  '--bubblequest-primary-400': bubblequestColors.primary[400],
  '--bubblequest-primary-500': bubblequestColors.primary[500],
  '--bubblequest-primary-600': bubblequestColors.primary[600],
  '--bubblequest-primary-700': bubblequestColors.primary[700],
  '--bubblequest-primary-800': bubblequestColors.primary[800],
  '--bubblequest-primary-900': bubblequestColors.primary[900],
  
  // Cream background
  '--bubblequest-cream': bubblequestColors.cream,
  
  // Typography
  '--bubblequest-font-family': bubblequestTypography.fontFamily.sans.join(', '),
  '--bubblequest-font-size-body': bubblequestTypography.scale.body.fontSize,
  '--bubblequest-line-height-body': bubblequestTypography.scale.body.lineHeight,
  
  // Spacing
  '--bubblequest-spacing-xs': bubblequestSpacing.xs,
  '--bubblequest-spacing-sm': bubblequestSpacing.sm,
  '--bubblequest-spacing-md': bubblequestSpacing.md,
  '--bubblequest-spacing-lg': bubblequestSpacing.lg,
  '--bubblequest-spacing-xl': bubblequestSpacing.xl,
  
  // Touch targets
  '--bubblequest-touch-min': touchTarget.min,
  '--bubblequest-touch-comfortable': touchTarget.comfortable,
  '--bubblequest-touch-large': touchTarget.large,
  
  // Animations
  '--bubblequest-duration-fast': bubblequestAnimations.duration.fast,
  '--bubblequest-duration-normal': bubblequestAnimations.duration.normal,
  '--bubblequest-duration-slow': bubblequestAnimations.duration.slow,
  '--bubblequest-easing-spring': bubblequestAnimations.easing.spring,
  
  // Shadows
  '--bubblequest-shadow-sm': bubblequestShadows.sm,
  '--bubblequest-shadow-md': bubblequestShadows.md,
  '--bubblequest-shadow-lg': bubblequestShadows.lg,
  
  // Border radius
  '--bubblequest-radius-sm': bubblequestBorderRadius.sm,
  '--bubblequest-radius-md': bubblequestBorderRadius.md,
  '--bubblequest-radius-lg': bubblequestBorderRadius.lg,
  '--bubblequest-radius-xl': bubblequestBorderRadius.xl,
};

// ============================================
// Utility Functions
// ============================================

export const getBubbleQuestThemeColor = (themeName: string): string => {
  const preset = bubblequestThemePresets.find(p => p.name === themeName);
  return preset?.value || bubblequestColors.primary[500];
};

export const getBubbleQuestThemePalette = (themeName: string): ColorPalette => {
  const preset = bubblequestThemePresets.find(p => p.name === themeName);
  return preset?.palette || bubblequestColors.primary;
};

export const applyBubbleQuestTheme = (primaryColor: string, fontSize: number = 16): Record<string, string> => {
  return {
    '--bubblequest-primary': primaryColor,
    '--bubblequest-font-size': `${fontSize}px`,
    '--bubblequest-font-size-sm': `${fontSize * 0.875}px`,
    '--bubblequest-font-size-lg': `${fontSize * 1.125}px`,
    '--bubblequest-font-size-xl': `${fontSize * 1.25}px`,
  };
};
