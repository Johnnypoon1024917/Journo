/**
 * Sync Conflict Manager Component
 * 
 * Monitors for sync conflicts and displays resolution dialogs.
 * Integrates with the sync conflict service to handle user choices.
 * 
 * Validates Requirement 11.6: Show conflict resolution dialog
 */

import React, { useEffect, useState } from 'react';
import { SyncConflictDialog, SyncConflict } from './SyncConflictDialog';
import { syncConflictService } from '../../services/syncConflictService';
import { syncService } from '../../services/syncService';

/**
 * SyncConflictManager Component
 * 
 * Listens for sync conflicts and displays resolution dialogs one at a time.
 * After each resolution, triggers a new sync to process the resolved conflict.
 */
export const SyncConflictManager: React.FC = () => {
  const [currentConflict, setCurrentConflict] = useState<SyncConflict | null>(null);
  const [pendingConflicts, setPendingConflicts] = useState<SyncConflict[]>([]);

  useEffect(() => {
    // Subscribe to conflict changes
    const unsubscribe = syncConflictService.subscribe((conflicts) => {
      setPendingConflicts(conflicts);
      
      // Show first conflict if none is currently displayed
      if (!currentConflict && conflicts.length > 0) {
        setCurrentConflict(conflicts[0]);
      }
    });

    // Load initial conflicts
    const initialConflicts = syncConflictService.getPendingConflicts();
    setPendingConflicts(initialConflicts);
    if (initialConflicts.length > 0) {
      setCurrentConflict(initialConflicts[0]);
    }

    return unsubscribe;
  }, [currentConflict]);

  const handleResolve = async (conflictId: string, choice: 'local' | 'server') => {
    try {
      // Resolve the conflict
      await syncConflictService.resolveConflict(conflictId, choice);

      // Clear current conflict
      setCurrentConflict(null);

      // Show next conflict if any
      const remaining = syncConflictService.getPendingConflicts();
      if (remaining.length > 0) {
        setCurrentConflict(remaining[0]);
      } else {
        // All conflicts resolved, trigger sync to process resolved items
        setTimeout(() => {
          syncService.startSync();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      // Show error to user
      alert('Failed to resolve conflict. Please try again.');
    }
  };

  const handleCancel = () => {
    if (!currentConflict) return;

    // Cancel this conflict (skip resolution)
    syncConflictService.cancelConflict(currentConflict.id);
    setCurrentConflict(null);

    // Show next conflict if any
    const remaining = syncConflictService.getPendingConflicts();
    if (remaining.length > 0) {
      setCurrentConflict(remaining[0]);
    }
  };

  // Don't render anything if no conflicts
  if (!currentConflict) {
    return null;
  }

  return (
    <SyncConflictDialog
      conflict={currentConflict}
      onResolve={handleResolve}
      onCancel={handleCancel}
    />
  );
};

export default SyncConflictManager;
