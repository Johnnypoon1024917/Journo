import { useEffect, useRef } from 'react';
import type { Place } from '../../types/trip';

interface PlaceMarkerProps {
  place: Place;
  map: google.maps.Map;
  index: number;
  isDarkMode: boolean;
  onClick?: (place: Place) => void;
  onInfoWindowOpen?: (marker: google.maps.Marker, place: Place) => void;
}

export default function PlaceMarker({
  place,
  map,
  index,
  isDarkMode,
  onClick,
  onInfoWindowOpen,
}: PlaceMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!place.lat || !place.lng) return;

    // Create marker
    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      title: place.name,
      label: {
        text: `${index + 1}`,
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
      },
      icon: getMarkerIcon(place.place_type || undefined, isDarkMode),
    });

    // Add click listener
    marker.addListener('click', () => {
      if (onClick) {
        onClick(place);
      }
      if (onInfoWindowOpen) {
        onInfoWindowOpen(marker, place);
      }
    });

    markerRef.current = marker;

    // Cleanup
    return () => {
      marker.setMap(null);
    };
  }, [place, map, index, isDarkMode, onClick, onInfoWindowOpen]);

  // Update marker position if place changes
  useEffect(() => {
    if (markerRef.current && place.lat && place.lng) {
      markerRef.current.setPosition({ lat: place.lat, lng: place.lng });
      markerRef.current.setTitle(place.name);
    }
  }, [place.lat, place.lng, place.name]);

  return null; // This component doesn't render anything in React
}

// Helper function to create custom marker icons
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
