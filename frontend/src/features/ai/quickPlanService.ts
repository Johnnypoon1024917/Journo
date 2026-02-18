import { apiRequest } from '../../services/api';
import { getAuthToken } from '../../utils/auth';
import { QuickPlanOfflineService } from './quickPlanOfflineService';
import { TripTheme } from '../../types/trip';

export interface InterestCategory {
  id: string;
  name: string;
  icon: string;
  weight: number; // 1-5, affects suggestion priority
}

export interface TravelerType {
  type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  ageGroups?: ('child' | 'teen' | 'adult' | 'senior')[];
}

export interface QuickPlanRequest {
  destination: string;
  startDate: string;
  endDate?: string;
  duration: number;
  interests?: string[] | InterestCategory[];
  budget?: 'low' | 'medium' | 'high';
  travelStyle?: 'relaxed' | 'moderate' | 'fast-paced';
  groupSize?: number;
  travelerTypes?: TravelerType[];
  mustVisitPlaces?: string[];
}

export interface EnhancedQuickPlanRequest {
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  interests: InterestCategory[];
  budgetLevel: 'low' | 'medium' | 'high';
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced';
  groupSize: number;
  travelerTypes: TravelerType[];
  mustVisitPlaces: string[];
}

export interface QuickPlanResponse {
  success: boolean;
  data: {
    tripId: string;
    destination: string;
    startDate: string;
    endDate: string;
    suggestedPlaces: Array<{
      dayNumber: number;
      places: Array<{
        name: string;
        address: string;
        lat: number;
        lng: number;
        placeType: string;
        rating?: number;
        tips?: string;
        estimatedCost?: number;
      }>;
    }>;
    weatherForecast?: any;
    packingList?: string[];
  };
  message: string;
}

