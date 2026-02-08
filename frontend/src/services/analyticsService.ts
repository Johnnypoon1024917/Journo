import posthog from 'posthog-js';

export interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  trip_id?: string;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private isOptedOut: boolean = false;
  private batchSize = 10;
  private batchTimeout = 30000; // 30 seconds
  private timeoutId: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor() {
    this.loadOptOutPreference();
    this.initializePostHog();
  }

  private initializePostHog() {
    if (this.initialized || this.isOptedOut) return;

    // Only initialize PostHog if we have a valid key
    const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
    if (!posthogKey || posthogKey === 'your_posthog_project_key_here') {
      console.warn('PostHog key not configured, analytics disabled');
      return;
    }

    // Initialize PostHog with privacy-first settings
    posthog.init(posthogKey, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      // Privacy-first configuration
      disable_session_recording: true,
      disable_cookie: true,
      disable_persistence: false,
      respect_dnt: true,
      property_blacklist: ['$ip'], // Don't collect IP addresses
      sanitize_properties: (properties) => {
        // Remove any potentially sensitive data
        const sanitized = { ...properties };
        delete sanitized.$ip;
        delete sanitized.$current_url; // Remove full URLs for privacy
        return sanitized;
      },
      loaded: () => {
        this.initialized = true;
      }
    });
  }

  private loadOptOutPreference() {
    const optOut = localStorage.getItem('analytics_opt_out');
    this.isOptedOut = optOut === 'true';
  }

  public setOptOut(optOut: boolean) {
    this.isOptedOut = optOut;
    localStorage.setItem('analytics_opt_out', optOut.toString());
    
    if (optOut) {
      // Clear queue and disable PostHog
      this.eventQueue = [];
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      posthog.opt_out_capturing();
    } else {
      // Re-enable PostHog
      posthog.opt_in_capturing();
      this.initializePostHog();
    }
  }

  public isOptedOutFromAnalytics(): boolean {
    return this.isOptedOut;
  }

  public track(eventName: string, properties?: Record<string, any>, userId?: string, tripId?: string) {
    if (this.isOptedOut) return;

    const event: AnalyticsEvent = {
      event_name: eventName,
      user_id: userId,
      trip_id: tripId,
      metadata: properties
    };

    // Add to queue
    this.eventQueue.push(event);

    // Track with PostHog (for real-time analytics)
    if (this.initialized) {
      posthog.capture(eventName, {
        ...properties,
        trip_id: tripId,
        // Don't include user_id in PostHog for privacy
      });
    }

    // Check if we should send batch
    if (this.eventQueue.length >= this.batchSize) {
      this.sendBatch();
    } else if (!this.timeoutId) {
      // Set timeout for batch sending
      this.timeoutId = setTimeout(() => {
        this.sendBatch();
      }, this.batchTimeout);
    }
  }

  private async sendBatch() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    try {
      // Use proper API service with authentication
      const { apiRequest } = await import('./api');
      
      await apiRequest('/analytics/events', {
        method: 'POST',
        token: localStorage.getItem('accessToken') || undefined,
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      // Re-queue events for retry (optional)
      // this.eventQueue.unshift(...events);
    }
  }

  // Convenience methods for common events
  public trackTripCreated(tripId: string, userId?: string, metadata?: Record<string, any>) {
    this.track('trip_created', metadata, userId, tripId);
  }

  public trackTripShared(tripId: string, userId?: string, shareMethod?: string) {
    this.track('trip_shared', { share_method: shareMethod }, userId, tripId);
  }

  public trackPlaceAdded(tripId: string, userId?: string, placeType?: string) {
    this.track('place_added', { place_type: placeType }, userId, tripId);
  }

  public trackPhotoUploaded(tripId: string, userId?: string, source?: string) {
    this.track('photo_uploaded', { source }, userId, tripId);
  }

  public trackCommunityPosted(tripId: string, userId?: string) {
    this.track('community_posted', {}, userId, tripId);
  }

  public trackOfflineSyncStarted(userId?: string) {
    this.track('offline_sync_started', {}, userId);
  }

  public trackOfflineSyncCompleted(userId?: string, syncCount?: number) {
    this.track('offline_sync_completed', { sync_count: syncCount }, userId);
  }

  public trackBudgetUpdated(tripId: string, userId?: string, totalBudget?: number, currency?: string) {
    this.track('budget_updated', { total_budget: totalBudget, currency }, userId, tripId);
  }

  public trackPackingItemChecked(tripId: string, userId?: string, category?: string) {
    this.track('packing_item_checked', { category }, userId, tripId);
  }

  public trackPageView(page: string, userId?: string) {
    this.track('page_view', { page }, userId);
  }

  public trackUserSignup(userId: string) {
    this.track('user_signup', {}, userId);
  }

  public trackUserLogin(userId: string) {
    this.track('user_login', {}, userId);
  }

  // Force send any remaining events (useful for page unload)
  public flush() {
    if (this.eventQueue.length > 0) {
      this.sendBatch();
    }
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

// Flush events before page unload
window.addEventListener('beforeunload', () => {
  analyticsService.flush();
});

export default analyticsService;