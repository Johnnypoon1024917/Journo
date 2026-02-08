/**
 * Layout Constants
 * 
 * Centralized layout values for consistent spacing, positioning, and z-index management
 */

export const LAYOUT_CONSTANTS = {
  // Page Padding
  PAGE_PADDING_MOBILE: '1rem',
  PAGE_PADDING_DESKTOP: '2rem',
  PAGE_PADDING_TOP: '1rem',
  PAGE_PADDING_BOTTOM_MOBILE: '6rem', // Space for bottom nav
  PAGE_PADDING_BOTTOM_DESKTOP: '2rem',
  
  // Section Spacing
  SECTION_GAP: '1.5rem',
  CARD_GAP: '1rem',
  
  // FAB Position
  FAB_BOTTOM_MOBILE: '5rem', // Above bottom nav (64px nav + 16px gap)
  FAB_BOTTOM_DESKTOP: '2rem',
  FAB_RIGHT: '1.5rem',
  FAB_SIZE: '3.5rem',
  FAB_ICON_SIZE: '1.5rem',
  
  // Navigation
  BOTTOM_NAV_HEIGHT: '4rem',
  SIDE_NAV_WIDTH: '5rem',
  
  // Z-Index Layers
  Z_INDEX: {
    CONTENT: 1,
    STICKY: 10,
    DROPDOWN: 20,
    FAB: 40,
    NAVIGATION: 50,
    MODAL_BACKDROP: 90,
    MODAL: 100,
    TOAST: 200,
  },
  
  // Breakpoints (matching Tailwind)
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
  },
  
  // Container Max Width
  CONTAINER_MAX_WIDTH: '1280px',
  
  // Drag and Drop
  DRAG_HANDLE_SIZE: '2.5rem',
  DRAG_ACTIVATION_DISTANCE: 8, // pixels
  DRAG_ACTIVATION_DELAY: 150, // milliseconds for touch
} as const;

export type LayoutConstants = typeof LAYOUT_CONSTANTS;
