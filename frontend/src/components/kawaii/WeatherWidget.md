# WeatherWidget Component

## Overview

The `WeatherWidget` component displays weather information in a compact, kawaii-styled card. It shows temperature, weather conditions, and precipitation probability with animated weather emojis.

## Features

- **Temperature Display**: Shows high/low temperatures with degree symbols
- **Weather Conditions**: Displays weather emoji and translated condition text
- **Precipitation Probability**: Shows rain chance when applicable
- **Compact Mode**: Supports both full and compact layouts
- **Animations**: Subtle emoji animations using Framer Motion
- **i18n Support**: Translates weather conditions based on user's language
- **Dark Mode**: Fully supports dark mode theming
- **Responsive**: Adapts to different screen sizes

## Requirements

- **2.3**: Display current weather conditions with temperature and forecast for each day
- **9.3**: Display weather information for each day

## Usage

### Basic Usage

```tsx
import { WeatherWidget } from '@/components/kawaii/WeatherWidget';
import { DailyForecast } from '@/types/trip';

const forecast: DailyForecast = {
  date: '2024-03-15',
  temperature_high: 22,
  temperature_low: 15,
  condition: 'Clear',
  precipitation_probability: 10,
  icon: '01d'
};

function MyComponent() {
  return <WeatherWidget forecast={forecast} />;
}
```

### Compact Mode

```tsx
<WeatherWidget forecast={forecast} compact />
```

### Without Forecast Data

```tsx
// Shows placeholder with forecast text
<WeatherWidget />
```

### Custom Styling

```tsx
<WeatherWidget 
  forecast={forecast} 
  className="shadow-lg"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `forecast` | `DailyForecast \| undefined` | `undefined` | Weather forecast data to display |
| `className` | `string` | `undefined` | Additional CSS classes |
| `compact` | `boolean` | `false` | Use compact horizontal layout |

## DailyForecast Type

```typescript
interface DailyForecast {
  date: string;                    // ISO date string
  temperature_high: number;        // High temperature in Celsius
  temperature_low: number;         // Low temperature in Celsius
  condition: string;               // Weather condition (e.g., "Clear", "Rain")
  precipitation_probability: number; // 0-100 percentage
  icon: string;                    // OpenWeather icon code
}
```

## Weather Conditions

The component supports the following weather conditions with corresponding emojis:

| Condition | Emoji | Translation Key |
|-----------|-------|-----------------|
| Clear/Sunny | ☀️ | `weather.conditions.sunny` |
| Cloudy | ☁️ | `weather.conditions.cloudy` |
| Partly Cloudy | 🌤️ | `weather.conditions.partlyCloudy` |
| Rainy | 🌧️ | `weather.conditions.rainy` |
| Drizzle | 🌦️ | `weather.conditions.rainy` |
| Snowy | ❄️ | `weather.conditions.snowy` |
| Stormy | ⛈️ | `weather.conditions.stormy` |
| Foggy/Misty | 🌫️ | `weather.conditions.foggy` |
| Windy | 💨 | `weather.conditions.windy` |

## Layouts

### Full Layout (Default)

Vertical layout with:
- Large animated weather emoji (5xl)
- Temperature display (high/low)
- Condition text
- Precipitation probability badge (if > 0%)

Best for: Schedule cards, dedicated weather sections

### Compact Layout

Horizontal layout with:
- Medium animated weather emoji (3xl)
- Temperature display (high/low)
- Condition text (truncated)
- Precipitation icon and percentage (if > 0%)

Best for: Day cards, inline weather displays

## Animations

The component includes subtle animations:

1. **Initial Animation**: Fades in and slides up on mount
2. **Emoji Animation**: 
   - Full layout: Scale and rotate animation (3s loop)
   - Compact layout: Scale pulse animation (2s loop)

## Internationalization

Weather conditions are translated using the `kawaii` namespace:

```json
{
  "weather": {
    "title": "Weather",
    "temperature": "{{temp}}°",
    "conditions": {
      "sunny": "Sunny",
      "cloudy": "Cloudy",
      "rainy": "Rainy",
      "snowy": "Snowy",
      "windy": "Windy",
      "foggy": "Foggy",
      "stormy": "Stormy",
      "partlyCloudy": "Partly Cloudy"
    },
    "forecast": "Forecast"
  }
}
```

## Styling

The component uses:
- Gradient backgrounds: `from-kawaii-primary-50 to-kawaii-primary-100`
- Dark mode support with adjusted opacity
- Rounded corners: `rounded-xl`
- Responsive padding: `p-3` (compact) or `p-4` (full)

## Examples

### In a Day Card

```tsx
<Card>
  <h3>Day 1 - Tokyo</h3>
  <WeatherWidget forecast={dayForecast} compact />
  <ActivityList activities={activities} />
</Card>
```

### In a Schedule Screen

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {days.map(day => (
    <WeatherWidget 
      key={day.date}
      forecast={day.forecast}
    />
  ))}
</div>
```

### With Loading State

```tsx
function WeatherDisplay({ tripId }: { tripId: string }) {
  const { data: weather, isLoading } = useWeather(tripId);
  
  if (isLoading) {
    return <WeatherWidget />; // Shows placeholder
  }
  
  return <WeatherWidget forecast={weather?.forecast[0]} />;
}
```

## Accessibility

- Uses semantic HTML
- Color contrast meets WCAG AA standards
- Emoji provides visual context
- Text provides screen reader context
- Respects reduced motion preferences (via Framer Motion)

## Related Components

- `CountdownTimer`: Displays countdown to trip departure
- `DateSelector`: Allows navigation between trip days
- `DayCard`: Contains weather widget along with other day information
- `Card`: Base card component used for layout

## Testing

See `__tests__/WeatherWidget.test.tsx` for unit tests covering:
- Rendering with forecast data
- Rendering without forecast data (placeholder)
- Compact vs full layout
- Temperature formatting
- Weather emoji selection
- Precipitation probability display
- i18n translations
- Dark mode styling
