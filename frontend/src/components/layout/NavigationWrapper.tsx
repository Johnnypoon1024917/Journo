/**
 * NavigationWrapper - ABSOLUTE MINIMAL
 * NO grid, NO complex layout, just simple divs
 * CONTROLS GLOBAL BACKGROUND COLOR FOR ALL PAGES
 */

import React, { useState, useEffect } from 'react';
import { SideNavigation } from '@/components/kawaii/SideNavigation';
import { BottomNavigation } from '@/components/kawaii/BottomNavigation';
import { SkipLinks } from '@/components/common/SkipLinks';
import { safeAreaService } from '@/services/safeAreaService';

export type NavigationTab = 'schedule' | 'booking' | 'budget' | 'shopping' | 'checklist' | 'members' | 'settings';

export interface NavigationWrapperProps {
  children: React.ReactNode;
  activeTab?: NavigationTab;
  onTabChange?: (tab: NavigationTab) => void;
}

export const NavigationWrapper: React.FC<NavigationWrapperProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState(safeAreaService.getInsets());

  // Subscribe to safe area changes (for orientation changes)
  useEffect(() => {
    const unsubscribe = safeAreaService.subscribeToChanges((insets) => {
      setSafeAreaInsets(insets);
    });

    return unsubscribe;
  }, []);

  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab as NavigationTab);
    }
  };

  const sidebarWidth = sideNavCollapsed ? 80 : 240;

  return (
    <>
      {/* Skip Links - Always first for keyboard navigation */}
      <SkipLinks mainContentId="main-content" />

      {/* Desktop: Sidebar + Content side by side */}
      <div className="hidden md:block min-h-screen bg-[#f7f3eb] dark:bg-gray-900">
        {/* Sidebar - ABSOLUTE positioned on left with safe area insets */}
        <div 
          style={{ 
            position: 'fixed', 
            left: 0, 
            top: 0, 
            bottom: 0, 
            width: `${sidebarWidth}px`, 
            zIndex: 10,
            paddingTop: `${safeAreaInsets.top}px`,
            paddingLeft: `${safeAreaInsets.left}px`,
          }}
          role="navigation"
          aria-label="Main navigation"
        >
          <SideNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            collapsed={sideNavCollapsed}
            onCollapsedChange={setSideNavCollapsed}
            useFixedPosition={false}
          />
        </div>

        {/* Content - with LEFT MARGIN to avoid sidebar and safe area padding */}
        <main 
          id="main-content"
          style={{ 
            marginLeft: `${sidebarWidth}px`,
            paddingTop: `${safeAreaInsets.top}px`,
            paddingRight: `${safeAreaInsets.right}px`,
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile: Just content with bottom nav and safe area insets */}
      <div className="md:hidden min-h-screen bg-[#f7f3eb] dark:bg-gray-900">
        <main 
          id="main-content"
          style={{ 
            paddingTop: `${safeAreaInsets.top}px`,
            paddingLeft: `${safeAreaInsets.left}px`,
            paddingRight: `${safeAreaInsets.right}px`,
            paddingBottom: '96px', // Space for bottom nav
          }}
        >
          {children}
        </main>
        <nav role="navigation" aria-label="Main navigation">
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </nav>
      </div>
    </>
  );
};
