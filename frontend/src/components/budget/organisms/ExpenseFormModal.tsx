/**
 * ExpenseFormModal Organism Component
 * 
 * Modal wrapper for the ExpenseForm molecule component.
 * Provides modal backdrop, animations, form submission handling,
 * loading states, and error display.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExpenseForm } from '../molecules/ExpenseForm';
import { ExpenseEntry, ExpenseFormData, TripMember } from '../../../types/expense';
import { useBudgetStore } from '../../../stores/budgetStore';
import { cn } from '../../../utils/cn';
import { Spinner } from '../../../design-system/atoms/Spinner';

interface ExpenseFormModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Trip ID for the expense */
  tripId: string;
  /** Trip members for split expense functionality */
  tripMembers: TripMember[];
  /** Currency to display in the form */
  currency: string;
  /** Initial data for editing an existing expense */
  initialData?: ExpenseEntry;
  /** Callback after successful submission (optional) */
  onSuccess?: () => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripMembers,
  currency,
  initialData,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addExpense, updateExpense } = useBudgetStore();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset error when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  /**
   * Handle form submission
   * Requirements: 2.5, 2.6
   */
  const handleSubmit = async (formData: ExpenseFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (initialData) {
        // Update existing expense
        await updateExpense(initialData.id, {
          ...formData,
          currency,
        });
      } else {
        // Add new expense
        await addExpense({
          tripId,
          currency,
          ...formData,
          isSettled: false,
          syncStatus: 'pending',
          createdBy: 'current-user', // TODO: Get from auth store
        });
      }

      // Success - close modal and notify parent
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting expense:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to save expense. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel - confirm if form has changes
   */
  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={handleCancel}
            aria-hidden="true"
          />

          {/* Modal */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-form-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: 'spring',
                damping: 25,
                stiffness: 300,
              }}
              className={cn(
                'relative w-full pointer-events-auto',
                'rounded-3xl shadow-2xl border-2 border-pink-200/30',
                'max-h-[90vh] overflow-hidden',
                'max-w-2xl'
              )}
              style={{
                backgroundColor: '#FFFAF0', // Floral white from design
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div 
                className="flex items-center justify-between p-6 border-b-2 border-pink-100/50"
                style={{
                  backgroundColor: '#FFFAF0',
                }}
              >
                <h2 
                  id="expense-form-modal-title"
                  className="text-2xl font-bold text-gray-900 flex items-center gap-3"
                >
                  {/* Cat icon */}
                  <span className="text-3xl" role="img" aria-label="cat">
                    🐱
                  </span>
                  {initialData ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="p-2 rounded-full hover:bg-pink-100/50 
                    transition-all duration-200 hover:scale-110 group
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6 text-gray-400 group-hover:text-pink-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div 
                className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]"
                style={{
                  backgroundColor: '#FFFAF0',
                }}
              >
                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200"
                  >
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-800 mb-1">
                          Error Saving Expense
                        </h3>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        aria-label="Dismiss error"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Expense Form */}
                <ExpenseForm
                  tripId={tripId}
                  initialData={initialData}
                  tripMembers={tripMembers}
                  currency={currency}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                />

                {/* Loading Overlay */}
                {isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl"
                  >
                    <div className="text-center">
                      <Spinner size="xl" variant="primary" />
                      <p className="mt-4 text-lg font-semibold text-gray-700">
                        {initialData ? 'Updating expense...' : 'Adding expense...'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
