import { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  pointerWithin
} from '@dnd-kit/core';
import { TripDayWithPlaces, Trip, Place } from '../../types/trip';
import { dayService } from '../../services/dayService';
import { placeService } from '../../services/placeService';
import { useToast } from '../../hooks/useToast';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';
import PlaceList from './PlaceList';

interface DayEditorProps {
  trip: Trip;
  days: TripDayWithPlaces[];
  onDaysChange: () => void;
}

export default function DayEditor({ trip, days, onDaysChange }: DayEditorProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const { success: showSuccess, error: showError } = useToast();

  const calculateDate = (dayNumber: number): string | null => {
    if (!trip.start_date) return null;
    const startDate = new Date(trip.start_date);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayNumber - 1);
    return dayDate.toISOString().split('T')[0];
  };

  const handleAddDay = async () => {
    try {
      setLoading(true);
      const nextDayNumber = days.length + 1;
      const date = calculateDate(nextDayNumber);

      await dayService.createDay({
        trip_id: trip.id,
        day_number: nextDayNumber,
        date: date || undefined,
      });

      showSuccess('Day added successfully');
      onDaysChange();
    } catch (error: any) {
      console.error('Error adding day:', error);
      showError(error.response?.data?.error || 'Failed to add day');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    try {
      setLoading(true);
      await dayService.deleteDay(dayId);
      showSuccess('Day deleted successfully');
      setDeleteConfirm(null);
      onDaysChange();
    } catch (error: any) {
      console.error('Error deleting day:', error);
      showError(error.response?.data?.error || 'Failed to delete day');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const placeId = active.id as string;
    
    // Find the place being dragged
    for (const day of days) {
      const place = day.places.find(p => p.id === placeId);
      if (place) {
        setActivePlace(place);
        break;
      }
    }
  };



  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActivePlace(null);
    
    if (!over) return;
    
    const placeId = active.id as string;
    const overId = over.id as string;
    
    // Find source day and place
    let sourceDayId: string | null = null;
    let sourcePlace: Place | null = null;
    
    for (const day of days) {
      const place = day.places.find(p => p.id === placeId);
      if (place) {
        sourceDayId = day.id;
        sourcePlace = place;
        break;
      }
    }
    
    if (!sourceDayId || !sourcePlace) return;
    
    // Determine target day and index
    let targetDayId: string;
    let targetIndex: number;
    
    // Check if dropping on a place
    const targetPlace = days.flatMap(d => d.places).find(p => p.id === overId);
    if (targetPlace) {
      // Dropping on another place
      const targetDay = days.find(d => d.places.some(p => p.id === overId));
      if (!targetDay) return;
      
      targetDayId = targetDay.id;
      targetIndex = targetDay.places.findIndex(p => p.id === overId);
      
      // If same day and dropping after the source, adjust index
      if (targetDayId === sourceDayId) {
        const sourceIndex = targetDay.places.findIndex(p => p.id === placeId);
        if (sourceIndex < targetIndex) {
          targetIndex--;
        }
      }
    } else {
      // Dropping on a day (empty area)
      targetDayId = overId;
      const targetDay = days.find(d => d.id === targetDayId);
      if (!targetDay) return;
      targetIndex = targetDay.places.length;
    }
    
    // Don't do anything if dropping in the same position
    if (sourceDayId === targetDayId) {
      const sourceDay = days.find(d => d.id === sourceDayId);
      if (sourceDay) {
        const currentIndex = sourceDay.places.findIndex(p => p.id === placeId);
        if (currentIndex === targetIndex) {
          return;
        }
      }
    }
    
    // Move the place - with refresh
    try {
      setLoading(true);
      await placeService.movePlace(placeId, targetDayId, targetIndex);
      onDaysChange(); // Refresh to get updated data
    } catch (error: any) {
      console.error('Error moving place:', error);
      showError(error.response?.data?.error || 'Failed to move place');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'No date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trip Days ({days.length})
          </h3>
          <Button
            onClick={handleAddDay}
            disabled={loading}
            size="sm"
          >
            + Add Day
          </Button>
        </div>

        {days.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No days added yet. Click "Add Day" to start planning your itinerary.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <div
                key={day.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-semibold">
                      {day.day_number}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Day {day.day_number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(day.date)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {day.places.length} place{day.places.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteConfirm(day.id)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete day"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Places List */}
                <div className="p-4">
                  <PlaceList 
                    dayId={day.id} 
                    places={day.places} 
                    onPlacesChange={onDaysChange}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {deleteConfirm && (
          <ConfirmModal
            isOpen={true}
            title="Delete Day"
            message="Are you sure you want to delete this day? All places in this day will also be deleted."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={() => handleDeleteDay(deleteConfirm)}
            onClose={() => setDeleteConfirm(null)}
            variant="danger"
          />
        )}
      </div>

      <DragOverlay>
        {activePlace ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-blue-500 shadow-lg opacity-90">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {activePlace.sticker || '📍'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {activePlace.name}
                </p>
                {activePlace.address && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {activePlace.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
