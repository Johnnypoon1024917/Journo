/**
 * useProgressiveEnhancement Hook
 * 
 * Provides progressive enhancement capabilities for slow connections
 * Automatically adjusts feature behavior based on connection quality
 * 
 * Validates: Requirements 9.3, 10.3
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

export interface ProgressiveEnhancementConfig {
  // Image loading strategy
  imageQuality: 'high' | 'medium' | 'low' | 'placeholder';
  lazyLoadImages: boolean;
  
  // Animation settings
  enableAnimations: boolean;
  reducedMotion: boolean;
  
  // Data loading
  prefetchData: boolean;
  batchRequests: boolean;
  
  // Feature availability
  enableRealtime: boolean;
  enableAutoRefresh: boolean;
  
  // Connection quality
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

const DEFAULT_CONFIG: ProgressiveEnhancementConfig = {
  imageQuality: 'high',
  lazyLoadImages: true,
  enableAnimations: true,
  reducedMotion: false,
  prefetchData: true,
  batchRequests: false,
  enableRealtime: true,
  enableAutoRefresh: true,
  connectionQuality: 'excellent',
};

/**
 * Hook for progressive enhancement based on connection quality
 */
export function useProgressiveEnhancement(): ProgressiveEnhancementConfig {
  const { isOnline, status, effectiveType, downlink, rtt } = useNetworkStatus();
  const [config, setConfig] = useState<ProgressiveEnhancementConfig>(DEFAULT_CONFIG);

  // Check for user's motion preferences
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Determine connection quality based on network metrics
  const determineConnectionQuality = useCallback((): ProgressiveEnhancementConfig['connectionQuality'] => {
    if (!isOnline) return 'offline';
    
    // Use effective connection type if available
    if (effectiveType) {
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'poor';
        case '3g':
          return 'fair';
        case '4g':
          // Check if it's really excellent 4G
          if (rtt && rtt < 100 && downlink && downlink > 5) {
            return 'excellent';
          }
          return 'good';
        default:
          return 'excellent';
      }
    }
    
    // Fallback to RTT and downlink if available
    if (rtt !== undefined || downlink !== undefined) {
      if (rtt && rtt > 2000) return 'poor';
      if (rtt && rtt > 1000) return 'fair';
      if (downlink && downlink < 0.5) return 'poor';
      if (downlink && downlink < 1.5) return 'fair';
      if (downlink && downlink < 5) return 'good';
      if (rtt && rtt < 100 && downlink && downlink > 5) return 'excellent';
      return 'good';
    }
    
    // Use status as fallback
    if (status === 'slow') return 'fair';
    return 'good';
  }, [isOnline, status, effectiveType, downlink, rtt]);

  // Update configuration based on connection quality
  useEffect(() => {
    const quality = determineConnectionQuality();
    const reducedMotion = prefersReducedMotion();

    let newConfig: ProgressiveEnhancementConfig;

    switch (quality) {
      case 'offline':
        newConfig = {
          imageQuality: 'placeholder',
          lazyLoadImages: true,
          enableAnimations: false,
          reducedMotion: true,
          prefetchData: false,
          batchRequests: true,
          enableRealtime: false,
          enableAutoRefresh: false,
          connectionQuality: quality,
        };
        break;

      case 'poor':
        newConfig = {
          imageQuality: 'low',
          lazyLoadImages: true,
          enableAnimations: false,
          reducedMotion: true,
          prefetchData: false,
          batchRequests: true,
          enableRealtime: false,
          enableAutoRefresh: false,
          connectionQuality: quality,
        };
        break;

      case 'fair':
        newConfig = {
          imageQuality: 'medium',
          lazyLoadImages: true,
          enableAnimations: !reducedMotion,
          reducedMotion,
          prefetchData: false,
          batchRequests: true,
          enableRealtime: false,
          enableAutoRefresh: false,
          connectionQuality: quality,
        };
        break;

      case 'good':
        newConfig = {
          imageQuality: 'high',
          lazyLoadImages: true,
          enableAnimations: !reducedMotion,
          reducedMotion,
          prefetchData: true,
          batchRequests: false,
          enableRealtime: true,
          enableAutoRefresh: true,
          connectionQuality: quality,
        };
        break;

      case 'excellent':
      default:
        newConfig = {
          imageQuality: 'high',
          lazyLoadImages: false,
          enableAnimations: !reducedMotion,
          reducedMotion,
          prefetchData: true,
          batchRequests: false,
          enableRealtime: true,
          enableAutoRefresh: true,
          connectionQuality: quality,
        };
        break;
    }

    setConfig(newConfig);
  }, [isOnline, status, effectiveType, downlink, rtt, determineConnectionQuality, prefersReducedMotion]);

  return config;
}

