import { FeatureFlags } from '../stores/featureFlagStore';

interface FeatureFlagSnapshot {
  timestamp: string;
  flags: FeatureFlags;
  reason?: string;
}

const SNAPSHOT_KEY = 'feature-flag-snapshots';
const MAX_SNAPSHOTS = 10;

export class FeatureFlagService {
  /**
   * Create a snapshot of current feature flags
   */
  static createSnapshot(flags: FeatureFlags, reason?: string): void {
    const snapshots = this.getSnapshots();
    
    const snapshot: FeatureFlagSnapshot = {
      timestamp: new Date().toISOString(),
      flags: { ...flags },
      reason,
    };
    
    // Add new snapshot and keep only the last MAX_SNAPSHOTS
    snapshots.unshift(snapshot);
    const trimmedSnapshots = snapshots.slice(0, MAX_SNAPSHOTS);
    
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(trimmedSnapshots));
    
    if (import.meta.env.DEV) {
      console.log('[Feature Flag] Snapshot created:', snapshot);
    }
  }

  /**
   * Get all snapshots
   */
  static getSnapshots(): FeatureFlagSnapshot[] {
    try {
      const data = localStorage.getItem(SNAPSHOT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[Feature Flag] Failed to load snapshots:', error);
      return [];
    }
  }

  /**
   * Rollback to a previous snapshot
   */
  static rollback(snapshotIndex: number): FeatureFlags | null {
    const snapshots = this.getSnapshots();
    
    if (snapshotIndex < 0 || snapshotIndex >= snapshots.length) {
      console.error('[Feature Flag] Invalid snapshot index:', snapshotIndex);
      return null;
    }
    
    const snapshot = snapshots[snapshotIndex];
    
    if (import.meta.env.DEV) {
      console.log('[Feature Flag] Rolling back to snapshot:', snapshot);
    }
    
    return snapshot.flags;
  }

  /**
   * Rollback to the most recent snapshot
   */
  static rollbackToLatest(): FeatureFlags | null {
    return this.rollback(0);
  }

  /**
   * Clear all snapshots
   */
  static clearSnapshots(): void {
    localStorage.removeItem(SNAPSHOT_KEY);
    
    if (import.meta.env.DEV) {
      console.log('[Feature Flag] All snapshots cleared');
    }
  }

  /**
   * Check if rollback is available
   */
  static canRollback(): boolean {
    return this.getSnapshots().length > 0;
  }

  /**
   * Emergency rollback - disable all experimental features
   */
  static emergencyRollback(): FeatureFlags {
    const safeFlags: FeatureFlags = {
      newTripPlannerUI: false,
    };
    
    if (import.meta.env.DEV) {
      console.log('[Feature Flag] Emergency rollback executed');
    }
    
    // Track emergency rollback
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'feature_flag_emergency_rollback', {
        timestamp: new Date().toISOString(),
      });
    }
    
    return safeFlags;
  }

  /**
   * Validate feature flags
   */
  static validateFlags(flags: FeatureFlags): boolean {
    // Ensure all required flags are present
    const requiredFlags: (keyof FeatureFlags)[] = ['newTripPlannerUI'];
    
    for (const flag of requiredFlags) {
      if (typeof flags[flag] !== 'boolean') {
        console.error(`[Feature Flag] Invalid flag value for ${flag}:`, flags[flag]);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get feature flag analytics data
   */
  static getAnalytics(): {
    snapshots: number;
    oldestSnapshot: string | null;
    newestSnapshot: string | null;
  } {
    const snapshots = this.getSnapshots();
    
    return {
      snapshots: snapshots.length,
      oldestSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : null,
      newestSnapshot: snapshots.length > 0 ? snapshots[0].timestamp : null,
    };
  }
}

export default FeatureFlagService;
