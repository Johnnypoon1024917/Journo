/**
 * NavigationWrapper Component
 * 
 * Handles responsive navigation rendering:
 * - Side navigation for desktop/tablet
 * - Bottom navigation for mobile
 * - Consistent active tab handling
 * - Proper spacing for navigation elements
 */

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { BottomNavigation } from '@/components/kawaii/BottomNavigation';
import { SideNavigation } from '@/components/kawaii/SideNavigation';

export type NavigationTab = 'schedule' | 'checklist' | 'booking' | 'shopping' | 'members' | 'settings';

interface NavigationWrapperProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  children: React.ReactNode;
}

export const NavigationWrapper: React.FC<NavigationWrapperProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);

  return (
    <>
      {/* Desktop: Side Navigation */}
      {!isMobile && (
        <SideNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          collapsed={sideNavCollapsed}
          onCollapsedChange={setSideNavCollapsed}
          className="fixed left-0 top-0 bottom-0 z-40"
        />
      )}
      
      {/* Page Content with proper spacing */}
      <div
        className={cn(
          !isMobile && (sideNavCollapsed ? 'ml-20' : 'ml-60'), // 80px collapsed, 240px expanded
          'transition-all duration-300', // Smooth transition when collapsing
          'overflow-x-hidden', // Prevent horizontal scrolling
          'max-w-full', // Ensure content doesn't exceed viewport width
          'w-full' // Take full available width
        )}
      >
        {children}
        {/* Spacer for bottom navigation on mobile */}
        {isMobile && <div className="h-24" />}
      </div>
      
      {/* Mobile: Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      )}
    </>
  );
};
