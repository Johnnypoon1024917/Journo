/**
 * Sync Conflict Resolution Service
 * 
 * Detects and manages sync conflicts when local and server data differ.
 * Provides conflict resolution UI and applies user choices.
 * 
 * Validates Requirement 11.6: Detect conflicts during sync and allow user to choose version
 */

import { SyncConflict } from '../components/common/SyncConflictDialog';
import { offlineStorage } from './offlineStorage';

export type ConflictResolution = 'local' | 'server' | 'pending';

interface ConflictRecord {
  conflict: SyncConflict;
  resolution: ConflictResolution;
  resolvedAt?: string;
}

/**
 * SyncConflictService class
 * Manages sync conflicts and their resolution
 */
class SyncConflictService {
  private conflicts: Map<string, ConflictRecord> = new Map();
  private conflictListeners: Set<(conflicts: SyncConflict[]) => void> = new Set();

  /**
   * Detect if there's a conflict between local and server data
   * 
   * A conflict exists when:
   * 1. Both local and server versions have been modified
   * 2. The modifications happened at different times
   * 3. The data differs in meaningful ways
   * 
   * @param localData - Local version of the data
   * @param serverData - Server version of the data
   * @param resourceType - Type of resource
   * @returns true if conflict detected
   */
  detectConflict(
    localData: any,
    serverData: any,
    resourceType: string
  ): boolean {
    // No conflict if either version is missing
    if (!localData || !serverData) {
      return false;
    }

    // Check if local data was modified offline
    const wasModifiedOffline = localData._offline_modified || localData._offline_created;
    if (!wasModifiedOffline) {
      return false;
    }

    // Compare modification timestamps
    const localModified = new Date(localData.updated_at || localData.created_at);
    const serverModified = new Date(serverData.updated_at || serverData.created_at);

    // If timestamps are very close (within 1 second), no conflict
    const timeDiff = Math.abs(localModified.getTime() - serverModified.getTime());
    if (timeDiff < 1000) {
      return false;
    }

    // Check if data actually differs
    const hasDataDifference = this.hasSignificantDifference(
      localData,
      serverData,
      resourceType
    );

    return hasDataDifference;
  }

