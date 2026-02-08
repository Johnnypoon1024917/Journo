import { create } from 'zustand';
import { Trip, TripDay, Place, TransportRoute } from '../types/trip';

interface DragState {
  isDragging: boolean;
  draggedPlaceId: string | null;
  draggedFromIndex: number | null;
}

interface UIState {
  selectedDayId: string | null;
  selectedPlaceId: string | null;
  expandedDays: Set<string>;
  activePanel: 'timeline' | 'map' | 'split';
}

interface SyncQueueState {
  pendingOperations: Map<string, any>;
  processingOperations: Set<string>;
}

interface RouteCache {
  routes: Map<string, TransportRoute>;
  expiresAt: Map<string, number>;
}

interface TripPlannerState {
  // Data
  trip: Trip | null;
  days: Map<string, TripDay>;
  places: Map<string, Place>;
  
  // UI State
  ui: UIState;
  
  // Drag State
  drag: DragState;
  
  // Sync Queue
  syncQueue: SyncQueueState;
  
  // Route Cache
  routeCache: RouteCache;
  
  // Actions
  setTrip: (trip: Trip) => void;
  setDays: (days: TripDay[]) => void;
  setPlaces: (places: Place[]) => void;
  
  // Place CRUD
  addPlace: (place: Place) => void;
  updatePlace: (placeId: string, updates: Partial<Place>) => void;
  deletePlace: (placeId: string) => void;
  reorderPlaces: (placeIds: string[]) => void;
  
  // UI Actions
  selectDay: (dayId: string | null) => void;
  selectPlace: (placeId: string | null) => void;
  toggleDayExpanded: (dayId: string) => void;
  setActivePanel: (panel: 'timeline' | 'map' | 'split') => void;
  
  // Drag Actions
  startDrag: (placeId: string, fromIndex: number) => void;
  endDrag: () => void;
  
  // Sync Queue Actions
  addToSyncQueue: (operationId: string, operation: any) => void;
  removeFromSyncQueue: (operationId: string) => void;
  markAsProcessing: (operationId: string) => void;
  
  // Route Cache Actions
  cacheRoute: (key: string, route: TransportRoute, ttl: number) => void;
  getRoute: (key: string) => TransportRoute | null;
  clearExpiredRoutes: () => void;
  
  // Helpers
  getPlacesByDay: (dayId: string) => Place[];
  getAllPlaces: () => Place[];
}

