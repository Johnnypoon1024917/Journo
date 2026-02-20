/**
 * Location Scraping Service - Stub Implementation
 * 
 * NOTE: The backend scraping service has been removed.
 * This is a stub that returns empty results to prevent import errors.
 * TODO: Replace with Google Places API integration
 */

export interface ScrapedLocation {
  id?: string;
  location_name: string;
  source: string;
  lat?: number;
  lng?: number;
  rating?: number;
  visitor_count?: number;
  tips?: string;
}

export class LocationScrapingService {
  /**
   * Search for locations - currently returns empty results
   * TODO: Implement with Google Places API
   */
  static async searchLocations(query: string): Promise<ScrapedLocation[]> {
    console.warn('LocationScrapingService.searchLocations called but service is not implemented');
    console.warn('TODO: Replace with Google Places API integration');
    return [];
  }

  /**
   * Track location selection - currently a no-op
   * TODO: Implement analytics tracking
   */
  static async trackLocationSelection(query: string, locationId: string): Promise<void> {
    console.warn('LocationScrapingService.trackLocationSelection called but service is not implemented');
    // No-op for now
  }
}
