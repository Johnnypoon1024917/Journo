/**
 * Example usage of TimeCalculationService
 * 
 * This file demonstrates how to use the time calculation service
 * in various scenarios within the trip planner.
 */

import { timeCalculationService } from './timeCalculationService';
import { routeCalculationService } from './routeCalculationService';
import { Place } from '../types/trip';
import { OfflinePlace } from '../types/offline';

/**
 * Example 1: Calculate arrival time for a single place
 */
export async function calculateSinglePlaceArrival(
  currentPlace: Place,
  previousPlace: Place
) {
  // First, get the route between places
  if (!previousPlace.lat || !previousPlace.lng || !currentPlace.lat || !currentPlace.lng) {
    console.warn('Places missing coordinates');
    return null;
  }

  const route = await routeCalculationService.calculateRoute({
    fromPlaceId: previousPlace.id,
    toPlaceId: currentPlace.id,
    origin: { lat: previousPlace.lat, lng: previousPlace.lng },
    destination: { lat: currentPlace.lat, lng: currentPlace.lng },
    mode: currentPlace.transport_mode || 'driving',
  });

  // Calculate time for the place
  const result = timeCalculationService.calculatePlaceTime(
    currentPlace,
    previousPlace,
    route
  );

  console.log('Arrival calculation:', {
    place: currentPlace.name,
    calculatedArrival: result.calculatedArrivalTime,
    travelTime: timeCalculationService.formatDuration(result.travelTimeFromPrevious),
    hasConflict: result.hasConflict,
  });

  return result;
}

/**
 * Example 2: Update entire day schedule when one place time changes
 */
export async function updateDaySchedule(
  places: Place[],
  changedPlaceIndex: number
) {
  // Sort places by display order
  const sortedPlaces = [...places].sort((a, b) => a.display_order - b.display_order);

  // Calculate routes for all consecutive place pairs
  const routes = new Map();
  
  for (let i = 0; i < sortedPlaces.length - 1; i++) {
    const from = sortedPlaces[i];
    const to = sortedPlaces[i + 1];

    if (from.lat && from.lng && to.lat && to.lng) {
      try {
        const route = await routeCalculationService.calculateRoute({
          fromPlaceId: from.id,
          toPlaceId: to.id,
          origin: { lat: from.lat, lng: from.lng },
          destination: { lat: to.lat, lng: to.lng },
          mode: to.transport_mode || 'driving',
        });
        routes.set(`${from.id}-${to.id}`, route);
      } catch (error) {
        console.error(`Failed to calculate route from ${from.name} to ${to.name}:`, error);
      }
    }
  }

  // Cascade update times starting from the changed place
  const result = timeCalculationService.cascadeUpdateTimes(
    sortedPlaces,
    changedPlaceIndex,
    routes
  );

  // Log conflicts if any
  if (result.conflicts.length > 0) {
    console.warn('⚠️ Time conflicts detected:');
    result.conflicts.forEach(conflict => {
      console.warn(`  - ${conflict.placeName}: ${conflict.message}`);
    });
  }

  return result;
}

/**
 * Example 3: Handle place reordering with time recalculation
 */
export async function handlePlaceReorder(
  places: Place[],
  draggedPlaceId: string,
  newIndex: number
) {
  // Reorder places
  const sortedPlaces = [...places].sort((a, b) => a.display_order - b.display_order);
  const draggedIndex = sortedPlaces.findIndex(p => p.id === draggedPlaceId);
  const [draggedPlace] = sortedPlaces.splice(draggedIndex, 1);
  sortedPlaces.splice(newIndex, 0, draggedPlace);

  // Update display_order
  sortedPlaces.forEach((place, index) => {
    place.display_order = index;
  });

  // Recalculate times for affected places
  const startIndex = Math.min(draggedIndex, newIndex);
  return await updateDaySchedule(sortedPlaces, startIndex);
}

/**
 * Example 4: Validate day schedule and show warnings
 */
