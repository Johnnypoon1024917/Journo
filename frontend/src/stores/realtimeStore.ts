import { create } from 'zustand';

interface PresenceData {
  viewerCount: number;
  viewers: Array<{
    userId?: string;
    userEmail?: string;
  }>;
}

interface EditingUser {
  userId: string;
  userEmail: string;
  userName?: string;
  itemId: string;
  itemType: 'activity' | 'booking' | 'shopping' | 'checklist' | 'expense';
  startedAt: Date;
}

interface RealtimeState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;

  // Presence tracking
  presence: Record<string, PresenceData>;
  
  // Editing state tracking
  editingUsers: Record<string, EditingUser[]>; // tripId -> array of editing users

  // Pending updates (for optimistic UI)
  pendingUpdates: Set<string>;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  updatePresence: (tripId: string, data: PresenceData) => void;
  setUserEditing: (tripId: string, userId: string, userEmail: string, userName: string | undefined, itemId: string, itemType: EditingUser['itemType']) => void;
  clearUserEditing: (tripId: string, userId: string, itemId: string) => void;
  getUserEditingItem: (tripId: string, itemId: string) => EditingUser | undefined;
  addPendingUpdate: (updateId: string) => void;
  removePendingUpdate: (updateId: string) => void;
  clearPresence: (tripId: string) => void;
  reset: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  // Initial state
  isConnected: false,
  connectionError: null,
  presence: {},
  editingUsers: {},
  pendingUpdates: new Set(),

  // Actions
  setConnected: (connected) =>
    set({ isConnected: connected, connectionError: connected ? null : undefined }),

  setConnectionError: (error) =>
    set({ connectionError: error }),

  updatePresence: (tripId, data) =>
    set((state) => ({
      presence: {
        ...state.presence,
        [tripId]: data,
      },
    })),

  setUserEditing: (tripId, userId, userEmail, userName, itemId, itemType) =>
    set((state) => {
      const currentEditing = state.editingUsers[tripId] || [];
      
      // Remove any existing editing state for this user/item combo
      const filtered = currentEditing.filter(
        (e) => !(e.userId === userId && e.itemId === itemId)
      );
      
      // Add new editing state
      const newEditing: EditingUser = {
        userId,
        userEmail,
        userName,
        itemId,
        itemType,
        startedAt: new Date(),
      };
      
      return {
        editingUsers: {
          ...state.editingUsers,
          [tripId]: [...filtered, newEditing],
        },
      };
    }),

  clearUserEditing: (tripId, userId, itemId) =>
    set((state) => {
      const currentEditing = state.editingUsers[tripId] || [];
      const filtered = currentEditing.filter(
        (e) => !(e.userId === userId && e.itemId === itemId)
      );
      
      return {
        editingUsers: {
          ...state.editingUsers,
          [tripId]: filtered,
        },
      };
    }),

  getUserEditingItem: (tripId, itemId) => {
    const state = get();
    const editing = state.editingUsers[tripId] || [];
    return editing.find((e) => e.itemId === itemId);
  },

  addPendingUpdate: (updateId) =>
    set((state) => ({
      pendingUpdates: new Set(state.pendingUpdates).add(updateId),
    })),

  removePendingUpdate: (updateId) =>
    set((state) => {
      const newPending = new Set(state.pendingUpdates);
      newPending.delete(updateId);
      return { pendingUpdates: newPending };
    }),

  clearPresence: (tripId) =>
    set((state) => {
      const newPresence = { ...state.presence };
      delete newPresence[tripId];
      
      const newEditingUsers = { ...state.editingUsers };
      delete newEditingUsers[tripId];
      
      return { 
        presence: newPresence,
        editingUsers: newEditingUsers,
      };
    }),

  reset: () =>
    set({
      isConnected: false,
      connectionError: null,
      presence: {},
      editingUsers: {},
      pendingUpdates: new Set(),
    }),
}));
