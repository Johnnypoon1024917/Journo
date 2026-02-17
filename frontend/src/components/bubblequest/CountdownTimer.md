# CountdownTimer Component

A bubblequest-styled countdown timer that displays the time remaining until a trip departure date with smooth animations and a progress bar.

## Features

- **Real-time Countdown**: Updates every second showing days, hours, minutes, and seconds
- **Smooth Animations**: Number transitions use Framer Motion for smooth, spring-based animations
- **Progress Bar**: Visual progress indicator with an animated plane icon
- **Expired State**: Shows a special message when the departure date has passed
- **Responsive Design**: Adapts to mobile and desktop screen sizes
- **Dark Mode Support**: Fully compatible with dark mode theming
- **Touch-Optimized**: Designed for mobile-first experience

## Usage

### Basic Example

```tsx
import { CountdownTimer } from '@/components/bubblequest';

function ScheduleScreen() {
  const departureDate = new Date('2024-12-25T10:00:00Z');
  
  return (
    <div>
      <h1>Your Trip</h1>
      <CountdownTimer departureDate={departureDate} />
    </div>
  );
}
```

### With Custom Styling

```tsx
import { CountdownTimer } from '@/components/bubblequest';

function ScheduleScreen() {
  const departureDate = new Date('2024-12-25T10:00:00Z');
  
  return (
    <CountdownTimer 
      departureDate={departureDate}
      className="mb-6 shadow-lg"
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `departureDate` | `Date` | Yes | - | The target departure date for the countdown |
| `className` | `string` | No | - | Additional CSS classes to apply to the container |

## Component Structure

The component consists of several parts:

1. **Countdown Display**: Four animated number sections showing days, hours, minutes, and seconds
2. **Progress Bar**: A horizontal bar showing progress toward departure
3. **Plane Icon**: An animated plane that moves along the progress bar
4. **Helper Text**: Descriptive text below the countdown
5. **Expired State**: Special UI shown when the departure date has passed

## Animations

### Number Transitions

Each number uses a spring animation when it changes:
- **Entry**: Slides up from below with fade-in
- **Exit**: Slides up and fades out
- **Spring Physics**: Stiffness 400, Damping 25

### Plane Icon

The plane icon has two animations:
- **Horizontal Movement**: Follows the progress bar position
- **Vertical Bounce**: Gentle up-and-down motion (2s loop)

### Progress Bar

The progress bar fill animates smoothly when the countdown updates:
- **Duration**: 500ms
- **Easing**: Ease-out

## Styling

The component uses Tailwind CSS with kawaii design tokens:

- **Background**: Gradient from `bubblequest-primary-50` to `bubblequest-primary-100`
- **Numbers**: Large, bold text in `bubblequest-primary-600`
- **Labels**: Smaller text in `bubblequest-neutral-600`
- **Progress Bar**: Gradient from `bubblequest-primary-400` to `bubblequest-primary-500`

### Dark Mode

All colors automatically adjust for dark mode:
- Background uses darker primary shades with transparency
- Text colors use lighter variants for better contrast

## Accessibility

- **Semantic HTML**: Uses proper div structure
- **Screen Reader Support**: Labels clearly identify each time unit
- **Keyboard Navigation**: No interactive elements, so no keyboard concerns
- **Color Contrast**: Meets WCAG AA standards in both light and dark modes

## Performance

- **Update Frequency**: Updates every 1000ms (1 second)
- **Cleanup**: Properly clears interval on unmount
- **Animation Performance**: Uses GPU-accelerated transforms
- **Re-render Optimization**: Only updates when countdown values change

## Edge Cases

The component handles several edge cases:

1. **Expired Date**: Shows special "trip has started" message
2. **Invalid Date**: Gracefully handles invalid date objects
3. **Large Durations**: Correctly displays countdowns over 365 days
4. **Exact Match**: Handles when current time equals departure time

## Examples

### Schedule Screen Integration

```tsx
import { CountdownTimer } from '@/components/bubblequest';
import { useTrip } from '@/hooks/useTrip';

function ScheduleScreen() {
  const { trip } = useTrip();
  
  return (
    <div className="p-6">
      <CountdownTimer departureDate={trip.startDate} />
      
      {/* Rest of schedule content */}
      <div className="mt-6">
        {/* Day cards, activities, etc. */}
      </div>
    </div>
  );
}
```

### With Loading State

```tsx
import { CountdownTimer } from '@/components/bubblequest';
import { useTrip } from '@/hooks/useTrip';

function ScheduleScreen() {
  const { trip, loading } = useTrip();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="p-6">
      {trip?.startDate && (
        <CountdownTimer departureDate={trip.startDate} />
      )}
    </div>
  );
}
```

## Testing

The component includes comprehensive unit tests covering:

- Rendering with all time units
- Countdown calculation accuracy
- Timer updates every second
- Expired state handling
- Progress bar rendering
- Edge cases (invalid dates, large durations)
- Accessibility features

Run tests with:

```bash
npm test -- CountdownTimer.test.tsx
```

## Requirements

This component satisfies the following requirements from the bubblequest-ui-redesign spec:

- **Requirement 2.2**: Display countdown timer to trip departure with days, hours, minutes, and seconds
- **Requirement 9.1**: Schedule screen countdown timer functionality

## Related Components

- `DateSelector`: For navigating between trip days
- `WeatherWidget`: For displaying weather information
- `DayCard`: For displaying daily trip information

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires support for:
- CSS Grid and Flexbox
- CSS Custom Properties
- ES6+ JavaScript features
- Framer Motion animations
