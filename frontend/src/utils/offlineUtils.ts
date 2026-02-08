/**
 * Generate a unique ID for offline-created resources
 * Format: offline_<timestamp>_<random>
 */
export function generateOfflineId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `offline_${timestamp}_${random}`;
}

/**
 * Check if an ID was generated offline
 */
export function isOfflineId(id: string): boolean {
  return id.startsWith('offline_');
}

/**
 * Mark data as offline-created
 */
export function markAsOfflineCreated<T extends Record<string, any>>(data: T): T {
  return {
    ...data,
    _offline_created: true,
    _offline_modified: false,
  };
}

/**
 * Mark data as offline-modified
 */
export function markAsOfflineModified<T extends Record<string, any>>(data: T): T {
  return {
    ...data,
    _offline_modified: true,
  };
}

/**
 * Remove offline metadata from data before syncing
 */
export function cleanOfflineMetadata<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned = { ...data };
  delete cleaned._offline_created;
  delete cleaned._offline_modified;
  delete cleaned._last_synced;
  delete cleaned._pending_upload;
  return cleaned;
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Format last sync time for display
 */
export function formatLastSyncTime(lastSyncTime: string | null): string {
  if (!lastSyncTime) {
    return 'Never synced';
  }
  
  const now = new Date();
  const syncTime = new Date(lastSyncTime);
  const diffMs = now.getTime() - syncTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

/**
 * Calculate exponential backoff delay for retries
 */
export function calculateBackoffDelay(retryCount: number, baseDelay: number = 1000): number {
  const maxDelay = 60000; // 1 minute max
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}
