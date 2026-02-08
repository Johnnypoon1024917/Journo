import { apiRequest } from './api';
import { Trip, CreateTripDto, UpdateTripDto } from '../types/trip';
import { analyticsService } from './analyticsService';
import { 
  TravelInformation, 
  DailySuggestions 
} from '../components/quickplan/PlaceSuggestionsPreview';

export interface PaginatedTripsResponse {
  success: boolean;
  data: Trip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface TripResponse {
  success: boolean;
  data: Trip;
  message?: string;
}

export interface DeleteTripResponse {
  success: boolean;
  message: string;
}

export interface EnhancedTripCreationResponse {
  success: boolean;
  data: {
    tripId: string;
    destination: string;
    startDate: string;
    endDate: string;
    theme: string;
    totalBudget: number;
    currencyCode: string;
    budgetEntries: Array<{
      category: string;
      amount: number;
      currency: string;
    }>;
    packingList: string[];
  };
  message?: string;
}

export const tripService = {
  // Create trip from Quick Plan suggestions (enhanced functionality)
  async createTripFromSuggestions(
    travelInformation: TravelInformation,
    approvedSuggestions: DailySuggestions[],
    token: string
  ): Promise<EnhancedTripCreationResponse> {
    try {
      const response = await apiRequest<EnhancedTripCreationResponse>('/trips/quick-plan/create-from-suggestions', {
        method: 'POST',
        body: JSON.stringify({
          travelInformation,
          approvedSuggestions
        }),
        token,
      });

      // Track enhanced trip creation
      if (response.success && response.data) {
        analyticsService.trackTripCreated(response.data.tripId, undefined, {
          destination: travelInformation.destination,
          theme: response.data.theme,
          duration_days: travelInformation.duration,
          has_budget: response.data.totalBudget > 0,
          currency: response.data.currencyCode,
          creation_method: 'quick_plan_enhanced',
          travel_style: travelInformation.travelStyle,
          group_size: travelInformation.groupSize,
          interests_count: travelInformation.interests.length,
          places_count: approvedSuggestions.reduce((sum, day) => sum + day.places.length, 0)
        });
      }

      return response;
    } catch (error) {
      console.error('Error creating trip from suggestions:', error);
      throw error;
    }
  },

  // Create a new trip
  async createTrip(tripData: CreateTripDto, token: string): Promise<TripResponse> {
    const response = await apiRequest<TripResponse>('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
      token,
    });

    // Track trip creation
    if (response.success && response.data) {
      analyticsService.trackTripCreated(response.data.id, undefined, {
        destination: tripData.destination,
        theme: tripData.theme,
        duration_days: tripData.end_date && tripData.start_date 
          ? Math.ceil((new Date(tripData.end_date).getTime() - new Date(tripData.start_date).getTime()) / (1000 * 60 * 60 * 24))
          : undefined,
        has_budget: !!tripData.total_budget,
        currency: tripData.currency_code,
      });
    }

    return response;
  },

  // Get all trips for the authenticated user
  async getTrips(page: number = 1, limit: number = 10, token: string): Promise<PaginatedTripsResponse> {
    return apiRequest<PaginatedTripsResponse>(`/trips?page=${page}&limit=${limit}`, {
      method: 'GET',
      token,
    });
  },

  // Get a single trip by ID
  async getTripById(tripId: string, token: string): Promise<TripResponse> {
    return apiRequest<TripResponse>(`/trips/${tripId}`, {
      method: 'GET',
      token,
    });
  },

  // Update a trip
  async updateTrip(tripId: string, tripData: UpdateTripDto, token: string): Promise<TripResponse> {
    const response = await apiRequest<TripResponse>(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
      token,
    });

    // Track community posting
    if (response.success && tripData.is_community === true) {
      analyticsService.trackCommunityPosted(tripId);
    }

    // Track budget updates
    if (response.success && (tripData.total_budget !== undefined || tripData.currency_code !== undefined)) {
      analyticsService.trackBudgetUpdated(tripId, undefined, tripData.total_budget, tripData.currency_code);
    }

    return response;
  },

  // Delete a trip
  async deleteTrip(tripId: string, token: string): Promise<DeleteTripResponse> {
    return apiRequest<DeleteTripResponse>(`/trips/${tripId}`, {
      method: 'DELETE',
      token,
    });
  },

  // Get trip by share token (public access)
  async getTripByToken(shareToken: string): Promise<TripResponse> {
    return apiRequest<TripResponse>(`/trips/shared/${shareToken}`, {
      method: 'GET',
    });
  },

  // Get trip days by share token (public access)
  async getDaysByToken(shareToken: string): Promise<any> {
    return apiRequest<any>(`/trips/shared/${shareToken}/days`, {
      method: 'GET',
    });
  },

  // Toggle trip public/private status
  async togglePublic(tripId: string, isPublic: boolean, token: string): Promise<TripResponse> {
    return apiRequest<TripResponse>(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify({ is_public: isPublic }),
      token,
    });
  },

  // Reorder trips
  async reorderTrips(tripOrders: Array<{ tripId: string; displayOrder: number }>, token: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/trips/reorder', {
      method: 'POST',
      body: JSON.stringify({ tripOrders }),
      token,
    });
  },
};
