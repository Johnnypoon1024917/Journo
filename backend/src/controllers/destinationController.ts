import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { DestinationSuggestion } from '../types/index.js';

export class DestinationController {
  // Get suggestions for a specific month
  static async getSuggestionsForMonth(req: Request, res: Response) {
    try {
      const { month } = req.params;
      const userId = req.user?.userId;
      
      if (!month || isNaN(Number(month)) || Number(month) < 1 || Number(month) > 12) {
        return res.status(400).json({ error: 'Valid month (1-12) is required' });
      }

      // Get suggestions for the month, ordered by popularity
      const query = `
        SELECT * FROM destination_suggestions 
        WHERE month = $1 OR month IS NULL
        ORDER BY popularity_score DESC, created_at DESC
        LIMIT 8
      `;
      
      const result = await pool.query(query, [Number(month)]);
      let suggestions = result.rows;

      // If user is authenticated, personalize suggestions
      if (userId) {
        suggestions = await DestinationController.personalizeSuggestions(suggestions, userId);
      }

      res.json({ suggestions });
    } catch (error) {
      console.error('Error fetching destination suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch destination suggestions' });
    }
  }

  // Get all suggestions (admin only)
  static async getAllSuggestions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const query = `
        SELECT * FROM destination_suggestions 
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const countQuery = 'SELECT COUNT(*) FROM destination_suggestions';
      
      const [result, countResult] = await Promise.all([
        pool.query(query, [Number(limit), offset]),
        pool.query(countQuery)
      ]);

      res.json({
        suggestions: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      console.error('Error fetching all destination suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch destination suggestions' });
    }
  }

  // Create a new suggestion (admin only)
  static async createSuggestion(req: Request, res: Response) {
    try {
      const {
        destination_name,
        country,
        image_url,
        month,
        temperature_avg,
        weather_condition,
        why_now,
        climate_type,
        activity_type,
        popularity_score = 0
      } = req.body;

      if (!destination_name || !country) {
        return res.status(400).json({ error: 'Destination name and country are required' });
      }

      const query = `
        INSERT INTO destination_suggestions (
          destination_name, country, image_url, month, temperature_avg,
          weather_condition, why_now, climate_type, activity_type, popularity_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        destination_name,
        country,
        image_url,
        month,
        temperature_avg,
        weather_condition,
        why_now,
        climate_type,
        activity_type,
        popularity_score
      ];

      const result = await pool.query(query, values);
      res.status(201).json({ suggestion: result.rows[0] });
    } catch (error) {
      console.error('Error creating destination suggestion:', error);
      res.status(500).json({ error: 'Failed to create destination suggestion' });
    }
  }

  // Track user interaction with suggestion
  static async trackInteraction(req: Request, res: Response) {
    try {
      const { suggestionId } = req.params;
      const { interaction_type } = req.body;
      const userId = req.user?.userId;

      if (!interaction_type || !['view', 'click', 'quick_plan'].includes(interaction_type)) {
        return res.status(400).json({ error: 'Valid interaction_type is required (view, click, quick_plan)' });
      }

      const query = `
        INSERT INTO suggestion_interactions (user_id, suggestion_id, interaction_type)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const result = await pool.query(query, [userId, suggestionId, interaction_type]);
      
      // Update popularity score based on interaction
      if (interaction_type === 'click' || interaction_type === 'quick_plan') {
        const updateQuery = `
          UPDATE destination_suggestions 
          SET popularity_score = popularity_score + $1
          WHERE id = $2
        `;
        const scoreIncrement = interaction_type === 'quick_plan' ? 3 : 1;
        await pool.query(updateQuery, [scoreIncrement, suggestionId]);
      }

      res.json({ interaction: result.rows[0] });
    } catch (error) {
      console.error('Error tracking suggestion interaction:', error);
      res.status(500).json({ error: 'Failed to track interaction' });
    }
  }

  // Personalize suggestions based on user's past trips
  private static async personalizeSuggestions(
    suggestions: DestinationSuggestion[],
    userId: string
  ): Promise<DestinationSuggestion[]> {
    try {
      // Get user's past trips to analyze preferences
      const tripsQuery = `
        SELECT destination, theme, start_date, end_date
        FROM trips 
        WHERE owner_id = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      
      const tripsResult = await pool.query(tripsQuery, [userId]);
      const pastTrips = tripsResult.rows;

      if (pastTrips.length === 0) {
        return suggestions; // No personalization if no past trips
      }

      // Analyze user preferences
      const preferences = DestinationController.analyzeUserPreferences(pastTrips);
      
      // Re-rank suggestions based on preferences
      return suggestions
        .map(suggestion => ({
          ...suggestion,
          relevance_score: DestinationController.calculateRelevanceScore(suggestion, preferences)
        }))
        .sort((a, b) => (b as any).relevance_score - (a as any).relevance_score);
    } catch (error) {
      console.error('Error personalizing suggestions:', error);
      return suggestions; // Return original suggestions if personalization fails
    }
  }

  private static analyzeUserPreferences(pastTrips: any[]) {
    const themes = pastTrips.map(trip => trip.theme).filter(Boolean);
    const destinations = pastTrips.map(trip => trip.destination).filter(Boolean);
    
    // Analyze climate preference based on trip timing
    const monthCounts: { [key: number]: number } = {};
    pastTrips.forEach(trip => {
      if (trip.start_date) {
        const month = new Date(trip.start_date).getMonth() + 1;
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });

    const preferredMonths = Object.entries(monthCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([month]) => parseInt(month));

    return {
      preferred_themes: [...new Set(themes)],
      past_destinations: [...new Set(destinations)],
      preferred_months: preferredMonths
    };
  }

  private static calculateRelevanceScore(
    suggestion: DestinationSuggestion,
    preferences: any
  ): number {
    let score = suggestion.popularity_score || 0;

    // Boost score if destination matches activity preferences
    if (preferences.preferred_themes.includes('adventure') && 
        suggestion.activity_type?.includes('adventure')) {
      score += 10;
    }
    if (preferences.preferred_themes.includes('foodie') && 
        suggestion.activity_type?.includes('food')) {
      score += 10;
    }
    if (preferences.preferred_themes.includes('romantic') && 
        suggestion.activity_type?.includes('romantic')) {
      score += 10;
    }

    // Reduce score if user has already been to this destination
    if (preferences.past_destinations.some((dest: string) => 
        dest.toLowerCase().includes(suggestion.destination_name.toLowerCase()))) {
      score -= 5;
    }

    // Boost score if suggestion month matches user's preferred travel months
    if (suggestion.month && preferences.preferred_months.includes(suggestion.month)) {
      score += 5;
    }

    return score;
  }
}