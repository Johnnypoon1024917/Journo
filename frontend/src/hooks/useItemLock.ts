import { useState, useCallback, useEffect } from 'react';
import { useEditingState } from './useEditingState';

interface UseItemLockOptions {
  tripId: string;
  itemId: string;
  itemType: 'activity' | 'booking' | 'shopping' | 'checklist' | 'expense';
  onLockFailed?: (editingUser: { userId: string; userEmail: string; userName?: string }) => void;
}

/**
 * Hook to manage item locking for collaborative editing
 * 
 * Provides a simple interface to lock/unlock items and check lock status.
 * Automatically handles cleanup when component unmounts.
 */
export const useItemLock = (options: UseItemLockOptions) => {
  const { tripId, itemId, itemType, onLockFailed } = options;
  
  const [isLocked, setIsLocked] = useState(false);
  const [isLockedByMe, setIsLockedByMe] = useState(false);

  const {
    startEditing,
    stopEditing,
    isBeingEditedByOther,
    editingUser,
  } = useEditingState({
    tripId,
    itemId,
    itemType,
    onEditingConflict: onLockFailed,
  });

  /**
   * Attempt to acquire lock on the item
   */
  const acquireLock = useCallback(async (): Promise<boolean> => {
    const success = startEditing();
    
    if (success) {
      setIsLocked(true);
      setIsLockedByMe(true);
      return true;
    } else {
      setIsLocked(true);
      setIsLockedByMe(false);
      return false;
    }
  }, [startEditing]);

  /**
   * Release lock on the item
   */
  const releaseLock = useCallback(() => {
    stopEditing();
    setIsLocked(false);
    setIsLockedByMe(false);
  }, [stopEditing]);

  /**
   * Check if item is locked
   */
  const checkLock = useCallback(() => {
    return isBeingEditedByOther;
  }, [isBeingEditedByOther]);

  /**
   * Update lock state based on editing status
   */
  useEffect(() => {
    if (isBeingEditedByOther) {
      setIsLocked(true);
      setIsLockedByMe(false);
    } else if (!isLockedByMe) {
      setIsLocked(false);
    }
  }, [isBeingEditedByOther, isLockedByMe]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isLockedByMe) {
        releaseLock();
      }
    };
  }, [isLockedByMe, releaseLock]);

  return {
    isLocked,
    isLockedByMe,
    isLockedByOther: isBeingEditedByOther,
    editingUser,
    acquireLock,
    releaseLock,
    checkLock,
  };
};
