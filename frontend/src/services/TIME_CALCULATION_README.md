# Time Calculation Service

## Overview

The `TimeCalculationService` provides automatic time calculations for trip planning, including travel duration estimation, arrival time computation, and time conflict detection. It works in conjunction with the Route Calculation Service to provide realistic travel times.

## Features

- **Travel Duration Calculation**: Computes travel time based on routes or distance/mode
- **Arrival Time Computation**: Calculates when you'll arrive at each place
- **Cascade Updates**: Automatically updates all subsequent times when one changes
- **Conflict Detection**: Identifies scheduling conflicts and overlaps
- **Transport Mode Multipliers**: Applies realistic buffers for different transport modes

## Usage

### Basic Time Calculation

```typescript
import { timeCalculationService } from './timeCalculationService';

// Calculate travel duration from route
const duration = timeCalculationService.calculateTravelDuration(
  route,           // TransportRoute from routeCalculationService
  null,            // distance (optional if route provided)
  'driving'        // transport mode
);

// Compute arrival time
const arrivalTime = timeCalculationService.computeArrivalTime(
  '14:30',         // previous place end time (HH:MM)
  1800             // travel duration in seconds (30 minutes)
);
// Returns: '15:00'
```

### Calculate Time for a Single Place

```typescript
const result = timeCalculationService.calculatePlaceTime(
  currentPlace,    // Place object
  previousPlace,   // Previous place in sequence
  route            // TransportRoute between them
);

console.log(result);
// {
//   placeId: 'place-123',
//   calculatedArrivalTime: '15:00',
//   travelTimeFromPrevious: 1800,
//   hasConflict: false
// }
```

### Cascade Update Times

When a place's time changes, update all subsequent places:

```typescript
// Create a map of routes between places
const routes = new Map<string, TransportRoute>();
routes.set('place1-place2', route1);
routes.set('place2-place3', route2);

// Update times starting from index 1
const result = timeCalculationService.cascadeUpdateTimes(
  places,          // Array of Place objects
  1,               // Start index (which place changed)
  routes           // Map of routes
);

console.log(result);
// {
//   updatedPlaces: [
//     { placeId: 'place-2', calculatedArrivalTime: '15:00', ... },
//     { placeId: 'place-3', calculatedArrivalTime: '16:30', ... }
//   ],
//   conflicts: [
//     {
//       placeId: 'place-3',
//       placeName: 'Museum',
//       conflictType: 'insufficient_time',
//       message: 'Arrival time (16:30) is 15 minutes after scheduled start (16:15)'
//     }
//   ]
// }
```

## Transport Mode Multipliers

The service applies realistic time buffers based on transport mode:

| Mode     | Multiplier | Reason                                    |
|----------|------------|-------------------------------------------|
| Walking  | 1.2 (20%)  | Pedestrian delays, route variations       |
| Driving  | 1.15 (15%) | Traffic, parking time                     |
| Transit  | 1.3 (30%)  | Waiting, transfers, schedule variations   |
| Flight   | 1.5 (50%)  | Check-in, security, boarding, deplaning   |

## Conflict Detection

The service detects three types of time conflicts:

### 1. Insufficient Time
Arrival time is after the scheduled start time:
```typescript
// Previous place ends at 14:00
// Travel time: 45 minutes
// Current place starts at 14:30
// Arrival: 14:45 (15 minutes late!)
```

### 2. Overlap
Current place starts before previous place ends:
```typescript
// Previous place: 13:00 - 14:30
// Current place: 14:00 - 15:00
// Conflict: Overlaps by 30 minutes
```

### 3. Negative Duration
End time is before start time:
```typescript
// Place: 15:00 - 14:30
// Conflict: Invalid time range
```

## Helper Methods

### Format Duration
```typescript
timeCalculationService.formatDuration(3665);
// Returns: '1h 1m 5s'

timeCalculationService.formatDuration(1800);
// Returns: '30m'
```

### Time Validation
```typescript
timeCalculationService.isValidTimeFormat('14:30');  // true
timeCalculationService.isValidTimeFormat('25:00');  // false
timeCalculationService.isValidTimeFormat('14:60');  // false
```

