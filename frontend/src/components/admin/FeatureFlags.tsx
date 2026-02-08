import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import { FeatureFlag } from '../../types/admin';
import {
  FlagIcon,
  CheckCircleIcon,
  XCircleIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

export function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { accessToken } = useEnhancedAuthStore();

  const fetchFlags = async () => {
    if (!accessToken) {
      setError('No access token available');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await adminService.getFeatureFlags(accessToken);
      setFlags(data.flags);
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [accessToken]);

  const handleToggleFlag = async (flagId: string, enabled: boolean) => {
    if (!accessToken) return;

    try {
      setUpdating(flagId);
      await adminService.updateFeatureFlag(accessToken, flagId, { enabled });
      
      // Update local state
      setFlags(prev => prev.map(flag => 
        flag.id === flagId ? { ...flag, enabled } : flag
      ));
      
      console.log(`Feature flag ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      console.error('Error updating feature flag:', err);
      setError(err instanceof Error ? err.message : 'Failed to update feature flag');
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateRollout = async (flagId: string, rolloutPercentage: number) => {
    if (!accessToken) return;

    try {
      setUpdating(flagId);
      await adminService.updateFeatureFlag(accessToken, flagId, { rollout_percentage: rolloutPercentage });
      
      // Update local state
      setFlags(prev => prev.map(flag => 
        flag.id === flagId ? { ...flag, rollout_percentage: rolloutPercentage } : flag
      ));
      
      console.log(`Feature flag rollout updated to ${rolloutPercentage}%`);
    } catch (err) {
      console.error('Error updating feature flag rollout:', err);
      setError(err instanceof Error ? err.message : 'Failed to update feature flag rollout');
    } finally {
      setUpdating(null);
    }
  };

  const getFlagStatusColor = (flag: FeatureFlag) => {
    if (!flag.enabled) {
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
    if (flag.rollout_percentage === 100) {
      return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
    }
    return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
  };

  const getFlagStatusText = (flag: FeatureFlag) => {
    if (!flag.enabled) return 'Disabled';
    if (flag.rollout_percentage === 100) return 'Fully Enabled';
    return `${flag.rollout_percentage}% Rollout`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Feature Flags
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Manage Feature Flags ({flags.length})
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Control feature availability and gradual rollouts
          </p>
        </div>

        {flags.length === 0 ? (
          <div className="text-center py-12">
            <FlagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No feature flags</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No feature flags are configured.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {flags.map((flag) => (
              <div key={flag.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FlagIcon className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {flag.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFlagStatusColor(flag)}`}>
                        {getFlagStatusText(flag)}
                      </span>
                    </div>

                    {flag.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {flag.description}
                      </p>
                    )}

                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                      <span>Created: {new Date(flag.created_at).toLocaleDateString()}</span>
                      <span>Updated: {new Date(flag.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-3">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Enabled:</span>
                      <button
                        onClick={() => handleToggleFlag(flag.id, !flag.enabled)}
                        disabled={updating === flag.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                          flag.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            flag.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      {flag.enabled ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    {/* Rollout Percentage */}
                    {flag.enabled && (
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Rollout:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={flag.rollout_percentage}
                            onChange={(e) => handleUpdateRollout(flag.id, parseInt(e.target.value))}
                            disabled={updating === flag.id}
                            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50"
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-10">
                            {flag.rollout_percentage}%
                          </span>
                          <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    )}

                    {updating === flag.id && (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rollout Progress Bar */}
                {flag.enabled && flag.rollout_percentage < 100 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Gradual Rollout</span>
                      <span>{flag.rollout_percentage}% of users</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${flag.rollout_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature Flag Info */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="flex">
          <FlagIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              About Feature Flags
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
              <ul className="list-disc list-inside space-y-1">
                <li>Feature flags allow you to enable/disable features without deploying code</li>
                <li>Gradual rollout lets you test features with a percentage of users</li>
                <li>Disabled flags hide features completely from all users</li>
                <li>Changes take effect immediately across all active sessions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}