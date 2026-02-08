import type { DirectionsRequest, DirectionsResult } from '../types/maps';

// Load Google Maps script dynamically
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded and fully initialized
    if (window.google && window.google.maps && window.google.maps.Map) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for google.maps.Map to be available
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for Google Maps to initialize'));
      }, 10000);
      return;
    }

    // Create callback function
    const callbackName = `initGoogleMaps_${Date.now()}`;
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      resolve();
    };

    // Create and load script with callback
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps script'));
    };
    document.head.appendChild(script);
  });
};

class MapsService {
  private googleMaps: typeof google.maps | null = null;
  private directionsService: google.maps.DirectionsService | null = null;
  private loadPromise: Promise<typeof google.maps> | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google Maps API key not found. Map features will be disabled.');
    }
  }

  async loadGoogleMaps(): Promise<typeof google.maps> {
    if (this.googleMaps) {
      return this.googleMaps;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    this.loadPromise = (async () => {
      try {
        // Load the Google Maps script
        await loadGoogleMapsScript(this.apiKey);
        
        // Double-check that google.maps.Map is available
        if (!window.google || !window.google.maps || !window.google.maps.Map) {
          throw new Error('Google Maps failed to initialize properly');
        }
        
        this.googleMaps = google.maps;
        return this.googleMaps;
      } catch (error) {
        this.loadPromise = null;
        console.error('Error loading Google Maps:', error);
        throw error;
      }
    })();

    return this.loadPromise;
  }

  async getDirectionsService(): Promise<google.maps.DirectionsService> {
    if (this.directionsService) {
      return this.directionsService;
    }

    await this.loadGoogleMaps();
    this.directionsService = new google.maps.DirectionsService();
    return this.directionsService;
  }

  async calculateRoute(request: DirectionsRequest): Promise<DirectionsResult> {
    const service = await this.getDirectionsService();

    return new Promise((resolve, reject) => {
      const routeRequest: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(request.origin.lat, request.origin.lng),
        destination: new google.maps.LatLng(request.destination.lat, request.destination.lng),
        travelMode: this.getTravelMode(request.mode),
      };

      service.route(
        routeRequest,
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(this.formatDirectionsResult(result));
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  }

  private getTravelMode(mode: string): google.maps.TravelMode {
    const modeMap: Record<string, google.maps.TravelMode> = {
      driving: google.maps.TravelMode.DRIVING,
      walking: google.maps.TravelMode.WALKING,
      transit: google.maps.TravelMode.TRANSIT,
      bicycling: google.maps.TravelMode.BICYCLING,
    };
    return modeMap[mode] || google.maps.TravelMode.DRIVING;
  }

  private formatDirectionsResult(result: google.maps.DirectionsResult): DirectionsResult {
    return {
      routes: result.routes.map((route) => ({
        legs: route.legs.map((leg) => ({
          distance: {
            text: leg.distance?.text || '',
            value: leg.distance?.value || 0,
          },
          duration: {
            text: leg.duration?.text || '',
            value: leg.duration?.value || 0,
          },
          start_location: {
            lat: leg.start_location.lat(),
            lng: leg.start_location.lng(),
          },
          end_location: {
            lat: leg.end_location.lat(),
            lng: leg.end_location.lng(),
          },
          steps: leg.steps.map((step) => ({
            distance: {
              text: step.distance?.text || '',
              value: step.distance?.value || 0,
            },
            duration: {
              text: step.duration?.text || '',
              value: step.duration?.value || 0,
            },
            start_location: {
              lat: step.start_location.lat(),
              lng: step.start_location.lng(),
            },
            end_location: {
              lat: step.end_location.lat(),
              lng: step.end_location.lng(),
            },
            html_instructions: step.instructions,
            travel_mode: step.travel_mode,
          })),
        })),
        overview_polyline: {
          points: route.overview_polyline,
        },
      })),
    };
  }

  isApiKeyConfigured(): boolean {
    return !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }
}

export const mapsService = new MapsService();
