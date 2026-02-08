import express from 'express';
import { CacheManagementService } from '../services/cacheManagementService.js';
import { LocationScraperService } from '../services/locationScraperService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get cache performance report (admin only)
router.get('/report', authenticateToken, async (_req, res) => {
  try {
    // In a real app, you'd check if user is admin
    const report = await CacheManagementService.getCacheReport();
    res.json(report);
  } catch (error) {
    console.error('Error getting cache report:', error);
    res.status(500).json({ error: 'Failed to get cache report' });
  }
});

// Get cache health status
router.get('/health', async (_req, res) => {
  try {
    const health = await CacheManagementService.healthCheck();
    res.json(health);
  } catch (error) {
    console.error('Error checking cache health:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Failed to check cache health' 
    });
  }
});

// Manual cache cleanup (admin only)
router.post('/cleanup', authenticateToken, async (_req, res) => {
  try {
    // In a real app, you'd check if user is admin
    const deletedCount = await CacheManagementService.manualCleanup();
    res.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} expired cache entries` 
    });
  } catch (error) {
    console.error('Error during manual cache cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup cache' });
  }
});

// Manual cache warming (admin only)
router.post('/warm', authenticateToken, async (_req, res) => {
  try {
    // In a real app, you'd check if user is admin
    await CacheManagementService.manualCacheWarming();
    res.json({ 
      success: true, 
      message: 'Cache warming completed successfully' 
    });
  } catch (error) {
    console.error('Error during manual cache warming:', error);
    res.status(500).json({ error: 'Failed to warm cache' });
  }
});

// Invalidate cache for specific destination (admin only)
router.delete('/destination/:destination', authenticateToken, async (req, res) => {
  try {
    // In a real app, you'd check if user is admin
    const { destination } = req.params;
    await LocationScraperService.invalidateCache(destination);
    res.json({ 
      success: true, 
      message: `Cache invalidated for destination: ${destination}` 
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
});

// Get cache statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    // In a real app, you'd check if user is admin
    const days = parseInt(req.query.days as string) || 7;
    const statistics = await LocationScraperService.getCacheStatisticsReport(days);
    res.json(statistics);
  } catch (error) {
    console.error('Error getting cache statistics:', error);
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});

// Get popular destinations
router.get('/popular-destinations', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const destinations = await LocationScraperService.getPopularDestinations(limit);
    res.json(destinations);
  } catch (error) {
    console.error('Error getting popular destinations:', error);
    res.status(500).json({ error: 'Failed to get popular destinations' });
  }
});

export default router;