# Route Calculation Service

## Overview

The `RouteCalculationService` provides intelligent route calculation between places with built-in caching, debouncing, and fallback mechanisms. It integrates with Google Maps Directions API and provides automatic transport mode detection.

## Features

### ✅ Implemented Features

1. **Google Maps Directions API Integration**
   - Full integration with Google Maps for accurate route calculations
   - Support for multiple transport modes (driving, walking, transit, flight)
   - Detailed route steps with instructions

2. **Route Caching with 5-minute TTL**
   - Automatic caching of calculated routes
   - 5-minute expiration time for cached routes
   - Cache pruning to remove expired entries
   - Cache statistics and management

3. **Fallback Straight-Line Calculation**
   - Automatic fallback when API fails
   - Haversine formula for distance calculation
   - Estimated duration based on transport mode
   - Clear indication when using estimates

4. **Debouncing for Route Requests**
   - 300ms debounce delay to prevent excessive API calls
   - Request deduplication for identical routes
   - Pending request tracking

5. **Transport Mode Selection Logic**
   - Auto-detection based on distance:
     - Walking: < 2km
     - Driving: 2-500km
     - Flight: > 500km
   - Manual mode override support
   - Intelligent mode mapping to Google Maps API

6. **Concurrent Request Limiting**
   - Maximum 3 concurrent API requests
   - Request queuing when limit reached
   - Automatic queue processing

## Usage

### Basic Route Calculation

```typescript
import { routeCalculationService } from './services/routeCalculationService';

const route = await routeCalculationService.calculateRoute({
  fromPlaceId: 'place-1',
  toPlaceId: 'place-2',
  origin: { lat: 22.3193, lng: 114.1694 },
  destination: { lat: 22.2783, lng: 114.1747 },
  mode: 'driving', // Optional - will auto-detect if omitted
});

console.log(`Distance: ${route.distance}m`);
console.log(`Duration: ${route.duration}s`);
console.log(`Polyline: ${route.polyline}`);
console.log(`Steps: ${route.steps.length}`);
```

### Auto-Detect Transport Mode

```typescript
// Mode will be automatically detected based on distance
const route = await routeCalculationService.calculateRoute({
  fromPlaceId: 'place-1',
  toPlaceId: 'place-2',
  origin: { lat: 22.3193, lng: 114.1694 },
  destination: { lat: 22.3200, lng: 114.1700 }, // Close distance
  // mode omitted - will auto-detect as 'walking'
});
```

### Handle Flight Routes

```typescript
const flightRoute = await routeCalculationService.calculateRoute({
  fromPlaceId: 'tokyo',
  toPlaceId: 'hongkong',
  origin: { lat: 35.6762, lng: 139.6503 },
  destination: { lat: 22.3193, lng: 114.1694 },
  mode: 'flight',
});

// Flight routes return straight-line distance with isEstimate: true
```

### Cache Management

```typescript
// Get cache statistics
const stats = routeCalculationService.getCacheStats();
console.log(`Cached routes: ${stats.size}`);

// Prune expired entries
routeCalculationService.pruneCache();

// Clear all cache
routeCalculationService.clearCache();
```

### Cleanup on Component Unmount

```typescript
useEffect(() => {
  return () => {
    // Cancel pending requests when component unmounts
    routeCalculationService.cancelPendingRequests();
  };
}, []);
```

## API Reference

### `calculateRoute(request: RouteCalculationRequest): Promise<TransportRoute>`

Calculate a route between two places.

**Parameters:**
- `request.fromPlaceId` - Source place ID
- `request.toPlaceId` - Destination place ID
- `request.origin` - Source coordinates `{ lat, lng }`
- `request.destination` - Destination coordinates `{ lat, lng }`
- `request.mode` - (Optional) Transport mode: `'driving' | 'walking' | 'transit' | 'flight'`

