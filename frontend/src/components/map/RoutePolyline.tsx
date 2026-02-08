import { useEffect, useRef } from 'react';
import { mapsService } from '../../services/mapsService';
import type { Place } from '../../types/trip';
import type { DirectionsResult } from '../../types/maps';

interface RoutePolylineProps {
  origin: Place;
  destination: Place;
  map: google.maps.Map;
  isDarkMode: boolean;
  showDirections?: boolean;
  onRouteCalculated?: (distance: number, duration: number) => void;
}

export default function RoutePolyline({
  origin,
  destination,
  map,
  isDarkMode,
  showDirections = true,
  onRouteCalculated,
}: RoutePolylineProps) {
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return;
    }

    // Skip flight routes (we don't draw lines for flights)
    if (destination.transport_mode === 'flight') {
      return;
    }

    const calculateAndDrawRoute = async () => {
      try {

        // Determine transport mode
        const mode = destination.transport_mode || 'driving';

        if (showDirections && mode !== 'flight') {
          // Use Directions API for accurate routes
          const result = await mapsService.calculateRoute({
            origin: { lat: origin.lat!, lng: origin.lng! },
            destination: { lat: destination.lat!, lng: destination.lng! },
            mode: mode as 'driving' | 'walking' | 'transit',
          });

          // Draw the route using DirectionsRenderer
          if (!directionsRendererRef.current) {
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
              map,
              suppressMarkers: true, // We already have our custom markers
              polylineOptions: {
                strokeColor: isDarkMode ? '#60A5FA' : '#3B82F6',
                strokeOpacity: 0.7,
                strokeWeight: 4,
              },
            });
          }

          // Convert our result back to Google's format for rendering
          const directionsResult = await getDirectionsResult(result);
          directionsRendererRef.current.setDirections(directionsResult);

          // Notify parent of route details
          if (onRouteCalculated && result.routes[0]?.legs[0]) {
            const leg = result.routes[0].legs[0];
            onRouteCalculated(leg.distance.value, leg.duration.value);
          }
        } else {
          // Draw simple straight line for flights or when directions are disabled
          drawStraightLine();
        }
      } catch (error) {
        console.error('Error calculating route:', error);
        // Fallback to straight line
        drawStraightLine();
      }
    };

    const drawStraightLine = () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      polylineRef.current = new google.maps.Polyline({
        path: [
          { lat: origin.lat!, lng: origin.lng! },
          { lat: destination.lat!, lng: destination.lng! },
        ],
        geodesic: true,
        strokeColor: isDarkMode ? '#60A5FA' : '#3B82F6',
        strokeOpacity: destination.transport_mode === 'flight' ? 0.4 : 0.7,
        strokeWeight: destination.transport_mode === 'flight' ? 2 : 3,
        icons: destination.transport_mode === 'flight' ? [
          {
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 3,
            },
            offset: '0',
            repeat: '20px',
          },
        ] : undefined,
        map,
      });
    };

    calculateAndDrawRoute();

    // Cleanup
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [origin, destination, map, isDarkMode, showDirections, onRouteCalculated]);

  return null; // This component doesn't render anything in React
}

// Helper function to convert our DirectionsResult back to Google's format
async function getDirectionsResult(result: DirectionsResult): Promise<google.maps.DirectionsResult> {
  // This is a simplified conversion - in practice, we'd use the actual Google API response
  // For now, we'll make a fresh API call
  const service = await mapsService.getDirectionsService();
  
  return new Promise((resolve, reject) => {
    if (result.routes[0]?.legs[0]) {
      const leg = result.routes[0].legs[0];
      service.route(
        {
          origin: new google.maps.LatLng(leg.start_location.lat, leg.start_location.lng),
          destination: new google.maps.LatLng(leg.end_location.lat, leg.end_location.lng),
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          if (status === google.maps.DirectionsStatus.OK && response) {
            resolve(response);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    } else {
      reject(new Error('Invalid directions result'));
    }
  });
}
