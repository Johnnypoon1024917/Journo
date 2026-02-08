/**
 * NavigationWrapper Component
 * 
 * Handles responsive navigation rendering:
 * - Side navigation for desktop/tablet
 * - Bottom navigation for mobile
 * - Proper spacing and overflow prevention
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
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Desktop: Side Navigation */}
      {!isMobile && (
        <SideNavigation
          activeTab={activeTab}
          onTabChange={(tab) => onTabChange(tab as NavigationTab)}
          collapsed={sideNavCollapsed}
          onCollapsedChange={setSideNavCollapsed}
          className="fixed left-0 top-0 bottom-0 z-40"
        />
      )}
      
      {/* Page Content with proper spacing */}
      <div
        className={cn(
          'min-h-screen w-full',
          !isMobile && (sideNavCollapsed ? 'pl-20' : 'pl-60'),
          'transition-[padding] duration-300',
          'overflow-x-hidden'
        )}
      >
        {children}
        {/* Spacer for bottom navigation on mobile */}
        {isMobile && <div className="h-24 shrink-0" />}
      </div>
      
      {/* Mobile: Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={(tab) => onTabChange(tab as NavigationTab)}
        />
      )}
    </div>
  );
};
