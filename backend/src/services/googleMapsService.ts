import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

interface DirectionsResult {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
}

interface GoogleDirectionsResponse {
  status: string;
  routes: Array<{
    legs: Array<{
      distance: { value: number };
      duration: { value: number };
    }>;
    overview_polyline: { points: string };
  }>;
}

interface GooglePlacesResponse {
  status: string;
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    user_ratings_total?: number;
  }>;
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  vicinity?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
}

export class GoogleMapsService {
  /**
   * Get directions between two points
   * @param origin - { lat, lng }
   * @param destination - { lat, lng }
   * @param mode - 'driving' | 'walking' | 'transit' | 'bicycling'
   * @returns DirectionsResult with distance, duration, and polyline
   */
  static async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: string = 'driving'
  ): Promise<DirectionsResult | null> {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured, using fallback calculation');
      return null;
    }

    try {
      // Map our transport modes to Google's travel modes
      const travelMode = mapTransportMode(mode);

      const response = await axios.get<GoogleDirectionsResponse>(
        'https://maps.googleapis.com/maps/api/directions/json',
        {
          params: {
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`,
            mode: travelMode,
            key: GOOGLE_MAPS_API_KEY,
          },
        }
      );

      if (response.data.status !== 'OK') {
        console.error('Google Directions API error:', response.data.status);
        return null;
      }

      const route = response.data.routes[0];
      if (!route) {
        return null;
      }

      const leg = route.legs[0];
      
      return {
        distance: leg.distance.value, // meters
        duration: leg.duration.value, // seconds
        polyline: route.overview_polyline.points,
      };
    } catch (error) {
      console.error('Error fetching directions from Google Maps:', error);
      return null;
    }
  }

  /**
   * Get directions for multiple waypoints using batch optimization
   * @param waypoints - Array of { lat, lng }
   * @param mode - transport mode
   * @returns Array of DirectionsResult for each segment
   */
  static async getDirectionsForRoute(
    waypoints: Array<{ lat: number; lng: number }>,
    mode: string = 'driving'
  ): Promise<DirectionsResult[]> {
    if (waypoints.length < 2) return [];

    // For routes with multiple waypoints, use the Directions API with waypoints
    // This is more efficient than individual calls
    if (waypoints.length > 2 && GOOGLE_MAPS_API_KEY) {
      try {
        const travelMode = mapTransportMode(mode);
        const origin = waypoints[0];
        const destination = waypoints[waypoints.length - 1];
        const waypointsParam = waypoints.slice(1, -1).map(wp => `${wp.lat},${wp.lng}`).join('|');

        const response = await axios.get<GoogleDirectionsResponse>(
          'https://maps.googleapis.com/maps/api/directions/json',
          {
            params: {
              origin: `${origin.lat},${origin.lng}`,
              destination: `${destination.lat},${destination.lng}`,
              waypoints: waypointsParam,
              mode: travelMode,
              key: GOOGLE_MAPS_API_KEY,
            },
          }
        );

        if (response.data.status === 'OK' && response.data.routes[0]) {
          const route = response.data.routes[0];
          const results: DirectionsResult[] = [];

          // Extract individual leg data
          route.legs.forEach((leg) => {
            results.push({
              distance: leg.distance.value,
              duration: leg.duration.value,
              polyline: route.overview_polyline.points, // Note: This is the full route polyline
            });
          });

          return results;
        }
      } catch (error) {
        console.warn('Batch directions failed, falling back to individual calls:', error);
      }
    }

    // Fallback: individual calls for each segment
    const results: DirectionsResult[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const result = await this.getDirections(waypoints[i], waypoints[i + 1], mode);
      if (result) {
        results.push(result);
      } else {
        // Fallback to simple calculation
        const distance = calculateDistance(
          waypoints[i].lat,
          waypoints[i].lng,
          waypoints[i + 1].lat,
          waypoints[i + 1].lng
        );
        results.push({
          distance: Math.round(distance * 1000),
          duration: estimateTravelTime(distance, mode),
          polyline: '',
        });
      }
    }

    return results;
  }

  /**
   * Search for places using Google Places API
   * @param query - Search query
   * @returns Array of place results
   */
  static async searchPlaces(query: string): Promise<PlaceResult[]> {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      return [];
    }

    try {
      const response = await axios.get<GooglePlacesResponse>(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        {
          params: {
            query: query,
            key: GOOGLE_MAPS_API_KEY,
          },
        }
      );

      if (response.data.status !== 'OK') {
        console.error('Google Places API error:', response.data.status);
        return [];
      }

      return response.data.results.map(place => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        geometry: place.geometry,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total
      }));
    } catch (error) {
      console.error('Error searching places with Google Places API:', error);
      return [];
    }
  }
}

// Map our transport modes to Google's travel modes
function mapTransportMode(mode: string): string {
  const modeMap: { [key: string]: string } = {
    driving: 'driving',
    walking: 'walking',
    transit: 'transit',
    flight: 'driving', // No flight mode in Google Directions, use driving as fallback
  };
  return modeMap[mode] || 'driving';
}

// Fallback: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Fallback: Estimate travel time based on distance and transport mode
function estimateTravelTime(distanceKm: number, mode: string): number {
  const speeds: { [key: string]: number } = {
    walking: 5, // km/h
    driving: 50, // km/h
    transit: 30, // km/h
    flight: 500, // km/h
  };

  const speed = speeds[mode] || speeds.driving;
  const hours = distanceKm / speed;
  return Math.round(hours * 3600); // Convert to seconds
}
