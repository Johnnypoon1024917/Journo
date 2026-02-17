/**
 * EditActivityModal Component
 * 
 * Modal for editing activity/hotel details
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Place } from '@/types/trip';

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activityId: string, updates: Partial<Place>) => void;
  activity: Place | null;
  isLoading?: boolean;
}

export const EditActivityModal: React.FC<EditActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  activity,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Update form when activity changes
  useEffect(() => {
    if (activity) {
      setName(activity.name || '');
      setAddress(activity.address || '');
    }
  }, [activity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity || !name.trim()) return;

    onSave(activity.id, {
      name: name.trim(),
      address: address.trim() || null,
    });
  };

  const handleClose = () => {
    setName('');
    setAddress('');
    onClose();
  };

  if (!activity) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
              style={{ backgroundColor: 'var(--bubblequest-cream)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit {activity.place_type === 'hotel' ? 'Hotel' : 'Activity'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                    style={{ backgroundColor: 'var(--bubblequest-cream)' }}
                  />
                </div>

                {/* Address Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                    style={{ backgroundColor: 'var(--bubblequest-cream)' }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isLoading || !name.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditActivityModal;
