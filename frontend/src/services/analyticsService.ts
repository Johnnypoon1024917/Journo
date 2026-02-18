/**
 * Analytics Service
 * 
 * Mockable analytics service supporting multiple providers
 * Tracks events, errors, and page views throughout the app
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export type AnalyticsProvider = 'posthog' | 'ga4' | 'mock';

class AnalyticsService {
  private provider: AnalyticsProvider = 'mock';
  private queue: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Set analytics provider
   */
  setProvider(provider: AnalyticsProvider) {
    this.provider = provider;
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Track an event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    };

    // Add to queue for mock mode
    if (this.provider === 'mock') {
      this.queue.push(event);
      console.log('[Analytics]', eventName, properties);
      return;
    }

    // Send to provider
    this.sendToProvider(event);
  }

  /**
   * Track an error
   */
  trackError(errorName: string, properties?: Record<string, any>) {
    this.track('error', {
      error_name: errorName,
      ...properties,
    });
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, properties?: Record<string, any>) {
    this.track('page_view', {
      path,
      ...properties,
    });
  }

  /**
   * Track user action
   */
  trackAction(action: string, properties?: Record<string, any>) {
    this.track('user_action', {
      action,
      ...properties,
    });
  }

  /**
   * Get queued events (mock mode)
   */
  getQueue(): AnalyticsEvent[] {
    return [...this.queue];
  }

  /**
   * Clear event queue
   */
  clearQueue() {
    this.queue = [];
  }

  /**
   * Send event to provider
   */
  private sendToProvider(event: AnalyticsEvent) {
    switch (this.provider) {
      case 'posthog':
        this.sendToPostHog(event);
        break;
      case 'ga4':
        this.sendToGA4(event);
        break;
      default:
        console.warn('Unknown analytics provider:', this.provider);
    }
  }

  /**
   * Send to PostHog
   */
  private sendToPostHog(event: AnalyticsEvent) {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(event.name, event.properties);
    }
  }

  /**
   * Send to Google Analytics 4
   */
  private sendToGA4(event: AnalyticsEvent) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.name, event.properties);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

// Type declarations for global analytics
declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, any>) => void;
    };
    gtag?: (
      command: string,
      eventName: string,
      properties?: Record<string, any>
    ) => void;
  }
}
