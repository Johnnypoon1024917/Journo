import { GoogleMapsService } from './googleMapsService.js';
import { TransportMode } from '../types/index.js';

// Enhanced interfaces for route optimization
export interface SuggestedPlace {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  placeType: PlaceType;
  description: string;
  estimatedDuration: number; // minutes
  estimatedCost: number;
  rating?: number;
  tips?: string;
  openingHours?: OpeningHours;
  travelTimeFromPrevious?: number;
  source: 'scraping' | 'google_places' | 'user_input';
}

export interface OpeningHours {
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
  saturday?: { open: string; close: string } | null;
  sunday?: { open: string; close: string } | null;
}

export type PlaceType = 'attraction' | 'food' | 'hotel' | 'transport' | 'shopping' | 'nature' | 'culture' | 'entertainment' | 'other';

export interface RouteOptimizationRequest {
  places: SuggestedPlace[];
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced';
  availableTime: number; // minutes per day
  date?: string; // for opening hours validation
}

export interface OptimizedRoute {
  orderedPlaces: SuggestedPlace[];
  totalTravelTime: number; // minutes
  totalDistance: number; // meters
  routeSegments: RouteSegment[];
  optimizationScore: number; // 0-1, higher is better
  feasibilityWarnings: string[];
}

export interface RouteSegment {
  fromPlace: SuggestedPlace;
  toPlace: SuggestedPlace;
  travelMode: TransportMode;
  duration: number; // minutes
  distance: number; // meters
  polyline: string;
}

export interface PlaceCluster {
  id: string;
  places: SuggestedPlace[];
  centerPoint: { lat: number; lng: number };
  radius: number; // meters
}

export interface ScheduledPlace extends SuggestedPlace {
  scheduledStartTime: string; // HH:MM format
  scheduledEndTime: string; // HH:MM format
  bufferTime: number; // minutes
}

export interface ScheduledRoute {
  scheduledPlaces: ScheduledPlace[];
  totalScheduledTime: number; // minutes
  freeTime: number; // minutes
  mealBreaks: { time: string; duration: number; type: 'breakfast' | 'lunch' | 'dinner' }[];
  feasible: boolean;
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  totalTime: number;
  timeBreakdown: {
    visits: number;
    travel: number;
    buffers: number;
    meals: number;
  };
}

export class RouteOptimizationService {
  private static readonly MAX_WALKING_DISTANCE = 2000; // 2km in meters
  private static readonly CLUSTER_RADIUS = 1500; // 1.5km for clustering
  private static readonly TIME_BUFFER_MINUTES = 15; // Buffer between activities
  private static readonly MEAL_DURATIONS = {
    breakfast: 45,
    lunch: 60,
    dinner: 90
  };

  /**
   * Optimize a daily route for a set of places
   */
  static async optimizeDailyRoute(request: RouteOptimizationRequest): Promise<OptimizedRoute> {
    const { places, travelStyle, availableTime } = request;

    if (places.length === 0) {
      return this.createEmptyRoute();
    }

    if (places.length === 1) {
      return this.createSinglePlaceRoute(places[0]);
    }

    try {
      // Step 1: Cluster places by geographical proximity
      const clusters = await this.clusterPlaces(places);

      // Step 2: Optimize route within and between clusters
      const optimizedOrder = await this.optimizeClusterRoutes(clusters, travelStyle);

      // Step 3: Calculate route segments with travel modes
      const routeSegments = await this.calculateRouteSegments(optimizedOrder);

      // Step 4: Validate route feasibility
      const validation = this.validateRouteFeasibility(optimizedOrder, routeSegments, availableTime);

      // Step 5: Calculate optimization score
      const optimizationScore = this.calculateOptimizationScore(
        optimizedOrder,
        routeSegments,
        validation
      );

      return {
        orderedPlaces: optimizedOrder,
        totalTravelTime: Math.round(routeSegments.reduce((sum, seg) => sum + seg.duration, 0)),
        totalDistance: routeSegments.reduce((sum, seg) => sum + seg.distance, 0),
        routeSegments,
        optimizationScore,
        feasibilityWarnings: validation.warnings
      };

    } catch (error) {
      console.error('Route optimization failed:', error);
      // Fallback to simple geographical ordering
      return this.fallbackToSimpleOrdering(places);
    }
  }

