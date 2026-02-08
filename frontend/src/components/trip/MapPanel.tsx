import React, { useEffect, useRef, useState } from 'react';
import { Place } from '../../types/trip';

interface MapPanelProps {
  places: Place[];
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string | null) => void;
  onMapClick: (lat: number, lng: number) => void;
  routes?: Array<{
    from: Place;
    to: Place;
    polyline: string;
    mode: string;
  }>;
  initialDayPlaces?: Place[]; // Places from Day 1 for initial map bounds
}

export const MapPanel: React.FC<MapPanelProps> = ({
  places,
  selectedPlaceId,
  onPlaceSelect,
  routes = [],
  initialDayPlaces = [],
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const hasInitializedBounds = useRef(false);

  // Initialize Google Maps (only once)
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    const initMap = async () => {
      try {
        if (typeof google === 'undefined' || !google.maps) {
          setMapError('Map requires Google Maps API key.');
          setIsLoading(false);
          return;
        }

        const map = new google.maps.Map(mapRef.current!, {
          center: { lat: 35.6762, lng: 139.6503 },
          zoom: 13,
          mapTypeControl: false, // Disabled to reduce UI clutter
          streetViewControl: false,
          fullscreenControl: false, // Disabled to prevent confusion with refresh
          zoomControl: true, // Keep zoom controls as they're essential
        });

        googleMapRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to load map.');
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();
      polylinesRef.current.forEach(polyline => polyline.setMap(null));
      polylinesRef.current = [];
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!googleMapRef.current || typeof google === 'undefined') return;

    const map = googleMapRef.current;
    const currentMarkers = markersRef.current;

    console.log('Updating markers, places count:', places.length);

    // Remove markers that no longer exist
    const placeIds = new Set(places.map(p => p.id));
    currentMarkers.forEach((marker, id) => {
      if (!placeIds.has(id)) {
        console.log('Removing marker:', id);
        marker.setMap(null);
        currentMarkers.delete(id);
      }
    });

    // Add or update markers
    places.forEach((place, index) => {
      if (!place.lat || !place.lng) return;

      const isSelected = place.id === selectedPlaceId;
      const existingMarker = currentMarkers.get(place.id);

      if (existingMarker) {
        // Update existing marker
        console.log('Updating marker:', place.id, 'index:', index + 1);
        
        // Animate size change for selected marker (pulse effect)
        if (isSelected) {
          // Pulse animation: grow then shrink
          let scale = 16;
          const targetScale = 22;
          const pulseInterval = setInterval(() => {
            scale += 2;
            if (scale >= targetScale + 4) {
              clearInterval(pulseInterval);
              // Final size
              existingMarker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: targetScale,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 4,
              });
            } else {
              existingMarker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: scale > targetScale ? targetScale + 4 - (scale - targetScale) : scale,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 4,
              });
            }
          }, 50);
        } else {
          existingMarker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 16,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 3,
          });
        }
        
        existingMarker.setLabel({
          text: (index + 1).toString(),
          color: 'white',
          fontSize: isSelected ? '16px' : '14px',
          fontWeight: 'bold',
        });
        existingMarker.setZIndex(isSelected ? 1000 : index);
      } else {
        // Create new marker
        console.log('Creating marker:', place.id, 'index:', index + 1);
        const marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map,
          label: {
            text: (index + 1).toString(),
            color: 'white',
            fontSize: isSelected ? '16px' : '14px',
            fontWeight: 'bold',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 22 : 16,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: isSelected ? 4 : 3,
          },
          title: place.name,
          zIndex: isSelected ? 1000 : index,
        });

        marker.addListener('click', () => {
          onPlaceSelect(place.id);
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                  ${place.name}
                </h3>
                ${place.address ? `<p style="margin: 0; font-size: 12px;">📍 ${place.address}</p>` : ''}
              </div>
            `);
            infoWindowRef.current.open(map, marker);
          }
        });

        currentMarkers.set(place.id, marker);
      }
    });

    // Initialize map bounds to show Day 1 places (only once)
    if (!hasInitializedBounds.current && places.length > 0) {
      const placesToShow = initialDayPlaces.length > 0 ? initialDayPlaces : places;
      const bounds = new google.maps.LatLngBounds();
      let hasValidBounds = false;
      
      placesToShow.forEach(place => {
        if (place.lat && place.lng) {
          bounds.extend({ lat: place.lat, lng: place.lng });
          hasValidBounds = true;
        }
      });
      
      if (hasValidBounds) {
        // Fit bounds with padding for better visibility
        map.fitBounds(bounds, {
          top: 80,
          right: 80,
          bottom: 80,
          left: 80,
        });
        hasInitializedBounds.current = true;
        
        // For single place, zoom in more after a delay
        if (placesToShow.length === 1) {
          setTimeout(() => {
            map.setZoom(15);
          }, 300);
        }
      }
    }
  }, [places, selectedPlaceId, onPlaceSelect, initialDayPlaces]);

  // Zoom to selected place with smooth animation
  useEffect(() => {
    if (!googleMapRef.current || !selectedPlaceId || typeof google === 'undefined') return;

    const selectedPlace = places.find(p => p.id === selectedPlaceId);
    if (!selectedPlace || !selectedPlace.lat || !selectedPlace.lng) return;

    const map = googleMapRef.current;
    const targetPosition = { lat: selectedPlace.lat, lng: selectedPlace.lng };
    
    // Smooth pan to the selected place
    map.panTo(targetPosition);
    
    // Smooth zoom animation
    const currentZoom = map.getZoom() || 13;
    const targetZoom = 17; // Zoom level for focused view
    
    if (currentZoom !== targetZoom) {
      // Use Google Maps built-in smooth zoom
      const zoomDiff = targetZoom - currentZoom;
      const steps = Math.abs(zoomDiff) * 2; // More steps for smoother animation
      const zoomIncrement = zoomDiff / steps;
      let currentStep = 0;
      
      const zoomInterval = setInterval(() => {
        currentStep++;
        const newZoom = currentZoom + (zoomIncrement * currentStep);
        
        if (currentStep >= steps) {
          map.setZoom(targetZoom);
          clearInterval(zoomInterval);
        } else {
          map.setZoom(newZoom);
        }
      }, 30); // 30ms for smooth animation
      
      // Cleanup interval on unmount or when selectedPlaceId changes
      return () => clearInterval(zoomInterval);
    }

    // Show info window for selected place after a short delay
    setTimeout(() => {
      const marker = markersRef.current.get(selectedPlaceId);
      if (marker && infoWindowRef.current) {
        infoWindowRef.current.setContent(`
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">
              ${selectedPlace.name}
            </h3>
            ${selectedPlace.address ? `
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #666; line-height: 1.4;">
                📍 ${selectedPlace.address}
              </p>
            ` : ''}
            ${selectedPlace.notes ? `
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #888; line-height: 1.4; border-top: 1px solid #eee; padding-top: 6px;">
                ${selectedPlace.notes}
              </p>
            ` : ''}
          </div>
        `);
        infoWindowRef.current.open(map, marker);
      }
    }, 400); // Delay to let pan/zoom animation complete
  }, [selectedPlaceId, places]);

  // Draw routes
  useEffect(() => {
    if (!googleMapRef.current || typeof google === 'undefined') return;

    const map = googleMapRef.current;

    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];

    routes.forEach(route => {
      if (!route.polyline) return;

      const decodedPath = google.maps.geometry.encoding.decodePath(route.polyline);
      
      const polyline = new google.maps.Polyline({
        path: decodedPath,
        geodesic: true,
        strokeColor: getRouteColor(route.mode),
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map,
      });

      polylinesRef.current.push(polyline);
    });
  }, [routes]);

  const getRouteColor = (mode: string): string => {
    const colors: Record<string, string> = {
      driving: '#3b82f6',
      walking: '#10b981',
      transit: '#f59e0b',
      flight: '#8b5cf6',
    };
    return colors[mode] || '#6b7280';
  };

  if (mapError) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}
      
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes markerBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};
