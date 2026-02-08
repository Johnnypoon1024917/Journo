import { apiRequest } from './api';
import { getAuthToken } from '../utils/auth';
import { StoryItem, CreateStoryItemDto } from '../types/story';
import { analyticsService } from './analyticsService';

interface StoryItemsResponse {
  success: boolean;
  data: StoryItem[];
}

interface StoryItemResponse {
  success: boolean;
  data: StoryItem;
  message: string;
}

export const storyService = {
  // Get all story items for a trip
  async getStoryItems(tripId: string): Promise<StoryItem[]> {
    try {
      const token = getAuthToken();
      const response = await apiRequest<StoryItemsResponse>(`/trips/${tripId}/stories`, {
        method: 'GET',
        token: token || undefined,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching story items:', error);
      throw error;
    }
  },

  // Create a new story item
  async createStoryItem(data: CreateStoryItemDto): Promise<StoryItem> {
    try {
      const token = getAuthToken();
      const response = await apiRequest<StoryItemResponse>('/stories', {
        method: 'POST',
        body: JSON.stringify(data),
        token: token || undefined,
      });

      // Track story item creation
      if (response.success && response.data) {
        if (response.data.type === 'photo') {
          analyticsService.trackPhotoUploaded(response.data.trip_id, undefined, 'story_feed');
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error creating story item:', error);
      throw error;
    }
  },

  // Delete a story item
  async deleteStoryItem(storyId: string): Promise<void> {
    try {
      const token = getAuthToken();
      await apiRequest<{ success: boolean; message: string }>(`/stories/${storyId}`, {
        method: 'DELETE',
        token: token || undefined,
      });
    } catch (error) {
      console.error('Error deleting story item:', error);
      throw error;
    }
  },

  // Extract YouTube video ID from URL
  extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  },
};
