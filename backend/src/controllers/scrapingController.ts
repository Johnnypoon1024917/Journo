import { Request, Response } from 'express';
import { LocationScraperService } from '../services/locationScraperService.js';

export class ScrapingController {
  // POST /api/scrape/locations - Scrape locations for a search query
  static async scrapeLocations(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.body;
      const userId = req.user?.userId;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({
          error: 'Query parameter is required and must be a non-empty string'
        });
        return;
      }

      if (query.length > 100) {
        res.status(400).json({
          error: 'Query parameter must be less than 100 characters'
        });
        return;
      }

      console.log(`Scraping locations for query: "${query}" (User: ${userId || 'anonymous'})`);

      // Scrape locations with caching and debouncing
      const locations = await LocationScraperService.searchLocationsDebounced(query, userId);

      res.json({
        success: true,
        query,
        results: locations,
        count: locations.length,
        cached: true // This would be determined by the service
      });

    } catch (error) {
      console.error('Error in scrapeLocations controller:', error);
      res.status(500).json({
        error: 'Failed to scrape locations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/scrape/analytics - Get search analytics (admin only)
  static async getSearchAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Check if user is admin (you might want to implement proper admin middleware)
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 100;
      
      if (limit > 1000) {
        res.status(400).json({
          error: 'Limit cannot exceed 1000'
        });
        return;
      }

      const analytics = await LocationScraperService.getSearchAnalytics(limit);

      res.json({
        success: true,
        analytics,
        count: analytics.length
      });

    } catch (error) {
      console.error('Error in getSearchAnalytics controller:', error);
      res.status(500).json({
        error: 'Failed to get search analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/scrape/track-selection - Track when user selects a scraped location
  static async trackLocationSelection(req: Request, res: Response): Promise<void> {
    try {
      const { query, locationId } = req.body;
      const userId = req.user?.userId;

      if (!query || !locationId) {
        res.status(400).json({
          error: 'Query and locationId are required'
        });
        return;
      }

      await LocationScraperService.trackLocationSelection(userId, query, locationId);

      res.json({
        success: true,
        message: 'Location selection tracked'
      });

    } catch (error) {
      console.error('Error in trackLocationSelection controller:', error);
      res.status(500).json({
        error: 'Failed to track location selection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/scrape/trends - Get search trends (admin only)
  static async getSearchTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const days = parseInt(req.query.days as string) || 7;
      
      if (days > 90) {
        res.status(400).json({
          error: 'Days cannot exceed 90'
        });
        return;
      }

      const trends = await LocationScraperService.getSearchTrends(days);

      res.json({
        success: true,
        trends,
        days,
        count: trends.length
      });

    } catch (error) {
      console.error('Error in getSearchTrends controller:', error);
      res.status(500).json({
        error: 'Failed to get search trends',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/scrape/cache-stats - Get cache statistics (admin only)
  static async getCacheStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const stats = await LocationScraperService.getCacheStatistics();

      res.json({
        success: true,
        statistics: stats
      });

    } catch (error) {
      console.error('Error in getCacheStatistics controller:', error);
      res.status(500).json({
        error: 'Failed to get cache statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}