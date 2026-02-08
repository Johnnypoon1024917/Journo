import React, { useState } from 'react';
import { useItemLock } from '../../hooks/useItemLock';
import { EditingIndicator } from './EditingIndicator';
import { EditingConflictModal } from './EditingConflictModal';

interface CollaborativeItemExampleProps {
  tripId: string;
  itemId: string;
  itemType: 'activity' | 'booking' | 'shopping' | 'checklist' | 'expense';
  children: React.ReactNode;
}

/**
 * CollaborativeItemExample - Example of how to use collaboration features
 * 
 * This component demonstrates:
 * 1. Item locking when editing
 * 2. Showing editing indicators
 * 3. Handling editing conflicts
 * 4. Preventing concurrent edits
 * 
 * Usage:
 * ```tsx
 * <CollaborativeItemExample tripId="123" itemId="456" itemType="activity">
 *   <YourEditableComponent />
 * </CollaborativeItemExample>
 * ```
 */
export const CollaborativeItemExample: React.FC<CollaborativeItemExampleProps> = ({
  tripId,
  itemId,
  itemType,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictUser, setConflictUser] = useState<any>(null);

  const {
    isLocked,
    isLockedByMe,
    isLockedByOther,
    editingUser,
    acquireLock,
    releaseLock,
  } = useItemLock({
    tripId,
    itemId,
    itemType,
    onLockFailed: (user) => {
      setConflictUser(user);
      setShowConflictModal(true);
    },
  });

  const handleStartEdit = async () => {
    const success = await acquireLock();
    if (success) {
      setIsEditing(true);
    }
  };

  const handleStopEdit = () => {
    releaseLock();
    setIsEditing(false);
  };

  return (
    <div className="relative">
      {/* Editing indicator */}
      {isLockedByOther && editingUser && (
        <div className="mb-2">
          <EditingIndicator tripId={tripId} itemId={itemId} />
        </div>
      )}

      {/* Content */}
      <div className={isLockedByOther ? 'opacity-60 pointer-events-none' : ''}>
        {children}
      </div>

      {/* Edit controls - ensure 44px minimum touch target */}
      <div className="mt-2 flex gap-2">
        {!isEditing && !isLockedByOther && (
          <button
            onClick={handleStartEdit}
            className="px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors min-h-[44px]"
          >
            Edit
          </button>
        )}
        
        {isEditing && isLockedByMe && (
          <>
            <button
              onClick={handleStopEdit}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors min-h-[44px]"
            >
              Save
            </button>
            <button
              onClick={handleStopEdit}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Conflict modal */}
      {conflictUser && (
        <EditingConflictModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          editingUser={conflictUser}
          itemType={itemType}
        />
      )}
    </div>
  );
};
