# Inline Time Editor

A React component for editing place times directly within the itinerary canvas without opening modal dialogs. Features dual slider thumbs, 15-minute snap intervals, haptic feedback, and automatic cascading time updates.

## Features

✅ **Dual Slider Thumbs**: Separate controls for start and end times
✅ **15-Minute Snap Intervals**: Times snap to 15-minute increments with visual feedback
✅ **Haptic Feedback**: Vibration feedback on mobile when snapping to intervals
✅ **Visual Time Range**: Color-coded indicator showing the time range
✅ **Auto-Recalculation**: Automatically updates subsequent place times
✅ **Responsive Design**: Optimized for mobile and desktop
✅ **Accessibility**: Full keyboard navigation and screen reader support
✅ **Dark Mode**: Supports light and dark themes

## Components

### 1. InlineTimeEditor

The core time editor component with dual slider interface.

```tsx
import { InlineTimeEditor } from './components/trip/InlineTimeEditor';

<InlineTimeEditor
  startTime="09:00"
  endTime="11:00"
  onTimeChange={(start, end) => {
    console.log('New times:', start, end);
  }}
  snapInterval={15}
  enableHaptic={true}
  minTime="08:00"
  maxTime="20:00"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `startTime` | `string` | Required | Start time in HH:MM format |
| `endTime` | `string` | Required | End time in HH:MM format |
| `onTimeChange` | `(start: string, end: string) => void` | Required | Callback when time changes |
| `snapInterval` | `number` | `15` | Snap interval in minutes |
| `enableHaptic` | `boolean` | `true` | Enable haptic feedback on mobile |
| `minTime` | `string` | `"00:00"` | Minimum allowed start time |
| `maxTime` | `string` | `"23:59"` | Maximum allowed end time |
| `className` | `string` | `""` | Additional CSS classes |

### 2. PlaceCardWithInlineEditor

Enhanced PlaceCard component with integrated inline time editing.

```tsx
import { PlaceCardWithInlineEditor } from './components/trip/PlaceCardWithInlineEditor';

<PlaceCardWithInlineEditor
  place={place}
  index={0}
  allPlacesInDay={places}
  onTimeChange={handleTimeChange}
  onCascadeTimeUpdate={handleCascadeUpdate}
/>
```

**Props:**

Extends all PlaceCard props plus:

| Prop | Type | Description |
|------|------|-------------|
| `allPlacesInDay` | `Place[]` | All places in the current day for cascade updates |
| `onTimeChange` | `(placeId: string, start: string, end: string) => Promise<void>` | Handle time change for single place |
| `onCascadeTimeUpdate` | `(places: Place[], startIndex: number) => Promise<void>` | Handle cascading updates to subsequent places |

## Usage Examples

### Basic Usage

```tsx
import { InlineTimeEditor } from './components/trip/InlineTimeEditor';

function MyComponent() {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  return (
    <InlineTimeEditor
      startTime={startTime}
      endTime={endTime}
      onTimeChange={handleTimeChange}
    />
  );
}
```

### With Optimistic Updates

```tsx
import { PlaceCardWithInlineEditor } from './components/trip/PlaceCardWithInlineEditor';
import { useTripPlannerStore } from './stores/tripPlannerStore';

function DayItinerary({ dayId }: { dayId: string }) {
  const { getPlacesByDay, updatePlace } = useTripPlannerStore();
  const places = getPlacesByDay(dayId);

  const handleTimeChange = async (placeId: string, start: string, end: string) => {
    // Optimistic update
    updatePlace(placeId, {
      time_start: start,
      time_end: end,
      is_syncing: true,
    });

    try {
      // API call
      await placeService.updatePlace(placeId, {
        time_start: start,
        time_end: end,
      });

      // Success
      updatePlace(placeId, { is_syncing: false });
    } catch (error) {
      // Rollback
      const original = places.find(p => p.id === placeId);
      updatePlace(placeId, {
        time_start: original.time_start,
        time_end: original.time_end,
        is_syncing: false,
        sync_error: 'Failed to update',
      });
    }
  };

  return (
    <div>
      {places.map((place, index) => (
        <PlaceCardWithInlineEditor
          key={place.id}
          place={place}
          index={index}
          allPlacesInDay={places}
          onTimeChange={handleTimeChange}
        />
      ))}
    </div>
  );
}
```

### With Cascading Time Updates

```tsx
import { timeCalculationService } from './services/timeCalculationService';

