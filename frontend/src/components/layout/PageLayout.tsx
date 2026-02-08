/**
 * PageLayout Component
 * 
 * Reusable page wrapper that provides:
 * - Consistent padding and spacing
 * - Responsive container
 * - Sticker display integration
 * - Loading and error states
 * - Proper spacing for navigation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { StickerDisplay } from '@/components/kawaii/StickerDisplay';
import { LAYOUT_CONSTANTS } from '@/styles/layout-constants';

interface PageLayoutProps {
  children: React.ReactNode;
  
  // Sticker support
  tripId?: string;
  entityType?: 'trip' | 'trip_day' | 'place';
  entityId?: string;
  showStickers?: boolean;
  
  // Layout options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
  
  // States
  isLoading?: boolean;
  error?: string | null;
  
  // Styling
  className?: string;
  contentClassName?: string;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  tripId,
  entityType = 'trip',
  entityId,
  showStickers = false, // Changed default to false since pages handle their own stickers
  maxWidth = 'xl',
  noPadding = false,
  isLoading = false,
  error = null,
  className,
  contentClassName,
}) => {
  return (
    <div 
      className={cn(
        'relative min-h-screen',
        'bg-kawaii-cream dark:bg-kawaii-neutral-900',
        'overflow-x-hidden', // Prevent horizontal scrolling
        'w-full max-w-full', // Ensure full width but not exceeding viewport
        className
      )}
    >
      {/* Sticker Display */}
      {showStickers && tripId && (
        <StickerDisplay
          tripId={tripId}
          elementType={entityType === 'trip' ? 'trip' : entityType === 'trip_day' ? 'day' : 'activity'}
          elementId={entityId || tripId}
          editable={true}
        />
      )}
      
      {/* Main Content */}
      <div
        className={cn(
          'relative mx-auto',
          'w-full max-w-full', // Ensure content fits viewport
          maxWidthClasses[maxWidth],
          !noPadding && 'px-4 md:px-8 pt-4 pb-8',
          contentClassName
        )}
        style={{
          zIndex: LAYOUT_CONSTANTS.Z_INDEX.CONTENT,
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-kawaii-pink border-t-transparent" />
              <p className="mt-4 text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                Loading...
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
          >
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </motion.div>
        )}
        
        {/* Page Content */}
        {!isLoading && !error && children}
      </div>
    </div>
  );
};
