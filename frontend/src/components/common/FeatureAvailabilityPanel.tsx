/**
 * Feature Availability Panel Component
 * 
 * Displays detailed information about feature availability in offline mode
 * Shows which features work offline, which are limited, and which require network
 * 
 * Validates: Requirements 5.5
 */

import React from 'react';
import { useOfflineCapabilities } from '../../hooks/useOfflineCapabilities';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export interface FeatureAvailabilityPanelProps {
  showOnlyUnavailable?: boolean;
  compact?: boolean;
}

export const FeatureAvailabilityPanel: React.FC<FeatureAvailabilityPanelProps> = ({
  showOnlyUnavailable = false,
  compact = false,
}) => {
  const { capabilities, summary } = useOfflineCapabilities();
  const { isOnline } = useNetworkStatus();

  const getOfflineModeIcon = (mode: 'full' | 'partial' | 'none') => {
    switch (mode) {
      case 'full':
        return '✅';
      case 'partial':
        return '⚠️';
      case 'none':
        return '❌';
    }
  };

  const getOfflineModeLabel = (mode: 'full' | 'partial' | 'none') => {
    switch (mode) {
      case 'full':
        return 'Full Offline Support';
      case 'partial':
        return 'Limited Offline Support';
      case 'none':
        return 'Requires Network';
    }
  };

  const getOfflineModeColor = (mode: 'full' | 'partial' | 'none') => {
    switch (mode) {
      case 'full':
        return 'text-green-600 dark:text-green-400';
      case 'partial':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'none':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const featuresToShow = showOnlyUnavailable
    ? Array.from(capabilities.values()).filter((c) => !c.isAvailable)
    : Array.from(capabilities.values());

  if (featuresToShow.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Feature Availability
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {summary.availableFeatures}/{summary.totalFeatures} available
          </span>
        </div>
        <div className="space-y-2">
          {featuresToShow.map((capability) => (
            <div
              key={capability.featureName}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-700 dark:text-gray-300 capitalize">
                {capability.featureName.replace(/-/g, ' ')}
              </span>
              <span className={capability.isAvailable ? 'text-green-600' : 'text-red-600'}>
                {capability.isAvailable ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Feature Availability
          </h2>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.fullOfflineSupport}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Full Offline
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {summary.partialOfflineSupport}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Limited Offline
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.noOfflineSupport}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Network Required
            </div>
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {featuresToShow.map((capability) => (
          <div
            key={capability.featureName}
            className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getOfflineModeIcon(capability.offlineMode)}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {capability.featureName.replace(/-/g, ' ')}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 ${getOfflineModeColor(
                        capability.offlineMode
                      )}`}
                    >
                      {getOfflineModeLabel(capability.offlineMode)}
                    </p>
                  </div>
                </div>

                {/* Fallback Behavior */}
                {capability.fallbackBehavior && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-11">
                    {capability.fallbackBehavior}
                  </p>
                )}

                {/* Limitations */}
                {capability.limitations.length > 0 && !isOnline && (
                  <div className="mt-3 ml-11">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Limitations:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {capability.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div
                className={`flex-shrink-0 ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                  capability.isAvailable
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}
              >
                {capability.isAvailable ? 'Available' : 'Unavailable'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      {!isOnline && (
        <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-blue-800 dark:text-blue-400">
            💡 <strong>Offline Mode:</strong> Your changes are saved locally and will
            automatically sync when you're back online.
          </p>
        </div>
      )}
    </div>
  );
};
