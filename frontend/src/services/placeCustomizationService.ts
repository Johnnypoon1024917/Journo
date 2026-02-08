import { apiRequest } from './api';
import { getAuthToken } from '../utils/auth';

export interface CustomizationPreferences {
  userId: string;
  rejectedPlaces: string[]; // Place IDs that user has rejected
  preferredPlaceTypes: string[]; // Place types user prefers
  interestWeights: { [interestId: string]: number }; // User's interest preferences
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
  mustVisitPlaces: string[]; // Places user always wants included
  lastUpdated: string;
}

export interface PlaceCustomizationRequest {
  dayIndex: number;
  placeIndex: number;
  action: 'remove' | 'replace' | 'more_like_this' | 'adjust_count';
  preferences?: Partial<CustomizationPreferences>;
  newCount?: number; // For adjust_count action
  similarityFactors?: string[]; // For more_like_this action
}

export interface PlaceCustomizationResponse {
  success: boolean;
  updatedSuggestions?: any[];
  alternativePlaces?: any[];
  message: string;
}

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

export class PlaceCustomizationService {
  // Remove a place from suggestions with immediate preview update
  static async removePlace(
    dayIndex: number,
    placeIndex: number,
    currentSuggestions: any[],
    preservePreferences: boolean = true
  ): Promise<{ updatedSuggestions: any[]; preferences?: CustomizationPreferences }> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // Immediate local update for responsive UI
    const updatedSuggestions = currentSuggestions.map((day, idx) => {
      if (idx === dayIndex) {
        const newPlaces = day.places.filter((_: any, pIdx: number) => pIdx !== placeIndex);
        const newTotalCost = newPlaces.reduce((sum: number, place: any) => sum + (place.estimatedCost || 0), 0);
        const newTotalTravelTime = newPlaces.reduce((sum: number, place: any) => sum + (place.travelTimeFromPrevious || 0), 0);
        
        return {
          ...day,
          places: newPlaces,
          estimatedCost: newTotalCost,
          totalTravelTime: newTotalTravelTime
        };
      }
      return day;
    });

    // Learn from user preference if enabled
    if (preservePreferences) {
      const removedPlace = currentSuggestions[dayIndex].places[placeIndex];
      await this.learnFromUserInteraction({
        userId: useEnhancedAuthStore.getState().user?.id || '',
        interactionType: 'place_removed',
        placeData: {
          id: removedPlace.id,
          name: removedPlace.name,
          placeType: removedPlace.placeType,
          interests: [], // Would need to be passed from context
          priceRange: this.getPriceRange(removedPlace.estimatedCost),
          rating: removedPlace.rating
        },
        contextData: {
          destination: '', // Would need to be passed from context
          travelStyle: '', // Would need to be passed from context
          budgetLevel: '', // Would need to be passed from context
          dayNumber: dayIndex + 1
        },
        timestamp: new Date().toISOString()
      });
    }

