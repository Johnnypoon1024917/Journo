import { Request, Response, NextFunction } from 'express';
import { activityLogService, ActivityActionType } from '../services/activityLogService.js';

/**
 * Middleware to automatically log activities for trip-related operations
 * 
 * This middleware intercepts the response to log successful operations
 * without blocking the main request flow.
 * 
 * @param actionType - The type of activity being performed
 * @param entityType - The type of entity being affected (e.g., 'place', 'day', 'packing_item')
 * @returns Express middleware function
 */
export const activityLogMiddleware = (
  actionType: ActivityActionType,
  entityType: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store the original json method
    const originalJson = res.json.bind(res);
    
    // Override the json method to intercept the response
    res.json = function(data: any) {
      // Log activity after successful response (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Extract user ID from request
        const userId = req.user?.userId;
        
        // Extract trip ID from params or response data
        const tripId = req.params.tripId || req.params.trip_id || data.trip_id;
        
        // Only log if we have both user and trip
        if (userId && tripId) {
          // Extract entity ID from response data or params
          const entityId = data?.id || req.params.id || req.params.placeId || req.params.dayId;
          
          // Extract entity name based on entity type
          const entityName = extractEntityName(data, entityType);
          
          // Extract changes from request body and response data
          const changes = extractChanges(req.body, data, req.method);
          
          // Extract metadata
          const metadata = {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            method: req.method,
            path: req.path
          };
          
          // Log activity asynchronously without blocking the response
          activityLogService.logActivity({
            tripId,
            userId,
            actionType,
            entityType,
            entityId: entityId || 'unknown',
            entityName,
            changes,
            metadata
          }).catch(err => {
            // Log error but don't throw - activity logging should not break the main flow
            console.error('Failed to log activity:', err);
          });
        }
      }
      
      // Call the original json method to send the response
      return originalJson(data);
    };
    
    // Continue to the next middleware/handler
    next();
  };
};

/**
 * Extract a human-readable entity name from the response data
 * 
 * @param data - Response data
 * @param entityType - Type of entity
 * @returns Human-readable entity name
 */
function extractEntityName(data: any, entityType: string): string {
  if (!data) {
    return 'Unknown';
  }
  
  switch (entityType) {
    case 'place':
      return data.name || data.place_name || 'Unnamed place';
    
    case 'day':
      if (data.title) {
        return data.title;
      }
      if (data.day_number !== undefined) {
        return `Day ${data.day_number}`;
      }
      return 'Unnamed day';
    
    case 'packing_item':
      return data.item_name || data.name || 'Unnamed item';
    
    case 'shopping_item':
      return data.name || data.item_name || 'Unnamed item';
    
    case 'trip':
      return data.title || data.name || 'Unnamed trip';
    
    case 'collaborator':
      if (data.user) {
        return data.user.name || data.user.email || 'Unknown user';
      }
      return data.email || 'Unknown user';
    
    case 'story':
      if (data.place_name) {
        return `Story at ${data.place_name}`;
      }
      return 'Story item';
    
    default:
      return data.title || data.name || data.item_name || 'Unnamed';
  }
}

/**
 * Extract changes from request body and response data
 * 
 * For POST requests (create), we capture the created data
 * For PUT/PATCH requests (update), we capture what changed
 * For DELETE requests, we capture what was deleted
 * 
 * @param requestBody - Request body data
 * @param responseData - Response data
 * @param method - HTTP method
 * @returns Object containing the changes
 */
function extractChanges(
  requestBody: any,
  responseData: any,
  method: string
): Record<string, any> {
  const changes: Record<string, any> = {};
  
  if (!requestBody && !responseData) {
    return changes;
  }
  
  // For DELETE operations, capture what was deleted
  if (method === 'DELETE') {
    if (responseData) {
      changes.deleted = responseData;
    }
    return changes;
  }
  
  // For POST operations (create), capture the created data
  if (method === 'POST') {
    if (responseData) {
      // Capture key fields that were created
      const fieldsToCapture = [
        'name', 'title', 'description', 'item_name',
        'day_number', 'role', 'quantity', 'category',
        'start_time', 'end_time', 'location'
      ];
      
      fieldsToCapture.forEach(field => {
        if (responseData[field] !== undefined) {
          changes[field] = { to: responseData[field] };
        }
      });
    }
    return changes;
  }
  
  // For PUT/PATCH operations (update), compare request and response
  if (method === 'PUT' || method === 'PATCH') {
    if (requestBody && responseData) {
      // Compare each field in the request body with the response
      for (const key in requestBody) {
        if (requestBody[key] !== responseData[key]) {
          changes[key] = {
            from: responseData[key],
            to: requestBody[key]
          };
        }
      }
    }
    return changes;
  }
  
  return changes;
}

/**
 * Helper function to create activity log middleware for common operations
 */
export const createActivityLogMiddleware = {
  // Place operations
  placeAdded: () => activityLogMiddleware('place_added', 'place'),
  placeUpdated: () => activityLogMiddleware('place_updated', 'place'),
  placeDeleted: () => activityLogMiddleware('place_deleted', 'place'),
  placeReordered: () => activityLogMiddleware('place_reordered', 'place'),
  
  // Day operations
  dayAdded: () => activityLogMiddleware('day_added', 'day'),
  dayUpdated: () => activityLogMiddleware('day_updated', 'day'),
  dayDeleted: () => activityLogMiddleware('day_deleted', 'day'),
  
  // Packing item operations
  packingItemAdded: () => activityLogMiddleware('packing_item_added', 'packing_item'),
  packingItemUpdated: () => activityLogMiddleware('packing_item_updated', 'packing_item'),
  packingItemDeleted: () => activityLogMiddleware('packing_item_deleted', 'packing_item'),
  
  // Shopping item operations
  shoppingItemAdded: () => activityLogMiddleware('shopping_item_added', 'shopping_item'),
  shoppingItemUpdated: () => activityLogMiddleware('shopping_item_updated', 'shopping_item'),
  shoppingItemDeleted: () => activityLogMiddleware('shopping_item_deleted', 'shopping_item'),
  
  // Trip operations
  tripCreated: () => activityLogMiddleware('trip_created', 'trip'),
  tripUpdated: () => activityLogMiddleware('trip_updated', 'trip'),
  tripDeleted: () => activityLogMiddleware('trip_deleted', 'trip'),
  
  // Collaborator operations
  collaboratorAdded: () => activityLogMiddleware('collaborator_added', 'collaborator'),
  collaboratorRemoved: () => activityLogMiddleware('collaborator_removed', 'collaborator'),
  collaboratorRoleChanged: () => activityLogMiddleware('collaborator_role_changed', 'collaborator'),
  
  // Story operations
  storyAdded: () => activityLogMiddleware('story_added', 'story'),
  storyDeleted: () => activityLogMiddleware('story_deleted', 'story')
};
