# Inline Transport Mode Selector

## Overview

The inline transport mode selector allows users to quickly change the transportation method between consecutive places in their itinerary without opening a modal dialog. This feature is part of the Funliday UI redesign (Task 43).

## Features

### 1. Transport Mode Popover with Icons
- **Location**: Displayed in `TransportSegment` component between place cards
- **Modes Available**:
  - 🚗 Driving
  - 🚶 Walking
  - 🚇 Transit
  - ✈️ Flight
- **UI**: Dropdown menu with icons and labels
- **Accessibility**: Keyboard navigable, ARIA labels included

### 2. Tap-to-Open Behavior
- Click the transport mode icon to open the dropdown
- Click outside or select a mode to close
- Visual feedback with hover states and animations

### 3. Route Recalculation on Mode Change
When a user changes the transport mode:
1. The route cache for that segment is cleared
2. The new mode is persisted to the database
3. The route is recalculated using the new mode
4. Travel time and distance are updated
5. Subsequent place arrival times are recalculated

**Implementation Details**:
- `useRouteIntegration` hook detects mode changes and triggers recalculation
- `routeCalculationService.clearRouteCache()` clears the old cached route
- `handleTransportModeChange()` orchestrates the update flow

### 4. Map Polyline Style Updates
Routes on the map are color-coded by transport mode:
- **Driving**: Blue (#3b82f6)
- **Walking**: Green (#10b981)
- **Transit**: Orange (#f59e0b)
- **Flight**: Purple (#8b5cf6)

The polyline color updates automatically when the mode changes.

### 5. Mode Persistence
- Transport modes are saved to the database via `placeService.updatePlace()`
- Modes persist across sessions and page reloads
- Changes are synced in real-time for collaborative editing

## User Flow

1. User views their itinerary with places and transport segments
2. User clicks on a transport mode icon (e.g., 🚗)
3. Dropdown menu appears with all available modes
4. User selects a new mode (e.g., 🚶 Walking)
5. System shows loading state while recalculating
6. Route, travel time, and map polyline update automatically
7. Success notification confirms the change

## Technical Architecture

### Components
- **TransportSegment**: Main component displaying transport info and mode selector
- **TransportModeSelector**: Legacy component (still used in some views)

### Services
- **routeCalculationService**: Calculates routes with caching and mode-specific logic
- **timeCalculationService**: Calculates travel times and arrival times
- **placeService**: Persists transport mode changes to database

### Hooks
- **useRouteIntegration**: Manages route calculation state and triggers recalculation
- **useTimeIntegration**: Manages time calculations and cascade updates

### State Flow
```
User clicks mode
  ↓
onModeChange callback
  ↓
handleTransportModeChange
  ↓
Clear route cache
  ↓
Update database
  ↓
Refresh trip data
  ↓
useRouteIntegration detects change
  ↓
Recalculate route with new mode
  ↓
Update UI (segment, map, times)
```

## Requirements Satisfied

✅ **Requirement 13.4**: Tap-to-open transport mode popover with icons
✅ **Requirement 4.5**: Manual transport mode selection
✅ **Requirement 5.5**: Account for transport mode in time calculations
✅ **Requirement 5.6**: Update times when transport mode changes

## Testing

### Manual Testing Steps
1. Create a trip with multiple places
2. Click on a transport segment between two places
3. Select a different transport mode
4. Verify:
   - Loading indicator appears
   - Route recalculates
   - Travel time updates
   - Map polyline color changes
   - Subsequent arrival times update
   - Success notification appears

### Edge Cases
- Changing mode while route is calculating (should queue the change)
- Changing mode when offline (should queue for sync)
- Changing mode for first place (should have no effect)
- Rapid mode changes (should debounce and use latest)

## Performance Considerations

- Route calculations are debounced (300ms)
- Routes are cached for 5 minutes
- Cache is cleared only for affected segments
- Maximum 3 concurrent route calculations
- Failed calculations fall back to straight-line estimates

## Future Enhancements

- [ ] Add custom transport modes (e.g., bike, scooter)
- [ ] Show estimated cost per transport mode
- [ ] Add "auto-detect best mode" option
- [ ] Support multi-modal transport (e.g., walk + transit)
- [ ] Add transport mode preferences per trip
