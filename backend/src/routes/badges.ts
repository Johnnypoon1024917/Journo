import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getUserBadges, 
  getUserBadgesByUserId, 
  checkBadges 
} from '../controllers/badgeController.js';

const router = Router();

// Get current user's badges
router.get('/', authenticateToken, getUserBadges);

// Get badges for a specific user
router.get('/user/:userId', getUserBadgesByUserId);

// Manually trigger badge checks (for testing)
router.post('/check', authenticateToken, checkBadges);

export default router;