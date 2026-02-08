import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { activityLogService } from '../../services/activityLogService';

// Mock the activity log service
vi.mock('../../services/activityLogService', () => ({
  activityLogService: {
    logActivity: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock authentication middleware
vi.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
  }
}));

describe('Activity Log Middleware Integration', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Place Routes', () => {
    it('should log activity when creating a place', async () => {
      // Import routes after mocks are set up
      const placesRouter = (await import('../places')).default;
      
      // Mock the controller to return success
      vi.mock('../../controllers/placeController', () => ({
        PlaceController: {
          createPlace: (req: any, res: any) => {
            res.status(201).json({
              id: 'place-123',
              name: 'Tokyo Tower',
              trip_id: 'trip-123'
            });
          }
        }
      }));

      app.use('/api/places', placesRouter);

      const response = await request(app)
        .post('/api/places')
        .send({
          name: 'Tokyo Tower',
          trip_id: 'trip-123'
        });

      expect(response.status).toBe(201);
      
      // Verify activity was logged
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'place_added',
          entityType: 'place'
        })
      );
    });
  });

  describe('Day Routes', () => {
    it('should log activity when creating a day', async () => {
      const daysRouter = (await import('../days')).default;
      
      vi.mock('../../controllers/dayController', () => ({
        DayController: {
          createDay: (req: any, res: any) => {
            res.status(201).json({
              id: 'day-123',
              title: 'Day 1',
              day_number: 1,
              trip_id: 'trip-123'
            });
          }
        }
      }));

      app.use('/api/days', daysRouter);

      const response = await request(app)
        .post('/api/days')
        .send({
          title: 'Day 1',
          trip_id: 'trip-123'
        });

      expect(response.status).toBe(201);
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'day_added',
          entityType: 'day'
        })
      );
    });
  });

  describe('Packing Routes', () => {
    it('should log activity when adding a packing item', async () => {
      const packingRouter = (await import('../packingRoutes')).default;
      
      vi.mock('../../controllers/packingController', () => ({
        addPackingItem: (req: any, res: any) => {
          res.status(201).json({
            id: 'item-123',
            item_name: 'Passport',
            trip_id: 'trip-123'
          });
        }
      }));

      app.use('/api', packingRouter);

      const response = await request(app)
        .post('/api/trips/trip-123/packing')
        .send({
          item_name: 'Passport'
        });

      expect(response.status).toBe(201);
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'packing_item_added',
          entityType: 'packing_item'
        })
      );
    });
  });

  describe('Collaborator Routes', () => {
    it('should log activity when adding a collaborator', async () => {
      const collaboratorsRouter = (await import('../collaborators')).default;
      
      vi.mock('../../controllers/collaboratorController', () => ({
        addCollaborator: (req: any, res: any) => {
          res.status(201).json({
            id: 'collab-123',
            user: {
              name: 'John Doe',
              email: 'john@example.com'
            },
            trip_id: 'trip-123'
          });
        }
      }));

      app.use('/api', collaboratorsRouter);

      const response = await request(app)
        .post('/api/trips/trip-123/collaborators')
        .send({
          email: 'john@example.com',
          role: 'editor'
        });

      expect(response.status).toBe(201);
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'collaborator_added',
          entityType: 'collaborator'
        })
      );
    });
  });

  describe('Story Routes', () => {
    it('should log activity when creating a story', async () => {
      const storiesRouter = (await import('../stories')).default;
      
      vi.mock('../../controllers/storyController', () => ({
        StoryController: {
          createStoryItem: (req: any, res: any) => {
            res.status(201).json({
              id: 'story-123',
              place_name: 'Tokyo Tower',
              trip_id: 'trip-123'
            });
          }
        }
      }));

      app.use('/api', storiesRouter);

      const response = await request(app)
        .post('/api/stories')
        .send({
          place_name: 'Tokyo Tower',
          trip_id: 'trip-123'
        });

      expect(response.status).toBe(201);
      
      expect(activityLogService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'story_added',
          entityType: 'story'
        })
      );
    });
  });
});
