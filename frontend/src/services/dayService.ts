import { apiRequest } from './api';
import { getAuthToken } from '../utils/auth';
import { TripDay, TripDayWithPlaces, CreateTripDayDto } from '../types/trip';

interface DayResponse {
  success: boolean;
  data: TripDay;
  message?: string;
}

interface DaysResponse {
  success: boolean;
  data: TripDayWithPlaces[];
}

export const dayService = {
  // Get or create a day (upsert) - prevents duplicate day errors
  async getOrCreateDay(data: CreateTripDayDto): Promise<TripDay> {
    const token = getAuthToken();
    
    console.log('dayService.getOrCreateDay - Request data:', {
      data,
      token: token ? 'present' : 'missing',
      url: '/days/get-or-create'
    });
    
    try {
      const response = await apiRequest<DayResponse>('/days/get-or-create', {
        method: 'POST',
        body: JSON.stringify(data),
        token: token || undefined,
      });
      
      console.log('dayService.getOrCreateDay - Success response:', response);
      return response.data;
    } catch (error) {
      console.error('dayService.getOrCreateDay - Error:', error);
      throw error;
    }
  },

  // Create a new day
  async createDay(data: CreateTripDayDto): Promise<TripDay> {
    const token = getAuthToken();
    
    console.log('dayService.createDay - Request data:', {
      data,
      token: token ? 'present' : 'missing',
      url: '/days'
    });
    
    try {
      const response = await apiRequest<DayResponse>('/days', {
        method: 'POST',
        body: JSON.stringify(data),
        token: token || undefined,
      });
      
      console.log('dayService.createDay - Success response:', response);
      return response.data;
    } catch (error) {
      console.error('dayService.createDay - Error:', error);
      throw error;
    }
  },

  // Get all days for a trip
  async getDaysByTrip(tripId: string): Promise<TripDayWithPlaces[]> {
    const token = getAuthToken();
    const response = await apiRequest<DaysResponse>(`/days/trip/${tripId}`, {
      method: 'GET',
      token: token || undefined,
    });
    return response.data;
  },

  // Update a day
  async updateDay(id: string, data: Partial<CreateTripDayDto>): Promise<TripDay> {
    const token = getAuthToken();
    const response = await apiRequest<DayResponse>(`/days/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token: token || undefined,
    });
    return response.data;
  },

  // Delete a day
  async deleteDay(id: string): Promise<void> {
    const token = getAuthToken();
    await apiRequest<{ success: boolean; message: string }>(`/days/${id}`, {
      method: 'DELETE',
      token: token || undefined,
    });
  },

  // Reorder days
  async reorderDays(tripId: string, dayOrders: { id: string; day_number: number }[]): Promise<TripDay[]> {
    const token = getAuthToken();
    const response = await apiRequest<DaysResponse>(`/days/trip/${tripId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ dayOrders }),
      token: token || undefined,
    });
    return response.data;
  },
};
