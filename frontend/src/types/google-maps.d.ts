// Google Maps JavaScript API type declarations
declare namespace google {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    namespace event {
      function removeListener(listener: any): void;
    }

    namespace places {
      interface AutocompleteOptions {
        fields?: string[];
        types?: string[];
      }

      interface PlaceGeometry {
        location?: LatLng;
        viewport?: any;
      }

      interface PlaceResult {
        name?: string;
        formatted_address?: string;
        geometry?: PlaceGeometry;
        place_id?: string;
      }

      class Autocomplete {
        constructor(input: HTMLInputElement, options?: AutocompleteOptions);
        addListener(event: string, handler: () => void): any;
        getPlace(): PlaceResult;
      }
    }
  }
}

interface Window {
  google: typeof google;
}
