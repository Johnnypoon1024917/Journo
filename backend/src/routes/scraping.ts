import express from 'express';
import { ScrapingController } from '../controllers/scrapingController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/scrape/locations - Scrape locations (optional auth for tracking)
router.post('/locations', optionalAuth, ScrapingController.scrapeLocations);

// POST /api/scrape/track-selection - Track location selection (optional auth)
router.post('/track-selection', optionalAuth, ScrapingController.trackLocationSelection);

// GET /api/scrape/analytics - Get search analytics (requires auth)
router.get('/analytics', authenticateToken, ScrapingController.getSearchAnalytics);

// GET /api/scrape/trends - Get search trends (requires auth)
router.get('/trends', authenticateToken, ScrapingController.getSearchTrends);

// GET /api/scrape/cache-stats - Get cache statistics (requires auth)
router.get('/cache-stats', authenticateToken, ScrapingController.getCacheStatistics);

export default router;
