/**
 * useFABPosition Hook
 * 
 * Manages Floating Action Button positioning to prevent overlaps
 * with bottom navigation and other FABs.
 * 
 * Features:
 * - Responsive positioning (mobile vs desktop)
 * - Automatic stacking for multiple FABs
 * - Consistent z-index hierarchy
 * - Bottom navigation awareness
 * 
 * Note: Notification functionality is now in the header navigation bar.
 * The notification FAB type is kept for backward compatibility but not actively used.
 */

import { useMemo } from 'react';
import { useMediaQuery } from './useMediaQuery';

export type FABType = 'notification' | 'primary' | 'secondary' | 'recycle';

interface FABPosition {
  bottom: string;
  right: string;
  zIndex: number;
}

interface UseFABPositionOptions {
  type: FABType;
  index?: number; // For stacking multiple FABs (0 = bottom-most)
  hasBottomNav?: boolean; // Whether bottom navigation is visible
}

/**
 * Z-index hierarchy:
 * - notification: 9998 (legacy, not actively used - notifications in header)
 * - recycle: 60 (above stickers)
 * - primary: 50 (main action buttons)
 * - secondary: 45 (secondary actions)
 */
const Z_INDEX_MAP: Record<FABType, number> = {
  notification: 9998,
  recycle: 60,
  primary: 50,
  secondary: 45,
};

/**
 * Bottom navigation height + safe padding
 * Mobile: 64px (h-16) + 8px padding = 72px
 * Desktop: No bottom nav, use standard padding
 */
const BOTTOM_NAV_HEIGHT = 72; // 18 in Tailwind (72px)
const STANDARD_BOTTOM = 24; // 6 in Tailwind (24px)
const FAB_SPACING = 76; // Space between stacked FABs (56px FAB + 20px gap)

export const useFABPosition = ({
  type,
  index = 0,
  hasBottomNav = true,
}: UseFABPositionOptions): FABPosition => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const position = useMemo(() => {
    const zIndex = Z_INDEX_MAP[type];
    const right = '1rem'; // 4 in Tailwind (16px) - consistent for all

    // Calculate bottom position
    let bottomPx: number;

    if (isMobile && hasBottomNav) {
      // Mobile with bottom navigation
      // Start above bottom nav and stack upwards
      bottomPx = BOTTOM_NAV_HEIGHT + (index * FAB_SPACING);
    } else {
      // Desktop or mobile without bottom nav
      bottomPx = STANDARD_BOTTOM + (index * FAB_SPACING);
    }

    return {
      bottom: `${bottomPx}px`,
      right,
      zIndex,
    };
  }, [type, index, isMobile, hasBottomNav]);

  return position;
};

/**
 * Helper to get inline styles for FAB positioning
 */
export const getFABStyle = (position: FABPosition): React.CSSProperties => ({
  position: 'fixed',
  bottom: position.bottom,
  right: position.right,
  zIndex: position.zIndex,
});
