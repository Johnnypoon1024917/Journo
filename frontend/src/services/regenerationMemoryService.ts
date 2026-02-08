import { apiRequest } from './api';
import { getAuthToken } from '../utils/auth';

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
    resultQuality: number; // 0-1 score based on user interactions
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
  travelInfo: any;
  currentSuggestions: any[];
  regenerationType: 'full' | 'partial' | 'modified_parameters';
  modifiedParameters?: {
    interests?: any[];
    budgetLevel?: string;
    travelStyle?: string;
    mustVisitPlaces?: string[];
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

export interface SuggestionDiversityAnalysis {
  placeTypeDistribution: { [type: string]: number };
  priceRangeDistribution: { [range: string]: number };
  interestCoverage: { [interest: string]: number };
  geographicalSpread: number; // 0-1 score
  uniquenessScore: number; // 0-1 score based on how different from previous suggestions
  recommendedImprovements: string[];
}

export class RegenerationMemoryService {
  private static readonly STORAGE_KEY = 'quick_plan_memory';
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Initialize or get current session memory
  static async initializeSession(userId: string, _travelInfo: any): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const memory: RegenerationMemory = {
      userId,
      sessionId,
      rejectedPlaces: [],
      preferredPlaces: [],
      regenerationHistory: [],
      diversityPreferences: {
        avoidSimilarPlaces: true,
        preferNewExperiences: true,
        balanceIndoorOutdoor: true,
        mixPriceRanges: false
      },
      lastUpdated: new Date().toISOString()
    };

    // Store in localStorage for immediate access
    this.storeMemoryLocally(sessionId, memory);

    // Also store on server for persistence
    try {
      await this.storeMemoryOnServer(memory);
    } catch (error) {
      console.warn('Failed to store memory on server:', error);
    }

    return sessionId;
  }

  // Regenerate suggestions while avoiding previously rejected places
  static async regenerateWithMemory(
    sessionId: string,
    request: RegenerationRequest
  ): Promise<RegenerationResponse> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      // Get current memory
      const memory = await this.getMemory(sessionId);
      
      // Prepare regeneration request with memory constraints
      const memoryConstraints = {
        excludePlaceIds: memory?.rejectedPlaces.map(p => p.id) || [],
        preferredPlaceTypes: memory?.preferredPlaces.map(p => p.placeType) || [],
        diversityPreferences: memory?.diversityPreferences || {},
        regenerationHistory: memory?.regenerationHistory || []
      };

      // Call backend regeneration service
      const response = await apiRequest<RegenerationResponse>('/quick-plan/regenerate-with-memory', {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          sessionId,
          memoryConstraints
        }),
        token
      });

      // Update memory with new regeneration
      if (memory && response.success) {
        memory.regenerationHistory.push({
          timestamp: new Date().toISOString(),
          parameters: request.modifiedParameters || request.travelInfo,
          resultQuality: 0.5, // Will be updated based on user interactions
          placesGenerated: response.newSuggestions.reduce((sum, day) => sum + day.places.length, 0),
          placesAccepted: 0 // Will be updated when user accepts/rejects places
        });

        memory.lastUpdated = new Date().toISOString();
        await this.updateMemory(sessionId, memory);
      }

      return response;

    } catch (error) {
      console.error('Error regenerating with memory:', error);
      
      // Fallback to basic regeneration without memory
      return this.fallbackRegeneration(request);
    }
  }

  // Create suggestion diversity algorithms for varied options
  static async analyzeSuggestionDiversity(
    suggestions: any[],
    previousSuggestions?: any[]
  ): Promise<SuggestionDiversityAnalysis> {
    const analysis: SuggestionDiversityAnalysis = {
      placeTypeDistribution: {},
      priceRangeDistribution: {},
      interestCoverage: {},
      geographicalSpread: 0,
      uniquenessScore: 0,
      recommendedImprovements: []
    };

    // Analyze place type distribution
    const allPlaces = suggestions.flatMap(day => day.places);
    allPlaces.forEach(place => {
      analysis.placeTypeDistribution[place.placeType] = 
        (analysis.placeTypeDistribution[place.placeType] || 0) + 1;
    });

    // Analyze price range distribution
    allPlaces.forEach(place => {
      const priceRange = this.getPriceRange(place.estimatedCost);
      analysis.priceRangeDistribution[priceRange] = 
        (analysis.priceRangeDistribution[priceRange] || 0) + 1;
    });

    // Calculate geographical spread (simplified)
    if (allPlaces.length > 1) {
      const coordinates = allPlaces
        .filter(place => place.coordinates)
        .map(place => place.coordinates);
      
      if (coordinates.length > 1) {
        analysis.geographicalSpread = this.calculateGeographicalSpread(coordinates);
      }
    }

    // Calculate uniqueness score compared to previous suggestions
    if (previousSuggestions && previousSuggestions.length > 0) {
      analysis.uniquenessScore = this.calculateUniquenessScore(suggestions, previousSuggestions);
    } else {
      analysis.uniquenessScore = 1.0; // First generation is always unique
    }

    // Generate recommendations for improvement
    analysis.recommendedImprovements = this.generateDiversityRecommendations(analysis);

    return analysis;
  }

  // Track suggestion history for improved recommendations
  static async trackSuggestionHistory(
    sessionId: string,
    suggestions: any[],
    userInteractions: Array<{
      action: 'accepted' | 'rejected' | 'modified';
      placeId: string;
      timestamp: string;
    }>
  ): Promise<void> {
    try {
      const memory = await this.getMemory(sessionId);
      if (!memory) return;

      // Update rejected places
      userInteractions
        .filter(interaction => interaction.action === 'rejected')
        .forEach(interaction => {
          const place = suggestions
            .flatMap(day => day.places)
            .find(p => p.id === interaction.placeId);
          
          if (place && !memory.rejectedPlaces.some(rp => rp.id === place.id)) {
            memory.rejectedPlaces.push({
              id: place.id,
              name: place.name,
              placeType: place.placeType,
              reason: 'user_removed',
              timestamp: interaction.timestamp
            });
          }
        });

      // Update preferred places
      userInteractions
        .filter(interaction => interaction.action === 'accepted')
        .forEach(interaction => {
          const place = suggestions
            .flatMap(day => day.places)
            .find(p => p.id === interaction.placeId);
          
          if (place && !memory.preferredPlaces.some(pp => pp.id === place.id)) {
            memory.preferredPlaces.push({
              id: place.id,
              name: place.name,
              placeType: place.placeType,
              interestCategories: [], // Would be derived from place analysis
              priceRange: this.getPriceRange(place.estimatedCost),
              rating: place.rating,
              timestamp: interaction.timestamp
            });
          }
        });

      // Update the latest regeneration quality score
      if (memory.regenerationHistory.length > 0) {
        const latestRegeneration = memory.regenerationHistory[memory.regenerationHistory.length - 1];
        const acceptedCount = userInteractions.filter(i => i.action === 'accepted').length;
        const totalInteractions = userInteractions.length;
        
        if (totalInteractions > 0) {
          latestRegeneration.resultQuality = acceptedCount / totalInteractions;
          latestRegeneration.placesAccepted = acceptedCount;
        }
      }

      memory.lastUpdated = new Date().toISOString();
      await this.updateMemory(sessionId, memory);

    } catch (error) {
      console.error('Error tracking suggestion history:', error);
    }
  }

  // Generate diverse alternatives based on memory and preferences
  static async generateDiverseAlternatives(
    sessionId: string,
    referencePlace: any,
    destination: string,
    diversityLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<any[]> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const memory = await this.getMemory(sessionId);
      
      const request = {
        referencePlace,
        destination,
        diversityLevel,
        memoryConstraints: {
          excludePlaceIds: memory?.rejectedPlaces.map(p => p.id) || [],
          preferredPlaceTypes: memory?.preferredPlaces.map(p => p.placeType) || [],
          diversityPreferences: memory?.diversityPreferences || {}
        }
      };

      const response = await apiRequest<{ success: boolean; alternatives: any[] }>('/quick-plan/diverse-alternatives', {
        method: 'POST',
        body: JSON.stringify(request),
        token
      });

      return response.alternatives || [];

    } catch (error) {
      console.error('Error generating diverse alternatives:', error);
      return this.generateMockDiverseAlternatives(referencePlace, destination);
    }
  }

  // Memory management methods
  static async getMemory(sessionId: string): Promise<RegenerationMemory | null> {
    // Try localStorage first for immediate access
    const localMemory = this.getMemoryLocally(sessionId);
    if (localMemory) {
      return localMemory;
    }

    // Fallback to server
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await apiRequest<{ success: boolean; data: RegenerationMemory }>(`/quick-plan/memory/${sessionId}`, {
        method: 'GET',
        token
      });

      if (response.data) {
        this.storeMemoryLocally(sessionId, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching memory from server:', error);
    }

    return null;
  }

  static async updateMemory(sessionId: string, memory: RegenerationMemory): Promise<void> {
    // Update localStorage
    this.storeMemoryLocally(sessionId, memory);

    // Update server
    const token = getAuthToken();
    if (token) {
      try {
        await this.storeMemoryOnServer(memory);
      } catch (error) {
        console.warn('Failed to update memory on server:', error);
      }
    }
  }

  static async clearMemory(sessionId: string): Promise<void> {
    // Clear localStorage
    const allMemory = this.getAllLocalMemory();
    delete allMemory[sessionId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMemory));

    // Clear server
    const token = getAuthToken();
    if (token) {
      try {
        await apiRequest(`/quick-plan/memory/${sessionId}`, {
          method: 'DELETE',
          token
        });
      } catch (error) {
        console.warn('Failed to clear memory on server:', error);
      }
    }
  }

  // Local storage helpers
  private static storeMemoryLocally(sessionId: string, memory: RegenerationMemory): void {
    try {
      const allMemory = this.getAllLocalMemory();
      allMemory[sessionId] = memory;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMemory));
    } catch (error) {
      console.error('Error storing memory locally:', error);
    }
  }

  private static getMemoryLocally(sessionId: string): RegenerationMemory | null {
    try {
      const allMemory = this.getAllLocalMemory();
      const memory = allMemory[sessionId];
      
      if (memory) {
        // Check if memory is still valid (not expired)
        const lastUpdated = new Date(memory.lastUpdated);
        const now = new Date();
        if (now.getTime() - lastUpdated.getTime() > this.SESSION_DURATION) {
          delete allMemory[sessionId];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMemory));
          return null;
        }
        
        return memory;
      }
    } catch (error) {
      console.error('Error getting memory locally:', error);
    }
    
    return null;
  }

  private static getAllLocalMemory(): { [sessionId: string]: RegenerationMemory } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error parsing local memory:', error);
      return {};
    }
  }

  private static async storeMemoryOnServer(memory: RegenerationMemory): Promise<void> {
    const token = getAuthToken();
    if (!token) return;

    await apiRequest('/quick-plan/memory', {
      method: 'POST',
      body: JSON.stringify(memory),
      token
    });
  }

  // Helper methods
  private static getPriceRange(cost: number): string {
    if (cost <= 20) return 'low';
    if (cost <= 50) return 'medium';
    return 'high';
  }

  private static calculateGeographicalSpread(coordinates: Array<{ lat: number; lng: number }>): number {
    if (coordinates.length < 2) return 0;

    let maxDistance = 0;
    for (let i = 0; i < coordinates.length; i++) {
      for (let j = i + 1; j < coordinates.length; j++) {
        const distance = this.calculateDistance(coordinates[i], coordinates[j]);
        maxDistance = Math.max(maxDistance, distance);
      }
    }

    // Normalize to 0-1 scale (assuming max reasonable distance is 50km for city exploration)
    return Math.min(maxDistance / 50, 1.0);
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

  private static calculateUniquenessScore(currentSuggestions: any[], previousSuggestions: any[]): number {
    const currentPlaces = currentSuggestions.flatMap(day => day.places);
    const previousPlaces = previousSuggestions.flatMap(day => day.places);
    
    if (previousPlaces.length === 0) return 1.0;

    let uniqueCount = 0;
    currentPlaces.forEach(currentPlace => {
      const isUnique = !previousPlaces.some(prevPlace => 
        prevPlace.name === currentPlace.name || 
        (prevPlace.coordinates && currentPlace.coordinates &&
         this.calculateDistance(prevPlace.coordinates, currentPlace.coordinates) < 0.1) // Within 100m
      );
      if (isUnique) uniqueCount++;
    });

    return currentPlaces.length > 0 ? uniqueCount / currentPlaces.length : 0;
  }

  private static generateDiversityRecommendations(analysis: SuggestionDiversityAnalysis): string[] {
    const recommendations: string[] = [];

    // Check place type diversity
    const placeTypes = Object.keys(analysis.placeTypeDistribution);
    if (placeTypes.length < 3) {
      recommendations.push('Consider adding more variety in place types (attractions, restaurants, activities)');
    }

    // Check price range diversity
    const priceRanges = Object.keys(analysis.priceRangeDistribution);
    if (priceRanges.length < 2) {
      recommendations.push('Mix different price ranges for a more balanced experience');
    }

    // Check geographical spread
    if (analysis.geographicalSpread < 0.3) {
      recommendations.push('Explore different areas of the destination for more variety');
    }

    // Check uniqueness
    if (analysis.uniquenessScore < 0.7) {
      recommendations.push('Try regenerating for more unique and diverse suggestions');
    }

    return recommendations;
  }

  private static async fallbackRegeneration(request: RegenerationRequest): Promise<RegenerationResponse> {
    // Simple fallback that generates new mock suggestions
    const newSuggestions = request.currentSuggestions.map((day, dayIndex) => {
      const newPlaces = day.places.map((place: any, placeIndex: number) => ({
        ...place,
        id: `fallback-${dayIndex}-${placeIndex}-${Date.now()}`,
        name: `Alternative ${place.placeType} ${placeIndex + 1}`,
        description: `An alternative ${place.placeType} option.`,
        estimatedCost: Math.floor(Math.random() * 50) + 10,
        rating: 4.0 + Math.random() * 1.0
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
        ...referencePlace,
        id: `diverse-alt-${Date.now()}-${i}`,
        name: `Diverse ${referencePlace.placeType} Option ${i + 1}`,
        description: `A diverse alternative ${referencePlace.placeType} in ${destination}.`,
        estimatedCost: Math.floor(Math.random() * 50) + 10,
        estimatedDuration: Math.floor(Math.random() * 120) + 30,
        rating: 4.0 + Math.random() * 1.0,
        source: 'diverse_generation'
      });
    }
    
    return alternatives;
  }
}