import { create } from 'zustand';
import {
  Sticker,
  StickerPlacement,
  StickerCategory,
} from '../types/sticker';
import stickerService from '../services/stickerService';

interface StickerStore {
  // State
  stickers: Sticker[];
  placements: StickerPlacement[];
  selectedSticker: string | null;
  selectedCategory: StickerCategory | 'all';
  isLoading: boolean;
  error: string | null;

  // Actions
  loadStickers: (tripId: string) => Promise<void>;
  loadPlacements: (tripId: string) => Promise<void>;
  selectSticker: (stickerId: string | null) => void;
  setCategory: (category: StickerCategory | 'all') => void;
  deleteSticker: (stickerId: string) => Promise<void>;
  attachSticker: (
    tripId: string,
    stickerId: string,
    elementId: string,
    elementType: 'day' | 'activity' | 'booking' | 'trip',
    position: { x: number; y: number }
  ) => Promise<void>;
  updatePlacement: (
    tripId: string,
    placementId: string,
    updates: { position?: { x: number; y: number }; rotation?: number; scale?: number }
  ) => Promise<void>;
  removePlacement: (tripId: string, placementId: string) => Promise<void>;
  generateStickers: (
    tripId: string,
    destination: string,
    startDate?: string,
    endDate?: string
  ) => Promise<void>;
  getFilteredStickers: () => Sticker[];
  getElementPlacements: (elementId: string) => StickerPlacement[];
  reset: () => void;
}

const initialState = {
  stickers: [],
  placements: [],
  selectedSticker: null,
  selectedCategory: 'all' as const,
  isLoading: false,
  error: null,
};

