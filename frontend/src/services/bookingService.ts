/**
 * Booking Service
 * 
 * Handles flight, train, and accommodation booking operations.
 * Uses backend API for persistent storage.
 */

import { FlightBooking } from '@/components/kawaii/BoardingPassCard';
import { AccommodationBooking } from '@/components/kawaii/AccommodationCard';
import api from './api';
import { getAuthToken } from '@/utils/auth';

export type BookingType = 'flight' | 'train' | 'accommodation';

export interface Booking {
  id: string;
  tripId: string;
  type: BookingType;
  data: FlightBooking | AccommodationBooking;
  createdAt: string;
  updatedAt: string;
}

export interface BookingsResponse {
  success: boolean;
  data: Booking[];
}

export interface BookingResponse {
  success: boolean;
  data: Booking;
}

export const bookingService = {
  /**
   * Get all bookings for a trip
   */
  async getBookingsByTrip(tripId: string): Promise<BookingsResponse> {
    const token = getAuthToken();
    const response = await api.get<{ bookings: any[] }>(`/bookings/trip/${tripId}`, { token: token || undefined });
    // Transform backend format to frontend format
    const bookings: Booking[] = response.bookings.map((b: any) => ({
      id: b.id,
      tripId: b.trip_id,
      type: b.type,
      data: {
        // Map backend fields to frontend FlightBooking/AccommodationBooking format
        ...b,
      },
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
    return {
      success: true,
      data: bookings,
    };
  },

  /**
   * Get a single booking by ID
   */
  async getBookingById(tripId: string, bookingId: string): Promise<BookingResponse | null> {
    try {
      const token = getAuthToken();
      const response = await api.get<{ booking: any }>(`/bookings/${bookingId}`, { token: token || undefined });
      const b = response.booking;
      return {
        success: true,
        data: {
          id: b.id,
          tripId: b.trip_id,
          type: b.type,
          data: { ...b },
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        },
      };
    } catch (error) {
      console.error('Error fetching booking:', error);
      return null;
    }
  },

  /**
   * Create a new booking
   */
  async createBooking(
    tripId: string,
    type: BookingType,
    data: FlightBooking | AccommodationBooking
  ): Promise<BookingResponse> {
    const token = getAuthToken();
    const response = await api.post<{ booking: any }>('/bookings', {
      tripId,
      type,
      ...data, // Spread the data fields directly
    }, { token: token || undefined });
    const b = response.booking;
    return {
      success: true,
      data: {
        id: b.id,
        tripId: b.trip_id,
        type: b.type,
        data: { ...b },
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      },
    };
  },

  /**
   * Update an existing booking
   */
  async updateBooking(
    tripId: string,
    bookingId: string,
    data: Partial<FlightBooking | AccommodationBooking>
  ): Promise<BookingResponse | null> {
    try {
      const token = getAuthToken();
      const response = await api.put<{ booking: any }>(`/bookings/${bookingId}`, data, { token: token || undefined });
      const b = response.booking;
      return {
        success: true,
        data: {
          id: b.id,
          tripId: b.trip_id,
          type: b.type,
          data: { ...b },
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        },
      };
    } catch (error) {
      console.error('Error updating booking:', error);
      return null;
    }
  },

  /**
   * Delete a booking
   */
  async deleteBooking(tripId: string, bookingId: string): Promise<{ success: boolean }> {
    const token = getAuthToken();
    await api.delete(`/bookings/${bookingId}`, { token: token || undefined });
    return {
      success: true,
    };
  },

  /**
   * Get bookings by type
   */
  async getBookingsByType(
    tripId: string,
    type: BookingType | BookingType[]
  ): Promise<BookingsResponse> {
    const allBookings = await this.getBookingsByTrip(tripId);
    const types = Array.isArray(type) ? type : [type];

    const filtered = allBookings.data.filter((booking) => types.includes(booking.type));

    return {
      success: true,
      data: filtered,
    };
  },
};
