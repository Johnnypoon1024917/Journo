/**
 * ScheduleScreen - Clean implementation with proper styling
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// Types
import { Trip, TripDayWithPlaces, Place, DailyForecast, UpdatePlaceDto } from '@/types/trip';

// Services
import { tripService } from '@/services/tripService';
import { dayService } from '@/services/dayService';
import { placeService } from '@/services/placeService';
import { getWeatherForecast } from '@/services/openMeteoWeatherService';

// Stores
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';
import { useStickerStore } from '@/stores/stickerStore';

// Hooks
import { useToast } from '@/hooks/useToast';

// Components
import { CountdownTimer } from '@/components/kawaii/CountdownTimer';
import { DateSelector } from '@/components/kawaii/DateSelector';
import { WeatherWidget } from '@/components/kawaii/WeatherWidget';
import { DayCard } from '@/components/kawaii/DayCard';
import { AddActivityModal, ActivityFormData } from '@/components/kawaii/AddActivityModal';
import { EditActivityModal } from '@/components/kawaii/EditActivityModal';
import { StickerModal } from '@/components/kawaii/StickerModal';
import { PageLayout, NavigationWrapper } from '@/components/layout';
import type { NavigationTab } from '@/components/layout';

// Icons
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

// Hooks
import { useFABPosition, getFABStyle } from '@/hooks/useFABPosition';
import { useScrollDirection } from '@/hooks/useScrollDirection';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

const ErrorDisplay: React.FC<{ message: string; onRetry?: () => void; onGoHome?: () => void }> = ({
  message,
  onRetry,
  onGoHome,
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">😢</span>
        <p className="text-xl text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ onAddActivity: () => void }> = ({ onAddActivity }) => {
  const { t } = useTranslation('kawaii');
  
  return (
    <div className="text-center py-16">
      <span className="text-8xl mb-6 block">📅</span>
      <h3 className="text-2xl font-semibold text-gray-700 mb-3">
        {t('schedule.noActivities')}
      </h3>
      <p className="text-gray-600 mb-6">
        Start planning your day by adding activities!
      </p>
      <button
        onClick={onAddActivity}
        className="px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all inline-flex items-center gap-2"
      >
        <PlusIcon className="w-5 h-5" />
        {t('schedule.addActivity')}
      </button>
    </div>
  );
};

export const ScheduleScreen: React.FC = () => {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('kawaii');
  const { accessToken, logout } = useEnhancedAuthStore();
  const { showError, showSuccess } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDayWithPlaces[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weatherData, setWeatherData] = useState<Record<string, DailyForecast>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navActiveTab, setNavActiveTab] = useState<NavigationTab>('schedule');
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isEditActivityModalOpen, setIsEditActivityModalOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Place | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  
  // FAB positioning - primary action (add activity) at index 1, secondary (add sticker) at index 2
  const addActivityFABPosition = useFABPosition({ type: 'primary', index: 1, hasBottomNav: true });
  const addStickerFABPosition = useFABPosition({ type: 'secondary', index: 2, hasBottomNav: true });

  // Scroll direction detection for collapsible FABs
  const { isScrollingDown, isAtTop } = useScrollDirection({ threshold: 5 });

  // Debug logging
  useEffect(() => {
    console.log('🔵 FAB state:', { isScrollingDown, isAtTop });
  }, [isScrollingDown, isAtTop]);

  const fetchTripData = async (preserveSelectedDate: boolean = false) => {
    if (!tripId || !accessToken) {
      setError('Missing trip ID or authentication');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [tripResponse, daysData] = await Promise.all([
        tripService.getTripById(tripId, accessToken),
        dayService.getDaysByTrip(tripId),
      ]);

      console.log('🗓️ Trip dates from backend:', {
        start_date: tripResponse.data.start_date,
        end_date: tripResponse.data.end_date,
        title: tripResponse.data.title
      });

      console.log('📅 Days data:', daysData.map(d => ({ day_number: d.day_number, date: d.date })));

      setTrip(tripResponse.data);
      setDays(daysData);

      if (!preserveSelectedDate || !selectedDate) {
        // Check if today falls within the trip period
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const todayDay = daysData.find(day => day.date === todayStr);
        
        if (todayDay) {
          // Today is within the trip period, select it
          setSelectedDate(today);
        } else if (daysData.length > 0 && daysData[0].date) {
          // Today is not in the trip, select the first day
          const [year, month, day] = daysData[0].date.split('-').map(Number);
          const parsedDate = new Date(year, month - 1, day);
          
          if (!isNaN(parsedDate.getTime())) {
            setSelectedDate(parsedDate);
          } else {
            setSelectedDate(new Date());
          }
        } else {
          setSelectedDate(new Date());
        }
      }

      let weatherLoaded = false;
      
      if (tripResponse.data.weather_data?.forecast && tripResponse.data.weather_data.forecast.length > 0) {
        const cachedForecast = tripResponse.data.weather_data.forecast;
        const firstForecastDate = cachedForecast[0].date;
        
        // Convert UTC timestamp to local date string
        const startDate = new Date(tripResponse.data.start_date);
        const tripStartStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        
        if (firstForecastDate === tripStartStr) {
          const weatherMap: Record<string, DailyForecast> = {};
          cachedForecast.forEach((forecast) => {
            weatherMap[forecast.date] = forecast;
          });
          setWeatherData(weatherMap);
          weatherLoaded = true;
        }
      }
      
      if (!weatherLoaded && tripResponse.data.start_date && tripResponse.data.end_date) {
        const location = tripResponse.data.destination || 'Tokyo';
        
        try {
          // Convert UTC timestamps to local dates
          // Backend stores dates as UTC timestamps (e.g., 2026-02-08T16:00:00.000Z = Feb 9 in JST)
          const startDate = new Date(tripResponse.data.start_date);
          const endDate = new Date(tripResponse.data.end_date);
          
          // Format as local date strings (YYYY-MM-DD)
          const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
          const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
          
          console.log('Fetching weather for date range:', startDateStr, 'to', endDateStr);
          const forecasts = await getWeatherForecast(location, startDateStr, endDateStr);
          
          if (forecasts.length > 0) {
            const weatherMap: Record<string, DailyForecast> = {};
            forecasts.forEach((forecast) => {
              weatherMap[forecast.date] = forecast;
            });
            setWeatherData(weatherMap);
          }
        } catch (openMeteoError) {
          console.error('Weather fetch failed:', openMeteoError);
        }
      }
    } catch (err: any) {
      console.error('Error fetching trip data:', err);

      if (err.status === 401 || err.message?.includes('Invalid or expired token')) {
        await logout();
        showError('Session Expired', 'Your session has expired. Please login again.');
        navigate('/login', { replace: true });
        return;
      }

      if (err.status === 404) {
        setError('Trip not found');
        return;
      }

      setError(err.message || 'Failed to load trip data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (tripId && accessToken) {
      fetchTripData();
      useStickerStore.getState().loadStickers(tripId);
      // Note: Individual StickerCanvas components will load their own placements
    }
  }, [tripId, accessToken]);

  const handleActivityClick = (activity: Place) => {
    setSelectedActivity(activity);
    setIsEditActivityModalOpen(true);
  };

  const handleActivitySave = async (activityId: string, updates: Partial<Place>) => {
    try {
      setIsAddingActivity(true);
      
      const updateDto: UpdatePlaceDto = {};
      if (updates.name !== undefined) updateDto.name = updates.name;
      if (updates.address !== undefined && updates.address !== null) updateDto.address = updates.address;
      if (updates.time_start !== undefined && updates.time_start !== null) updateDto.time_start = updates.time_start;
      if (updates.notes !== undefined && updates.notes !== null) updateDto.notes = updates.notes;
      if (updates.place_type !== undefined && updates.place_type !== null) updateDto.place_type = updates.place_type;
      if (updates.cost !== undefined && updates.cost !== null) updateDto.cost = updates.cost;
      if (updates.is_completed !== undefined) updateDto.is_completed = updates.is_completed;
      
      await placeService.updatePlace(activityId, updateDto);
      showSuccess('Success', 'Activity updated successfully');
      setIsEditActivityModalOpen(false);
      setSelectedActivity(null);
      await fetchTripData(true);
    } catch (error) {
      console.error('Error updating activity:', error);
      showError('Error', 'Failed to update activity');
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleActivityReorder = async (activityId: string, newIndex: number) => {
    if (!selectedDay) return;
    
    const oldDays = [...days];
    const updatedDays = days.map(day => {
      if (day.id === selectedDay.id) {
        const updatedPlaces = [...day.places];
        const activityIndex = updatedPlaces.findIndex(p => p.id === activityId);
        
        if (activityIndex !== -1) {
          const [activity] = updatedPlaces.splice(activityIndex, 1);
          updatedPlaces.splice(newIndex, 0, activity);
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
      await placeService.movePlace(activityId, selectedDay.id, newIndex);
    } catch (error) {
      console.error('Error reordering activity:', error);
      showError('Error', 'Failed to reorder activity');
      setDays(oldDays);
    }
  };

  const handleActivityToggle = async (activityId: string, isChecked: boolean) => {
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
      await placeService.updatePlace(activityId, { is_completed: isChecked });
      showSuccess('Success', isChecked ? 'Activity marked as complete!' : 'Activity marked as incomplete');
    } catch (error: any) {
      console.error('Error updating activity completion:', error);
      showError('Error', 'Failed to update activity status');
      setDays(oldDays);
    }
  };

  const handleAddActivity = () => {
    if (!selectedDay) {
      showError('Error', 'Please select a day first');
      return;
    }
    setIsAddActivityModalOpen(true);
  };

  const handleAddSticker = () => {
    if (!selectedDay) {
      showError('Error', 'Please select a day first');
      return;
    }
    setIsStickerModalOpen(true);
  };

  const { attachSticker } = useStickerStore();
  
  const handleStickerSelect = async (stickerId: string) => {
    if (!selectedDay || !tripId) return;

    console.log('🎯 Attaching sticker to day:', {
      stickerId,
      dayId: selectedDay.id,
      dayNumber: selectedDay.day_number,
      dayDate: selectedDay.date,
    });

    try {
      await attachSticker(tripId, stickerId, selectedDay.id, 'day', { x: 50, y: 50 });
      // StickerCanvas will automatically show the new sticker since it's added to the store
      setIsStickerModalOpen(false);
      showSuccess('Success', 'Sticker added successfully!');
    } catch (err: any) {
      console.error('Error attaching sticker:', err);
      showError('Error', err.message || 'Failed to attach sticker');
    }
  };

  const handleActivitySubmit = async (activityData: ActivityFormData) => {
    if (!selectedDay || !accessToken) {
      showError('Error', 'Unable to add activity');
      return;
    }

    try {
      setIsAddingActivity(true);

      await placeService.createPlace({
        trip_day_id: selectedDay.id,
        name: activityData.name,
        address: activityData.address,
        time_start: activityData.time_start,
        notes: activityData.notes,
        place_type: activityData.place_type,
        cost: activityData.cost,
        display_order: selectedDay.places.length,
      });

      await fetchTripData(true);
      setIsAddActivityModalOpen(false);
      showSuccess('Success', 'Activity added successfully!');
    } catch (err: any) {
      console.error('Error adding activity:', err);
      showError('Error', err.message || 'Failed to add activity');
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleWeatherLocationChange = async (newLocation: string) => {
    if (!trip?.start_date || !trip?.end_date || !tripId || !accessToken) return;

    try {
      // Convert UTC timestamps to local dates
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      
      // Format as local date strings (YYYY-MM-DD)
      const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      const forecasts = await getWeatherForecast(newLocation, startDateStr, endDateStr);
      
      if (forecasts.length > 0) {
        const weatherMap: Record<string, DailyForecast> = {};
        forecasts.forEach((forecast) => {
          weatherMap[forecast.date] = forecast;
        });
        setWeatherData(weatherMap);
        
        // Update the trip destination in the database
        await tripService.updateTrip(tripId, { destination: newLocation }, accessToken);
        
        // Update local trip state
        setTrip(prev => prev ? { ...prev, destination: newLocation } : null);
        
        // Show success message
        showSuccess(t('schedule.locationUpdated'), newLocation);
      }
    } catch (error) {
      console.error('Weather error:', error);
      showError(t('schedule.locationUpdateFailed'), t('schedule.tryAgain'));
    }
  };

  const handleNavTabChange = (tab: NavigationTab) => {
    setNavActiveTab(tab);

    switch (tab) {
      case 'booking':
        navigate(`/trips/${tripId}/booking`);
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
    }
  };

  const tripDates = React.useMemo(() => {
    return days
      .filter((day) => day.date !== null)
      .map((day) => {
        const [year, month, dayOfMonth] = day.date!.split('-').map(Number);
        return new Date(year, month - 1, dayOfMonth);
      })
      .filter((date) => !isNaN(date.getTime()));
  }, [days]);

  const selectedDay = React.useMemo(() => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return null;
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const selectedDateStr = `${year}-${month}-${day}`;
    
    return days.find((day) => day.date === selectedDateStr) || null;
  }, [selectedDate, days]);

  const selectedDayWeather = selectedDay?.date ? weatherData[selectedDay.date] : undefined;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !trip) {
    return (
      <ErrorDisplay
        message={error || 'Trip not found'}
        onRetry={error ? () => fetchTripData() : undefined}
        onGoHome={() => navigate('/')}
      />
    );
  }

  return (
    <NavigationWrapper activeTab={navActiveTab} onTabChange={handleNavTabChange}>
      <PageLayout tripId={tripId} showStickers={false}>
        {/* Header Section */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
              {/* Trip Title */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {trip.title}
                </h1>
                {trip.destination && (
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                    📍 {trip.destination}
                  </p>
                )}
              </div>

              {/* Countdown Timer */}
              {trip.start_date && (
                <div className="mb-4 sm:mb-6">
                  <CountdownTimer
                    departureDate={new Date(trip.start_date)}
                    createdDate={trip.created_at ? new Date(trip.created_at) : undefined}
                  />
                </div>
              )}

              {/* Date Selector */}
              {tripDates.length > 0 && (
                <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0">
                  <DateSelector
                    dates={tripDates}
                    selectedDate={selectedDate || tripDates[0]}
                    onDateSelect={setSelectedDate}
                  />
                </div>
              )}

              {/* Weather Widget */}
              <div>
                <WeatherWidget
                  forecast={selectedDayWeather}
                  location={trip.destination || '大阪'}
                  onLocationChange={handleWeatherLocationChange}
                />
              </div>
            </div>
          </div>

          {/* Day Content Section */}
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {selectedDay ? (
              <DayCard
                day={selectedDay}
                tripId={tripId!}
                onActivityClick={handleActivityClick}
                onActivityReorder={handleActivityReorder}
                onActivityToggle={handleActivityToggle}
                enableStickers={true}
              />
            ) : (
              <EmptyState onAddActivity={handleAddActivity} />
            )}
          </div>

        {/* Floating Action Buttons */}
        {selectedDay && (
          <>
            <motion.button
              onClick={handleAddActivity}
              style={getFABStyle(addActivityFABPosition)}
              className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all text-white"
              aria-label={t('schedule.addActivity')}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ 
                scale: isScrollingDown ? 0 : 1,
                opacity: isScrollingDown ? 0 : 1,
              }}
              transition={{ 
                duration: 0.2,
                ease: 'easeInOut'
              }}
            >
              <PlusIcon className="w-6 h-6" />
            </motion.button>

            <motion.button
              onClick={handleAddSticker}
              style={getFABStyle(addStickerFABPosition)}
              className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all text-white"
              aria-label={t('stickers.attach')}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ 
                scale: isScrollingDown ? 0 : 1,
                opacity: isScrollingDown ? 0 : 1,
              }}
              transition={{ 
                duration: 0.2,
                ease: 'easeInOut'
              }}
            >
              <SparklesIcon className="w-6 h-6" />
            </motion.button>
          </>
        )}
      </PageLayout>

      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        onSubmit={handleActivitySubmit}
        isLoading={isAddingActivity}
      />

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

      <StickerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        onSelect={handleStickerSelect}
        tripId={tripId || ''}
      />
    </NavigationWrapper>
  );
};

export default ScheduleScreen;
