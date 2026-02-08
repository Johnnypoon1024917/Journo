import React, { useState, useCallback } from 'react';
import { Place } from '../../types/trip';
import { SortablePlaceList } from './SortablePlaceList';
import { useOptimisticUpdateManager } from '../../hooks/useOptimisticUpdateManager';
import { usePlaceStore } from '../../stores/placeStore';

interface OptimisticPlaceListProps {
  dayId: string;
  places: Place[];
  onPlaceSelect?: (placeId: string) => void;
  onPlaceEdit?: (placeId: string) => void;
  onPlaceDelete?: (placeId: string) => void;
  selectedPlaceId?: string | null;
  renderBeforePlace?: (place: Place, index: number) => React.ReactNode;
}

export const OptimisticPlaceList: React.FC<OptimisticPlaceListProps> = ({
  dayId,
  places: initialPlaces,
  onPlaceSelect,
  onPlaceEdit,
  onPlaceDelete,
  selectedPlaceId,
  renderBeforePlace,
}) => {
  const [places, setPlaces] = useState(initialPlaces);
  const { reorderPlaces } = usePlaceStore();
  const optimisticManager = useOptimisticUpdateManager();

  // Update local state when props change
  React.useEffect(() => {
    setPlaces(initialPlaces);
  }, [initialPlaces]);

  const handleReorder = useCallback(
    async (reorderedPlaces: Place[]) => {
      // Store previous state for rollback
      const previousPlaces = [...places];

      // Optimistic update: immediately update UI with new order
      const updatedPlaces = reorderedPlaces.map((place, index) => ({
        ...place,
        display_order: index,
        is_syncing: true,
      }));

      setPlaces(updatedPlaces);

      try {
        // Queue the operation
        const operationId = await optimisticManager.queueOperation({
          type: 'place_reorder',
          resourceType: 'place',
          resourceId: dayId,
          data: {
            places: updatedPlaces.map((p) => ({
              id: p.id,
              display_order: p.display_order,
            })),
          },
          execute: async () => {
            // Call the API to persist the reorder
            await reorderPlaces(
              dayId,
              updatedPlaces.map((p) => p.id)
            );
          },
          rollback: () => {
            // Rollback to previous state
            setPlaces(previousPlaces);
          },
        });

        // Wait for the operation to complete
        await optimisticManager.waitForOperation(operationId);

        // Success: remove syncing state
        setPlaces((current) =>
          current.map((place) => ({
            ...place,
            is_syncing: false,
            sync_error: null,
          }))
        );
      } catch (error) {
        console.error('Failed to reorder places:', error);

        // Error: mark places with error state
        setPlaces((current) =>
          current.map((place) => ({
            ...place,
            is_syncing: false,
            sync_error: error instanceof Error ? error.message : 'Failed to sync',
          }))
        );

        // Rollback after a delay to show error
        setTimeout(() => {
          setPlaces(previousPlaces);
        }, 2000);
      }
    },
    [places, dayId, reorderPlaces, optimisticManager]
  );

  const handleRetry = useCallback(
    async (placeId: string) => {
      const place = places.find((p) => p.id === placeId);
      if (!place) return;

      // Clear error and set syncing
      setPlaces((current) =>
        current.map((p) =>
          p.id === placeId
            ? { ...p, is_syncing: true, sync_error: null }
            : p
        )
      );

      try {
        // Retry the reorder operation
        await reorderPlaces(
          dayId,
          places.map((p) => p.id)
        );

        // Success
        setPlaces((current) =>
          current.map((p) =>
            p.id === placeId
              ? { ...p, is_syncing: false, sync_error: null }
              : p
          )
        );
      } catch (error) {
        console.error('Retry failed:', error);

        // Error
        setPlaces((current) =>
          current.map((p) =>
            p.id === placeId
              ? {
                  ...p,
                  is_syncing: false,
                  sync_error: error instanceof Error ? error.message : 'Failed to sync',
                }
              : p
          )
        );
      }
    },
    [places, dayId, reorderPlaces]
  );

  return (
    <SortablePlaceList
      places={places}
      onReorder={handleReorder}
      onPlaceSelect={onPlaceSelect}
      onPlaceEdit={onPlaceEdit}
      onPlaceDelete={onPlaceDelete}
      onPlaceRetry={handleRetry}
      selectedPlaceId={selectedPlaceId}
      renderBeforePlace={renderBeforePlace}
    />
  );
};
