/**
 * Network Reconnection Service
 * 
 * Coordinates automatic synchronization across all services when network connectivity is restored.
 * Validates Requirement 11.4: Trigger sync within 5 seconds of going online
 */

import { offlineQueueService } from './offlineQueueService';
import { syncService } from './syncService';
import { networkErrorHandler } from './networkErrorHandler';
import { useOfflineStore } from '../stores/offlineStore';

export interface ReconnectionConfig {
  syncDelay: number; // Delay before triggering sync (ms)
  maxSyncDelay: number; // Maximum allowed delay (ms)
}

const DEFAULT_CONFIG: ReconnectionConfig = {
  syncDelay: 1000, // 1 second delay to ensure connection is stable
  maxSyncDelay: 5000, // 5 seconds maximum (requirement)
};

/**
 * Network Reconnection Service
 * Manages automatic sync when device comes back online
 */
class NetworkReconnectionService {
  private config: ReconnectionConfig;
  private syncTimeout: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private lastOnlineTime: number = 0;

  constructor(config: Partial<ReconnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Validate config
    if (this.config.syncDelay > this.config.maxSyncDelay) {
      console.warn(
        `syncDelay (${this.config.syncDelay}ms) exceeds maxSyncDelay (${this.config.maxSyncDelay}ms). ` +
        `Using maxSyncDelay instead.`
      );
      this.config.syncDelay = this.config.maxSyncDelay;
    }
  }

  /**
   * Initialize the service and set up event listeners
   * Validates Requirement 11.4: Detect network status changes
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('NetworkReconnectionService already initialized');
      return;
    }

    // Subscribe to network state changes
    networkErrorHandler.subscribe((networkState) => {
      if (networkState.isOnline && !this.wasRecentlyOnline()) {
        this.handleReconnection();
      }
    });

    // Also listen to browser online event as fallback
    window.addEventListener('online', () => {
      if (!this.wasRecentlyOnline()) {
        this.handleReconnection();
      }
    });

    // Listen to visibility change to sync when user returns to tab
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.handleVisibilityChange();
      }
    });

    this.isInitialized = true;
    console.log('NetworkReconnectionService initialized');
  }

  /**
   * Handle network reconnection
   * Validates Requirement 11.4: Trigger sync within 5 seconds of going online
   */
  private handleReconnection(): void {
    this.lastOnlineTime = Date.now();
    
    console.log(
      `Network reconnected. Scheduling sync in ${this.config.syncDelay}ms ` +
      `(max ${this.config.maxSyncDelay}ms)`
    );

    // Clear any existing sync timeout
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Update offline store
    const offlineStore = useOfflineStore.getState();
    offlineStore.setOnlineStatus(true);

    // Schedule sync with configured delay
    // Validates Requirement 11.4: Process queued changes in order
    this.syncTimeout = setTimeout(async () => {
      await this.triggerSync();
    }, this.config.syncDelay);
  }

  /**
   * Handle visibility change (user returns to tab)
   */
  private handleVisibilityChange(): void {
    // Only sync if we haven't synced recently (within last 30 seconds)
    const timeSinceLastOnline = Date.now() - this.lastOnlineTime;
    if (timeSinceLastOnline > 30000) {
      console.log('Tab became visible, checking for pending changes...');
      this.triggerSync();
    }
  }

  /**
   * Check if device was recently marked as online (within last 2 seconds)
   * Prevents duplicate sync triggers
   */
  private wasRecentlyOnline(): boolean {
    return Date.now() - this.lastOnlineTime < 2000;
  }

  /**
   * Trigger synchronization across all services
   * Validates Requirement 11.4: Process queued changes in order
   */
  private async triggerSync(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Device is offline, skipping sync');
      return;
    }

    try {
      console.log('Starting automatic sync after reconnection...');

      // Get queue status before syncing
      const queueStatus = await offlineQueueService.getQueueStatus();
      
      if (queueStatus.pendingCount === 0 && queueStatus.failedCount === 0) {
        console.log('No pending changes to sync');
        return;
      }

      console.log(
        `Syncing ${queueStatus.pendingCount} pending and ${queueStatus.failedCount} failed items`
      );

      // Trigger sync on offline queue service (for collaboration changes)
      // This processes items in order as required
      await offlineQueueService.syncQueue();

      // Trigger sync on main sync service (for trips, places, etc.)
      await syncService.startSync();

      console.log('Automatic sync completed successfully');
    } catch (error) {
      console.error('Automatic sync failed:', error);
      
      // Don't throw - we'll retry on next reconnection or visibility change
    }
  }

  /**
   * Manually trigger sync (for testing or user-initiated sync)
   */
  async manualSync(): Promise<void> {
    console.log('Manual sync triggered');
    await this.triggerSync();
  }

  /**
   * Get current configuration
   */
  getConfig(): ReconnectionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReconnectionConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Validate
    if (this.config.syncDelay > this.config.maxSyncDelay) {
      console.warn('syncDelay exceeds maxSyncDelay, adjusting...');
      this.config.syncDelay = this.config.maxSyncDelay;
    }
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    
    this.isInitialized = false;
    console.log('NetworkReconnectionService destroyed');
  }
}

// Export singleton instance
export const networkReconnectionService = new NetworkReconnectionService();

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  networkReconnectionService.initialize();
}

export default networkReconnectionService;
