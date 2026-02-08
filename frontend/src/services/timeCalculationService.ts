import { Place, TransportMode, TransportRoute } from '../types/trip';

export interface TimeCalculationResult {
  placeId: string;
  calculatedArrivalTime: string | null; // HH:MM format
  travelTimeFromPrevious: number; // seconds
  hasConflict: boolean;
  conflictReason?: string;
}

export interface TimeConflict {
  placeId: string;
  placeName: string;
  conflictType: 'overlap' | 'negative_duration' | 'insufficient_time';
  message: string;
}

export interface CascadeUpdateResult {
  updatedPlaces: TimeCalculationResult[];
  conflicts: TimeConflict[];
}

class TimeCalculationService {
  // Transport mode time multipliers for estimation when route data is unavailable
  private readonly TRANSPORT_MODE_MULTIPLIERS: Record<TransportMode, number> = {
    walking: 1.2, // 20% buffer for walking
    driving: 1.15, // 15% buffer for driving (traffic)
    transit: 1.3, // 30% buffer for transit (waiting, transfers)
    flight: 1.5, // 50% buffer for flight (check-in, security, boarding)
  };

  // Average speeds in km/h for fallback calculations
  private readonly AVERAGE_SPEEDS: Record<TransportMode, number> = {
    walking: 5,
    driving: 50,
    transit: 30,
    flight: 800,
  };

  /**
   * Calculate travel duration based on route or fallback to estimation
   */
  calculateTravelDuration(
    route: TransportRoute | null,
    distance: number | null,
    mode: TransportMode = 'driving'
  ): number {
    // If we have a route with duration, use it with multiplier
    if (route && route.duration_seconds > 0) {
      const multiplier = this.TRANSPORT_MODE_MULTIPLIERS[mode];
      return Math.round(route.duration_seconds * multiplier);
    }

    // Fallback: estimate based on distance and mode
    if (distance && distance > 0) {
      const speed = this.AVERAGE_SPEEDS[mode];
      const distanceKm = distance / 1000;
      const hours = distanceKm / speed;
      const baseSeconds = hours * 3600;
      const multiplier = this.TRANSPORT_MODE_MULTIPLIERS[mode];
      return Math.round(baseSeconds * multiplier);
    }

    // No data available
    return 0;
  }

