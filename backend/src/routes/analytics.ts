import express from 'express';
import { receiveEvents, getEventsSummary, getTopEvents, getUserActivity } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public endpoint for receiving analytics events (no auth required for privacy)
router.post('/events', receiveEvents);

// Protected endpoints for analytics data (admin only)
router.get('/summary', authenticateToken, getEventsSummary);
router.get('/top-events', authenticateToken, getTopEvents);
router.get('/user/:userId', authenticateToken, getUserActivity);

export default router;