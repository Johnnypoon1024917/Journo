/**
 * Shopping Service
 * 
 * Handles shopping list operations for trips.
 * Uses backend API for persistent storage.
 */

import {
  ShoppingItem,
  CreateShoppingItemDto,
  UpdateShoppingItemDto,
  ShoppingStats,
  ShoppingFilterOption,
  ShoppingTag,
} from '@/types/shopping';
import api from './api';
import { getAuthToken } from '@/utils/auth';

export interface ShoppingItemsResponse {
  success: boolean;
  data: ShoppingItem[];
}

export interface ShoppingItemResponse {
  success: boolean;
  data: ShoppingItem;
}

export interface ShoppingStatsResponse {
  success: boolean;
  data: ShoppingStats;
}

export const shoppingService = {
  /**
   * Get all shopping items for a trip
   */
  async getShoppingItems(tripId: string): Promise<ShoppingItemsResponse> {
    const token = getAuthToken();
    const response = await api.get<{ items: any[] }>(`/shopping/trip/${tripId}`, { token: token || undefined });
    // Transform backend format to frontend format
    const items: ShoppingItem[] = response.items.map((item: any) => ({
      id: item.id,
      trip_id: item.trip_id,
      name: item.name,
      store: item.store_name,
      image: item.image,
      weblink: item.store_url,
      tags: item.category ? [item.category] : [],
      checked: item.is_purchased,
      priority: item.priority || 'normal',
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
    return {
      success: true,
      data: items,
    };
  },

  /**
   * Get a single shopping item by ID
   */
  async getShoppingItemById(
    tripId: string,
    itemId: string
  ): Promise<ShoppingItemResponse | null> {
    try {
      const token = getAuthToken();
      const response = await api.get<{ item: any }>(`/shopping/${itemId}`, { token: token || undefined });
      const item = response.item;
      return {
        success: true,
        data: {
          id: item.id,
          trip_id: item.trip_id,
          name: item.name,
          store: item.store_name,
          image: item.image,
          weblink: item.store_url,
          tags: item.category ? [item.category] : [],
          checked: item.is_purchased,
          priority: item.priority || 'normal',
          created_at: item.created_at,
          updated_at: item.updated_at,
        },
      };
    } catch (error) {
      console.error('Error fetching shopping item:', error);
      return null;
    }
  },

  /**
   * Create a new shopping item
   */
  async createShoppingItem(dto: CreateShoppingItemDto): Promise<ShoppingItemResponse> {
    const token = getAuthToken();
    const response = await api.post<{ item: any }>('/shopping', {
      tripId: dto.trip_id,
      name: dto.name,
      storeName: dto.store,
      storeUrl: dto.weblink,
      category: dto.tags?.[0] || null,
      priority: dto.priority || 'normal',
    }, { token: token || undefined });
    const item = response.item;
    return {
      success: true,
      data: {
        id: item.id,
        trip_id: item.trip_id,
        name: item.name,
        store: item.store_name,
        image: item.image,
        weblink: item.store_url,
        tags: item.category ? [item.category] : [],
        checked: item.is_purchased,
        priority: item.priority || 'normal',
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
    };
  },

  /**
   * Update an existing shopping item
   */
  async updateShoppingItem(
    tripId: string,
    itemId: string,
    dto: UpdateShoppingItemDto
  ): Promise<ShoppingItemResponse | null> {
    try {
      const token = getAuthToken();
      const response = await api.put<{ item: any }>(`/shopping/${itemId}`, {
        name: dto.name,
        storeName: dto.store,
        storeUrl: dto.weblink,
        category: dto.tags?.[0] || null,
        priority: dto.priority,
      }, { token: token || undefined });
      const item = response.item;
      return {
        success: true,
        data: {
          id: item.id,
          trip_id: item.trip_id,
          name: item.name,
          store: item.store_name,
          image: item.image,
          weblink: item.store_url,
          tags: item.category ? [item.category] : [],
          checked: item.is_purchased,
          priority: item.priority || 'normal',
          created_at: item.created_at,
          updated_at: item.updated_at,
        },
      };
    } catch (error) {
      console.error('Error updating shopping item:', error);
      return null;
    }
  },

  /**
   * Toggle shopping item checked status
   */
  async toggleShoppingItem(tripId: string, itemId: string): Promise<ShoppingItemResponse | null> {
    try {
      const token = getAuthToken();
      const response = await api.patch<{ item: any }>(`/shopping/${itemId}/toggle`, undefined, { token: token || undefined });
      const item = response.item;
      return {
        success: true,
        data: {
          id: item.id,
          trip_id: item.trip_id,
          name: item.name,
          store: item.store_name,
          image: item.image,
          weblink: item.store_url,
          tags: item.category ? [item.category] : [],
          checked: item.is_purchased,
          priority: item.priority || 'normal',
          created_at: item.created_at,
          updated_at: item.updated_at,
        },
      };
    } catch (error) {
      console.error('Error toggling shopping item:', error);
      return null;
    }
  },

  /**
   * Delete a shopping item
   */
  async deleteShoppingItem(tripId: string, itemId: string): Promise<{ success: boolean }> {
    const token = getAuthToken();
    await api.delete(`/shopping/${itemId}`, { token: token || undefined });
    return {
      success: true,
    };
  },

  /**
   * Get shopping statistics
   */
  async getShoppingStats(tripId: string): Promise<ShoppingStatsResponse> {
    const items = await this.getShoppingItems(tripId);

    const stats: ShoppingStats = {
      toBuy: items.data.filter((i) => !i.checked).length,
      bought: items.data.filter((i) => i.checked).length,
      total: items.data.length,
    };

    return {
      success: true,
      data: stats,
    };
  },

  /**
   * Get filter options with counts
   */
  async getFilterOptions(tripId: string): Promise<ShoppingFilterOption[]> {
    const items = await this.getShoppingItems(tripId);

    const tagCounts: Record<string, number> = {
      all: items.data.length,
      '一般': 0,
      '寄食': 0,
      '服飾': 0,
      '重要': 0,
      '其他': 0,
    };

    items.data.forEach((item) => {
      item.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const options: ShoppingFilterOption[] = [
      { id: 'all', label: 'All Items', count: tagCounts.all },
      { id: 'general', label: '一般', tag: '一般', count: tagCounts['一般'] },
      { id: 'food', label: '寄食', tag: '寄食', count: tagCounts['寄食'] },
      { id: 'clothing', label: '服飾', tag: '服飾', count: tagCounts['服飾'] },
      { id: 'important', label: '重要', tag: '重要', count: tagCounts['重要'] },
      { id: 'other', label: '其他', tag: '其他', count: tagCounts['其他'] },
    ];

    return options;
  },

  /**
   * Get filtered shopping items
   */
  async getFilteredItems(
    tripId: string,
    filterId: string
  ): Promise<ShoppingItemsResponse> {
    const items = await this.getShoppingItems(tripId);

    if (filterId === 'all') {
      return {
        success: true,
        data: items.data,
      };
    }

    // Map filter ID to tag
    const tagMap: Record<string, ShoppingTag> = {
      general: '一般',
      food: '寄食',
      clothing: '服飾',
      important: '重要',
      other: '其他',
    };

    const tag = tagMap[filterId];
    if (!tag) {
      return {
        success: true,
        data: items.data,
      };
    }

    const filtered = items.data.filter((item) => item.tags.includes(tag));

    return {
      success: true,
      data: filtered,
    };
  },
};
