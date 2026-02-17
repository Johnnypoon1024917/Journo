import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { communityService } from '../services/communityService';
import { Trip } from '../types/trip';
import { StoryItem } from '../types/story';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';
import { QuickPlanModal } from '../components/quickplan/QuickPlanModal';
import { CommunityCard } from '../components/community/CommunityCard';

interface CommunityTrip extends Trip {
  storyItems?: StoryItem[];
  isLiked?: boolean;
  author?: {
    name: string;
    id: string;
  };
}

export function CommunityBlog() {
  const { accessToken, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const [trips, setTrips] = useState<CommunityTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuickPlanOpen, setIsQuickPlanOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recent' | 'popular'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [storyItemsMap, setStoryItemsMap] = useState<Record<string, StoryItem[]>>({});
  const [likedTrips, setLikedTrips] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCommunityTrips();
  }, []);

  const loadCommunityTrips = async () => {
    try {
      setLoading(true);
      const response = await communityService.getCommunityTrips(
        isAuthenticated && accessToken ? accessToken : undefined
      );
      
      if (response.success) {
        setTrips(response.data.trips);
        setStoryItemsMap(response.data.storyItemsMap);
        setLikedTrips(new Set(response.data.likedTripIds || []));
      }
    } catch (err: any) {
      console.error('Error loading community trips:', err);
      // Don't show error for unauthenticated users, just show empty state
      if (err.status !== 401) {
        error('Failed to load community trips');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (tripId: string) => {
    if (!isAuthenticated || !accessToken) {
      error('Please login to like trips');
      return;
    }

    try {
      const isCurrentlyLiked = likedTrips.has(tripId);
      
      if (isCurrentlyLiked) {
        await communityService.unlikeTrip(tripId, accessToken);
        setLikedTrips((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tripId);
          return newSet;
        });
        setTrips(prev => prev.map(t => 
          t.id === tripId 
            ? { ...t, isLiked: false, likes_count: (t.likes_count || 0) - 1 }
            : t
        ));
      } else {
        await communityService.likeTrip(tripId, accessToken);
        setLikedTrips((prev) => new Set(prev).add(tripId));
        setTrips(prev => prev.map(t => 
          t.id === tripId 
            ? { ...t, isLiked: true, likes_count: (t.likes_count || 0) + 1 }
            : t
        ));
      }
    } catch (err: any) {
      error('Failed to update like');
    }
  };

  const handleCopy = async (tripId: string) => {
    if (!isAuthenticated || !accessToken) {
      error('Please login to copy trips');
      return;
    }

    try {
      const response = await communityService.copyTrip(tripId, accessToken);
      if (response.success) {
        success('Trip copied to your collection!');
        // Navigate to the copied trip
        window.location.href = `/trip/${response.data.id}`;
      }
    } catch (err: any) {
      error('Failed to copy trip');
    }
  };

  const filteredTrips = trips
    .filter(trip => {
      if (searchQuery) {
        return trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               trip.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               trip.theme?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      switch (filter) {
        case 'popular':
          return (b.likes_count || 0) - (a.likes_count || 0);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4"
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
          <p className="text-gray-600 dark:text-gray-400">Loading travel stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-lg">J</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">journo</span>
              </Link>
              <span className="text-gray-400">|</span>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Travel Stories</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setIsQuickPlanOpen(true)}
                    className="hidden sm:block"
                  >
                    Quick Plan
                  </Button>
                  <Link to="/">
                    <Button variant="primary">My Trips</Button>
                  </Link>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="primary">Login</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Travel Stories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover amazing trips shared by travelers around the world
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <label htmlFor="community-search" className="sr-only">
              Search travel stories by destination, theme, or title
            </label>
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="community-search"
              type="text"
              placeholder="Search by destination, theme, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search travel stories"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {(['all', 'recent', 'popular'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTrips.length} travel stories
            </p>
          </div>
        </div>

        {/* Trip Cards Grid */}
        {filteredTrips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No travel stories found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery ? 'Try adjusting your search terms' : 'Be the first to share your travel story!'}
            </p>
            {isAuthenticated && (
              <Button onClick={() => setIsQuickPlanOpen(true)}>
                Create Your First Trip
              </Button>
            )}
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

      {/* Quick Plan Modal */}
      <QuickPlanModal
        isOpen={isQuickPlanOpen}
        onClose={() => setIsQuickPlanOpen(false)}
      />
    </div>
  );
}