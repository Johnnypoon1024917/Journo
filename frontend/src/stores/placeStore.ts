/**
 * Place Store
 * Manages place state with loading indicators for optimistic updates
 */

import { create } from 'zustand';
import { OfflinePlace } from '../types/offline';

interface PlaceLoadingState {
  placeId: string;
  isLoading: boolean;
  operation: 'create' | 'update' | 'delete' | 'reorder' | null;
  error: string | null;
}

interface PlaceStore {
  // Places data
  places: Record<string, OfflinePlace>;
  
  // Loading states
  loadingStates: Map<string, PlaceLoadingState>;
  
  // Actions
  setPlaces: (places: OfflinePlace[]) => void;
  addPlace: (place: OfflinePlace) => void;
  updatePlace: (placeId: string, updates: Partial<OfflinePlace>) => void;
  deletePlace: (placeId: string) => void;
  reorderPlaces: (tripDayId: string, placeIds: string[]) => void;
  
  // Loading state management
  setLoading: (placeId: string, isLoading: boolean, operation?: PlaceLoadingState['operation']) => void;
  setError: (placeId: string, error: string | null) => void;
  getLoadingState: (placeId: string) => PlaceLoadingState | null;
  isPlaceLoading: (placeId: string) => boolean;
  clearLoadingState: (placeId: string) => void;
  clearAllLoadingStates: () => void;
  
  // Getters
  getPlace: (placeId: string) => OfflinePlace | null;
  getPlacesByTripDay: (tripDayId: string) => OfflinePlace[];
}

export const usePlaceStore = create<PlaceStore>((set, get) => ({
  // Initial state
  places: {},
  loadingStates: new Map(),

  // Actions
  setPlaces: (places: OfflinePlace[]) => {
    const placesMap: Record<string, OfflinePlace> = {};
    places.forEach(place => {
      placesMap[place.id] = place;
    });
    set({ places: placesMap });
  },

  addPlace: (place: OfflinePlace) => {
    set(state => ({
      places: {
        ...state.places,
        [place.id]: place,
      },
    }));
  },

  updatePlace: (placeId: string, updates: Partial<OfflinePlace>) => {
    set(state => {
      const existingPlace = state.places[placeId];
      if (!existingPlace) return state;

      return {
        places: {
          ...state.places,
          [placeId]: {
            ...existingPlace,
            ...updates,
            updated_at: new Date().toISOString(),
          },
        },
      };
    });
  },

  deletePlace: (placeId: string) => {
    set(state => {
      const { [placeId]: _, ...remainingPlaces } = state.places;
      return { places: remainingPlaces };
    });
  },

  reorderPlaces: (_tripDayId: string, placeIds: string[]) => {
    set(state => {
      const updatedPlaces = { ...state.places };
      
      placeIds.forEach((placeId, index) => {
        if (updatedPlaces[placeId]) {
          updatedPlaces[placeId] = {
            ...updatedPlaces[placeId],
            place_order: index,
            updated_at: new Date().toISOString(),
          };
        }
      });

      return { places: updatedPlaces };
    });
  },

  // Loading state management
  setLoading: (placeId: string, isLoading: boolean, operation = null) => {
    set(state => {
      const newLoadingStates = new Map(state.loadingStates);
      
      if (isLoading) {
        newLoadingStates.set(placeId, {
          placeId,
          isLoading: true,
          operation,
          error: null,
        });
      } else {
        newLoadingStates.delete(placeId);
      }

      return { loadingStates: newLoadingStates };
    });
  },

  setError: (placeId: string, error: string | null) => {
    set(state => {
      const newLoadingStates = new Map(state.loadingStates);
      const existingState = newLoadingStates.get(placeId);

      if (existingState) {
        newLoadingStates.set(placeId, {
          ...existingState,
          error,
          isLoading: false,
        });
      } else if (error) {
        newLoadingStates.set(placeId, {
          placeId,
          isLoading: false,
          operation: null,
          error,
        });
      }

      return { loadingStates: newLoadingStates };
    });
  },

  getLoadingState: (placeId: string) => {
    return get().loadingStates.get(placeId) ?? null;
  },

  isPlaceLoading: (placeId: string) => {
    return get().loadingStates.get(placeId)?.isLoading ?? false;
  },

  clearLoadingState: (placeId: string) => {
    set(state => {
      const newLoadingStates = new Map(state.loadingStates);
      newLoadingStates.delete(placeId);
      return { loadingStates: newLoadingStates };
    });
  },

  clearAllLoadingStates: () => {
    set({ loadingStates: new Map() });
  },

  // Getters
  getPlace: (placeId: string) => {
    return get().places[placeId] ?? null;
  },

  getPlacesByTripDay: (tripDayId: string) => {
    const places = Object.values(get().places).filter(
      place => place.trip_day_id === tripDayId
    );
    return places.sort((a, b) => (a.place_order || 0) - (b.place_order || 0));
  },
}));

export default usePlaceStore;
