/**
 * System Health Indicator Component
 * 
 * Displays overall system health status with service details
 * Provides visual feedback about service availability
 * 
 * Validates: Requirements 5.1, 5.3
 */

import React, { useState } from 'react';
import { useHealthMonitor } from '../../hooks/useHealthMonitor';

export const SystemHealthIndicator: React.FC = () => {
  const { health, features } = useHealthMonitor();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: 'healthy' | 'degraded' | 'offline') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: 'healthy' | 'degraded' | 'offline') => {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Some Services Unavailable';
      case 'offline':
        return 'Offline Mode';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className="relative">
      {/* Status Indicator Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="System health status"
        aria-expanded={isExpanded}
      >
        {/* Status Dot */}
        <div className="relative">
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor(
              health.overallStatus
            )}`}
          />
          {health.overallStatus === 'healthy' && (
            <div
              className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor(
                health.overallStatus
              )} animate-ping opacity-75`}
            />
          )}
        </div>

        {/* Status Text (Desktop only) */}
        <span className="hidden md:inline text-sm text-gray-700 dark:text-gray-300">
          {getStatusText(health.overallStatus)}
        </span>

        {/* Expand Icon */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                System Status
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated {new Date(health.lastUpdated).toLocaleTimeString()}
              </span>
            </div>

            {/* Overall Status */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(
                    health.overallStatus
                  )}`}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getStatusText(health.overallStatus)}
                </span>
              </div>
              {!health.isOnline && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  You are currently offline. Some features may be unavailable.
                </p>
              )}
            </div>

            {/* Service Status List */}
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Services
              </h4>
              {Object.entries(health.services).map(([service, status]) => (
                <div
                  key={service}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        status.isHealthy ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {service}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {status.isHealthy && status.responseTime > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {status.responseTime}ms
                      </span>
                    )}
                    {!status.isHealthy && status.errorCount > 0 && (
                      <span className="text-xs text-red-500">
                        {status.errorCount} errors
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Status */}
            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Features
              </h4>
              {Array.from(features.entries()).map(([name, feature]) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {name.replace(/-/g, ' ')}
                    </span>
                    {feature.offlineCapable && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        Offline
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      feature.enabled
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {feature.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
