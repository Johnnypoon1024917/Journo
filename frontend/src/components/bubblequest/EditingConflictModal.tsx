import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EditingConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: {
    userId: string;
    userEmail: string;
    userName?: string;
  };
  itemType: string;
}

/**
 * EditingConflictModal - Shows when user tries to edit an item being edited by someone else
 * 
 * Prevents editing conflicts by informing the user that another collaborator
 * is currently editing the same item.
 */
export const EditingConflictModal: React.FC<EditingConflictModalProps> = ({
  isOpen,
  onClose,
  editingUser,
  itemType,
}) => {
  const { t } = useTranslation();

  const displayName = editingUser.userName || editingUser.userEmail.split('@')[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto"
              style={{ backgroundColor: 'var(--bubblequest-cream)' }}
            >
              {/* Close button - 44px minimum touch target */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={t('actions.close', 'Close')}
              >
                <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                {t('editing.editingConflict', 'Editing Conflict')}
              </h2>

              {/* Message */}
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                {t('editing.conflictMessage', '{{name}} is currently editing this {{type}}. Please wait until they\'re done.', {
                  name: displayName,
                  type: itemType,
                })}
              </p>

              {/* User info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {displayName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {editingUser.userEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                {t('actions.close', 'Close')}
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
