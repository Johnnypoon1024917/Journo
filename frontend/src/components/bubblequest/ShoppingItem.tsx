/**
 * BubbleQuest ShoppingItem Component
 * 
 * Displays shopping list item with checkbox, image, and tags.
 * 
 * Features:
 * - Checkbox on left for marking items as bought
 * - Image thumbnail (60x60px)
 * - Tags as colored pills
 * - Store name display
 * - Three-dot menu for edit/delete actions
 * - Swipe to delete gesture
 * - Strike-through when checked
 * - Touch-optimized interactions
 * - Framer Motion animations
 * 
 * Requirements: 11.1, 11.6, 11.7
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { cn } from '@/utils/cn';
import { ShoppingItem as ShoppingItemType, ShoppingTag } from '@/types/shopping';

export interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle?: (id: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

// Tag colors mapping with improved dark mode contrast
const TAG_COLORS: Record<ShoppingTag, { bg: string; text: string }> = {
  '一般': { bg: 'bg-gray-100 dark:bg-gray-800/60', text: 'text-gray-800 dark:text-gray-200' },
  '寄食': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200' },
  '服飾': { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200' },
  '重要': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200' },
  '其他': { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-200' },
};

export const ShoppingItem: React.FC<ShoppingItemProps> = ({
  item,
  onToggle,
  onEdit,
  onDelete,
  className,
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Update menu position when it opens
  useEffect(() => {
    if (showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 160, // 160px is menu width
      });
    }
  }, [showMenu]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Removed swipe to delete functionality
  };

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
      {/* Shopping item card */}
      <motion.div
        className={cn(
          'relative',
          'bg-white dark:bg-bubblequest-neutral-800',
          'rounded-2xl',
          'shadow-sm hover:shadow-md',
          'transition-shadow duration-200',
          'touch-manipulation'
        )}
        animate={isDeleting ? { x: -400, opacity: 0 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            className={cn(
              'flex-shrink-0',
              'min-w-[44px] min-h-[44px]',
              'flex items-center justify-center',
              'rounded-full',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-bubblequest-primary/50',
              item.checked
                ? 'bg-bubblequest-primary text-white dark:bg-bubblequest-primary-500'
                : 'bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-700 text-bubblequest-neutral-400 dark:text-bubblequest-neutral-300'
            )}
            aria-label={item.checked ? t('shopping.uncheck') : t('shopping.check')}
          >
            {item.checked ? (
              <CheckCircleIcon className="w-6 h-6" />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-current" />
            )}
          </button>

          {/* Image thumbnail */}
          {item.image ? (
            <div className="flex-shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-700">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-[60px] h-[60px] rounded-lg bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-700 flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6 text-bubblequest-neutral-400" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <div
              className={cn(
                'text-base font-medium mb-1',
                'text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100',
                item.checked && 'line-through text-bubblequest-neutral-400 dark:text-bubblequest-neutral-500'
              )}
            >
              {item.name}
            </div>

            {/* Store */}
            {item.store && (
              <div className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mb-1">
                {item.store}
              </div>
            )}

            {/* Weblink */}
            {item.weblink && (
              <a
                href={item.weblink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 text-xs mb-2',
                  'text-bubblequest-primary hover:text-bubblequest-primary-600',
                  'dark:text-bubblequest-primary-400 dark:hover:text-bubblequest-primary-300',
                  'transition-colors duration-200',
                  'underline decoration-dotted underline-offset-2',
                  item.checked && 'opacity-50'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="truncate max-w-[200px]">
                  {item.weblink.replace(/^https?:\/\//, '').split('/')[0]}
                </span>
              </a>
            )}

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={cn(
                      'inline-flex items-center px-2 py-0.5',
                      'text-xs font-medium rounded-full',
                      TAG_COLORS[tag].bg,
                      TAG_COLORS[tag].text
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Three-dot menu */}
          <div className="relative flex-shrink-0">
            <button
              ref={menuButtonRef}
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                'p-2 rounded-lg',
                'text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400',
                'hover:bg-bubblequest-neutral-100 dark:hover:bg-bubblequest-neutral-700',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-bubblequest-primary/50',
                'min-w-[44px] min-h-[44px]',
                'flex items-center justify-center'
              )}
              aria-label="Menu"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Dropdown menu - rendered in portal */}
      {showMenu && createPortal(
        <>
          {/* Click outside to close menu */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Dropdown menu */}
          <motion.div
            className={cn(
              'fixed z-[9999]',
              'bg-white dark:bg-bubblequest-neutral-800',
              'rounded-lg shadow-xl',
              'overflow-hidden',
              'min-w-[160px]',
              'border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700'
            )}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
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
                  'text-bubblequest-neutral-700 dark:text-bubblequest-neutral-200',
                  'hover:bg-bubblequest-neutral-100 dark:hover:bg-bubblequest-neutral-700',
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
        </>,
        document.body
      )}
    </div>
  );
};
