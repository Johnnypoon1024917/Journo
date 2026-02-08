import { pool } from '../config/database.js';
import { DestinationSuggestion } from '../types/index.js';

export class DestinationService {
  private static cache = new Map<string, { data: DestinationSuggestion[]; timestamp: number }>();
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Get suggestions with caching
  static async getSuggestionsForMonth(month: number, userId?: string): Promise<DestinationSuggestion[]> {
    const cacheKey = `suggestions_${month}_${userId || 'anonymous'}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Fetch from database
    const query = `
      SELECT * FROM destination_suggestions 
      WHERE month = $1 OR month IS NULL
      ORDER BY popularity_score DESC, created_at DESC
      LIMIT 8
    `;
    
    const result = await pool.query(query, [month]);
    let suggestions = result.rows;

    // Personalize if user is provided
    if (userId) {
      suggestions = await this.personalizeSuggestions(suggestions, userId);
    }

    // Cache the results
    this.cache.set(cacheKey, {
      data: suggestions,
      timestamp: Date.now()
    });

    return suggestions;
  }

  // Populate initial suggestion data
  static async populateInitialData(): Promise<void> {
    try {
      // Check if data already exists
      const countResult = await pool.query('SELECT COUNT(*) FROM destination_suggestions');
      const count = parseInt(countResult.rows[0].count);
      
      if (count > 0) {
        console.log('Destination suggestions already populated');
        return;
      }

      console.log('Populating initial destination suggestions...');

      const suggestions = [
        // January - Winter destinations
        {
          destination_name: 'Dubai',
          country: 'UAE',
          month: 1,
          temperature_avg: 24,
          weather_condition: 'Sunny',
          why_now: 'Perfect weather with cool temperatures and clear skies',
          climate_type: 'warm',
          activity_type: 'luxury,shopping,beach',
          popularity_score: 85,
          image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'
        },
        {
          destination_name: 'Tokyo',
          country: 'Japan',
          month: 1,
          temperature_avg: 6,
          weather_condition: 'Clear',
          why_now: 'New Year celebrations and winter illuminations',
          climate_type: 'cold',
          activity_type: 'culture,food,city',
          popularity_score: 90,
          image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800'
        },
        
        // February - Valentine's destinations
        {
          destination_name: 'Paris',
          country: 'France',
          month: 2,
          temperature_avg: 7,
          weather_condition: 'Cool',
          why_now: 'Romantic Valentine\'s atmosphere with fewer crowds',
          climate_type: 'cold',
          activity_type: 'romantic,culture,food',
          popularity_score: 95,
          image_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800'
        },
        {
          destination_name: 'Maldives',
          country: 'Maldives',
          month: 2,
          temperature_avg: 28,
          weather_condition: 'Sunny',
          why_now: 'Dry season with perfect weather for water activities',
          climate_type: 'tropical',
          activity_type: 'beach,romantic,luxury',
          popularity_score: 88,
          image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
        },

        // March - Spring destinations
        {
          destination_name: 'Kyoto',
          country: 'Japan',
          month: 3,
          temperature_avg: 13,
          weather_condition: 'Mild',
          why_now: 'Cherry blossom season begins',
          climate_type: 'temperate',
          activity_type: 'culture,nature,photography',
          popularity_score: 92,
          image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'
        },
        {
          destination_name: 'Morocco',
          country: 'Morocco',
          month: 3,
          temperature_avg: 20,
          weather_condition: 'Pleasant',
          why_now: 'Perfect weather before summer heat',
          climate_type: 'warm',
          activity_type: 'adventure,culture,food',
          popularity_score: 80,
          image_url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800'
        },

        // April - Spring destinations
        {
          destination_name: 'Istanbul',
          country: 'Turkey',
          month: 4,
          temperature_avg: 16,
          weather_condition: 'Mild',
          why_now: 'Beautiful spring weather and blooming tulips',
          climate_type: 'temperate',
          activity_type: 'culture,history,food',
          popularity_score: 85,
          image_url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800'
        },
        {
          destination_name: 'Greece',
          country: 'Greece',
          month: 4,
          temperature_avg: 18,
          weather_condition: 'Pleasant',
          why_now: 'Mild weather and Easter celebrations',
          climate_type: 'mediterranean',
          activity_type: 'history,beach,culture',
          popularity_score: 87,
          image_url: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800'
        },

        // May - Late spring destinations
        {
          destination_name: 'Croatia',
          country: 'Croatia',
          month: 5,
          temperature_avg: 22,
          weather_condition: 'Warm',
          why_now: 'Perfect weather before summer crowds',
          climate_type: 'mediterranean',
          activity_type: 'beach,nature,adventure',
          popularity_score: 89,
          image_url: 'https://images.unsplash.com/photo-1555990538-c3d2f7f10d3c?w=800'
        },
        {
          destination_name: 'Nepal',
          country: 'Nepal',
          month: 5,
          temperature_avg: 20,
          weather_condition: 'Clear',
          why_now: 'Best trekking season with clear mountain views',
          climate_type: 'mountain',
          activity_type: 'adventure,trekking,nature',
          popularity_score: 82,
          image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'
        },

        // June - Summer destinations
        {
          destination_name: 'Norway',
          country: 'Norway',
          month: 6,
          temperature_avg: 15,
          weather_condition: 'Cool',
          why_now: 'White nights and midnight sun',
          climate_type: 'cold',
          activity_type: 'nature,adventure,photography',
          popularity_score: 86,
          image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
        },
        {
          destination_name: 'Portugal',
          country: 'Portugal',
          month: 6,
          temperature_avg: 23,
          weather_condition: 'Sunny',
          why_now: 'Perfect beach weather and festival season',
          climate_type: 'mediterranean',
          activity_type: 'beach,culture,food',
          popularity_score: 88,
          image_url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800'
        }
      ];

      // Insert suggestions in batches
      for (const suggestion of suggestions) {
        const query = `
          INSERT INTO destination_suggestions (
            destination_name, country, month, temperature_avg, weather_condition,
            why_now, climate_type, activity_type, popularity_score, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const values = [
          suggestion.destination_name,
          suggestion.country,
          suggestion.month,
          suggestion.temperature_avg,
          suggestion.weather_condition,
          suggestion.why_now,
          suggestion.climate_type,
          suggestion.activity_type,
          suggestion.popularity_score,
          suggestion.image_url
        ];

        await pool.query(query, values);
      }

      console.log(`Populated ${suggestions.length} destination suggestions`);
    } catch (error) {
      console.error('Error populating destination suggestions:', error);
      throw error;
    }
  }

  // Track interaction and update popularity
  static async trackInteraction(
    userId: string | null,
    suggestionId: string,
    interactionType: 'view' | 'click' | 'quick_plan'
  ): Promise<void> {
    try {
      // Insert interaction record
      const interactionQuery = `
        INSERT INTO suggestion_interactions (user_id, suggestion_id, interaction_type)
        VALUES ($1, $2, $3)
      `;
      await pool.query(interactionQuery, [userId, suggestionId, interactionType]);

      // Update popularity score
      if (interactionType === 'click' || interactionType === 'quick_plan') {
        const scoreIncrement = interactionType === 'quick_plan' ? 3 : 1;
        const updateQuery = `
          UPDATE destination_suggestions 
          SET popularity_score = popularity_score + $1
          WHERE id = $2
        `;
        await pool.query(updateQuery, [scoreIncrement, suggestionId]);
      }

      // Clear cache to ensure fresh data
      this.clearCache();
    } catch (error) {
      console.error('Error tracking suggestion interaction:', error);
      throw error;
    }
  }

  // Clear cache
  static clearCache(): void {
    this.cache.clear();
  }

  // Personalize suggestions based on user history
  private static async personalizeSuggestions(
    suggestions: DestinationSuggestion[],
    userId: string
  ): Promise<DestinationSuggestion[]> {
    try {
      // Get user's past trips
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
        return suggestions;
      }

      // Analyze preferences
      const preferences = this.analyzeUserPreferences(pastTrips);
      
      // Re-rank suggestions
      return suggestions
        .map(suggestion => ({
          ...suggestion,
          relevance_score: this.calculateRelevanceScore(suggestion, preferences)
        }))
        .sort((a, b) => (b as any).relevance_score - (a as any).relevance_score);
    } catch (error) {
      console.error('Error personalizing suggestions:', error);
      return suggestions;
    }
  }

  private static analyzeUserPreferences(pastTrips: any[]) {
    const themes = pastTrips.map(trip => trip.theme).filter(Boolean);
    const destinations = pastTrips.map(trip => trip.destination).filter(Boolean);
    
    // Analyze preferred travel months
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

    // Analyze climate preferences based on trip timing
    const climatePreference = this.analyzeClimatePreference(pastTrips);
    
    // Analyze trip duration preferences
    const durationPreference = this.analyzeDurationPreference(pastTrips);

    return {
      preferred_themes: [...new Set(themes)],
      past_destinations: [...new Set(destinations)],
      preferred_months: preferredMonths,
      climate_preference: climatePreference,
      duration_preference: durationPreference
    };
  }

  private static analyzeClimatePreference(pastTrips: any[]): string {
    const climateCounts: { [key: string]: number } = {};
    
    pastTrips.forEach(trip => {
      if (trip.start_date) {
        const month = new Date(trip.start_date).getMonth() + 1;
        // Categorize months by climate
        if ([12, 1, 2].includes(month)) {
          climateCounts['cold'] = (climateCounts['cold'] || 0) + 1;
        } else if ([6, 7, 8].includes(month)) {
          climateCounts['warm'] = (climateCounts['warm'] || 0) + 1;
        } else if ([3, 4, 5, 9, 10, 11].includes(month)) {
          climateCounts['temperate'] = (climateCounts['temperate'] || 0) + 1;
        }
      }
    });

    // Return the most preferred climate
    const sortedClimates = Object.entries(climateCounts)
      .sort(([,a], [,b]) => b - a);
    
    return sortedClimates.length > 0 ? sortedClimates[0][0] : 'temperate';
  }

  private static analyzeDurationPreference(pastTrips: any[]): number {
    const durations = pastTrips
      .filter(trip => trip.start_date && trip.end_date)
      .map(trip => {
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      });

    if (durations.length === 0) return 7; // Default to 7 days

    // Return average duration
    const avgDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    return Math.round(avgDuration);
  }

  private static calculateRelevanceScore(
    suggestion: DestinationSuggestion,
    preferences: any
  ): number {
    let score = suggestion.popularity_score || 0;

    // Theme-based activity matching (stronger weight)
    if (preferences.preferred_themes.includes('adventure') && 
        suggestion.activity_type?.includes('adventure')) {
      score += 15;
    }
    if (preferences.preferred_themes.includes('foodie') && 
        suggestion.activity_type?.includes('food')) {
      score += 15;
    }
    if (preferences.preferred_themes.includes('romantic') && 
        suggestion.activity_type?.includes('romantic')) {
      score += 15;
    }
    if (preferences.preferred_themes.includes('chill') && 
        (suggestion.activity_type?.includes('beach') || suggestion.activity_type?.includes('luxury'))) {
      score += 15;
    }

    // Climate preference matching
    if (preferences.climate_preference && suggestion.climate_type) {
      if (preferences.climate_preference === suggestion.climate_type) {
        score += 10;
      } else if (
        (preferences.climate_preference === 'warm' && suggestion.climate_type === 'tropical') ||
        (preferences.climate_preference === 'temperate' && suggestion.climate_type === 'mediterranean')
      ) {
        score += 5; // Related climate types get partial boost
      }
    }

    // Avoid repeated destinations (stronger penalty)
    if (preferences.past_destinations.some((dest: string) => 
        dest.toLowerCase().includes(suggestion.destination_name.toLowerCase()))) {
      score -= 10;
    }

    // Preferred month matching
    if (suggestion.month && preferences.preferred_months.includes(suggestion.month)) {
      score += 8;
    }

    // Boost newer suggestions slightly
    if (suggestion.created_at) {
      const daysSinceCreated = (Date.now() - new Date(suggestion.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 30) {
        score += 2; // Small boost for suggestions added in last 30 days
      }
    }

    return Math.max(0, score); // Ensure score doesn't go negative
  }
}