import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trip, TripDayWithPlaces } from '../types/trip';
import { tripService } from '../services/tripService';
import { dayService } from '../services/dayService';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { Button } from '../components/common/Button';
import DayEditor from '../components/trip/DayEditor';
import { MapView } from '../components/map';
import { BudgetCard, CategoryChart, DailyBudgetRing } from '../components/budget';
import { budgetService, BudgetSummary, CategorySpending, DailySpending } from '../services/budgetService';
import { budgetExportService } from '../services/budgetExportService';
import { useToast } from '../hooks/useToast';
import { WeatherForecast } from '../components/trip/WeatherForecast';
import { WeatherData } from '../types/trip';
import { StoryFeed } from '../components/story';
import { ShareModal } from '../components/sharing';
import { VersionHistory } from '../components/trip/VersionHistory';
import { UndoButton } from '../components/trip/UndoButton';
import { OfflineMapsManager, OfflineMapsBadge, NavigationPanel } from '../components/map';

export function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken, logout } = useEnhancedAuthStore();
  const { success: showSuccess, error: showError } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDayWithPlaces[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [dailySpending, setDailySpending] = useState<DailySpending[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isOfflineMapsOpen, setIsOfflineMapsOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  // Flatten all places from all days for the map
  // Create a stable reference that updates when places change
  const allPlaces = days.flatMap((day) => day.places || []).sort((a, b) => {
    // Sort by day number and then by display order to maintain sequence
    const dayA = days.find(d => d.id === a.trip_day_id);
    const dayB = days.find(d => d.id === b.trip_day_id);
    if (dayA && dayB && dayA.day_number !== dayB.day_number) {
      return dayA.day_number - dayB.day_number;
    }
    return a.display_order - b.display_order;
  });

  const fetchTripData = async (preserveScroll = false) => {
    if (!id || !accessToken) return;

    // Save current scroll position
    const scrollPosition = preserveScroll ? window.scrollY : 0;

    try {
      setIsLoading(true);
      const [tripResponse, daysResponse] = await Promise.all([
        tripService.getTripById(id, accessToken),
        dayService.getDaysByTrip(id),
      ]);
      setTrip(tripResponse.data);
      setDays(daysResponse);
      setError(null);

      // Calculate budget data if trip has budget
      if (tripResponse.data.total_budget) {
        const places = daysResponse.flatMap((day) => day.places || []);
        const summary = await budgetService.calculateBudgetSummary(tripResponse.data, places);
        const categories = await budgetService.calculateCategorySpending(tripResponse.data, places);
        const daily = await budgetService.calculateDailySpending(tripResponse.data, daysResponse, places);
        
        setBudgetSummary(summary);
        setCategorySpending(categories);
        setDailySpending(daily);
      }

      // Restore scroll position after render
      if (preserveScroll && scrollPosition > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });
      }
    } catch (err: any) {
      console.error('Error fetching trip:', err);
      
      // If authentication error, logout and redirect to login
      if (err.status === 401 || err.message?.includes('Invalid or expired token')) {
        await logout();
        showError('Your session has expired. Please login again.');
        navigate('/login', { replace: true });
        return;
      }
      
      setError(err.message || 'Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [id, accessToken]);

  const handleExportPDF = async () => {
    if (!trip || !budgetSummary) return;
    try {
      await budgetExportService.exportPDF(trip, budgetSummary, categorySpending, dailySpending);
      showSuccess('Budget PDF generated successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError('Failed to export PDF');
    }
  };

  const handleExportCSV = () => {
    if (!trip) return;
    try {
      budgetExportService.exportCSV(trip, allPlaces, days);
      showSuccess('Budget CSV downloaded successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showError('Failed to export CSV');
    }
  };

  const handleShareBudget = async () => {
    if (!trip) return;
    try {
      const success = await budgetExportService.copyShareableURL(trip.share_token);
      if (success) {
        showSuccess('Budget link copied to clipboard!');
      } else {
        showError('Failed to copy link');
      }
    } catch (error) {
      console.error('Error sharing budget:', error);
      showError('Failed to share budget');
    }
  };

  const handleWeatherUpdate = async (weatherData: WeatherData) => {
    if (!trip || !accessToken) return;
    try {
      await tripService.updateTrip(trip.id, { weather_data: weatherData }, accessToken);
      setTrip({ ...trip, weather_data: weatherData });
    } catch (error) {
      console.error('Error updating weather data:', error);
    }
  };

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Trip not found'}</p>
          <Button onClick={() => navigate('/')} variant="primary">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back, Version Control, and Share buttons */}
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
            Back to Trips
          </Button>

          <div className="flex items-center gap-2">
            <UndoButton tripId={trip.id} onUndo={() => fetchTripData(true)} />
            
            <Button
              onClick={() => setIsVersionHistoryOpen(true)}
              variant="secondary"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              History
            </Button>

            <Button
              onClick={() => setIsShareModalOpen(true)}
              variant="primary"
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share Trip
            </Button>
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
            {trip.is_community && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 rounded-full text-sm font-medium">
                Community
              </span>
            )}
            {!trip.is_public && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                Private
              </span>
            )}
          </div>
        </div>

        {/* Weather Forecast */}
        <div className="mb-6">
          <WeatherForecast 
            tripId={trip.id} 
            weatherData={trip.weather_data}
            onWeatherUpdate={handleWeatherUpdate}
          />
        </div>

        {/* Journey Story Feed */}
        <div className="mb-6">
          <StoryFeed tripId={trip.id} canAdd={true} />
        </div>

        {/* Budget Section */}
        {trip.total_budget && budgetSummary && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Budget Tracking
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <BudgetCard 
                summary={budgetSummary} 
                onExportPDF={handleExportPDF}
                onExportCSV={handleExportCSV}
                onShare={handleShareBudget}
              />
              <CategoryChart categories={categorySpending} currency={trip.currency_code || 'USD'} />
            </div>
            <DailyBudgetRing dailySpending={dailySpending} currency={trip.currency_code || 'USD'} />
          </div>
        )}

        {/* Map View */}
        {allPlaces.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trip Map
              </h2>
              <div className="flex items-center gap-3">
                <OfflineMapsBadge 
                  tripId={trip.id} 
                  onClick={() => setIsOfflineMapsOpen(true)}
                />
                <Button
                  onClick={() => setIsNavigationOpen(true)}
                  variant="secondary"
                  className="text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Navigation
                </Button>
                <Button
                  onClick={() => setIsOfflineMapsOpen(true)}
                  variant="secondary"
                  className="text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Offline Maps
                </Button>
              </div>
            </div>
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapView
                places={allPlaces}
                showRoutes={showRoutes}
                onPlaceClick={(place) => console.log('Place clicked:', place)}
                onRoutesToggle={setShowRoutes}
                tripId={trip.id}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* Day Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <DayEditor trip={trip} days={days} onDaysChange={() => fetchTripData(true)} />
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareToken={trip.share_token}
        tripTitle={trip.title}
      />

      {/* Version History Modal */}
      <VersionHistory
        tripId={trip.id}
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        onRestore={() => fetchTripData(true)}
      />

      {/* Offline Maps Manager Modal */}
      <OfflineMapsManager
        tripId={trip.id}
        tripName={trip.title}
        places={allPlaces}
        isOpen={isOfflineMapsOpen}
        onClose={() => setIsOfflineMapsOpen(false)}
      />

      {/* Navigation Panel Modal */}
      <NavigationPanel
        places={allPlaces}
        isOpen={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
      />
    </div>
  );
}

export default TripDetail;
