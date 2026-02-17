/**
 * Network Reconnection Demo Page
 * 
 * Demonstrates automatic sync on network reconnection
 * Validates Requirement 11.4
 */

import React, { useState, useEffect } from 'react';
import { offlineQueueService } from '../services/offlineQueueService';
import { networkReconnectionService } from '../services/networkReconnectionService';
import { useOfflineStore } from '../stores/offlineStore';

export const NetworkReconnectionDemo: React.FC = () => {
  const [queueStatus, setQueueStatus] = useState({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [config, setConfig] = useState(networkReconnectionService.getConfig());
  
  const offlineStore = useOfflineStore();

  // Update queue status periodically
  useEffect(() => {
    const updateStatus = async () => {
      const status = await offlineQueueService.getQueueStatus();
      setQueueStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen to online/offline events and log them
  useEffect(() => {
    const handleOnline = () => {
      addLog('🟢 Network: ONLINE');
    };

    const handleOffline = () => {
      addLog('🔴 Network: OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const queueTestAction = async () => {
    try {
      const item = await offlineQueueService.queueAction({
        tripId: `test-trip-${Date.now()}`,
        action: 'test',
        endpoint: '/api/test',
        method: 'POST',
        data: { test: true, timestamp: new Date().toISOString() },
      });
      addLog(`✅ Queued action: ${item.id.substring(0, 8)}...`);
    } catch (error) {
      addLog(`❌ Failed to queue action: ${error}`);
    }
  };

  const triggerManualSync = async () => {
    try {
      addLog('🔄 Triggering manual sync...');
      await networkReconnectionService.manualSync();
      addLog('✅ Manual sync completed');
    } catch (error) {
      addLog(`❌ Manual sync failed: ${error}`);
    }
  };

  const clearQueue = async () => {
    try {
      await offlineQueueService.clearQueue();
      addLog('🗑️ Queue cleared');
    } catch (error) {
      addLog(`❌ Failed to clear queue: ${error}`);
    }
  };

  const simulateOffline = () => {
    addLog('📴 Simulating offline mode...');
    addLog('💡 Use browser DevTools Network tab to go offline');
  };

  const updateSyncDelay = (delay: number) => {
    networkReconnectionService.updateConfig({ syncDelay: delay });
    setConfig(networkReconnectionService.getConfig());
    addLog(`⚙️ Sync delay updated to ${delay}ms`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Network Reconnection Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Test automatic sync on network reconnection (Requirement 11.4)
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Status
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Network:</span>
                <span className={`font-semibold ${queueStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {queueStatus.isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Syncing:</span>
                <span className={`font-semibold ${queueStatus.isSyncing ? 'text-blue-600' : 'text-gray-600'}`}>
                  {queueStatus.isSyncing ? '🔄 Yes' : '⏸️ No'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pending Items:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {queueStatus.pendingCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Failed Items:</span>
                <span className={`font-semibold ${queueStatus.failedCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {queueStatus.failedCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {offlineStore.lastSyncTime 
                    ? new Date(offlineStore.lastSyncTime).toLocaleTimeString()
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sync Delay: {config.syncDelay}ms
                </label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="500"
                  value={config.syncDelay}
                  onChange={(e) => updateSyncDelay(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0ms (Immediate)</span>
                  <span>5000ms (Max)</span>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">
                  <strong>Requirement 11.4:</strong> Sync within 5 seconds of going online
                </p>
                <p>
                  Current delay: <strong>{config.syncDelay}ms</strong> (within {config.maxSyncDelay}ms limit)
                </p>
              </div>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Actions
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={queueTestAction}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Queue Test Action
              </button>

              <button
                onClick={triggerManualSync}
                disabled={queueStatus.isSyncing || !queueStatus.isOnline}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Trigger Manual Sync
              </button>

              <button
                onClick={clearQueue}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Queue
              </button>

              <button
                onClick={simulateOffline}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Simulate Offline
              </button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Testing Instructions:
              </h3>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Queue some test actions</li>
                <li>Open DevTools Network tab</li>
                <li>Set throttling to "Offline"</li>
                <li>Queue more actions (they'll be pending)</li>
                <li>Set throttling back to "Online"</li>
                <li>Watch automatic sync trigger within {config.syncDelay}ms</li>
              </ol>
            </div>
          </div>

          {/* Logs Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Event Log
              </h2>
              <button
                onClick={() => setLogs([])}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No events yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-gray-700 dark:text-gray-300 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Implementation Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Network Detection
              </h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Browser online/offline events</li>
                <li>• Network Information API</li>
                <li>• Periodic connectivity checks</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Sync Strategy
              </h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• FIFO queue processing</li>
                <li>• Batch processing (5 items)</li>
                <li>• Exponential backoff retry</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Error Handling
              </h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Max 3 retry attempts</li>
                <li>• Last-write-wins conflicts</li>
                <li>• Failed items preserved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkReconnectionDemo;