### Time Arithmetic
```typescript
// Add minutes to a time
timeCalculationService.addMinutesToTime('14:30', 45);
// Returns: '15:15'

// Calculate difference between times
timeCalculationService.getTimeDifferenceMinutes('14:30', '16:45');
// Returns: 135 (minutes)
```

### Day Statistics
```typescript
// Calculate total travel time for a day
const totalTravelTime = timeCalculationService.calculateDayTotalTravelTime(places);
// Returns: total seconds of travel time
```

## Integration with Route Calculation Service

The Time Calculation Service works seamlessly with the Route Calculation Service:

```typescript
import { routeCalculationService } from './routeCalculationService';
import { timeCalculationService } from './timeCalculationService';

// 1. Calculate route
const route = await routeCalculationService.calculateRoute({
  fromPlaceId: place1.id,
  toPlaceId: place2.id,
  origin: { lat: place1.lat, lng: place1.lng },
  destination: { lat: place2.lat, lng: place2.lng },
  mode: 'driving'
});

// 2. Calculate time using the route
const timeResult = timeCalculationService.calculatePlaceTime(
  place2,
  place1,
  route
);

// 3. Update place with calculated times
place2.travel_time_seconds = timeResult.travelTimeFromPrevious;
place2.time_start = timeResult.calculatedArrivalTime;
```

## Fallback Behavior

When route data is unavailable, the service falls back to estimation:

1. **With Distance**: Uses average speeds per transport mode
2. **Without Distance**: Returns 0 (no calculation possible)

Average speeds used for estimation:
- Walking: 5 km/h
- Driving: 50 km/h
- Transit: 30 km/h
- Flight: 800 km/h

## Example: Complete Day Planning

```typescript
async function updateDaySchedule(places: Place[]) {
  // Sort places by display order
  const sortedPlaces = [...places].sort((a, b) => a.display_order - b.display_order);
  
  // Calculate routes between consecutive places
  const routes = new Map<string, TransportRoute>();
  
  for (let i = 0; i < sortedPlaces.length - 1; i++) {
    const from = sortedPlaces[i];
    const to = sortedPlaces[i + 1];
    
    if (from.lat && from.lng && to.lat && to.lng) {
      const route = await routeCalculationService.calculateRoute({
        fromPlaceId: from.id,
        toPlaceId: to.id,
        origin: { lat: from.lat, lng: from.lng },
        destination: { lat: to.lat, lng: to.lng },
        mode: to.transport_mode || 'driving'
      });
      
      routes.set(`${from.id}-${to.id}`, route);
    }
  }
  
  // Cascade update all times
  const result = timeCalculationService.cascadeUpdateTimes(
    sortedPlaces,
    0,
    routes
  );
  
  // Handle conflicts
  if (result.conflicts.length > 0) {
    console.warn('Time conflicts detected:', result.conflicts);
    // Show warnings to user
  }
  
  // Update places with calculated times
  result.updatedPlaces.forEach(update => {
    const place = sortedPlaces.find(p => p.id === update.placeId);
    if (place) {
      place.travel_time_seconds = update.travelTimeFromPrevious;
      // Optionally update time_start with calculatedArrivalTime
    }
  });
  
  return result;
}
```

## Performance Considerations

- **Caching**: Route calculations are cached by the Route Calculation Service
- **Batch Updates**: Use `cascadeUpdateTimes` instead of individual calculations
- **Debouncing**: Debounce user input before triggering cascade updates
- **Lazy Calculation**: Only calculate times when needed (e.g., when viewing a day)

## Error Handling

The service is designed to be resilient:

- Invalid time formats return `null`
- Missing data returns sensible defaults (0 for duration)
- Conflicts are detected but don't prevent calculations
- All errors are logged to console for debugging

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for multi-day trips (handle day boundaries)
- [ ] Historical traffic data integration
- [ ] User-defined buffer preferences
- [ ] Smart scheduling suggestions
- [ ] Break time recommendations
- [ ] Timezone support for international trips
