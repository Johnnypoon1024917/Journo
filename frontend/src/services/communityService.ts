import { apiRequest } from './api';
import { Trip } from '../types/trip';
import { StoryItem } from '../types/story';
// import { analyticsService } from './analyticsService';

export interface CommunityTripsResponse {
  success: boolean;
  data: {
    trips: Trip[];
    storyItemsMap: Record<string, StoryItem[]>;
    likedTripIds?: string[];
  };
}

export interface LikeResponse {
  success: boolean;
  message: string;
}

export interface CopyTripResponse {
  success: boolean;
  data: Trip;
  message: string;
}

export const communityService = {
  // Get all community trips with top 3 story items
  async getCommunityTrips(token?: string): Promise<CommunityTripsResponse> {
    return apiRequest<CommunityTripsResponse>('/community/trips', {
      method: 'GET',
      token,
    });
  },

  // Like a trip
  async likeTrip(tripId: string, token: string): Promise<LikeResponse> {
    return apiRequest<LikeResponse>(`/community/trips/${tripId}/like`, {
      method: 'POST',
      token,
    });
  },

  // Unlike a trip
  async unlikeTrip(tripId: string, token: string): Promise<LikeResponse> {
    return apiRequest<LikeResponse>(`/community/trips/${tripId}/like`, {
      method: 'DELETE',
      token,
    });
  },

  // Copy a trip to user's own trips
  async copyTrip(tripId: string, token: string): Promise<CopyTripResponse> {
    return apiRequest<CopyTripResponse>(`/community/trips/${tripId}/copy`, {
      method: 'POST',
      token,
    });
  },
};
