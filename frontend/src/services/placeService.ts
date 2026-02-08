import { apiRequest } from './api';
import { getAuthToken } from '../utils/auth';
import { Place, CreatePlaceDto, UpdatePlaceDto } from '../types/trip';
import { analyticsService } from './analyticsService';

interface PlaceResponse {
  success: boolean;
  data: Place;
  message?: string;
}

interface PlacesResponse {
  success: boolean;
  data: Place[];
}

export const placeService = {
  // Create a new place
  async createPlace(data: CreatePlaceDto): Promise<Place> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const response = await apiRequest<PlaceResponse>('/places', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
    
    // Track place addition
    if (response.success && response.data && response.data.place_type) {
      analyticsService.trackPlaceAdded(
        response.data.trip_day_id, // We'll need to get trip_id from this
        undefined,
        response.data.place_type
      );
    }
    
    return response.data;
  },

  // Get all places for a day
  async getPlacesByDay(dayId: string): Promise<Place[]> {
    const token = getAuthToken();
    const response = await apiRequest<PlacesResponse>(`/places/day/${dayId}`, {
      method: 'GET',
      token: token || undefined,
    });
    return response.data;
  },

  // Update a place
  async updatePlace(id: string, data: UpdatePlaceDto): Promise<Place> {
    const token = getAuthToken();
    const response = await apiRequest<PlaceResponse>(`/places/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token: token || undefined,
    });
    return response.data;
  },

  // Delete a place
  async deletePlace(id: string): Promise<void> {
    const token = getAuthToken();
    await apiRequest<{ success: boolean; message: string }>(`/places/${id}`, {
      method: 'DELETE',
      token: token || undefined,
    });
  },

  // Update travel time for a place
  async updateTravelTime(
    id: string,
    travelData: {
      travel_time_seconds: number | null;
      travel_distance_meters: number | null;
      travel_time_text: string | null;
      travel_distance_text: string | null;
    }
  ): Promise<Place> {
    const token = getAuthToken();
    const response = await apiRequest<PlaceResponse>(`/places/${id}/travel-time`, {
      method: 'PUT',
      body: JSON.stringify(travelData),
      token: token || undefined,
    });
    return response.data;
  },

  // Move a place to a different day or reorder
  async movePlace(id: string, targetDayId: string, targetIndex: number): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const response = await apiRequest<{ success: boolean; message: string }>(`/places/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify({
        target_day_id: targetDayId,
        target_index: targetIndex,
      }),
      token,
    });
    return response;
  },

  // Recalculate travel times for a day
  async recalculateTravelTimes(dayId: string): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    const response = await apiRequest<{ success: boolean; message: string }>(`/places/day/${dayId}/recalculate-travel-times`, {
      method: 'POST',
      token: token || undefined,
    });
    return response;
  },
};
