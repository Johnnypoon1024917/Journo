import { useEffect, useCallback } from 'react';
import { useRealtimeStore } from '../stores/realtimeStore';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { socketService } from '../services/socketService';

interface UseEditingStateOptions {
  tripId: string;
  itemId: string;
  itemType: 'activity' | 'booking' | 'shopping' | 'checklist' | 'expense';
  onEditingConflict?: (editingUser: { userId: string; userEmail: string; userName?: string }) => void;
}

/**
 * Hook to manage editing state for collaborative items
 * 
 * Automatically broadcasts when a user starts/stops editing an item
 * and checks if another user is currently editing the same item.
 */
export const useEditingState = (options: UseEditingStateOptions) => {
  const { tripId, itemId, itemType, onEditingConflict } = options;
  
  const { user } = useEnhancedAuthStore();
  const { setUserEditing, clearUserEditing, getUserEditingItem } = useRealtimeStore();
  
  const editingUser = getUserEditingItem(tripId, itemId);
  const isBeingEditedByOther = editingUser && editingUser.userId !== user?.id;

  /**
   * Start editing - broadcasts to other users
   */
  const startEditing = useCallback(() => {
    if (!user) return false;

    // Check if someone else is editing
    const currentEditor = getUserEditingItem(tripId, itemId);
    if (currentEditor && currentEditor.userId !== user.id) {
      onEditingConflict?.(currentEditor);
      return false;
    }

    // Broadcast editing state locally
    setUserEditing(tripId, user.id, user.email, user.name, itemId, itemType);
    
    // Emit socket event
    socketService.emitEditingStart(tripId, itemId, itemType);
    
    return true;
  }, [tripId, itemId, itemType, user, getUserEditingItem, setUserEditing, onEditingConflict]);

  /**
   * Stop editing - broadcasts to other users
   */
  const stopEditing = useCallback(() => {
    if (!user) return;

    clearUserEditing(tripId, user.id, itemId);
    
    // Emit socket event
    socketService.emitEditingStop(tripId, itemId);
  }, [tripId, itemId, user, clearUserEditing]);

  /**
   * Listen for editing events from other users
   */
  useEffect(() => {
    const handleEditingStart = (data: any) => {
      if (data.tripId === tripId && data.itemId === itemId && data.userId !== user?.id) {
        setUserEditing(
          data.tripId,
          data.userId,
          data.userEmail,
          data.userName,
          data.itemId,
          data.itemType
        );
      }
    };

    const handleEditingStop = (data: any) => {
      if (data.tripId === tripId && data.itemId === itemId) {
        clearUserEditing(data.tripId, data.userId, data.itemId);
      }
    };

    socketService.on({
      onEditingStart: handleEditingStart,
      onEditingStop: handleEditingStop,
    });

    return () => {
      socketService.off(['onEditingStart', 'onEditingStop']);
    };
  }, [tripId, itemId, user, setUserEditing, clearUserEditing]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopEditing();
    };
  }, [stopEditing]);

  return {
    startEditing,
    stopEditing,
    isBeingEditedByOther,
    editingUser,
  };
};
