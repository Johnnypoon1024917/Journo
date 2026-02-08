import { Router } from 'express';
import { StoryController } from '../controllers/storyController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { createActivityLogMiddleware } from '../middleware/activityLogMiddleware.js';

const router = Router();

// Get all story items for a trip
router.get('/trips/:tripId/stories', optionalAuth, StoryController.getStoryItems);

// Create a new story item
router.post('/stories', authenticate, createActivityLogMiddleware.storyAdded(), StoryController.createStoryItem);

// Delete a story item
router.delete('/stories/:id', authenticate, createActivityLogMiddleware.storyDeleted(), StoryController.deleteStoryItem);

export default router;
