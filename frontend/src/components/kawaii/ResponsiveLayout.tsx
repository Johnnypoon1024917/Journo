/**
 * Kawaii ResponsiveLayout Component
 * 
 * Responsive layout wrapper that adapts to different screen sizes.
 * 
 * Features:
 * - Mobile-first layouts (320px-767px)
 * - Tablet layouts (768px-1023px)
 * - Desktop layouts (1024px+)
 * - Automatic navigation switching (bottom for mobile, side for desktop)
 * - Safe area insets for devices with notches
 * - Smooth transitions between layouts
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '@/hooks/useResponsive';
import { BottomNavigation } from './BottomNavigation';
import { SideNavigation } from './SideNavigation';
import { cn } from '@/utils/cn';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  /** Whether to show navigation (default: true) */
  showNavigation?: boolean;
  /** Active navigation tab */
  activeTab?: string;
  /** Navigation tab change handler */
  onTabChange?: (tab: string) => void;
  /** Additional className for the main content area */
  contentClassName?: string;
  /** Additional className for the layout container */
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  showNavigation = true,
  activeTab,
  onTabChange,
  contentClassName,
  className,
}) => {
  const { isMobileLayout, isTabletLayout, isDesktopLayout } = useResponsive();

  // Determine which navigation to show
  const showBottomNav = showNavigation && (isMobileLayout || isTabletLayout);
  const showSideNav = showNavigation && isDesktopLayout;

  return (
    <div
      className={cn(
        'min-h-screen',
        'bg-[#f7f3eb] dark:bg-kawaii-neutral-900',
        'transition-colors duration-300',
        className
      )}
    >
      {/* Side Navigation for Desktop */}
      <AnimatePresence mode="wait">
        {showSideNav && (
          <motion.div
            key="side-nav"
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          >
            <SideNavigation
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main
        id="main-content"
        className={cn(
          // Base styles
          'transition-all duration-300',
          // Mobile layout (320px-767px)
          'min-h-screen',
          // Add padding for bottom navigation on mobile/tablet
          showBottomNav && 'pb-20',
          // Desktop layout with side navigation
          showSideNav && 'ml-[240px]',
          // Safe area insets
          'pt-safe',
          contentClassName
        )}
      >
        {/* Content wrapper with responsive padding */}
        <div
          className={cn(
            // Mobile padding (320px-767px)
            'px-4 py-4',
            // Tablet padding (768px-1023px)
            'md:px-6 md:py-6',
            // Desktop padding (1024px+)
            'lg:px-8 lg:py-8',
            // Max width constraints
            'max-w-mobile md:max-w-tablet lg:max-w-desktop xl:max-w-wide',
            'mx-auto'
          )}
        >
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile/Tablet */}
      <AnimatePresence mode="wait">
        {showBottomNav && (
          <motion.div
            key="bottom-nav"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          >
            <BottomNavigation
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Responsive Container Component
 * 
 * A simple container that adapts its max-width based on screen size.
 */
export interface ResponsiveContainerProps {
  children: React.ReactNode;
  /** Size variant (default: 'default') */
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
  /** Additional className */
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  size = 'default',
  className,
}) => {
  const sizeClasses = {
    sm: 'max-w-mobile md:max-w-tablet',
    default: 'max-w-mobile md:max-w-tablet lg:max-w-desktop',
    lg: 'max-w-mobile md:max-w-tablet lg:max-w-desktop xl:max-w-wide',
    xl: 'max-w-mobile md:max-w-tablet lg:max-w-desktop xl:max-w-wide 2xl:max-w-ultra',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        // Responsive padding
        'px-4 md:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Responsive Grid Component
 * 
 * A grid that adapts its columns based on screen size.
 */
export interface ResponsiveGridProps {
  children: React.ReactNode;
  /** Number of columns on mobile (default: 1) */
  mobileCols?: 1 | 2;
  /** Number of columns on tablet (default: 2) */
  tabletCols?: 2 | 3 | 4;
  /** Number of columns on desktop (default: 3) */
  desktopCols?: 2 | 3 | 4 | 5 | 6;
  /** Gap size (default: 'md') */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional className */
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  mobileCols = 1,
  tabletCols = 2,
  desktopCols = 3,
  gap = 'md',
  className,
}) => {
  const mobileColsClass = mobileCols === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const tabletColsClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[tabletCols];
  const desktopColsClass = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  }[desktopCols];

  const gapClass = {
    sm: 'gap-2 md:gap-3',
    md: 'gap-4 md:gap-5 lg:gap-6',
    lg: 'gap-6 md:gap-7 lg:gap-8',
    xl: 'gap-8 md:gap-10 lg:gap-12',
  }[gap];

  return (
    <div
      className={cn(
        'grid',
        mobileColsClass,
        tabletColsClass,
        desktopColsClass,
        gapClass,
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Responsive Stack Component
 * 
 * A flex container that can switch between column and row based on screen size.
 */
export interface ResponsiveStackProps {
  children: React.ReactNode;
  /** Direction on mobile (default: 'column') */
  mobileDirection?: 'row' | 'column';
  /** Direction on tablet (default: 'row') */
  tabletDirection?: 'row' | 'column';
  /** Direction on desktop (default: 'row') */
  desktopDirection?: 'row' | 'column';
  /** Gap size (default: 'md') */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  /** Alignment (default: 'start') */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justify (default: 'start') */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  /** Additional className */
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  mobileDirection = 'column',
  tabletDirection = 'row',
  desktopDirection = 'row',
  gap = 'md',
  align = 'start',
  justify = 'start',
  className,
}) => {
  const mobileDirectionClass = mobileDirection === 'row' ? 'flex-row' : 'flex-col';
  const tabletDirectionClass = tabletDirection === 'row' ? 'md:flex-row' : 'md:flex-col';
  const desktopDirectionClass = desktopDirection === 'row' ? 'lg:flex-row' : 'lg:flex-col';

  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }[gap];

  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[align];

  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  }[justify];

  return (
    <div
      className={cn(
        'flex',
        mobileDirectionClass,
        tabletDirectionClass,
        desktopDirectionClass,
        gapClass,
        alignClass,
        justifyClass,
        className
      )}
    >
      {children}
    </div>
  );
};
