import { Request, Response } from 'express';
import { getActivityLog, getActivitySummary } from '../activityLogController';
import { activityLogService } from '../../services/activityLogService';

// Mock dependencies
jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../../services/activityLogService', () => ({
  activityLogService: {
    getActivityLog: jest.fn(),
    getActivitySummary: jest.fn()
  }
}));

// Import pool after mocking
import { pool } from '../../config/database';

describe('Activity Log Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      params: {},
      query: {},
      user: { 
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user'
      }
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    jest.clearAllMocks();
  });

  describe('getActivityLog', () => {
    const mockActivityLog = {
      activities: [
        {
          id: 'activity-1',
          tripId: 'trip-123',
          userId: 'user-123',
          userName: 'Test User',
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

    it('should return activity log for a trip', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });
      
      (activityLogService.getActivityLog as jest.Mock).mockResolvedValue(mockActivityLog);

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT user_can_view_trip($1, $2) as can_view',
        ['user-123', 'trip-123']
      );
      expect(activityLogService.getActivityLog).toHaveBeenCalledWith('trip-123', {
        limit: 50,
        offset: 0,
        actionType: undefined,
        userId: undefined,
        startDate: undefined,
        endDate: undefined
      });
      expect(mockJson).toHaveBeenCalledWith(mockActivityLog);
    });

    it('should return 400 if tripId is missing', async () => {
      mockRequest.params = {};

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Trip ID is required' });
    });

    it('should return 403 if user does not have permission', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: false }]
      });

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'You do not have permission to view this trip' 
      });
    });

    it('should handle query parameters correctly', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.query = {
        limit: '25',
        offset: '10',
        actionType: 'place_added',
        userId: 'user-456',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });
      
      (activityLogService.getActivityLog as jest.Mock).mockResolvedValue(mockActivityLog);

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(activityLogService.getActivityLog).toHaveBeenCalledWith('trip-123', {
        limit: 25,
        offset: 10,
        actionType: 'place_added',
        userId: 'user-456',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      });
    });

    it('should return 400 if limit is out of range', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.query = { limit: '150' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Limit must be between 1 and 100' 
      });
    });

    it('should return 400 if offset is negative', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.query = { offset: '-5' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Offset must be non-negative' 
      });
    });

    it('should return 400 if startDate is invalid', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.query = { startDate: 'invalid-date' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Invalid startDate format' 
      });
    });

    it('should return 400 if endDate is invalid', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.query = { endDate: 'invalid-date' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Invalid endDate format' 
      });
    });

    it('should return 500 if service throws an error', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });
      
      (activityLogService.getActivityLog as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Failed to fetch activity log' 
      });
    });

    it('should use default values for limit and offset', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.query = {};
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });
      
      (activityLogService.getActivityLog as jest.Mock).mockResolvedValue(mockActivityLog);

      await getActivityLog(mockRequest as Request, mockResponse as Response);

      expect(activityLogService.getActivityLog).toHaveBeenCalledWith('trip-123', {
        limit: 50,
        offset: 0,
        actionType: undefined,
        userId: undefined,
        startDate: undefined,
        endDate: undefined
      });
    });
  });

  describe('getActivitySummary', () => {
    const mockSummary = {
      totalActivities: 10,
      byActionType: {
        'place_added': 5,
        'place_updated': 3,
        'place_deleted': 2
      },
      byUser: {
        'user-123': 7,
        'user-456': 3
      },
      recentActivity: []
    };

    it('should return activity summary for a trip', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });
      
      (activityLogService.getActivitySummary as jest.Mock).mockResolvedValue(mockSummary);

      await getActivitySummary(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT user_can_view_trip($1, $2) as can_view',
        ['user-123', 'trip-123']
      );
      expect(activityLogService.getActivitySummary).toHaveBeenCalledWith('trip-123');
      expect(mockJson).toHaveBeenCalledWith(mockSummary);
    });

    it('should return 400 if tripId is missing', async () => {
      mockRequest.params = {};

      await getActivitySummary(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Trip ID is required' });
    });

    it('should return 403 if user does not have permission', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: false }]
      });

      await getActivitySummary(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'You do not have permission to view this trip' 
      });
    });

    it('should return 500 if service throws an error', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: true }]
      });
      
      (activityLogService.getActivitySummary as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await getActivitySummary(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Failed to fetch activity summary' 
      });
    });

    it('should handle permission check with null user', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.user = undefined;
      
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ can_view: false }]
      });

      await getActivitySummary(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT user_can_view_trip($1, $2) as can_view',
        [undefined, 'trip-123']
      );
      expect(mockStatus).toHaveBeenCalledWith(403);
    });
  });
});
