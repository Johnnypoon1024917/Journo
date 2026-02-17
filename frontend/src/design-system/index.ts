/**
 * Design System Entry Point
 * 
 * Modern, atomic design system for travel platform UI/UX.
 * Exports all components, tokens, and utilities.
 */

// Design tokens and configuration
export * from './tokens';
export * from './types';
export * from './animations';
export * from './bubblequest-tokens';

// Atomic components
export * from './atoms';
export * from './molecules';
export * from './organisms';

// Theme Provider
export { ThemeProvider, useTheme } from './ThemeProvider';

// Utilities
export { cn } from '../utils/cn';

// Theme configuration
export { defaultTheme, cssVariables } from './tokens';
export { animationSystem } from './animations';
export { defaultBubbleQuestTheme, bubbleQuestThemePresets } from './bubblequest-tokens';

// Re-export commonly used types
export type {
  ThemeConfig,
  DesignSystemConfig,
  ButtonAtomProps,
  InputAtomProps,
  TextAtomProps,
  IconAtomProps,
  AvatarAtomProps,
  BadgeAtomProps,
  CardMoleculeProps,
} from './types';

// Re-export card components
export type {
  TravelCardProps,
  CardGridProps,
  CardCarouselProps,
} from './molecules';
export type {
  CardGridProps as CardGridPropsOrganism,
  CardCarouselProps as CardCarouselPropsOrganism,
} from './organisms';