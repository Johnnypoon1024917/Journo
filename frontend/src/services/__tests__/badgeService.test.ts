import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadgeService } from '../badgeService';
import { UserBadge } from '../../types/user';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

import api from '../api';

describe('BadgeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserBadges', () => {
    it('should fetch user badges successfully', async () => {
      const mockBadges: UserBadge[] = [
        {
          id: '1',
          user_id: 'user-1',
          trip_id: 'trip-1',
          badge_type: 'golden_hour',
          earned_at: '2024-01-01T19:00:00Z'
        }
      ];

      vi.mocked(api.get).mockResolvedValue(mockBadges);

      const result = await BadgeService.getUserBadges();

      expect(api.get).toHaveBeenCalledWith('/badges');
      expect(result).toEqual(mockBadges);
    });

    it('should handle errors when fetching badges', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(BadgeService.getUserBadges()).rejects.toThrow('Network error');
    });
  });

  describe('getUserBadgesByUserId', () => {
    it('should fetch badges for specific user', async () => {
      const userId = 'user-123';
      const mockBadges: UserBadge[] = [
        {
          id: '1',
          user_id: userId,
          trip_id: 'trip-1',
          badge_type: 'food_explorer',
          earned_at: '2024-01-01T12:00:00Z'
        }
      ];

      vi.mocked(api.get).mockResolvedValue(mockBadges);

      const result = await BadgeService.getUserBadgesByUserId(userId);

      expect(api.get).toHaveBeenCalledWith(`/badges/user/${userId}`);
      expect(result).toEqual(mockBadges);
    });
  });

  describe('checkBadges', () => {
    it('should trigger badge check successfully', async () => {
      const action = {
        type: 'photo_upload' as const,
        tripId: 'trip-1',
        photoTimestamp: new Date()
      };

      const mockResponse = {
        earnedBadges: [
          {
            id: '1',
            user_id: 'user-1',
            trip_id: 'trip-1',
            badge_type: 'golden_hour' as const,
            earned_at: '2024-01-01T19:00:00Z'
          }
        ]
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await BadgeService.checkBadges(action);

      expect(api.post).toHaveBeenCalledWith('/badges/check', { action });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('utility methods', () => {
    const mockBadges: UserBadge[] = [
      {
        id: '1',
        user_id: 'user-1',
        trip_id: 'trip-1',
        badge_type: 'golden_hour',
        earned_at: '2024-01-01T19:00:00Z'
      },
      {
        id: '2',
        user_id: 'user-1',
        trip_id: 'trip-2',
        badge_type: 'food_explorer',
        earned_at: '2024-01-02T12:00:00Z'
      },
      {
        id: '3',
        user_id: 'user-1',
        trip_id: 'trip-1',
        badge_type: 'golden_hour',
        earned_at: '2024-01-03T20:00:00Z'
      }
    ];

    it('should check if user has specific badge', () => {
      expect(BadgeService.hasBadge(mockBadges, 'golden_hour')).toBe(true);
      expect(BadgeService.hasBadge(mockBadges, 'early_bird')).toBe(false);
    });

    it('should get badges for specific trip', () => {
      const tripBadges = BadgeService.getBadgesForTrip(mockBadges, 'trip-1');
      expect(tripBadges).toHaveLength(2);
      expect(tripBadges.every(badge => badge.trip_id === 'trip-1')).toBe(true);
    });

    it('should group badges by type', () => {
      const grouped = BadgeService.groupBadgesByType(mockBadges);
      expect(grouped.golden_hour).toHaveLength(2);
      expect(grouped.food_explorer).toHaveLength(1);
    });

    it('should get most recent badge', () => {
      const mostRecent = BadgeService.getMostRecentBadge(mockBadges);
      expect(mostRecent?.id).toBe('3');
      expect(mostRecent?.earned_at).toBe('2024-01-03T20:00:00Z');
    });

    it('should count total badges', () => {
      expect(BadgeService.getTotalBadgeCount(mockBadges)).toBe(3);
    });

    it('should get unique badge types', () => {
      const uniqueTypes = BadgeService.getUniqueBadgeTypes(mockBadges);
      expect(uniqueTypes).toHaveLength(2);
      expect(uniqueTypes).toContain('golden_hour');
      expect(uniqueTypes).toContain('food_explorer');
    });

    it('should handle empty badge array', () => {
      expect(BadgeService.getMostRecentBadge([])).toBeNull();
      expect(BadgeService.getTotalBadgeCount([])).toBe(0);
      expect(BadgeService.getUniqueBadgeTypes([])).toHaveLength(0);
    });
  });
});