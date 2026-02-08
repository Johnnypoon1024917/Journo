import express from 'express';
import { TripController } from '../controllers/tripController.js';
import { StoryController } from '../controllers/storyController.js';
import { QuickPlanController } from '../controllers/quickPlanController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { createActivityLogMiddleware } from '../middleware/activityLogMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/shared/:token', TripController.getTripByToken);
router.get('/shared/:token/days', TripController.getDaysByToken);

// Story routes (optional auth for public trips)
router.get('/:tripId/stories', optionalAuth, StoryController.getStoryItems);

// Protected routes (authentication required)
router.use(authenticate);

// Quick Plan routes
router.post('/quick-plan/generate', QuickPlanController.generateQuickPlan);
router.post('/quick-plan/create-from-suggestions', QuickPlanController.createTripFromSuggestions);

// Trip CRUD operations
router.post('/', createActivityLogMiddleware.tripCreated(), TripController.createTrip);
router.get('/', TripController.getTrips);
router.get('/:id', TripController.getTripById);
router.put('/:id', createActivityLogMiddleware.tripUpdated(), TripController.updateTrip);
router.delete('/:id', createActivityLogMiddleware.tripDeleted(), TripController.deleteTrip);

// Trip reordering
router.post('/reorder', TripController.reorderTrips);

export default router;
