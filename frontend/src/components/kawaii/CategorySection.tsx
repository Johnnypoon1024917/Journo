/**
 * Kawaii CategorySection Component
 * 
 * Collapsible category section for checklist items
 * 
 * Features:
 * - Expandable/collapsible header
 * - Progress counter (e.g., "3/10 已準備")
 * - List of items under the category
 * - Smooth animations
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { PackingItem, PackingCategory } from '@/types/packing';
import { ChecklistItem } from './ChecklistItem';

export interface CategorySectionProps {
  category: PackingCategory | string;
  items: PackingItem[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleItem: (id: string) => void;
  onEditItem: (item: PackingItem) => void;
  onDeleteItem: (id: string) => void;
  className?: string;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  items,
  isExpanded,
  onToggleExpand,
  onToggleItem,
  onEditItem,
  onDeleteItem,
  className,
}) => {
  const { t } = useTranslation('packing');

  // Calculate progress
  const totalItems = items.length;
  const packedItems = items.filter(item => item.is_packed).length;

  // Get category display name
  const getCategoryName = (cat: string): string => {
    // Check if it's a predefined category
    const predefinedCategories: PackingCategory[] = [
      'clothing',
      'warm_layers',
      'toiletries',
      'electronics',
      'documents',
      'health',
      'misc',
      'snacks',
    ];

    if (predefinedCategories.includes(cat as PackingCategory)) {
      return t(`categories.${cat}`);
    }

    // Custom category - return as is
    return cat;
  };

  return (
    <div className={cn('mb-4', className)}>
      {/* Category Header */}
      <button
        onClick={onToggleExpand}
        className={cn(
          'w-full flex items-center justify-between',
          'px-4 py-3',
          'bg-white dark:bg-kawaii-neutral-800',
          'border-2 border-[#d5d0c2] dark:border-kawaii-neutral-700',
          'rounded-2xl',
          'hover:bg-kawaii-neutral-50 dark:hover:bg-kawaii-neutral-750',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-kawaii-primary/50',
          'touch-manipulation'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400"
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </motion.div>

          {/* Category Name */}
          <span className="text-lg font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
            {getCategoryName(category)}
          </span>
        </div>

        {/* Progress Counter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
            {t('checklist.packedCount', { packed: packedItems, total: totalItems })}
          </span>
          
          {/* Progress Badge */}
          {packedItems === totalItems && totalItems > 0 ? (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
              ✓
            </span>
          ) : null}
        </div>
      </button>

      {/* Items List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mt-2 space-y-2 pl-4 pb-2">
              {items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={onToggleItem}
                  onEdit={() => onEditItem(item)}
                  onDelete={() => onDeleteItem(item.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
