import { Place } from '../types/trip';

export interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
}

export interface NavigationRoute {
  origin: Place;
  destination: Place;
  steps: NavigationStep[];
  totalDistance: string;
  totalDuration: string;
  isOffline: boolean;
}

/**
 * Navigation Service
 * Provides turn-by-turn navigation using cached data when offline
 */
class NavigationService {
  /**
   * Calculate simple straight-line navigation when offline
   * This is a basic implementation - in production, you'd use more sophisticated offline routing
   */
  async getOfflineNavigation(origin: Place, destination: Place): Promise<NavigationRoute> {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      throw new Error('Origin and destination must have coordinates');
    }

    // Calculate straight-line distance
    const distance = this.calculateDistance(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    // Estimate duration based on transport mode (rough estimates)
    const transportMode = destination.transport_mode || 'driving';
    const speed = this.getAverageSpeed(transportMode);
    const duration = (distance / speed) * 60; // minutes

    // Generate basic navigation steps
    const bearing = this.calculateBearing(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );
    const direction = this.bearingToDirection(bearing);

    const steps: NavigationStep[] = [
      {
        instruction: `Head ${direction} toward ${destination.name}`,
        distance: this.formatDistance(distance),
        duration: this.formatDuration(duration),
        maneuver: 'straight',
      },
      {
        instruction: `Arrive at ${destination.name}`,
        distance: '0 m',
        duration: '0 min',
        maneuver: 'arrive',
      },
    ];

    return {
      origin,
      destination,
      steps,
      totalDistance: this.formatDistance(distance),
      totalDuration: this.formatDuration(duration),
      isOffline: true,
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate bearing between two coordinates
   */
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRad(lat2));
    const x =
      Math.cos(this.toRad(lat1)) * Math.sin(this.toRad(lat2)) -
      Math.sin(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.cos(dLon);
    const bearing = Math.atan2(y, x);
    return (this.toDeg(bearing) + 360) % 360;
  }

  /**
   * Convert bearing to cardinal direction
   */
  private bearingToDirection(bearing: number): string {
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  /**
   * Get average speed for transport mode (km/h)
   */
  private getAverageSpeed(mode: string): number {
    const speeds: Record<string, number> = {
      walking: 5,
      driving: 50,
      transit: 30,
      flight: 800,
    };
    return speeds[mode] || 50;
  }

  /**
   * Format distance for display
   */
  private formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Convert radians to degrees
   */
  private toDeg(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  /**
   * Get navigation between consecutive places in a trip
   */
  async getNavigationForTrip(places: Place[]): Promise<NavigationRoute[]> {
    const routes: NavigationRoute[] = [];

    for (let i = 0; i < places.length - 1; i++) {
      const origin = places[i];
      const destination = places[i + 1];

      if (origin.lat && origin.lng && destination.lat && destination.lng) {
        try {
          const route = await this.getOfflineNavigation(origin, destination);
          routes.push(route);
        } catch (error) {
          console.error('Error calculating navigation:', error);
        }
      }
    }

    return routes;
  }
}

export const navigationService = new NavigationService();
export default navigationService;
