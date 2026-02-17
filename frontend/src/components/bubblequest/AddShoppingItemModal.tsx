/**
 * AddShoppingItemModal Component
 * 
 * Modal for adding/editing shopping items with BubbleQuest styling matching AddActivityModal
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BubbleQuestModal } from './BubbleQuestModal';
import { cn } from '@/utils/cn';
import { SparklesIcon, ShoppingBagIcon, TagIcon } from '@heroicons/react/24/outline';

export interface ShoppingItemFormData {
  name: string;
  store?: string;
  weblink?: string;
  tags: string[];
  priority: 'normal' | 'important';
}

interface AddShoppingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShoppingItemFormData) => void;
  isSubmitting?: boolean;
  initialData?: ShoppingItemFormData;
  isEditing?: boolean;
}

const categories = [
  { value: '服飾', label: 'shopping.categories.clothing', emoji: '👕' },
  { value: '寄食', label: 'shopping.categories.food', emoji: '🍜' },
  { value: '一般', label: 'shopping.categories.general', emoji: '📦' },
  { value: '重要', label: 'shopping.categories.important', emoji: '⭐' },
  { value: '其他', label: 'shopping.categories.other', emoji: '🎁' },
];

const priorities = [
  { value: 'normal', label: 'shopping.priorityNormal', color: 'from-gray-400 to-gray-500' },
  { value: 'important', label: 'shopping.priorityImportant', color: 'from-red-400 to-red-500' },
];

export const AddShoppingItemModal: React.FC<AddShoppingItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialData,
  isEditing = false,
}) => {
  const { t } = useTranslation('bubbleQuest');
  const [formData, setFormData] = useState<ShoppingItemFormData>({
    name: '',
    store: '',
    weblink: '',
    tags: [],
    priority: 'normal',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShoppingItemFormData, string>>>({});

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          name: '',
          store: '',
          weblink: '',
          tags: [],
          priority: 'normal',
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Partial<Record<keyof ShoppingItemFormData, string>> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('shopping.itemNameRequired');
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof ShoppingItemFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      store: '',
      weblink: '',
      tags: [],
      priority: 'normal',
    });
    setErrors({});
    onClose();
  };

  return (
    <BubbleQuestModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? `✏️ ${t('shopping.editItem')}` : `✨ ${t('shopping.newItem')}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bubblequest-500 to-bubblequest-600 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            {t('shopping.itemName')} *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('shopping.itemNamePlaceholder')}
            className={cn(
              'w-full px-4 py-3 rounded-2xl',
              'border-2 transition-all duration-200',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-4',
              errors.name
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-neutral-200 dark:border-neutral-700 focus:border-bubblequest-500 focus:ring-bubblequest-100 dark:focus:ring-bubblequest-900/30',
              'bg-white dark:bg-neutral-800'
            )}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Store */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <ShoppingBagIcon className="w-4 h-4 text-white" />
            </div>
            {t('shopping.store')}
          </label>
          <input
            type="text"
            value={formData.store || ''}
            onChange={(e) => handleChange('store', e.target.value)}
            placeholder={t('shopping.storePlaceholder')}
            className={cn(
              'w-full px-4 py-3 rounded-2xl',
              'border-2 border-neutral-200 dark:border-neutral-700',
              'focus:border-bubblequest-500 focus:ring-4 focus:ring-bubblequest-100 dark:focus:ring-bubblequest-900/30',
              'focus:outline-none transition-all duration-200',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'bg-white dark:bg-neutral-800'
            )}
            disabled={isSubmitting}
          />
        </div>

        {/* Weblink */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            {t('shopping.weblink')}
          </label>
          <input
            type="url"
            value={formData.weblink || ''}
            onChange={(e) => handleChange('weblink', e.target.value)}
            placeholder={t('shopping.weblinkPlaceholder')}
            className={cn(
              'w-full px-4 py-3 rounded-2xl',
              'border-2 border-neutral-200 dark:border-neutral-700',
              'focus:border-bubblequest-500 focus:ring-4 focus:ring-bubblequest-100 dark:focus:ring-bubblequest-900/30',
              'focus:outline-none transition-all duration-200',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'bg-white dark:bg-neutral-800'
            )}
            disabled={isSubmitting}
          />
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {t('shopping.weblinkHelper')}
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
              <TagIcon className="w-4 h-4 text-white" />
            </div>
            {t('shopping.tags')}
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = formData.tags.includes(cat.value);
              return (
                <motion.button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      handleChange('tags', formData.tags.filter(t => t !== cat.value));
                    } else {
                      handleChange('tags', [...formData.tags, cat.value]);
                    }
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    'border-2',
                    isSelected
                      ? 'bg-gradient-to-br from-bubblequest-400 to-bubblequest-500 text-white border-bubblequest-500 shadow-md'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-bubblequest-300'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting}
                >
                  <span className="mr-1.5">{cat.emoji}</span>
                  {t(cat.label)}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3 block">
            {t('shopping.priority')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {priorities.map((priority) => (
              <motion.button
                key={priority.value}
                type="button"
                onClick={() => handleChange('priority', priority.value)}
                className={cn(
                  'px-4 py-3 rounded-2xl font-medium transition-all',
                  'border-2',
                  formData.priority === priority.value
                    ? `bg-gradient-to-br ${priority.color} text-white border-transparent shadow-lg`
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-bubblequest-300'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                {t(priority.label)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'flex-1 px-6 py-3 rounded-2xl font-medium',
              'border-2 border-neutral-200 dark:border-neutral-700',
              'text-neutral-700 dark:text-neutral-300',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            disabled={isSubmitting}
          >
            {t('shopping.cancel')}
          </button>
          <motion.button
            type="submit"
            className={cn(
              'flex-1 px-6 py-3 rounded-2xl font-medium',
              'bg-gradient-to-br from-bubblequest-500 to-bubblequest-600',
              'text-white shadow-lg',
              'hover:shadow-xl hover:scale-[1.02]',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            )}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting ? t('shopping.processing') : isEditing ? t('shopping.save') : t('shopping.addItem')}
          </motion.button>
        </div>
      </form>
    </BubbleQuestModal>
  );
};