/**
 * Hook for getting optimized image URL based on connection quality
 */
export function useOptimizedImage(
  imageUrl: string | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string | undefined {
  const { imageQuality } = useProgressiveEnhancement();

  if (!imageUrl) return undefined;

  // Return placeholder for offline/very slow connections
  if (imageQuality === 'placeholder') {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${options?.width || 400} ${options?.height || 300}'%3E%3Crect fill='%23e5e7eb' width='100%25' height='100%25'/%3E%3C/svg%3E`;
  }

  // If URL already has query params, append to them
  const separator = imageUrl.includes('?') ? '&' : '?';
  
  // Build optimization params based on quality
  const params = new URLSearchParams();
  
  if (options?.width) params.append('w', options.width.toString());
  if (options?.height) params.append('h', options.height.toString());
  
  switch (imageQuality) {
    case 'low':
      params.append('q', '30');
      params.append('fm', 'webp');
      break;
    case 'medium':
      params.append('q', '60');
      params.append('fm', 'webp');
      break;
    case 'high':
    default:
      if (options?.quality) {
        params.append('q', options.quality.toString());
      }
      break;
  }

  const queryString = params.toString();
  return queryString ? `${imageUrl}${separator}${queryString}` : imageUrl;
}

/**
 * Hook for determining if a feature should be enabled based on connection
 */
export function useFeatureGate(featureName: string): boolean {
  const config = useProgressiveEnhancement();

  const featureRequirements: Record<string, keyof ProgressiveEnhancementConfig> = {
    'realtime-updates': 'enableRealtime',
    'auto-refresh': 'enableAutoRefresh',
    'animations': 'enableAnimations',
    'prefetch': 'prefetchData',
    'high-quality-images': 'imageQuality',
  };

  const requirement = featureRequirements[featureName];
  if (!requirement) return true; // Unknown features are enabled by default

  const value = config[requirement];
  
  // Handle boolean values
  if (typeof value === 'boolean') return value;
  
  // Handle imageQuality
  if (requirement === 'imageQuality') {
    return value === 'high';
  }

  return true;
}

/**
 * Hook for getting recommended batch size based on connection
 */
export function useBatchSize(defaultSize: number = 20): number {
  const { connectionQuality } = useProgressiveEnhancement();

  switch (connectionQuality) {
    case 'offline':
      return 0; // Don't fetch when offline
    case 'poor':
      return Math.max(5, Math.floor(defaultSize / 4));
    case 'fair':
      return Math.max(10, Math.floor(defaultSize / 2));
    case 'good':
      return defaultSize;
    case 'excellent':
      return defaultSize * 2;
    default:
      return defaultSize;
  }
}

/**
 * Hook for getting recommended polling interval based on connection
 */
export function usePollingInterval(defaultInterval: number = 30000): number | null {
  const { enableAutoRefresh, connectionQuality } = useProgressiveEnhancement();

  if (!enableAutoRefresh) return null;

  switch (connectionQuality) {
    case 'offline':
      return null; // Don't poll when offline
    case 'poor':
      return defaultInterval * 4; // Poll 4x less frequently
    case 'fair':
      return defaultInterval * 2; // Poll 2x less frequently
    case 'good':
      return defaultInterval;
    case 'excellent':
      return Math.max(10000, defaultInterval / 2); // Poll 2x more frequently, min 10s
    default:
      return defaultInterval;
  }
}
