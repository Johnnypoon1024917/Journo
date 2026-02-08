import { pool } from '../config/database.js';
import { LocationScraperService } from './locationScraperService.js';

export interface RegenerationMemory {
  userId: string;
  sessionId: string;
  rejectedPlaces: Array<{
    id: string;
    name: string;
    placeType: string;
    reason: 'user_removed' | 'user_replaced' | 'low_rating' | 'budget_mismatch';
    timestamp: string;
  }>;
  preferredPlaces: Array<{
    id: string;
    name: string;
    placeType: string;
    interestCategories: string[];
    priceRange: string;
    rating?: number;
    timestamp: string;
  }>;
  regenerationHistory: Array<{
    timestamp: string;
    parameters: any;
    resultQuality: number;
    placesGenerated: number;
    placesAccepted: number;
  }>;
  diversityPreferences: {
    avoidSimilarPlaces: boolean;
    preferNewExperiences: boolean;
    balanceIndoorOutdoor: boolean;
    mixPriceRanges: boolean;
  };
  lastUpdated: string;
}

export interface RegenerationRequest {
  userId: string;
  sessionId: string;
  travelInfo: any;
  currentSuggestions: any[];
  regenerationType: 'full' | 'partial' | 'modified_parameters';
  memoryConstraints: {
    excludePlaceIds: string[];
    preferredPlaceTypes: string[];
    diversityPreferences: any;
  };
  preservePreferences: boolean;
  diversityLevel: 'low' | 'medium' | 'high';
}

export interface RegenerationResponse {
  success: boolean;
  newSuggestions: any[];
  diversityScore: number;
  memoryApplied: boolean;
  alternativesGenerated: number;
  message: string;
}

export interface DiverseAlternativesRequest {
  referencePlace: any;
  destination: string;
  diversityLevel: 'low' | 'medium' | 'high';
  memoryConstraints: {
    excludePlaceIds: string[];
    preferredPlaceTypes: string[];
    diversityPreferences: any;
  };
}

export class RegenerationMemoryService {
  // Regenerate suggestions while avoiding previously rejected places
  static async regenerateWithMemory(request: RegenerationRequest): Promise<RegenerationResponse> {
    try {
      const { userId, sessionId, travelInfo, currentSuggestions, regenerationType, memoryConstraints } = request;
      
      // Get memory for this session
      const memory = await this.getMemory(userId, sessionId);
      
      // Combine memory constraints with request constraints
      const allExcludedIds = [
        ...memoryConstraints.excludePlaceIds,
        ...(memory?.rejectedPlaces.map(p => p.id) || [])
      ];
      
      const preferredTypes = [
        ...memoryConstraints.preferredPlaceTypes,
        ...(memory?.preferredPlaces.map(p => p.placeType) || [])
      ];
      
      // Generate new suggestions based on regeneration type
      let newSuggestions: any[] = [];
      
      switch (regenerationType) {
        case 'full':
          newSuggestions = await this.generateFullRegeneration(
            travelInfo, 
            allExcludedIds, 
            preferredTypes,
            request.diversityLevel
          );
          break;
          
        case 'partial':
          newSuggestions = await this.generatePartialRegeneration(
            currentSuggestions, 
            allExcludedIds, 
            preferredTypes,
            request.diversityLevel
          );
          break;
          
        case 'modified_parameters':
          newSuggestions = await this.generateModifiedParameterRegeneration(
            travelInfo, 
            currentSuggestions, 
            allExcludedIds,
            request.diversityLevel
          );
          break;
          
        default:
          throw new Error('Invalid regeneration type');
      }
      
      // Calculate diversity score
      const diversityScore = this.calculateDiversityScore(newSuggestions, currentSuggestions);
      
      // Update memory with new regeneration
      if (memory) {
        memory.regenerationHistory.push({
          timestamp: new Date().toISOString(),
          parameters: travelInfo,
          resultQuality: 0.5, // Will be updated based on user interactions
          placesGenerated: newSuggestions.reduce((sum, day) => sum + day.places.length, 0),
          placesAccepted: 0
        });
        
        await this.storeMemory(userId, memory);
      }
      
      return {
        success: true,
        newSuggestions,
        diversityScore,
        memoryApplied: true,
        alternativesGenerated: newSuggestions.reduce((sum, day) => sum + day.places.length, 0),
        message: 'Successfully regenerated with memory constraints'
      };
      
    } catch (error) {
      console.error('Error regenerating with memory:', error);
      
      // Fallback to basic regeneration
      return this.fallbackRegeneration(request);
    }
  }

