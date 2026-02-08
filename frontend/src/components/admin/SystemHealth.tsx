import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import { SystemHealthMetrics } from '../../types/admin';
import {
  ServerIcon,
  CircleStackIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export function SystemHealth() {
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useEnhancedAuthStore();

  const fetchHealth = async () => {
    if (!accessToken) {
      setError('No access token available');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await adminService.getSystemHealth(accessToken);
      setHealth(data);
    } catch (err) {
      console.error('Error fetching system health:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'down':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading system health: {error}</p>
        <button
          onClick={fetchHealth}
          className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">No system health data available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          System Health
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Database Health */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <CircleStackIcon className="h-5 w-5 mr-2" />
            Database
          </h2>
          <div className="flex items-center">
            {getStatusIcon(health.database.status)}
            <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(health.database.status)}`}>
              {health.database.status}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Connections</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {health.database.connection_count}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Query Time</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {health.database.query_avg_time_ms}ms
            </div>
          </div>
        </div>
      </div>

      {/* Storage Health */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <ServerIcon className="h-5 w-5 mr-2" />
            Storage
          </h2>
          <div className="flex items-center">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              health.storage.percentage_used > 90 
                ? 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
                : health.storage.percentage_used > 75
                ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
                : 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
            }`}>
              {health.storage.percentage_used}% used
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Storage</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {health.storage.total_gb} GB
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Used Storage</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {health.storage.used_gb} GB
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Available Storage</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {health.storage.available_gb} GB
            </div>
          </div>
        </div>
        
        {/* Storage Usage Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Storage Usage</span>
            <span>{health.storage.percentage_used}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                health.storage.percentage_used > 90 
                  ? 'bg-red-500'
                  : health.storage.percentage_used > 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${health.storage.percentage_used}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* External APIs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center mb-4">
          <CloudIcon className="h-5 w-5 mr-2" />
          External APIs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Google Maps</div>
                <div className="flex items-center mt-1">
                  {getStatusIcon(health.external_apis.google_maps)}
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(health.external_apis.google_maps)}`}>
                    {health.external_apis.google_maps}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Weather API</div>
                <div className="flex items-center mt-1">
                  {getStatusIcon(health.external_apis.weather)}
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(health.external_apis.weather)}`}>
                    {health.external_apis.weather}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Currency API</div>
                <div className="flex items-center mt-1">
                  {getStatusIcon(health.external_apis.currency)}
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(health.external_apis.currency)}`}>
                    {health.external_apis.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Rates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center mb-4">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          Error Rates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Last Hour</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {health.error_rates.last_hour}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Last 24 Hours</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {health.error_rates.last_24h}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Last 7 Days</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {health.error_rates.last_7d}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}