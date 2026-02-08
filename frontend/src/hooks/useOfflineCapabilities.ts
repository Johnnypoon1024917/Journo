/**
 * useOfflineCapabilities Hook
 * 
 * React hook for accessing offline feature capabilities
 * Provides real-time updates on feature availability and limitations
 * 
 * Validates: Requirements 5.5
 */

import { useState, useEffect } from 'react';
import {
  offlineFeatureManager,
  OfflineCapability,
} from '../services/offlineFeatureManager';

/**
 * Hook for accessing all offline capabilities
 */
export function useOfflineCapabilities() {
  const [capabilities, setCapabilities] = useState<Map<string, OfflineCapability>>(
    offlineFeatureManager.getAllCapabilities()
  );

  useEffect(() => {
    const unsubscribe = offlineFeatureManager.subscribe((newCapabilities) => {
      setCapabilities(newCapabilities);
    });

    return unsubscribe;
  }, []);

  return {
    capabilities,
    availableFeatures: Array.from(capabilities.values()).filter((c) => c.isAvailable),
    unavailableFeatures: Array.from(capabilities.values()).filter(
      (c) => !c.isAvailable
    ),
    summary: offlineFeatureManager.getOfflineCapabilitySummary(),
  };
}

/**
 * Hook for checking if a specific feature is available
 */
export function useFeatureAvailable(featureName: string): boolean {
  const [isAvailable, setIsAvailable] = useState(
    offlineFeatureManager.isFeatureAvailable(featureName)
  );

  useEffect(() => {
    const unsubscribe = offlineFeatureManager.subscribe(() => {
      setIsAvailable(offlineFeatureManager.isFeatureAvailable(featureName));
    });

    return unsubscribe;
  }, [featureName]);

  return isAvailable;
}

/**
 * Hook for getting feature capability details
 */
export function useFeatureCapability(
  featureName: string
): OfflineCapability | undefined {
  const [capability, setCapability] = useState<OfflineCapability | undefined>(
    offlineFeatureManager.getFeatureCapability(featureName)
  );

  useEffect(() => {
    const unsubscribe = offlineFeatureManager.subscribe(() => {
      setCapability(offlineFeatureManager.getFeatureCapability(featureName));
    });

    return unsubscribe;
  }, [featureName]);

  return capability;
}

/**
 * Hook for getting feature limitations
 */
export function useFeatureLimitations(featureName: string): string[] {
  const [limitations, setLimitations] = useState<string[]>(
    offlineFeatureManager.getFeatureLimitations(featureName)
  );

  useEffect(() => {
    const unsubscribe = offlineFeatureManager.subscribe(() => {
      setLimitations(offlineFeatureManager.getFeatureLimitations(featureName));
    });

    return unsubscribe;
  }, [featureName]);

  return limitations;
}