  /**
   * Check if there are significant differences between local and server data
   * Ignores metadata fields and focuses on user-facing content
   */
  private hasSignificantDifference(
    localData: any,
    serverData: any,
    resourceType: string
  ): boolean {
    // Define fields to compare for each resource type
    const fieldsToCompare: Record<string, string[]> = {
      trip: ['title', 'destination', 'start_date', 'end_date', 'theme', 'is_public'],
      place: ['name', 'address', 'time_start', 'time_end', 'notes', 'display_order'],
      packing_item: ['item', 'category', 'is_checked'],
      story_item: ['type', 'content_url', 'caption'],
      trip_day: ['day_number', 'date'],
    };

    const fields = fieldsToCompare[resourceType] || [];

    for (const field of fields) {
      const localValue = localData[field];
      const serverValue = serverData[field];

      // Compare values (handle null/undefined as equal)
      if (localValue !== serverValue) {
        // Both null/undefined is not a difference
        if ((localValue == null && serverValue == null)) {
          continue;
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Create a conflict record for user resolution
   * 
   * @param resourceType - Type of resource
   * @param resourceId - ID of the resource
   * @param localData - Local version
   * @param serverData - Server version
   * @returns Conflict object
   */
  createConflict(
    resourceType: 'trip' | 'trip_day' | 'place' | 'story_item' | 'packing_item',
    resourceId: string,
    localData: any,
    serverData: any
  ): SyncConflict {
    // Generate resource name for display
    const resourceName = this.getResourceName(resourceType, localData, serverData);

    const conflict: SyncConflict = {
      id: `${resourceType}_${resourceId}_${Date.now()}`,
      resourceType,
      resourceId,
      resourceName,
      localData,
      serverData,
      localModifiedAt: localData.updated_at || localData.created_at,
      serverModifiedAt: serverData.updated_at || serverData.created_at,
    };

    // Store conflict
    this.conflicts.set(conflict.id, {
      conflict,
      resolution: 'pending',
    });

    // Notify listeners
    this.notifyListeners();

    return conflict;
  }

  /**
   * Get a human-readable name for the resource
   */
  private getResourceName(
    resourceType: string,
    localData: any,
    serverData: any
  ): string {
    const data = localData || serverData;

    switch (resourceType) {
      case 'trip':
        return data.title || 'Untitled Trip';
      case 'place':
        return data.name || 'Unnamed Place';
      case 'packing_item':
        return data.item || 'Packing Item';
      case 'story_item':
        return `Story ${data.type || 'Item'}`;
      case 'trip_day':
        return `Day ${data.day_number || ''}`;
      default:
        return resourceType;
    }
  }

  /**
   * Resolve a conflict with user's choice
   * 
   * @param conflictId - ID of the conflict
   * @param resolution - User's choice ('local' or 'server')
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server'
  ): Promise<void> {
    const record = this.conflicts.get(conflictId);
    if (!record) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    const { conflict } = record;

    // Update conflict record
    record.resolution = resolution;
    record.resolvedAt = new Date().toISOString();

    // Apply the resolution
    await this.applyResolution(conflict, resolution);

    // Remove from active conflicts
    this.conflicts.delete(conflictId);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Apply the conflict resolution
   */
  private async applyResolution(
    conflict: SyncConflict,
    resolution: 'local' | 'server'
  ): Promise<void> {
    const { resourceType, resourceId } = conflict;
    const dataToKeep = resolution === 'local' ? conflict.localData : conflict.serverData;

    // Update offline storage with chosen version
    switch (resourceType) {
      case 'trip':
        await offlineStorage.saveTrip({
          ...dataToKeep,
          _offline_modified: false,
          _last_synced: new Date().toISOString(),
        });
        break;

      case 'place':
        await offlineStorage.savePlace({
          ...dataToKeep,
          _offline_modified: false,
        });
        break;

      case 'packing_item':
        await offlineStorage.savePackingItem({
          ...dataToKeep,
          _offline_modified: false,
        });
        break;

      case 'story_item':
        await offlineStorage.saveStoryItem({
          ...dataToKeep,
          _offline_created: false,
        });
        break;

      case 'trip_day':
        await offlineStorage.saveTripDay({
          ...dataToKeep,
          _offline_modified: false,
        });
        break;
    }

    // If user chose local version, we need to push it to server
    if (resolution === 'local') {
      // Add to sync queue to push local changes
      await offlineStorage.addToSyncQueue(
        'UPDATE',
        resourceType,
        resourceId,
        dataToKeep
      );
    }
  }

  /**
   * Get all pending conflicts
   */
  getPendingConflicts(): SyncConflict[] {
    const pending: SyncConflict[] = [];
    
    for (const record of this.conflicts.values()) {
      if (record.resolution === 'pending') {
        pending.push(record.conflict);
      }
    }

    return pending;
  }

  /**
   * Check if there are any pending conflicts
   */
  hasPendingConflicts(): boolean {
    return this.getPendingConflicts().length > 0;
  }

  /**
   * Subscribe to conflict changes
   */
  subscribe(listener: (conflicts: SyncConflict[]) => void): () => void {
    this.conflictListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.conflictListeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of conflict changes
   */
  private notifyListeners(): void {
    const conflicts = this.getPendingConflicts();
    for (const listener of this.conflictListeners) {
      listener(conflicts);
    }
  }

  /**
   * Clear all conflicts (use with caution)
   */
  clearAllConflicts(): void {
    this.conflicts.clear();
    this.notifyListeners();
  }

  /**
   * Cancel a conflict (skip resolution)
   */
  cancelConflict(conflictId: string): void {
    this.conflicts.delete(conflictId);
    this.notifyListeners();
  }
}

// Export singleton instance
export const syncConflictService = new SyncConflictService();
export default syncConflictService;
