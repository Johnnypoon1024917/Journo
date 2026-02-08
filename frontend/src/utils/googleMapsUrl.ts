/**
 * Utility functions for generating Google Maps URLs
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Validates if coordinates are within valid ranges
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
export function isValidCoordinates(coordinates: Coordinates | undefined | null): boolean {
  if (!coordinates) {
    return false;
  }

  const { lat, lng } = coordinates;

  // Check if values are numbers and not NaN
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }

  // Check if within valid ranges
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Generates a Google Maps URL for a location
 * 
 * @param locationName - The name or address of the location
 * @param coordinates - Optional coordinates for the location
 * @returns A Google Maps URL string, or null if location is empty
 * 
 * @example
 * // With coordinates
 * generateGoogleMapsUrl('Tokyo Tower', { lat: 35.6586, lng: 139.7454 })
 * // Returns: 'https://www.google.com/maps/search/?api=1&query=35.6586,139.7454'
 * 
 * @example
 * // Without coordinates
 * generateGoogleMapsUrl('Tokyo Tower')
 * // Returns: 'https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower'
 * 
 * @example
 * // Empty location
 * generateGoogleMapsUrl('')
 * // Returns: null
 */
export function generateGoogleMapsUrl(
  locationName: string,
  coordinates?: Coordinates | null
): string | null {
  // Handle edge case: empty location name and no valid coordinates
  const hasValidName = locationName && locationName.trim().length > 0;
  const hasValidCoords = isValidCoordinates(coordinates);

  if (!hasValidName && !hasValidCoords) {
    return null;
  }

  const baseUrl = 'https://www.google.com/maps/search/?api=1&query=';

  // Prefer coordinates when available and valid
  if (hasValidCoords && coordinates) {
    // Use coordinates-based URL for more precise location
    return `${baseUrl}${coordinates.lat},${coordinates.lng}`;
  }

  // Fall back to search-based URL when coordinates unavailable
  if (hasValidName) {
    return `${baseUrl}${encodeURIComponent(locationName.trim())}`;
  }

  // This should not be reached due to the initial check, but for type safety
  return null;
}

/**
 * Opens a Google Maps URL in a new tab/window
 * 
 * @param locationName - The name or address of the location
 * @param coordinates - Optional coordinates for the location
 * @returns true if the URL was opened successfully, false otherwise
 */
export function openGoogleMaps(
  locationName: string,
  coordinates?: Coordinates | null
): boolean {
  const url = generateGoogleMapsUrl(locationName, coordinates);

  if (!url) {
    console.warn('Cannot open Google Maps: invalid location data');
    return false;
  }

  try {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  } catch (error) {
    console.error('Failed to open Google Maps:', error);
    return false;
  }
}
