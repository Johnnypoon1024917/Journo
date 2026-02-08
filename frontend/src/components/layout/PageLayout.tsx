/**
 * PageLayout Component
 * 
 * Reusable page wrapper that provides:
 * - Consistent padding and spacing
 * - Responsive container with overflow protection
 * - Sticker display integration
 * - Loading and error states
 * - Grid-based layout compatibility
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
  showStickers = false,
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
        'flex flex-col min-h-screen',
        'bg-kawaii-cream dark:bg-kawaii-neutral-900',
        'overflow-x-hidden',
        'w-full',
        className
      )}
    >
      {/* Sticker Display */}
      {showStickers && tripId && (
        <div className="relative z-10 pointer-events-none">
          <StickerDisplay
            tripId={tripId}
            elementType={entityType === 'trip' ? 'trip' : entityType === 'trip_day' ? 'day' : 'activity'}
            elementId={entityId || tripId}
            editable={true}
          />
        </div>
      )}
      
      {/* Main Content */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          'overflow-x-hidden overflow-y-auto',
          contentClassName
        )}
      >
        <div
          className={cn(
            'mx-auto w-full',
            maxWidthClasses[maxWidth],
            !noPadding && 'px-4 sm:px-6 md:px-8',
            !noPadding && 'py-6 md:py-8',
            'box-border'
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
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
              role="status"
              aria-live="polite"
            >
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-kawaii-pink border-t-transparent" />
              <p className="mt-5 text-lg font-medium text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                Loading...
              </p>
            </motion.div>
          )}
          
          {/* Error State */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-5 mb-6 shadow-sm"
              role="alert"
            >
              <p className="text-red-800 dark:text-red-200 font-medium leading-relaxed">
                {error}
              </p>
            </motion.div>
          )}
          
          {/* Page Content */}
          {!isLoading && !error && (
            <div className="overflow-x-hidden w-full">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
