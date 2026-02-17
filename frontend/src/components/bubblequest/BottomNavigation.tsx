/**
 * BubbleQuest BottomNavigation Component
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
 * Requirements: 7.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React, { useState, useRef, useEffect } from 'react';
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
  LanguageIcon,
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
import { useResponsive } from '@/hooks/useResponsive';
import { safeAreaService } from '@/services/safeAreaService';

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
  const { t, i18n } = useTranslation('bubbleQuest');
  const navigate = useNavigate();
  const location = useLocation();
  const { id: tripId } = useParams<{ id: string }>();
  const { isMobile } = useResponsive();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState(safeAreaService.getInsets());
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // Subscribe to safe area changes (for orientation changes)
  useEffect(() => {
    const unsubscribe = safeAreaService.subscribeToChanges((insets) => {
      setSafeAreaInsets(insets);
    });

    return unsubscribe;
  }, []);

  // Language options
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };

    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageMenu]);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setShowLanguageMenu(false);
  };

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
        'bg-white border-t border-bubblequest-neutral-200',
        'dark:bg-bubblequest-neutral-900 dark:border-bubblequest-neutral-800',
        // Shadow
        'shadow-lg',
        className
      )}
      style={{
        // Apply safe area bottom padding for devices with home indicators
        paddingBottom: `${safeAreaInsets.bottom}px`,
      }}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center h-16 px-2" style={{ justifyContent: 'space-around' }}>
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
                'focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500 focus:ring-offset-2',
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
                      ? 'text-bubblequest-primary-600 dark:text-bubblequest-primary-400'
                      : 'text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400'
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
                    ? 'text-bubblequest-primary-600 dark:text-bubblequest-primary-400'
                    : 'text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400'
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
                  className="absolute bottom-0 left-1/2 w-12 h-1 bg-bubblequest-primary-600 dark:bg-bubblequest-primary-400 rounded-t-full"
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

        {/* Language Selector - Desktop Only */}
        {!isMobile && (
          <div className="relative" ref={languageMenuRef}>
            <motion.button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className={cn(
                'flex flex-col items-center justify-center',
                'min-w-[44px] min-h-[44px]',
                'px-2 py-1',
                'rounded-lg',
                'touch-manipulation',
                'focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17,
              }}
              aria-label="Change language"
            >
              <LanguageIcon
                className={cn(
                  'w-6 h-6',
                  'text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400'
                )}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
                {currentLanguage.flag}
              </span>
            </motion.button>

            {/* Language Dropdown Menu */}
            <AnimatePresence>
              {showLanguageMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'absolute bottom-full right-0 mb-2',
                    'w-48',
                    'bg-white dark:bg-bubblequest-neutral-800',
                    'border-2 border-[#d5d0c2] dark:border-bubblequest-neutral-700',
                    'rounded-xl shadow-lg overflow-hidden'
                  )}
                >
                  {languages.map((language, index) => {
                    const isSelected = language.code === i18n.language;
                    
                    return (
                      <motion.button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                        className={cn(
                          'w-full flex items-center gap-3',
                          'px-4 py-3 transition-colors',
                          'min-h-[44px]',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bubblequest-primary-500/20',
                          isSelected && 'bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20',
                          index !== languages.length - 1 && 'border-b border-bubblequest-neutral-100 dark:border-bubblequest-neutral-700'
                        )}
                      >
                        <span className="text-2xl" role="img" aria-label={language.name}>
                          {language.flag}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isSelected
                              ? 'text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                              : 'text-bubblequest-neutral-800 dark:text-bubblequest-neutral-100'
                          )}
                        >
                          {language.name}
                        </span>
                        {isSelected && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 text-bubblequest-primary-600 dark:text-bubblequest-primary-400 ml-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </motion.svg>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </nav>
  );
};
