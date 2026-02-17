/**
 * PageLayout - MINIMAL VERSION
 * No animations, minimal styling
 * Implements safe area constraints for iOS devices (Requirements 7.1, 7.2)
 */

import React from 'react';
import { StickerCanvas } from '@/components/stickers/organisms/StickerCanvas';

interface PageLayoutProps {
  children: React.ReactNode;
  tripId?: string;
  entityType?: 'trip' | 'trip_day' | 'place';
  entityId?: string;
  showStickers?: boolean;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  tripId,
  entityType = 'trip',
  entityId,
  showStickers = false,
  isLoading = false,
  error = null,
  className,
}) => {
  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        overflow: 'visible',
        // Safe area constraints are handled by NavigationWrapper
        // This component focuses on content layout
      }}
    >
      {/* Stickers - Using new StickerCanvas component */}
      {showStickers && tripId && (
        <StickerCanvas
          tripId={tripId}
          elementType={entityType === 'trip' ? 'trip' : entityType === 'trip_day' ? 'day' : 'activity'}
          elementId={entityId || tripId}
          editable={true}
          hasValues={false}
          className="absolute inset-0 pointer-events-none"
        />
      )}
      
      {/* Loading */}
      {isLoading && (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      )}
      
      {/* Error */}
      {error && !isLoading && (
        <div style={{ padding: '16px', margin: '16px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px' }}>
          <p style={{ color: '#c00' }}>{error}</p>
        </div>
      )}
      
      {/* Content */}
      {!isLoading && !error && (
        <div style={{ width: '100%', overflow: 'visible' }}>
          {children}
        </div>
      )}
    </div>
  );
};