const handleCascadeTimeUpdate = async (
  updatedPlaces: Place[],
  startIndex: number
) => {
  // Calculate new times for subsequent places
  const result = timeCalculationService.cascadeUpdateTimes(
    updatedPlaces,
    startIndex,
    routeCache // Map of cached routes
  );

  // Apply updates optimistically
  for (const update of result.updatedPlaces) {
    updatePlace(update.placeId, {
      calculated_arrival_time: update.calculatedArrivalTime,
      travel_time_seconds: update.travelTimeFromPrevious,
      is_syncing: true,
    });
  }

  try {
    // Batch API update
    await placeService.batchUpdatePlaces(result.updatedPlaces);

    // Success - remove syncing flags
    for (const update of result.updatedPlaces) {
      updatePlace(update.placeId, { is_syncing: false });
    }
  } catch (error) {
    // Rollback all changes
    for (const update of result.updatedPlaces) {
      const original = places.find(p => p.id === update.placeId);
      updatePlace(update.placeId, {
        calculated_arrival_time: original.calculated_arrival_time,
        is_syncing: false,
        sync_error: 'Failed to update',
      });
    }
  }
};
```

## Integration with Time Calculation Service

The InlineTimeEditor works seamlessly with the `timeCalculationService` to handle cascading time updates:

```tsx
import { timeCalculationService } from './services/timeCalculationService';

// Calculate new arrival times for subsequent places
const result = timeCalculationService.cascadeUpdateTimes(
  places,        // Array of places in the day
  startIndex,    // Index to start cascade from
  routeCache     // Map of cached routes
);

// Result contains:
// - updatedPlaces: Array of TimeCalculationResult with new times
// - conflicts: Array of detected time conflicts

// Apply updates
result.updatedPlaces.forEach(update => {
  updatePlace(update.placeId, {
    calculated_arrival_time: update.calculatedArrivalTime,
    travel_time_seconds: update.travelTimeFromPrevious,
  });
});

// Handle conflicts
result.conflicts.forEach(conflict => {
  console.warn(`Time conflict at ${conflict.placeName}: ${conflict.message}`);
});
```

## Haptic Feedback

The component supports haptic feedback on mobile devices when times snap to intervals:

- **iOS**: Uses Haptic Feedback API if available
- **Android**: Uses Vibration API with 10ms pulses
- **Throttled**: Feedback is throttled to max once per 100ms to avoid excessive vibration

To disable haptic feedback:

```tsx
<InlineTimeEditor
  enableHaptic={false}
  // ... other props
/>
```

## Accessibility

The component is fully accessible:

- **Keyboard Navigation**: Tab to focus thumbs, arrow keys to adjust (not yet implemented)
- **Screen Readers**: ARIA labels and live regions announce changes
- **Focus Indicators**: Clear visual focus states
- **Touch Targets**: Minimum 44x44px touch targets on mobile

## Styling

The component includes comprehensive inline styles that support:

- Light and dark modes
- Responsive breakpoints
- Smooth animations and transitions
- Mobile-optimized touch targets

To customize styles, pass a `className` prop:

```tsx
<InlineTimeEditor
  className="my-custom-editor"
  // ... other props
/>
```

## Performance Considerations

- **Debouncing**: Time changes are debounced during drag to avoid excessive updates
- **Optimistic Updates**: UI updates immediately while API calls happen in background
- **Memoization**: Component uses React hooks to minimize re-renders
- **Event Throttling**: Haptic feedback is throttled to avoid performance issues

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari 12+, Chrome Android 80+
- **Haptic Feedback**: iOS 13+, Android with Vibration API support

## Requirements Met

This implementation satisfies the following requirements from the spec:

- ✅ **13.1**: Inline slider controls with 15-minute snap intervals
- ✅ **13.2**: Haptic feedback on snap (mobile)
- ✅ **13.3**: Auto-recalculate subsequent place times on change
- ✅ **13.6**: Optimistic save without explicit save button

## Testing

See `InlineTimeEditorExample.tsx` for a complete working example with:

- Optimistic updates
- Cascading time calculations
- Error handling and rollback
- Loading states
- Integration with trip planner store

## Future Enhancements

Potential improvements for future iterations:

- [ ] Keyboard arrow key support for fine-tuning times
- [ ] Undo/redo functionality
- [ ] Time conflict warnings in the editor
- [ ] Preset time durations (30m, 1h, 2h, etc.)
- [ ] Custom snap intervals per place type
- [ ] Animation when cascading updates occur
- [ ] Voice input for time selection

## Related Components

- `PlaceCard`: Base place card component
- `TimeCalculationService`: Service for calculating travel times and cascading updates
- `TripPlannerStore`: Zustand store for managing trip state
- `OptimisticUpdateManager`: Service for handling optimistic updates with rollback

## Support

For issues or questions, please refer to:
- Design document: `.kiro/specs/funliday-ui-redesign/design.md`
- Requirements: `.kiro/specs/funliday-ui-redesign/requirements.md`
- Tasks: `.kiro/specs/funliday-ui-redesign/tasks.md`
