import { create } from 'zustand';
import { offlineStorage } from '../services/offlineStorage';
import {
  OfflineTrip,
  OfflineTripDay,
  OfflinePlace,
  OfflineStoryItem,
  OfflinePackingItem,
  SyncQueueItem,
} from '../types/offline';

interface OfflineStore {
  // Network status
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncProgress: number;
  syncError: string | null;
  
  // Sync queue
  syncQueue: SyncQueueItem[];
  pendingChangesCount: number;
  
  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncStatus: (isSyncing: boolean, progress?: number) => void;
  setSyncError: (error: string | null) => void;
  loadSyncQueue: () => Promise<void>;
  updateSyncQueue: (queue: SyncQueueItem[]) => void;
  setLastSyncTime: (time: string) => void;
  
  // Offline data operations
  saveOfflineTrip: (trip: OfflineTrip) => Promise<void>;
  saveOfflineTripDay: (tripDay: OfflineTripDay) => Promise<void>;
  saveOfflinePlace: (place: OfflinePlace) => Promise<void>;
  saveOfflineStoryItem: (storyItem: OfflineStoryItem) => Promise<void>;
  saveOfflinePackingItem: (packingItem: OfflinePackingItem) => Promise<void>;
  
  // Initialize
  initialize: () => Promise<void>;
}

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  // Initial state
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncTime: null,
  syncProgress: 0,
  syncError: null,
  syncQueue: [],
  pendingChangesCount: 0,

  // Actions
  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
    offlineStorage.setNetworkStatus({
      isOnline,
      lastOnline: isOnline ? new Date().toISOString() : undefined,
    });
  },

  setSyncStatus: (isSyncing: boolean, progress?: number) => {
    set({ 
      isSyncing,
      syncProgress: progress !== undefined ? progress : get().syncProgress,
    });
  },

  setSyncError: (error: string | null) => {
    set({ syncError: error });
  },

  loadSyncQueue: async () => {
    try {
      const queue = await offlineStorage.getSyncQueue();
      set({ 
        syncQueue: queue,
        pendingChangesCount: queue.length,
      });
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  },

  updateSyncQueue: (queue: SyncQueueItem[]) => {
    set({ 
      syncQueue: queue,
      pendingChangesCount: queue.length,
    });
  },

  setLastSyncTime: (time: string) => {
    set({ lastSyncTime: time });
    offlineStorage.setLastSyncTime(time);
  },

  // Offline data operations
  saveOfflineTrip: async (trip: OfflineTrip) => {
    await offlineStorage.saveTrip(trip);
  },

  saveOfflineTripDay: async (tripDay: OfflineTripDay) => {
    await offlineStorage.saveTripDay(tripDay);
  },

  saveOfflinePlace: async (place: OfflinePlace) => {
    await offlineStorage.savePlace(place);
  },

  saveOfflineStoryItem: async (storyItem: OfflineStoryItem) => {
    await offlineStorage.saveStoryItem(storyItem);
  },

  saveOfflinePackingItem: async (packingItem: OfflinePackingItem) => {
    await offlineStorage.savePackingItem(packingItem);
  },

  // Initialize
  initialize: async () => {
    try {
      // Load network status
      const networkStatus = await offlineStorage.getNetworkStatus();
      const lastSyncTime = await offlineStorage.getLastSyncTime();
      
      // Load sync queue
      const queue = await offlineStorage.getSyncQueue();
      
      set({
        isOnline: networkStatus.isOnline,
        lastSyncTime,
        syncQueue: queue,
        pendingChangesCount: queue.length,
      });
      
      // Set up online/offline listeners
      window.addEventListener('online', () => {
        get().setOnlineStatus(true);
      });
      
      window.addEventListener('offline', () => {
        get().setOnlineStatus(false);
      });
    } catch (error) {
      console.error('Failed to initialize offline store:', error);
    }
  },
}));

export default useOfflineStore;
