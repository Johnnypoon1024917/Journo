import { apiRequest } from './api';
import { getAuthToken } from '../utils/auth';
import {
  PackingItem,
  CreatePackingItemDto,
  UpdatePackingItemDto,
  PackingListProgress,
} from '../types/packing';

export const packingService = {
  /**
   * Get all packing items for a trip
   */
  async getPackingItems(tripId: string): Promise<PackingItem[]> {
    const token = getAuthToken();
    return apiRequest<PackingItem[]>(`/trips/${tripId}/packing`, {
      method: 'GET',
      token: token || undefined,
    });
  },

  /**
   * Get packing progress for a trip
   */
  async getPackingProgress(tripId: string): Promise<PackingListProgress> {
    const token = getAuthToken();
    return apiRequest<PackingListProgress>(`/trips/${tripId}/packing/progress`, {
      method: 'GET',
      token: token || undefined,
    });
  },

  /**
   * Add a packing item
   */
  async addPackingItem(tripId: string, data: CreatePackingItemDto): Promise<PackingItem> {
    const token = getAuthToken();
    return apiRequest<PackingItem>(`/trips/${tripId}/packing`, {
      method: 'POST',
      token: token || undefined,
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a packing item
   */
  async updatePackingItem(
    tripId: string,
    itemId: string,
    data: UpdatePackingItemDto
  ): Promise<PackingItem> {
    const token = getAuthToken();
    return apiRequest<PackingItem>(`/trips/${tripId}/packing/${itemId}`, {
      method: 'PATCH',
      token: token || undefined,
      body: JSON.stringify(data),
    });
  },

  /**
   * Toggle packing item checked status
   */
  async togglePackingItem(tripId: string, itemId: string, isPacked: boolean): Promise<PackingItem> {
    return await this.updatePackingItem(tripId, itemId, { is_packed: isPacked });
  },

  /**
   * Delete a packing item
   */
  async deletePackingItem(tripId: string, itemId: string): Promise<void> {
    const token = getAuthToken();
    return apiRequest<void>(`/trips/${tripId}/packing/${itemId}`, {
      method: 'DELETE',
      token: token || undefined,
    });
  },

  /**
   * Generate packing suggestions
   */
  async generateSuggestions(tripId: string): Promise<any[]> {
    const token = getAuthToken();
    return apiRequest<any[]>(`/trips/${tripId}/packing/suggestions`, {
      method: 'GET',
      token: token || undefined,
    });
  },

  /**
   * Apply packing suggestions
   */
  async applySuggestions(tripId: string): Promise<{ message: string; items: PackingItem[] }> {
    const token = getAuthToken();
    return apiRequest<{ message: string; items: PackingItem[] }>(
      `/trips/${tripId}/packing/suggestions/apply`,
      {
        method: 'POST',
        token: token || undefined,
      }
    );
  },
};
