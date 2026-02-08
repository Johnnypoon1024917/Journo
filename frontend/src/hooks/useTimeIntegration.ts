import { useState, useEffect, useCallback } from 'react';
import { Place } from '../types/trip';
import { timeCalculationService } from '../services/timeCalculationService';

interface TimeConflict {
  placeId: string;
  message: string;
}

export function useTimeIntegration(places: Place[]) {
  const [conflicts, setConflicts] = useState<TimeConflict[]>([]);
  const timeService = timeCalculationService;

  // Calculate arrival times for all places
  const calculateArrivalTimes = useCallback((): Place[] => {
    if (places.length === 0) return places;

    const updatedPlaces = [...places];
    const DEFAULT_START_TIME = '08:00';
    const DEFAULT_DURATION_MINUTES = 30;

    for (let i = 0; i < updatedPlaces.length; i++) {
      const place = updatedPlaces[i];
      
      if (i === 0) {
        // First place: default to 8 AM if no start time
        const startTime = place.time_start || DEFAULT_START_TIME;
        const endTime = place.time_end || timeService.addMinutesToTime(startTime, DEFAULT_DURATION_MINUTES);
        
        updatedPlaces[i] = {
          ...place,
          time_start: startTime,
          time_end: endTime,
          calculated_arrival_time: startTime,
        };
        continue;
      }

      const previousPlace = updatedPlaces[i - 1];
      
      // Ensure previous place has an end time
      if (!previousPlace.time_end && previousPlace.time_start) {
        updatedPlaces[i - 1] = {
          ...previousPlace,
          time_end: timeService.addMinutesToTime(previousPlace.time_start, DEFAULT_DURATION_MINUTES),
        };
      }

      const prevEndTime = updatedPlaces[i - 1].time_end;
      
      // Calculate arrival time based on previous place's departure and travel time
      let arrivalTime: string | null = null;
      
      if (prevEndTime && place.travel_time_seconds) {
        arrivalTime = timeService.computeArrivalTime(
          prevEndTime,
          place.travel_time_seconds
        );
      } else if (prevEndTime) {
        // No travel time, arrive immediately after previous place ends
        arrivalTime = prevEndTime;
      }

      // Set start time to arrival time if not specified
      const startTime = place.time_start || arrivalTime || DEFAULT_START_TIME;
      const endTime = place.time_end || timeService.addMinutesToTime(startTime, DEFAULT_DURATION_MINUTES);
      
      updatedPlaces[i] = {
        ...place,
        time_start: startTime,
        time_end: endTime,
        calculated_arrival_time: arrivalTime,
      };
    }

    return updatedPlaces;
  }, [places, timeService]);

  // Detect time conflicts
  const detectConflicts = useCallback((): TimeConflict[] => {
    const newConflicts: TimeConflict[] = [];

    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      
      // Check if arrival time is after start time (late arrival)
      if (place.calculated_arrival_time && place.time_start) {
        if (place.calculated_arrival_time > place.time_start) {
          newConflicts.push({
            placeId: place.id,
            message: `Arrival time (${place.calculated_arrival_time}) is after scheduled start (${place.time_start})`,
          });
        }
      }

      // Check if end time is before start time
      if (place.time_start && place.time_end) {
        if (place.time_end <= place.time_start) {
          newConflicts.push({
            placeId: place.id,
            message: `End time must be after start time`,
          });
        }
      }

      // Check overlap with next place
      if (i < places.length - 1) {
        const nextPlace = places[i + 1];
        
        if (place.time_end && nextPlace.calculated_arrival_time) {
          if (place.time_end > nextPlace.calculated_arrival_time) {
            newConflicts.push({
              placeId: nextPlace.id,
              message: `Overlaps with previous activity`,
            });
          }
        }
      }
    }

    return newConflicts;
  }, [places]);

  // Update conflicts when places change
  useEffect(() => {
    const newConflicts = detectConflicts();
    setConflicts(newConflicts);
  }, [detectConflicts]);

  // Cascade time updates when a place's time changes
  const cascadeTimeUpdate = useCallback(
    (placeId: string, newTime: string, field: 'time_start' | 'time_end'): Place[] => {
      const placeIndex = places.findIndex((p) => p.id === placeId);
      if (placeIndex === -1) return places;

      const updatedPlaces = [...places];
      updatedPlaces[placeIndex] = {
        ...updatedPlaces[placeIndex],
        [field]: newTime,
      };

      // Recalculate arrival times for subsequent places
      for (let i = placeIndex + 1; i < updatedPlaces.length; i++) {
        const place = updatedPlaces[i];
        const previousPlace = updatedPlaces[i - 1];

        if (previousPlace.time_end && place.travel_time_seconds) {
          const arrivalTime = timeService.computeArrivalTime(
            previousPlace.time_end,
            place.travel_time_seconds
          );

          updatedPlaces[i] = {
            ...place,
            calculated_arrival_time: arrivalTime,
          };
        }
      }

      return updatedPlaces;
    },
    [places, timeService]
  );

  // Get conflict for a specific place
  const getConflict = useCallback(
    (placeId: string): TimeConflict | null => {
      return conflicts.find((c) => c.placeId === placeId) || null;
    },
    [conflicts]
  );

  // Check if a place has a conflict
  const hasConflict = useCallback(
    (placeId: string): boolean => {
      return conflicts.some((c) => c.placeId === placeId);
    },
    [conflicts]
  );

  // Format duration for display
  const formatDuration = useCallback((seconds: number): string => {
    return timeService.formatDuration(seconds);
  }, [timeService]);

  return {
    calculateArrivalTimes,
    cascadeTimeUpdate,
    getConflict,
    hasConflict,
    conflicts,
    formatDuration,
  };
}