export const quickPlanService = {
  async generateQuickPlan(request: QuickPlanRequest | EnhancedQuickPlanRequest): Promise<QuickPlanResponse> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // Convert enhanced request format to backend format if needed
    const backendRequest = {
      ...request,
      // Ensure interests are strings for backward compatibility
      interests: Array.isArray(request.interests) 
        ? request.interests.map(i => typeof i === 'string' ? i : i.id)
        : request.interests
    };

    return apiRequest<QuickPlanResponse>('/quick-plan', {
      method: 'POST',
      body: JSON.stringify(backendRequest),
      token
    });
  },

  async generateSuggestions(request: EnhancedQuickPlanRequest): Promise<any> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    return apiRequest('/quick-plan/generate-suggestions', {
      method: 'POST',
      body: JSON.stringify(request),
      token
    });
  },

  async createTripFromSuggestions(
    travelInformation: any,
    approvedSuggestions: any[]
  ): Promise<any> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    return apiRequest('/quick-plan/create-from-suggestions', {
      method: 'POST',
      body: JSON.stringify({
        travelInformation,
        approvedSuggestions
      }),
      token
    });
  },

  /**
   * Generate suggestions with offline support
   */
  async generateSuggestionsWithOfflineSupport(request: EnhancedQuickPlanRequest): Promise<any> {
    const isOnline = navigator.onLine;
    
    // Generate request hash for caching
    const requestHash = QuickPlanOfflineService.generateRequestHash(request);
    
    // Try to get cached suggestions first
    const cachedSuggestions = await QuickPlanOfflineService.getCachedSuggestions(requestHash);
    
    if (cachedSuggestions && !isOnline) {
      return {
        success: true,
        data: cachedSuggestions,
        fromCache: true,
        message: 'Suggestions loaded from cache'
      };
    }

    if (!isOnline) {
      throw new Error('No internet connection and no cached suggestions available');
    }

    try {
      // Generate new suggestions online
      const response = await this.generateSuggestions(request);
      
      if (response.success && response.data) {
        // Cache the suggestions for offline use
        await QuickPlanOfflineService.cacheSuggestions(
          requestHash,
          response.data,
          24 // Cache for 24 hours
        );
      }

      return response;
    } catch (error) {
      // If online request fails, try cache as fallback
      if (cachedSuggestions) {
        return {
          success: true,
          data: cachedSuggestions,
          fromCache: true,
          message: 'Online request failed, using cached suggestions'
        };
      }
      throw error;
    }
  },

  /**
   * Create trip with offline support
   */
  async createTripWithOfflineSupport(
    travelInformation: any,
    approvedSuggestions: any[]
  ): Promise<any> {
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      // Create trip offline
      const offlineTrip = await this.createTripOffline(travelInformation, approvedSuggestions);
      return {
        success: true,
        data: offlineTrip,
        offline: true,
        message: 'Trip created offline. Will sync when connection is restored.'
      };
    }

    try {
      // Create trip online
      const response = await this.createTripFromSuggestions(travelInformation, approvedSuggestions);
      
      if (response.success && response.data) {
        // Cache the created trip for offline access
        await QuickPlanOfflineService.cacheGeneratedTrip(response.data);
      }

      return response;
    } catch (error) {
      // If online creation fails, create offline as fallback
      const offlineTrip = await this.createTripOffline(travelInformation, approvedSuggestions);
      return {
        success: true,
        data: offlineTrip,
        offline: true,
        message: 'Online creation failed, trip created offline. Will sync when connection is restored.'
      };
    }
  },

  /**
   * Create trip offline
   */
  async createTripOffline(travelInformation: any, approvedSuggestions: any[]): Promise<any> {
    const tripId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Create offline trip structure
    const offlineTrip = {
      id: tripId,
      title: `${travelInformation.destination} ${this.getTripTitleSuffix(travelInformation.interests)}`,
      destination: travelInformation.destination,
      start_date: travelInformation.startDate,
      end_date: travelInformation.endDate,
      theme: this.determineThemeFromInterests(travelInformation.interests),
      owner_id: 'offline_user',
      is_public: false,
      is_community: false,
      share_token: `offline_${tripId}`,
      total_budget: this.calculateEstimatedBudget(approvedSuggestions, travelInformation.budgetLevel),
      currency_code: 'USD',
      weather_data: null,
      likes_count: 0,
      views_count: 0,
      cover_image_url: null, // Add missing property
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      days: this.createOfflineDays(tripId, approvedSuggestions),
      offline: true,
      needsSync: true
    };

    // Cache the offline trip
    await QuickPlanOfflineService.cacheGeneratedTrip(offlineTrip);

    return offlineTrip;
  },

  /**
   * Create offline trip days structure
   */
  createOfflineDays(tripId: string, approvedSuggestions: any[]): any[] {
    return approvedSuggestions.map((daySuggestion, index) => ({
      id: `offline_day_${tripId}_${index}`,
      trip_id: tripId,
      day_number: daySuggestion.dayNumber,
      date: daySuggestion.date,
      created_at: new Date().toISOString(),
      places: daySuggestion.places.map((place: any, placeIndex: number) => ({
        id: `offline_place_${tripId}_${index}_${placeIndex}`,
        trip_day_id: `offline_day_${tripId}_${index}`,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        time_start: this.calculatePlaceStartTime(placeIndex, 'moderate'),
        time_end: this.calculatePlaceEndTime(placeIndex, 'moderate'),
        notes: place.tips || '',
        image_url: null,
        place_type: place.placeType,
        sticker: null,
        cost: place.estimatedCost,
        cost_currency: 'USD',
        budget_category: this.mapPlaceTypeToBudgetCategory(place.placeType),
        transport_mode: null,
        travel_time_seconds: null,
        travel_distance_meters: null,
        travel_time_text: null,
        travel_distance_text: null,
        display_order: placeIndex + 1,
        calculated_arrival_time: this.calculatePlaceStartTime(placeIndex, 'moderate'),
        is_syncing: false,
        sync_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        offline: true,
        needsSync: true
      }))
    }));
  },

  /**
   * Helper methods for offline trip creation
   */
  getTripTitleSuffix(interests: any[]): string {
    if (!interests || interests.length === 0) return 'Adventure';
    
    const dominantInterest = interests.reduce((prev, current) => 
      (prev.weight > current.weight) ? prev : current
    );
    
    const suffixes: Record<string, string> = {
      food: 'Food Tour',
      culture: 'Cultural Journey',
      adventure: 'Adventure',
      shopping: 'Shopping Trip',
      nature: 'Nature Escape',
      relaxation: 'Relaxing Getaway',
      nightlife: 'Nightlife Experience',
      photography: 'Photo Journey'
    };
    
    return suffixes[dominantInterest.id] || 'Adventure';
  },

  determineThemeFromInterests(interests: any[]): TripTheme {
    if (!interests || interests.length === 0) return 'default';
    
    const dominantInterest = interests.reduce((prev, current) => 
      (prev.weight > current.weight) ? prev : current
    );
    
    const themeMap: Record<string, TripTheme> = {
      food: 'foodie',
      adventure: 'adventure',
      culture: 'default',
      relaxation: 'chill',
      nature: 'adventure',
      shopping: 'default',
      nightlife: 'default',
      photography: 'default'
    };
    
    return themeMap[dominantInterest.id] || 'default';
  },

  calculateEstimatedBudget(approvedSuggestions: any[], budgetLevel: string): number {
    const totalCost = approvedSuggestions.reduce((sum, day) => 
      sum + day.estimatedCost, 0
    );
    
    const multipliers = {
      low: 1.2,
      medium: 1.5,
      high: 2.0
    };
    
    return Math.round(totalCost * (multipliers[budgetLevel as keyof typeof multipliers] || 1.5));
  },

  calculatePlaceStartTime(placeIndex: number, travelStyle: string): string {
    const baseHour = 9; // Start at 9 AM
    const hoursPerPlace = travelStyle === 'relaxed' ? 3 : travelStyle === 'moderate' ? 2 : 1.5;
    
    const totalHours = baseHour + (placeIndex * hoursPerPlace);
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },

  calculatePlaceEndTime(placeIndex: number, travelStyle: string): string {
    const startTime = this.calculatePlaceStartTime(placeIndex, travelStyle);
    const [hours, minutes] = startTime.split(':').map(Number);
    
    const visitDuration = travelStyle === 'relaxed' ? 2.5 : travelStyle === 'moderate' ? 1.5 : 1;
    const endHours = hours + Math.floor(visitDuration);
    const endMinutes = minutes + Math.round((visitDuration - Math.floor(visitDuration)) * 60);
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  },

  mapPlaceTypeToBudgetCategory(placeType: string): string {
    const categoryMap: Record<string, string> = {
      food: 'food',
      hotel: 'accommodation',
      transport: 'transport',
      attraction: 'activities',
      shopping: 'shopping',
      other: 'misc'
    };
    
    return categoryMap[placeType] || 'misc';
  },

  /**
   * Sync offline trips when coming back online
   */
  async syncOfflineTrips(): Promise<any> {
    return await QuickPlanOfflineService.syncOfflineTrips();
  },

  /**
   * Get offline mode status and capabilities
   */
  async getOfflineStatus(): Promise<any> {
    return await QuickPlanOfflineService.handleOfflineMode();
  },

  /**
   * Clean up expired cache
   */
  async cleanupCache(): Promise<any> {
    return await QuickPlanOfflineService.cleanupExpiredCache();
  },

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    return await QuickPlanOfflineService.getCacheStats();
  },

  /**
   * Clear all offline cache
   */
  async clearOfflineCache(): Promise<void> {
    return await QuickPlanOfflineService.clearAllCache();
  }
};