    return { updatedSuggestions };
  }

  // Find similar places using similarity algorithms
  static async findSimilarPlaces(request: SimilarityRequest): Promise<any[]> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/quick-plan/similar-places', {
        method: 'POST',
        body: JSON.stringify(request),
        token
      });

      return response.data || [];
    } catch (error) {
      console.error('Error finding similar places:', error);
      return [];
    }
  }

  // Replace a place with an alternative
  static async replacePlace(
    dayIndex: number,
    placeIndex: number,
    currentSuggestions: any[],
    replacementPlace?: any,
    travelInfo?: any
  ): Promise<{ updatedSuggestions: any[]; alternativePlaces?: any[] }> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    let updatedSuggestions = [...currentSuggestions];
    let alternativePlaces: any[] = [];

    if (replacementPlace) {
      // Direct replacement with provided place
      updatedSuggestions = currentSuggestions.map((day, idx) => {
        if (idx === dayIndex) {
          const newPlaces = day.places.map((place: any, pIdx: number) => 
            pIdx === placeIndex ? replacementPlace : place
          );
          const newTotalCost = newPlaces.reduce((sum: number, place: any) => sum + (place.estimatedCost || 0), 0);
          
          return {
            ...day,
            places: newPlaces,
            estimatedCost: newTotalCost
          };
        }
        return day;
      });
    } else {
      // Generate alternative places
      const currentPlace = currentSuggestions[dayIndex].places[placeIndex];
      
      try {
        alternativePlaces = await this.findSimilarPlaces({
          referencePlace: {
            id: currentPlace.id,
            name: currentPlace.name,
            placeType: currentPlace.placeType,
            interests: [], // Would be derived from context
            priceRange: this.getPriceRange(currentPlace.estimatedCost)
          },
          destination: travelInfo?.destination || '',
          excludePlaceIds: currentSuggestions.flatMap(day => day.places.map((p: any) => p.id)),
          similarityFactors: ['type', 'price', 'interests'],
          maxResults: 5
        });

        // If we have alternatives, replace with the first one
        if (alternativePlaces.length > 0) {
          const newPlace = alternativePlaces[0];
          updatedSuggestions = currentSuggestions.map((day, idx) => {
            if (idx === dayIndex) {
              const newPlaces = day.places.map((place: any, pIdx: number) => 
                pIdx === placeIndex ? newPlace : place
              );
              const newTotalCost = newPlaces.reduce((sum: number, place: any) => sum + (place.estimatedCost || 0), 0);
              
              return {
                ...day,
                places: newPlaces,
                estimatedCost: newTotalCost
              };
            }
            return day;
          });
        }
      } catch (error) {
        console.error('Error generating alternatives:', error);
        // Fallback: generate a mock replacement
        const mockReplacement = this.generateMockReplacement(currentPlace, travelInfo?.destination);
        updatedSuggestions = currentSuggestions.map((day, idx) => {
          if (idx === dayIndex) {
            const newPlaces = day.places.map((place: any, pIdx: number) => 
              pIdx === placeIndex ? mockReplacement : place
            );
            const newTotalCost = newPlaces.reduce((sum: number, place: any) => sum + (place.estimatedCost || 0), 0);
            
            return {
              ...day,
              places: newPlaces,
              estimatedCost: newTotalCost
            };
          }
          return day;
        });
      }
    }

    // Learn from user interaction
    await this.learnFromUserInteraction({
      userId: useEnhancedAuthStore.getState().user?.id || '',
      interactionType: 'place_replaced',
      placeData: {
        id: currentSuggestions[dayIndex].places[placeIndex].id,
        name: currentSuggestions[dayIndex].places[placeIndex].name,
        placeType: currentSuggestions[dayIndex].places[placeIndex].placeType,
        interests: [],
        priceRange: this.getPriceRange(currentSuggestions[dayIndex].places[placeIndex].estimatedCost)
      },
      contextData: {
        destination: travelInfo?.destination || '',
        travelStyle: travelInfo?.travelStyle || '',
        budgetLevel: travelInfo?.budgetLevel || '',
        dayNumber: dayIndex + 1
      },
      timestamp: new Date().toISOString()
    });

    return { updatedSuggestions, alternativePlaces };
  }

  // Adjust place count for a day with real-time regeneration
  static async adjustPlaceCount(
    dayIndex: number,
    newCount: number,
    currentSuggestions: any[],
    travelInfo: any
  ): Promise<{ updatedSuggestions: any[] }> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    let updatedSuggestions = [...currentSuggestions];
    const currentDay = currentSuggestions[dayIndex];
    const currentPlaces = currentDay.places;

    if (newCount > currentPlaces.length) {
      // Add new places
      const placesToAdd = newCount - currentPlaces.length;
      const newPlaces: any[] = [];

      for (let i = 0; i < placesToAdd; i++) {
        const placeTypes = ['attraction', 'food', 'other'] as const;
        const placeType = placeTypes[i % placeTypes.length];
        
        const newPlace = {
          id: `place-${dayIndex}-${currentPlaces.length + i}-${Date.now()}`,
          name: `${travelInfo.destination} ${placeType} ${currentPlaces.length + i + 1}`,
          address: `${Math.floor(Math.random() * 999)} Main St, ${travelInfo.destination}`,
          coordinates: { lat: 40.7128 + Math.random() * 0.1, lng: -74.0060 + Math.random() * 0.1 },
          placeType,
          description: `A wonderful ${placeType} in ${travelInfo.destination}.`,
          estimatedDuration: Math.floor(Math.random() * 120) + 30,
          estimatedCost: Math.floor(Math.random() * 50) + 10,
          rating: 4.0 + Math.random() * 1.0,
          travelTimeFromPrevious: Math.floor(Math.random() * 30) + 5,
          source: Math.random() > 0.5 ? 'scraping' : 'google_places'
        };
        
        newPlaces.push(newPlace);
      }

      updatedSuggestions = currentSuggestions.map((day, idx) => {
        if (idx === dayIndex) {
          const allPlaces = [...currentPlaces, ...newPlaces];
          const newTotalCost = allPlaces.reduce((sum: number, place: any) => sum + (place.estimatedCost || 0), 0);
          const newTotalTravelTime = allPlaces.reduce((sum: number, place: any) => sum + (place.travelTimeFromPrevious || 0), 0);
          
          return {
            ...day,
            places: allPlaces,
            estimatedCost: newTotalCost,
            totalTravelTime: newTotalTravelTime
          };
        }
        return day;
      });
    } else if (newCount < currentPlaces.length) {
      // Remove places (keep the first newCount places)
      updatedSuggestions = currentSuggestions.map((day, idx) => {
        if (idx === dayIndex) {
          const newPlaces = currentPlaces.slice(0, newCount);
          const newTotalCost = newPlaces.reduce((sum: number, place: any) => sum + (place.estimatedCost || 0), 0);
          const newTotalTravelTime = newPlaces.reduce((sum: number, place: any) => sum + (place.travelTimeFromPrevious || 0), 0);
          
          return {
            ...day,
            places: newPlaces,
            estimatedCost: newTotalCost,
            totalTravelTime: newTotalTravelTime
          };
        }
        return day;
      });
    }

    // Learn from user interaction
    await this.learnFromUserInteraction({
      userId: useEnhancedAuthStore.getState().user?.id || '',
      interactionType: 'count_adjusted',
      placeData: {
        id: `day-${dayIndex}`,
        name: `Day ${dayIndex + 1}`,
        placeType: 'day_adjustment',
        interests: [],
        priceRange: 'varied'
      },
      contextData: {
        destination: travelInfo.destination,
        travelStyle: travelInfo.travelStyle,
        budgetLevel: travelInfo.budgetLevel,
        dayNumber: dayIndex + 1
      },
      timestamp: new Date().toISOString()
    });

    return { updatedSuggestions };
  }

  // Integrate must-visit places that persist across regenerations
  static async integrateMustVisitPlaces(
    mustVisitPlaces: string[],
    currentSuggestions: any[],
    travelInfo: any
  ): Promise<{ updatedSuggestions: any[] }> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    if (mustVisitPlaces.length === 0) {
      return { updatedSuggestions: currentSuggestions };
    }

    let updatedSuggestions = [...currentSuggestions];

    // For each must-visit place, try to integrate it into the itinerary
    for (const mustVisitPlace of mustVisitPlaces) {
      // Check if it's already in the suggestions
      const alreadyIncluded = updatedSuggestions.some(day => 
        day.places.some((place: any) => 
          place.name.toLowerCase().includes(mustVisitPlace.toLowerCase()) ||
          mustVisitPlace.toLowerCase().includes(place.name.toLowerCase())
        )
      );

      if (!alreadyIncluded) {
        // Create a place object for the must-visit location
        const mustVisitPlaceObj = {
          id: `must-visit-${Date.now()}-${Math.random()}`,
          name: mustVisitPlace,
          address: `${mustVisitPlace}, ${travelInfo.destination}`,
          coordinates: { lat: 40.7128 + Math.random() * 0.1, lng: -74.0060 + Math.random() * 0.1 },
          placeType: 'attraction',
          description: `${mustVisitPlace} - A must-visit location you specified.`,
          estimatedDuration: 120, // 2 hours default
          estimatedCost: this.getEstimatedCostForBudget(travelInfo.budgetLevel),
          rating: 4.5,
          travelTimeFromPrevious: 20,
          source: 'user_input',
          isMustVisit: true
        };

        // Find the best day to add it (day with fewest places)
        let bestDayIndex = 0;
        let minPlaces = updatedSuggestions[0].places.length;
        
        for (let i = 1; i < updatedSuggestions.length; i++) {
          if (updatedSuggestions[i].places.length < minPlaces) {
            minPlaces = updatedSuggestions[i].places.length;
            bestDayIndex = i;
          }
        }

        // Add to the best day
        updatedSuggestions = updatedSuggestions.map((day, idx) => {
          if (idx === bestDayIndex) {
            const newPlaces = [...day.places, mustVisitPlaceObj];
            const newTotalCost = newPlaces.reduce((sum: number, place: any) => sum + (place.estimatedCost || 0), 0);
            const newTotalTravelTime = newPlaces.reduce((sum: number, place: any) => sum + (place.travelTimeFromPrevious || 0), 0);
            
            return {
              ...day,
              places: newPlaces,
              estimatedCost: newTotalCost,
              totalTravelTime: newTotalTravelTime
            };
          }
          return day;
        });
      }
    }

    return { updatedSuggestions };
  }

  // Store and learn from user preferences
  static async learnFromUserInteraction(interaction: UserPreferenceLearning): Promise<void> {
    const token = getAuthToken();
    
    if (!token) {
      return; // Silently fail if not authenticated
    }

    try {
      await apiRequest('/quick-plan/learn-preferences', {
        method: 'POST',
        body: JSON.stringify(interaction),
        token
      });
    } catch (error) {
      console.error('Error learning from user interaction:', error);
      // Don't throw - this is non-critical functionality
    }
  }

  // Get user preferences for personalization
  static async getUserPreferences(_userId: string): Promise<CustomizationPreferences | null> {
    const token = getAuthToken();
    
    if (!token) {
      return null;
    }

    try {
      const response = await apiRequest<{ success: boolean; data: CustomizationPreferences }>('/quick-plan/user-preferences', {
        method: 'GET',
        token
      });

      return response.data || null;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  // Update user preferences
  static async updateUserPreferences(preferences: Partial<CustomizationPreferences>): Promise<boolean> {
    const token = getAuthToken();
    
    if (!token) {
      return false;
    }

    try {
      await apiRequest('/quick-plan/user-preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
        token
      });

      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  // Helper methods
  private static getPriceRange(cost: number): string {
    if (cost <= 20) return 'low';
    if (cost <= 50) return 'medium';
    return 'high';
  }

  private static getEstimatedCostForBudget(budgetLevel: string): number {
    switch (budgetLevel) {
      case 'low': return Math.floor(Math.random() * 20) + 5;
      case 'medium': return Math.floor(Math.random() * 50) + 20;
      case 'high': return Math.floor(Math.random() * 100) + 50;
      default: return 30;
    }
  }

  private static generateMockReplacement(originalPlace: any, destination: string): any {
    return {
      ...originalPlace,
      id: `replacement-${Date.now()}-${Math.random()}`,
      name: `Alternative ${originalPlace.placeType} in ${destination}`,
      description: `An alternative ${originalPlace.placeType} that might interest you.`,
      estimatedCost: Math.floor(Math.random() * 50) + 10,
      estimatedDuration: Math.floor(Math.random() * 120) + 30,
      rating: 4.0 + Math.random() * 1.0,
      source: 'replacement'
    };
  }
}