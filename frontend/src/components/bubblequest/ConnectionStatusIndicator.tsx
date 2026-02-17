import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../hooks/useSocket';
import { useTranslation } from 'react-i18next';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showWhenConnected?: boolean;
}

/**
 * ConnectionStatusIndicator - Shows real-time connection status
 * 
 * Displays a small indicator showing the WebSocket connection state:
 * - Connected: Green dot (optional, hidden by default)
 * - Connecting: Yellow pulsing dot
 * - Reconnecting: Orange pulsing dot
 * - Disconnected: Red dot with reconnect button
 */
export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  className = '',
  showWhenConnected = false,
}) => {
  const { connectionState, reconnect } = useSocket({ autoConnect: false });
  const { t } = useTranslation();

  // Don't show anything when connected unless explicitly requested
  if (connectionState === 'connected' && !showWhenConnected) {
    return null;
  }

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: t('connection.connected', 'Connected'),
          pulse: false,
          showReconnect: false,
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: t('connection.connecting', 'Connecting...'),
          pulse: true,
          showReconnect: false,
        };
      case 'reconnecting':
        return {
          color: 'bg-orange-500',
          text: t('connection.reconnecting', 'Reconnecting...'),
          pulse: true,
          showReconnect: true,
        };
      case 'disconnected':
        return {
          color: 'bg-red-500',
          text: t('connection.disconnected', 'Disconnected'),
          pulse: false,
          showReconnect: true,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-gray-800 shadow-md ${className}`}
      >
        {/* Status dot */}
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${config.color}`} />
          {config.pulse && (
            <motion.div
              className={`absolute inset-0 w-2 h-2 rounded-full ${config.color}`}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>

        {/* Status text */}
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {config.text}
        </span>

        {/* Reconnect button - 44px minimum touch target */}
        {config.showReconnect && (
          <button
            onClick={reconnect}
            className="ml-1 px-3 py-2 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors min-h-[44px]"
            aria-label={t('connection.retry', 'Retry connection')}
          >
            {t('connection.retry', 'Retry')}
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
