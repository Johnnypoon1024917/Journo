# DayCard Component

## Overview

The `DayCard` component displays all information for a single trip day in an at-a-glance card format. It's designed to minimize navigation and maximize information density while maintaining a kawaii aesthetic.

## Features

- ✅ Display date, weather, hotel, flights, and activities on a single card
- ✅ Cute character illustration with floating animation
- ✅ Expandable sections for hotel, flights, and activities
- ✅ Google Maps integration for locations (tap to open)
- ✅ Activity time display with place type icons
- ✅ Completion indicators for activities (placeholder)
- ✅ Cream background with kawaii styling
- ✅ Responsive design
- ✅ i18n support for all text
- ⏳ Drag-and-drop for activity reordering (to be implemented)

## Requirements

Implements requirements:
- **2.1**: Display date, weather, hotel, flights, and activities on a single card
- **2.4**: Horizontal scrolling/swiping between day cards (parent component responsibility)
- **9.4**: Display hotel information for each day
- **9.5**: Display flight information for each day
- **9.6**: Display activities with times and locations

## Props

```typescript
interface DayCardProps {
  day: TripDayWithPlaces;           // Trip day data with places
  forecast?: DailyForecast;         // Weather forecast for the day
  onActivityClick?: (activity: Place) => void;  // Callback when activity is clicked
  onActivityReorder?: (activityId: string, newIndex: number) => void;  // Callback for reordering
  className?: string;               // Additional CSS classes
}
```

## Data Structure

The component expects data in the following format:

```typescript
interface TripDayWithPlaces {
  id: string;
  trip_id: string;
  day_number: number;
  date: string | null;  // ISO date string
  created_at: string;
  places: Place[];
}

interface Place {
  id: string;
  trip_day_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  time_start: string | null;  // HH:MM format
  time_end: string | null;
  notes: string | null;
  place_type: 'attraction' | 'food' | 'hotel' | 'transport' | 'other' | null;
  transport_mode: 'driving' | 'walking' | 'transit' | 'flight' | null;
  // ... other fields
}

interface DailyForecast {
  date: string;
  temperature_high: number;
  temperature_low: number;
  condition: string;
  precipitation_probability: number;
  icon: string;
}
```

## Usage

### Basic Usage

```tsx
import { DayCard } from '@/components/kawaii/DayCard';

function ScheduleScreen() {
  const handleActivityClick = (activity: Place) => {
    // Open activity details modal
    console.log('Activity clicked:', activity);
  };

  const handleActivityReorder = (activityId: string, newIndex: number) => {
    // Update activity order in backend
    console.log('Reorder:', activityId, 'to', newIndex);
  };

  return (
    <DayCard
      day={tripDay}
      forecast={dailyForecast}
      onActivityClick={handleActivityClick}
      onActivityReorder={handleActivityReorder}
    />
  );
}
```

### With Multiple Days (Horizontal Scroll)

```tsx
import { DayCard } from '@/components/kawaii/DayCard';

function ScheduleScreen() {
  return (
    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory">
      {tripDays.map((day, index) => (
        <div key={day.id} className="flex-shrink-0 w-full snap-center">
          <DayCard
            day={day}
            forecast={forecasts[index]}
            onActivityClick={handleActivityClick}
            onActivityReorder={handleActivityReorder}
          />
        </div>
      ))}
    </div>
  );
}
```

### Without Weather

```tsx
<DayCard
  day={tripDay}
  onActivityClick={handleActivityClick}
/>
```

## Component Structure

The DayCard is composed of several sub-components:

### 1. CharacterIllustration
- Displays a cute animated character (🌸)
- Floating animation with rotation
- Positioned in top-right corner

### 2. HotelSection
- Displays hotel information if present
- Expandable/collapsible
- Google Maps integration for address
- Shows hotel name and address

### 3. FlightsSection
- Displays flight information if present
- Expandable/collapsible
- Shows flight count in header
- Lists all flights with time and notes

### 4. ActivitiesSection
- Displays activities if present
- Expandable/collapsible (default: expanded)
- Shows activity count in header
- Lists all activities with ActivityItem components

### 5. ActivityItem
- Individual activity card
- Shows time, icon, name, address, notes
- Google Maps integration for address
- Completion indicator (placeholder)
- Click handler for editing

## Styling

The component uses:
- Cream background (`bg-kawaii-cream-50`)
- Rounded corners (`rounded-2xl`)
- Shadow (`shadow-lg`)
- Expandable sections with smooth animations
- Consistent spacing and typography
- Dark mode support

## Interactions

### Google Maps Integration
- Clicking on hotel address opens Google Maps
- Clicking on activity address opens Google Maps
- Uses coordinates if available, falls back to address search

### Expandable Sections
- Hotel section: collapsed by default
- Flights section: collapsed by default
- Activities section: expanded by default
- Smooth height animations on expand/collapse

### Activity Click
- Clicking an activity card triggers `onActivityClick`
- Can be used to open edit modal or details view

### Activity Reordering
- Drag-and-drop support (to be implemented)
- Will trigger `onActivityReorder` callback

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Focus indicators on interactive elements
- ARIA labels for icons
- Screen reader friendly

## Internationalization

All text is internationalized using the `kawaii` namespace:

```json
{
  "dayCard": {
    "day": "Day",
    "hotel": "Hotel",
    "flights": "Flights",
    "activities": "Activities",
    "noActivities": "No activities planned yet"
  }
}
```

Supported languages:
- English (en)
- Japanese (ja)
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)

## Empty States

When there are no places for the day:
- Shows a centered empty state
- Displays 📝 icon
- Shows "No activities planned yet" message

## Future Enhancements

1. **Drag-and-Drop**: Implement activity reordering with react-beautiful-dnd or @dnd-kit
2. **Completion Tracking**: Add ability to mark activities as completed
3. **Sticker Support**: Display stickers attached to the day or activities
4. **Photo Gallery**: Show activity images in a carousel
5. **Budget Display**: Show total cost for the day
6. **Travel Time**: Display travel time between activities
7. **Map View**: Integrate a mini map showing all locations

## Related Components

- `WeatherWidget`: Used to display weather forecast
- `DateSelector`: Used to navigate between days
- `CountdownTimer`: Shows time until trip departure
- `ActivityItem`: Individual activity display (to be extracted as separate component)

## Testing

See `DayCardDemo.tsx` for interactive examples and testing scenarios.

## Performance Considerations

- Uses Framer Motion for smooth animations
- Lazy rendering of expandable sections
- Optimized re-renders with React.memo (if needed)
- Efficient list rendering for activities

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 14+
- Android Chrome 90+
- Progressive enhancement for older browsers
