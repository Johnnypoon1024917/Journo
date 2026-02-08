import { Place } from '../types/trip';

interface RouteCache {
  [key: string]: {
    polyline: string;
    duration: number;
    distance: number;
    timestamp: number;
  };
}

interface RouteData {
  from_place_id: string;
  to_place_id: string;
  polyline: string;
  transport_mode: string;
  duration?: number;
  distance?: number;
}

interface PendingRequest {
  promise: Promise<RouteData | null>;
  resolve: (value: RouteData | null) => void;
  reject: (error: any) => void;
}

class RouteCalculationService {
  private cache: RouteCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private batchQueue: Array<{
    fromPlace: Place;
    toPlace: Place;
    transportMode: string;
    resolve: (value: RouteData | null) => void;
    reject: (error: any) => void;
  }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // ms - wait for more requests before batching

  /**
   * Generate cache key for route
   */
  private getCacheKey(fromPlaceId: string, toPlaceId: string, mode: string): string {
    return `${fromPlaceId}-${toPlaceId}-${mode}`;
  }

  /**
   * Check if cached route is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Get route from cache
   */
  private getCachedRoute(fromPlaceId: string, toPlaceId: string, mode: string) {
    const key = this.getCacheKey(fromPlaceId, toPlaceId, mode);
    const cached = this.cache[key];
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached;
    }
    
    // Remove expired cache entry
    if (cached) {
      delete this.cache[key];
    }
    
