import { pool } from '../config/database.js';
import { LocationScraperService } from './locationScraperService.js';

export interface SimilarityRequest {
  referencePlace: {
    id: string;
    name: string;
    placeType: string;
    interests: string[];
    priceRange: string;
  };
  destination: string;
  excludePlaceIds: string[];
  similarityFactors: ('type' | 'price' | 'interests' | 'location' | 'rating')[];
  maxResults: number;
}

export interface UserPreferenceLearning {
  userId: string;
  interactionType: 'place_removed' | 'place_replaced' | 'place_liked' | 'regenerated' | 'count_adjusted';
  placeData: {
    id: string;
    name: string;
    placeType: string;
    interests: string[];
    priceRange: string;
    rating?: number;
  };
  contextData: {
    destination: string;
    travelStyle: string;
    budgetLevel: string;
    dayNumber: number;
  };
  timestamp: string;
}

export interface CustomizationPreferences {
  userId: string;
  rejectedPlaces: string[];
  preferredPlaceTypes: string[];
  interestWeights: { [interestId: string]: number };
  budgetPreferences: {
    level: 'low' | 'medium' | 'high';
    maxPerPlace: number;
    preferredCategories: string[];
  };
  travelStylePreferences: {
    style: 'relaxed' | 'moderate' | 'fast-paced';
    placesPerDay: number;
    preferredTimeSlots: string[];
  };
  mustVisitPlaces: string[];
  lastUpdated: string;
}

