import React, { useEffect, useState } from 'react';
import { Trip } from '../../types/trip';
import { TripCard } from './TripCard';
import { tripService } from '../../services/tripService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import { Button } from '../common/Button';
import { PullToRefresh } from '../common/PullToRefresh';
import { useAuthErrorHandler } from '../../hooks/useAuthErrorHandler';
import { TripCardsSkeleton } from '../common/SkeletonCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface TripListProps {
  onTripDeleted?: (tripId: string) => void;
}

export const TripList: React.FC<TripListProps> = ({ onTripDeleted }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const { accessToken } = useEnhancedAuthStore();
  const { handleError } = useAuthErrorHandler();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTrips = async (pageNum: number, append: boolean = false) => {
    try {
      if (!accessToken) {
        setError('Not authenticated');
        return;
      }

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await tripService.getTrips(pageNum, 10, accessToken);

      if (append) {
        setTrips((prev) => [...prev, ...response.data]);
      } else {
        setTrips(response.data);
      }

      setHasMore(response.pagination.has_next);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
      
      // Handle authentication errors globally
      handleError(err);
      
      setError(err.message || 'Failed to load trips');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setPage(1);
    await fetchTrips(1, false);
  };

  useEffect(() => {
    fetchTrips(1);
  }, [accessToken]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTrips(nextPage, true);
  };

  const handleTripDelete = (tripId: string) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
    if (onTripDeleted) {
      onTripDeleted(tripId);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Optimistic update - reorder immediately in UI
    const oldTrips = [...trips];
    const oldIndex = trips.findIndex((trip) => trip.id === active.id);
    const newIndex = trips.findIndex((trip) => trip.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newTrips = arrayMove(trips, oldIndex, newIndex);
    setTrips(newTrips);
    setIsReordering(true);

    // Sync with backend
    try {
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Create trip orders array with new positions
      const tripOrders = newTrips.map((trip, index) => ({
        tripId: trip.id,
        displayOrder: newTrips.length - index - 1, // Higher display_order = shown first
      }));

      await tripService.reorderTrips(tripOrders, accessToken);
    } catch (err: any) {
      console.error('Error reordering trips:', err);
      // Revert to old order on error
      setTrips(oldTrips);
      setError('Failed to save trip order');
    } finally {
      setIsReordering(false);
    }
  };

  if (isLoading) {
    return <TripCardsSkeleton count={3} />;
  }

  if (error && trips.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => fetchTrips(1)} className="bg-black hover:bg-gray-800 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md px-4">
          {/* Happy traveler illustration */}
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full animate-pulse"></div>
            <div className="relative w-full h-full flex items-center justify-center">
              <svg className="w-20 h-20 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {/* Suitcase */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {/* Happy face emoji overlay */}
              <span className="absolute -top-2 -right-2 text-3xl">😊</span>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Ready for your first trip?
          </h3>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Tap 'Create a trip' to begin! 🚀
          </p>
          
          {/* Prominent CTA button */}
          <Button 
            onClick={() => {
              // Navigate to create trip - this will be handled by parent component
              const createButton = document.querySelector('[data-create-trip]') as HTMLElement;
              if (createButton) {
                createButton.click();
              }
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Create Your First Trip
          </Button>
          
          <p className="text-gray-500 text-sm mt-6">
            Join thousands of travelers planning amazing adventures ✨
          </p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-8">
        {/* Error message if reordering failed */}
        {error && trips.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Trip Grid with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={trips.map((trip) => trip.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={handleTripDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Reordering indicator */}
        {isReordering && (
          <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Saving order...</span>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleLoadMore}
              variant="secondary"
              isLoading={isLoadingMore}
              disabled={isLoadingMore}
              className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-3 rounded-lg font-medium"
            >
              {isLoadingMore ? 'Loading...' : 'Load More Trips'}
            </Button>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};
