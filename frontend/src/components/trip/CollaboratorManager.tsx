import { useState, useEffect } from 'react';
import { TripCollaboratorWithUser } from '../../types/collaboration';
import { collaboratorService } from '../../features/collab/collaboratorService';
import { CollaboratorList } from './CollaboratorList';
import { AddCollaborator } from './AddCollaborator';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';

interface CollaboratorManagerProps {
  tripId: string;
  isOwner: boolean;
}

export function CollaboratorManager({ tripId, isOwner }: CollaboratorManagerProps) {
  const [collaborators, setCollaborators] = useState<TripCollaboratorWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useEnhancedAuthStore((state) => state.user);

  const fetchCollaborators = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await collaboratorService.getTripCollaborators(tripId);
      setCollaborators(data);
    } catch (err: any) {
      console.error('Error fetching collaborators:', err);
      setError(err.message || 'Failed to load collaborators');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, [tripId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <AddCollaborator tripId={tripId} onAdded={fetchCollaborators} />
      )}

      <CollaboratorList
        tripId={tripId}
        collaborators={collaborators}
        currentUserId={user?.id || ''}
        isOwner={isOwner}
        onUpdate={fetchCollaborators}
      />

      {!isOwner && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ Only the trip owner can manage collaborators
          </p>
        </div>
      )}
    </div>
  );
}
