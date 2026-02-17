/**
 * AddActivityModal Component
 * 
 * Modal for adding new activities to a trip day with full BubbleQuest styling.
 * 
 * Features:
 * - Activity name input
 * - Time picker (optional)
 * - Location/address input
 * - Notes textarea
 * - Activity type selector with cute icons
 * - Cost input (optional)
 * - Full BubbleQuest design system integration
 * - Smooth animations and transitions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BubbleQuestModal } from './BubbleQuestModal';
import { cn } from '@/utils/cn';
import { PlaceType } from '@/types/trip';
import {
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (activityData: ActivityFormData) => void;
  isLoading?: boolean;
}

export interface ActivityFormData {
  name: string;
  address?: string;
  time_start?: string;
  notes?: string;
  place_type?: PlaceType;
  cost?: number;
}

const ACTIVITY_TYPES: { value: PlaceType; label: string; emoji: string; color: string }[] = [
  { value: 'attraction', label: 'Attraction', emoji: '🎡', color: 'from-pink-400 to-pink-500' },
  { value: 'food', label: 'Food', emoji: '🍜', color: 'from-orange-400 to-orange-500' },
  { value: 'hotel', label: 'Hotel', emoji: '🏨', color: 'from-blue-400 to-blue-500' },
  { value: 'transport', label: 'Transport', emoji: '🚇', color: 'from-purple-400 to-purple-500' },
  { value: 'other', label: 'Other', emoji: '✨', color: 'from-green-400 to-green-500' },
];

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    address: '',
    time_start: '',
    notes: '',
    place_type: 'attraction',
    cost: undefined,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ActivityFormData, string>>>({});

  const handleChange = (field: keyof ActivityFormData, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ActivityFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Activity name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Clean up form data - remove empty strings
    const cleanedData: ActivityFormData = {
      name: formData.name.trim(),
      ...(formData.address?.trim() && { address: formData.address.trim() }),
      ...(formData.time_start?.trim() && { time_start: formData.time_start.trim() }),
      ...(formData.notes?.trim() && { notes: formData.notes.trim() }),
      ...(formData.place_type && { place_type: formData.place_type }),
      ...(formData.cost && formData.cost > 0 && { cost: formData.cost }),
    };

    onSubmit(cleanedData);
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: '',
      address: '',
      time_start: '',
      notes: '',
      place_type: 'attraction',
      cost: undefined,
    });
    setErrors({});
    onClose();
  };

  return (
    <BubbleQuestModal
      isOpen={isOpen}
      onClose={handleClose}
      title="✨ Add New Activity"
      size="md"
    >
      <div className="space-y-6">
        {/* Activity Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bubblequest-500 to-bubblequest-600 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            Activity Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Visit Osaka Castle 🏯"
            className={cn(
              'w-full px-4 py-3 rounded-2xl',
              'border-2 transition-all duration-200',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-4',
              errors.name
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-neutral-200 dark:border-neutral-700 focus:border-bubblequest-500 focus:ring-bubblequest-100'
            )}
            style={{ backgroundColor: errors.name ? 'var(--bubblequest-cream)' : 'var(--bubblequest-cream)' }}
            autoFocus
          />
          {errors.name && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 mt-2 flex items-center gap-1"
            >
              <span>⚠️</span> {errors.name}
            </motion.p>
          )}
        </div>

        {/* Activity Type */}
        <div>
          <label className="block text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
            Activity Type
          </label>
          <div className="grid grid-cols-5 gap-3">
            {ACTIVITY_TYPES.map((type) => (
              <motion.button
                key={type.value}
                type="button"
                onClick={() => handleChange('place_type', type.value)}
                className={cn(
                  'relative flex flex-col items-center justify-center p-4 rounded-2xl',
                  'border-2 transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  formData.place_type === type.value
                    ? 'border-bubblequest-500 bg-gradient-to-br from-bubblequest-50 to-bubblequest-100 dark:from-bubblequest-900/30 dark:to-bubblequest-800/30 shadow-lg'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-bubblequest-300'
                )}
                style={formData.place_type !== type.value ? { backgroundColor: 'var(--bubblequest-cream)' } : undefined}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {formData.place_type === type.value && (
                  <motion.div
                    layoutId="activity-type-indicator"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-bubblequest-400/20 to-bubblequest-500/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="text-3xl mb-2 relative z-10">{type.emoji}</span>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 relative z-10">
                  {type.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time and Location Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
              <ClockIcon className="w-5 h-5 text-bubblequest-500" aria-hidden="true" />
              Time
            </label>
            <input
              type="time"
              value={formData.time_start}
              onChange={(e) => handleChange('time_start', e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-2xl',
                'border-2 border-neutral-200 dark:border-neutral-700',
                'text-neutral-900 dark:text-neutral-100',
                'focus:outline-none focus:ring-4 focus:border-bubblequest-500 focus:ring-bubblequest-100',
                'transition-all duration-200'
              )}
              style={{ backgroundColor: 'var(--bubblequest-cream)' }}
            />
          </div>

          {/* Cost */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
              <CurrencyDollarIcon className="w-5 h-5 text-bubblequest-500" aria-hidden="true" />
              Cost
            </label>
            <input
              type="number"
              value={formData.cost || ''}
              onChange={(e) => handleChange('cost', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={cn(
                'w-full px-4 py-3 rounded-2xl',
                'border-2 border-neutral-200 dark:border-neutral-700',
                'text-neutral-900 dark:text-neutral-100',
                'placeholder:text-neutral-400',
                'focus:outline-none focus:ring-4 focus:border-bubblequest-500 focus:ring-bubblequest-100',
                'transition-all duration-200'
              )}
              style={{ backgroundColor: 'var(--bubblequest-cream)' }}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
            <MapPinIcon className="w-5 h-5 text-bubblequest-500" />
            Location
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="e.g., 1-1 Osakajo, Chuo Ward, Osaka 📍"
            className={cn(
              'w-full px-4 py-3 rounded-2xl',
              'border-2 border-neutral-200 dark:border-neutral-700',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400',
              'focus:outline-none focus:ring-4 focus:border-bubblequest-500 focus:ring-bubblequest-100',
              'transition-all duration-200'
            )}
            style={{ backgroundColor: 'var(--bubblequest-cream)' }}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
            <DocumentTextIcon className="w-5 h-5 text-bubblequest-500" />
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Add any additional details... 📝"
            rows={3}
            className={cn(
              'w-full px-4 py-3 rounded-2xl',
              'border-2 border-neutral-200 dark:border-neutral-700',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400',
              'focus:outline-none focus:ring-4 focus:border-bubblequest-500 focus:ring-bubblequest-100',
              'transition-all duration-200',
              'resize-none'
            )}
            style={{ backgroundColor: 'var(--bubblequest-cream)' }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <motion.button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className={cn(
              'flex-1 px-6 py-4 rounded-2xl font-bold',
              'bg-neutral-100 dark:bg-neutral-700',
              'text-neutral-700 dark:text-neutral-300',
              'hover:bg-neutral-200 dark:hover:bg-neutral-600',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              'flex-1 px-6 py-4 rounded-2xl font-bold',
              'bg-gradient-to-r from-bubblequest-500 to-bubblequest-600',
              'text-white shadow-lg',
              'hover:from-bubblequest-600 hover:to-bubblequest-700',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.3)' }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <motion.div
                className="flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ pointerEvents: 'none' }}
                />
                Adding...
              </motion.div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                Add Activity
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </BubbleQuestModal>
  );
};
