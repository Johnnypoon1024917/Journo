/**
import { getAuthToken } from '../utils/auth';
 * Activity Log Service
 * 
 * Frontend service for activity log API calls.
 * Handles fetching activity logs and summaries for trips.
 * 
 * Validates: Requirements 3.1-3.8 (Activity Log)
 */

import api from './api';
import {
  ActivityLogResponse,
  ActivitySummary,
  GetActivityLogOptions
} from '../types/activity';

/**
 * Get authentication token from store
 */
const getAuthToken = (): string | undefined => {
  const token = getAuthToken();
  return token || undefined;
};

/**
 * Activity Log Service
 * 
 * Provides methods for fetching activity logs and summaries.
 */
export const activityLogService = {
  /**
   * Get activity log for a trip with optional filtering
   * 
   * @param tripId - The trip ID to fetch activity log for
   * @param options - Optional filtering and pagination options
   * @returns Promise with activity log response
   * 
   * @example
   * ```typescript
   * // Get recent activities
   * const result = await activityLogService.getActivityLog('trip-123');
   * 
   * // Get activities with filtering
   * const filtered = await activityLogService.getActivityLog('trip-123', {
   *   actionType: 'place_added',
   *   limit: 20,
   *   offset: 0
   * });
   * ```
   */
  async getActivityLog(
    tripId: string,
    options: GetActivityLogOptions = {}
  ): Promise<ActivityLogResponse> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (options.limit !== undefined) {
        queryParams.append('limit', options.limit.toString());
      }
      
      if (options.offset !== undefined) {
        queryParams.append('offset', options.offset.toString());
      }
      
      if (options.actionType) {
        queryParams.append('actionType', options.actionType);
      }
      
      if (options.userId) {
        queryParams.append('userId', options.userId);
      }
      
      if (options.startDate) {
        queryParams.append('startDate', options.startDate);
      }
      
      if (options.endDate) {
        queryParams.append('endDate', options.endDate);
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/trips/${tripId}/activity-log${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<ActivityLogResponse>(
        endpoint,
        { token: getAuthToken() }
      );
      
      return response;
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      throw error;
    }
  },

  /**
   * Get activity summary for a trip
   * 
   * Returns aggregated statistics about activities including:
   * - Total activity count
   * - Count by action type
   * - Count by user
   * - Recent activities
   * 
   * @param tripId - The trip ID to fetch summary for
   * @returns Promise with activity summary
   * 
   * @example
   * ```typescript
   * const summary = await activityLogService.getActivitySummary('trip-123');
   * console.log(`Total activities: ${summary.totalActivities}`);
   * console.log(`Places added: ${summary.byActionType['place_added']}`);
   * ```
   */
  async getActivitySummary(tripId: string): Promise<ActivitySummary> {
    try {
      const response = await api.get<ActivitySummary>(
        `/trips/${tripId}/activity-log/summary`,
        { token: getAuthToken() }
      );
      
      return response;
    } catch (error) {
      console.error('Failed to fetch activity summary:', error);
      throw error;
    }
  },

  /**
   * Format activity action type for display
   * 
   * Converts action type strings to human-readable format.
   * 
   * @param actionType - The action type to format
   * @returns Formatted action string
   * 
   * @example
   * ```typescript
   * formatActionType('place_added') // Returns "Place Added"
   * formatActionType('collaborator_role_changed') // Returns "Collaborator Role Changed"
   * ```
   */
  formatActionType(actionType: string): string {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Get icon name for activity action type
   * 
   * Returns appropriate icon identifier for different action types.
   * Can be used with icon libraries or custom icon components.
   * 
   * @param actionType - The action type
   * @returns Icon identifier string
   * 
   * @example
   * ```typescript
   * getActionIcon('place_added') // Returns "add"
   * getActionIcon('place_deleted') // Returns "delete"
   * ```
   */
  getActionIcon(actionType: string): string {
    if (actionType.includes('added')) return 'add';
    if (actionType.includes('deleted') || actionType.includes('removed')) return 'delete';
    if (actionType.includes('updated')) return 'edit';
    if (actionType.includes('reordered')) return 'reorder';
    if (actionType.includes('role_changed')) return 'role';
    return 'activity';
  },

  /**
   * Get color class for activity action type
   * 
   * Returns CSS class name for styling different action types.
   * 
   * @param actionType - The action type
   * @returns CSS class name
   * 
   * @example
   * ```typescript
   * getActionColor('place_added') // Returns "success"
   * getActionColor('place_deleted') // Returns "error"
   * ```
   */
  getActionColor(actionType: string): string {
    if (actionType.includes('added') || actionType.includes('created')) return 'success';
    if (actionType.includes('deleted') || actionType.includes('removed')) return 'error';
    if (actionType.includes('updated') || actionType.includes('changed')) return 'warning';
    return 'info';
  }
};

export default activityLogService;
