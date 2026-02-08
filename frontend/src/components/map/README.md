# Google Maps Integration

This directory contains components for integrating Google Maps into the Journo travel platform.

## Components

### MapView
The main map component that displays an interactive Google Map with places and routes.

**Props:**
- `places: Place[]` - Array of places to display on the map
- `center?: LatLng` - Optional center point for the map (auto-calculated if not provided)
- `zoom?: number` - Zoom level (default: 12)
- `showRoutes?: boolean` - Whether to display routes between places (default: false)
- `onPlaceClick?: (place: Place) => void` - Callback when a place marker is clicked
- `offlineMode?: boolean` - Whether the app is in offline mode (default: false)
- `className?: string` - Additional CSS classes
- `onRoutesToggle?: (show: boolean) => void` - Callback when routes are toggled

**Features:**
- Automatic center calculation based on places
- Dark mode support with custom map styling
- Custom markers with place type icons
- Info windows with place details
- Route visualization with distance and duration
- Toggle button for showing/hiding routes
- Offline mode handling
- Loading and error states

### PlaceMarker
A component for rendering individual place markers on the map.

**Props:**
- `place: Place` - The place to display
- `map: google.maps.Map` - The map instance
- `index: number` - The place index (for numbering)
- `isDarkMode: boolean` - Whether dark mode is active
- `onClick?: (place: Place) => void` - Click handler
- `onInfoWindowOpen?: (marker, place) => void` - Info window handler

### InfoWindow
A component for displaying place information in a popup window.

**Props:**
- `map: google.maps.Map` - The map instance
- `marker?: google.maps.Marker` - The marker to attach to
- `place?: Place` - The place to display
- `isOpen: boolean` - Whether the window is open
- `onClose?: () => void` - Close handler

### RoutePolyline
A component for rendering routes between places using Google Directions API.

**Props:**
- `origin: Place` - Starting place
- `destination: Place` - Ending place
- `map: google.maps.Map` - The map instance
- `isDarkMode: boolean` - Whether dark mode is active
- `showDirections?: boolean` - Whether to use Directions API (default: true)
- `onRouteCalculated?: (distance, duration) => void` - Callback with route details

## Services

### mapsService
A service for interacting with the Google Maps API.

**Methods:**
- `loadGoogleMaps()` - Loads the Google Maps JavaScript API
- `getDirectionsService()` - Returns a DirectionsService instance
- `calculateRoute(request)` - Calculates a route between two points
- `isApiKeyConfigured()` - Checks if the API key is configured

## Setup

1. Add your Google Maps API key to `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. Enable the following APIs in Google Cloud Console:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API

3. Import and use the MapView component:
   ```tsx
   import { MapView } from '../components/map';
   
   <MapView
     places={places}
     showRoutes={true}
     onPlaceClick={(place) => console.log(place)}
   />
   ```

## Features

### Custom Markers
Markers are customized based on place type:
- 🎯 Attraction
- 🍽️ Food
- 🏨 Hotel
- 🚗 Transport
- 📍 Other

### Dark Mode
The map automatically switches to a dark theme when the app is in dark mode.

### Route Visualization
Routes between consecutive places are calculated using the Google Directions API and displayed as polylines on the map. The total distance and travel time are shown in a stats panel.

### Transport Modes
Routes support different transport modes:
- Driving (default)
- Walking
- Transit
- Flight (displayed as dashed line, no directions calculated)

### Offline Support
When offline, the map displays a friendly message and disables map features.

## Error Handling

The component handles various error scenarios:
- Missing API key
- Network errors
- API rate limiting
- Invalid coordinates
- Directions API failures

## Performance

- Map instance is reused across renders
- Markers are efficiently updated when places change
- Routes are calculated only when needed
- Dark mode styles are applied without recreating the map

## Browser Support

Requires a modern browser with support for:
- ES6+ JavaScript
- Google Maps JavaScript API v3
- Geolocation API (optional)

## Dependencies

- `@googlemaps/js-api-loader` - For loading the Google Maps API
- `@types/google.maps` - TypeScript definitions
