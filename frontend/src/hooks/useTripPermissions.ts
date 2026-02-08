import { useState, useEffect } from 'react';
import { TripPermissions } from '../types/collaboration';
import { collaboratorService } from '../services/collaboratorService';

export function useTripPermissions(tripId: string | undefined) {
  const [permissions, setPermissions] = useState<TripPermissions>({
    can_view: false,
    can_edit: false,
    can_delete: false,
    can_manage_collaborators: false,
    can_share: false,
    role: undefined
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await collaboratorService.getTripPermissions(tripId);
        setPermissions(data);
      } catch (err: any) {
        console.error('Error fetching permissions:', err);
        setError(err.response?.data?.error || 'Failed to load permissions');
        // Set default permissions on error
        setPermissions({
          can_view: false,
          can_edit: false,
          can_delete: false,
          can_manage_collaborators: false,
          can_share: false,
          role: undefined
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [tripId]);

  return { permissions, isLoading, error };
}
