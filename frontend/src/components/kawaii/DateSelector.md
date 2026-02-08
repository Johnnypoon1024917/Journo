# DateSelector Component

A horizontal scrollable date selector component with kawaii styling for navigating between trip days.

## Features

- **Horizontal Scrolling**: Smooth horizontal scroll with touch/swipe support
- **Selected Date Highlighting**: Active date highlighted with primary color gradient
- **Auto-scroll**: Automatically scrolls to center the selected date
- **Smooth Animations**: Framer Motion animations for interactions
- **Touch-Optimized**: 80x80px minimum touch targets for mobile
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Gradient Edges**: Subtle gradient fade on left and right edges
- **Accessibility**: Keyboard navigation and focus management

## Usage

```tsx
import { DateSelector } from '@/components/kawaii';
import { useState } from 'react';
import { addDays } from 'date-fns';

function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Generate array of dates for the trip
  const tripDates = Array.from({ length: 7 }, (_, i) => 
    addDays(new Date('2024-03-15'), i)
  );

  return (
    <div>
      <DateSelector
        dates={tripDates}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      
      {/* Display content for selected date */}
      <div>
        <h2>Schedule for {selectedDate.toLocaleDateString()}</h2>
        {/* ... */}
      </div>
    </div>
  );
}
```

## Props

### `dates` (required)
- **Type**: `Date[]`
- **Description**: Array of dates to display as selectable pills
- **Example**: `[new Date('2024-03-15'), new Date('2024-03-16'), ...]`

### `selectedDate` (required)
- **Type**: `Date`
- **Description**: The currently selected date
- **Example**: `new Date('2024-03-15')`

### `onDateSelect` (required)
- **Type**: `(date: Date) => void`
- **Description**: Callback function called when a date is selected
- **Example**: `(date) => setSelectedDate(date)`

### `className` (optional)
- **Type**: `string`
- **Description**: Additional CSS classes to apply to the container
- **Example**: `"mt-4 mb-6"`

## Examples

### Basic Usage

```tsx
<DateSelector
  dates={tripDates}
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
/>
```

### With Custom Styling

```tsx
<DateSelector
  dates={tripDates}
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
  className="my-8 shadow-lg"
/>
```

### With Trip Data

```tsx
function TripSchedule({ trip }) {
  const [selectedDate, setSelectedDate] = useState(trip.startDate);
  
  // Generate dates from trip start to end
  const tripDates = generateDateRange(trip.startDate, trip.endDate);
  
  // Get activities for selected date
  const activities = trip.activities.filter(activity =>
    isSameDay(activity.date, selectedDate)
  );

  return (
    <div>
      <DateSelector
        dates={tripDates}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      
      <ActivityList activities={activities} />
    </div>
  );
}
```

### Handling Empty Dates

```tsx
function SafeDateSelector({ dates, selectedDate, onDateSelect }) {
  // Component returns null if dates array is empty
  if (!dates || dates.length === 0) {
    return <p>No dates available</p>;
  }

  return (
    <DateSelector
      dates={dates}
      selectedDate={selectedDate}
      onDateSelect={onDateSelect}
    />
  );
}
```

## Styling

The DateSelector uses Tailwind CSS classes with kawaii design tokens:

### Selected Date Pill
- Background: `from-kawaii-primary-500 to-kawaii-primary-400` gradient
- Text: White
- Shadow: `shadow-lg`

### Unselected Date Pill
- Background: `bg-white` (light mode) / `bg-kawaii-neutral-800` (dark mode)
- Border: `border-kawaii-neutral-200` (light mode) / `border-kawaii-neutral-700` (dark mode)
- Hover: `hover:border-kawaii-primary-300` with background tint

### Layout
- Minimum size: 80x80px (touch-optimized)
- Gap between pills: 12px (gap-3)
- Padding: 16px horizontal, 8px vertical
- Border radius: 12px (rounded-xl)

## Animations

### Hover Effect
- Scale: 1.05
- Transition: Spring animation (stiffness: 400, damping: 17)

### Tap Effect
- Scale: 0.95
- Transition: Spring animation

### Auto-scroll
- Behavior: Smooth scroll
- Target: Center the selected date in the viewport

## Accessibility

- **Keyboard Navigation**: All date pills are focusable with Tab key
- **Focus Indicators**: Visible focus ring on keyboard focus
- **Touch Targets**: Minimum 80x80px for easy tapping
- **ARIA**: Buttons are properly labeled with date information
- **Screen Readers**: Date format is readable (day of week, day, month)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 14+
- Android Chrome 90+
- Smooth scrolling with fallback for older browsers

## Performance

- **Scroll Snap**: Uses CSS scroll-snap for smooth scrolling
- **Hidden Scrollbar**: Scrollbar hidden for cleaner appearance
- **Optimized Rendering**: Only visible dates are interactive
- **Framer Motion**: Hardware-accelerated animations

## Related Components

- **CountdownTimer**: Displays countdown to trip departure
- **DayCard**: Displays schedule information for a selected day
- **WeatherWidget**: Shows weather for a selected date

## Requirements

Implements **Requirement 9.2**: Date selector for navigating between trip days

## Design Tokens Used

- `kawaii-primary-*`: Primary color shades for selected state
- `kawaii-neutral-*`: Neutral colors for unselected state
- `kawaii-cream-50`: Background color for gradient edges
- Spacing: `gap-3`, `px-4`, `py-3`
- Border radius: `rounded-xl`
- Shadows: `shadow-lg`

## Notes

- The component uses `date-fns` for date formatting and comparison
- Dates are compared using `isSameDay` to handle time zone differences
- The scroll container hides the scrollbar for a cleaner appearance
- Gradient edges provide visual feedback that content is scrollable
- Auto-scroll centers the selected date for better UX
