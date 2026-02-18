import { useState } from 'react';
import { TripCollaboratorWithUser, CollaboratorRole } from '../../types/collaboration';
import { collaboratorService } from '../../features/collab/collaboratorService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useToast } from '../../hooks/useToast';

interface CollaboratorListProps {
  tripId: string;
  collaborators: TripCollaboratorWithUser[] | undefined;
  currentUserId: string;
  isOwner: boolean;
  onUpdate: () => void;
}

export function CollaboratorList({
  tripId,
  collaborators,
  currentUserId,
  isOwner,
  onUpdate
}: CollaboratorListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>('viewer');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { error, success } = useToast();

  const handleRoleChange = async (collaboratorId: string, newRole: CollaboratorRole) => {
    try {
      await collaboratorService.updateCollaboratorRole(tripId, collaboratorId, newRole);
      success('Collaborator role updated successfully');
      setEditingId(null);
      onUpdate();
    } catch (err: any) {
      error(err.message || 'Failed to update role');
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    try {
      await collaboratorService.removeCollaborator(tripId, collaboratorId);
      success('Collaborator removed successfully');
      setRemovingId(null);
      onUpdate();
    } catch (err: any) {
      error(err.message || 'Failed to remove collaborator');
    }
  };

  const getRoleBadgeColor = (role: CollaboratorRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRoleIcon = (role: CollaboratorRole) => {
    switch (role) {
      case 'owner':
        return '👑';
      case 'editor':
        return '✏️';
      case 'viewer':
        return '👁️';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Collaborators ({collaborators?.length || 0})
      </h3>

      <div className="space-y-2">
        {collaborators?.map((collaborator) => {
          const isCurrentUser = collaborator.user_id === currentUserId;
          const canEdit = isOwner && collaborator.role !== 'owner';

          return (
            <div
              key={collaborator.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {collaborator.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {collaborator.user.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          (You)
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {collaborator.user.email}
                  </p>
                  {collaborator.inviter && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Invited by {collaborator.inviter.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {editingId === collaborator.id ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as CollaboratorRole)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={() => handleRoleChange(collaborator.id, selectedRole)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getRoleBadgeColor(
                        collaborator.role
                      )}`}
                    >
                      <span>{getRoleIcon(collaborator.role)}</span>
                      <span className="capitalize">{collaborator.role}</span>
                    </span>

                    {canEdit && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingId(collaborator.id);
                            setSelectedRole(collaborator.role);
                          }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => setRemovingId(collaborator.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        }) || (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No collaborators found
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {removingId && (
        <Modal
          isOpen={true}
          onClose={() => setRemovingId(null)}
          title="Remove Collaborator"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to remove this collaborator? They will lose access to this trip.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setRemovingId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleRemove(removingId)}>
                Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
