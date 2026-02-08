/**
 * Kawaii ChecklistItem Component
 * 
 * Displays checklist item with checkbox, title, and category.
 * 
 * Features:
 * - Checkbox on left for marking items as completed
 * - Title display with strike-through when completed
 * - Category badge display
 * - Three-dot menu for edit/delete actions
 * - Touch-optimized interactions
 * - Framer Motion animations
 * 
 * Requirements: 13.1
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { cn } from '@/utils/cn';
import { PackingItem, PackingCategory } from '@/types/packing';

export interface ChecklistItemProps {
  item: PackingItem;
  onToggle?: (id: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

// Category colors mapping with improved dark mode contrast
const CATEGORY_COLORS: Record<PackingCategory, { bg: string; text: string }> = {
  clothing: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200' },
  warm_layers: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200' },
  toiletries: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-200' },
  electronics: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-900 dark:text-yellow-200' },
  documents: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200' },
  health: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200' },
  misc: { bg: 'bg-gray-100 dark:bg-gray-800/60', text: 'text-gray-800 dark:text-gray-200' },
  snacks: { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-800 dark:text-pink-200' },
};

// Category translation keys
const CATEGORY_LABELS: Record<PackingCategory, string> = {
  clothing: 'categories.clothing',
  warm_layers: 'categories.warm_layers',
  toiletries: 'categories.toiletries',
  electronics: 'categories.electronics',
  documents: 'categories.documents',
  health: 'categories.health',
  misc: 'categories.misc',
  snacks: 'categories.snacks',
};

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onEdit,
  onDelete,
  className,
}) => {
  const { t } = useTranslation('packing');
  const { t: tCommon } = useTranslation('common');
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (onDelete) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 300);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) {
      onEdit();
    }
  };

  const handleToggle = () => {
    if (onToggle) {
      onToggle(item.id);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Checklist item card */}
      <motion.div
        className={cn(
          'relative',
          'bg-white dark:bg-kawaii-neutral-800',
          'rounded-2xl',
          'shadow-sm hover:shadow-md',
          'transition-shadow duration-200',
          'touch-manipulation'
        )}
        animate={isDeleting ? { x: -400, opacity: 0 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-4 p-4">{/* Checkbox */}
          <button
            onClick={handleToggle}
            className={cn(
              'flex-shrink-0',
              'min-w-[44px] min-h-[44px]',
              'flex items-center justify-center',
              'rounded-full',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-kawaii-primary/50',
              item.is_packed
                ? 'bg-kawaii-primary text-white dark:bg-kawaii-primary-500'
                : 'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-700 text-kawaii-neutral-400 dark:text-kawaii-neutral-300'
            )}
            aria-label={item.is_packed ? t('checklist.uncheck') : t('checklist.check')}
          >
            {item.is_packed ? (
              <CheckCircleIconSolid className="w-6 h-6" />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-current" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div
              className={cn(
                'text-base font-medium mb-1',
                'text-kawaii-neutral-900 dark:text-kawaii-neutral-100',
                item.is_packed && 'line-through text-kawaii-neutral-400 dark:text-kawaii-neutral-500'
              )}
            >
              {item.name}
            </div>

            {/* Category */}
            {item.category && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5',
                  'text-xs font-medium rounded-full',
                  CATEGORY_COLORS[item.category].bg,
                  CATEGORY_COLORS[item.category].text
                )}
              >
                {t(CATEGORY_LABELS[item.category])}
              </span>
            )}
          </div>

          {/* Three-dot menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                'p-2 rounded-lg',
                'text-kawaii-neutral-600 dark:text-kawaii-neutral-400',
                'hover:bg-kawaii-neutral-100 dark:hover:bg-kawaii-neutral-700',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-kawaii-primary/50',
                'min-w-[44px] min-h-[44px]',
                'flex items-center justify-center'
              )}
              aria-label="Menu"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className={cn(
                    'absolute right-0 top-full mt-2 z-50',
                    'bg-white dark:bg-kawaii-neutral-800',
                    'rounded-lg shadow-xl',
                    'overflow-hidden',
                    'min-w-[160px]',
                    'border border-kawaii-neutral-200 dark:border-kawaii-neutral-700'
                  )}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {onEdit && (
                    <button
                      onClick={handleEdit}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3',
                        'text-left text-sm',
                        'text-kawaii-neutral-700 dark:text-kawaii-neutral-200',
                        'hover:bg-kawaii-neutral-100 dark:hover:bg-kawaii-neutral-700',
                        'transition-colors duration-150'
                      )}
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>{tCommon('actions.edit')}</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3',
                        'text-left text-sm',
                        'text-red-600 dark:text-red-400',
                        'hover:bg-red-50 dark:hover:bg-red-900/20',
                        'transition-colors duration-150'
                      )}
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>{tCommon('actions.delete')}</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
