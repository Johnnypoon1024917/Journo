import { mapsService } from './mapsService';
import { TransportMode } from '../types/trip';

export interface TravelTimeResult {
  duration_seconds: number;
  duration_text: string;
  distance_meters: number;
  distance_text: string;
  transport_mode: TransportMode;
}

class TravelTimeService {
  /**
   * Calculate travel time between two locations
   */
  async calculateTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    transportMode?: TransportMode
  ): Promise<TravelTimeResult | null> {
    try {
      // If transport mode is flight, don't calculate driving time
      if (transportMode === 'flight') {
        return {
          duration_seconds: 0,
          duration_text: 'Flight',
          distance_meters: 0,
          distance_text: 'N/A',
          transport_mode: 'flight',
        };
      }

      // Auto-detect transport mode if not provided
      const mode = transportMode || this.autoDetectTransportMode(origin, destination);

      // Calculate route using Google Directions API
      // Map transport mode to Google Maps travel mode
      const googleMode = mode === 'transit' ? 'transit' : mode === 'driving' ? 'driving' : 'walking';
      const result = await mapsService.calculateRoute({
        origin,
        destination,
        mode: googleMode,
      });

      if (result.routes.length === 0 || result.routes[0].legs.length === 0) {
        return null;
      }

      const leg = result.routes[0].legs[0];

      return {
        duration_seconds: leg.duration.value,
        duration_text: leg.duration.text,
        distance_meters: leg.distance.value,
        distance_text: leg.distance.text,
        transport_mode: mode,
      };
    } catch (error) {
      console.error('Error calculating travel time:', error);
      return null;
    }
  }

  /**
   * Auto-detect transport mode based on distance
   * Walking for distances < 2km, driving otherwise
   */
  private autoDetectTransportMode(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): TransportMode {
    const distance = this.calculateStraightLineDistance(origin, destination);
    
    // If distance is less than 2km, suggest walking
    if (distance < 2000) {
      return 'walking';
    }
    
    return 'driving';
  }

  /**
   * Calculate straight-line distance between two points using Haversine formula
   * Returns distance in meters
   */
  private calculateStraightLineDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate total travel time for a day
   * Returns total seconds and formatted text
   */
  calculateDailyTravelTime(places: Array<{ travel_time_seconds: number | null }>): {
    total_seconds: number;
    formatted_text: string;
  } {
    const totalSeconds = places.reduce((sum, place) => {
      return sum + (place.travel_time_seconds || 0);
    }, 0);

    return {
      total_seconds: totalSeconds,
      formatted_text: this.formatDuration(totalSeconds),
    };
  }

  /**
   * Format duration in seconds to human-readable text
   */
  private formatDuration(seconds: number): string {
    if (seconds === 0) return '0 mins';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return `${hours} hr ${minutes} mins`;
    } else if (hours > 0) {
      return `${hours} hr`;
    } else {
      return `${minutes} mins`;
    }
  }
}

export const travelTimeService = new TravelTimeService();