export class PlaceCustomizationService {
  // Find similar places using similarity algorithms
  static async findSimilarPlaces(request: SimilarityRequest): Promise<any[]> {
    const { referencePlace, destination, excludePlaceIds, similarityFactors, maxResults } = request;
    
    try {
      // Build search queries based on similarity factors
      const searchQueries = this.buildSimilarityQueries(referencePlace, destination, similarityFactors);
      
      let allSimilarPlaces: any[] = [];
      
      // Search for similar places using location scraper
      for (const query of searchQueries) {
        try {
          const places = await LocationScraperService.searchLocations(query);
          const convertedPlaces = places
            .filter(p => !excludePlaceIds.includes(p.location_name))
            .slice(0, Math.ceil(maxResults / searchQueries.length))
            .map(p => ({
              id: `similar-${Date.now()}-${Math.random()}`,
              name: p.location_name,
              address: p.source || '',
              coordinates: { lat: p.lat || 0, lng: p.lng || 0 },
              placeType: this.determinePlaceType(p.location_name, referencePlace.placeType),
              description: `A ${referencePlace.placeType} similar to ${referencePlace.name}`,
              estimatedDuration: this.estimateDuration(referencePlace.placeType),
              estimatedCost: this.estimateCostFromPriceRange(referencePlace.priceRange),
              rating: p.rating || (4.0 + Math.random() * 1.0),
              source: 'similarity_search',
              similarityScore: this.calculateSimilarityScore(p, referencePlace, similarityFactors)
            }));
          
          allSimilarPlaces = allSimilarPlaces.concat(convertedPlaces);
        } catch (error) {
          console.error(`Error searching for similar places with query "${query}":`, error);
        }
      }
      
      // Sort by similarity score and return top results
      return allSimilarPlaces
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, maxResults);
        
    } catch (error) {
      console.error('Error finding similar places:', error);
      return this.generateMockSimilarPlaces(referencePlace, destination, maxResults);
    }
  }

  // Learn from user interactions for personalization
  static async learnFromUserInteraction(interaction: UserPreferenceLearning): Promise<void> {
    const client = await pool.connect();
    
    try {
      // Store user interaction for learning
      const query = `
        INSERT INTO user_preference_interactions (
          user_id, interaction_type, place_data, context_data, timestamp, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id, place_data->>'id', interaction_type) 
        DO UPDATE SET 
          context_data = EXCLUDED.context_data,
          timestamp = EXCLUDED.timestamp,
          updated_at = NOW()
      `;
      
      await client.query(query, [
        interaction.userId,
        interaction.interactionType,
        JSON.stringify(interaction.placeData),
        JSON.stringify(interaction.contextData),
        interaction.timestamp
      ]);
      
      // Update user preferences based on interaction
      await this.updateUserPreferencesFromInteraction(client, interaction);
      
    } catch (error) {
      console.error('Error learning from user interaction:', error);
      // Don't throw - this is non-critical functionality
    } finally {
      client.release();
    }
  }

  // Get user preferences for personalization
  static async getUserPreferences(userId: string): Promise<CustomizationPreferences | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT preferences_data, last_updated
        FROM user_customization_preferences 
        WHERE user_id = $1
      `;
      
      const result = await client.query(query, [userId]);
      
      if (result.rows.length > 0) {
        return {
          userId,
          ...result.rows[0].preferences_data,
          lastUpdated: result.rows[0].last_updated
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    } finally {
      client.release();
    }
  }

  // Update user preferences
  static async updateUserPreferences(userId: string, preferences: Partial<CustomizationPreferences>): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO user_customization_preferences (
          user_id, preferences_data, last_updated, created_at, updated_at
        )
        VALUES ($1, $2, NOW(), NOW(), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          preferences_data = EXCLUDED.preferences_data,
          last_updated = NOW(),
          updated_at = NOW()
      `;
      
      await client.query(query, [userId, JSON.stringify(preferences)]);
      
      return true;
      
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    } finally {
      client.release();
    }
  }

  // Helper methods
  private static buildSimilarityQueries(
    referencePlace: any, 
    destination: string, 
    similarityFactors: string[]
  ): string[] {
    const queries: string[] = [];
    
    // Base query with place type
    if (similarityFactors.includes('type')) {
      queries.push(`${destination} ${referencePlace.placeType}`);
      queries.push(`${destination} best ${referencePlace.placeType}`);
    }
    
    // Interest-based queries
    if (similarityFactors.includes('interests') && referencePlace.interests.length > 0) {
      referencePlace.interests.forEach((interest: string) => {
        queries.push(`${destination} ${interest} ${referencePlace.placeType}`);
      });
    }
    
    // Price-based queries
    if (similarityFactors.includes('price')) {
      const priceTerms = {
        'low': ['budget', 'cheap', 'affordable'],
        'medium': ['mid-range', 'moderate'],
        'high': ['luxury', 'premium', 'upscale']
      };
      
      const terms = priceTerms[referencePlace.priceRange as keyof typeof priceTerms] || ['popular'];
      terms.forEach(term => {
        queries.push(`${destination} ${term} ${referencePlace.placeType}`);
      });
    }
    
    // Fallback query
    if (queries.length === 0) {
      queries.push(`${destination} ${referencePlace.placeType}`);
    }
    
    return queries;
  }

  private static calculateSimilarityScore(
    place: any, 
    referencePlace: any, 
    similarityFactors: string[]
  ): number {
    let score = 0;
    let factorCount = 0;
    
    // Type similarity
    if (similarityFactors.includes('type')) {
      const placeType = this.determinePlaceType(place.location_name, referencePlace.placeType);
      score += placeType === referencePlace.placeType ? 1 : 0.5;
      factorCount++;
    }
    
    // Rating similarity
    if (similarityFactors.includes('rating') && place.rating && referencePlace.rating) {
      const ratingDiff = Math.abs(place.rating - referencePlace.rating);
      score += Math.max(0, 1 - (ratingDiff / 5)); // Normalize to 0-1
      factorCount++;
    }
    
    // Price similarity (simplified)
    if (similarityFactors.includes('price')) {
      score += 0.7; // Default moderate similarity for price
      factorCount++;
    }
    
    return factorCount > 0 ? score / factorCount : 0.5;
  }

  private static async updateUserPreferencesFromInteraction(
    client: any, 
    interaction: UserPreferenceLearning
  ): Promise<void> {
    try {
      // Get current preferences
      const currentPrefs = await this.getUserPreferences(interaction.userId);
      
      let updatedPrefs: Partial<CustomizationPreferences> = currentPrefs || {
        userId: interaction.userId,
        rejectedPlaces: [],
        preferredPlaceTypes: [],
        interestWeights: {},
        budgetPreferences: {
          level: 'medium',
          maxPerPlace: 100,
          preferredCategories: []
        },
        travelStylePreferences: {
          style: 'moderate',
          placesPerDay: 5,
          preferredTimeSlots: []
        },
        mustVisitPlaces: [],
        lastUpdated: new Date().toISOString()
      };
      
      // Update based on interaction type
      switch (interaction.interactionType) {
        case 'place_removed':
          if (!updatedPrefs.rejectedPlaces!.includes(interaction.placeData.id)) {
            updatedPrefs.rejectedPlaces!.push(interaction.placeData.id);
          }
          break;
          
        case 'place_liked':
          if (!updatedPrefs.preferredPlaceTypes!.includes(interaction.placeData.placeType)) {
            updatedPrefs.preferredPlaceTypes!.push(interaction.placeData.placeType);
          }
          break;
          
        case 'count_adjusted':
          if (updatedPrefs.travelStylePreferences) {
            updatedPrefs.travelStylePreferences.style = interaction.contextData.travelStyle as any;
          }
          break;
      }
      
      updatedPrefs.lastUpdated = new Date().toISOString();
      
      // Store updated preferences
      await this.updateUserPreferences(interaction.userId, updatedPrefs);
      
    } catch (error) {
      console.error('Error updating preferences from interaction:', error);
    }
  }

  private static determinePlaceType(placeName: string, fallbackType: string): string {
    const lowerName = placeName.toLowerCase();
    
    if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('food')) {
      return 'food';
    }
    if (lowerName.includes('hotel') || lowerName.includes('resort') || lowerName.includes('accommodation')) {
      return 'hotel';
    }
    if (lowerName.includes('museum') || lowerName.includes('temple') || lowerName.includes('palace')) {
      return 'attraction';
    }
    if (lowerName.includes('shop') || lowerName.includes('market') || lowerName.includes('mall')) {
      return 'shopping';
    }
    
    return fallbackType || 'attraction';
  }

  private static estimateDuration(placeType: string): number {
    const durations = {
      'food': 90,
      'attraction': 120,
      'shopping': 60,
      'hotel': 30,
      'other': 90
    };
    
    return durations[placeType as keyof typeof durations] || 90;
  }

  private static estimateCostFromPriceRange(priceRange: string): number {
    switch (priceRange) {
      case 'low': return Math.floor(Math.random() * 20) + 5;
      case 'medium': return Math.floor(Math.random() * 50) + 20;
      case 'high': return Math.floor(Math.random() * 100) + 50;
      default: return 30;
    }
  }

  private static generateMockSimilarPlaces(referencePlace: any, destination: string, maxResults: number): any[] {
    const mockPlaces = [];
    
    for (let i = 0; i < maxResults; i++) {
      mockPlaces.push({
        id: `mock-similar-${Date.now()}-${i}`,
        name: `Similar ${referencePlace.placeType} ${i + 1}`,
        address: `${Math.floor(Math.random() * 999)} Main St, ${destination}`,
        coordinates: { lat: 40.7128 + Math.random() * 0.1, lng: -74.0060 + Math.random() * 0.1 },
        placeType: referencePlace.placeType,
        description: `A ${referencePlace.placeType} similar to ${referencePlace.name} in ${destination}.`,
        estimatedDuration: this.estimateDuration(referencePlace.placeType),
        estimatedCost: this.estimateCostFromPriceRange(referencePlace.priceRange),
        rating: 4.0 + Math.random() * 1.0,
        source: 'mock_similarity',
        similarityScore: 0.8 - (i * 0.1)
      });
    }
    
    return mockPlaces;
  }
}