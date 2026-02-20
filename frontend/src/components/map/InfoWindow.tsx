import { useEffect, useRef } from 'react';
import type { Place } from '../../types/trip';

interface InfoWindowProps {
  map: google.maps.Map;
  marker?: google.maps.Marker;
  place?: Place;
  isOpen: boolean;
  onClose?: () => void;
}

export default function InfoWindow({
  map,
  marker,
  place,
  isOpen,
  onClose,
}: InfoWindowProps) {
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    // Create info window
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
      
      if (onClose) {
        infoWindowRef.current.addListener('closeclick', onClose);
      }
    }

    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [onClose]);

  useEffect(() => {
    if (!infoWindowRef.current || !place) return;

    if (isOpen && marker) {
      infoWindowRef.current.setContent(createInfoWindowContent(place));
      infoWindowRef.current.open(map, marker);
    } else {
      infoWindowRef.current.close();
    }
  }, [isOpen, marker, place, map]);

  return null; // This component doesn't render anything in React
}

export function createInfoWindowContent(place: Place): string {
  const timeDisplay = formatTimeRange(place.time_start || undefined, place.time_end || undefined);
  const costDisplay = place.cost ? formatCost(place.cost, place.cost_currency || undefined) : null;

  return `
    <div style="padding: 12px; max-width: 280px; font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="margin-bottom: 8px;">
        <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1f2937; line-height: 1.4;">
          ${escapeHtml(place.name)}
        </h3>
        ${place.place_type ? `
          <span style="display: inline-block; padding: 2px 8px; background: #e5e7eb; color: #374151; border-radius: 4px; font-size: 12px; text-transform: capitalize;">
            ${escapeHtml(place.place_type)}
          </span>
        ` : ''}
      </div>
      
      ${place.address ? `
        <div style="margin: 8px 0; display: flex; align-items: start; gap: 6px;">
          <span style="font-size: 14px;">📍</span>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.4;">
            ${escapeHtml(place.address)}
          </p>
        </div>
      ` : ''}
      
      ${timeDisplay ? `
        <div style="margin: 8px 0; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 14px;">🕐</span>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            ${escapeHtml(timeDisplay)}
          </p>
        </div>
      ` : ''}
      
      ${costDisplay ? `
        <div style="margin: 8px 0; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 14px;">💰</span>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            ${escapeHtml(costDisplay)}
          </p>
        </div>
      ` : ''}
      
      ${place.notes ? `
        <div style="margin: 8px 0; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
            ${escapeHtml(place.notes)}
          </p>
        </div>
      ` : ''}
      
      ${place.image_url ? `
        <div style="margin-top: 8px;">
          <img 
            src="${escapeHtml(place.image_url)}" 
            alt="${escapeHtml(place.name)}"
            style="width: 100%; height: auto; border-radius: 6px; max-height: 150px; object-fit: cover;"
          />
        </div>
      ` : ''}
    </div>
  `;
}

// Helper functions

function formatTimeRange(startTime?: string, endTime?: string): string | null {
  if (!startTime && !endTime) return null;
  
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }
  
  if (startTime) {
    return `From ${startTime}`;
  }
  
  return `Until ${endTime}`;
}

function formatCost(cost: number, currency?: string): string {
  const currencySymbol = getCurrencySymbol(currency || 'USD');
  return `${currencySymbol}${cost.toFixed(2)}`;
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'Fr',
    CNY: '¥',
    INR: '₹',
  };
  return symbols[currency] || currency + ' ';
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
