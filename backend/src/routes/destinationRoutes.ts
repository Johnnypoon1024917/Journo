import { Router } from 'express';
import { DestinationController } from '../controllers/destinationController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Test endpoint to debug auth issues
router.get('/test', (req, res) => {
  console.log('Test endpoint hit, user:', req.user);
  res.json({ message: 'Test endpoint working', user: req.user || null });
});

// Public routes (with optional auth for personalization)
router.get('/suggestions/month/:month', (req, _res, next) => {
  console.log('Month suggestions endpoint hit, user:', req.user);
  next();
}, optionalAuth, DestinationController.getSuggestionsForMonth);

// Protected routes
router.post('/suggestions/:suggestionId/interactions', authenticate, DestinationController.trackInteraction);

// Admin routes (TODO: Add admin middleware when implemented)
router.get('/suggestions', authenticate, DestinationController.getAllSuggestions);
router.post('/suggestions', authenticate, DestinationController.createSuggestion);

export default router;