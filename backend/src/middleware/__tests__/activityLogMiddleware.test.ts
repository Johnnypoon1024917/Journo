import { Request, Response, NextFunction } from 'express';
import { activityLogMiddleware, createActivityLogMiddleware } from '../activityLogMiddleware';
import { activityLogService } from '../../services/activityLogService';

// Mock the activity log service
jest.mock('../../services/activityLogService', () => ({
  activityLogService: {
    logActivity: jest.fn()
  }
}));

describe('activityLogMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request
    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user'
      },
      params: {
        tripId: 'trip-456'
      },
      body: {},
      method: 'POST',
      path: '/api/places',
      ip: '127.0.0.1',
      get: jest.fn((header: string) => {
        if (header === 'set-cookie') return ['cookie1', 'cookie2'];
        if (header === 'user-agent') return 'test-agent';
        return undefined;
      }) as any
    };

    // Setup mock response
    jsonMock = jest.fn();
    mockResponse = {
      statusCode: 200,
      json: jsonMock
    };

    // Setup next function
    nextFunction = jest.fn();

    // Mock logActivity to resolve successfully
    (activityLogService.logActivity as jest.Mock).mockResolvedValue({
      id: 'activity-123',
      tripId: 'trip-456',
      userId: 'user-123',
      actionType: 'place_added',
      entityType: 'place',
      entityId: 'place-789',
      entityName: 'Tokyo Tower',
      changes: {},
      metadata: {},
      createdAt: new Date().toISOString()
    });
  });

  describe('Basic Functionality', () => {
    it('should call next() to continue the middleware chain', () => {
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('should override res.json method', () => {
      const middleware = activityLogMiddleware('place_added', 'place');
      const originalJson = mockResponse.json;
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.json).not.toBe(originalJson);
    });

    it('should call original json method with response data', () => {
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower' };
      mockResponse.json!(responseData);
      
      expect(jsonMock).toHaveBeenCalledWith(responseData);
    });
  });

  describe('Activity Logging', () => {
    it('should log activity for successful operations (2xx status)', async () => {
      mockResponse.statusCode = 200;
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower', trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith({
        tripId: 'trip-456',
        userId: 'user-123',
        actionType: 'place_added',
        entityType: 'place',
        entityId: 'place-789',
        entityName: 'Tokyo Tower',
        changes: expect.any(Object),
        metadata: {
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          method: 'POST',
          path: '/api/places'
        }
      });
    });

    it('should not log activity for non-2xx status codes', async () => {
      mockResponse.statusCode = 400;
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { error: 'Bad request' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).not.toHaveBeenCalled();
    });

    it('should not log activity if userId is missing', async () => {
      mockRequest.user = undefined;
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).not.toHaveBeenCalled();
    });

    it('should not log activity if tripId is missing', async () => {
      mockRequest.params = {};
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).not.toHaveBeenCalled();
    });

    it('should handle user.id as fallback for userId', async () => {
      mockRequest.user = { userId: 'user-999', email: 'test@example.com', role: 'user' } as any;
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower', trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-999'
        })
      );
    });

    it('should extract tripId from response data if not in params', async () => {
      mockRequest.params = {};
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower', trip_id: 'trip-999' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: 'trip-999'
        })
      );
    });
  });

  describe('Entity Name Extraction', () => {
    it('should extract place name correctly', async () => {
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower', trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'Tokyo Tower'
        })
      );
    });

    it('should extract day title correctly', async () => {
      const middleware = activityLogMiddleware('day_added', 'day');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'day-123', title: 'Exploring Tokyo', day_number: 1, trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'Exploring Tokyo'
        })
      );
    });

    it('should use day number if title is missing', async () => {
      const middleware = activityLogMiddleware('day_added', 'day');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'day-123', day_number: 2, trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'Day 2'
        })
      );
    });

    it('should extract packing item name correctly', async () => {
      const middleware = activityLogMiddleware('packing_item_added', 'packing_item');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'item-123', item_name: 'Passport', trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'Passport'
        })
      );
    });

    it('should use fallback name for unnamed entities', async () => {
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'Unnamed place'
        })
      );
    });
  });

  describe('Changes Extraction', () => {
    it('should extract created data for POST requests', async () => {
      mockRequest.method = 'POST';
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = {
        id: 'place-789',
        name: 'Tokyo Tower',
        description: 'Famous landmark',
        trip_id: 'trip-456'
      };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const call = (activityLogService.logActivity as jest.Mock).mock.calls[0][0];
      expect(call.changes).toHaveProperty('name');
      expect(call.changes.name).toEqual({ to: 'Tokyo Tower' });
      expect(call.changes).toHaveProperty('description');
      expect(call.changes.description).toEqual({ to: 'Famous landmark' });
    });

    it('should extract changes for PUT requests', async () => {
      mockRequest.method = 'PUT';
      mockRequest.body = { name: 'Updated Tower' };
      const middleware = activityLogMiddleware('place_updated', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = {
        id: 'place-789',
        name: 'Tokyo Tower',
        trip_id: 'trip-456'
      };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const call = (activityLogService.logActivity as jest.Mock).mock.calls[0][0];
      expect(call.changes).toHaveProperty('name');
      expect(call.changes.name).toEqual({
        from: 'Tokyo Tower',
        to: 'Updated Tower'
      });
    });

    it('should extract deleted data for DELETE requests', async () => {
      mockRequest.method = 'DELETE';
      const middleware = activityLogMiddleware('place_deleted', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = {
        id: 'place-789',
        name: 'Tokyo Tower',
        trip_id: 'trip-456'
      };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const call = (activityLogService.logActivity as jest.Mock).mock.calls[0][0];
      expect(call.changes).toHaveProperty('deleted');
      expect(call.changes.deleted).toEqual(responseData);
    });
  });

  describe('Error Handling', () => {
    it('should not throw error if logActivity fails', async () => {
      (activityLogService.logActivity as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower', trip_id: 'trip-456' };
      
      // Should not throw
      expect(() => {
        mockResponse.json!(responseData);
      }).not.toThrow();
      
      expect(jsonMock).toHaveBeenCalledWith(responseData);
    });

    it('should still send response even if logging fails', async () => {
      (activityLogService.logActivity as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower', trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      expect(jsonMock).toHaveBeenCalledWith(responseData);
    });
  });

  describe('Helper Functions', () => {
    it('should provide helper for place operations', () => {
      expect(createActivityLogMiddleware.placeAdded).toBeDefined();
      expect(createActivityLogMiddleware.placeUpdated).toBeDefined();
      expect(createActivityLogMiddleware.placeDeleted).toBeDefined();
      expect(createActivityLogMiddleware.placeReordered).toBeDefined();
    });

    it('should provide helper for day operations', () => {
      expect(createActivityLogMiddleware.dayAdded).toBeDefined();
      expect(createActivityLogMiddleware.dayUpdated).toBeDefined();
      expect(createActivityLogMiddleware.dayDeleted).toBeDefined();
    });

    it('should provide helper for packing item operations', () => {
      expect(createActivityLogMiddleware.packingItemAdded).toBeDefined();
      expect(createActivityLogMiddleware.packingItemUpdated).toBeDefined();
      expect(createActivityLogMiddleware.packingItemDeleted).toBeDefined();
    });

    it('should provide helper for shopping item operations', () => {
      expect(createActivityLogMiddleware.shoppingItemAdded).toBeDefined();
      expect(createActivityLogMiddleware.shoppingItemUpdated).toBeDefined();
      expect(createActivityLogMiddleware.shoppingItemDeleted).toBeDefined();
    });

    it('should provide helper for trip operations', () => {
      expect(createActivityLogMiddleware.tripCreated).toBeDefined();
      expect(createActivityLogMiddleware.tripUpdated).toBeDefined();
      expect(createActivityLogMiddleware.tripDeleted).toBeDefined();
    });

    it('should provide helper for collaborator operations', () => {
      expect(createActivityLogMiddleware.collaboratorAdded).toBeDefined();
      expect(createActivityLogMiddleware.collaboratorRemoved).toBeDefined();
      expect(createActivityLogMiddleware.collaboratorRoleChanged).toBeDefined();
    });

    it('should provide helper for story operations', () => {
      expect(createActivityLogMiddleware.storyAdded).toBeDefined();
      expect(createActivityLogMiddleware.storyDeleted).toBeDefined();
    });

    it('should create middleware with correct action type', () => {
      const middleware = createActivityLogMiddleware.placeAdded();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing response data gracefully', async () => {
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      mockResponse.json!(null);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should not throw and should still call json
      expect(jsonMock).toHaveBeenCalledWith(null);
    });

    it('should handle empty response data', async () => {
      const middleware = activityLogMiddleware('place_added', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      mockResponse.json!({});
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(jsonMock).toHaveBeenCalledWith({});
    });

    it('should handle missing request body', async () => {
      mockRequest.body = undefined;
      mockRequest.method = 'PUT';
      const middleware = activityLogMiddleware('place_updated', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { id: 'place-789', name: 'Tokyo Tower', trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should not throw
      expect(jsonMock).toHaveBeenCalledWith(responseData);
    });

    it('should handle entityId from different param names', async () => {
      mockRequest.params = { tripId: 'trip-456', placeId: 'place-999' };
      const middleware = activityLogMiddleware('place_updated', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { name: 'Tokyo Tower', trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'place-999'
        })
      );
    });

    it('should use "unknown" as entityId if not found', async () => {
      mockRequest.params = { tripId: 'trip-456' };
      const middleware = activityLogMiddleware('place_updated', 'place');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const responseData = { name: 'Tokyo Tower', trip_id: 'trip-456' };
      mockResponse.json!(responseData);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'unknown'
        })
      );
    });
  });
});
