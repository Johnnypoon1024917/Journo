/**
 * Kawaii ScheduleScreen Page Component
 * 
 * Main schedule screen that integrates all kawaii components for trip schedule management.
 * 
 * Features:
 * - CountdownTimer showing time until departure
 * - DateSelector for navigating between trip days
 * - WeatherWidget displaying weather for each day
 * - DayCard showing all day information at-a-glance
 * - FAB for adding new activities
 * - Activity add/edit/delete functionality
 * - Connection to existing backend APIs
 * - Responsive design with bottom/side navigation
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// Types
import { Trip, TripDayWithPlaces, Place, DailyForecast, UpdatePlaceDto } from '@/types/trip';

// Services
import { tripService } from '@/services/tripService';
import { dayService } from '@/services/dayService';
import { placeService } from '@/services/placeService';
import { getWeatherForecast } from '@/services/openMeteoWeatherService';

// Stores
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';

// Hooks
import { useToast } from '@/hooks/useToast';

// Components
import { CountdownTimer } from '@/components/kawaii/CountdownTimer';
import { DateSelector } from '@/components/kawaii/DateSelector';
import { WeatherWidget } from '@/components/kawaii/WeatherWidget';
import { DayCard } from '@/components/kawaii/DayCard';
import { ResponsiveLayout } from '@/components/kawaii/ResponsiveLayout';
import { AddActivityModal, ActivityFormData } from '@/components/kawaii/AddActivityModal';
import { EditActivityModal } from '@/components/kawaii/EditActivityModal';
import { StickerModal } from '@/components/kawaii/StickerModal';

// Stores
import { useStickerStore } from '@/stores/stickerStore';

// Icons
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900">
    <motion.div
      className="w-16 h-16 border-4 border-kawaii-primary-200 border-t-kawaii-primary-600 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

/**
 * Error display component
 */
