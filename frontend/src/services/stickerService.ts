import api from './api';
import { getAuthToken } from '../utils/auth';
import {
  Sticker,
  StickerPlacement,
  CreateStickerDto,
  CreateStickerPlacementDto,
  UpdateStickerPlacementDto,
  GenerateStickersRequest,
  GenerateStickersResponse,
  StickerCategory,
  Season,
} from '../types/sticker';

/**
 * Sticker Service
 * 
 * Handles all sticker-related API operations including:
 * - Fetching stickers by category or trip
 * - User-uploaded custom stickers
 * - Sticker placement management
 * - Predefined stickers
 */

class StickerService {
  /**
   * Upload a custom sticker
   */
  async uploadSticker(file: File, name: string, category: string = 'custom', isPublic: boolean = false): Promise<Sticker> {
    try {
      const token = getAuthToken();
      
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      const response = await api.post<{ message: string; sticker: Sticker }>('/stickers/upload', {
        file: base64,
        name,
        category,
        isPublic,
        contentType: file.type
      }, { token: token || undefined });
      
      return response.sticker;
    } catch (error) {
      console.error('Error uploading sticker:', error);
      throw error;
    }
  }

  /**
   * Convert file to base64 with data URL prefix
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Return the full data URL (including prefix)
        resolve(result);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Get all stickers (custom, public, shared, and predefined)
   */
  async getStickers(category?: string): Promise<{ custom: Sticker[], public: Sticker[], shared: Sticker[], predefined: Sticker[] }> {
    try {
      const token = getAuthToken();
      // Add cache-busting query parameter
      const cacheBuster = `_t=${Date.now()}`;
      const url = category 
        ? `/stickers?category=${category}&${cacheBuster}` 
        : `/stickers?${cacheBuster}`;
      const response = await api.get(url, { 
        token: token || undefined,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      return response as any;
    } catch (error) {
      console.error('Error fetching stickers:', error);
      throw error;
    }
  }

  /**
   * Get predefined stickers
   */
  async getPredefinedStickers(): Promise<Sticker[]> {
    try {
      const token = getAuthToken();
      const response = await api.get('/stickers/predefined', { token: token || undefined });
      return response as any;
    } catch (error) {
      console.error('Error fetching predefined stickers:', error);
      throw error;
    }
  }

  /**
   * Get a single sticker by ID
   */
  async getStickerById(stickerId: string): Promise<Sticker> {
    try {
      const token = getAuthToken();
      const response = await api.get(`/stickers/${stickerId}`, { token: token || undefined });
      return response.data;
    } catch (error) {
      console.error('Error fetching sticker:', error);
      throw error;
    }
  }

  /**
   * Update a sticker
   */
  async updateSticker(stickerId: string, data: { name?: string, category?: string, isPublic?: boolean }): Promise<Sticker> {
    try {
      const token = getAuthToken();
      const response = await api.put(`/stickers/${stickerId}`, data, { token: token || undefined });
      return response.data.sticker;
    } catch (error) {
      console.error('Error updating sticker:', error);
      throw error;
    }
  }

  /**
   * Delete a sticker
   */
  async deleteSticker(stickerId: string): Promise<void> {
    try {
      const token = getAuthToken();
      await api.delete(`/stickers/${stickerId}`, { token: token || undefined });
    } catch (error) {
      console.error('Error deleting sticker:', error);
      throw error;
    }
  }

  /**
   * Attach a sticker to an entity (place, trip_day, or trip)
   */
  async attachSticker(
    stickerId: string,
    entityType: 'place' | 'trip_day' | 'trip',
    entityId: string,
    position?: { x: number, y: number, rotation?: number, scale?: number, zIndex?: number }
  ): Promise<StickerPlacement> {
    try {
      const token = getAuthToken();
      const response = await api.post<{ message: string; attachment: StickerPlacement }>('/stickers/attach', {
        stickerId,
        entityType,
        entityId,
        positionX: position?.x,
        positionY: position?.y,
        rotation: position?.rotation,
        scale: position?.scale,
        zIndex: position?.zIndex
      }, { token: token || undefined });
      return response.attachment;
    } catch (error) {
      console.error('Error attaching sticker:', error);
      throw error;
    }
  }

  /**
   * Get stickers attached to an entity
   */
  async getEntityStickers(entityType: 'place' | 'trip_day' | 'trip', entityId: string): Promise<StickerPlacement[]> {
    try {
      console.log('🎯 getEntityStickers called:', { entityType, entityId });
      const token = getAuthToken();
      console.log('🔑 Token available:', !!token);
      
      const endpoint = `/stickers/entity/${entityType}/${entityId}`;
      console.log('📍 API endpoint:', endpoint);
      
      // Add cache-busting query parameter
      const cacheBuster = `?_t=${Date.now()}`;
      const fullEndpoint = `${endpoint}${cacheBuster}`;
      console.log('📍 Full endpoint with cache buster:', fullEndpoint);
      
      const response = await api.get<any[]>(fullEndpoint, { 
        token: token || undefined,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('📦 API response received:', response);
      
      // Map backend response to frontend StickerPlacement type
      const mapped = response.map((item: any) => ({
        id: item.id,
        stickerId: item.emoji_sticker || item.sticker_id || '', // Use emoji_sticker first
        elementId: item.entity_id,
        elementType: this.mapEntityTypeToElementType(item.entity_type),
        position: {
          x: parseFloat(item.position_x) || 50,
          y: parseFloat(item.position_y) || 50,
        },
        rotation: parseFloat(item.rotation) || 0,
        scale: parseFloat(item.scale) || 1,
        created_at: item.created_at,
      }));
      
      console.log('✅ Mapped placements:', mapped);
      return mapped;
    } catch (error) {
      console.error('❌ Error fetching entity stickers:', error);
      console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Map backend entity_type to frontend elementType
   */
  private mapEntityTypeToElementType(entityType: string): 'day' | 'activity' | 'booking' {
    const map: Record<string, 'day' | 'activity' | 'booking'> = {
      'trip_day': 'day',
      'place': 'activity',
    };
    return map[entityType] || 'day';
  }

  /**
   * Update sticker attachment position/styling
   */
  async updateStickerAttachment(
    attachmentId: string,
    position: { x?: number, y?: number, rotation?: number, scale?: number, zIndex?: number }
  ): Promise<StickerPlacement> {
    try {
      const token = getAuthToken();
      const response = await api.put<{ message: string; attachment: any }>(`/stickers/attachment/${attachmentId}`, {
        positionX: position.x,
        positionY: position.y,
        rotation: position.rotation,
        scale: position.scale,
        zIndex: position.zIndex
      }, { token: token || undefined });
      
      const attachment = response.attachment;
      
      // Map backend response to frontend StickerPlacement type
      return {
        id: attachment.id,
        stickerId: attachment.emoji_sticker || attachment.sticker_id || '',
        elementId: attachment.entity_id,
        elementType: this.mapEntityTypeToElementType(attachment.entity_type),
        position: {
          x: parseFloat(attachment.position_x) || 50,
          y: parseFloat(attachment.position_y) || 50,
        },
        rotation: parseFloat(attachment.rotation) || 0,
        scale: parseFloat(attachment.scale) || 1,
        created_at: attachment.created_at,
      };
    } catch (error) {
      console.error('Error updating sticker attachment:', error);
      throw error;
    }
  }

  /**
   * Remove sticker attachment
   */
  async removeStickerAttachment(attachmentId: string): Promise<void> {
    try {
      const token = getAuthToken();
      await api.delete(`/stickers/attachment/${attachmentId}`, { token: token || undefined });
    } catch (error) {
      console.error('Error removing sticker attachment:', error);
      throw error;
    }
  }

  /**
   * Determine season from date
   */
  getSeasonFromDate(date: Date): Season {
    const month = date.getMonth(); // 0-11
    
    // Northern hemisphere seasons
    if (month >= 2 && month <= 4) return 'spring'; // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'summer'; // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return 'fall'; // Sep, Oct, Nov
    return 'winter'; // Dec, Jan, Feb
  }

  /**
   * Get default stickers (fallback when API is unavailable)
   */
  getDefaultStickers(): Sticker[] {
    const now = new Date().toISOString();
    
    return [
      {
        id: 'default-1',
        image: '🎒',
        category: 'activities',
        tags: ['travel', 'adventure'],
        aiGenerated: false,
        created_at: now,
      },
      {
        id: 'default-2',
        image: '✈️',
        category: 'transportation',
        tags: ['flight', 'airplane'],
        aiGenerated: false,
        created_at: now,
      },
      {
        id: 'default-3',
        image: '🍜',
        category: 'food',
        tags: ['food', 'dining'],
        aiGenerated: false,
        created_at: now,
      },
      {
        id: 'default-4',
        image: '🏨',
        category: 'landmarks',
        tags: ['hotel', 'accommodation'],
        aiGenerated: false,
        created_at: now,
      },
      {
        id: 'default-5',
        image: '😊',
        category: 'emotions',
        tags: ['happy', 'smile'],
        aiGenerated: false,
        created_at: now,
      },
      {
        id: 'default-6',
        image: '☀️',
        category: 'weather',
        tags: ['sunny', 'weather'],
        aiGenerated: false,
        created_at: now,
      },
      {
        id: 'default-7',
        image: '🌸',
        category: 'seasonal',
        tags: ['spring', 'sakura'],
        aiGenerated: false,
        season: 'spring',
        created_at: now,
      },
      {
        id: 'default-8',
        image: '❄️',
        category: 'seasonal',
        tags: ['winter', 'snow'],
        aiGenerated: false,
        season: 'winter',
        created_at: now,
      },
    ];
  }
}

export default new StickerService();