    return null;
  }

  /**
   * Cache route data
   */
  private cacheRoute(
    fromPlaceId: string, 
    toPlaceId: string, 
    mode: string, 
    data: { polyline: string; duration: number; distance: number }
  ) {
    const key = this.getCacheKey(fromPlaceId, toPlaceId, mode);
    this.cache[key] = {
      ...data,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear route cache for specific route
   */
  clearRouteCache(fromPlaceId: string, toPlaceId: string, transportMode?: string) {
    if (transportMode) {
      const key = this.getCacheKey(fromPlaceId, toPlaceId, transportMode);
      delete this.cache[key];
    } else {
      // Clear all transport modes for this route
      const modes = ['driving', 'walking', 'transit', 'bicycling'];
      modes.forEach(mode => {
        const key = this.getCacheKey(fromPlaceId, toPlaceId, mode);
        delete this.cache[key];
      });
    }
  }

  /**
   * Clear all cached routes
   */
  clearAllCache() {
    this.cache = {};
  }

  /**
   * Calculate route between two places with deduplication
   */
  async calculateRoute(
    fromPlace: Place,
    toPlace: Place,
    transportMode: string = 'driving'
  ): Promise<RouteData | null> {
    if (!fromPlace.lat || !fromPlace.lng || !toPlace.lat || !toPlace.lng) {
      return null;
    }

    const cacheKey = this.getCacheKey(fromPlace.id, toPlace.id, transportMode);

    // Check cache first
    const cached = this.getCachedRoute(fromPlace.id, toPlace.id, transportMode);
    if (cached) {
      return {
        from_place_id: fromPlace.id,
        to_place_id: toPlace.id,
        polyline: cached.polyline,
        transport_mode: transportMode,
        duration: cached.duration,
        distance: cached.distance,
      };
    }

    // Check if request is already pending
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest.promise;
    }

    // Create new request with deduplication
    const promise = new Promise<RouteData | null>((resolve, reject) => {
      // Add to batch queue for potential batching
      this.batchQueue.push({
        fromPlace,
        toPlace,
        transportMode,
        resolve,
        reject,
      });

      // Set up batch processing
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_DELAY);
    });

    // Store pending request
    this.pendingRequests.set(cacheKey, {
      promise,
      resolve: () => {},
      reject: () => {},
    });

    return promise;
  }

  /**
   * Process batched route requests
   */
  private async processBatch() {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    // Process each request (could be optimized further with Matrix API)
    for (const request of batch) {
      try {
        const result = await this.calculateSingleRoute(
          request.fromPlace,
          request.toPlace,
          request.transportMode
        );
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      } finally {
        // Clean up pending request
        const cacheKey = this.getCacheKey(
          request.fromPlace.id,
          request.toPlace.id,
          request.transportMode
        );
        this.pendingRequests.delete(cacheKey);
      }
    }
  }

  /**
   * Calculate single route (extracted from original calculateRoute)
   */
  private async calculateSingleRoute(
    fromPlace: Place,
    toPlace: Place,
    transportMode: string
  ): Promise<RouteData | null> {
    try {
      // Try to use backend API first - use proper API service
      const { apiRequest } = await import('./api');
      
      const data = await apiRequest<{
        success: boolean;
        route?: {
          polyline: string;
          duration: number;
          distance: number;
        };
      }>('/routes/calculate', {
        method: 'POST',
        token: localStorage.getItem('accessToken') || undefined,
        body: JSON.stringify({
          origin: { lat: fromPlace.lat, lng: fromPlace.lng },
          destination: { lat: toPlace.lat, lng: toPlace.lng },
          mode: transportMode,
        }),
      });

      if (data.success && data.route) {
        // Cache the result
        this.cacheRoute(fromPlace.id, toPlace.id, transportMode, {
          polyline: data.route.polyline,
          duration: data.route.duration,
          distance: data.route.distance,
        });

        return {
          from_place_id: fromPlace.id,
          to_place_id: toPlace.id,
          polyline: data.route.polyline,
          transport_mode: transportMode,
          duration: data.route.duration,
          distance: data.route.distance,
        };
      }
    } catch (error) {
      console.warn('Backend route calculation failed, using fallback:', error);
    }

    // Fallback: create straight line route
    return this.createStraightLineRoute(fromPlace, toPlace, transportMode);
  }

  /**
   * Create a straight line route as fallback
   */
  private createStraightLineRoute(
    fromPlace: Place,
    toPlace: Place,
    transportMode: string
  ): RouteData {
    // Simple straight line polyline (encoded)
    const polyline = this.encodePolyline([
      [fromPlace.lat!, fromPlace.lng!],
      [toPlace.lat!, toPlace.lng!],
    ]);

    // Calculate straight-line distance
    const distance = this.calculateDistance(
      fromPlace.lat!,
      fromPlace.lng!,
      toPlace.lat!,
      toPlace.lng!
    );

    // Estimate duration based on transport mode
    const duration = this.estimateDuration(distance, transportMode);

    return {
      from_place_id: fromPlace.id,
      to_place_id: toPlace.id,
      polyline,
      transport_mode: transportMode,
      duration,
      distance: Math.round(distance * 1000), // Convert to meters
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate duration based on distance and transport mode
   */
  private estimateDuration(distanceKm: number, mode: string): number {
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

  /**
   * Simple polyline encoding for straight lines
   */
  private encodePolyline(coordinates: number[][]): string {
    // This is a simplified version - in production, use a proper polyline encoding library
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const [lat, lng] of coordinates) {
      const lat5 = Math.round(lat * 1e5);
      const lng5 = Math.round(lng * 1e5);
      
      const dLat = lat5 - prevLat;
      const dLng = lng5 - prevLng;
      
      encoded += this.encodeSignedNumber(dLat) + this.encodeSignedNumber(dLng);
      
      prevLat = lat5;
      prevLng = lng5;
    }

    return encoded;
  }

  private encodeSignedNumber(num: number): string {
    let sgn_num = num << 1;
    if (num < 0) {
      sgn_num = ~sgn_num;
    }
    return this.encodeNumber(sgn_num);
  }

  private encodeNumber(num: number): string {
    let encoded = '';
    while (num >= 0x20) {
      encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
      num >>= 5;
    }
    encoded += String.fromCharCode(num + 63);
    return encoded;
  }
}

export const routeCalculationService = new RouteCalculationService();