export const useTripPlannerStore = create<TripPlannerState>((set, get) => ({
  // Initial state
  trip: null,
  days: new Map(),
  places: new Map(),
  
  ui: {
    selectedDayId: null,
    selectedPlaceId: null,
    expandedDays: new Set(),
    activePanel: 'split',
  },
  
  drag: {
    isDragging: false,
    draggedPlaceId: null,
    draggedFromIndex: null,
  },
  
  syncQueue: {
    pendingOperations: new Map(),
    processingOperations: new Set(),
  },
  
  routeCache: {
    routes: new Map(),
    expiresAt: new Map(),
  },
  
  // Actions
  setTrip: (trip) => set({ trip }),
  
  setDays: (days) => {
    const daysMap = new Map(days.map(day => [day.id, day]));
    // Expand all days by default
    const expandedDays = new Set(days.map(day => day.id));
    set({ days: daysMap, ui: { ...get().ui, expandedDays } });
  },
  
  setPlaces: (places) => {
    const placesMap = new Map(places.map(place => [place.id, place]));
    set({ places: placesMap });
  },
  
  // Place CRUD
  addPlace: (place) => set((state) => {
    const newPlaces = new Map(state.places);
    newPlaces.set(place.id, place);
    return { places: newPlaces };
  }),
  
  updatePlace: (placeId, updates) => set((state) => {
    const place = state.places.get(placeId);
    if (!place) return state;
    
    const newPlaces = new Map(state.places);
    newPlaces.set(placeId, { ...place, ...updates });
    return { places: newPlaces };
  }),
  
  deletePlace: (placeId) => set((state) => {
    const newPlaces = new Map(state.places);
    newPlaces.delete(placeId);
    return { places: newPlaces };
  }),
  
  reorderPlaces: (placeIds: string[]) => set((state) => {
    const newPlaces = new Map(state.places);
    
    placeIds.forEach((placeId, index) => {
      const place = newPlaces.get(placeId);
      if (place) {
        newPlaces.set(placeId, { ...place, display_order: index });
      }
    });
    
    return { places: newPlaces };
  }),
  
  // UI Actions
  selectDay: (dayId) => set((state) => ({
    ui: { ...state.ui, selectedDayId: dayId },
  })),
  
  selectPlace: (placeId) => set((state) => ({
    ui: { ...state.ui, selectedPlaceId: placeId },
  })),
  
  toggleDayExpanded: (dayId) => set((state) => {
    const newExpanded = new Set(state.ui.expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    return {
      ui: { ...state.ui, expandedDays: newExpanded },
    };
  }),
  
  setActivePanel: (panel) => set((state) => ({
    ui: { ...state.ui, activePanel: panel },
  })),
  
  // Drag Actions
  startDrag: (placeId, fromIndex) => set({
    drag: {
      isDragging: true,
      draggedPlaceId: placeId,
      draggedFromIndex: fromIndex,
    },
  }),
  
  endDrag: () => set({
    drag: {
      isDragging: false,
      draggedPlaceId: null,
      draggedFromIndex: null,
    },
  }),
  
  // Sync Queue Actions
  addToSyncQueue: (operationId, operation) => set((state) => {
    const newPending = new Map(state.syncQueue.pendingOperations);
    newPending.set(operationId, operation);
    return {
      syncQueue: {
        ...state.syncQueue,
        pendingOperations: newPending,
      },
    };
  }),
  
  removeFromSyncQueue: (operationId) => set((state) => {
    const newPending = new Map(state.syncQueue.pendingOperations);
    newPending.delete(operationId);
    
    const newProcessing = new Set(state.syncQueue.processingOperations);
    newProcessing.delete(operationId);
    
    return {
      syncQueue: {
        pendingOperations: newPending,
        processingOperations: newProcessing,
      },
    };
  }),
  
  markAsProcessing: (operationId) => set((state) => {
    const newProcessing = new Set(state.syncQueue.processingOperations);
    newProcessing.add(operationId);
    return {
      syncQueue: {
        ...state.syncQueue,
        processingOperations: newProcessing,
      },
    };
  }),
  
  // Route Cache Actions
  cacheRoute: (key, route, ttl) => set((state) => {
    const newRoutes = new Map(state.routeCache.routes);
    const newExpiresAt = new Map(state.routeCache.expiresAt);
    
    newRoutes.set(key, route);
    newExpiresAt.set(key, Date.now() + ttl);
    
    return {
      routeCache: {
        routes: newRoutes,
        expiresAt: newExpiresAt,
      },
    };
  }),
  
  getRoute: (key) => {
    const state = get();
    const expiresAt = state.routeCache.expiresAt.get(key);
    
    if (!expiresAt || Date.now() > expiresAt) {
      return null;
    }
    
    return state.routeCache.routes.get(key) || null;
  },
  
  clearExpiredRoutes: () => set((state) => {
    const now = Date.now();
    const newRoutes = new Map(state.routeCache.routes);
    const newExpiresAt = new Map(state.routeCache.expiresAt);
    
    Array.from(newExpiresAt.entries()).forEach(([key, expiresAt]) => {
      if (now > expiresAt) {
        newRoutes.delete(key);
        newExpiresAt.delete(key);
      }
    });
    
    return {
      routeCache: {
        routes: newRoutes,
        expiresAt: newExpiresAt,
      },
    };
  }),
  
  // Helpers
  getPlacesByDay: (dayId) => {
    const state = get();
    return Array.from(state.places.values())
      .filter(place => place.trip_day_id === dayId)
      .sort((a, b) => a.display_order - b.display_order);
  },
  
  getAllPlaces: () => {
    const state = get();
    return Array.from(state.places.values())
      .sort((a, b) => a.display_order - b.display_order);
  },
}));
