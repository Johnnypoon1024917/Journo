/**
 * Kawaii BottomNavigation Component
 * 
 * Fixed bottom navigation bar for mobile with 7 tabs.
 * 
 * Features:
 * - Fixed bottom positioning with safe area insets
 * - 7 tabs: Schedule, Booking, Budget, Shopping, Checklist, Members, Settings
 * - Active tab highlighting with primary color
 * - Touch-optimized with 44px minimum height
 * - Smooth animations with Framer Motion
 * - Heroicons for tab icons
 * - i18n support for tab labels
 * - Routing integration
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React from 'react';
import { motion } from 'framer-motion';
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

export interface BottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
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

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab: controlledActiveTab,
  onTabChange,
  className,
}) => {
  const { t } = useTranslation('kawaii');
  const navigate = useNavigate();
  const location = useLocation();
  const { id: tripId } = useParams<{ id: string }>();

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

  return (
    <nav
      className={cn(
        // Fixed positioning at bottom
        'fixed bottom-0 left-0 right-0 z-40',
        // Background and border
        'bg-white border-t border-kawaii-neutral-200',
        'dark:bg-kawaii-neutral-900 dark:border-kawaii-neutral-800',
        // Safe area insets for devices with notches
        'pb-safe',
        // Shadow
        'shadow-lg',
        className
      )}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItemsConfig.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={cn(
                // Layout
                'flex flex-col items-center justify-center',
                'min-w-[44px] min-h-[44px]',
                'px-2 py-1',
                'rounded-lg',
                // Touch optimization
                'touch-manipulation',
                // Focus states
                'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:ring-offset-2',
                // Transitions
                'transition-colors duration-200'
              )}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17,
              }}
              aria-label={t(item.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon */}
              <motion.div
                className="relative"
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
              >
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
              </motion.div>

              {/* Label */}
              <motion.span
                className={cn(
                  'text-[10px] font-medium mt-0.5',
                  'whitespace-nowrap',
                  isActive
                    ? 'text-kawaii-primary-600 dark:text-kawaii-primary-400'
                    : 'text-kawaii-neutral-500 dark:text-kawaii-neutral-400'
                )}
                animate={{
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {t(item.labelKey)}
              </motion.span>

              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-1/2 w-12 h-1 bg-kawaii-primary-600 dark:bg-kawaii-primary-400 rounded-t-full"
                  layoutId="activeTab"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                  style={{ x: '-50%' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
