import { useState, useEffect } from 'react';
import { quickPlanService } from '../../features/ai/quickPlanService';
import { useOfflineStore } from '../../stores/offlineStore';
import { useToast } from '../../hooks/useToast';
import { Button } from '../common/Button';

interface OfflineQuickPlanManagerProps {
  onOfflineStatusChange?: (status: any) => void;
}

export function OfflineQuickPlanManager({ onOfflineStatusChange }: OfflineQuickPlanManagerProps) {
  const { isOnline } = useOfflineStore();
  const { success: showSuccess, error: showError, info: showInfo } = useToast();
  const [offlineStatus, setOfflineStatus] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCleaningCache, setIsCleaningCache] = useState(false);

  useEffect(() => {
    checkOfflineStatus();
    loadCacheStats();
  }, [isOnline]);

  const checkOfflineStatus = async () => {
    try {
      const status = await quickPlanService.getOfflineStatus();
      setOfflineStatus(status);
      onOfflineStatusChange?.(status);
    } catch (error) {
      console.error('Error checking offline status:', error);
    }
  };

  const loadCacheStats = async () => {
    try {
      const stats = await quickPlanService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  };

  const handleSyncOfflineTrips = async () => {
    if (!isOnline) {
      showError('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await quickPlanService.syncOfflineTrips();
      
      if (result.synced > 0) {
        showSuccess(`Successfully synced ${result.synced} trip(s)`);
      }
      
      if (result.failed > 0) {
        showError(`Failed to sync ${result.failed} trip(s)`);
      }
      
      if (result.synced === 0 && result.failed === 0) {
        showInfo('No offline trips to sync');
      }
      
      // Refresh stats after sync
      await loadCacheStats();
      
    } catch (error) {
      console.error('Error syncing offline trips:', error);
      showError('Failed to sync offline trips');
    } finally {
      setIsSyncing(false);
    }
  };
  const handleCleanupCache = async () => {
    setIsCleaningCache(true);
    try {
      const result = await quickPlanService.cleanupCache();
      
      if (result.removed > 0) {
        showSuccess(`Cleaned up ${result.removed} expired cache entries`);
      } else {
        showInfo('No expired cache entries to clean up');
      }
      
      if (result.errors.length > 0) {
        showError(`Some cleanup operations failed: ${result.errors.join(', ')}`);
      }
      
      // Refresh stats after cleanup
      await loadCacheStats();
      
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      showError('Failed to clean up cache');
    } finally {
      setIsCleaningCache(false);
    }
  };

  const handleClearAllCache = async () => {
    if (!confirm('Are you sure you want to clear all offline cache? This will remove all cached suggestions and offline trips.')) {
      return;
    }

    try {
      await quickPlanService.clearOfflineCache();
      showSuccess('All offline cache cleared');
      
      // Refresh stats and status
      await loadCacheStats();
      await checkOfflineStatus();
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      showError('Failed to clear cache');
    }
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (!offlineStatus || !cacheStats) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Offline Status */}
      <div className={`rounded-lg p-4 ${
        offlineStatus.isOffline 
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${
            offlineStatus.isOffline ? 'bg-yellow-500' : 'bg-green-500'
          }`}></div>
          <div>
            <h3 className={`font-medium ${
              offlineStatus.isOffline ? 'text-yellow-800 dark:text-yellow-200' : 'text-green-800 dark:text-green-200'
            }`}>
              {offlineStatus.isOffline ? 'Offline Mode' : 'Online'}
            </h3>
            <p className={`text-sm ${
              offlineStatus.isOffline ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'
            }`}>
              {offlineStatus.message}
            </p>
          </div>
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Cache Statistics</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cached Suggestions</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{cacheStats.totalSuggestions}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Offline Trips</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{cacheStats.totalTrips}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatStorageSize(cacheStats.storageUsed)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Cached</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDate(cacheStats.newestCache)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {isOnline && cacheStats.totalTrips > 0 && (
            <Button
              onClick={handleSyncOfflineTrips}
              disabled={isSyncing}
              variant="primary"
              size="sm"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                'Sync Offline Trips'
              )}
            </Button>
          )}
          
          <Button
            onClick={handleCleanupCache}
            disabled={isCleaningCache}
            variant="secondary"
            size="sm"
          >
            {isCleaningCache ? 'Cleaning...' : 'Cleanup Expired'}
          </Button>
          
          <Button
            onClick={handleClearAllCache}
            variant="secondary"
            size="sm"
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear All Cache
          </Button>
        </div>
      </div>

      {/* Offline Capabilities Info */}
      {offlineStatus.isOffline && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Offline Capabilities</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              View cached trip suggestions
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Create trips from cached suggestions
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Edit offline trips
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Limited: No new suggestions generation
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Limited: No real-time collaboration
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}