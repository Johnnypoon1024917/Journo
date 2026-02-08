/**
 * Kawaii ExpenseItem Component
 * 
 * Displays expense item with amount, category, date, and notes.
 * 
 * Features:
 * - Display amount with currency formatting
 * - Category icon and label
 * - Date display
 * - Notes preview
 * - Three-dot menu for edit/delete actions
 * - Touch-optimized interactions
 * - Framer Motion animations
 * - Category color coding
 * 
 * Requirements: 12.1
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  ShoppingBagIcon,
  TruckIcon,
  TicketIcon,
  CurrencyDollarIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { Expense } from '@/types/expense';
import { BudgetCategory } from '@/types/trip';
import { format } from 'date-fns';

export interface ExpenseItemProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

// Category icons and colors
const CATEGORY_CONFIG: Record<
  BudgetCategory,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  accommodation: {
    icon: HomeIcon,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  food: {
    icon: ShoppingBagIcon,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  transport: {
    icon: TruckIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  activities: {
    icon: TicketIcon,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  shopping: {
    icon: ShoppingBagIcon,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  misc: {
    icon: EllipsisHorizontalIcon,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
  },
};

export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  onEdit,
  onDelete,
  className,
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryConfig = CATEGORY_CONFIG[expense.category];
  const CategoryIcon = categoryConfig.icon;

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

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Expense item card */}
      <motion.div
        className={cn(
          'relative overflow-hidden',
          'bg-white dark:bg-kawaii-neutral-800',
          'rounded-2xl',
          'shadow-sm hover:shadow-md',
          'transition-shadow duration-200',
          'touch-manipulation'
        )}
        animate={isDeleting ? { x: -400, opacity: 0 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Category icon */}
          <div
            className={cn(
              'flex-shrink-0',
              'w-12 h-12',
              'rounded-full',
              'flex items-center justify-center',
              categoryConfig.bgColor
            )}
          >
            <CategoryIcon className={cn('w-6 h-6', categoryConfig.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Category and amount */}
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="text-sm font-medium text-kawaii-neutral-600 dark:text-kawaii-neutral-400 capitalize">
                {t(`budget.categories.${expense.category}`)}
              </div>
              <div className="text-lg font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
                {formatCurrency(expense.amount, expense.currency)}
              </div>
            </div>

            {/* Date */}
            <div className="text-sm text-kawaii-neutral-500 dark:text-kawaii-neutral-400 mb-1">
              {formatDate(expense.date)}
            </div>

            {/* Notes */}
            {expense.notes && (
              <div className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-300 line-clamp-2">
                {expense.notes}
              </div>
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
            {showMenu && (
              <motion.div
                className={cn(
                  'absolute right-0 top-full mt-2 z-10',
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
                    <span>{t('common.edit')}</span>
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
                    <span>{t('common.delete')}</span>
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
