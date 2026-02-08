/**
 * useHealthMonitor Hook
 * 
 * React hook for accessing health monitoring functionality
 * Provides real-time service health status and feature availability
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import { useState, useEffect, useCallback } from 'react';
import {
  healthMonitor,
  SystemHealth,
  ServiceChange,
  FeatureConfig,
} from '../services/healthMonitor';

interface UseHealthMonitorReturn {
  health: SystemHealth;
  isFeatureEnabled: (featureName: string) => boolean;
  features: Map<string, FeatureConfig>;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

/**
 * Hook for monitoring system health
 */
export function useHealthMonitor(): UseHealthMonitorReturn {
  const [health, setHealth] = useState<SystemHealth>(
    healthMonitor.getOverallHealth()
  );
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Subscribe to health updates
    const unsubscribe = healthMonitor.subscribe((newHealth) => {
      setHealth(newHealth);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const startMonitoring = useCallback(() => {
    healthMonitor.monitorServices();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    healthMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    return healthMonitor.isFeatureEnabled(featureName);
  }, []);

  const features = healthMonitor.getFeatures();

  return {
    health,
    isFeatureEnabled,
    features,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
}

/**
 * Hook for subscribing to service change notifications
 */
export function useServiceChanges(
  onServiceChange: (changes: ServiceChange[]) => void
): void {
  useEffect(() => {
    const unsubscribe = healthMonitor.subscribeToChanges(onServiceChange);

    return () => {
      unsubscribe();
    };
  }, [onServiceChange]);
}

/**
 * Hook for checking if a specific feature is enabled
 */
export function useFeatureEnabled(featureName: string): boolean {
  const [enabled, setEnabled] = useState(
    healthMonitor.isFeatureEnabled(featureName)
  );

  useEffect(() => {
    // Subscribe to health updates to track feature status
    const unsubscribe = healthMonitor.subscribe(() => {
      const isEnabled = healthMonitor.isFeatureEnabled(featureName);
      setEnabled(isEnabled);
    });

    return () => {
      unsubscribe();
    };
  }, [featureName]);

  return enabled;
}
