# ActivityItem Component

A bubblequest-styled component for displaying individual activity/place items within a trip day.

## Features

- **Time Display**: Shows activity start time with clock icon, or place type icon if no time
- **Location Integration**: Clickable location links that open Google Maps
- **Completion Tracking**: Interactive checkbox to mark activities as complete/incomplete
- **Drag & Drop Support**: Optional drag handle for reordering activities
- **Rich Information**: Displays name, location, notes, and travel time/distance
- **Visual Feedback**: Hover and tap animations, completion state styling
- **Accessibility**: Proper ARIA labels, keyboard navigation support

## Usage

### Basic Usage

```tsx
import { ActivityItem } from '@/components/bubblequest/ActivityItem';

function MyComponent() {
  const activity = {
    id: '1',
    name: 'Tokyo Tower',
    address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo',
    lat: 35.6586,
    lng: 139.7454,
    time_start: '10:00',
    notes: 'Great views of the city!',
    place_type: 'attraction',
    // ... other Place fields
  };

  return (
    <ActivityItem
      activity={activity}
      onClick={() => console.log('Activity clicked')}
    />
  );
}
```

### With Completion Tracking

```tsx
const [completed, setCompleted] = useState(false);

<ActivityItem
  activity={activity}
  completed={completed}
  onCompletionToggle={setCompleted}
/>
```

### With Drag Handle

```tsx
<ActivityItem
  activity={activity}
  showDragHandle={true}
  isDragging={isDragging}
  onCompletionToggle={(completed) => updateActivity(activity.id, { completed })}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activity` | `Place` | Required | The activity/place data to display |
| `completed` | `boolean` | `false` | Whether the activity is marked as complete |
| `onClick` | `() => void` | - | Callback when the activity card is clicked |
| `onCompletionToggle` | `(completed: boolean) => void` | - | Callback when completion checkbox is toggled |
| `isDragging` | `boolean` | `false` | Whether the item is currently being dragged |
| `showDragHandle` | `boolean` | `false` | Whether to show the drag handle icon |
| `className` | `string` | - | Additional CSS classes |

## Place Type Icons

The component automatically selects appropriate emoji icons based on the `place_type`:

- `attraction`: 🎭
- `food`: 🍜
- `hotel`: 🏨
- `transport`: 🚗
- `other` or `null`: 📍

## Google Maps Integration

The component generates Google Maps URLs with the following priority:

1. **Coordinates** (if `lat` and `lng` are available): `https://www.google.com/maps/search/?api=1&query=LAT,LNG`
2. **Address** (if available): `https://www.google.com/maps/search/?api=1&query=ENCODED_ADDRESS`
3. **Name** (fallback): `https://www.google.com/maps/search/?api=1&query=ENCODED_NAME`

Links open in a new tab/window.

## Visual States

### Default State
- White background with subtle border
- Hover effect: border color changes to primary color
- Tap effect: slight scale down animation

### Completed State
- Reduced opacity (75%)
- Name text has line-through
- Solid checkmark icon in primary color
- Muted text colors for location and notes

### Dragging State
- Reduced opacity (50%)
- Elevated shadow
- No hover/tap animations

## Accessibility

- **ARIA Labels**: Completion button has descriptive labels
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Indicators**: Visible focus rings on interactive elements
- **Screen Readers**: Proper semantic HTML and ARIA attributes

## Styling

The component uses Tailwind CSS with custom kawaii design tokens:

- `bubblequest-primary-*`: Primary theme colors
- `bubblequest-neutral-*`: Neutral grays
- `bubblequest-cream-*`: Cream background colors

Dark mode is fully supported with appropriate color adjustments.

## Requirements

Validates the following requirements:
- **2.6**: Completion indicators for activities
- **3.1**: Google Maps integration for locations
- **9.6**: Activity display with time, location, icon, and notes

## Related Components

- `DayCard`: Parent component that displays multiple activities
- `WeatherWidget`: Displays weather information for the day
- `DateSelector`: Allows navigation between trip days

## Example: Complete Integration

```tsx
import { useState } from 'react';
import { ActivityItem } from '@/components/bubblequest/ActivityItem';
import { Place } from '@/types/trip';

function ActivityList({ activities }: { activities: Place[] }) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const handleToggle = (activityId: string, completed: boolean) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (completed) {
        next.add(activityId);
      } else {
        next.delete(activityId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {activities.map(activity => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          completed={completedIds.has(activity.id)}
          onCompletionToggle={(completed) => handleToggle(activity.id, completed)}
          onClick={() => console.log('Edit activity', activity.id)}
        />
      ))}
    </div>
  );
}
```

## Testing

The component should be tested for:

1. **Rendering**: Displays all activity information correctly
2. **Google Maps**: Generates correct URLs for different location data
3. **Completion**: Toggles completion state and updates UI
4. **Interactions**: Click handlers work correctly
5. **Accessibility**: Keyboard navigation and ARIA labels
6. **Visual States**: Completed, dragging, and hover states render correctly
