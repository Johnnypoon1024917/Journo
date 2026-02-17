/**
 * BubbleQuest SideNavigation Component
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

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../utils/languageUtils';
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
  useFixedPosition?: boolean; // New prop to control positioning
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
  useFixedPosition = true, // Default to true for backward compatibility
}) => {
  const { t, i18n } = useTranslation('bubbleQuest');
  const navigate = useNavigate();
  const location = useLocation();
  const { id: tripId } = useParams<{ id: string }>();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

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

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setShowLanguageMenu(false);
    } catch (error) {
      console.error('Failed to change language:', error);
      // Still close the menu even if backend save fails
      setShowLanguageMenu(false);
    }
  };

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
    <nav
      style={{
        height: '100vh',
        width: collapsed ? '80px' : '240px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
      }}
      role="navigation"
      aria-label="Side navigation"
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Logo/Brand area */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', padding: '0 16px', borderBottom: '1px solid #e5e7eb' }}>
          {!collapsed && (
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
              Journo
            </div>
          )}
          
          {/* Collapse toggle button */}
          <button
            onClick={toggleCollapsed}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              margin: collapsed ? '0 auto' : '0',
            }}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? (
              <ChevronRightIcon style={{ width: '20px', height: '20px' }} />
            ) : (
              <ChevronLeftIcon style={{ width: '20px', height: '20px' }} />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          <div style={{ padding: '0 8px' }}>
            {navItemsConfig.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = isActive ? item.activeIcon : item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px',
                    marginBottom: '4px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#3b82f6' : '#6b7280',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  aria-label={t(item.labelKey)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Icon */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Icon
                      style={{ width: '24px', height: '24px' }}
                      aria-hidden="true"
                    />
                    
                    {/* Badge indicator */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '18px',
                          height: '18px',
                          padding: '0 4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: 'white',
                          backgroundColor: '#ef4444',
                          borderRadius: '9999px',
                        }}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  {!collapsed && (
                    <span
                      style={{
                        marginLeft: '12px',
                        fontSize: '14px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t(item.labelKey)}
                    </span>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        width: '4px',
                        height: '32px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '0 9999px 9999px 0',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer area */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px', position: 'relative' }} ref={languageMenuRef}>
          {/* Language Selector */}
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              cursor: 'pointer',
            }}
            aria-label="Change language"
          >
            <LanguageIcon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                {currentLanguage.flag} {currentLanguage.name}
              </span>
            )}
          </button>

          {/* Language Dropdown Menu */}
          <AnimatePresence>
            {showLanguageMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: collapsed ? '80px' : '16px',
                  marginBottom: '8px',
                  width: collapsed ? '200px' : 'calc(100% - 32px)',
                  backgroundColor: 'white',
                  border: '2px solid #d5d0c2',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  zIndex: 50,
                }}
              >
                {languages.map((language, index) => {
                  const isSelected = language.code === i18n.language;
                  
                  return (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        borderBottom: index !== languages.length - 1 ? '1px solid #e5e7eb' : 'none',
                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                        color: isSelected ? '#3b82f6' : '#1f2937',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '24px' }} role="img" aria-label={language.name}>
                        {language.flag}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 500, flex: 1 }}>
                        {language.name}
                      </span>
                      {isSelected && (
                        <svg
                          style={{ width: '20px', height: '20px', color: '#3b82f6' }}
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
                        </svg>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {!collapsed && (
            <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>
              BubbleQuest UI v1.0
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