  // Generate diverse alternatives based on memory and preferences
  static async generateDiverseAlternatives(request: DiverseAlternativesRequest): Promise<any[]> {
    try {
      const { referencePlace, destination, diversityLevel, memoryConstraints } = request;
      
      // Build search queries for diverse alternatives
      const searchQueries = this.buildDiverseSearchQueries(referencePlace, destination, diversityLevel);
      
      let allAlternatives: any[] = [];
      
      // Search for alternatives
      for (const query of searchQueries) {
        try {
          const places = await LocationScraperService.searchLocations(query);
          const convertedPlaces = places
            .filter(p => !memoryConstraints.excludePlaceIds.includes(p.location_name))
            .slice(0, 2)
            .map(p => ({
              id: `diverse-${Date.now()}-${Math.random()}`,
              name: p.location_name,
              address: p.source || '',
              coordinates: { lat: p.lat || 0, lng: p.lng || 0 },
              placeType: this.determinePlaceType(p.location_name, referencePlace.placeType),
              description: `A diverse alternative to ${referencePlace.name}`,
              estimatedDuration: this.estimateDuration(referencePlace.placeType),
              estimatedCost: this.estimateCost(diversityLevel),
              rating: p.rating || (4.0 + Math.random() * 1.0),
              source: 'diverse_generation',
              diversityScore: this.calculatePlaceDiversityScore(p, referencePlace, diversityLevel)
            }));
          
          allAlternatives = allAlternatives.concat(convertedPlaces);
        } catch (error) {
          console.error(`Error searching for diverse alternatives with query "${query}":`, error);
        }
      }
      
      // Sort by diversity score and return top results
      return allAlternatives
        .sort((a, b) => b.diversityScore - a.diversityScore)
        .slice(0, 5);
        
    } catch (error) {
      console.error('Error generating diverse alternatives:', error);
      return this.generateMockDiverseAlternatives(request.referencePlace, request.destination);
    }
  }

