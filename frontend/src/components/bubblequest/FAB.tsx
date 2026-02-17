/**
 * BubbleQuest FAB (Floating Action Button) Component
 * 
 * A floating action button that appears above content for primary actions.
 * Matches the design of the sticker button.
 * 
 * Features:
 * - Fixed positioning with solid background
 * - Scale animation on hover/tap
 * - Support for custom icons and labels
 * - Positioned above bottom navigation (bottom: 80px)
 * - z-index 50 to float above content
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface FABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-center';
  className?: string;
}

export const FAB: React.FC<FABProps> = ({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  className,
}) => {
  const positionClasses = {
    'bottom-right': 'right-4 sm:right-6',
    'bottom-center': 'left-1/2 -translate-x-1/2',
  };
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        // Fixed positioning
        'fixed bottom-24 z-50',
        positionClasses[position],
        // Size and shape - matches sticker button
        'w-14 h-14 rounded-full',
        'bg-gradient-to-br from-primary-500 to-primary-600',
        'hover:from-primary-600 hover:to-primary-700',
        'flex items-center justify-center',
        // Shadow and text color
        'text-white shadow-lg',
        // Transitions
        'transition-all duration-200',
        // Touch optimization
        'touch-manipulation',
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={label || 'Add'}
    >
      {icon || (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
    </motion.button>
  );
};
