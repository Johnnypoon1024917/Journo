// Google Maps and location types

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface PlaceAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: LatLng;
    viewport: MapBounds;
  };
  types: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  website?: string;
  formatted_phone_number?: string;
}

export interface DirectionsRequest {
  origin: LatLng;
  destination: LatLng;
  mode: 'driving' | 'walking' | 'transit' | 'bicycling';
  departure_time?: number;
}

export interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: {
        text: string;
        value: number; // meters
      };
      duration: {
        text: string;
        value: number; // seconds
      };
      start_location: LatLng;
      end_location: LatLng;
      steps: Array<{
        distance: {
          text: string;
          value: number;
        };
        duration: {
          text: string;
          value: number;
        };
        start_location: LatLng;
        end_location: LatLng;
        html_instructions: string;
        travel_mode: string;
      }>;
    }>;
    overview_polyline: {
      points: string;
    };
  }>;
}

export interface MapMarker {
  id: string;
  position: LatLng;
  title: string;
  icon?: string;
  type?: string;
  data?: any;
}

export interface MapRoute {
  id: string;
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  polyline: string;
  distance: number;
  duration: number;
  mode: 'driving' | 'walking' | 'transit' | 'flight';
}

export interface MapViewport {
  center: LatLng;
  zoom: number;
  bounds?: MapBounds;
}

export interface GeocodingResult {
  formatted_address: string;
  geometry: {
    location: LatLng;
    location_type: string;
    viewport: MapBounds;
  };
  place_id: string;
  types: string[];
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}
