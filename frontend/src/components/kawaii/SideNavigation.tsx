/**
 * Kawaii SideNavigation Component
 * 
 * Fixed side navigation bar for desktop and tablet.
 * 
 * Features:
 * - Fixed left side positioning
 * - Collapsible with smooth animations
 * - 7 tabs: Schedule, Booking, Budget, Shopping, Checklist, Members, Settings
 * - Active tab highlighting with primary color
 * - Larger icons and labels for desktop
 * - Hover effects and smooth transitions
 * - Heroicons for tab icons
 * - i18n support for tab labels
 * - Routing integration
 * 
 * Requirements: 17.5
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarDaysIcon,
  TicketIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  CalendarDaysIcon as CalendarDaysSolidIcon,
  TicketIcon as TicketSolidIcon,
  CurrencyDollarIcon as CurrencyDollarSolidIcon,
  ShoppingBagIcon as ShoppingBagSolidIcon,
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckSolidIcon,
  UsersIcon as UsersSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/utils/cn';

export interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon: React.ComponentType<{ className?: string }>;
  labelKey: string; // Changed from 'label' to 'labelKey' for i18n
  path: string;
  badge?: number;
}

export interface SideNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

// Navigation items configuration (paths are relative to /trips/:id)
const navItemsConfig: NavItem[] = [
  {
    id: 'schedule',
    icon: CalendarDaysIcon,
    activeIcon: CalendarDaysSolidIcon,
    labelKey: 'navigation.schedule',
    path: '/schedule',
  },
  {
    id: 'booking',
    icon: TicketIcon,
    activeIcon: TicketSolidIcon,
    labelKey: 'navigation.booking',
    path: '/booking',
  },
  {
    id: 'budget',
    icon: CurrencyDollarIcon,
    activeIcon: CurrencyDollarSolidIcon,
    labelKey: 'navigation.budget',
    path: '/budget',
  },
  {
    id: 'shopping',
    icon: ShoppingBagIcon,
    activeIcon: ShoppingBagSolidIcon,
    labelKey: 'navigation.shopping',
    path: '/shopping',
  },
  {
    id: 'checklist',
    icon: ClipboardDocumentCheckIcon,
    activeIcon: ClipboardDocumentCheckSolidIcon,
    labelKey: 'navigation.checklist',
    path: '/checklist',
  },
  {
    id: 'members',
    icon: UsersIcon,
    activeIcon: UsersSolidIcon,
    labelKey: 'navigation.members',
    path: '/members',
  },
  {
    id: 'settings',
    icon: Cog6ToothIcon,
    activeIcon: Cog6ToothSolidIcon,
    labelKey: 'navigation.settings',
    path: '/settings',
  },
];

export const SideNavigation: React.FC<SideNavigationProps> = ({
  activeTab: controlledActiveTab,
  onTabChange,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  className,
}) => {
  const { t } = useTranslation('kawaii');
  const navigate = useNavigate();
  const location = useLocation();
  const { id: tripId } = useParams<{ id: string }>();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Use controlled or internal collapsed state
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setCollapsed = onCollapsedChange || setInternalCollapsed;

  // Determine active tab from location if not controlled
  const getActiveTabFromLocation = () => {
    const path = location.pathname;
    
    // Check each nav item to see if current path matches
    for (const item of navItemsConfig) {
      const fullPath = `/trips/${tripId}${item.path}`;
      if (path === fullPath) {
        return item.id;
      }
    }
    
    return 'schedule'; // Default to schedule
  };

  const activeTab = controlledActiveTab || getActiveTabFromLocation();

  const handleTabClick = (item: NavItem) => {
    // Call custom handler if provided
    if (onTabChange) {
      onTabChange(item.id);
    }
    
    // Navigate to route with trip ID (using plural "trips")
    const fullPath = `/trips/${tripId}${item.path}`;
    navigate(fullPath);
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <motion.nav
      className={cn(
        // Fixed positioning on left side
        'fixed left-0 top-0 bottom-0 z-40',
        // Background and border
        'bg-white border-r border-kawaii-neutral-200',
        'dark:bg-kawaii-neutral-900 dark:border-kawaii-neutral-800',
        // Shadow
        'shadow-lg',
        className
      )}
      initial={false}
      animate={{
        width: collapsed ? '80px' : '240px',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      role="navigation"
      aria-label="Side navigation"
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-kawaii-neutral-200 dark:border-kawaii-neutral-800">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="logo-text"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold text-kawaii-primary-600 dark:text-kawaii-primary-400"
              >
                Journo
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Collapse toggle button */}
          <motion.button
            onClick={toggleCollapsed}
            className={cn(
              'flex items-center justify-center',
              'w-8 h-8 rounded-lg',
              'text-kawaii-neutral-500 hover:text-kawaii-primary-600',
              'dark:text-kawaii-neutral-400 dark:hover:text-kawaii-primary-400',
              'hover:bg-kawaii-neutral-100 dark:hover:bg-kawaii-neutral-800',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:ring-offset-2',
              collapsed && 'mx-auto'
            )}
            whileTap={{ scale: 0.95 }}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-2">
            {navItemsConfig.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = isActive ? item.activeIcon : item.icon;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleTabClick(item)}
                  className={cn(
                    // Layout
                    'flex items-center w-full',
                    'px-3 py-3 rounded-lg',
                    'transition-all duration-200',
                    // Active state
                    isActive
                      ? 'bg-kawaii-primary-50 text-kawaii-primary-700 dark:bg-kawaii-primary-900/20 dark:text-kawaii-primary-300'
                      : 'text-kawaii-neutral-700 hover:bg-kawaii-neutral-100 dark:text-kawaii-neutral-300 dark:hover:bg-kawaii-neutral-800',
                    // Focus states
                    'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:ring-offset-2'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 17,
                  }}
                  aria-label={t(item.labelKey)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Icon */}
                  <div className="relative flex-shrink-0">
                    <Icon
                      className={cn(
                        'w-6 h-6',
                        isActive
                          ? 'text-kawaii-primary-600 dark:text-kawaii-primary-400'
                          : 'text-kawaii-neutral-500 dark:text-kawaii-neutral-400'
                      )}
                      aria-hidden="true"
                    />
                    
                    {/* Badge indicator */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <motion.span
                        className={cn(
                          'absolute -top-1 -right-1',
                          'flex items-center justify-center',
                          'min-w-[18px] h-[18px] px-1',
                          'text-[10px] font-bold text-white',
                          'bg-red-500 rounded-full',
                          'shadow-sm'
                        )}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 15,
                        }}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </motion.span>
                    )}
                  </div>

                  {/* Label */}
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'ml-3 text-sm font-medium whitespace-nowrap',
                          isActive
                            ? 'text-kawaii-primary-700 dark:text-kawaii-primary-300'
                            : 'text-kawaii-neutral-700 dark:text-kawaii-neutral-300'
                        )}
                      >
                        {t(item.labelKey)}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 w-1 h-8 bg-kawaii-primary-600 dark:bg-kawaii-primary-400 rounded-r-full"
                      layoutId="activeSideTab"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                      style={{ y: '-50%' }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer area (optional) */}
        <div className="border-t border-kawaii-neutral-200 dark:border-kawaii-neutral-800 p-4">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="footer-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400 text-center"
              >
                Kawaii UI v1.0
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
};