**Returns:** `TransportRoute` object with:
- `id` - Unique route identifier
- `fromPlaceId` - Source place ID
- `toPlaceId` - Destination place ID
- `mode` - Transport mode used
- `duration` - Travel duration in seconds
- `distance` - Travel distance in meters
- `polyline` - Encoded polyline string
- `steps` - Array of route steps with instructions
- `calculatedAt` - Calculation timestamp
- `expiresAt` - Cache expiration timestamp
- `isEstimate` - Whether this is a fallback estimate
- `error` - (Optional) Error message if fallback was used

### `getCacheStats(): { size: number; keys: string[] }`

Get current cache statistics.

### `pruneCache(): void`

Remove expired cache entries.

### `clearCache(): void`

Clear all cached routes.

### `cancelPendingRequests(): void`

Cancel all pending route calculation requests.

## Performance Characteristics

### Caching
- **Cache TTL:** 5 minutes
- **Cache Key:** `{fromPlaceId}-{toPlaceId}-{mode}`
- **Storage:** In-memory Map

### Debouncing
- **Delay:** 300ms
- **Deduplication:** Automatic for identical requests

### Concurrency
- **Max Concurrent:** 3 requests
- **Queue:** Automatic queuing when limit reached

### Fallback
- **Trigger:** API failure or unavailability
- **Method:** Haversine formula for straight-line distance
- **Speed Estimates:**
  - Walking: 5 km/h
  - Driving: 50 km/h
  - Transit: 30 km/h
  - Flight: 800 km/h

## Requirements Coverage

This service implements the following requirements from the Funliday UI Redesign spec:

### Requirement 4: Automatic Transport Routing
- ✅ 4.1: Calculate routes between consecutive places
- ✅ 4.2: Recalculate routes when order changes
- ✅ 4.3: Display transport mode icons
- ✅ 4.4: Show calculated distance
- ✅ 4.5: Support manual transport mode selection
- ✅ 4.6: Provide route polylines for map display
- ✅ 4.7: Fallback to straight line on failure

### Requirement 10: Performance Optimization
- ✅ 10.2: Debounce route calculation requests
- ✅ 10.3: Cache route calculations for 5 minutes
- ✅ 10.7: Limit concurrent route calculations to 3 requests

## Error Handling

The service handles errors gracefully:

1. **API Failures:** Automatically falls back to straight-line calculation
2. **Invalid Coordinates:** Returns estimate with error message
3. **Network Issues:** Queues requests and retries
4. **Rate Limiting:** Respects concurrent request limits

All errors are logged to console and routes are marked with `isEstimate: true` and include an `error` field.

## Integration Example

```typescript
// In a React component
import { routeCalculationService } from '@/services/routeCalculationService';
import { useState, useEffect } from 'react';

function TripPlanner({ places }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function calculateRoutes() {
      setLoading(true);
      const newRoutes = [];

      for (let i = 0; i < places.length - 1; i++) {
        const route = await routeCalculationService.calculateRoute({
          fromPlaceId: places[i].id,
          toPlaceId: places[i + 1].id,
          origin: { lat: places[i].lat, lng: places[i].lng },
          destination: { lat: places[i + 1].lat, lng: places[i + 1].lng },
          mode: places[i + 1].transport_mode,
        });
        newRoutes.push(route);
      }

      setRoutes(newRoutes);
      setLoading(false);
    }

    if (places.length > 1) {
      calculateRoutes();
    }

    return () => {
      routeCalculationService.cancelPendingRequests();
    };
  }, [places]);

  return (
    <div>
      {loading && <div>Calculating routes...</div>}
      {routes.map((route) => (
        <div key={route.id}>
          {route.isEstimate && <span>⚠️ Estimate</span>}
          Distance: {(route.distance / 1000).toFixed(2)} km
          Duration: {Math.round(route.duration / 60)} min
        </div>
      ))}
    </div>
  );
}
```

## Testing

See `routeCalculationService.example.ts` for comprehensive usage examples.

## Future Enhancements

Potential improvements for future iterations:

- [ ] Persistent cache using IndexedDB
- [ ] Waypoint support for multi-stop routes
- [ ] Alternative route suggestions
- [ ] Real-time traffic integration
- [ ] Route optimization for multiple places
- [ ] Offline route storage
