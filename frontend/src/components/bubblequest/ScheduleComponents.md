# Schedule Screen Components

This document describes all the kawaii components used in the Schedule screen to match the design specification.

## Component Overview

The Schedule screen is composed of several specialized components that work together to create a comprehensive trip itinerary view:

### 1. CountdownTimer
**Location:** `CountdownTimer.tsx`

Displays time remaining until trip departure with animated countdown.

**Features:**
- Days, hours, minutes, seconds countdown
- Progress bar showing time elapsed
- Animated plane icon
- Responsive design

**Usage:**
```tsx
<CountdownTimer departureDate={new Date('2026-01-14')} />
```

### 2. DateSelector
**Location:** `DateSelector.tsx`

Horizontal scrollable date picker for navigating between trip days.

**Features:**
- Scrollable date cards
- Active date highlighting
- Day of week and date display
- Touch-friendly design

**Usage:**
```tsx
<DateSelector
  dates={tripDates}
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
/>
```

### 3. WeatherWidget
**Location:** `WeatherWidget.tsx`

Displays weather information for the selected day.

**Features:**
- Weather emoji based on conditions
- High/low temperature display
- Condition description
- Precipitation chance
- Compact and full modes
- Refresh button

**Props:**
```typescript
interface WeatherWidgetProps {
  forecast?: DailyForecast;
  className?: string;
  compact?: boolean;
}
```

**Usage:**
```tsx
<WeatherWidget forecast={dayForecast} compact />
```

### 4. DayCard
**Location:** `DayCard.tsx`

Main container that displays all information for a single trip day.

**Features:**
- Date header with day number
- Weather integration
- Hotel display
- Route visualization
- Activity list
- Sticker support
- Character illustration

**Props:**
```typescript
interface DayCardProps {
  day: TripDayWithPlaces;
  tripId: string;
  forecast?: DailyForecast;
  onActivityClick?: (activity: Place) => void;
  onActivityReorder?: (activityId: string, newIndex: number) => void;
  enableStickers?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<DayCard
  day={selectedDay}
  tripId={tripId}
  forecast={weatherData}
  onActivityClick={handleActivityClick}
  onActivityReorder={handleReorder}
/>
```

### 5. ActivityCard
**Location:** `ActivityCard.tsx`

Displays individual activity/place with time, location, and drag handle.

**Features:**
- Drag-and-drop support
- Time and duration display
- Category emoji
- Location address
- Notes preview
- More options menu
- Touch-friendly design

**Props:**
```typescript
interface ActivityCardProps {
  activity: Place;
  time?: string;
  duration?: number;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<ActivityCard
  activity={place}
  time="12:45"
  duration={90}
  onClick={handleClick}
/>
```

### 6. HotelCard
**Location:** `HotelCard.tsx`

Displays hotel/accommodation information.

**Features:**
- Hotel name and address
- Check-in/check-out times
- Location link to Google Maps
- Gradient background
- Hotel emoji

**Props:**
```typescript
interface HotelCardProps {
  name: string;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  onClick?: () => void;
  className?: string;
}
```

**Usage:**
```tsx
<HotelCard
  name="Hotel IL Cuore Namba"
  address="1-2-3 Namba, Chuo-ku, Osaka"
  checkIn="15:00"
  checkOut="11:00"
/>
```

### 7. RouteDisplay
**Location:** `RouteDisplay.tsx`

Shows route between locations with transportation method.

**Features:**
- Multiple stop display
- Arrow separators
- Transport mode emoji
- Travel time
- Compact design

**Props:**
```typescript
interface RouteDisplayProps {
  stops: RouteStop[];
  transportMode?: 'train' | 'bus' | 'car' | 'walk' | 'bike' | 'flight';
  travelTime?: number;
  className?: string;
}
```

**Usage:**
```tsx
<RouteDisplay
  stops={[
    { name: '難波' },
    { name: '梅田' },
    { name: '天満' }
  ]}
  transportMode="train"
  travelTime={45}
/>
```

## Component Hierarchy

```
ScheduleScreen
├── CountdownTimer
├── DateSelector
└── DayCard
    ├── WeatherWidget
    ├── RouteDisplay
    ├── HotelCard
    └── ActivityCard (multiple)
```

## Design Tokens

All components use the kawaii design system tokens:

- **Colors:** `bubblequest-primary-*`, `bubblequest-neutral-*`, `bubblequest-accent-*`
- **Spacing:** Consistent padding and margins
- **Shadows:** `shadow-bubblequest-sm`, `shadow-bubblequest-md`, `shadow-bubblequest-lg`
- **Borders:** `rounded-2xl`, `rounded-3xl`
- **Typography:** Font sizes and weights from design system

## Responsive Behavior

All components are responsive and adapt to different screen sizes:

- **Mobile:** Stacked layout, touch-friendly targets
- **Tablet:** Optimized spacing, larger touch targets
- **Desktop:** Side-by-side layout where appropriate

## Accessibility

All components follow accessibility best practices:

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader support

## Testing

Each component has comprehensive test coverage:

- Unit tests for rendering
- Interaction tests
- Accessibility tests
- Responsive behavior tests

See `__tests__` directory for test files.
