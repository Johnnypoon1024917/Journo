import { useState, useEffect } from 'react';
import { CommunityCard } from './CommunityCard';
import { Trip } from '../../types/trip';
import { StoryItem } from '../../types/story';
import { communityService } from '../../services/communityService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';

export function CommunityFeed() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [storyItemsMap, setStoryItemsMap] = useState<Record<string, StoryItem[]>>({});
  const [likedTrips, setLikedTrips] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  
  const { accessToken, isAuthenticated } = useEnhancedAuthStore();

  useEffect(() => {
    loadCommunityTrips();
  }, []);

  useEffect(() => {
    // Filter trips based on search query
    if (searchQuery.trim() === '') {
      setFilteredTrips(trips);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = trips.filter(
        (trip) =>
          trip.title.toLowerCase().includes(query) ||
          trip.destination?.toLowerCase().includes(query) ||
          trip.theme.toLowerCase().includes(query)
      );
      setFilteredTrips(filtered);
    }
  }, [searchQuery, trips]);

  const loadCommunityTrips = async () => {
    try {
      setLoading(true);
      const response = await communityService.getCommunityTrips(accessToken || undefined);
      
      if (response.success) {
        setTrips(response.data.trips);
        setStoryItemsMap(response.data.storyItemsMap);
        setLikedTrips(new Set(response.data.likedTripIds || []));
      }
    } catch (error) {
      console.error('Error loading community trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (tripId: string) => {
    if (!isAuthenticated || !accessToken) return;

    try {
      const isCurrentlyLiked = likedTrips.has(tripId);
      
      if (isCurrentlyLiked) {
        await communityService.unlikeTrip(tripId, accessToken);
        setLikedTrips((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tripId);
          return newSet;
        });
        // Update likes count
        setTrips((prev) =>
          prev.map((trip) =>
            trip.id === tripId
              ? { ...trip, likes_count: trip.likes_count - 1 }
              : trip
          )
        );
      } else {
        await communityService.likeTrip(tripId, accessToken);
        setLikedTrips((prev) => new Set(prev).add(tripId));
        // Update likes count
        setTrips((prev) =>
          prev.map((trip) =>
            trip.id === tripId
              ? { ...trip, likes_count: trip.likes_count + 1 }
              : trip
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCopy = async (tripId: string) => {
    if (!isAuthenticated || !accessToken) return;

    try {
      const response = await communityService.copyTrip(tripId, accessToken);
      
      if (response.success) {
        // Navigate to the copied trip
        window.location.href = `/trip/${response.data.id}`;
      }
    } catch (error) {
      console.error('Error copying trip:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <svg
          className="w-8 h-8 animate-spin text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Community Feed
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover amazing trips shared by travelers around the world
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by destination, theme, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Trip Grid */}
        {filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {searchQuery
                ? 'No trips found matching your search'
                : 'No community trips yet. Be the first to share!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <CommunityCard
                key={trip.id}
                trip={trip}
                storyItems={storyItemsMap[trip.id] || []}
                onLike={handleLike}
                onCopy={handleCopy}
                isLiked={likedTrips.has(trip.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
