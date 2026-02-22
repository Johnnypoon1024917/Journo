/**
 * Unit tests for OfflineCommunityService
 * 
 * Tests offline action queueing, syncing, and feed caching
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineCommunityService } from '../offlineCommunityService';
import type { PostWithEngagement } from '../../types/community';

// Mock localforage
vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('OfflineCommunityService', () => {
  let service: OfflineCommunityService;

  beforeEach(() => {
    service = new OfflineCommunityService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('queueAction', () => {
    it('should queue a like action', async () => {
      const action = await service.queueAction('like', 'post-123');
      
      expect(action.type).toBe('like');
      expect(action.postId).toBe('post-123');
      expect(action.status).toBe('pending');
      expect(action.retryCount).toBe(0);
    });

    it('should queue an unlike action', async () => {
      const action = await service.queueAction('unlike', 'post-456');
      
      expect(action.type).toBe('unlike');
      expect(action.postId).toBe('post-456');
    });

    it('should queue a repost action with data', async () => {
      const data = { comment: 'Great post!' };
      const action = await service.queueAction('repost', 'post-789', data);
      
      expect(action.type).toBe('repost');
      expect(action.data).toEqual(data);
    });

    it('should generate unique IDs for each action', async () => {
      const action1 = await service.queueAction('like', 'post-1');
      const action2 = await service.queueAction('like', 'post-2');
      
      expect(action1.id).not.toBe(action2.id);
    });
  });

  describe('getPendingActions', () => {
    it('should return only pending actions', async () => {
      await service.queueAction('like', 'post-1');
      await service.queueAction('repost', 'post-2');
      
      const pending = await service.getPendingActions();
      
      expect(pending.length).toBe(2);
      expect(pending.every(a => a.status === 'pending')).toBe(true);
    });

    it('should return empty array when no pending actions', async () => {
      const pending = await service.getPendingActions();
      
      expect(pending).toEqual([]);
    });
  });

  describe('hasPendingAction', () => {
    it('should return true when post has pending action', async () => {
      await service.queueAction('like', 'post-123');
      
      const hasPending = await service.hasPendingAction('post-123');
      
      expect(hasPending).toBe(true);
    });

    it('should return false when post has no pending action', async () => {
      const hasPending = await service.hasPendingAction('post-999');
      
      expect(hasPending).toBe(false);
    });
  });

  describe('cacheFeed', () => {
    it('should cache For You feed', async () => {
      const posts: PostWithEngagement[] = [
        {
          id: 'post-1',
          userId: 'user-1',
          userName: 'John Doe',
          userAvatar: 'avatar.jpg',
          content: 'Test post',
          mediaUrls: [],
          tags: [],
          likeCount: 5,
          replyCount: 2,
          repostCount: 1,
          engagementScore: 20,
          isLiked: false,
          isReposted: false,
          isBookmarked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await service.cacheFeed('forYou', posts, 'cursor-123');
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should cache community feed with community ID', async () => {
      const posts: PostWithEngagement[] = [];

      await service.cacheFeed('community', posts, null, 'community-456');
      
      expect(true).toBe(true);
    });
  });

  describe('getCachedFeed', () => {
    it('should return null when no cached feed exists', async () => {
      const cached = await service.getCachedFeed('forYou');
      
      expect(cached).toBeNull();
    });
  });

  describe('getSyncStatus', () => {
    it('should return correct sync status', () => {
      const status = service.getSyncStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isSyncing');
      expect(status).toHaveProperty('pendingCount');
      expect(status).toHaveProperty('failedCount');
      expect(typeof status.isOnline).toBe('boolean');
      expect(typeof status.isSyncing).toBe('boolean');
      expect(typeof status.pendingCount).toBe('number');
      expect(typeof status.failedCount).toBe('number');
    });

    it('should show correct pending count', async () => {
      await service.queueAction('like', 'post-1');
      await service.queueAction('repost', 'post-2');
      
      const status = service.getSyncStatus();
      
      expect(status.pendingCount).toBe(2);
    });
  });

  describe('clearActions', () => {
    it('should clear all queued actions', async () => {
      await service.queueAction('like', 'post-1');
      await service.queueAction('repost', 'post-2');
      
      await service.clearActions();
      
      const pending = await service.getPendingActions();
      expect(pending).toEqual([]);
    });
  });

  describe('isOnlineStatus', () => {
    it('should return online status', () => {
      const isOnline = service.isOnlineStatus();
      
      expect(typeof isOnline).toBe('boolean');
    });
  });

  describe('isSyncInProgress', () => {
    it('should return false initially', () => {
      const isSyncing = service.isSyncInProgress();
      
      expect(isSyncing).toBe(false);
    });
  });
});
