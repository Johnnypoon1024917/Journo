/**
 * Example usage of RouteCalculationService
 * 
 * This file demonstrates how to use the route calculation service
 * for calculating routes between places with caching and debouncing.
 */

import { routeCalculationService } from './routeCalculationService';
import type { RouteCalculationRequest } from './routeCalculationService';

// Example 1: Calculate a driving route between two places
async function calculateDrivingRoute() {
  const request: RouteCalculationRequest = {
    fromPlaceId: 'place-1',
    toPlaceId: 'place-2',
    origin: { lat: 22.3193, lng: 114.1694 }, // Hong Kong
    destination: { lat: 22.2783, lng: 114.1747 }, // Kowloon
    mode: 'driving',
  };

  try {
    const route = await routeCalculationService.calculateRoute(request);
    console.log('Route calculated:', {
      distance: `${(route.distance / 1000).toFixed(2)} km`,
      duration: `${Math.round(route.duration / 60)} minutes`,
      mode: route.mode,
      isEstimate: route.isEstimate,
      steps: route.steps.length,
    });
    return route;
  } catch (error) {
    console.error('Failed to calculate route:', error);
    throw error;
  }
}

// Example 2: Auto-detect transport mode based on distance
async function calculateRouteWithAutoMode() {
  const request: RouteCalculationRequest = {
    fromPlaceId: 'place-3',
    toPlaceId: 'place-4',
    origin: { lat: 22.3193, lng: 114.1694 },
    destination: { lat: 22.3200, lng: 114.1700 }, // Very close - will auto-detect walking
    // mode is omitted - will be auto-detected
  };

  const route = await routeCalculationService.calculateRoute(request);
  console.log('Auto-detected mode:', route.mode); // Should be 'walking' for short distances
  return route;
}

// Example 3: Calculate multiple routes with caching
async function calculateMultipleRoutes() {
  const places = [
    { id: 'place-1', lat: 22.3193, lng: 114.1694 },
    { id: 'place-2', lat: 22.2783, lng: 114.1747 },
    { id: 'place-3', lat: 22.2800, lng: 114.1800 },
  ];

  const routes = [];

  // Calculate routes between consecutive places
  for (let i = 0; i < places.length - 1; i++) {
    const request: RouteCalculationRequest = {
      fromPlaceId: places[i].id,
      toPlaceId: places[i + 1].id,
      origin: { lat: places[i].lat, lng: places[i].lng },
      destination: { lat: places[i + 1].lat, lng: places[i + 1].lng },
      mode: 'driving',
    };

    const route = await routeCalculationService.calculateRoute(request);
    routes.push(route);
  }

  // Second call will use cache (within 5 minutes)
  await routeCalculationService.calculateRoute({
    fromPlaceId: places[0].id,
    toPlaceId: places[1].id,
    origin: { lat: places[0].lat, lng: places[0].lng },
    destination: { lat: places[1].lat, lng: places[1].lng },
    mode: 'driving',
  });

  console.log('Cache stats:', routeCalculationService.getCacheStats());
  return routes;
}

// Example 4: Handle flight routes
async function calculateFlightRoute() {
  const request: RouteCalculationRequest = {
    fromPlaceId: 'place-tokyo',
    toPlaceId: 'place-hongkong',
    origin: { lat: 35.6762, lng: 139.6503 }, // Tokyo
    destination: { lat: 22.3193, lng: 114.1694 }, // Hong Kong
    mode: 'flight',
  };

  const route = await routeCalculationService.calculateRoute(request);
  console.log('Flight route:', {
    distance: `${(route.distance / 1000).toFixed(0)} km`,
    isEstimate: route.isEstimate,
    error: route.error,
  });
  return route;
}

// Example 5: Handle route calculation failures with fallback
async function calculateRouteWithFallback() {
  const request: RouteCalculationRequest = {
    fromPlaceId: 'place-remote-1',
    toPlaceId: 'place-remote-2',
    origin: { lat: 0, lng: 0 }, // Invalid location - will trigger fallback
    destination: { lat: 1, lng: 1 },
    mode: 'driving',
  };

  const route = await routeCalculationService.calculateRoute(request);
  
  if (route.isEstimate) {
    console.log('Using fallback straight-line calculation');
    console.log('Error:', route.error);
  }
  
  return route;
}

// Example 6: Clear cache and manage cache lifecycle
function manageCacheLifecycle() {
  // Get cache statistics
  const stats = routeCalculationService.getCacheStats();
  console.log('Current cache size:', stats.size);
  console.log('Cached routes:', stats.keys);

  // Prune expired entries
  routeCalculationService.pruneCache();

  // Clear all cache if needed
  routeCalculationService.clearCache();
  console.log('Cache cleared');
}

// Example 7: Cancel pending requests (useful when component unmounts)
function cleanupOnUnmount() {
  routeCalculationService.cancelPendingRequests();
  console.log('All pending requests cancelled');
}

// Export examples for testing
export {
  calculateDrivingRoute,
  calculateRouteWithAutoMode,
  calculateMultipleRoutes,
  calculateFlightRoute,
  calculateRouteWithFallback,
  manageCacheLifecycle,
  cleanupOnUnmount,
};
