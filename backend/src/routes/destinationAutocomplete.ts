import { Router } from 'express';
import { pool } from '../config/database.js';

const router = Router();

// Get destination suggestions for autocomplete
router.get('/autocomplete', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchQuery = query.toLowerCase().trim();

    // Search in destination_suggestions table
    const result = await pool.query(
      `SELECT DISTINCT 
        destination_name as name,
        country,
        image_url,
        popularity_score
      FROM destination_suggestions 
      WHERE 
        LOWER(destination_name) LIKE $1 OR 
        LOWER(country) LIKE $1
      ORDER BY popularity_score DESC, destination_name ASC
      LIMIT $2`,
      [`%${searchQuery}%`, limit]
    );

    // Also search in a list of popular destinations if no results
    let suggestions = result.rows;

    if (suggestions.length === 0) {
      // Fallback to popular destinations
      const popularDestinations = [
        { name: 'Tokyo', country: 'Japan', popularity_score: 95 },
        { name: 'Paris', country: 'France', popularity_score: 92 },
        { name: 'London', country: 'United Kingdom', popularity_score: 90 },
        { name: 'New York', country: 'United States', popularity_score: 88 },
        { name: 'Rome', country: 'Italy', popularity_score: 85 },
        { name: 'Barcelona', country: 'Spain', popularity_score: 83 },
        { name: 'Amsterdam', country: 'Netherlands', popularity_score: 80 },
        { name: 'Bangkok', country: 'Thailand', popularity_score: 78 },
        { name: 'Sydney', country: 'Australia', popularity_score: 76 },
        { name: 'Dubai', country: 'UAE', popularity_score: 74 }
      ];

      suggestions = popularDestinations
        .filter(dest => 
          dest.name.toLowerCase().includes(searchQuery) || 
          dest.country.toLowerCase().includes(searchQuery)
        )
        .slice(0, parseInt(limit.toString()));
    }

    res.json({ 
      suggestions: suggestions.map(s => ({
        name: s.name,
        country: s.country,
        displayName: `${s.name}, ${s.country}`,
        image_url: s.image_url || null,
        popularity_score: s.popularity_score || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching destination autocomplete:', error);
    res.status(500).json({ error: 'Failed to fetch destination suggestions' });
  }
});

// Get popular destinations for initial display
router.get('/popular', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const result = await pool.query(
      `SELECT 
        destination_name as name,
        country,
        image_url,
        popularity_score,
        activity_type,
        climate_type
      FROM destination_suggestions 
      ORDER BY popularity_score DESC
      LIMIT $1`,
      [limit]
    );

    res.json({ 
      destinations: result.rows.map(d => ({
        name: d.name,
        country: d.country,
        displayName: `${d.name}, ${d.country}`,
        image_url: d.image_url,
        popularity_score: d.popularity_score,
        activity_type: d.activity_type,
        climate_type: d.climate_type
      }))
    });

  } catch (error) {
    console.error('Error fetching popular destinations:', error);
    res.status(500).json({ error: 'Failed to fetch popular destinations' });
  }
});

export default router;