export const useStickerStore = create<StickerStore>((set, get) => ({
  ...initialState,

  loadStickers: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🎨 Loading stickers from API...');
      
      // Get stickers from the service
      const stickersData = await stickerService.getStickers();
      
      console.log('📦 Raw stickers data from API:', stickersData);
      
      // Get API base URL for converting relative URLs to absolute
      const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      
      // Handle different response structures
      let allStickers: Sticker[] = [];
      
      if (stickersData && typeof stickersData === 'object') {
        // If response has custom/public/shared/predefined structure
        if ('custom' in stickersData || 'public' in stickersData || 'shared' in stickersData || 'predefined' in stickersData) {
          console.log('📊 Loading stickers:', {
            custom: stickersData.custom?.length || 0,
            public: stickersData.public?.length || 0,
            shared: stickersData.shared?.length || 0,
            predefined: stickersData.predefined?.length || 0,
          });
          
          // Convert custom stickers to use image_url as image and make URLs absolute
          const customStickers = (stickersData.custom || []).map((s: any) => {
            const imageUrl = s.image_url || s.image;
            return {
              ...s,
              image: imageUrl?.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : imageUrl,
            };
          });
          
          const publicStickers = (stickersData.public || []).map((s: any) => {
            const imageUrl = s.image_url || s.image;
            return {
              ...s,
              image: imageUrl?.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : imageUrl,
            };
          });
          
          // Convert shared stickers (from trip collaborators)
          const sharedStickers = (stickersData.shared || []).map((s: any) => {
            const imageUrl = s.image_url || s.image;
            const absoluteUrl = imageUrl?.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : imageUrl;
            console.log('🔗 Shared sticker URL conversion:', { 
              id: s.id, 
              name: s.name,
              original: imageUrl, 
              absolute: absoluteUrl 
            });
            return {
              ...s,
              image: absoluteUrl,
            };
          });
          
          console.log('✅ Processed shared stickers:', sharedStickers.length, sharedStickers);
          
          allStickers = [
            ...customStickers,
            ...sharedStickers,
            ...publicStickers,
            ...(stickersData.predefined || []),
          ];
        } 
        // If response is directly an array
        else if (Array.isArray(stickersData)) {
          allStickers = (stickersData as any[]).map((s: any) => {
            const imageUrl = s.image_url || s.image;
            return {
              ...s,
              image: imageUrl?.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : imageUrl,
            };
          });
        }
      }
      
      // Always include default emoji stickers
      const defaultStickers = stickerService.getDefaultStickers();
      
      // Merge with custom stickers, avoiding duplicates
      const mergedStickers = [...allStickers];
      defaultStickers.forEach(defaultSticker => {
        if (!mergedStickers.find(s => s.id === defaultSticker.id)) {
          mergedStickers.push(defaultSticker);
        }
      });
      
      console.log('Total stickers loaded:', mergedStickers.length);
      set({ stickers: mergedStickers, isLoading: false });
    } catch (error) {
      console.error('Error loading stickers:', error);
      // Fallback to default stickers on error
      const defaultStickers = stickerService.getDefaultStickers();
      set({ 
        stickers: defaultStickers, 
        error: 'Failed to load stickers, using defaults',
        isLoading: false 
      });
    }
  },

  loadPlacements: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get placements for the trip entity itself
      const tripPlacements = await stickerService.getEntityStickers('trip', tripId);
      
      // Note: We only load trip-level placements here
      // Individual components (DayCard, ActivityCard, etc.) should load their own placements
      // when they mount by calling stickerService.getEntityStickers directly
      
      set({ placements: tripPlacements || [], isLoading: false });
    } catch (error) {
      console.error('Error loading placements:', error);
      set({ 
        placements: [],
        error: 'Failed to load sticker placements',
        isLoading: false 
      });
    }
  },

  selectSticker: (stickerId: string | null) => {
    set({ selectedSticker: stickerId });
  },

  setCategory: (category: StickerCategory | 'all') => {
    set({ selectedCategory: category });
  },

  deleteSticker: async (stickerId: string) => {
    try {
      await stickerService.deleteSticker(stickerId);
      
      // Remove from store immediately (optimistic update)
      set((state) => ({
        stickers: state.stickers.filter((s) => s.id !== stickerId),
        selectedSticker: state.selectedSticker === stickerId ? null : state.selectedSticker,
        // Also remove any placements using this sticker
        placements: state.placements.filter((p) => p.stickerId !== stickerId),
      }));
      
      console.log('✅ Sticker deleted from store:', stickerId);
    } catch (error) {
      console.error('Error deleting sticker:', error);
      set({ error: 'Failed to delete sticker' });
      throw error;
    }
  },

  attachSticker: async (
    tripId: string,
    stickerId: string,
    elementId: string,
    elementType: 'day' | 'activity' | 'booking' | 'trip',
    position: { x: number; y: number }
  ) => {
    try {
      // Map element types to entity types
      const entityTypeMap: Record<string, 'place' | 'trip_day' | 'trip'> = {
        'activity': 'place',
        'day': 'trip_day',
        'booking': 'place',
        'trip': 'trip',
      };
      
      const entityType = entityTypeMap[elementType] || 'trip_day';
      
      console.log('📌 Attaching sticker:', { 
        stickerId, 
        entityType, 
        elementId, 
        position,
        tripId 
      });
      
      const placement = await stickerService.attachSticker(
        stickerId,
        entityType,
        elementId,
        {
          x: position.x,
          y: position.y,
          rotation: 0,
          scale: 1,
        }
      );

      console.log('✅ Sticker attached successfully:', placement);

      // Add the new placement to the store
      set((state) => ({
        placements: [...state.placements, placement],
        selectedSticker: null, // Deselect after attaching
      }));
    } catch (error: any) {
      console.error('❌ Error attaching sticker:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        status: error.status
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to attach sticker';
      set({ error: errorMessage });
      throw error;
    }
  },

  updatePlacement: async (
    tripId: string,
    placementId: string,
    updates: { position?: { x: number; y: number }; rotation?: number; scale?: number }
  ) => {
    try {
      console.log('Updating placement:', { placementId, updates });
      
      const updatedPlacement = await stickerService.updateStickerAttachment(
        placementId,
        {
          x: updates.position?.x,
          y: updates.position?.y,
          rotation: updates.rotation,
          scale: updates.scale,
        }
      );

      console.log('Placement updated successfully:', updatedPlacement);

      set((state) => ({
        placements: state.placements.map((p) =>
          p.id === placementId ? updatedPlacement : p
        ),
      }));
    } catch (error) {
      console.error('Error updating placement:', error);
      set({ error: 'Failed to update sticker placement' });
      throw error;
    }
  },

  removePlacement: async (tripId: string, placementId: string) => {
    try {
      await stickerService.removeStickerAttachment(placementId);

      set((state) => ({
        placements: state.placements.filter((p) => p.id !== placementId),
      }));
    } catch (error) {
      console.error('Error removing placement:', error);
      set({ error: 'Failed to remove sticker' });
      throw error;
    }
  },

  generateStickers: async (
    tripId: string,
    destination: string,
    startDate?: string,
    endDate?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement AI sticker generation when backend is ready
      console.log('AI sticker generation not yet implemented');
      set({ 
        error: 'AI sticker generation coming soon!',
        isLoading: false 
      });
    } catch (error) {
      console.error('Error generating stickers:', error);
      set({ 
        error: 'Failed to generate AI stickers',
        isLoading: false 
      });
      throw error;
    }
  },

  getFilteredStickers: () => {
    const { stickers, selectedCategory } = get();
    
    if (selectedCategory === 'all') {
      return stickers;
    }
    
    return stickers.filter((s) => s.category === selectedCategory);
  },

  getElementPlacements: (elementId: string) => {
    const { placements } = get();
    return placements.filter((p) => p.elementId === elementId);
  },

  reset: () => {
    set(initialState);
  },
}));