  /**
   * Optimize multi-day itinerary with cross-day considerations
   */
  static async optimizeMultiDayItinerary(
    dailyPlaces: SuggestedPlace[][],
    travelInfo: { travelStyle: 'relaxed' | 'moderate' | 'fast-paced'; availableTimePerDay: number }
  ): Promise<OptimizedRoute[]> {
    const results: OptimizedRoute[] = [];

    for (let dayIndex = 0; dayIndex < dailyPlaces.length; dayIndex++) {
      const dayPlaces = dailyPlaces[dayIndex];
      
      // Consider end location of previous day as start location for current day
      const startLocation = dayIndex > 0 && results[dayIndex - 1].orderedPlaces.length > 0
        ? results[dayIndex - 1].orderedPlaces[results[dayIndex - 1].orderedPlaces.length - 1].coordinates
        : undefined;

      const request: RouteOptimizationRequest = {
        places: dayPlaces,
        startLocation,
        travelStyle: travelInfo.travelStyle,
        availableTime: travelInfo.availableTimePerDay
      };

      const optimizedRoute = await this.optimizeDailyRoute(request);
      results.push(optimizedRoute);
    }

    return results;
  }

  /**
   * Generate complete schedule with time allocation and validation
   */
  static async generateCompleteSchedule(
    request: RouteOptimizationRequest & {
      startTime: string;
      endTime: string;
      date?: string;
      includeMeals?: boolean;
    }
  ): Promise<{ optimizedRoute: OptimizedRoute; scheduledRoute: any }> {
    // Import here to avoid circular dependency
    const { ScheduleGenerationService } = await import('./scheduleGenerationService.js');
    
    // First optimize the route
    const optimizedRoute = await this.optimizeDailyRoute(request);

    // Then generate the schedule
    const scheduleRequest = {
      optimizedRoute,
      startTime: request.startTime,
      endTime: request.endTime,
      travelStyle: request.travelStyle,
      date: request.date,
      includeMeals: request.includeMeals
    };

    const scheduledRoute = await ScheduleGenerationService.generateSchedule(scheduleRequest);

    return {
      optimizedRoute,
      scheduledRoute
    };
  }

