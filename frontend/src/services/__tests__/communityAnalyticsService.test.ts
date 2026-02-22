/**
 * Unit tests for CommunityAnalyticsService
 * 
 * Tests analytics tracking and event batching
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CommunityAnalyticsService } from '../communityAnalyticsService';
import { analyticsService } from '../analyticsService';

// Mock analyticsService
vi.mock('../analyticsService', () => ({
  analyticsService: {
    track: vi.fn(),
  },
}));

describe('CommunityAnalyticsService', () => {
  let service: CommunityAnalyticsService;

  beforeEach(() => {
    service = new CommunityAnalyticsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('trackPostView', () => {
    it('should track post view after 1 second', async () => {
      vi.useFakeTimers();
      
      service.trackPostView('post-123', { author: 'John Doe' });
      
      // Should not track immediately
      expect(service.getQueueSize()).toBe(0);
      
      // Fast-forward 1 second
      vi.advanceTimersByTime(1000);
      
      // Should be queued now
      expect(service.getQueueSize()).toBe(1);
      
      vi.useRealTimers();
    });

    it('should not track same post twice', async () => {
      vi.useFakeTimers();
      
      service.trackPostView('post-123');
      service.trackPostView('post-123'); // Duplicate
      
      vi.advanceTimersByTime(1000);
      
      // Should only queue once
      expect(service.getQueueSize()).toBe(1);
      
      vi.useRealTimers();
    });

    it('should track multiple different posts', async () => {
      vi.useFakeTimers();
      
      service.trackPostView('post-1');
      service.trackPostView('post-2');
      service.trackPostView('post-3');
      
      vi.advanceTimersByTime(1000);
      
      expect(service.getQueueSize()).toBe(3);
      
      vi.useRealTimers();
    });
  });

  describe('cancelPostView', () => {
    it('should cancel post view tracking', async () => {
      vi.useFakeTimers();
      
      service.trackPostView('post-123');
      service.cancelPostView('post-123');
      
      vi.advanceTimersByTime(1000);
      
      // Should not be queued
      expect(service.getQueueSize()).toBe(0);
      
      vi.useRealTimers();
    });

    it('should allow tracking same post again after cancel', async () => {
      vi.useFakeTimers();
      
      service.trackPostView('post-123');
      service.cancelPostView('post-123');
      service.trackPostView('post-123');
      
      vi.advanceTimersByTime(1000);
      
      expect(service.getQueueSize()).toBe(1);
      
      vi.useRealTimers();
    });
  });

  describe('trackEngagementAction', () => {
    it('should track like action', () => {
      service.trackEngagementAction('like', 'post-123');
      
      expect(service.getQueueSize()).toBe(1);
    });

    it('should track unlike action', () => {
      service.trackEngagementAction('unlike', 'post-456');
      
      expect(service.getQueueSize()).toBe(1);
    });

    it('should track repost action', () => {
      service.trackEngagementAction('repost', 'post-789');
      
      expect(service.getQueueSize()).toBe(1);
    });

    it('should track reply action', () => {
      service.trackEngagementAction('reply', 'post-999', { replyId: 'reply-1' });
      
      expect(service.getQueueSize()).toBe(1);
    });

    it('should track multiple engagement actions', () => {
      service.trackEngagementAction('like', 'post-1');
      service.trackEngagementAction('repost', 'post-2');
      service.trackEngagementAction('bookmark', 'post-3');
      
      expect(service.getQueueSize()).toBe(3);
    });
  });

  describe('trackCommunityJoin', () => {
    it('should track community join', () => {
      service.trackCommunityJoin('community-123', { name: 'Travel Tips' });
      
      expect(service.getQueueSize()).toBe(1);
    });

    it('should track multiple community joins', () => {
      service.trackCommunityJoin('community-1');
      service.trackCommunityJoin('community-2');
      
      expect(service.getQueueSize()).toBe(2);
    });
  });

  describe('trackCommunityLeave', () => {
    it('should track community leave', () => {
      service.trackCommunityLeave('community-456');
      
      expect(service.getQueueSize()).toBe(1);
    });
  });

  describe('trackSearch', () => {
    it('should track search with query and result count', () => {
      service.trackSearch('tokyo travel', 15, { searchType: 'posts' });
      
      expect(service.getQueueSize()).toBe(1);
    });

    it('should track search with zero results', () => {
      service.trackSearch('nonexistent', 0);
      
      expect(service.getQueueSize()).toBe(1);
    });
  });

  describe('flush', () => {
    it('should flush queued events', () => {
      service.trackEngagementAction('like', 'post-1');
      service.trackEngagementAction('repost', 'post-2');
      
      service.flush();
      
      expect(service.getQueueSize()).toBe(0);
      expect(analyticsService.track).toHaveBeenCalled();
    });

    it('should not flush when queue is empty', () => {
      service.flush();
      
      expect(analyticsService.track).not.toHaveBeenCalled();
    });

    it('should send batch event with all queued events', () => {
      service.trackEngagementAction('like', 'post-1');
      service.trackEngagementAction('repost', 'post-2');
      service.trackCommunityJoin('community-1');
      
      service.flush();
      
      expect(analyticsService.track).toHaveBeenCalledWith(
        'community_events_batch',
        expect.objectContaining({
          count: 3,
          events: expect.any(Array),
        })
      );
    });
  });

  describe('automatic flushing', () => {
    it('should flush when queue reaches 50 events', () => {
      // Queue 50 events
      for (let i = 0; i < 50; i++) {
        service.trackEngagementAction('like', `post-${i}`);
      }
      
      // Should have flushed automatically
      expect(service.getQueueSize()).toBe(0);
      expect(analyticsService.track).toHaveBeenCalled();
    });
  });

  describe('setEnabled', () => {
    it('should disable tracking when set to false', () => {
      service.setEnabled(false);
      
      service.trackEngagementAction('like', 'post-123');
      
      expect(service.getQueueSize()).toBe(0);
    });

    it('should enable tracking when set to true', () => {
      service.setEnabled(false);
      service.setEnabled(true);
      
      service.trackEngagementAction('like', 'post-123');
      
      expect(service.getQueueSize()).toBe(1);
    });
  });

  describe('setBatchInterval', () => {
    it('should update batch interval', () => {
      service.setBatchInterval(60000); // 1 minute
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('clearViewedPosts', () => {
    it('should clear viewed posts cache', async () => {
      vi.useFakeTimers();
      
      service.trackPostView('post-1');
      service.trackPostView('post-2');
      
      service.clearViewedPosts();
      
      // Should be able to track same posts again
      service.trackPostView('post-1');
      service.trackPostView('post-2');
      
      vi.advanceTimersByTime(1000);
      
      expect(service.getQueueSize()).toBe(2);
      
      vi.useRealTimers();
    });
  });

  describe('clearQueue', () => {
    it('should clear event queue', () => {
      service.trackEngagementAction('like', 'post-1');
      service.trackEngagementAction('repost', 'post-2');
      
      service.clearQueue();
      
      expect(service.getQueueSize()).toBe(0);
    });
  });

  describe('getQueueSize', () => {
    it('should return correct queue size', () => {
      expect(service.getQueueSize()).toBe(0);
      
      service.trackEngagementAction('like', 'post-1');
      expect(service.getQueueSize()).toBe(1);
      
      service.trackEngagementAction('repost', 'post-2');
      expect(service.getQueueSize()).toBe(2);
    });
  });
});
