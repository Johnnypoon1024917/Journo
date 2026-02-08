import { Router, Request, Response } from 'express';
import { ComprehensivePlaceScrapingService } from '../services/comprehensivePlaceScrapingService.js';
import { ScrapingSchedulerService } from '../services/scrapingSchedulerService.js';
import { pool } from '../config/database.js';

const router = Router();

// Manual trigger for scraping (admin only)
router.post('/trigger-scraping', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Manual scraping triggered...');
    
    // Check if scraping is already running
    if (ScrapingSchedulerService.isScrapingRunning()) {
      return res.status(409).json({
        success: false,
        message: 'Scraping is already in progress'
      });
    }

    // Trigger manual scraping (don't wait for completion)
    ScrapingSchedulerService.triggerManualScraping().catch(error => {
      console.error('Manual scraping failed:', error);
    });

    res.json({
      success: true,
      message: 'Scraping started successfully',
      status: 'running'
    });

  } catch (error) {
    console.error('Error triggering scraping:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get scraping status
router.get('/scraping-status', async (req: Request, res: Response) => {
  try {
    const isRunning = ScrapingSchedulerService.isScrapingRunning();
    
    // Get database stats
    const placesCount = await pool.query('SELECT COUNT(*) as count FROM places');
    const destinationsCount = await pool.query('SELECT COUNT(*) as count FROM top_destinations');
    const lastScraped = await pool.query(`
      SELECT MAX(last_scraped) as last_scraped 
      FROM top_destinations 
      WHERE last_scraped IS NOT NULL
    `);

    res.json({
      success: true,
      status: {
        isRunning,
        placesInDatabase: parseInt(placesCount.rows[0].count),
        destinationsTracked: parseInt(destinationsCount.rows[0].count),
        lastScraped: lastScraped.rows[0].last_scraped
      }
    });

  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get places statistics
router.get('/places-stats', async (req: Request, res: Response) => {
  try {
    // Get places by source
    const bySource = await pool.query(`
      SELECT source, COUNT(*) as count 
      FROM places 
      GROUP BY source 
      ORDER BY count DESC
    `);

    // Get places by city
    const byCity = await pool.query(`
      SELECT city, country, COUNT(*) as count 
      FROM places 
      GROUP BY city, country 
      ORDER BY count DESC 
      LIMIT 10
    `);

    // Get top rated places
    const topRated = await pool.query(`
      SELECT name, city, country, rating, review_count, source 
      FROM places 
      WHERE rating IS NOT NULL 
      ORDER BY rating DESC, review_count DESC 
      LIMIT 10
    `);

    // Get most popular places (by our analytics)
    const mostPopular = await pool.query(`
      SELECT name, city, country, popularity_score, rating 
      FROM places 
      WHERE popularity_score > 0 
      ORDER BY popularity_score DESC 
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: {
        bySource: bySource.rows,
        byCity: byCity.rows,
        topRated: topRated.rows,
        mostPopular: mostPopular.rows
      }
    });

  } catch (error) {
    console.error('Error getting places stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test place search
router.post('/test-search', async (req: Request, res: Response) => {
  try {
    const { query = 'Tokyo attractions' } = req.body;
    
    console.log(`🔍 Testing place search for: ${query}`);
    
    // Import the service dynamically
    const { LocationScraperService } = await import('../services/locationScraperService.js');
    
    const results = await LocationScraperService.searchLocations(query);
    
    // Group by source
    const bySource = results.reduce((acc: any, result: any) => {
      acc[result.source] = (acc[result.source] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      query,
      totalResults: results.length,
      resultsBySource: bySource,
      sampleResults: results.slice(0, 10).map(r => ({
        name: r.location_name,
        city: r.city || 'Unknown',
        country: r.country || 'Unknown',
        source: r.source,
        rating: r.rating,
        popularity: r.popularity_score,
        tips: r.tips?.substring(0, 100)
      }))
    });
    
  } catch (error) {
    console.error('❌ Search test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add sample places for testing
router.post('/add-sample-places', async (req: Request, res: Response) => {
  try {
    const { city = 'Tokyo', country = 'Japan' } = req.body;
    
    console.log(`📍 Adding sample places for ${city}, ${country}...`);
    
    // Add some sample places using the comprehensive scraping service
    const samplePlaces = [
      {
        name: `${city} Central Station`,
        description: `Main transportation hub in ${city}`,
        city,
        country,
        place_type: 'transportation',
        category: 'transport',
        rating: 4.0,
        source: 'manual',
        source_id: `manual_${city.toLowerCase()}_station`
      },
      {
        name: `${city} City Museum`,
        description: `Learn about the history and culture of ${city}`,
        city,
        country,
        place_type: 'museum',
        category: 'culture',
        rating: 4.2,
        source: 'manual',
        source_id: `manual_${city.toLowerCase()}_museum`
      },
      {
        name: `${city} Central Park`,
        description: `Beautiful green space in the heart of ${city}`,
        city,
        country,
        place_type: 'park',
        category: 'nature',
        rating: 4.1,
        source: 'manual',
        source_id: `manual_${city.toLowerCase()}_park`
      }
    ];

    let addedCount = 0;
    for (const place of samplePlaces) {
      try {
        const query = `
          INSERT INTO places (name, description, city, country, place_type, category, rating, source, source_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (source, source_id) DO NOTHING
          RETURNING id
        `;
        
        const result = await pool.query(query, [
          place.name,
          place.description,
          place.city,
          place.country,
          place.place_type,
          place.category,
          place.rating,
          place.source,
          place.source_id
        ]);
        
        if (result.rows.length > 0) {
          addedCount++;
        }
      } catch (error) {
        console.error(`Error adding place ${place.name}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Added ${addedCount} sample places for ${city}, ${country}`,
      addedCount
    });

  } catch (error) {
    console.error('Error adding sample places:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;