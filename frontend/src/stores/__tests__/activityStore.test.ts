/**
 * Activity Store Tests
 * 
 * Unit tests for the Activity Store Zustand store.
 * Tests state management, actions, and error handling.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useActivityStore } from '../activityStore';
import { activityLogService } from '../../services/activityLogService';
import { ActivityLogEntry, ActivityLogResponse } from '../../types/activity';

// Mock the activity log service
vi.mock('../../services/activityLogService', () => ({
  activityLogService: {
    getActivityLog: vi.fn(),
    getActivitySummary: vi.fn(),
  },
}));

describe('Activity Store', () => {
  // Sample test data
  const mockActivity1: ActivityLogEntry = {
    id: 'activity-1',
    tripId: 'trip-123',
    userId: 'user-1',
    userName: 'John Doe',
    userAvatar: 'avatar1.jpg',
    actionType: 'place_added',
    entityType: 'place',
    entityId: 'place-1',
    entityName: 'Tokyo Tower',
    changes: { name: 'Tokyo Tower' },
    metadata: {},
    createdAt: '2024-01-15T10:00:00Z',
  };

  const mockActivity2: ActivityLogEntry = {
    id: 'activity-2',
    tripId: 'trip-123',
    userId: 'user-2',
    userName: 'Jane Smith',
    actionType: 'packing_item_added',
    entityType: 'packing_item',
    entityId: 'item-1',
    entityName: 'Passport',
    changes: { item_name: 'Passport' },
    metadata: {},
    createdAt: '2024-01-15T11:00:00Z',
  };

  const mockActivity3: ActivityLogEntry = {
    id: 'activity-3',
    tripId: 'trip-456',
    userId: 'user-1',
    userName: 'John Doe',
    actionType: 'day_added',
    entityType: 'day',
    entityId: 'day-1',
    entityName: 'Day 1',
    changes: { title: 'Day 1' },
    metadata: {},
    createdAt: '2024-01-15T12:00:00Z',
  };

  const mockResponse: ActivityLogResponse = {
    activities: [mockActivity1, mockActivity2],
    total: 2,
    hasMore: false,
  };

  beforeEach(() => {
    // Reset store state before each test
    useActivityStore.setState({
      activities: [],
      activitiesByTrip: {},
      pagination: {
        limit: 50,
        offset: 0,
        hasMore: false,
        total: 0,
      },
      filter: {},
      isLoading: false,
      error: null,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useActivityStore.getState();

      expect(state.activities).toEqual([]);
      expect(state.activitiesByTrip).toEqual({});
      expect(state.pagination).toEqual({
        limit: 50,
        offset: 0,
        hasMore: false,
        total: 0,
      });
      expect(state.filter).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('fetchActivities', () => {
    it('should fetch activities successfully', async () => {
      vi.mocked(activityLogService.getActivityLog).mockResolvedValue(mockResponse);

      const { fetchActivities } = useActivityStore.getState();
      await fetchActivities('trip-123');

      const state = useActivityStore.getState();

      expect(activityLogService.getActivityLog).toHaveBeenCalledWith('trip-123', {
        limit: 50,
        offset: 0,
      });
      expect(state.activities).toEqual([mockActivity1, mockActivity2]);
      expect(state.activitiesByTrip['trip-123']).toEqual([mockActivity1, mockActivity2]);
      expect(state.pagination.total).toBe(2);
      expect(state.pagination.hasMore).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should fetch activities with custom options', async () => {
      vi.mocked(activityLogService.getActivityLog).mockResolvedValue(mockResponse);

      const { fetchActivities } = useActivityStore.getState();
      await fetchActivities('trip-123', {
        limit: 20,
        offset: 10,
        actionType: 'place_added',
      });

      expect(activityLogService.getActivityLog).toHaveBeenCalledWith('trip-123', {
        limit: 20,
        offset: 10,
        actionType: 'place_added',
      });
    });

    it('should merge options with current filter', async () => {
      vi.mocked(activityLogService.getActivityLog).mockResolvedValue(mockResponse);

      // Set filter first
      const { setFilter, fetchActivities } = useActivityStore.getState();
      setFilter({ userId: 'user-1' });

      await fetchActivities('trip-123', { actionType: 'place_added' });

      expect(activityLogService.getActivityLog).toHaveBeenCalledWith('trip-123', {
        limit: 50,
        offset: 0,
        actionType: 'place_added',
        userId: 'user-1',
      });
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Network error';
      vi.mocked(activityLogService.getActivityLog).mockRejectedValue(new Error(errorMessage));

      const { fetchActivities } = useActivityStore.getState();
      await fetchActivities('trip-123');

      const state = useActivityStore.getState();

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.activities).toEqual([]);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: ActivityLogResponse) => void;
      const promise = new Promise<ActivityLogResponse>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(activityLogService.getActivityLog).mockReturnValue(promise);

      const { fetchActivities } = useActivityStore.getState();
      const fetchPromise = fetchActivities('trip-123');

      // Check loading state
      expect(useActivityStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!(mockResponse);
      await fetchPromise;

      // Check loading state after completion
      expect(useActivityStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchMoreActivities', () => {
    it('should fetch and append more activities', async () => {
      // Set initial state with some activities
      useActivityStore.setState({
        activities: [mockActivity1],
        activitiesByTrip: {
          'trip-123': [mockActivity1],
        },
        pagination: {
          limit: 1,
          offset: 0,
          hasMore: true,
          total: 2,
        },
      });

      const moreResponse: ActivityLogResponse = {
        activities: [mockActivity2],
        total: 2,
        hasMore: false,
      };

      vi.mocked(activityLogService.getActivityLog).mockResolvedValue(moreResponse);

      const { fetchMoreActivities } = useActivityStore.getState();
      await fetchMoreActivities('trip-123');

      const state = useActivityStore.getState();

      expect(activityLogService.getActivityLog).toHaveBeenCalledWith('trip-123', {
        limit: 1,
        offset: 1,
      });
      expect(state.activities).toEqual([mockActivity1, mockActivity2]);
      expect(state.activitiesByTrip['trip-123']).toEqual([mockActivity1, mockActivity2]);
      expect(state.pagination.offset).toBe(1);
      expect(state.pagination.hasMore).toBe(false);
    });

    it('should not fetch if already loading', async () => {
      useActivityStore.setState({
        isLoading: true,
        pagination: {
          limit: 50,
          offset: 0,
          hasMore: true,
          total: 100,
        },
      });

      const { fetchMoreActivities } = useActivityStore.getState();
      await fetchMoreActivities('trip-123');

      expect(activityLogService.getActivityLog).not.toHaveBeenCalled();
    });

    it('should not fetch if no more activities', async () => {
      useActivityStore.setState({
        pagination: {
          limit: 50,
          offset: 0,
          hasMore: false,
          total: 10,
        },
      });

      const { fetchMoreActivities } = useActivityStore.getState();
      await fetchMoreActivities('trip-123');

      expect(activityLogService.getActivityLog).not.toHaveBeenCalled();
    });

    it('should handle fetch more error', async () => {
      useActivityStore.setState({
        pagination: {
          limit: 50,
          offset: 0,
          hasMore: true,
          total: 100,
        },
      });

      const errorMessage = 'Network error';
      vi.mocked(activityLogService.getActivityLog).mockRejectedValue(new Error(errorMessage));

      const { fetchMoreActivities } = useActivityStore.getState();
      await fetchMoreActivities('trip-123');

      const state = useActivityStore.getState();

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('addActivity', () => {
    it('should add new activity to the beginning', () => {
      useActivityStore.setState({
        activities: [mockActivity1],
        activitiesByTrip: {
          'trip-123': [mockActivity1],
        },
        pagination: {
          limit: 50,
          offset: 0,
          hasMore: false,
          total: 1,
        },
      });

      const { addActivity } = useActivityStore.getState();
      addActivity(mockActivity2);

      const state = useActivityStore.getState();

      expect(state.activities).toEqual([mockActivity2, mockActivity1]);
      expect(state.activitiesByTrip['trip-123']).toEqual([mockActivity2, mockActivity1]);
      expect(state.pagination.total).toBe(2);
    });

    it('should not add duplicate activity', () => {
      useActivityStore.setState({
        activities: [mockActivity1],
        activitiesByTrip: {
          'trip-123': [mockActivity1],
        },
        pagination: {
          limit: 50,
          offset: 0,
          hasMore: false,
          total: 1,
        },
      });

      const { addActivity } = useActivityStore.getState();
      addActivity(mockActivity1);

      const state = useActivityStore.getState();

      expect(state.activities).toEqual([mockActivity1]);
      expect(state.pagination.total).toBe(1);
    });

    it('should add activity to new trip', () => {
      useActivityStore.setState({
        activities: [mockActivity1],
        activitiesByTrip: {
          'trip-123': [mockActivity1],
        },
      });

      const { addActivity } = useActivityStore.getState();
      addActivity(mockActivity3);

      const state = useActivityStore.getState();

      expect(state.activitiesByTrip['trip-456']).toEqual([mockActivity3]);
      expect(state.activitiesByTrip['trip-123']).toEqual([mockActivity1]);
    });
  });

  describe('Filter Management', () => {
    it('should set filter', () => {
      const { setFilter } = useActivityStore.getState();
      const filter = { actionType: 'place_added', userId: 'user-1' };

      setFilter(filter);

      const state = useActivityStore.getState();
      expect(state.filter).toEqual(filter);
    });

    it('should clear filter', () => {
      useActivityStore.setState({
        filter: { actionType: 'place_added', userId: 'user-1' },
      });

      const { clearFilter } = useActivityStore.getState();
      clearFilter();

      const state = useActivityStore.getState();
      expect(state.filter).toEqual({});
    });
  });

  describe('resetActivities', () => {
    beforeEach(() => {
      useActivityStore.setState({
        activities: [mockActivity1, mockActivity2],
        activitiesByTrip: {
          'trip-123': [mockActivity1, mockActivity2],
          'trip-456': [mockActivity3],
        },
        pagination: {
          limit: 50,
          offset: 0,
          hasMore: true,
          total: 3,
        },
        filter: { actionType: 'place_added' },
      });
    });

    it('should reset all activities when no tripId provided', () => {
      const { resetActivities } = useActivityStore.getState();
      resetActivities();

      const state = useActivityStore.getState();

      expect(state.activities).toEqual([]);
      expect(state.activitiesByTrip).toEqual({});
      expect(state.pagination).toEqual({
        limit: 50,
        offset: 0,
        hasMore: false,
        total: 0,
      });
      expect(state.filter).toEqual({});
      expect(state.error).toBe(null);
    });

    it('should reset activities for specific trip', () => {
      const { resetActivities } = useActivityStore.getState();
      resetActivities('trip-123');

      const state = useActivityStore.getState();

      expect(state.activities).toEqual([]);
      expect(state.activitiesByTrip['trip-123']).toBeUndefined();
      expect(state.activitiesByTrip['trip-456']).toEqual([mockActivity3]);
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      useActivityStore.setState({
        activitiesByTrip: {
          'trip-123': [mockActivity1, mockActivity2],
          'trip-456': [mockActivity3],
        },
      });
    });

    it('should get activities by trip', () => {
      const { getActivitiesByTrip } = useActivityStore.getState();

      const activities = getActivitiesByTrip('trip-123');

      expect(activities).toEqual([mockActivity1, mockActivity2]);
    });

    it('should return empty array for non-existent trip', () => {
      const { getActivitiesByTrip } = useActivityStore.getState();

      const activities = getActivitiesByTrip('trip-999');

      expect(activities).toEqual([]);
    });

    it('should get filtered activities by action type', () => {
      useActivityStore.setState({
        filter: { actionType: 'place_added' },
      });

      const { getFilteredActivities } = useActivityStore.getState();

      const filtered = getFilteredActivities('trip-123');

      expect(filtered).toEqual([mockActivity1]);
    });

    it('should get filtered activities by user', () => {
      useActivityStore.setState({
        filter: { userId: 'user-2' },
      });

      const { getFilteredActivities } = useActivityStore.getState();

      const filtered = getFilteredActivities('trip-123');

      expect(filtered).toEqual([mockActivity2]);
    });

    it('should get filtered activities by date range', () => {
      useActivityStore.setState({
        filter: {
          startDate: '2024-01-15T10:30:00Z',
          endDate: '2024-01-15T11:30:00Z',
        },
      });

      const { getFilteredActivities } = useActivityStore.getState();

      const filtered = getFilteredActivities('trip-123');

      expect(filtered).toEqual([mockActivity2]);
    });

    it('should apply multiple filters', () => {
      useActivityStore.setState({
        filter: {
          actionType: 'place_added',
          userId: 'user-1',
        },
      });

      const { getFilteredActivities } = useActivityStore.getState();

      const filtered = getFilteredActivities('trip-123');

      expect(filtered).toEqual([mockActivity1]);
    });

    it('should return empty array when no activities match filter', () => {
      useActivityStore.setState({
        filter: { actionType: 'day_added' },
      });

      const { getFilteredActivities } = useActivityStore.getState();

      const filtered = getFilteredActivities('trip-123');

      expect(filtered).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response', async () => {
      const emptyResponse: ActivityLogResponse = {
        activities: [],
        total: 0,
        hasMore: false,
      };

      vi.mocked(activityLogService.getActivityLog).mockResolvedValue(emptyResponse);

      const { fetchActivities } = useActivityStore.getState();
      await fetchActivities('trip-123');

      const state = useActivityStore.getState();

      expect(state.activities).toEqual([]);
      expect(state.pagination.total).toBe(0);
      expect(state.pagination.hasMore).toBe(false);
    });

    it('should handle non-Error objects in catch', async () => {
      vi.mocked(activityLogService.getActivityLog).mockRejectedValue('String error');

      const { fetchActivities } = useActivityStore.getState();
      await fetchActivities('trip-123');

      const state = useActivityStore.getState();

      expect(state.error).toBe('Failed to fetch activities');
    });

    it('should handle concurrent fetches', async () => {
      vi.mocked(activityLogService.getActivityLog).mockResolvedValue(mockResponse);

      const { fetchActivities } = useActivityStore.getState();

      // Start two fetches concurrently
      await Promise.all([
        fetchActivities('trip-123'),
        fetchActivities('trip-123'),
      ]);

      // Should have called the service twice
      expect(activityLogService.getActivityLog).toHaveBeenCalledTimes(2);

      // Final state should be consistent
      const state = useActivityStore.getState();
      expect(state.activities).toEqual([mockActivity1, mockActivity2]);
    });
  });
});
