/**
 * FABContainer Component
 * 
 * Standardized FAB positioning and management:
 * - Consistent position across pages
 * - Responsive positioning with safe area insets
 * - Z-index management
 * - Support for primary and secondary FABs
 * 
 * Requirements: 7.6
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { FAB } from '@/components/kawaii/FAB';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LAYOUT_CONSTANTS } from '@/styles/layout-constants';
import { safeAreaService } from '@/services/safeAreaService';

export interface FABAction {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

interface FABContainerProps {
  primary: FABAction;
  secondary?: FABAction[];
  show?: boolean;
}

export const FABContainer: React.FC<FABContainerProps> = ({
  primary,
  secondary = [],
  show = true,
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [showSecondary, setShowSecondary] = React.useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = React.useState(safeAreaService.getInsets());

  // Subscribe to safe area changes (for orientation changes)
  React.useEffect(() => {
    const unsubscribe = safeAreaService.subscribeToChanges((insets) => {
      setSafeAreaInsets(insets);
    });

    return unsubscribe;
  }, []);

  // Parse the bottom value and add safe area inset
  const baseBottom = isMobile 
    ? parseFloat(LAYOUT_CONSTANTS.FAB_BOTTOM_MOBILE) * 16 // Convert rem to px (assuming 16px base)
    : parseFloat(LAYOUT_CONSTANTS.FAB_BOTTOM_DESKTOP) * 16;
  
  const bottomWithSafeArea = baseBottom + safeAreaInsets.bottom;

  const fabStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: `${bottomWithSafeArea}px`,
    right: LAYOUT_CONSTANTS.FAB_RIGHT,
    zIndex: LAYOUT_CONSTANTS.Z_INDEX.FAB,
  };

  return (
    <AnimatePresence>
      {show && (
        <div style={fabStyle}>
          {/* Secondary FABs */}
          <AnimatePresence>
            {showSecondary && secondary.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-col gap-3 mb-3"
              >
                {secondary.map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: { delay: index * 0.05 }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.8, 
                      y: 20,
                      transition: { delay: (secondary.length - index - 1) * 0.05 }
                    }}
                  >
                    <button
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        'w-12 h-12 rounded-full shadow-lg',
                        'flex items-center justify-center',
                        'transition-all duration-200',
                        'hover:scale-110 active:scale-95',
                        action.variant === 'primary' 
                          ? 'bg-kawaii-pink text-white hover:bg-kawaii-pink-dark'
                          : 'bg-white dark:bg-kawaii-neutral-800 text-kawaii-neutral-700 dark:text-kawaii-neutral-300',
                        action.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                      aria-label={action.label}
                      title={action.label}
                    >
                      {action.icon}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary FAB */}
          <FAB
            onClick={() => {
              if (secondary.length > 0) {
                setShowSecondary(!showSecondary);
              } else {
                primary.onClick();
              }
            }}
            icon={primary.icon}
            label={primary.label}
          />
        </div>
      )}
    </AnimatePresence>
  );
};
