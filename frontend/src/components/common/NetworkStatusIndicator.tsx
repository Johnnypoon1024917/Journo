/**
 * Network Status Indicator Component
 * 
 * Displays network connectivity status with visual feedback
 * Shows offline status, slow connection warnings, and online status
 * 
 * Validates: Requirements 4.3
 */

import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export interface NetworkStatusIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showWhenOnline?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  position = 'bottom-right',
  showWhenOnline = false,
  autoHide = true,
  autoHideDelay = 3000,
}) => {
  const { isOnline, status, effectiveType, rtt } = useNetworkStatus();
  const [isVisible, setIsVisible] = React.useState(true);
  const [hasBeenOffline, setHasBeenOffline] = React.useState(false);

  // Track if user has been offline to show reconnection message
  React.useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
      setIsVisible(true);
    } else if (hasBeenOffline && autoHide) {
      // Show reconnection message briefly
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline, autoHide, autoHideDelay]);

  // Don't show if online and showWhenOnline is false
  if (!isVisible || (isOnline && !showWhenOnline && !hasBeenOffline)) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getStatusConfig = () => {
    if (!isOnline || status === 'offline') {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        ),
        text: 'Offline',
        description: 'No internet connection',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        textColor: 'text-red-800 dark:text-red-400',
        borderColor: 'border-red-300 dark:border-red-700',
      };
    }

    if (status === 'slow') {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ),
        text: 'Slow Connection',
        description: effectiveType ? `Connection: ${effectiveType}` : 'Limited connectivity',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        textColor: 'text-yellow-800 dark:text-yellow-400',
        borderColor: 'border-yellow-300 dark:border-yellow-700',
      };
    }

    // Online and recently reconnected
    return {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      text: 'Back Online',
      description: 'Connection restored',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      textColor: 'text-green-800 dark:text-green-400',
      borderColor: 'border-green-300 dark:border-green-700',
    };
  };

  const config = getStatusConfig();

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 animate-slide-in`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border ${config.bgColor} ${config.textColor} ${config.borderColor} max-w-sm`}
      >
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{config.text}</p>
          <p className="text-xs mt-0.5 opacity-90">{config.description}</p>
          {rtt && status === 'slow' && (
            <p className="text-xs mt-1 opacity-75">Latency: {rtt}ms</p>
          )}
        </div>
        {autoHide && isOnline && (
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 ml-2 -mr-1 -mt-1 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-slide-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};
