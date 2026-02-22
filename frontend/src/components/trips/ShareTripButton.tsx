/**
 * ShareTripButton - Button for sharing trips to community
 * 
 * Features:
 * - Display "Share to Community" button on trip details page
 * - Show "Shared" status if trip already published
 * - Open composer with pre-populated trip data
 * - Check trip share status on mount
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { CommunityComposer } from '../community/CommunityComposer';
import CommunityService from '@/services/communityService';
import type { Trip } from '@/types/trip';
import type { TripShareStatus } from '@/types/community';

interface ShareTripButtonProps {
  trip: Trip;
  className?: string;
}

export const ShareTripButton: React.FC<ShareTripButtonProps> = ({ trip, className = '' }) => {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<TripShareStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if trip is already shared on mount
  useEffect(() => {
    checkShareStatus();
  }, [trip.id]);
  
  const checkShareStatus = async () => {
    setIsLoadingStatus(true);
    setError(null);
    
    try {
      const status = await CommunityService.getTripShareStatus(trip.id);
      setShareStatus(status);
    } catch (err: any) {
      // If endpoint doesn't exist yet (404), just assume not shared
      // This is expected during development
      if (err.response?.status === 404 || err.code === 'ERR_BAD_REQUEST') {
        setShareStatus({
          tripId: trip.id,
          isShared: false,
        });
      } else {
        console.error('Failed to check trip share status:', err);
        setShareStatus({
          tripId: trip.id,
          isShared: false,
        });
      }
    } finally {
      setIsLoadingStatus(false);
    }
  };
  
  const handleShareClick = () => {
    setIsComposerOpen(true);
  };
  
  const handleComposerClose = () => {
    setIsComposerOpen(false);
    // Refresh share status after closing composer
    checkShareStatus();
  };
  
  // Generate auto-summary for trip
  const generateTripSummary = (): string => {
    const parts: string[] = [];
    
    // Add title
    parts.push(`🌍 ${trip.title}`);
    
    // Add destination
    if (trip.destination) {
      parts.push(`\n📍 ${trip.destination}`);
    }
    
    // Add dates
    if (trip.start_date && trip.end_date) {
      const startDate = new Date(trip.start_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      const endDate = new Date(trip.end_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      parts.push(`\n📅 ${startDate} - ${endDate}`);
    }
    
    // Add budget if available
    if (trip.total_budget && trip.currency_code) {
      parts.push(`\n💰 Budget: ${trip.currency_code} ${trip.total_budget.toLocaleString()}`);
    }
    
    // Add call to action
    parts.push('\n\nCheck out my full itinerary! 🗺️');
    
    return parts.join('');
  };
  
  // Don't show button if trip is not owned by current user
  // (This would need to be checked against current user ID)
  // For now, we'll show it for all trips
  
  if (isLoadingStatus) {
    return (
      <Button
        variant="secondary"
        disabled
        className={className}
      >
        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading...
      </Button>
    );
  }
  
  return (
    <>
      <Button
        onClick={handleShareClick}
        variant={shareStatus?.isShared ? 'secondary' : 'primary'}
        className={className}
        disabled={shareStatus?.isShared}
        aria-label={shareStatus?.isShared ? 'Trip already shared to community' : 'Share trip to community'}
        title={shareStatus?.isShared ? 'This trip has already been shared to the community' : undefined}
      >
        {shareStatus?.isShared ? (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Already Shared
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share to Community
          </>
        )}
      </Button>
      
      {/* Composer modal with pre-populated trip */}
      <CommunityComposer
        isOpen={isComposerOpen}
        onClose={handleComposerClose}
        initialTrip={trip}
        initialContent={generateTripSummary()}
      />
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </>
  );
};
