/**
 * ResponsiveKawaiiNavigation Component
 * 
 * Automatically switches between SideNavigation (desktop/tablet) and 
 * BottomNavigation (mobile) based on screen size.
 * 
 * Features:
 * - Automatic responsive switching
 * - Consistent navigation state across layouts
 * - Smooth transitions between layouts
 * - Proper content spacing
 * 
 * Requirements: 17.4, 17.5
 */

import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { SideNavigation } from './SideNavigation';
import { BottomNavigation } from './BottomNavigation';

export interface ResponsiveKawaiiNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  sideNavCollapsed?: boolean;
  onSideNavCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

/**
 * ResponsiveKawaiiNavigation
 * 
 * Renders SideNavigation on desktop/tablet and BottomNavigation on mobile.
 * Automatically handles responsive switching and maintains navigation state.
 */
export const ResponsiveKawaiiNavigation: React.FC<ResponsiveKawaiiNavigationProps> = ({
  activeTab,
  onTabChange,
  sideNavCollapsed,
  onSideNavCollapsedChange,
  className,
}) => {
  const { isDesktop, isTablet } = useResponsive();
  
  // Show side navigation on desktop and tablet
  const showSideNav = isDesktop || isTablet;

  return (
    <>
      {showSideNav ? (
        <SideNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          collapsed={sideNavCollapsed}
          onCollapsedChange={onSideNavCollapsedChange}
          className={className}
        />
      ) : (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          className={className}
        />
      )}
    </>
  );
};

/**
 * Hook to get the appropriate content margin based on navigation layout
 * 
 * @param sideNavCollapsed - Whether the side navigation is collapsed
 * @returns CSS class string for content margin
 */
export const useNavigationMargin = (sideNavCollapsed: boolean = false): string => {
  const { isDesktop, isTablet } = useResponsive();
  const showSideNav = isDesktop || isTablet;

  if (!showSideNav) {
    // Mobile: bottom navigation, add bottom padding
    return 'pb-20';
  }

  // Desktop/Tablet: side navigation, add left margin
  return sideNavCollapsed ? 'ml-20' : 'ml-60';
};

/**
 * Layout wrapper component that includes responsive navigation
 * and properly spaced content area
 */
export interface ResponsiveKawaiiLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  sideNavCollapsed?: boolean;
  onSideNavCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export const ResponsiveKawaiiLayout: React.FC<ResponsiveKawaiiLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  sideNavCollapsed = false,
  onSideNavCollapsedChange,
  className,
}) => {
  const contentMargin = useNavigationMargin(sideNavCollapsed);

  return (
    <div className="min-h-screen bg-kawaii-neutral-50 dark:bg-kawaii-neutral-950">
      <ResponsiveKawaiiNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        sideNavCollapsed={sideNavCollapsed}
        onSideNavCollapsedChange={onSideNavCollapsedChange}
      />
      
      <main className={`${contentMargin} transition-all duration-300 ${className || ''}`}>
        {children}
      </main>
    </div>
  );
};
