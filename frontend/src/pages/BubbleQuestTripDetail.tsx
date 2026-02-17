/**
 * BubbleQuest Trip Detail Page
 * 
 * A bubblequest-styled trip detail page that integrates all completed BubbleQuest components:
 * - CountdownTimer
 * - DateSelector
 * - WeatherWidget
 * - DayCard
 * - ActivityItem
 * - BottomNavigation (mobile)
 * - SideNavigation (desktop)
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trip, TripDayWithPlaces, Place, DailyForecast } from '../types/trip';
import { tripService } from '../services/tripService';
import { dayService } from '../services/dayService';
import { weatherService } from '../services/weatherService';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { useBubbleQuestThemeStore } from '../stores/bubbleQuestThemeStore';
import { useCentralizedThemeStore } from '../stores/centralizedThemeStore';
import { CountdownTimer } from '../components/bubblequest/CountdownTimer';
import { DateSelector } from '../components/bubblequest/DateSelector';
import { DayCard } from '../components/bubblequest/DayCard';
import { BottomNavigation } from '../components/bubblequest/BottomNavigation';
import { SideNavigation } from '../components/bubblequest/SideNavigation';
import { useToast } from '../hooks/useToast';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Spinner } from '../components/common/Spinner';

export function BubbleQuestTripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken, logout } = useEnhancedAuthStore();
  const { success: showSuccess, error: showError } = useToast();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { loadTripTheme, resetToSystemTheme } = useCentralizedThemeStore();
  
  // State
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDayWithPlaces[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weatherData, setWeatherData] = useState<Record<string, DailyForecast>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('schedule');

  // Load trip theme when component mounts
  useEffect(() => {
    if (id) {
      loadTripTheme(id);
    }
    
    // Reset to system theme when component unmounts
    return () => {
      resetToSystemTheme();
    };
  }, [id, loadTripTheme, resetToSystemTheme]);

  // Fetch trip data
  const fetchTripData = async () => {
    if (!id || !accessToken) return;

    try {
      setIsLoading(true);
      
      // Fetch trip and days
      const [tripResponse, daysResponse] = await Promise.all([
        tripService.getTripById(id, accessToken),
        dayService.getDaysByTrip(id),
      ]);
      
      setTrip(tripResponse.data);
      setDays(daysResponse);
      
      // Set initial selected date to first day
      if (daysResponse.length > 0 && daysResponse[0].date) {
        setSelectedDate(new Date(daysResponse[0].date));
      }
      
      // TODO: Fetch weather data for trip
      // Weather integration needs to be completed
      // if (tripResponse.data.id && accessToken) {
      //   try {
      //     const weatherResponse = await weatherService.getWeatherForTrip(
      //       tripResponse.data.id,
      //       accessToken
      //     );
      //     if (weatherResponse.success && weatherResponse.data) {
      //       // Process weather data
      //     }
      //   } catch (err) {
      //     console.error('Failed to fetch weather:', err);
      //   }
      // }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching trip:', err);
      
      if (err.status === 401 || err.message?.includes('Invalid or expired token')) {
        await logout();
        showError('Your session has expired. Please login again.');
        navigate('/login', { replace: true });
        return;
      }
      
      if (err.status === 404) {
        showError('Trip not found');
        navigate('/', { replace: true });
        return;
      }
      
      setError(err.message || 'Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id && accessToken) {
      fetchTripData();
    }
  }, [id, accessToken]);

  // Handle activity click
  const handleActivityClick = (activity: Place) => {
    console.log('Activity clicked:', activity);
    // TODO: Open activity editor modal
  };

  // Handle activity reorder
  const handleActivityReorder = (activityId: string, newIndex: number) => {
    console.log('Reorder activity:', activityId, 'to index:', newIndex);
    // TODO: Implement reordering logic
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Navigate to different sections based on tab
    switch (tab) {
      case 'schedule':
        // Stay on current page (schedule view)
        break;
      case 'booking':
        navigate(`/trip/${id}/booking`);
        break;
      case 'budget':
        // TODO: Navigate to budget screen when implemented
        showError('Budget screen coming soon!');
        break;
      case 'shopping':
        navigate(`/trip/${id}/shopping`);
        break;
      case 'checklist':
        navigate(`/trip/${id}/checklist`);
        break;
      case 'members':
        navigate(`/trip/${id}/members`);
        break;
      case 'settings':
        navigate(`/trip/${id}/settings`);
        break;
      default:
        break;
    }
  };

  // Get dates for date selector
  const tripDates = days.map((day) => new Date(day.date)).filter((date) => !isNaN(date.getTime()));

  // Get selected day
  const selectedDay = selectedDate
    ? days.find((day) => {
        const dayDate = new Date(day.date);
        return (
          dayDate.getFullYear() === selectedDate.getFullYear() &&
          dayDate.getMonth() === selectedDate.getMonth() &&
          dayDate.getDate() === selectedDate.getDate()
        );
      })
    : null;

  // Get weather for selected day
  const selectedDayWeather = selectedDay?.date ? weatherData[selectedDay.date] : undefined;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3eb] dark:bg-bubblequest-neutral-900">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3eb] dark:bg-bubblequest-neutral-900 p-4">
        <div className="text-center">
          <p className="text-xl text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-4">
            {error || 'Trip not found'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-bubblequest-primary-500 text-white rounded-lg hover:bg-bubblequest-primary-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3eb] dark:bg-bubblequest-neutral-900">
      {/* Desktop: Side Navigation */}
      {!isMobile && (
        <SideNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="fixed left-0 top-0 bottom-0 z-40"
        />
      )}

      {/* Main Content */}
      <div className={`${!isMobile ? 'ml-64' : ''} ${isMobile ? 'pb-20' : 'pb-8'}`}>
        {/* Header Section */}
        <div className="bg-gradient-to-br from-bubblequest-primary-100 to-bubblequest-primary-200 dark:from-bubblequest-primary-900/30 dark:to-bubblequest-primary-800/30 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Trip Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-2">
              {trip.name}
            </h1>
            <p className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mb-6">
              {trip.destination}
            </p>

            {/* Countdown Timer */}
            {trip.start_date && (
              <CountdownTimer
                departureDate={new Date(trip.start_date)}
                className="mb-6"
              />
            )}

            {/* Date Selector */}
            {tripDates.length > 0 && (
              <DateSelector
                dates={tripDates}
                selectedDate={selectedDate || tripDates[0]}
                onDateSelect={setSelectedDate}
              />
            )}
          </div>
        </div>

        {/* Day Content */}
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {selectedDay ? (
            <DayCard
              day={selectedDay}
              forecast={selectedDayWeather}
              onActivityClick={handleActivityClick}
              onActivityReorder={handleActivityReorder}
            />
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📅</span>
              <p className="text-xl text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
                No days scheduled yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="fixed bottom-0 left-0 right-0 z-50"
        />
      )}
    </div>
  );
}
