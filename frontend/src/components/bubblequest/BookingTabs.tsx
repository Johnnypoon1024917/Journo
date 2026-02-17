/**
 * BubbleQuest BookingTabs Component
 * 
 * Tab navigation for Tickets and Accommodation with counts.
 * 
 * Features:
 * - Tabs for "Tickets" and "Accommodation" with counts
 * - Tab switching with smooth animations
 * - Active tab highlighting with primary color
 * - Touch-optimized interactions
 * - Framer Motion animations
 * 
 * Requirements: 10.2
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

export type BookingTabType = 'tickets' | 'accommodation';

export interface BookingTabsProps {
  activeTab: BookingTabType;
  onTabChange: (tab: BookingTabType) => void;
  ticketsCount?: number;
  accommodationCount?: number;
  className?: string;
}

export const BookingTabs: React.FC<BookingTabsProps> = ({
  activeTab,
  onTabChange,
  ticketsCount = 0,
  accommodationCount = 0,
  className,
}) => {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'tickets' as BookingTabType,
      label: t('booking.tickets'),
      count: ticketsCount,
    },
    {
      id: 'accommodation' as BookingTabType,
      label: t('booking.accommodation'),
      count: accommodationCount,
    },
  ];

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        'bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-800',
        'rounded-xl p-1',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex-1',
              'flex items-center justify-center gap-2',
              'px-4 py-3',
              'rounded-lg',
              'text-sm font-medium',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500 focus:ring-offset-2',
              'min-h-[44px]',
              'touch-manipulation',
              isActive
                ? 'text-white'
                : 'text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 hover:text-bubblequest-neutral-900 dark:hover:text-bubblequest-neutral-200'
            )}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
          >
            {/* Active background */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-bubblequest-primary-600 dark:bg-bubblequest-primary-500 rounded-lg"
                layoutId="activeTabBackground"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}

            {/* Tab content */}
            <span className="relative z-10">{tab.label}</span>
            
            {/* Count badge */}
            {tab.count > 0 && (
              <motion.span
                className={cn(
                  'relative z-10',
                  'flex items-center justify-center',
                  'min-w-[20px] h-5 px-1.5',
                  'text-xs font-bold rounded-full',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300'
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 15,
                }}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </motion.span>
            )}
          </button>
        );
      })}
    </div>
  );
};
