import { useEffect } from 'react';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { analyticsService } from '../services/analyticsService';

export function useAnalytics() {
  const { user } = useEnhancedAuthStore();

  // Track page views
  const trackPageView = (page: string) => {
    analyticsService.trackPageView(page, user?.id);
  };

  // Track user events
  const trackEvent = (eventName: string, properties?: Record<string, any>, tripId?: string) => {
    analyticsService.track(eventName, properties, user?.id, tripId);
  };

  // Convenience methods
  const trackTripCreated = (tripId: string, metadata?: Record<string, any>) => {
    analyticsService.trackTripCreated(tripId, user?.id, metadata);
  };

  const trackTripShared = (tripId: string, shareMethod?: string) => {
    analyticsService.trackTripShared(tripId, user?.id, shareMethod);
  };

  const trackPlaceAdded = (tripId: string, placeType?: string) => {
    analyticsService.trackPlaceAdded(tripId, user?.id, placeType);
  };

  const trackPhotoUploaded = (tripId: string, source?: string) => {
    analyticsService.trackPhotoUploaded(tripId, user?.id, source);
  };

  const trackCommunityPosted = (tripId: string) => {
    analyticsService.trackCommunityPosted(tripId, user?.id);
  };

  const trackOfflineSyncStarted = () => {
    analyticsService.trackOfflineSyncStarted(user?.id);
  };

  const trackOfflineSyncCompleted = (syncCount?: number) => {
    analyticsService.trackOfflineSyncCompleted(user?.id, syncCount);
  };

  const trackBudgetUpdated = (tripId: string, totalBudget?: number, currency?: string) => {
    analyticsService.trackBudgetUpdated(tripId, user?.id, totalBudget, currency);
  };

  const trackPackingItemChecked = (tripId: string, category?: string) => {
    analyticsService.trackPackingItemChecked(tripId, user?.id, category);
  };

  const trackUserSignup = () => {
    if (user?.id) {
      analyticsService.trackUserSignup(user.id);
    }
  };

  const trackUserLogin = () => {
    if (user?.id) {
      analyticsService.trackUserLogin(user.id);
    }
  };

  return {
    trackPageView,
    trackEvent,
    trackTripCreated,
    trackTripShared,
    trackPlaceAdded,
    trackPhotoUploaded,
    trackCommunityPosted,
    trackOfflineSyncStarted,
    trackOfflineSyncCompleted,
    trackBudgetUpdated,
    trackPackingItemChecked,
    trackUserSignup,
    trackUserLogin,
  };
}

// Hook for tracking page views automatically
export function usePageTracking(pageName: string) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName);
  }, [pageName, trackPageView]);
}