  /**
   * Compute arrival time at a place based on previous place's end time and travel duration
   */
  computeArrivalTime(
    previousPlaceEndTime: string | null,
    travelDurationSeconds: number
  ): string | null {
    if (!previousPlaceEndTime || travelDurationSeconds === 0) {
      return null;
    }

    try {
      const [hours, minutes] = previousPlaceEndTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }

      // Convert to total minutes
      let totalMinutes = hours * 60 + minutes;
      
      // Add travel duration
      totalMinutes += Math.ceil(travelDurationSeconds / 60);

      // Handle day overflow (keep within 24 hours)
      totalMinutes = totalMinutes % (24 * 60);

      // Convert back to HH:MM format
      const newHours = Math.floor(totalMinutes / 60);
      const newMinutes = totalMinutes % 60;

      return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error computing arrival time:', error);
      return null;
    }
  }

  /**
   * Calculate time for a single place based on previous place
   */
  calculatePlaceTime(
    place: Place,
    previousPlace: Place | null,
    route: TransportRoute | null
  ): TimeCalculationResult {
    let calculatedArrivalTime: string | null = null;
    let travelTimeFromPrevious = 0;
    let hasConflict = false;
    let conflictReason: string | undefined;

    if (previousPlace) {
      // Calculate travel duration
      travelTimeFromPrevious = this.calculateTravelDuration(
        route,
        place.travel_distance_meters,
        place.transport_mode || 'driving'
      );

      // Compute arrival time
      calculatedArrivalTime = this.computeArrivalTime(
        previousPlace.time_end,
        travelTimeFromPrevious
      );

      // Check for conflicts
      const conflict = this.detectTimeConflict(
        place,
        previousPlace,
        calculatedArrivalTime,
        travelTimeFromPrevious
      );

      if (conflict) {
        hasConflict = true;
        conflictReason = conflict.message;
      }
    }

    return {
      placeId: place.id,
      calculatedArrivalTime,
      travelTimeFromPrevious,
      hasConflict,
      conflictReason,
    };
  }

  /**
   * Cascade update times for all subsequent places in a day
   */
  cascadeUpdateTimes(
    places: Place[],
    startIndex: number,
    routes: Map<string, TransportRoute>
  ): CascadeUpdateResult {
    const updatedPlaces: TimeCalculationResult[] = [];
    const conflicts: TimeConflict[] = [];

    // Sort places by display order to ensure correct sequence
    const sortedPlaces = [...places].sort((a, b) => a.display_order - b.display_order);

    for (let i = startIndex; i < sortedPlaces.length; i++) {
      const currentPlace = sortedPlaces[i];
      const previousPlace = i > 0 ? sortedPlaces[i - 1] : null;

      // Get route between previous and current place
      const routeKey = previousPlace
        ? `${previousPlace.id}-${currentPlace.id}`
        : null;
      const route = routeKey ? routes.get(routeKey) || null : null;

      // Calculate time for current place
      const result = this.calculatePlaceTime(currentPlace, previousPlace, route);
      updatedPlaces.push(result);

      // Collect conflicts
      if (result.hasConflict && result.conflictReason) {
        conflicts.push({
          placeId: currentPlace.id,
          placeName: currentPlace.name,
          conflictType: this.categorizeConflict(result.conflictReason),
          message: result.conflictReason,
        });
      }
    }

    return {
      updatedPlaces,
      conflicts,
    };
  }

  /**
   * Detect time conflicts between consecutive places
   */
  private detectTimeConflict(
    currentPlace: Place,
    previousPlace: Place,
    calculatedArrivalTime: string | null,
    _travelTime: number
  ): TimeConflict | null {
    // Check if previous place has an end time
    if (!previousPlace.time_end) {
      return null;
    }

    // Check if current place has a start time
    if (!currentPlace.time_start) {
      return null;
    }

    // Check if calculated arrival time exists
    if (!calculatedArrivalTime) {
      return null;
    }

    // Convert times to minutes for comparison
    const arrivalMinutes = this.timeToMinutes(calculatedArrivalTime);
    const startMinutes = this.timeToMinutes(currentPlace.time_start);
    const endMinutes = currentPlace.time_end
      ? this.timeToMinutes(currentPlace.time_end)
      : null;

    // Check if arrival is after scheduled start (insufficient time)
    if (arrivalMinutes > startMinutes) {
      const diffMinutes = arrivalMinutes - startMinutes;
      return {
        placeId: currentPlace.id,
        placeName: currentPlace.name,
        conflictType: 'insufficient_time',
        message: `Arrival time (${calculatedArrivalTime}) is ${diffMinutes} minutes after scheduled start (${currentPlace.time_start})`,
      };
    }

    // Check if activity duration is negative
    if (endMinutes !== null && endMinutes < startMinutes) {
      return {
        placeId: currentPlace.id,
        placeName: currentPlace.name,
        conflictType: 'negative_duration',
        message: `End time (${currentPlace.time_end}) is before start time (${currentPlace.time_start})`,
      };
    }

    // Check if there's overlap with previous place
    if (previousPlace.time_end && currentPlace.time_start) {
      const prevEndMinutes = this.timeToMinutes(previousPlace.time_end);
      const currStartMinutes = this.timeToMinutes(currentPlace.time_start);

      if (currStartMinutes < prevEndMinutes) {
        return {
          placeId: currentPlace.id,
          placeName: currentPlace.name,
          conflictType: 'overlap',
          message: `Start time (${currentPlace.time_start}) overlaps with previous activity ending at ${previousPlace.time_end}`,
        };
      }
    }

    return null;
  }

  /**
   * Convert HH:MM time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to HH:MM format
   */
  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Categorize conflict type from message
   */
  private categorizeConflict(message: string): 'overlap' | 'negative_duration' | 'insufficient_time' {
    if (message.includes('overlaps')) {
      return 'overlap';
    }
    if (message.includes('before start time')) {
      return 'negative_duration';
    }
    return 'insufficient_time';
  }

  /**
   * Format duration in seconds to human-readable format
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }

    return `${hours}h`;
  }

  /**
   * Calculate total travel time for a day
   */
  calculateDayTotalTravelTime(places: Place[]): number {
    return places.reduce((total, place) => {
      return total + (place.travel_time_seconds || 0);
    }, 0);
  }

  /**
   * Check if a time string is valid HH:MM format
   */
  isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Add minutes to a time string
   */
  addMinutesToTime(time: string, minutesToAdd: number): string {
    const minutes = this.timeToMinutes(time);
    const newMinutes = minutes + minutesToAdd;
    return this.minutesToTime(newMinutes);
  }

  /**
   * Calculate time difference between two times in minutes
   */
  getTimeDifferenceMinutes(startTime: string, endTime: string): number {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    // Handle day overflow
    if (endMinutes < startMinutes) {
      return (24 * 60 - startMinutes) + endMinutes;
    }
    
    return endMinutes - startMinutes;
  }
}

export const timeCalculationService = new TimeCalculationService();
