import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  UserPlusIcon,
  UserMinusIcon,
  PencilIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export interface CollaborationNotificationData {
  id: string;
  type: 'user_joined' | 'user_left' | 'item_edited' | 'item_added' | 'item_deleted';
  userName: string;
  itemType?: string;
  itemName?: string;
  timestamp: Date;
}

interface CollaborationNotificationProps {
  notification: CollaborationNotificationData;
  onDismiss: (id: string) => void;
  autoHideDuration?: number;
}

/**
 * CollaborationNotification - Shows real-time collaboration events
 * 
 * Displays toast notifications when collaborators:
 * - Join or leave the trip
 * - Edit, add, or delete items
 */
export const CollaborationNotification: React.FC<CollaborationNotificationProps> = ({
  notification,
  onDismiss,
  autoHideDuration = 5000,
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(notification.id), 300);
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [notification.id, autoHideDuration, onDismiss]);

  const getNotificationConfig = () => {
    switch (notification.type) {
      case 'user_joined':
        return {
          icon: UserPlusIcon,
          color: 'bg-green-500',
          message: t('collaboration.userJoined', '{{name}} joined the trip', {
            name: notification.userName,
          }),
        };
      case 'user_left':
        return {
          icon: UserMinusIcon,
          color: 'bg-gray-500',
          message: t('collaboration.userLeft', '{{name}} left the trip', {
            name: notification.userName,
          }),
        };
      case 'item_edited':
        return {
          icon: PencilIcon,
          color: 'bg-blue-500',
          message: t('collaboration.itemEdited', '{{name}} edited {{item}}', {
            name: notification.userName,
            item: notification.itemName || notification.itemType,
          }),
        };
      case 'item_added':
        return {
          icon: CheckIcon,
          color: 'bg-primary-500',
          message: t('collaboration.itemAdded', '{{name}} added {{item}}', {
            name: notification.userName,
            item: notification.itemName || notification.itemType,
          }),
        };
      case 'item_deleted':
        return {
          icon: TrashIcon,
          color: 'bg-red-500',
          message: t('collaboration.itemDeleted', '{{name}} deleted {{item}}', {
            name: notification.userName,
            item: notification.itemName || notification.itemType,
          }),
        };
    }
  };

  const config = getNotificationConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md"
        >
          {/* Icon */}
          <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>

          {/* Message */}
          <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
            {config.message}
          </p>

          {/* Dismiss button - 44px minimum touch target */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onDismiss(notification.id), 300);
            }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t('actions.close', 'Close')}
          >
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
