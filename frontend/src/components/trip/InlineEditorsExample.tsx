import React, { useState } from 'react';
import { Place } from '../../types/trip';
import { PlaceCardWithInlineEditor } from './PlaceCardWithInlineEditor';
import { placeService } from '../../services/placeService';

/**
 * Example component demonstrating how to use PlaceCardWithInlineEditor
 * with inline time, notes, and cost editing capabilities.
 * 
 * This component shows:
 * 1. How to handle time changes with cascade updates
 * 2. How to handle notes and cost changes with optimistic updates
 * 3. How to integrate with the place service API
 */

interface InlineEditorsExampleProps {
  places: Place[];
  onPlacesUpdate: (places: Place[]) => void;
}

export const InlineEditorsExample: React.FC<InlineEditorsExampleProps> = ({
  places,
  onPlacesUpdate,
}) => {
  const [localPlaces, setLocalPlaces] = useState<Place[]>(places);

  // Handle time change for a place
  const handleTimeChange = async (placeId: string, startTime: string, endTime: string): Promise<void> => {
    try {
      // Optimistically update local state
      const updatedPlaces = localPlaces.map(p =>
        p.id === placeId
          ? { ...p, time_start: startTime, time_end: endTime, is_syncing: true }
          : p
      );
      setLocalPlaces(updatedPlaces);

      // Update via API
      const updatedPlace = await placeService.updatePlace(placeId, {
        time_start: startTime || undefined,
        time_end: endTime || undefined,
      });

      // Update with server response
      const finalPlaces = localPlaces.map(p =>
        p.id === placeId
          ? { ...updatedPlace, is_syncing: false }
          : p
      );
      setLocalPlaces(finalPlaces);
      onPlacesUpdate(finalPlaces);
    } catch (error) {
      console.error('Failed to update time:', error);
      // Revert optimistic update on error
      const revertedPlaces = localPlaces.map(p =>
        p.id === placeId
          ? { ...p, is_syncing: false, sync_error: 'Failed to update time' }
          : p
      );
      setLocalPlaces(revertedPlaces);
    }
  };

  // Handle cascade time updates for subsequent places
  const handleCascadeTimeUpdate = async (places: Place[], startIndex: number): Promise<void> => {
    try {
      // Calculate new times for subsequent places based on travel time
      const updatedPlaces = [...places];
      
      for (let i = startIndex; i < updatedPlaces.length; i++) {
        const currentPlace = updatedPlaces[i];
        const previousPlace = updatedPlaces[i - 1];

        if (previousPlace && previousPlace.time_end && currentPlace.travel_time_seconds) {
          // Calculate arrival time based on previous place's end time + travel time
          const prevEndTime = previousPlace.time_end.split(':');
          const prevEndMinutes = parseInt(prevEndTime[0]) * 60 + parseInt(prevEndTime[1]);
          const travelMinutes = Math.ceil(currentPlace.travel_time_seconds / 60);
          const arrivalMinutes = prevEndMinutes + travelMinutes;
          
          const arrivalHours = Math.floor(arrivalMinutes / 60) % 24;
          const arrivalMins = arrivalMinutes % 60;
          const newStartTime = `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMins).padStart(2, '0')}`;
          
          // Calculate new end time (preserve duration)
          if (currentPlace.time_start && currentPlace.time_end) {
            const startTime = currentPlace.time_start.split(':');
            const endTime = currentPlace.time_end.split(':');
            const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
            const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
            const duration = endMinutes - startMinutes;
            
            const newEndMinutes = arrivalMinutes + duration;
            const newEndHours = Math.floor(newEndMinutes / 60) % 24;
            const newEndMins = newEndMinutes % 60;
            const newEndTime = `${String(newEndHours).padStart(2, '0')}:${String(newEndMins).padStart(2, '0')}`;
            
            updatedPlaces[i] = {
              ...currentPlace,
              time_start: newStartTime,
              time_end: newEndTime,
              calculated_arrival_time: newStartTime,
            };
          }
        }
      }

      // Update all affected places
      setLocalPlaces(updatedPlaces);
      
      // Update via API (batch update)
      for (let i = startIndex; i < updatedPlaces.length; i++) {
        const place = updatedPlaces[i];
        await placeService.updatePlace(place.id, {
          time_start: place.time_start || undefined,
          time_end: place.time_end || undefined,
          calculated_arrival_time: place.calculated_arrival_time || undefined,
        });
      }

      onPlacesUpdate(updatedPlaces);
    } catch (error) {
      console.error('Failed to cascade time updates:', error);
    }
  };

  // Handle notes and cost change for a place
  const handleNotesAndCostChange = async (
    placeId: string,
    notes: string | null,
    cost: number | null,
    costCurrency: string
  ): Promise<void> => {
    try {
      // Optimistically update local state
      const updatedPlaces = localPlaces.map(p =>
        p.id === placeId
          ? { ...p, notes, cost, cost_currency: costCurrency, is_syncing: true }
          : p
      );
      setLocalPlaces(updatedPlaces);

      // Update via API
      const updatedPlace = await placeService.updatePlace(placeId, {
        notes: notes || undefined,
        cost: cost || undefined,
        cost_currency: costCurrency,
      });

      // Update with server response
      const finalPlaces = localPlaces.map(p =>
        p.id === placeId
          ? { ...updatedPlace, is_syncing: false }
          : p
      );
      setLocalPlaces(finalPlaces);
      onPlacesUpdate(finalPlaces);
    } catch (error) {
      console.error('Failed to update notes and cost:', error);
      // Revert optimistic update on error
      const revertedPlaces = localPlaces.map(p =>
        p.id === placeId
          ? { ...p, is_syncing: false, sync_error: 'Failed to update details' }
          : p
      );
      setLocalPlaces(revertedPlaces);
    }
  };

  return (
    <div className="inline-editors-example">
      <h2>Places with Inline Editing</h2>
      <div className="places-list">
        {localPlaces.map((place, index) => (
          <PlaceCardWithInlineEditor
            key={place.id}
            place={place}
            index={index}
            allPlacesInDay={localPlaces}
            onTimeChange={handleTimeChange}
            onCascadeTimeUpdate={handleCascadeTimeUpdate}
            onNotesAndCostChange={handleNotesAndCostChange}
            onSelect={() => console.log('Place selected:', place.id)}
            onEdit={() => console.log('Edit place:', place.id)}
            onDelete={() => console.log('Delete place:', place.id)}
          />
        ))}
      </div>

      <style>{`
        .inline-editors-example {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .inline-editors-example h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .dark .inline-editors-example h2 {
          color: #f9fafb;
        }

        .places-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};
