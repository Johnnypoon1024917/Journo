import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Place } from '../../types/trip';
import { placeService } from '../../services/placeService';
import { useToast } from '../../hooks/useToast';
import { Button } from '../common/Button';
import PlaceEditor from './PlaceEditor';
import { ConfirmModal } from '../common/ConfirmModal';
import { travelTimeService } from '../../services/travelTimeService';
import SortablePlaceItem from './SortablePlaceItem.js';

interface PlaceListProps {
  dayId: string;
  places: Place[];
  onPlacesChange: () => void;
}

export default function PlaceList({ dayId, places, onPlacesChange }: PlaceListProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const { setNodeRef } = useDroppable({
    id: dayId,
  });

  // Calculate total daily travel time
  const dailyTravelTime = useMemo(() => {
    return travelTimeService.calculateDailyTravelTime(places);
  }, [places]);

  const placeIds = useMemo(() => places.map(p => p.id), [places]);

  const handleAddPlace = () => {
    setEditingPlace(undefined);
    setIsEditorOpen(true);
  };

  const handleEditPlace = (place: Place) => {
    setEditingPlace(place);
    setIsEditorOpen(true);
  };

  const handleDeletePlace = async (placeId: string) => {
    try {
      setLoading(true);
      await placeService.deletePlace(placeId);
      showSuccess('Place deleted successfully');
      setDeleteConfirm(null);
      onPlacesChange();
    } catch (error: any) {
      console.error('Error deleting place:', error);
      showError(error.response?.data?.error || 'Failed to delete place');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Places ({places.length})
        </h4>
        <Button onClick={handleAddPlace} size="sm" variant="ghost">
          + Add Place
        </Button>
      </div>

      <div ref={setNodeRef}>
        {places.length === 0 ? (
          <div className="text-center py-6 rounded-lg border-2 border-dashed bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No places added yet. Click "Add Place" to start.
            </p>
          </div>
        ) : (
          <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {places.map((place, index) => (
                <SortablePlaceItem
                  key={place.id}
                  place={place}
                  index={index}
                  onEdit={handleEditPlace}
                  onDelete={() => setDeleteConfirm(place.id)}
                  disabled={loading}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* Total Daily Travel Time */}
      {dailyTravelTime.total_seconds > 0 && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Total Travel Time
            </span>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {dailyTravelTime.formatted_text}
            </span>
          </div>
        </div>
      )}

      <PlaceEditor
        dayId={dayId}
        place={editingPlace}
        previousPlace={places.length > 0 ? places[places.length - 1] : undefined}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPlace(undefined);
        }}
        onSave={onPlacesChange}
      />

      {deleteConfirm && (
        <ConfirmModal
          isOpen={true}
          title="Delete Place"
          message="Are you sure you want to delete this place?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => handleDeletePlace(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
