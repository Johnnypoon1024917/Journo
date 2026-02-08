/**
 * Activity Log Service Tests
 * 
 * Unit tests for the activity log service.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { activityLogService } from '../activityLogService';
import api from '../api';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import {
  ActivityLogResponse,
  ActivitySummary,
  ActivityLogEntry
} from '../../types/activity';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn()
  }
}));

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useEnhancedAuthStore: {
    getState: vi.fn(() => ({
      accessToken: 'mock-token'
    }))
  }
}));

describe('activityLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getActivityLog', () => {
    it('should fetch activity log without filters', async () => {
      const mockResponse: ActivityLogResponse = {
        activities: [
          {
            id: 'activity-1',
            tripId: 'trip-123',
            userId: 'user-1',
            userName: 'John Doe',
            actionType: 'place_added',
            entityType: 'place',
            entityId: 'place-1',
            entityName: 'Tokyo Tower',
            changes: {},
            metadata: {},
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1,
        hasMore: false
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await activityLogService.getActivityLog('trip-123');

      expect(api.get).toHaveBeenCalledWith(
        '/trips/trip-123/activity-log',
        { token: 'mock-token' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch activity log with filters', async () => {
      const mockResponse: ActivityLogResponse = {
        activities: [],
        total: 0,
        hasMore: false
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      await activityLogService.getActivityLog('trip-123', {
        limit: 20,
        offset: 10,
        actionType: 'place_added',
        userId: 'user-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(api.get).toHaveBeenCalledWith(
        '/trips/trip-123/activity-log?limit=20&offset=10&actionType=place_added&userId=user-1&startDate=2024-01-01&endDate=2024-01-31',
        { token: 'mock-token' }
      );
    });

    it('should handle errors when fetching activity log', async () => {
      const mockError = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(mockError);

      await expect(
        activityLogService.getActivityLog('trip-123')
      ).rejects.toThrow('Network error');
    });

    it('should handle missing auth token', async () => {
      vi.mocked(useEnhancedAuthStore.getState).mockReturnValue({
        accessToken: null
      } as any);

      const mockResponse: ActivityLogResponse = {
        activities: [],
        total: 0,
        hasMore: false
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      await activityLogService.getActivityLog('trip-123');

      expect(api.get).toHaveBeenCalledWith(
        '/trips/trip-123/activity-log',
        { token: undefined }
      );
    });
  });

  describe('getActivitySummary', () => {
    it('should fetch activity summary', async () => {
      const mockSummary: ActivitySummary = {
        totalActivities: 10,
        byActionType: {
          'place_added': 5,
          'place_updated': 3,
          'place_deleted': 2
        },
        byUser: {
          'user-1': 7,
          'user-2': 3
        },
        recentActivity: []
      };

      vi.mocked(api.get).mockResolvedValue(mockSummary);

      const result = await activityLogService.getActivitySummary('trip-123');

      expect(api.get).toHaveBeenCalledWith(
        '/trips/trip-123/activity-log/summary',
        { token: 'mock-token' }
      );
      expect(result).toEqual(mockSummary);
    });

    it('should handle errors when fetching summary', async () => {
      const mockError = new Error('Server error');
      vi.mocked(api.get).mockRejectedValue(mockError);

      await expect(
        activityLogService.getActivitySummary('trip-123')
      ).rejects.toThrow('Server error');
    });
  });

  describe('formatActionType', () => {
    it('should format action types correctly', () => {
      expect(activityLogService.formatActionType('place_added')).toBe('Place Added');
      expect(activityLogService.formatActionType('collaborator_role_changed')).toBe('Collaborator Role Changed');
      expect(activityLogService.formatActionType('trip_updated')).toBe('Trip Updated');
    });
  });

  describe('getActionIcon', () => {
    it('should return correct icon for added actions', () => {
      expect(activityLogService.getActionIcon('place_added')).toBe('add');
      expect(activityLogService.getActionIcon('day_added')).toBe('add');
    });

    it('should return correct icon for deleted actions', () => {
      expect(activityLogService.getActionIcon('place_deleted')).toBe('delete');
      expect(activityLogService.getActionIcon('collaborator_removed')).toBe('delete');
    });

    it('should return correct icon for updated actions', () => {
      expect(activityLogService.getActionIcon('place_updated')).toBe('edit');
      expect(activityLogService.getActionIcon('trip_updated')).toBe('edit');
    });

    it('should return correct icon for reordered actions', () => {
      expect(activityLogService.getActionIcon('place_reordered')).toBe('reorder');
    });

    it('should return correct icon for role changed actions', () => {
      expect(activityLogService.getActionIcon('collaborator_role_changed')).toBe('role');
    });

    it('should return default icon for unknown actions', () => {
      expect(activityLogService.getActionIcon('unknown_action')).toBe('activity');
    });
  });

  describe('getActionColor', () => {
    it('should return success color for added/created actions', () => {
      expect(activityLogService.getActionColor('place_added')).toBe('success');
      expect(activityLogService.getActionColor('trip_created')).toBe('success');
    });

    it('should return error color for deleted/removed actions', () => {
      expect(activityLogService.getActionColor('place_deleted')).toBe('error');
      expect(activityLogService.getActionColor('collaborator_removed')).toBe('error');
    });

    it('should return warning color for updated/changed actions', () => {
      expect(activityLogService.getActionColor('place_updated')).toBe('warning');
      expect(activityLogService.getActionColor('collaborator_role_changed')).toBe('warning');
    });

    it('should return info color for unknown actions', () => {
      expect(activityLogService.getActionColor('unknown_action')).toBe('info');
    });
  });
});
