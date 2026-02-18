/**
 * OfflineBanner Component
 * 
 * Global banner showing offline status and sync queue
 * Provides manual sync trigger when back online
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface OfflineBannerProps {
  isOffline: boolean;
  pendingChanges: number;
  onSync?: () => void;
  isSyncing?: boolean;
  className?: string;
}

export function OfflineBanner({
  isOffline,
  pendingChanges,
  onSync,
  isSyncing = false,
  className,
}: OfflineBannerProps) {
  if (!isOffline && pendingChanges === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'px-4 py-3',
        'bg-warning-500 text-white',
        'shadow-lg',
        'transform transition-transform duration-300',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Status Message */}
        <div className="flex items-center gap-3">
          {/* Offline Icon */}
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold">
              {isOffline ? 'Offline Mode' : 'Back Online'}
            </span>
            {pendingChanges > 0 && (
              <span className="text-sm opacity-90">
                {pendingChanges} {pendingChanges === 1 ? 'change' : 'changes'} queued
              </span>
            )}
          </div>
        </div>

        {/* Sync Button */}
        {!isOffline && pendingChanges > 0 && onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={cn(
              'px-4 py-2 rounded-lg',
              'bg-white text-warning-700',
              'font-medium text-sm',
              'hover:bg-warning-50',
              'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-warning-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              'flex items-center gap-2'
            )}
            aria-label={isSyncing ? 'Syncing changes' : 'Sync changes now'}
          >
            {isSyncing ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Sync Now
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
