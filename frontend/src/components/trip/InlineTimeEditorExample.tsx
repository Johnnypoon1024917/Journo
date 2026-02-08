/**
 * Example component demonstrating how to integrate InlineTimeEditor
 * with time calculation service for cascading updates
 * 
 * This example shows:
 * 1. How to use InlineTimeEditor component
 * 2. How to handle time changes with optimistic updates
 * 3. How to cascade time updates to subsequent places
 * 4. How to integrate with the trip planner store
 */

import React, { useState, useCallback } from 'react';
import { Place } from '../../types/trip';
import { PlaceCardWithInlineEditor } from './PlaceCardWithInlineEditor';
import { timeCalculationService } from '../../services/timeCalculationService';
import { useTripPlannerStore } from '../../stores/tripPlannerStore';

interface InlineTimeEditorExampleProps {
  dayId: string;
}

export const InlineTimeEditorExample: React.FC<InlineTimeEditorExampleProps> = ({ dayId }) => {
  const { getPlacesByDay, updatePlace } = useTripPlannerStore();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Get all places for the day
  const places = getPlacesByDay(dayId);

  /**
   * Handle time change for a single place
   * This demonstrates optimistic update pattern
   */
  const handleTimeChange = useCallback(
    async (placeId: string, startTime: string, endTime: string) => {
      // Optimistic update - update UI immediately
      updatePlace(placeId, {
        time_start: startTime,
        time_end: endTime,
        is_syncing: true,
      });

      try {
        // Make API call to save changes
        // In a real implementation, this would call your API service
        // await placeService.updatePlace(placeId, { time_start: startTime, time_end: endTime });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update success - remove syncing flag
        updatePlace(placeId, {
          is_syncing: false,
          sync_error: null,
        });
      } catch (error) {
        // Rollback on error
        const originalPlace = places.find(p => p.id === placeId);
        if (originalPlace) {
          updatePlace(placeId, {
            time_start: originalPlace.time_start,
            time_end: originalPlace.time_end,
            is_syncing: false,
            sync_error: 'Failed to update time',
          });
        }
        throw error;
      }
    },
    [places, updatePlace]
  );

  /**
   * Handle cascading time updates to subsequent places
   * This demonstrates how to use the time calculation service
   */
  const handleCascadeTimeUpdate = useCallback(
    async (updatedPlaces: Place[], startIndex: number) => {
      // Calculate new times for all subsequent places
      const result = timeCalculationService.cascadeUpdateTimes(
        updatedPlaces,
        startIndex,
        new Map() // Route cache - in real implementation, get from store
      );

      // Apply updates optimistically
      for (const update of result.updatedPlaces) {
        const place = updatedPlaces.find(p => p.id === update.placeId);
        if (place && update.calculatedArrivalTime) {
          updatePlace(update.placeId, {
            calculated_arrival_time: update.calculatedArrivalTime,
            travel_time_seconds: update.travelTimeFromPrevious,
            is_syncing: true,
          });
        }
      }

      try {
        // Make API calls to save all changes
        // In a real implementation, this would batch update via API
        // await placeService.batchUpdatePlaces(result.updatedPlaces);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update success - remove syncing flags
        for (const update of result.updatedPlaces) {
          updatePlace(update.placeId, {
            is_syncing: false,
            sync_error: null,
          });
        }
      } catch (error) {
        // Rollback on error
        for (const update of result.updatedPlaces) {
          const originalPlace = places.find(p => p.id === update.placeId);
          if (originalPlace) {
            updatePlace(update.placeId, {
              calculated_arrival_time: originalPlace.calculated_arrival_time,
              travel_time_seconds: originalPlace.travel_time_seconds,
              is_syncing: false,
              sync_error: 'Failed to update times',
            });
          }
        }
        throw error;
      }
    },
    [places, updatePlace]
  );

  return (
    <div className="inline-time-editor-example">
      <div className="example-header">
        <h2>Inline Time Editor Example</h2>
        <p>Click the time badge on any place card to edit times inline</p>
      </div>

      <div className="places-list">
        {places.map((place, index) => (
          <PlaceCardWithInlineEditor
            key={place.id}
            place={place}
            index={index}
            allPlacesInDay={places}
            isSelected={selectedPlaceId === place.id}
            onSelect={() => setSelectedPlaceId(place.id)}
            onTimeChange={handleTimeChange}
            onCascadeTimeUpdate={handleCascadeTimeUpdate}
          />
        ))}
      </div>

      <div className="example-info">
        <h3>How it works:</h3>
        <ol>
          <li>Click the time badge (⏱️) on any place card</li>
          <li>Drag the slider thumbs to adjust start and end times</li>
          <li>Times snap to 15-minute intervals with haptic feedback</li>
          <li>Changes are saved optimistically (UI updates immediately)</li>
          <li>Subsequent places are automatically recalculated</li>
          <li>If the API call fails, changes are rolled back</li>
        </ol>

        <h3>Features demonstrated:</h3>
        <ul>
          <li>✅ Dual slider thumbs for start/end time</li>
          <li>✅ 15-minute snap intervals</li>
          <li>✅ Haptic feedback on mobile</li>
          <li>✅ Visual time range indicator</li>
          <li>✅ Auto-recalculation of subsequent times</li>
          <li>✅ Optimistic updates with rollback</li>
          <li>✅ Loading states during sync</li>
          <li>✅ Error handling with retry</li>
        </ul>
      </div>

      <style>{`
        .inline-time-editor-example {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .example-header {
          margin-bottom: 24px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
        }

        .dark .example-header {
          background: #1f2937;
          border-color: #374151;
        }

        .example-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }

        .dark .example-header h2 {
          color: #f9fafb;
        }

        .example-header p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .dark .example-header p {
          color: #9ca3af;
        }

        .places-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .example-info {
          padding: 20px;
          background: #f0f9ff;
          border-radius: 12px;
          border: 2px solid #bae6fd;
        }

        .dark .example-info {
          background: #0c4a6e;
          border-color: #075985;
        }

        .example-info h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #0369a1;
        }

        .dark .example-info h3 {
          color: #bae6fd;
        }

        .example-info ol,
        .example-info ul {
          margin: 0;
          padding-left: 24px;
          color: #0c4a6e;
        }

        .dark .example-info ol,
        .dark .example-info ul {
          color: #e0f2fe;
        }

        .example-info li {
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.6;
        }

        .example-info ul {
          list-style: none;
          padding-left: 0;
        }

        .example-info ul li {
          padding-left: 24px;
          position: relative;
        }

        @media (max-width: 768px) {
          .inline-time-editor-example {
            padding: 12px;
          }

          .example-header {
            padding: 16px;
          }

          .example-header h2 {
            font-size: 20px;
          }

          .example-info {
            padding: 16px;
          }

          .example-info h3 {
            font-size: 14px;
          }

          .example-info li {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};
