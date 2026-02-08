import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trip, TripDayWithPlaces } from '../types/trip';
import { tripService } from '../services/tripService';
import { Button } from '../components/common/Button';
import { MapView } from '../components/map';
import { StoryFeed } from '../components/story';
import { BudgetCard, CategoryChart, DailyBudgetRing } from '../components/budget';
import { budgetService, BudgetSummary, CategorySpending, DailySpending } from '../services/budgetService';
import { WeatherForecast } from '../components/trip/WeatherForecast';
import { useSocket } from '../hooks/useSocket';

export function SharedTrip() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDayWithPlaces[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [dailySpending, setDailySpending] = useState<DailySpending[]>([]);
  const [viewerCount, setViewerCount] = useState<number>(0);

  // Flatten all places from all days for the map
  const allPlaces = days.flatMap((day) => day.places || []);

  // Setup real-time updates
  const { isConnected } = useSocket({
    tripId: trip?.id,
    onTripUpdated: (data) => {
      console.log('Trip updated via socket:', data);
      fetchTripData();
    },
    onStoryAdded: (data) => {
      console.log('Story added via socket:', data);
      fetchTripData();
    },
    onPlaceAdded: (data) => {
      console.log('Place added via socket:', data);
      fetchTripData();
    },
    onPlaceUpdated: (data) => {
      console.log('Place updated via socket:', data);
      fetchTripData();
    },
    onPlaceDeleted: (data) => {
      console.log('Place deleted via socket:', data);
      fetchTripData();
    },
    onPresenceUpdate: (data) => {
      console.log('Presence update:', data);
      setViewerCount(data.viewerCount || 0);
    },
  });

  const fetchTripData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const [tripResponse, daysResponse] = await Promise.all([
        tripService.getTripByToken(token),
        tripService.getDaysByToken(token),
      ]);
      setTrip(tripResponse.data);
      setDays(daysResponse);
      setError(null);

      // Calculate budget data if trip has budget
      if (tripResponse.data.total_budget) {
        const places = daysResponse.flatMap((day: TripDayWithPlaces) => day.places || []);
        const summary = await budgetService.calculateBudgetSummary(tripResponse.data, places);
        const categories = await budgetService.calculateCategorySpending(tripResponse.data, places);
        const daily = await budgetService.calculateDailySpending(tripResponse.data, daysResponse, places);
        
        setBudgetSummary(summary);
        setCategorySpending(categories);
        setDailySpending(daily);
      }
    } catch (err: any) {
      console.error('Error fetching shared trip:', err);
      setError(err.message || 'Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [token]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
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
          <p className="text-gray-600 dark:text-gray-400">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Trip not found or not public'}</p>
          <Button onClick={() => navigate('/')} variant="primary">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with connection status */}
        <div className="flex justify-between items-center mb-4">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
          >
            <svg
              className="w-5 h-5 mr-2 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Home
          </Button>

          {/* Live indicator and viewer count */}
          <div className="flex items-center space-x-4">
            {isConnected && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Live</span>
                </div>
                {viewerCount > 0 && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{viewerCount} viewing</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cover Image */}
        {trip.cover_image_url && (
          <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6">
            <img
              src={trip.cover_image_url}
              alt={trip.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Trip Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {trip.title}
              </h1>
              {trip.destination && (
                <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-lg">{trip.destination}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                trip.theme === 'adventure' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                trip.theme === 'romantic' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400' :
                trip.theme === 'foodie' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                trip.theme === 'chill' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {trip.theme}
              </span>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Start Date
              </h3>
              <p className="text-lg text-gray-900 dark:text-white">
                {formatDate(trip.start_date)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                End Date
              </h3>
              <p className="text-lg text-gray-900 dark:text-white">
                {formatDate(trip.end_date)}
              </p>
            </div>
            {trip.total_budget && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Budget
                </h3>
                <p className="text-lg text-gray-900 dark:text-white">
                  {trip.currency_code} {trip.total_budget.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{trip.views_count} views</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{trip.likes_count} likes</span>
            </div>
          </div>
        </div>

        {/* Weather Forecast */}
        {trip.weather_data && (
          <div className="mb-6">
            <WeatherForecast 
              tripId={trip.id} 
              weatherData={trip.weather_data}
            />
          </div>
        )}

        {/* Journey Story Feed */}
        <div className="mb-6">
          <StoryFeed tripId={trip.id} canAdd={false} />
        </div>

        {/* Budget Section */}
        {trip.total_budget && budgetSummary && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Budget Overview
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <BudgetCard summary={budgetSummary} />
              <CategoryChart categories={categorySpending} currency={trip.currency_code || 'USD'} />
            </div>
            <DailyBudgetRing dailySpending={dailySpending} currency={trip.currency_code || 'USD'} />
          </div>
        )}

        {/* Map View */}
        {allPlaces.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Trip Map
            </h2>
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapView
                places={allPlaces}
                showRoutes={showRoutes}
                onPlaceClick={(place) => console.log('Place clicked:', place)}
                onRoutesToggle={setShowRoutes}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* Itinerary - Read Only */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Itinerary
          </h2>
          {days.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No itinerary available yet
            </p>
          ) : (
            <div className="space-y-6">
              {days.map((day) => (
                <div key={day.id} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Day {day.day_number}
                    {day.date && (
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                        {formatDate(day.date)}
                      </span>
                    )}
                  </h3>
                  {day.places && day.places.length > 0 ? (
                    <div className="space-y-3">
                      {day.places.map((place) => (
                        <div key={place.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                {place.sticker && (
                                  <span className="text-2xl mr-2">{place.sticker}</span>
                                )}
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                  {place.name}
                                </h4>
                              </div>
                              {place.address && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {place.address}
                                </p>
                              )}
                              {(place.time_start || place.time_end) && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {place.time_start} {place.time_end && `- ${place.time_end}`}
                                </p>
                              )}
                              {place.notes && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                  {place.notes}
                                </p>
                              )}
                            </div>
                            {place.place_type && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 capitalize">
                                {place.place_type}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No places added yet</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharedTrip;
