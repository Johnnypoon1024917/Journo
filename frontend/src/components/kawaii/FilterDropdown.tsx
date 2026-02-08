/**
 * Kawaii FilterDropdown Component
 * 
 * Dropdown filter for shopping items by category.
 * 
 * Features:
 * - Filter by category (all, food, clothing, important, other)
 * - Display item count for each category
 * - Dropdown with smooth animations
 * - Touch-optimized interactions
 * - Active filter highlighting
 * 
 * Requirements: 11.4
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { ShoppingFilterOption } from '@/types/shopping';

export interface FilterDropdownProps {
  options: ShoppingFilterOption[];
  selectedFilter: string;
  onFilterChange: (filterId: string) => void;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  selectedFilter,
  onFilterChange,
  className,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.id === selectedFilter);

  const handleSelect = (filterId: string) => {
    onFilterChange(filterId);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3',
          'px-4 py-3',
          'bg-white dark:bg-kawaii-neutral-800',
          'rounded-2xl',
          'shadow-sm hover:shadow-md',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-kawaii-primary/50',
          'min-h-[44px]',
          'border-2',
          isOpen 
            ? 'border-kawaii-primary' 
            : 'border-transparent'
        )}
        aria-label={t('shopping.filter')}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <FunnelIcon className="w-5 h-5 text-kawaii-primary" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
              {selectedOption?.label || t('shopping.allItems')}
            </span>
            {selectedOption && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-kawaii-primary/10 text-kawaii-primary">
                {selectedOption.count}
              </span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-5 h-5 text-kawaii-neutral-600 dark:text-kawaii-neutral-400" />
        </motion.div>
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu - positioned directly below button, aligned to right */}
            <motion.div
              className={cn(
                'absolute right-0 top-[calc(100%+0.5rem)] z-[100]',
                'w-64',
                'bg-white dark:bg-kawaii-neutral-800',
                'rounded-2xl shadow-xl',
                'overflow-hidden',
                'border border-kawaii-neutral-200 dark:border-kawaii-neutral-700'
              )}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {options.map((option, index) => {
                const isSelected = option.id === selectedFilter;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={cn(
                      'w-full flex items-center justify-between',
                      'px-4 py-3',
                      'text-left',
                      'transition-colors duration-150',
                      'min-h-[44px]',
                      isSelected
                        ? 'bg-kawaii-primary/10 text-kawaii-primary'
                        : 'text-kawaii-neutral-700 dark:text-kawaii-neutral-200 hover:bg-kawaii-neutral-100 dark:hover:bg-kawaii-neutral-700',
                      index > 0 && 'border-t border-kawaii-neutral-100 dark:border-kawaii-neutral-700'
                    )}
                  >
                    <span className={cn(
                      'text-sm font-medium',
                      isSelected && 'font-semibold'
                    )}>
                      {option.label}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      isSelected
                        ? 'bg-kawaii-primary text-white'
                        : 'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-700 text-kawaii-neutral-600 dark:text-kawaii-neutral-400'
                    )}>
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
