import React from 'react';
import { motion } from 'framer-motion';
import { useRealtimeStore } from '../../stores/realtimeStore';
import { useTranslation } from 'react-i18next';

interface PresenceIndicatorProps {
  tripId: string;
  className?: string;
}

/**
 * PresenceIndicator - Shows active viewers for a trip
 * 
 * Displays the number of users currently viewing the trip
 * and shows their avatars/initials in a compact format.
 */
export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  tripId,
  className = '',
}) => {
  const { t } = useTranslation();
  const presence = useRealtimeStore((state) => state.presence[tripId]);

  if (!presence || presence.viewerCount === 0) {
    return null;
  }

  const { viewerCount, viewers } = presence;
  const displayViewers = viewers.slice(0, 3); // Show max 3 avatars
  const remainingCount = viewerCount - displayViewers.length;

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  const colors = [
    'bg-pink-500',
    'bg-purple-500',
    'bg-blue-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-yellow-500',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 ${className}`}
    >
      {/* Viewer avatars - ensure minimum touch target for interactive elements */}
      <div className="flex -space-x-2">
        {displayViewers.map((viewer, index) => (
          <motion.div
            key={viewer.userId || viewer.userEmail}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`w-10 h-10 rounded-full ${colors[index % colors.length]} flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800 shadow-sm`}
            title={viewer.userEmail}
          >
            {viewer.userEmail ? getInitials(viewer.userEmail) : '?'}
          </motion.div>
        ))}
        
        {remainingCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: displayViewers.length * 0.1 }}
            className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800 shadow-sm"
          >
            +{remainingCount}
          </motion.div>
        )}
      </div>

      {/* Viewer count text */}
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {viewerCount === 1
          ? t('presence.oneViewer', '1 viewer')
          : t('presence.multipleViewers', '{{count}} viewers', { count: viewerCount })}
      </span>
    </motion.div>
  );
};
