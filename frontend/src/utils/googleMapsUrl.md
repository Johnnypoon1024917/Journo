# Google Maps URL Generation Utility

This utility provides functions for generating Google Maps URLs for locations, with support for both coordinate-based and search-based URLs.

## Features

- ✅ Generate URLs with coordinates when available (more precise)
- ✅ Fall back to search-based URLs when coordinates unavailable
- ✅ Handle edge cases (empty location, invalid coordinates)
- ✅ Proper URL encoding for special characters
- ✅ Coordinate validation (lat: -90 to 90, lng: -180 to 180)
- ✅ Open Google Maps in new tab with security attributes

## Usage

### Basic Usage

```typescript
import { generateGoogleMapsUrl, openGoogleMaps } from '@/utils/googleMapsUrl';

// With coordinates (preferred - more precise)
const url1 = generateGoogleMapsUrl('Tokyo Tower', { lat: 35.6586, lng: 139.7454 });
// Returns: 'https://www.google.com/maps/search/?api=1&query=35.6586,139.7454'

// Without coordinates (search-based fallback)
const url2 = generateGoogleMapsUrl('Tokyo Tower');
// Returns: 'https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower'

// Open directly in new tab
openGoogleMaps('Tokyo Tower', { lat: 35.6586, lng: 139.7454 });
```

### In React Components

```typescript
import { openGoogleMaps } from '@/utils/googleMapsUrl';

function ActivityItem({ activity }) {
  const handleLocationClick = () => {
    openGoogleMaps(activity.location, activity.coordinates);
  };

  return (
    <div onClick={handleLocationClick} className="cursor-pointer">
      <span className="text-primary underline">{activity.location}</span>
    </div>
  );
}
```

### Edge Cases

```typescript
// Empty location - returns null
generateGoogleMapsUrl(''); // null

// Invalid coordinates - falls back to search
generateGoogleMapsUrl('Tokyo Tower', { lat: 91, lng: 0 }); 
// Returns: 'https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower'

// Coordinates only (no location name)
generateGoogleMapsUrl('', { lat: 35.6586, lng: 139.7454 });
// Returns: 'https://www.google.com/maps/search/?api=1&query=35.6586,139.7454'

// Special characters are properly encoded
generateGoogleMapsUrl('Café & Restaurant');
// Returns: 'https://www.google.com/maps/search/?api=1&query=Caf%C3%A9%20%26%20Restaurant'
```

## API Reference

### `generateGoogleMapsUrl(locationName, coordinates?)`

Generates a Google Maps URL for a location.

**Parameters:**
- `locationName` (string): The name or address of the location
- `coordinates` (Coordinates | null | undefined): Optional coordinates object with `lat` and `lng` properties

**Returns:**
- `string | null`: A Google Maps URL, or null if location is empty and no valid coordinates

**Behavior:**
1. If valid coordinates are provided, generates a coordinate-based URL (more precise)
2. If coordinates are invalid or unavailable, falls back to search-based URL
3. If both location name and coordinates are invalid/empty, returns null

### `openGoogleMaps(locationName, coordinates?)`

Opens a Google Maps URL in a new tab/window.

**Parameters:**
- `locationName` (string): The name or address of the location
- `coordinates` (Coordinates | null | undefined): Optional coordinates object

**Returns:**
- `boolean`: true if the URL was opened successfully, false otherwise

**Security:**
- Opens in new tab with `noopener,noreferrer` attributes for security

### `isValidCoordinates(coordinates)`

Validates if coordinates are within valid ranges.

**Parameters:**
- `coordinates` (Coordinates | null | undefined): Coordinates object to validate

**Returns:**
- `boolean`: true if coordinates are valid, false otherwise

**Validation Rules:**
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Values must be numbers (not NaN)

## Types

```typescript
interface Coordinates {
  lat: number;
  lng: number;
}
```

## Requirements Satisfied

This utility satisfies the following requirements from the kawaii-ui-redesign spec:

- **Requirement 3.1**: Tap location to open Google Maps
- **Requirement 3.2**: Construct proper URLs with coordinates when available
- **Requirement 3.3**: Fall back to search-based URLs when coordinates unavailable
- **Requirement 3.4**: Open Google Maps in new tab/window

## Testing

The utility includes comprehensive test coverage:

- **Unit Tests**: 33 tests covering all functionality and edge cases
- **Property-Based Tests**: 9 tests verifying correctness across 100+ random inputs each

Run tests with:
```bash
npm test -- googleMapsUrl
```

## Examples from the Codebase

### Activity Item Component

```typescript
// In ActivityItem.tsx
import { openGoogleMaps } from '@/utils/googleMapsUrl';

<div 
  onClick={() => openGoogleMaps(activity.location, activity.coordinates)}
  className="location-link"
>
  {activity.location}
</div>
```

### Hotel Info Component

```typescript
// In HotelInfo.tsx
import { generateGoogleMapsUrl } from '@/utils/googleMapsUrl';

const mapsUrl = generateGoogleMapsUrl(hotel.address, hotel.coordinates);

{mapsUrl && (
  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
    View on Map
  </a>
)}
```

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires `window.open` support
- Handles popup blockers gracefully

## Performance

- Lightweight utility with no external dependencies
- URL generation is synchronous and fast
- No API calls or network requests