  /**
   * Cluster places by geographical proximity using k-means-like algorithm
   */
  private static async clusterPlaces(places: SuggestedPlace[]): Promise<PlaceCluster[]> {
    if (places.length <= 3) {
      // For small sets, treat as single cluster
      return [{
        id: 'cluster-1',
        places,
        centerPoint: this.calculateCenterPoint(places),
        radius: this.calculateClusterRadius(places)
      }];
    }

    // Simple clustering based on distance
    const clusters: PlaceCluster[] = [];
    const unassigned = [...places];

    while (unassigned.length > 0) {
      const seed = unassigned.shift()!;
      const cluster: SuggestedPlace[] = [seed];

      // Find nearby places within cluster radius
      for (let i = unassigned.length - 1; i >= 0; i--) {
        const place = unassigned[i];
        const distance = this.calculateDistance(
          seed.coordinates.lat,
          seed.coordinates.lng,
          place.coordinates.lat,
          place.coordinates.lng
        );

        if (distance <= this.CLUSTER_RADIUS) {
          cluster.push(place);
          unassigned.splice(i, 1);
        }
      }

      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        places: cluster,
        centerPoint: this.calculateCenterPoint(cluster),
        radius: this.calculateClusterRadius(cluster)
      });
    }

    return clusters;
  }

  /**
   * Optimize routes within and between clusters using TSP-like approach
   */
  private static async optimizeClusterRoutes(
    clusters: PlaceCluster[],
    travelStyle: string
  ): Promise<SuggestedPlace[]> {
    if (clusters.length === 1) {
      return this.solveTSPForCluster(clusters[0]);
    }

    // For multiple clusters, optimize order of clusters first
    const orderedClusters = await this.optimizeClusterOrder(clusters);
    
    // Then optimize within each cluster
    const result: SuggestedPlace[] = [];
    for (const cluster of orderedClusters) {
      const optimizedCluster = await this.solveTSPForCluster(cluster);
      result.push(...optimizedCluster);
    }

    return result;
  }

  /**
   * Solve Traveling Salesman Problem for a cluster using nearest neighbor heuristic
   */
  private static async solveTSPForCluster(cluster: PlaceCluster): Promise<SuggestedPlace[]> {
    const places = [...cluster.places];
    
    if (places.length <= 2) {
      return places;
    }

    // Use nearest neighbor heuristic for TSP
    const result: SuggestedPlace[] = [];
    const unvisited = new Set(places);
    
    // Start with the first place
    let current = places[0];
    result.push(current);
    unvisited.delete(current);

    while (unvisited.size > 0) {
      let nearest: SuggestedPlace | null = null;
      let minDistance = Infinity;

      for (const place of Array.from(unvisited)) {
        const distance = this.calculateDistance(
          current.coordinates.lat,
          current.coordinates.lng,
          place.coordinates.lat,
          place.coordinates.lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = place;
        }
      }

      if (nearest) {
        result.push(nearest);
        unvisited.delete(nearest);
        current = nearest;
      }
    }

    return result;
  }

  /**
   * Optimize the order of clusters
   */
  private static async optimizeClusterOrder(clusters: PlaceCluster[]): Promise<PlaceCluster[]> {
    if (clusters.length <= 2) {
      return clusters;
    }

    // Use nearest neighbor for cluster centers
    const result: PlaceCluster[] = [];
    const unvisited = new Set(clusters);
    
    let current = clusters[0];
    result.push(current);
    unvisited.delete(current);

    while (unvisited.size > 0) {
      let nearest: PlaceCluster | null = null;
      let minDistance = Infinity;

      for (const cluster of Array.from(unvisited)) {
        const distance = this.calculateDistance(
          current.centerPoint.lat,
          current.centerPoint.lng,
          cluster.centerPoint.lat,
          cluster.centerPoint.lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = cluster;
        }
      }

      if (nearest) {
        result.push(nearest);
        unvisited.delete(nearest);
        current = nearest;
      }
    }

    return result;
  }

  /**
   * Calculate route segments with appropriate travel modes
   */
  private static async calculateRouteSegments(places: SuggestedPlace[]): Promise<RouteSegment[]> {
    const segments: RouteSegment[] = [];

    for (let i = 0; i < places.length - 1; i++) {
      const fromPlace = places[i];
      const toPlace = places[i + 1];

      // Calculate distance to determine travel mode
      const distance = this.calculateDistance(
        fromPlace.coordinates.lat,
        fromPlace.coordinates.lng,
        toPlace.coordinates.lat,
        toPlace.coordinates.lng
      ) * 1000; // Convert to meters

      const travelMode: TransportMode = distance <= this.MAX_WALKING_DISTANCE ? 'walking' : 'driving';

      // Get directions from Google Maps
      const directions = await GoogleMapsService.getDirections(
        fromPlace.coordinates,
        toPlace.coordinates,
        travelMode
      );

      if (directions) {
        segments.push({
          fromPlace,
          toPlace,
          travelMode,
          duration: Math.round(directions.duration / 60), // Convert to minutes
          distance: directions.distance,
          polyline: directions.polyline
        });
      } else {
        // Fallback calculation
        const estimatedDuration = this.estimateTravelTime(distance / 1000, travelMode);
        segments.push({
          fromPlace,
          toPlace,
          travelMode,
          duration: Math.round(estimatedDuration / 60), // Convert to minutes
          distance: Math.round(distance),
          polyline: ''
        });
      }
    }

    return segments;
  }

  /**
   * Validate route feasibility considering time constraints
   */
  private static validateRouteFeasibility(
    places: SuggestedPlace[],
    segments: RouteSegment[],
    availableTime: number
  ): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Calculate total time needed
    const visitTime = places.reduce((sum, place) => sum + place.estimatedDuration, 0);
    const travelTime = segments.reduce((sum, seg) => sum + seg.duration, 0);
    const bufferTime = (places.length - 1) * this.TIME_BUFFER_MINUTES;
    const mealTime = 120; // Assume 2 hours for meals

    const totalTime = visitTime + travelTime + bufferTime + mealTime;

    // Check feasibility
    if (totalTime > availableTime) {
      const overtime = totalTime - availableTime;
      warnings.push(`Schedule exceeds available time by ${overtime} minutes`);
    }

    // Check for very long travel segments
    segments.forEach((segment, index) => {
      if (segment.duration > 60) {
        warnings.push(`Long travel time (${segment.duration} min) between ${segment.fromPlace.name} and ${segment.toPlace.name}`);
      }
    });

    // Check for place density
    if (places.length > 6) {
      warnings.push('High number of places may lead to rushed experience');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      totalTime,
      timeBreakdown: {
        visits: visitTime,
        travel: travelTime,
        buffers: bufferTime,
        meals: mealTime
      }
    };
  }

  /**
   * Calculate optimization score based on various factors
   */
  private static calculateOptimizationScore(
    places: SuggestedPlace[],
    segments: RouteSegment[],
    validation: ValidationResult
  ): number {
    let score = 1.0;

    // Penalize for excessive travel time
    const totalTravelTime = segments.reduce((sum, seg) => sum + seg.duration, 0);
    const totalVisitTime = places.reduce((sum, place) => sum + place.estimatedDuration, 0);
    const travelRatio = totalTravelTime / (totalTravelTime + totalVisitTime);
    
    if (travelRatio > 0.3) {
      score -= (travelRatio - 0.3) * 2; // Penalize high travel ratio
    }

    // Penalize for warnings
    score -= validation.warnings.length * 0.1;

    // Penalize for errors
    score -= validation.errors.length * 0.3;

    // Bonus for good clustering (short segments)
    const avgSegmentTime = totalTravelTime / Math.max(segments.length, 1);
    if (avgSegmentTime < 15) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Helper method to calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate travel time based on distance and mode
   */
  private static estimateTravelTime(distanceKm: number, mode: TransportMode): number {
    const speeds: { [key: string]: number } = {
      walking: 5, // km/h
      driving: 40, // km/h (city driving)
      transit: 25, // km/h
      flight: 500, // km/h
    };

    const speed = speeds[mode] || speeds.driving;
    const hours = distanceKm / speed;
    return Math.round(hours * 3600); // Convert to seconds
  }

  /**
   * Calculate center point of a group of places
   */
  private static calculateCenterPoint(places: SuggestedPlace[]): { lat: number; lng: number } {
    const avgLat = places.reduce((sum, place) => sum + place.coordinates.lat, 0) / places.length;
    const avgLng = places.reduce((sum, place) => sum + place.coordinates.lng, 0) / places.length;
    return { lat: avgLat, lng: avgLng };
  }

  /**
   * Calculate cluster radius
   */
  private static calculateClusterRadius(places: SuggestedPlace[]): number {
    if (places.length <= 1) return 0;

    const center = this.calculateCenterPoint(places);
    let maxDistance = 0;

    for (const place of places) {
      const distance = this.calculateDistance(
        center.lat,
        center.lng,
        place.coordinates.lat,
        place.coordinates.lng
      ) * 1000; // Convert to meters

      maxDistance = Math.max(maxDistance, distance);
    }

    return maxDistance;
  }

  /**
   * Fallback method for simple geographical ordering
   */
  private static async fallbackToSimpleOrdering(places: SuggestedPlace[]): Promise<OptimizedRoute> {
    // Simple ordering by latitude (north to south)
    const orderedPlaces = [...places].sort((a, b) => b.coordinates.lat - a.coordinates.lat);
    
    const routeSegments = await this.calculateRouteSegments(orderedPlaces);
    
    return {
      orderedPlaces,
      totalTravelTime: Math.round(routeSegments.reduce((sum, seg) => sum + seg.duration, 0)),
      totalDistance: routeSegments.reduce((sum, seg) => sum + seg.distance, 0),
      routeSegments,
      optimizationScore: 0.5, // Indicate non-optimized route
      feasibilityWarnings: ['Route optimization failed, using simple ordering']
    };
  }

  /**
   * Create empty route for edge case
   */
  private static createEmptyRoute(): OptimizedRoute {
    return {
      orderedPlaces: [],
      totalTravelTime: 0,
      totalDistance: 0,
      routeSegments: [],
      optimizationScore: 1.0,
      feasibilityWarnings: []
    };
  }

  /**
   * Create single place route for edge case
   */
  private static createSinglePlaceRoute(place: SuggestedPlace): OptimizedRoute {
    return {
      orderedPlaces: [place],
      totalTravelTime: 0,
      totalDistance: 0,
      routeSegments: [],
      optimizationScore: 1.0,
      feasibilityWarnings: []
    };
  }
}