const ErrorDisplay: React.FC<{ message: string; onRetry?: () => void; onGoHome?: () => void }> = ({
  message,
  onRetry,
  onGoHome,
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900 p-4">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">😢</span>
        <p className="text-xl text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-kawaii-primary-500 text-white rounded-lg hover:bg-kawaii-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="px-6 py-2 bg-kawaii-neutral-200 dark:bg-kawaii-neutral-700 text-kawaii-neutral-700 dark:text-kawaii-neutral-300 rounded-lg hover:bg-kawaii-neutral-300 dark:hover:bg-kawaii-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-kawaii-neutral-500 focus:ring-offset-2"
            >
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty state component
 */
const EmptyState: React.FC<{ onAddActivity: () => void }> = ({ onAddActivity }) => {
  const { t } = useTranslation('kawaii');
  
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="text-8xl mb-6 block">📅</span>
      <h3 className="text-2xl font-semibold text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-3">
        {t('schedule.noActivities')}
      </h3>
      <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-6">
        Start planning your day by adding activities!
      </p>
      <button
        onClick={onAddActivity}
        className="px-6 py-3 bg-gradient-to-br from-kawaii-primary-500 to-kawaii-primary-600 text-white rounded-xl hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:ring-offset-2"
      >
        <PlusIcon className="w-5 h-5 inline-block mr-2" />
        {t('schedule.addActivity')}
      </button>
    </motion.div>
  );
};

/**
 * Main ScheduleScreen component
 */
export const ScheduleScreen: React.FC = () => {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('kawaii');
  const { accessToken, logout } = useEnhancedAuthStore();
  const { showError, showSuccess } = useToast();

  // State
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDayWithPlaces[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weatherData, setWeatherData] = useState<Record<string, DailyForecast>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isEditActivityModalOpen, setIsEditActivityModalOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Place | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  /**
   * Fetch trip data including days and weather
   */
  const fetchTripData = async (preserveSelectedDate: boolean = false) => {
    if (!tripId || !accessToken) {
      setError('Missing trip ID or authentication');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch trip and days in parallel
      const [tripResponse, daysData] = await Promise.all([
        tripService.getTripById(tripId, accessToken),
        dayService.getDaysByTrip(tripId),
      ]);

      setTrip(tripResponse.data);
      setDays(daysData);

      // Only set initial selected date if not preserving current selection
      if (!preserveSelectedDate || !selectedDate) {
        // Set initial selected date to first day
        if (daysData.length > 0 && daysData[0].date) {
          // Parse date string (YYYY-MM-DD) as local date
          const [year, month, day] = daysData[0].date.split('-').map(Number);
          const parsedDate = new Date(year, month - 1, day);
          
          if (!isNaN(parsedDate.getTime())) {
            console.log('Setting selectedDate to first day:', parsedDate.toLocaleDateString());
            setSelectedDate(parsedDate);
          } else {
            console.error('Invalid date from first day:', daysData[0].date);
            setSelectedDate(new Date());
          }
        } else {
          console.log('No days available, using today');
          setSelectedDate(new Date());
        }
      } else {
        console.log('Preserving current selectedDate:', selectedDate.toLocaleDateString());
      }

      // Fetch weather data
      let weatherLoaded = false;
      
      console.log('=== WEATHER FETCH START ===');
      console.log('Trip data:', {
        hasWeatherData: !!tripResponse.data.weather_data,
        hasForecast: !!tripResponse.data.weather_data?.forecast,
        forecastLength: tripResponse.data.weather_data?.forecast?.length || 0,
        startDate: tripResponse.data.start_date,
        endDate: tripResponse.data.end_date,
        destination: tripResponse.data.destination,
      });
      
      // Parse dates correctly (handle timezone)
      const tripStartDate = tripResponse.data.start_date ? new Date(tripResponse.data.start_date) : null;
      const tripEndDate = tripResponse.data.end_date ? new Date(tripResponse.data.end_date) : null;
      
      console.log('Parsed trip dates:', {
        startDate: tripStartDate?.toISOString(),
        startDateLocal: tripStartDate?.toLocaleDateString(),
        endDate: tripEndDate?.toISOString(),
        endDateLocal: tripEndDate?.toLocaleDateString(),
      });
      
      // First, check if trip has cached weather_data and if it matches the trip dates
      if (tripResponse.data.weather_data?.forecast && tripResponse.data.weather_data.forecast.length > 0) {
        console.log('Found cached weather data');
        const cachedForecast = tripResponse.data.weather_data.forecast;
        const firstForecastDate = cachedForecast[0].date;
        const lastForecastDate = cachedForecast[cachedForecast.length - 1].date;
        
        console.log('Cached weather date range:', {
          first: firstForecastDate,
          last: lastForecastDate,
          count: cachedForecast.length,
        });
        
        // Check if cached weather matches trip dates
        const tripStartStr = tripStartDate?.toISOString().split('T')[0];
        
        const cacheMatchesTrip = firstForecastDate === tripStartStr || 
                                 (firstForecastDate <= tripStartStr! && lastForecastDate >= tripStartStr!);
        
        if (cacheMatchesTrip) {
          console.log('Cached weather matches trip dates, using cache');
          const weatherMap: Record<string, DailyForecast> = {};
          cachedForecast.forEach((forecast) => {
            weatherMap[forecast.date] = forecast;
          });
          setWeatherData(weatherMap);
          weatherLoaded = true;
          console.log('Weather loaded from cache:', Object.keys(weatherMap).length, 'days');
        } else {
          console.warn('Cached weather dates do not match trip dates, will fetch fresh data');
        }
      }
      
      // If no cached weather or cache doesn't match, fetch from Open-Meteo
      if (!weatherLoaded && tripStartDate && tripEndDate) {
        const location = tripResponse.data.destination || 'Tokyo'; // Default to Tokyo if no destination
        console.log('Attempting to fetch weather from Open-Meteo for:', location);
        console.log('Date range:', tripStartDate.toISOString().split('T')[0], 'to', tripEndDate.toISOString().split('T')[0]);
        
        try {
          const forecasts = await getWeatherForecast(
            location,
            tripStartDate,
            tripEndDate
          );
          
          console.log('Open-Meteo returned', forecasts.length, 'forecasts');
          
          if (forecasts.length > 0) {
            const weatherMap: Record<string, DailyForecast> = {};
            forecasts.forEach((forecast) => {
              weatherMap[forecast.date] = forecast;
            });
            setWeatherData(weatherMap);
            weatherLoaded = true;
            console.log('Weather data loaded from Open-Meteo:', Object.keys(weatherMap).length, 'days');
            console.log('Sample forecast:', forecasts[0]);
          } else {
            console.warn('Open-Meteo returned empty forecast array');
          }
        } catch (openMeteoError) {
          console.error('Open-Meteo weather fetch failed:', openMeteoError);
        }
      }
      
      if (!weatherLoaded) {
        console.warn('No weather data could be loaded - will show empty weather widget');
      }
      
      console.log('=== WEATHER FETCH END ===');
    } catch (err: any) {
      console.error('Error fetching trip data:', err);

      // Handle authentication errors
      if (err.status === 401 || err.message?.includes('Invalid or expired token')) {
        await logout();
        showError('Session Expired', 'Your session has expired. Please login again.');
        navigate('/login', { replace: true });
        return;
      }

      // Handle not found errors
      if (err.status === 404) {
        setError('Trip not found');
        return;
      }

      setError(err.message || 'Failed to load trip data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when tripId changes
  useEffect(() => {
    console.log('ScheduleScreen: useEffect triggered - tripId:', tripId, 'accessToken:', !!accessToken);
    if (tripId && accessToken) {
      console.log('ScheduleScreen: Calling fetchTripData()');
      fetchTripData();
      
      // Load stickers for this trip
      console.log('ScheduleScreen: Loading stickers for trip');
      useStickerStore.getState().loadStickers(tripId);
      useStickerStore.getState().loadPlacements(tripId);
    } else {
      console.log('ScheduleScreen: Missing tripId or accessToken, skipping fetch');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, accessToken]);

  /**
   * Handle activity click - open edit modal
   */
  const handleActivityClick = (activity: Place) => {
    console.log('Activity clicked:', activity);
    setSelectedActivity(activity);
    setIsEditActivityModalOpen(true);
  };

  /**
   * Handle activity edit save
   */
  const handleActivitySave = async (activityId: string, updates: Partial<Place>) => {
    try {
      setIsAddingActivity(true);
      
      // Convert Partial<Place> to UpdatePlaceDto by filtering out null values
      const updateDto: UpdatePlaceDto = {};
      
      if (updates.name !== undefined) updateDto.name = updates.name;
      if (updates.address !== undefined && updates.address !== null) updateDto.address = updates.address;
      if (updates.lat !== undefined && updates.lat !== null) updateDto.lat = updates.lat;
      if (updates.lng !== undefined && updates.lng !== null) updateDto.lng = updates.lng;
      if (updates.time_start !== undefined && updates.time_start !== null) updateDto.time_start = updates.time_start;
      if (updates.time_end !== undefined && updates.time_end !== null) updateDto.time_end = updates.time_end;
      if (updates.notes !== undefined && updates.notes !== null) updateDto.notes = updates.notes;
      if (updates.image_url !== undefined && updates.image_url !== null) updateDto.image_url = updates.image_url;
      if (updates.place_type !== undefined && updates.place_type !== null) updateDto.place_type = updates.place_type;
      if (updates.sticker !== undefined && updates.sticker !== null) updateDto.sticker = updates.sticker;
      if (updates.cost !== undefined && updates.cost !== null) updateDto.cost = updates.cost;
      if (updates.cost_currency !== undefined && updates.cost_currency !== null) updateDto.cost_currency = updates.cost_currency;
      if (updates.budget_category !== undefined && updates.budget_category !== null) updateDto.budget_category = updates.budget_category;
      if (updates.transport_mode !== undefined && updates.transport_mode !== null) updateDto.transport_mode = updates.transport_mode;
      if (updates.travel_time_seconds !== undefined && updates.travel_time_seconds !== null) updateDto.travel_time_seconds = updates.travel_time_seconds;
      if (updates.travel_distance_meters !== undefined && updates.travel_distance_meters !== null) updateDto.travel_distance_meters = updates.travel_distance_meters;
      if (updates.travel_time_text !== undefined && updates.travel_time_text !== null) updateDto.travel_time_text = updates.travel_time_text;
      if (updates.travel_distance_text !== undefined && updates.travel_distance_text !== null) updateDto.travel_distance_text = updates.travel_distance_text;
      if (updates.calculated_arrival_time !== undefined && updates.calculated_arrival_time !== null) updateDto.calculated_arrival_time = updates.calculated_arrival_time;
      if (updates.is_completed !== undefined) updateDto.is_completed = updates.is_completed;
      
      await placeService.updatePlace(activityId, updateDto);
      showSuccess('Success', 'Activity updated successfully');
      setIsEditActivityModalOpen(false);
      setSelectedActivity(null);
      // Refresh data, preserving the selected date
      await fetchTripData(true);
    } catch (error) {
      console.error('Error updating activity:', error);
      showError('Error', 'Failed to update activity');
    } finally {
      setIsAddingActivity(false);
    }
  };

  /**
   * Handle activity reorder with optimistic updates
   */
  const handleActivityReorder = async (activityId: string, newIndex: number) => {
    if (!selectedDay) return;
    
    console.log('Reorder activity:', activityId, 'to index:', newIndex);
    
    // Optimistic update - update local state immediately
    const oldDays = [...days];
    const updatedDays = days.map(day => {
      if (day.id === selectedDay.id) {
        const updatedPlaces = [...day.places];
        const activityIndex = updatedPlaces.findIndex(p => p.id === activityId);
        
        if (activityIndex !== -1) {
          // Remove activity from old position
          const [activity] = updatedPlaces.splice(activityIndex, 1);
          // Insert at new position
          updatedPlaces.splice(newIndex, 0, activity);
          // Update display_order for all activities
          updatedPlaces.forEach((place, idx) => {
            place.display_order = idx;
          });
        }
        
        return { ...day, places: updatedPlaces };
      }
      return day;
    });
    
    setDays(updatedDays);
    
    try {
      // Call the movePlace API to update display_order on server
      await placeService.movePlace(activityId, selectedDay.id, newIndex);
      console.log('Activity reordered successfully');
    } catch (error) {
      console.error('Error reordering activity:', error);
      showError('Error', 'Failed to reorder activity');
      // Revert to old state on error
      setDays(oldDays);
    }
  };

  /**
   * Handle activity toggle (checkbox) with database persistence
   */
  const handleActivityToggle = async (activityId: string, isChecked: boolean) => {
    console.log('🔲 Checkbox toggle requested:', { activityId, isChecked });
    
    // Optimistic update
    const oldDays = [...days];
    const updatedDays = days.map(day => ({
      ...day,
      places: day.places.map(place => 
        place.id === activityId 
          ? { ...place, is_completed: isChecked }
          : place
      )
    }));
    setDays(updatedDays);
    
    try {
      // Save to database
      console.log('📡 Calling API to update place...');
      const result = await placeService.updatePlace(activityId, { is_completed: isChecked });
      console.log('✅ Activity completion status saved:', result);
      showSuccess('Success', isChecked ? 'Activity marked as complete!' : 'Activity marked as incomplete');
    } catch (error: any) {
      console.error('❌ Error updating activity completion:', error);
      
      // Show specific error message
      if (error.status === 404) {
        showError('Not Found', 'Activity not found. Please refresh the page.');
      } else if (error.status === 401 || error.status === 403) {
        showError('Permission Denied', 'You don\'t have permission to update this activity.');
      } else {
        showError('Error', 'Failed to update activity status. Please try again.');
      }
      
      // Revert on error
      setDays(oldDays);
    }
  };

  /**
   * Handle add activity FAB click
   */
  const handleAddActivity = () => {
    if (!selectedDay) {
      showError('Error', 'Please select a day first');
      return;
    }
    
    console.log('Opening add activity modal for day:', selectedDay.id);
    setIsAddActivityModalOpen(true);
  };

  /**
   * Handle add sticker button click
   */
  const handleAddSticker = () => {
    if (!selectedDay) {
      showError('Error', 'Please select a day first');
      return;
    }
    
    console.log('✨ Opening sticker modal for day:', selectedDay.id);
    setIsStickerModalOpen(true);
  };

  /**
   * Handle sticker selection
   */
  const { attachSticker, loadPlacements } = useStickerStore();
  
  const handleStickerSelect = async (stickerId: string) => {
    if (!selectedDay || !tripId) return;

    try {
      console.log('📌 Attaching sticker to day:', { stickerId, dayId: selectedDay.id, tripId });
      
      await attachSticker(tripId, stickerId, selectedDay.id, 'day', { x: 50, y: 50 });
      
      // Reload placements to show the new sticker without full page refresh
      await loadPlacements(tripId);
      
      setIsStickerModalOpen(false);
      showSuccess('Success', 'Sticker added successfully!');
    } catch (err: any) {
      console.error('Error attaching sticker:', err);
      showError('Error', err.message || 'Failed to attach sticker');
    }
  };

  /**
   * Handle activity form submission
   */
  const handleActivitySubmit = async (activityData: ActivityFormData) => {
    if (!selectedDay || !accessToken) {
      showError('Error', 'Unable to add activity');
      return;
    }

    // Don't allow adding to days that don't exist in database
    if (!days.find(d => d.id === selectedDay.id)) {
      showError('Error', 'Please select a valid day');
      return;
    }

    try {
      setIsAddingActivity(true);
      console.log('Creating activity:', activityData, 'for day:', selectedDay.id);

      // Create the place - day already exists in database
      const newPlace = await placeService.createPlace({
        trip_day_id: selectedDay.id,
        name: activityData.name,
        address: activityData.address,
        time_start: activityData.time_start,
        notes: activityData.notes,
        place_type: activityData.place_type,
        cost: activityData.cost,
        display_order: selectedDay.places.length, // Add at the end
      });

      console.log('Activity created successfully:', newPlace);

      // Refresh trip data to show the new activity, but preserve the selected date
      await fetchTripData(true);

      // Close modal and show success message
      setIsAddActivityModalOpen(false);
      showSuccess('Success', 'Activity added successfully!');
    } catch (err: any) {
      console.error('Error adding activity:', err);
      showError('Error', err.message || 'Failed to add activity');
    } finally {
      setIsAddingActivity(false);
    }
  };

  /**
   * Handle weather location change
   */
  const handleWeatherLocationChange = async (newLocation: string) => {
    if (!trip?.start_date || !trip?.end_date) {
      showError('Error', 'Trip dates are required to fetch weather');
      return;
    }

    try {
      console.log('Fetching weather for new location:', newLocation);
      
      const forecasts = await getWeatherForecast(
        newLocation,
        new Date(trip.start_date),
        new Date(trip.end_date)
      );
      
      if (forecasts.length > 0) {
        const weatherMap: Record<string, DailyForecast> = {};
        forecasts.forEach((forecast) => {
          weatherMap[forecast.date] = forecast;
        });
        setWeatherData(weatherMap);
        console.log('Weather data updated for:', newLocation);
        
        // TODO: Update trip destination in backend
        // await tripService.updateTrip(tripId, { destination: newLocation }, accessToken);
      } else {
        showError('Error', 'Could not fetch weather for this location');
      }
    } catch (error) {
      console.error('Weather location change error:', error);
      showError('Error', 'Failed to fetch weather data');
    }
  };

  /**
   * Handle tab change in navigation
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Navigate to different sections based on tab
    switch (tab) {
      case 'schedule':
        // Already on schedule
        break;
      case 'booking':
        navigate(`/trips/${tripId}/booking`);
        break;
      case 'budget':
        navigate(`/trips/${tripId}/budget`);
        break;
      case 'shopping':
        navigate(`/trips/${tripId}/shopping`);
        break;
      case 'checklist':
        navigate(`/trips/${tripId}/checklist`);
        break;
      case 'members':
        navigate(`/trips/${tripId}/members`);
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  // Get dates for date selector - use dates from days
  const tripDates = React.useMemo(() => {
    // Get dates from days that exist in database
    const datesFromDays = days
      .filter((day) => day.date !== null)
      .map((day) => {
        // Parse date string (YYYY-MM-DD) as local date
        const [year, month, dayOfMonth] = day.date!.split('-').map(Number);
        return new Date(year, month - 1, dayOfMonth);
      })
      .filter((date) => !isNaN(date.getTime()));
    
    return datesFromDays;
  }, [days]);

  // Get selectedDay - find matching day from database
  const selectedDay = React.useMemo(() => {
    if (!selectedDate) return null;
    
    // Validate selectedDate
    if (isNaN(selectedDate.getTime())) {
      console.error('Invalid selectedDate in selectedDay computation');
      return null;
    }
    
    // Convert selectedDate to local date string (YYYY-MM-DD)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const selectedDateStr = `${year}-${month}-${day}`;
    
    console.log('selectedDay lookup:', {
      selectedDate: selectedDate.toLocaleDateString(),
      selectedDateStr,
      daysCount: days.length,
    });
    
    // Find existing day by comparing date strings
    const existingDay = days.find((day) => {
      if (!day.date) return false;
      return day.date === selectedDateStr;
    });
    
    if (existingDay) {
      console.log('Found existing day:', existingDay.id, existingDay.date);
      return existingDay;
    }
    
    console.log('No day found for date:', selectedDateStr);
    return null;
  }, [selectedDate, days]);

  // Get weather for selected day
  const selectedDayWeather = selectedDay?.date ? weatherData[selectedDay.date] : undefined;

  // Debug weather matching
  useEffect(() => {
    if (selectedDay?.date) {
      console.log('Weather lookup:', {
        selectedDayDate: selectedDay.date,
        hasWeatherForDate: !!weatherData[selectedDay.date],
        weatherDataKeys: Object.keys(weatherData),
        weatherSample: weatherData[selectedDay.date],
      });
    }
  }, [selectedDay, weatherData]);

  // Debug date selection
  useEffect(() => {
    console.log('Date selection debug:', {
      selectedDate: selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString() : 'Invalid Date',
      selectedDateLocal: selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toLocaleDateString() : 'Invalid Date',
      selectedDay: selectedDay?.id,
      selectedDayDate: selectedDay?.date,
      selectedDayNumber: selectedDay?.day_number,
      tripDatesCount: tripDates.length,
      firstTripDate: tripDates[0] && !isNaN(tripDates[0].getTime()) ? tripDates[0].toISOString() : 'Invalid Date',
    });
  }, [selectedDate, selectedDay, tripDates]);

  // Debug logging
  useEffect(() => {
    console.log('ScheduleScreen state:', {
      trip: trip?.title,
      daysCount: days.length,
      tripDatesCount: tripDates.length,
      selectedDate: selectedDate?.toISOString().split('T')[0],
      selectedDay: selectedDay?.id,
      selectedDayDate: selectedDay?.date,
      selectedDayNumber: selectedDay?.day_number,
      weatherDataKeys: Object.keys(weatherData),
      selectedDayWeather: selectedDayWeather ? 'present' : 'missing',
      isLoading,
      error,
    });
  }, [trip, days, tripDates, selectedDate, selectedDay, weatherData, selectedDayWeather, isLoading, error]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error || !trip) {
    return (
      <ErrorDisplay
        message={error || 'Trip not found'}
        onRetry={error ? fetchTripData : undefined}
        onGoHome={() => navigate('/')}
      />
    );
  }

  return (
    <ResponsiveLayout
      showNavigation={true}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      contentClassName="!p-0"
    >
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-br from-kawaii-primary-100 to-kawaii-primary-200 dark:from-kawaii-primary-900/30 dark:to-kawaii-primary-800/30 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Trip Title and Destination */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-2">
              {trip.title}
            </h1>
            {trip.destination && (
              <p className="text-lg text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-6">
                📍 {trip.destination}
              </p>
            )}
          </motion.div>

          {/* Countdown Timer */}
          {trip.start_date && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <CountdownTimer
                departureDate={new Date(trip.start_date)}
                createdDate={trip.created_at ? new Date(trip.created_at) : undefined}
                className="mb-6"
              />
            </motion.div>
          )}

          {/* Date Selector */}
          {tripDates.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DateSelector
                dates={tripDates}
                selectedDate={selectedDate || tripDates[0]}
                onDateSelect={setSelectedDate}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center py-4"
            >
              <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                {t('schedule.noDates')}
              </p>
            </motion.div>
          )}

          {/* Weather Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            <WeatherWidget
              forecast={selectedDayWeather}
              location={trip.destination || '大阪'}
              onLocationChange={handleWeatherLocationChange}
            />
          </motion.div>
        </div>
      </div>

      {/* Day Content Section */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {selectedDay ? (
            <motion.div
              key={selectedDay.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DayCard
                day={selectedDay}
                tripId={tripId!}
                onActivityClick={handleActivityClick}
                onActivityReorder={handleActivityReorder}
                onActivityToggle={handleActivityToggle}
                enableStickers={true}
              />
            </motion.div>
          ) : (
            <EmptyState onAddActivity={handleAddActivity} />
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Action Buttons */}
      {selectedDay && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col gap-4">
          {/* Add Activity Button */}
          <motion.button
            onClick={handleAddActivity}
            className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0 }}
            aria-label={t('schedule.addActivity')}
          >
            <PlusIcon className="w-6 h-6" />
          </motion.button>

          {/* Add Sticker Button */}
          <motion.button
            onClick={handleAddSticker}
            className="w-14 h-14 bg-gradient-to-br from-kawaii-purple-500 to-romantic-500 hover:from-kawaii-purple-600 hover:to-romantic-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            aria-label={t('stickers.attach')}
          >
            <SparklesIcon className="w-6 h-6" />
          </motion.button>
        </div>
      )}

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        onSubmit={handleActivitySubmit}
        isLoading={isAddingActivity}
      />

      {/* Edit Activity Modal */}
      <EditActivityModal
        isOpen={isEditActivityModalOpen}
        onClose={() => {
          setIsEditActivityModalOpen(false);
          setSelectedActivity(null);
        }}
        onSave={handleActivitySave}
        activity={selectedActivity}
        isLoading={isAddingActivity}
      />

      {/* Sticker Modal */}
      <StickerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        onSelect={handleStickerSelect}
        tripId={tripId || ''}
      />
    </ResponsiveLayout>
  );
};

export default ScheduleScreen;