  // Memory management methods
  static async getMemory(userId: string, sessionId: string): Promise<RegenerationMemory | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT memory_data, last_updated
        FROM regeneration_memory 
        WHERE user_id = $1 AND session_id = $2
        AND last_updated > NOW() - INTERVAL '24 hours'
      `;
      
      const result = await client.query(query, [userId, sessionId]);
      
      if (result.rows.length > 0) {
        return {
          userId,
          sessionId,
          ...result.rows[0].memory_data,
          lastUpdated: result.rows[0].last_updated
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error fetching memory:', error);
      return null;
    } finally {
      client.release();
    }
  }

  static async storeMemory(userId: string, memory: RegenerationMemory): Promise<void> {
    const client = await pool.connect();
    
    try {
      // First verify the user exists
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        console.warn(`User ${userId} not found, skipping memory storage`);
        return; // Gracefully skip if user doesn't exist
      }

      const query = `
        INSERT INTO regeneration_memory (
          user_id, session_id, memory_data, last_updated, created_at, updated_at
        )
        VALUES ($1, $2, $3, NOW(), NOW(), NOW())
        ON CONFLICT (user_id, session_id) 
        DO UPDATE SET 
          memory_data = EXCLUDED.memory_data,
          last_updated = NOW(),
          updated_at = NOW()
      `;
      
      await client.query(query, [userId, memory.sessionId, JSON.stringify(memory)]);
      
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async clearMemory(userId: string, sessionId: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      const query = `
        DELETE FROM regeneration_memory 
        WHERE user_id = $1 AND session_id = $2
      `;
      
      await client.query(query, [userId, sessionId]);
      
    } catch (error) {
      console.error('Error clearing memory:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Helper methods for regeneration
  private static async generateFullRegeneration(
    travelInfo: any,
    excludePlaceIds: string[],
    preferredTypes: string[],
    diversityLevel: string
  ): Promise<any[]> {
    const suggestions: any[] = [];
    
    // Build search queries avoiding excluded places
    const searchQueries = this.buildRegenerationQueries(travelInfo, preferredTypes, diversityLevel);
    
    let allPlaces: any[] = [];
    
    // Search for new places
    for (const query of searchQueries) {
      try {
        const places = await LocationScraperService.searchLocations(query);
        const convertedPlaces = places
          .filter(p => !excludePlaceIds.includes(p.location_name))
          .slice(0, 3)
          .map(p => ({
            id: `regen-${Date.now()}-${Math.random()}`,
            name: p.location_name,
            address: p.source || '',
            coordinates: { lat: p.lat || 0, lng: p.lng || 0 },
            placeType: this.determinePlaceType(p.location_name, 'attraction'),
            description: `A new place in ${travelInfo.destination}`,
            estimatedDuration: this.estimateDuration('attraction'),
            estimatedCost: this.estimateCost(travelInfo.budgetLevel || 'medium'),
            rating: p.rating || (4.0 + Math.random() * 1.0),
            source: 'regeneration'
          }));
        
        allPlaces = allPlaces.concat(convertedPlaces);
      } catch (error) {
        console.error(`Error in regeneration search for "${query}":`, error);
      }
    }
    
    // Distribute places across days
    const placesPerDay = Math.ceil(allPlaces.length / travelInfo.duration);
    
    for (let day = 1; day <= travelInfo.duration; day++) {
      const dayDate = new Date(travelInfo.startDate);
      dayDate.setDate(dayDate.getDate() + day - 1);
      
      const startIdx = (day - 1) * placesPerDay;
      const endIdx = Math.min(startIdx + placesPerDay, allPlaces.length);
      const dayPlaces = allPlaces.slice(startIdx, endIdx);
      
      suggestions.push({
        dayNumber: day,
        date: dayDate.toISOString().split('T')[0],
        places: dayPlaces,
        totalTravelTime: dayPlaces.reduce((sum, place) => sum + 20, 0), // 20 min between places
        estimatedCost: dayPlaces.reduce((sum, place) => sum + place.estimatedCost, 0)
      });
    }
    
    return suggestions;
  }

  private static async generatePartialRegeneration(
    currentSuggestions: any[],
    excludePlaceIds: string[],
    preferredTypes: string[],
    diversityLevel: string
  ): Promise<any[]> {
    // Keep 50% of current places, regenerate the rest
    const newSuggestions = currentSuggestions.map(day => {
      const keepCount = Math.ceil(day.places.length * 0.5);
      const keptPlaces = day.places.slice(0, keepCount);
      
      // Generate new places for the remaining slots
      const newPlaces = [];
      for (let i = keepCount; i < day.places.length; i++) {
        newPlaces.push({
          id: `partial-regen-${Date.now()}-${i}`,
          name: `New Place ${i + 1}`,
          address: `New Address ${i + 1}`,
          coordinates: { lat: 40.7128 + Math.random() * 0.1, lng: -74.0060 + Math.random() * 0.1 },
          placeType: preferredTypes[i % preferredTypes.length] || 'attraction',
          description: 'A new place discovered through partial regeneration',
          estimatedDuration: this.estimateDuration('attraction'),
          estimatedCost: this.estimateCost('medium'),
          rating: 4.0 + Math.random() * 1.0,
          source: 'partial_regeneration'
        });
      }
      
      const allPlaces = [...keptPlaces, ...newPlaces];
      
      return {
        ...day,
        places: allPlaces,
        estimatedCost: allPlaces.reduce((sum, place) => sum + place.estimatedCost, 0)
      };
    });
    
    return newSuggestions;
  }

  private static async generateModifiedParameterRegeneration(
    travelInfo: any,
    currentSuggestions: any[],
    excludePlaceIds: string[],
    diversityLevel: string
  ): Promise<any[]> {
    // Similar to full regeneration but with modified parameters
    return this.generateFullRegeneration(travelInfo, excludePlaceIds, [], diversityLevel);
  }

  private static buildRegenerationQueries(travelInfo: any, preferredTypes: string[], diversityLevel: string): string[] {
    const queries: string[] = [];
    const destination = travelInfo.destination;
    
    // Base queries
    queries.push(`${destination} attractions`);
    queries.push(`${destination} restaurants`);
    
    // Preferred type queries
    preferredTypes.forEach(type => {
      queries.push(`${destination} ${type}`);
    });
    
    // Diversity-based queries
    if (diversityLevel === 'high') {
      queries.push(`${destination} hidden gems`);
      queries.push(`${destination} off the beaten path`);
      queries.push(`${destination} local favorites`);
    }
    
    // Interest-based queries
    if (travelInfo.interests && travelInfo.interests.length > 0) {
      travelInfo.interests.forEach((interest: any) => {
        const interestName = typeof interest === 'string' ? interest : interest.name || interest.id;
        queries.push(`${destination} ${interestName}`);
      });
    }
    
    return queries;
  }

  private static buildDiverseSearchQueries(referencePlace: any, destination: string, diversityLevel: string): string[] {
    const queries: string[] = [];
    
    // Different place types for diversity
    const alternativeTypes = ['attraction', 'food', 'shopping', 'entertainment', 'culture'];
    const currentType = referencePlace.placeType;
    
    alternativeTypes
      .filter(type => type !== currentType)
      .forEach(type => {
        queries.push(`${destination} ${type}`);
      });
    
    // Diversity level specific queries
    switch (diversityLevel) {
      case 'high':
        queries.push(`${destination} unique experiences`);
        queries.push(`${destination} unusual attractions`);
        queries.push(`${destination} alternative activities`);
        break;
        
      case 'medium':
        queries.push(`${destination} popular places`);
        queries.push(`${destination} recommended activities`);
        break;
        
      case 'low':
        queries.push(`${destination} ${currentType} alternatives`);
        queries.push(`${destination} similar to ${referencePlace.name}`);
        break;
    }
    
    return queries;
  }

  private static calculateDiversityScore(newSuggestions: any[], currentSuggestions: any[]): number {
    if (currentSuggestions.length === 0) return 1.0;
    
    const newPlaces = newSuggestions.flatMap(day => day.places);
    const currentPlaces = currentSuggestions.flatMap(day => day.places);
    
    let uniqueCount = 0;
    newPlaces.forEach(newPlace => {
      const isUnique = !currentPlaces.some(currentPlace => 
        currentPlace.name === newPlace.name ||
        (currentPlace.coordinates && newPlace.coordinates &&
         this.calculateDistance(currentPlace.coordinates, newPlace.coordinates) < 0.1)
      );
      if (isUnique) uniqueCount++;
    });
    
    return newPlaces.length > 0 ? uniqueCount / newPlaces.length : 0;
  }

  private static calculatePlaceDiversityScore(place: any, referencePlace: any, diversityLevel: string): number {
    let score = 0.5; // Base score
    
    // Type diversity
    const placeType = this.determinePlaceType(place.location_name, referencePlace.placeType);
    if (placeType !== referencePlace.placeType) {
      score += 0.3;
    }
    
    // Rating consideration
    if (place.rating && place.rating > 4.0) {
      score += 0.2;
    }
    
    // Diversity level adjustment
    switch (diversityLevel) {
      case 'high':
        score += 0.2;
        break;
      case 'low':
        score -= 0.1;
        break;
    }
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  private static calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static determinePlaceType(placeName: string, fallbackType: string): string {
    const lowerName = placeName.toLowerCase();
    
    if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('food')) {
      return 'food';
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
      'other': 90
    };
    
    return durations[placeType as keyof typeof durations] || 90;
  }

  private static estimateCost(budgetLevel: string): number {
    switch (budgetLevel) {
      case 'low': return Math.floor(Math.random() * 20) + 5;
      case 'medium': return Math.floor(Math.random() * 50) + 20;
      case 'high': return Math.floor(Math.random() * 100) + 50;
      default: return 30;
    }
  }

  private static fallbackRegeneration(request: RegenerationRequest): RegenerationResponse {
    // Simple fallback that generates new mock suggestions
    const newSuggestions = request.currentSuggestions.map((day, dayIndex) => {
      const newPlaces = day.places.map((place: any, placeIndex: number) => ({
        ...place,
        id: `fallback-${dayIndex}-${placeIndex}-${Date.now()}`,
        name: `Alternative ${place.placeType} ${placeIndex + 1}`,
        description: `An alternative ${place.placeType} option.`,
        estimatedCost: Math.floor(Math.random() * 50) + 10,
        rating: 4.0 + Math.random() * 1.0,
        source: 'fallback_regeneration'
      }));

      return {
        ...day,
        places: newPlaces,
        estimatedCost: newPlaces.reduce((sum: number, place: any) => sum + place.estimatedCost, 0)
      };
    });

    return {
      success: true,
      newSuggestions,
      diversityScore: 0.7,
      memoryApplied: false,
      alternativesGenerated: newSuggestions.reduce((sum, day) => sum + day.places.length, 0),
      message: 'Generated new suggestions using fallback method'
    };
  }

  private static generateMockDiverseAlternatives(referencePlace: any, destination: string): any[] {
    const alternatives = [];
    
    for (let i = 0; i < 3; i++) {
      alternatives.push({
        id: `mock-diverse-${Date.now()}-${i}`,
        name: `Diverse ${referencePlace.placeType} Option ${i + 1}`,
        address: `${Math.floor(Math.random() * 999)} Alternative St, ${destination}`,
        coordinates: { lat: 40.7128 + Math.random() * 0.1, lng: -74.0060 + Math.random() * 0.1 },
        placeType: referencePlace.placeType,
        description: `A diverse alternative ${referencePlace.placeType} in ${destination}.`,
        estimatedDuration: this.estimateDuration(referencePlace.placeType),
        estimatedCost: Math.floor(Math.random() * 50) + 10,
        rating: 4.0 + Math.random() * 1.0,
        source: 'mock_diverse_generation',
        diversityScore: 0.8 - (i * 0.1)
      });
    }
    
    return alternatives;
  }
}