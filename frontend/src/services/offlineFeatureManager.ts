/**
 * Offline Feature Manager
 * 
 * Manages offline-capable feature detection and availability
 * Coordinates with health monitor and network status
 * 
 * Validates: Requirements 5.5, 9.3
 */

import { healthMonitor, FeatureConfig } from './healthMonitor';
import { networkErrorHandler } from './networkErrorHandler';

export interface OfflineCapability {
  featureName: string;
  isAvailable: boolean;
  requiresNetwork: boolean;
  offlineMode: 'full' | 'partial' | 'none';
  limitations: string[];
  fallbackBehavior?: string;
}

/**
 * Feature capability definitions
 */
const FEATURE_CAPABILITIES: Record<string, Omit<OfflineCapability, 'isAvailable'>> = {
  'trip-planning': {
    featureName: 'trip-planning',
    requiresNetwork: false,
    offlineMode: 'full',
    limitations: [
      'Changes will sync when online',
      'Cannot share trips while offline',
    ],
    fallbackBehavior: 'All trip planning features work offline with local storage',
  },
  'destination-suggestions': {
    featureName: 'destination-suggestions',
    requiresNetwork: true,
    offlineMode: 'partial',
    limitations: [
      'Only cached suggestions available',
      'Cannot search for new destinations',
      'Manual entry available as fallback',
    ],
    fallbackBehavior: 'Show cached suggestions or allow manual destination entry',
  },
  'maps': {
    featureName: 'maps',
    requiresNetwork: false,
    offlineMode: 'partial',
    limitations: [
      'Only cached map tiles available',
      'Cannot load new areas',
      'Route calculation may be limited',
    ],
    fallbackBehavior: 'Show cached map tiles and basic route information',
  },
  'weather-data': {
    featureName: 'weather-data',
    requiresNetwork: true,
    offlineMode: 'partial',
    limitations: [
      'Only cached weather data available',
      'Data may be outdated',
      'Cannot fetch current conditions',
    ],
    fallbackBehavior: 'Show last cached weather forecast with timestamp',
  },
  'authentication': {
    featureName: 'authentication',
    requiresNetwork: true,
    offlineMode: 'none',
    limitations: [
      'Cannot log in or out while offline',
      'Cannot change password',
      'Session must be established before going offline',
    ],
    fallbackBehavior: 'Maintain existing session, disable auth-related actions',
  },
  'packing-lists': {
    featureName: 'packing-lists',
    requiresNetwork: false,
    offlineMode: 'full',
    limitations: [
      'Changes will sync when online',
    ],
    fallbackBehavior: 'Full packing list functionality with local storage',
  },
  'budget-tracking': {
    featureName: 'budget-tracking',
    requiresNetwork: false,
    offlineMode: 'full',
    limitations: [
      'Changes will sync when online',
      'Currency conversion may use cached rates',
    ],
    fallbackBehavior: 'Full budget tracking with local storage',
  },
  'photo-uploads': {
    featureName: 'photo-uploads',
    requiresNetwork: true,
    offlineMode: 'partial',
    limitations: [
      'Photos queued for upload when online',
      'Large files may take time to sync',
    ],
    fallbackBehavior: 'Queue photos for background upload when connection restored',
  },
  'realtime-collaboration': {
    featureName: 'realtime-collaboration',
    requiresNetwork: true,
    offlineMode: 'none',
    limitations: [
      'Cannot see other users\' changes',
      'Cannot collaborate in real-time',
      'Changes will sync when online',
    ],
    fallbackBehavior: 'Disable real-time features, enable local editing',
  },
};

/**
 * Offline Feature Manager Service
 */
class OfflineFeatureManager {
  private static instance: OfflineFeatureManager;
  private capabilities: Map<string, OfflineCapability> = new Map();
  private listeners: Set<(capabilities: Map<string, OfflineCapability>) => void> = new Set();

  private constructor() {
    this.initializeCapabilities();
    this.subscribeToChanges();
  }

  public static getInstance(): OfflineFeatureManager {
    if (!OfflineFeatureManager.instance) {
      OfflineFeatureManager.instance = new OfflineFeatureManager();
    }
    return OfflineFeatureManager.instance;
  }

  /**
   * Initialize feature capabilities
   */
  private initializeCapabilities(): void {
    Object.entries(FEATURE_CAPABILITIES).forEach(([key, capability]) => {
      this.capabilities.set(key, {
        ...capability,
        isAvailable: this.determineAvailability(capability),
      });
    });
  }

  /**
   * Subscribe to health monitor and network changes
   */
  private subscribeToChanges(): void {
    // Subscribe to health monitor changes
    healthMonitor.subscribe(() => {
      this.updateCapabilities();
    });

    // Subscribe to network changes
    networkErrorHandler.subscribe(() => {
      this.updateCapabilities();
    });
  }

