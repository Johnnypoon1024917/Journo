import React from 'react';
import { motion } from 'framer-motion';
import { useRealtimeStore } from '../../stores/realtimeStore';
import { useTranslation } from 'react-i18next';
import { PencilIcon } from '@heroicons/react/24/outline';

interface EditingIndicatorProps {
  tripId: string;
  itemId: string;
  className?: string;
}

/**
 * EditingIndicator - Shows who is currently editing an item
 * 
 * Displays a small badge when another user is editing the same item,
 * preventing conflicts and showing real-time collaboration status.
 */
export const EditingIndicator: React.FC<EditingIndicatorProps> = ({
  tripId,
  itemId,
  className = '',
}) => {
  const { t } = useTranslation();
  const getUserEditingItem = useRealtimeStore((state) => state.getUserEditingItem);
  
  const editingUser = getUserEditingItem(tripId, itemId);

  if (!editingUser) {
    return null;
  }

  const displayName = editingUser.userName || editingUser.userEmail.split('@')[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 ${className}`}
    >
      <motion.div
        animate={{
          rotate: [0, -10, 10, -10, 0],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <PencilIcon className="w-3 h-3" />
      </motion.div>
      <span className="text-xs font-medium">
        {t('editing.userEditing', '{{name}} is editing', { name: displayName })}
      </span>
    </motion.div>
  );
};
