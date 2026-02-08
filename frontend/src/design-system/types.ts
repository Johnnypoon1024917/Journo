/**
 * Design System Types and Interfaces
 * 
 * This file defines the TypeScript interfaces for the atomic design system
 * following modern UI/UX patterns comparable to market-leading travel platforms.
 */

// ============================================
// Core Design Tokens
// ============================================

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950?: string;
}

export interface SemanticColors {
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  info: ColorPalette;
}

export interface TypographyScale {
  fontSize: string;
  lineHeight: string;
  fontWeight?: string;
  letterSpacing?: string;
}

export interface SpacingScale {
  xs: string;    // 4px
  sm: string;    // 8px
  md: string;    // 16px
  lg: string;    // 24px
  xl: string;    // 32px
  '2xl': string; // 48px
  '3xl': string; // 64px
  '4xl': string; // 96px
}

export interface Breakpoints {
  xs: string;    // 320px
  sm: string;    // 640px
  md: string;    // 768px
  lg: string;    // 1024px
  xl: string;    // 1280px
  '2xl': string; // 1536px
}

export interface AnimationTokens {
  duration: {
    fast: string;     // 150ms
    normal: string;   // 300ms
    slow: string;     // 500ms
  };
  easing: {
    easeOut: string;
    easeInOut: string;
    spring: string;
  };
  transitions: {
    all: string;
    transform: string;
    opacity: string;
    colors: string;
  };
}

// ============================================
// Component Interfaces
// ============================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface InteractiveProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
}

export interface ResponsiveProps {
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  mobileOnly?: boolean;
  tabletOnly?: boolean;
  desktopOnly?: boolean;
}

// ============================================
// Atomic Design System Interfaces
// ============================================

// Atoms
export interface AtomProps extends BaseComponentProps {
  variant?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface ButtonAtomProps extends AtomProps, InteractiveProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  type?: 'button' | 'submit' | 'reset';
}

export interface InputAtomProps extends AtomProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface IconAtomProps extends AtomProps {
  name: string;
  color?: string;
  strokeWidth?: number;
}

export interface TextAtomProps extends AtomProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  variant?: 'display' | 'heading' | 'subheading' | 'body' | 'caption' | 'overline';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error' | 'info';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
}

export interface AvatarAtomProps extends AtomProps {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface BadgeAtomProps extends AtomProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  dot?: boolean;
}

// Molecules
export interface MoleculeProps extends BaseComponentProps, ResponsiveProps {
  variant?: string;
}

export interface FormFieldMoleculeProps extends MoleculeProps {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface SearchBarMoleculeProps extends MoleculeProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  suggestions?: string[];
  loading?: boolean;
  clearable?: boolean;
}

export interface CardMoleculeProps extends MoleculeProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface ToastMoleculeProps extends MoleculeProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  duration?: number;
}

// Organisms
export interface OrganismProps extends BaseComponentProps, ResponsiveProps {
  loading?: boolean;
  error?: string;
}

export interface NavigationOrganismProps extends OrganismProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  user?: UserProfile;
  onUserMenuClick?: () => void;
}

export interface TripPlannerOrganismProps extends OrganismProps {
  trip?: Trip;
  onTripUpdate?: (trip: Trip) => void;
  onPlaceAdd?: (place: Place) => void;
  onPlaceRemove?: (placeId: string) => void;
  onPlaceReorder?: (places: Place[]) => void;
}

export interface DestinationGridOrganismProps extends OrganismProps {
  destinations: Destination[];
  onDestinationClick?: (destination: Destination) => void;
  onDestinationFavorite?: (destinationId: string) => void;
  layout?: 'grid' | 'list' | 'masonry';
  columns?: 1 | 2 | 3 | 4;
}

// ============================================
// Data Models
// ============================================

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  badge?: number;
  children?: NavigationItem[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  destinations: Destination[];
  places: Place[];
  collaborators?: UserProfile[];
  isPublic?: boolean;
  coverImage?: string;
}

export interface Destination {
  id: string;
  name: string;
  description?: string;
  country: string;
  region?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  images: string[];
  rating?: number;
  category: string;
  tags: string[];
  isFavorite?: boolean;
}

export interface Place {
  id: string;
  name: string;
  description?: string;
  address?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category: string;
  rating?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  images: string[];
  openingHours?: string[];
  website?: string;
  phone?: string;
  visitDuration?: number; // in minutes
  notes?: string;
  cost?: number;
  dayIndex?: number;
  order?: number;
}

// ============================================
// Animation and Interaction Types
// ============================================

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface MicroInteraction {
  trigger: 'hover' | 'focus' | 'active' | 'click' | 'load';
  animation: AnimationConfig;
  transform?: string;
  scale?: number;
  rotate?: number;
  translate?: { x?: number; y?: number };
}

export interface TransitionConfig {
  property: string;
  duration: string;
  easing: string;
  delay?: string;
}

// ============================================
// Theme and Customization
// ============================================

export interface ThemeConfig {
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    neutral: ColorPalette;
    semantic: SemanticColors;
  };
  typography: {
    fontFamily: {
      sans: string[];
      serif: string[];
      mono: string[];
    };
    scale: {
      display: TypographyScale;
      heading: TypographyScale;
      subheading: TypographyScale;
      body: TypographyScale;
      caption: TypographyScale;
      overline: TypographyScale;
    };
  };
  spacing: SpacingScale;
  breakpoints: Breakpoints;
  animations: AnimationTokens;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
}

export interface DesignSystemConfig {
  theme: ThemeConfig;
  components: {
    [componentName: string]: {
      defaultProps?: Record<string, any>;
      variants?: Record<string, Record<string, any>>;
      sizes?: Record<string, Record<string, any>>;
    };
  };
}

// ============================================
// Accessibility Types
// ============================================

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  role?: string;
  tabIndex?: number;
}

export interface KeyboardNavigationProps {
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
}

// ============================================
// Performance and Optimization Types
// ============================================

export interface LazyLoadingProps {
  lazy?: boolean;
  threshold?: number;
  rootMargin?: string;
  placeholder?: React.ReactNode;
}

export interface VirtualizationProps {
  virtualized?: boolean;
  itemHeight?: number;
  overscan?: number;
  scrollToIndex?: number;
}

// ============================================
// Form and Validation Types
// ============================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
}

export interface FormState {
  fields: Record<string, FormFieldState>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
  errors: Record<string, string>;
}