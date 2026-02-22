/**
 * Community Analytics Service
 * 
 * Tracks user engagement metrics for the community feed feature.
 * Implements event batching to reduce network requests.
 * 
 * Validates Requirements 18.1, 18.2, 18.3, 18.4, 18.5
 */

import { analyticsService } from './analyticsService';

export interface CommunityAnalyticsEvent {
  type: 'post_view' | 'engagement_action' | 'community_join' | 'community_leave' | 'search';
  postId?: string;
  communityId?: string;
  actionType?: 'like' | 'unlike' | 'repost' | 'unrepost' | 'bookmark' | 'unbookmark' | 'reply';
  searchQuery?: string;
  resultCount?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * CommunityAnalyticsService class
 * Manages analytics tracking for community features with event batching
 */
export class CommunityAnalyticsService {
  private eventQueue: CommunityAnalyticsEvent[] = [];
  private batchInterval: number = 30000; // 30 seconds
  private batchTimer: NodeJS.Timeout | null = null;
  private viewedPosts: Set<string> = new Set();
  private viewTimers: Map<string, NodeJS.Timeout> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    // Start batch timer
    this.startBatchTimer();

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
      
      // Flush on visibility change (when user leaves tab)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flush();
        }
      });
    }
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Track post view
   * Validates Requirement 18.1: Track post views with Intersection Observer
   * @param postId - The post ID
   * @param metadata - Additional metadata (author, community, etc.)
   */
  trackPostView(postId: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled || this.viewedPosts.has(postId)) {
      return;
    }

    // Mark as viewed immediately to prevent duplicates
    this.viewedPosts.add(postId);

    // Track after 1 second of visibility
    const timer = setTimeout(() => {
      this.queueEvent({
        type: 'post_view',
        postId,
        timestamp: Date.now(),
        metadata,
      });
      
      this.viewTimers.delete(postId);
    }, 1000);

    this.viewTimers.set(postId, timer);
  }

  /**
   * Cancel post view tracking (if post leaves viewport before 1 second)
   * @param postId - The post ID
   */
  cancelPostView(postId: string): void {
    const timer = this.viewTimers.get(postId);
    if (timer) {
      clearTimeout(timer);
      this.viewTimers.delete(postId);
      this.viewedPosts.delete(postId);
    }
  }

  /**
   * Track engagement action
   * Validates Requirement 18.2: Track engagement actions with action type
   * @param actionType - The type of engagement action
   * @param postId - The post ID
   * @param metadata - Additional metadata
   */
  trackEngagementAction(
    actionType: 'like' | 'unlike' | 'repost' | 'unrepost' | 'bookmark' | 'unbookmark' | 'reply',
    postId: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    this.queueEvent({
      type: 'engagement_action',
      actionType,
      postId,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Track community join
   * Validates Requirement 18.3: Track community joins
   * @param communityId - The community ID
   * @param metadata - Additional metadata (community name, member count, etc.)
   */
  trackCommunityJoin(communityId: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.queueEvent({
      type: 'community_join',
      communityId,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Track community leave
   * @param communityId - The community ID
   * @param metadata - Additional metadata
   */
  trackCommunityLeave(communityId: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.queueEvent({
      type: 'community_leave',
      communityId,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Track search
   * Validates Requirement 18.4: Track searches with query and result count
   * @param searchQuery - The search query
   * @param resultCount - Number of results returned
   * @param metadata - Additional metadata (search type, filters, etc.)
   */
  trackSearch(searchQuery: string, resultCount: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.queueEvent({
      type: 'search',
      searchQuery,
      resultCount,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Queue an event for batching
   * Validates Requirement 18.5: Batch events and send every 30 seconds
   */
  private queueEvent(event: CommunityAnalyticsEvent): void {
    this.eventQueue.push(event);

    // If queue is large, flush immediately
    if (this.eventQueue.length >= 50) {
      this.flush();
    }
  }

  /**
   * Flush queued events to analytics service
   * Validates Requirement 18.5: Send batched events
   */
  flush(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    // Send batch to analytics service
    analyticsService.track('community_events_batch', {
      events: eventsToSend,
      count: eventsToSend.length,
      timestamp: Date.now(),
    });

    // Also send individual events for detailed tracking
    eventsToSend.forEach(event => {
      switch (event.type) {
        case 'post_view':
          analyticsService.track('community_post_view', {
            post_id: event.postId,
            ...event.metadata,
          });
          break;
        case 'engagement_action':
          analyticsService.track('community_engagement', {
            action_type: event.actionType,
            post_id: event.postId,
            ...event.metadata,
          });
          break;
        case 'community_join':
          analyticsService.track('community_join', {
            community_id: event.communityId,
            ...event.metadata,
          });
          break;
        case 'community_leave':
          analyticsService.track('community_leave', {
            community_id: event.communityId,
            ...event.metadata,
          });
          break;
        case 'search':
          analyticsService.track('community_search', {
            query: event.searchQuery,
            result_count: event.resultCount,
            ...event.metadata,
          });
          break;
      }
    });

    console.log(`[Community Analytics] Flushed ${eventsToSend.length} events`);
  }

  /**
   * Start batch timer
   * Validates Requirement 18.5: Send events every 30 seconds
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      this.flush();
    }, this.batchInterval);
  }

  /**
   * Stop batch timer
   */
  stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Set batch interval
   * @param intervalMs - Interval in milliseconds
   */
  setBatchInterval(intervalMs: number): void {
    this.batchInterval = intervalMs;
    this.startBatchTimer();
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Clear viewed posts cache
   * Useful for testing or when user logs out
   */
  clearViewedPosts(): void {
    this.viewedPosts.clear();
    
    // Clear all view timers
    this.viewTimers.forEach(timer => clearTimeout(timer));
    this.viewTimers.clear();
  }

  /**
   * Clear event queue
   */
  clearQueue(): void {
    this.eventQueue = [];
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    this.flush();
    this.stopBatchTimer();
    this.clearViewedPosts();
    this.clearQueue();
  }
}

// Export singleton instance
export const communityAnalyticsService = new CommunityAnalyticsService();
export default communityAnalyticsService;