  /**
   * Determine if a feature is available based on current conditions
   */
  private determineAvailability(
    capability: Omit<OfflineCapability, 'isAvailable'>
  ): boolean {
    const isOnline = networkErrorHandler.isOnline();
    const isFeatureEnabled = healthMonitor.isFeatureEnabled(capability.featureName);

    // If feature requires network and we're offline, check offline mode
    if (capability.requiresNetwork && !isOnline) {
      return capability.offlineMode !== 'none';
    }

    // Otherwise, use health monitor's feature status
    return isFeatureEnabled;
  }

  /**
   * Update all capabilities based on current conditions
   */
  private updateCapabilities(): void {
    let hasChanges = false;

    this.capabilities.forEach((capability, key) => {
      const newAvailability = this.determineAvailability(capability);
      
      if (capability.isAvailable !== newAvailability) {
        this.capabilities.set(key, {
          ...capability,
          isAvailable: newAvailability,
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.notifyListeners();
    }
  }

  /**
   * Get capability information for a specific feature
   */
  public getFeatureCapability(featureName: string): OfflineCapability | undefined {
    return this.capabilities.get(featureName);
  }

  /**
   * Get all feature capabilities
   */
  public getAllCapabilities(): Map<string, OfflineCapability> {
    return new Map(this.capabilities);
  }

  /**
   * Check if a feature is available
   */
  public isFeatureAvailable(featureName: string): boolean {
    const capability = this.capabilities.get(featureName);
    return capability?.isAvailable ?? false;
  }

  /**
   * Get offline mode for a feature
   */
  public getOfflineMode(featureName: string): 'full' | 'partial' | 'none' {
    const capability = this.capabilities.get(featureName);
    return capability?.offlineMode ?? 'none';
  }

  /**
   * Get limitations for a feature in current mode
   */
  public getFeatureLimitations(featureName: string): string[] {
    const capability = this.capabilities.get(featureName);
    const isOnline = networkErrorHandler.isOnline();

    if (!capability) return [];

    // If online and feature doesn't require network, no limitations
    if (isOnline && !capability.requiresNetwork) {
      return [];
    }

    // If online but feature requires network and is available, no limitations
    if (isOnline && capability.requiresNetwork && capability.isAvailable) {
      return [];
    }

    // Return limitations for offline/degraded mode
    return capability.limitations;
  }

  /**
   * Get fallback behavior for a feature
   */
  public getFallbackBehavior(featureName: string): string | undefined {
    const capability = this.capabilities.get(featureName);
    return capability?.fallbackBehavior;
  }

  /**
   * Get features by offline mode
   */
  public getFeaturesByOfflineMode(
    mode: 'full' | 'partial' | 'none'
  ): OfflineCapability[] {
    return Array.from(this.capabilities.values()).filter(
      (cap) => cap.offlineMode === mode
    );
  }

  /**
   * Get available features (currently usable)
   */
  public getAvailableFeatures(): OfflineCapability[] {
    return Array.from(this.capabilities.values()).filter((cap) => cap.isAvailable);
  }

  /**
   * Get unavailable features (currently not usable)
   */
  public getUnavailableFeatures(): OfflineCapability[] {
    return Array.from(this.capabilities.values()).filter((cap) => !cap.isAvailable);
  }

  /**
   * Subscribe to capability changes
   */
  public subscribe(
    listener: (capabilities: Map<string, OfflineCapability>) => void
  ): () => void {
    this.listeners.add(listener);

    // Immediately call with current capabilities
    listener(this.getAllCapabilities());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify listeners of capability changes
   */
  private notifyListeners(): void {
    const capabilities = this.getAllCapabilities();
    
    this.listeners.forEach((listener) => {
      try {
        listener(capabilities);
      } catch (error) {
        console.error('Error in offline feature manager listener:', error);
      }
    });
  }

  /**
   * Get summary of offline capabilities
   */
  public getOfflineCapabilitySummary(): {
    totalFeatures: number;
    availableFeatures: number;
    fullOfflineSupport: number;
    partialOfflineSupport: number;
    noOfflineSupport: number;
  } {
    const all = Array.from(this.capabilities.values());
    
    return {
      totalFeatures: all.length,
      availableFeatures: all.filter((c) => c.isAvailable).length,
      fullOfflineSupport: all.filter((c) => c.offlineMode === 'full').length,
      partialOfflineSupport: all.filter((c) => c.offlineMode === 'partial').length,
      noOfflineSupport: all.filter((c) => c.offlineMode === 'none').length,
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.listeners.clear();
  }
}

// Export singleton instance
export const offlineFeatureManager = OfflineFeatureManager.getInstance();

// Export class for testing
export { OfflineFeatureManager };
