/**
 * Activity Store
 * 
 * Zustand store for managing activity log state.
 * Handles fetching, filtering, pagination, and real-time updates of activity logs.
 * 
 * Validates: Requirements 3.1-3.8 (Activity Log)
 */

import { create } from 'zustand';
import { ActivityLogEntry, GetActivityLogOptions } from '../types/activity';
import { activityLogService } from '../services/activityLogService';

/**
 * Filter options for activity log
 */
export interface ActivityFilter {
  actionType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Pagination state for activity log
 */
export interface ActivityPagination {
  limit: number;
  offset: number;
  hasMore: boolean;
  total: number;
}

/**
 * Activity Store State
 */
interface ActivityStore {
  // Data
  activities: ActivityLogEntry[];
  activitiesByTrip: Record<string, ActivityLogEntry[]>;
  
  // Pagination
  pagination: ActivityPagination;
  
  // Filters
  filter: ActivityFilter;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchActivities: (tripId: string, options?: GetActivityLogOptions) => Promise<void>;
  fetchMoreActivities: (tripId: string) => Promise<void>;
  addActivity: (activity: ActivityLogEntry) => void;
  setFilter: (filter: ActivityFilter) => void;
  clearFilter: () => void;
  resetActivities: (tripId?: string) => void;
  
  // Getters
  getActivitiesByTrip: (tripId: string) => ActivityLogEntry[];
  getFilteredActivities: (tripId: string) => ActivityLogEntry[];
}

/**
 * Default pagination state
 */
const DEFAULT_PAGINATION: ActivityPagination = {
  limit: 50,
  offset: 0,
  hasMore: false,
  total: 0,
};

/**
 * Activity Store
 * 
 * Manages activity log state with support for:
 * - Fetching activities with filtering and pagination
 * - Real-time activity updates
 * - Per-trip activity storage
 * - Loading and error states
 */
export const useActivityStore = create<ActivityStore>((set, get) => ({
  // Initial state
  activities: [],
  activitiesByTrip: {},
  pagination: DEFAULT_PAGINATION,
  filter: {},
  isLoading: false,
  error: null,

  /**
   * Fetch activities for a trip
   * 
   * Fetches activity log entries with optional filtering and pagination.
   * Replaces existing activities for the trip.
   * 
   * @param tripId - The trip ID to fetch activities for
   * @param options - Optional filtering and pagination options
   * 
   * @example
   * ```typescript
   * // Fetch recent activities
   * await fetchActivities('trip-123');
   * 
   * // Fetch with filtering
   * await fetchActivities('trip-123', {
   *   actionType: 'place_added',
   *   limit: 20
   * });
   * ```
   */
  fetchActivities: async (tripId: string, options: GetActivityLogOptions = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      // Merge options with current filter
      const currentFilter = get().filter;
      const fetchOptions: GetActivityLogOptions = {
        limit: options.limit || DEFAULT_PAGINATION.limit,
        offset: options.offset || 0,
        actionType: options.actionType || currentFilter.actionType,
        userId: options.userId || currentFilter.userId,
        startDate: options.startDate || currentFilter.startDate,
        endDate: options.endDate || currentFilter.endDate,
      };
      
      const response = await activityLogService.getActivityLog(tripId, fetchOptions);
      
      set(state => ({
        activities: response.activities,
        activitiesByTrip: {
          ...state.activitiesByTrip,
          [tripId]: response.activities,
        },
        pagination: {
          limit: fetchOptions.limit || DEFAULT_PAGINATION.limit,
          offset: fetchOptions.offset || 0,
          hasMore: response.hasMore,
          total: response.total,
        },
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activities';
      console.error('Failed to fetch activities:', error);
      
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  /**
   * Fetch more activities (pagination)
   * 
   * Loads the next page of activities and appends to existing list.
   * 
   * @param tripId - The trip ID to fetch more activities for
   * 
   * @example
   * ```typescript
   * // Load next page
   * await fetchMoreActivities('trip-123');
   * ```
   */
  fetchMoreActivities: async (tripId: string) => {
    const { pagination, filter, isLoading } = get();
    
    // Don't fetch if already loading or no more activities
    if (isLoading || !pagination.hasMore) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const nextOffset = pagination.offset + pagination.limit;
      
      const fetchOptions: GetActivityLogOptions = {
        limit: pagination.limit,
        offset: nextOffset,
        actionType: filter.actionType,
        userId: filter.userId,
        startDate: filter.startDate,
        endDate: filter.endDate,
      };
      
      const response = await activityLogService.getActivityLog(tripId, fetchOptions);
      
      set(state => {
        const existingActivities = state.activitiesByTrip[tripId] || [];
        const updatedActivities = [...existingActivities, ...response.activities];
        
        return {
          activities: updatedActivities,
          activitiesByTrip: {
            ...state.activitiesByTrip,
            [tripId]: updatedActivities,
          },
          pagination: {
            ...state.pagination,
            offset: nextOffset,
            hasMore: response.hasMore,
            total: response.total,
          },
          isLoading: false,
          error: null,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch more activities';
      console.error('Failed to fetch more activities:', error);
      
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  /**
   * Add a new activity (real-time update)
   * 
   * Adds a new activity to the beginning of the list.
   * Used for real-time updates via WebSocket.
   * 
   * @param activity - The activity to add
   * 
   * @example
   * ```typescript
   * // Add activity from socket event
   * socket.on('activity:new', (data) => {
   *   addActivity(data.activity);
   * });
   * ```
   */
  addActivity: (activity: ActivityLogEntry) => {
    set(state => {
      const tripId = activity.tripId;
      const existingActivities = state.activitiesByTrip[tripId] || [];
      
      // Check if activity already exists (prevent duplicates)
      const activityExists = existingActivities.some(a => a.id === activity.id);
      if (activityExists) {
        return state;
      }
      
      // Add to beginning of list (most recent first)
      const updatedActivities = [activity, ...existingActivities];
      
      return {
        activities: updatedActivities,
        activitiesByTrip: {
          ...state.activitiesByTrip,
          [tripId]: updatedActivities,
        },
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      };
    });
  },

  /**
   * Set filter options
   * 
   * Updates the filter state. Call fetchActivities() after to apply filters.
   * 
   * @param filter - Filter options to apply
   * 
   * @example
   * ```typescript
   * // Filter by action type
   * setFilter({ actionType: 'place_added' });
   * await fetchActivities('trip-123');
   * ```
   */
  setFilter: (filter: ActivityFilter) => {
    set({ filter });
  },

  /**
   * Clear all filters
   * 
   * Resets filter state to empty. Call fetchActivities() after to reload.
   * 
   * @example
   * ```typescript
   * clearFilter();
   * await fetchActivities('trip-123');
   * ```
   */
  clearFilter: () => {
    set({ filter: {} });
  },

  /**
   * Reset activities
   * 
   * Clears all activities or activities for a specific trip.
   * 
   * @param tripId - Optional trip ID to reset activities for
   * 
   * @example
   * ```typescript
   * // Clear all activities
   * resetActivities();
   * 
   * // Clear activities for specific trip
   * resetActivities('trip-123');
   * ```
   */
  resetActivities: (tripId?: string) => {
    if (tripId) {
      set(state => {
        const { [tripId]: _, ...remainingActivities } = state.activitiesByTrip;
        return {
          activitiesByTrip: remainingActivities,
          activities: [],
          pagination: DEFAULT_PAGINATION,
          filter: {},
          error: null,
        };
      });
    } else {
      set({
        activities: [],
        activitiesByTrip: {},
        pagination: DEFAULT_PAGINATION,
        filter: {},
        error: null,
      });
    }
  },

  /**
   * Get activities for a specific trip
   * 
   * Returns all activities for the given trip ID.
   * 
   * @param tripId - The trip ID
   * @returns Array of activities for the trip
   * 
   * @example
   * ```typescript
   * const activities = getActivitiesByTrip('trip-123');
   * ```
   */
  getActivitiesByTrip: (tripId: string) => {
    return get().activitiesByTrip[tripId] || [];
  },

  /**
   * Get filtered activities for a trip
   * 
   * Returns activities filtered by current filter state.
   * Note: This is client-side filtering. For server-side filtering,
   * use fetchActivities() with filter options.
   * 
   * @param tripId - The trip ID
   * @returns Filtered array of activities
   * 
   * @example
   * ```typescript
   * const filteredActivities = getFilteredActivities('trip-123');
   * ```
   */
  getFilteredActivities: (tripId: string) => {
    const activities = get().activitiesByTrip[tripId] || [];
    const filter = get().filter;
    
    return activities.filter(activity => {
      // Filter by action type
      if (filter.actionType && activity.actionType !== filter.actionType) {
        return false;
      }
      
      // Filter by user
      if (filter.userId && activity.userId !== filter.userId) {
        return false;
      }
      
      // Filter by date range
      if (filter.startDate) {
        const activityDate = new Date(activity.createdAt);
        const startDate = new Date(filter.startDate);
        if (activityDate < startDate) {
          return false;
        }
      }
      
      if (filter.endDate) {
        const activityDate = new Date(activity.createdAt);
        const endDate = new Date(filter.endDate);
        if (activityDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  },
}));

export default useActivityStore;
