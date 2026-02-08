import { useEffect, useRef, useState } from 'react';
import { mapsService } from '../../services/mapsService';
import { offlineMapsService } from '../../services/offlineMapsService';
import { useOfflineStore } from '../../stores/offlineStore';
import type { LatLng } from '../../types/maps';
import type { Place } from '../../types/trip';

interface MapViewProps {
  places: Place[];
  center?: LatLng;
  zoom?: number;
  showRoutes?: boolean;
  onPlaceClick?: (place: Place) => void;
  offlineMode?: boolean;
  className?: string;
  onRoutesToggle?: (show: boolean) => void;
  tripId?: string;
}

export default function MapView({
  places,
  center,
  zoom = 12,
  showRoutes = false,
  onPlaceClick,
  offlineMode = false,
  className = '',
  onRoutesToggle,
  tripId,
}: MapViewProps) {
  const { isOnline } = useOfflineStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRenderersRef = useRef<google.maps.DirectionsRenderer[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [internalShowRoutes, setInternalShowRoutes] = useState(showRoutes);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [hasOfflineMaps, setHasOfflineMaps] = useState(false);
  const [usingOfflineMaps, setUsingOfflineMaps] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  // Check for offline maps availability
  useEffect(() => {
    const checkOfflineMaps = async () => {
      if (tripId) {
        const exists = await offlineMapsService.hasOfflineMaps(tripId);
        setHasOfflineMaps(exists);
        
        // If offline and has cached maps, use them
        if (!isOnline && exists) {
          setUsingOfflineMaps(true);
          if (tripId) {
            await offlineMapsService.updateLastAccessed(tripId);
          }
        } else {
          setUsingOfflineMaps(false);
        }
      }
    };
    
    checkOfflineMaps();
  }, [tripId, isOnline]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || offlineMode) {
      if (offlineMode) {
        setError('Maps are not available in offline mode');
      }
      return;
    }

    if (!mapsService.isApiKeyConfigured()) {
      setError('Google Maps API key is not configured');
      setIsLoading(false);
      return;
    }

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await mapsService.loadGoogleMaps();

        // Calculate center from places if not provided
        const mapCenter = center || calculateCenter(places);
        
        // Set initial zoom - will be adjusted when markers are added
        // Use provided zoom or default based on places
        const initialZoom = places.length === 0 ? 2 : (zoom || 10);

        const mapOptions: google.maps.MapOptions = {
          center: mapCenter,
          zoom: initialZoom,
          styles: isDarkMode ? getDarkModeStyles() : [],
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        };

        mapInstanceRef.current = new google.maps.Map(mapRef.current!, mapOptions);
        infoWindowRef.current = new google.maps.InfoWindow();

        console.log('Map initialized with center:', mapCenter, 'zoom:', initialZoom);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map. Please check your internet connection.');
        setIsLoading(false);
      }
    };

    initMap();
  }, [offlineMode]);

  // Update map style when dark mode changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: isDarkMode ? getDarkModeStyles() : [],
      });
    }
  }, [isDarkMode]);

  // Update center when explicitly provided
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center]);

  // Note: zoom prop is only used for initial setup, not for updates
  // This prevents interference with auto-zoom from fitBounds

  // Update markers when places change
  // Create a stable key from places to detect changes
  const placesKey = places.map(p => `${p.id}-${p.lat}-${p.lng}`).join(',');
  
  useEffect(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (places.length === 0) {
      return;
    }

    // Filter valid places first
    const validPlaces = places.filter((p) => p.lat && p.lng);
    
    if (validPlaces.length === 0) {
      return;
    }

    // Add new markers
    validPlaces.forEach((place, index) => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat!, lng: place.lng! },
        map: mapInstanceRef.current!,
        title: place.name,
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        icon: getMarkerIcon(place.place_type || undefined, isDarkMode),
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(createInfoWindowContent(place));
          infoWindowRef.current.open(mapInstanceRef.current!, marker);
        }
        
        if (onPlaceClick) {
          onPlaceClick(place);
        }
      });

      markersRef.current.push(marker);
    });

    // Always fit bounds to show all markers (unless center is explicitly provided)
    if (!center) {
      // Wait for markers to be added to the map
      setTimeout(() => {
        if (!mapInstanceRef.current) return;
        
        if (validPlaces.length === 1) {
          // For single place, set center and zoom directly
          const place = validPlaces[0];
          mapInstanceRef.current.setCenter({ lat: place.lat!, lng: place.lng! });
          mapInstanceRef.current.setZoom(14);
          console.log('Map centered on single place:', place.name, { lat: place.lat, lng: place.lng });
        } else {
          // For multiple places, create bounds and fit
          const bounds = new google.maps.LatLngBounds();
          validPlaces.forEach((place) => {
            bounds.extend({ lat: place.lat!, lng: place.lng! });
          });
          
          console.log('Fitting map to bounds for', validPlaces.length, 'places');
          
          // Fit bounds with padding
          mapInstanceRef.current.fitBounds(bounds, {
            top: 100,
            right: 100,
            bottom: 100,
            left: 100,
          });
          
          // Wait for bounds to be applied, then check zoom
          setTimeout(() => {
            if (!mapInstanceRef.current) return;
            const currentZoom = mapInstanceRef.current.getZoom();
            console.log('Current zoom after fitBounds:', currentZoom);
            
            // Limit maximum zoom for multiple places
            if (currentZoom && currentZoom > 15) {
              mapInstanceRef.current.setZoom(15);
              console.log('Zoom limited to 15');
            }
          }, 500);
        }
      }, 200);
    }
  }, [placesKey, isDarkMode, onPlaceClick, center]);

  // Sync internal state with prop
  useEffect(() => {
    setInternalShowRoutes(showRoutes);
  }, [showRoutes]);

  // Update routes when showRoutes changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing directions renderers
    directionsRenderersRef.current.forEach((renderer) => renderer.setMap(null));
    directionsRenderersRef.current = [];
    setTotalDistance(0);
    setTotalDuration(0);

    if (!internalShowRoutes || places.length < 2) return;

    const calculateRoutes = async () => {
      setIsCalculatingRoutes(true);
      let cumulativeDistance = 0;
      let cumulativeDuration = 0;

      for (let i = 0; i < places.length - 1; i++) {
        const origin = places[i];
        const destination = places[i + 1];

        if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
          continue;
        }

        // Skip flight routes (we don't draw lines for flights)
        if (destination.transport_mode === 'flight') {
          continue;
        }

        try {
          const mode = destination.transport_mode || 'driving';
          const result = await mapsService.calculateRoute({
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            mode: mode as 'driving' | 'walking' | 'transit',
          });

          if (result.routes[0]?.legs[0]) {
            const leg = result.routes[0].legs[0];
            cumulativeDistance += leg.distance.value;
            cumulativeDuration += leg.duration.value;

            // Create a directions renderer for this segment
            const directionsService = await mapsService.getDirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
              map: mapInstanceRef.current!,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: isDarkMode ? '#60A5FA' : '#3B82F6',
                strokeOpacity: 0.7,
                strokeWeight: 4,
              },
            });

            // Get the actual Google DirectionsResult
            directionsService.route(
              {
                origin: new google.maps.LatLng(origin.lat, origin.lng),
                destination: new google.maps.LatLng(destination.lat, destination.lng),
                travelMode: getTravelMode(mode),
              },
              (response, status) => {
                if (status === google.maps.DirectionsStatus.OK && response) {
                  directionsRenderer.setDirections(response);
                }
              }
            );

            directionsRenderersRef.current.push(directionsRenderer);
          }
        } catch (error) {
          console.error('Error calculating route:', error);
        }
      }

      setTotalDistance(cumulativeDistance);
      setTotalDuration(cumulativeDuration);
      setIsCalculatingRoutes(false);
    };

    calculateRoutes();
  }, [internalShowRoutes, places, isDarkMode]);

  const handleToggleRoutes = () => {
    const newValue = !internalShowRoutes;
    setInternalShowRoutes(newValue);
    if (onRoutesToggle) {
      onRoutesToggle(newValue);
    }
  };

  if (offlineMode || (!isOnline && !hasOfflineMaps)) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Maps are not available offline
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Download offline maps when online to view maps without internet
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please check your configuration and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Offline maps indicator */}
      {usingOfflineMaps && (
        <div className="absolute top-4 right-4 z-10 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Using Offline Maps</span>
        </div>
      )}

      {/* Map controls */}
      {!isLoading && !error && places.length > 1 && (
        <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
          <button
            onClick={handleToggleRoutes}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              internalShowRoutes
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            disabled={isCalculatingRoutes || usingOfflineMaps}
          >
            {isCalculatingRoutes ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Calculating...</span>
              </>
            ) : usingOfflineMaps ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <span>Routes Unavailable Offline</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <span>{internalShowRoutes ? 'Hide Routes' : 'Show Routes'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Route stats */}
      {!isLoading && !error && internalShowRoutes && totalDistance > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Distance</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDistance(totalDistance)}
              </p>
            </div>
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Travel Time</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDuration(totalDuration)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
}

// Helper functions

function getTravelMode(mode: string): google.maps.TravelMode {
  const modeMap: Record<string, google.maps.TravelMode> = {
    driving: google.maps.TravelMode.DRIVING,
    walking: google.maps.TravelMode.WALKING,
    transit: google.maps.TravelMode.TRANSIT,
    bicycling: google.maps.TravelMode.BICYCLING,
  };
  return modeMap[mode] || google.maps.TravelMode.DRIVING;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function calculateCenter(places: Place[]): LatLng {
  if (places.length === 0) {
    // Return world center (shows all countries)
    return { lat: 20, lng: 0 };
  }

  const validPlaces = places.filter((p) => p.lat && p.lng);
  
  if (validPlaces.length === 0) {
    // Return world center if no valid coordinates
    return { lat: 20, lng: 0 };
  }

  const sum = validPlaces.reduce(
    (acc, place) => ({
      lat: acc.lat + place.lat!,
      lng: acc.lng + place.lng!,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / validPlaces.length,
    lng: sum.lng / validPlaces.length,
  };
}

function getMarkerIcon(placeType: string | undefined, isDarkMode: boolean): google.maps.Icon {
  const baseColor = isDarkMode ? '#60A5FA' : '#3B82F6';
  
  const iconMap: Record<string, string> = {
    attraction: '🎯',
    food: '🍽️',
    hotel: '🏨',
    transport: '🚗',
    other: '📍',
  };

  const icon = iconMap[placeType || 'other'] || '📍';

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="${baseColor}" stroke="white" stroke-width="2"/>
        <text x="20" y="26" font-size="16" text-anchor="middle" fill="white">${icon}</text>
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 20),
  };
}

function createInfoWindowContent(place: Place): string {
  return `
    <div style="padding: 8px; max-width: 250px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
        ${place.name}
      </h3>
      ${place.address ? `
        <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">
          📍 ${place.address}
        </p>
      ` : ''}
      ${place.time_start || place.time_end ? `
        <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">
          🕐 ${place.time_start || ''} ${place.time_end ? `- ${place.time_end}` : ''}
        </p>
      ` : ''}
      ${place.notes ? `
        <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">
          ${place.notes}
        </p>
      ` : ''}
    </div>
  `;
}

function getDarkModeStyles(): google.maps.MapTypeStyle[] {
  return [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#2f3948' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
  ];
}
