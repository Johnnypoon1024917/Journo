import { Router } from 'express';
import { CommunityController } from '../controllers/communityController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Get all community trips (public, optional auth for liked status)
router.get('/trips', optionalAuth, CommunityController.getCommunityTrips);

// Like a trip (requires auth)
router.post('/trips/:id/like', authenticateToken, CommunityController.likeTrip);

// Unlike a trip (requires auth)
router.delete('/trips/:id/like', authenticateToken, CommunityController.unlikeTrip);

// Copy a trip (requires auth)
router.post('/trips/:id/copy', authenticateToken, CommunityController.copyTrip);

export default router;