export function validateDaySchedule(places: Place[]): {
  isValid: boolean;
  warnings: string[];
  totalTravelTime: string;
} {
  const sortedPlaces = [...places].sort((a, b) => a.display_order - b.display_order);
  const warnings: string[] = [];

  // Check for time conflicts
  for (let i = 1; i < sortedPlaces.length; i++) {
    const current = sortedPlaces[i];
    const previous = sortedPlaces[i - 1];

    if (previous.time_end && current.time_start) {
      const prevEndMinutes = timeCalculationService['timeToMinutes'](previous.time_end);
      const currStartMinutes = timeCalculationService['timeToMinutes'](current.time_start);

      if (currStartMinutes < prevEndMinutes) {
        warnings.push(
          `${current.name} starts before ${previous.name} ends (overlap of ${prevEndMinutes - currStartMinutes} minutes)`
        );
      }
    }

    // Check for unrealistic travel times
    if (current.travel_time_seconds && current.travel_time_seconds > 4 * 3600) {
      warnings.push(
        `Travel to ${current.name} takes over 4 hours - consider splitting into multiple days`
      );
    }
  }

  // Calculate total travel time
  const totalTravelSeconds = timeCalculationService.calculateDayTotalTravelTime(sortedPlaces);
  const totalTravelTime = timeCalculationService.formatDuration(totalTravelSeconds);

  // Warn if total travel time is excessive
  if (totalTravelSeconds > 6 * 3600) {
    warnings.push(
      `Total travel time (${totalTravelTime}) exceeds 6 hours - consider reducing distances`
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    totalTravelTime,
  };
}

/**
 * Example 5: Working with OfflinePlace type
 */
export function convertOfflinePlaceToPlace(offlinePlace: OfflinePlace): Place {
  return {
    id: offlinePlace.id,
    trip_day_id: offlinePlace.trip_day_id,
    name: offlinePlace.name,
    address: offlinePlace.address || null,
    lat: offlinePlace.lat || null,
    lng: offlinePlace.lng || null,
    time_start: offlinePlace.time_start || null,
    time_end: offlinePlace.time_end || null,
    notes: offlinePlace.notes || null,
    image_url: offlinePlace.image_url || null,
    place_type: offlinePlace.place_type || null,
    sticker: offlinePlace.sticker || null,
    cost: offlinePlace.cost || null,
    cost_currency: offlinePlace.cost_currency || null,
    budget_category: (offlinePlace.budget_category as any) || null,
    transport_mode: offlinePlace.transport_mode || null,
    travel_time_seconds: offlinePlace.travel_time || null,
    travel_distance_meters: offlinePlace.travel_distance || null,
    travel_time_text: null,
    travel_distance_text: null,
    display_order: offlinePlace.place_order || 0,
    created_at: offlinePlace.created_at,
    updated_at: offlinePlace.updated_at,
  };
}

export async function calculateTimesForOfflinePlaces(offlinePlaces: OfflinePlace[]) {
  // Convert to Place type
  const places = offlinePlaces.map(convertOfflinePlaceToPlace);
  
  // Calculate times
  const result = await updateDaySchedule(places, 0);
  
  // Convert back to OfflinePlace updates
  const updates = result.updatedPlaces.map(update => {
    const place = offlinePlaces.find(p => p.id === update.placeId);
    return {
      id: update.placeId,
      travel_time: update.travelTimeFromPrevious,
      time_start: update.calculatedArrivalTime || place?.time_start,
    };
  });
  
  return { updates, conflicts: result.conflicts };
}

/**
 * Example 6: Smart scheduling - suggest optimal start time
 */
export function suggestOptimalStartTime(
  places: Place[],
  desiredEndTime: string
): string | null {
  const sortedPlaces = [...places].sort((a, b) => a.display_order - b.display_order);
  
  // Calculate total time needed (activities + travel)
  let totalMinutes = 0;
  
  sortedPlaces.forEach(place => {
    // Add activity duration
    if (place.time_start && place.time_end) {
      totalMinutes += timeCalculationService.getTimeDifferenceMinutes(
        place.time_start,
        place.time_end
      );
    }
    
    // Add travel time
    if (place.travel_time_seconds) {
      totalMinutes += Math.ceil(place.travel_time_seconds / 60);
    }
  });
  
  // Calculate suggested start time
  const endMinutes = timeCalculationService['timeToMinutes'](desiredEndTime);
  const startMinutes = endMinutes - totalMinutes;
  
  if (startMinutes < 0) {
    console.warn('Cannot fit all activities before desired end time');
    return null;
  }
  
  return timeCalculationService.minutesToTime(startMinutes);
}

/**
 * Example 7: Real-time updates with optimistic UI
 */
export async function updatePlaceTimeWithOptimisticUI(
  place: Place,
  newStartTime: string,
  allPlaces: Place[],
  onOptimisticUpdate: (updates: any[]) => void,
  onSuccess: (result: any) => void,
  onError: (error: Error) => void
) {
  // Validate time format
  if (!timeCalculationService.isValidTimeFormat(newStartTime)) {
    onError(new Error('Invalid time format. Use HH:MM'));
    return;
  }

  // Optimistic update
  const optimisticPlace = { ...place, time_start: newStartTime };
  const placeIndex = allPlaces.findIndex(p => p.id === place.id);
  const optimisticPlaces = [...allPlaces];
  optimisticPlaces[placeIndex] = optimisticPlace;

  // Show optimistic update immediately
  onOptimisticUpdate([optimisticPlace]);

  try {
    // Calculate cascade updates
    const result = await updateDaySchedule(optimisticPlaces, placeIndex);
    
    // Apply all updates
    onSuccess(result);
  } catch (error) {
    // Rollback on error
    onError(error as Error);
  }
}

/**
 * Example 8: Generate day summary with time statistics
 */
export function generateDaySummary(places: Place[]): {
  totalPlaces: number;
  totalTravelTime: string;
  totalActivityTime: string;
  firstActivity: string | null;
  lastActivity: string | null;
  conflicts: number;
} {
  const sortedPlaces = [...places].sort((a, b) => a.display_order - b.display_order);
  
  // Calculate travel time
  const totalTravelSeconds = timeCalculationService.calculateDayTotalTravelTime(sortedPlaces);
  
  // Calculate activity time
  let totalActivityMinutes = 0;
  sortedPlaces.forEach(place => {
    if (place.time_start && place.time_end) {
      totalActivityMinutes += timeCalculationService.getTimeDifferenceMinutes(
        place.time_start,
        place.time_end
      );
    }
  });
  
  // Find first and last activities
  const firstPlace = sortedPlaces[0];
  const lastPlace = sortedPlaces[sortedPlaces.length - 1];
  
  return {
    totalPlaces: sortedPlaces.length,
    totalTravelTime: timeCalculationService.formatDuration(totalTravelSeconds),
    totalActivityTime: timeCalculationService.formatDuration(totalActivityMinutes * 60),
    firstActivity: firstPlace?.time_start || null,
    lastActivity: lastPlace?.time_end || null,
    conflicts: 0, // Would need to run validation to get actual count
  };
}
