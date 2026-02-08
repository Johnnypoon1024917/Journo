import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TripDayWithPlaces, Place } from '../types/trip';
import { tripService } from '../services/tripService';
import { dayService } from '../services/dayService';
import { placeService } from '../services/placeService';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { useTripPlannerStore } from '../stores/tripPlannerStore';
import { useFeatureFlag } from '../stores/featureFlagStore';
import { TripPlannerLayout } from '../components/trip/TripPlannerLayout';
import { MapPanel } from '../components/trip/MapPanel';
import { PlaceEditorModal } from '../components/trip/PlaceEditorModal';
import { EnhancedItineraryView } from '../components/trip/EnhancedItineraryView';
import { TripSidebar } from '../components/trip/TripSidebar';
import { TripHeader } from '../components/trip/TripHeader';

import { useRouteIntegration } from '../hooks/useRouteIntegration';
import { routeCalculationService } from '../services/routeCalculationService';
import { NotificationProvider } from '../hooks/useToastNotifications';
import { Spinner } from '../components/common/Spinner';
import { FeatureFlagBanner } from '../components/common/FeatureFlagBanner';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ShareModal } from '../components/sharing/ShareModal';
import { PackingList } from '../components/packing/PackingList';
import { BudgetCard } from '../components/budget/BudgetCard';
import { budgetService, BudgetSummary } from '../services/budgetService';
import { budgetExportService } from '../services/budgetExportService';
import { packingService } from '../services/packingService';
import { PackingListProgress } from '../types/packing';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { CollaboratorManager } from '../components/trip/CollaboratorManager';

export function TripPlanner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken, logout } = useEnhancedAuthStore();
  const isNewUIEnabled = useFeatureFlag('newTripPlannerUI');
  
  const {
    trip,
    setTrip,
    setDays,
    setPlaces,
    selectPlace,
    ui,
  } = useTripPlannerStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysWithPlaces, setDaysWithPlaces] = useState<TripDayWithPlaces[]>([]);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [addingPlaceDayId, setAddingPlaceDayId] = useState<string | null>(null);
  
  // Feature integration states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPackingListOpen, setIsPackingListOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [packingProgress, setPackingProgress] = useState<PackingListProgress | null>(null);
  const [activeItineraryTab, setActiveItineraryTab] = useState<'overview' | number>('overview');
  
  const { success: showSuccess, error: showError } = useToast();

  // Fetch trip data
  const fetchTripData = async () => {
    if (!id || !accessToken) return;

    try {
      setIsLoading(true);
      
      // First, try to get the trip to see if it exists
      const tripResponse = await tripService.getTripById(id, accessToken);
      setTrip(tripResponse.data);

      // If trip exists, get the days
      const daysResponse = await dayService.getDaysByTrip(id);
      setDays(daysResponse);
      setDaysWithPlaces(daysResponse);

      // Flatten all places into store
      const allPlaces = daysResponse.flatMap((day) => day.places || []);
      setPlaces(allPlaces);

      setError(null);
      
      // Calculate budget summary if trip has budget
      if (tripResponse.data.total_budget) {
        const places = daysResponse.flatMap((day) => day.places || []);
        const summary = await budgetService.calculateBudgetSummary(tripResponse.data, places);
        setBudgetSummary(summary);
      }
      
      // Load packing progress
      try {
        const progress = await packingService.getPackingProgress(id);
        setPackingProgress(progress);
      } catch (err) {
        // Silently handle packing progress errors
      }
    } catch (err: any) {
      // Handle 404 - trip not found (possibly deleted) - redirect immediately without logging
      if (err.status === 404 || err.message?.includes('Trip not found')) {
        showError('Trip not found. It may have been deleted.');
        navigate('/', { replace: true });
        return;
      }

      // Log other errors
      console.error('Error fetching trip:', err);

      if (err.status === 401 || err.message?.includes('Invalid or expired token')) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      setError(err.message || 'Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch trip data if we have the required parameters
    if (id && accessToken) {
      fetchTripData();
    }
  }, [id, accessToken]);

  // Handle adding a new day
  const handleAddDay = async () => {
    if (!trip || !accessToken) {
      console.error('TripPlanner - Cannot add day: missing trip or access token', { trip: !!trip, accessToken: !!accessToken });
      return;
    }

    console.log('TripPlanner - handleAddDay called', {
      tripId: trip.id,
      currentDaysCount: daysWithPlaces.length
    });

    try {
      const newDayNumber = daysWithPlaces.length + 1;
      
      console.log('TripPlanner - Creating day with:', {
        trip_id: trip.id,
        day_number: newDayNumber,
      });
      
      const newDay = await dayService.createDay({
        trip_id: trip.id,
        day_number: newDayNumber,
      });

      console.log('TripPlanner - Day created successfully:', newDay);

      const updatedDays = [...daysWithPlaces, { ...newDay, places: [] }];
      setDaysWithPlaces(updatedDays);
      setDays(updatedDays);
      
      showSuccess('Day added successfully!');
    } catch (error) {
      console.error('TripPlanner - Error adding day:', error);
      showError('Failed to add day');
    }
  };

  // Handle adding a new place - open modal instead of creating immediately
  const handleAddPlace = (dayId: string, _type?: string) => {
    setAddingPlaceDayId(dayId);
    setIsEditorOpen(true);
    setEditingPlace(null); // null means we're creating a new place
  };

  // Handle creating a new place
  const handlePlaceCreate = async (dayId: string, placeData: any) => {
    if (!accessToken) {
      console.error('TripPlanner - No access token available');
      return;
    }

    try {
      const createData = {
        trip_day_id: dayId,
        ...placeData,
      };
      
      await placeService.createPlace(createData);
      
      // Refresh data
      await fetchTripData();
    } catch (error) {
      console.error('Error creating place:', error);
      throw error;
    }
  };

  // Handle place selection
  const handlePlaceSelect = (placeId: string | null) => {
    selectPlace(placeId);
  };

  // Handle place edit
  const handlePlaceEdit = (placeId: string) => {
    const place = allPlaces.find((p) => p.id === placeId);
    if (place) {
      setEditingPlace(place);
      setIsEditorOpen(true);
    }
  };

  // Handle place save
  const handlePlaceSave = async (placeId: string, updates: Partial<Place>) => {
    if (!accessToken) return;

    // Filter out null values and convert to UpdatePlaceDto format
    const updateDto: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        updateDto[key] = value;
      }
    });

    await placeService.updatePlace(placeId, updateDto);
    await fetchTripData();
  };

  // Handle place move across days
  const handlePlaceMove = async (
    placeId: string,
    fromDayId: string,
    toDayId: string,
    newIndex: number
  ) => {
    if (!accessToken) return;

    console.log('TripPlanner - handlePlaceMove called:', {
      placeId,
      fromDayId,
      toDayId,
      newIndex,
    });

    // Optimistic update - update UI immediately
    const updatedDays = [...daysWithPlaces];
    
    // Find and remove place from source day
    let movedPlace: Place | null = null;
    const fromDayIndex = updatedDays.findIndex(d => d.id === fromDayId);
    if (fromDayIndex !== -1) {
      const placeIndex = updatedDays[fromDayIndex].places.findIndex(p => p.id === placeId);
      if (placeIndex !== -1) {
        movedPlace = updatedDays[fromDayIndex].places[placeIndex];
        updatedDays[fromDayIndex].places.splice(placeIndex, 1);
      }
    }
    
    // Add place to target day at new index
    if (movedPlace) {
      const toDayIndex = updatedDays.findIndex(d => d.id === toDayId);
      if (toDayIndex !== -1) {
        // Update place's trip_day_id for optimistic update
        const updatedPlace = { ...movedPlace, trip_day_id: toDayId };
        updatedDays[toDayIndex].places.splice(newIndex, 0, updatedPlace);
      }
    }
    
    // Update UI immediately
    setDaysWithPlaces(updatedDays);
    setDays(updatedDays);

    try {
      // Use the dedicated movePlace API
      console.log('Calling placeService.movePlace...');
      const response = await placeService.movePlace(placeId, toDayId, newIndex);
      console.log('Move API response:', response);
      console.log('Move successful, refreshing data...');

      // Refresh data to get accurate server state
      await fetchTripData();
      
      console.log('Data refreshed');
    } catch (error) {
      console.error('Error moving place:', error);
      showError('Failed to move place');
      // Revert optimistic update on error
      await fetchTripData();
    }
  };

  // Handle drag start
  const handleDragStart = () => {
    // Drag started - could add analytics or other side effects here
  };

  // Handle drag end
  const handleDragEnd = () => {
    // Drag ended - could add analytics or other side effects here
  };

  // Handle place delete
  const handlePlaceDelete = async (placeId: string) => {
    if (!accessToken) return;

    try {
      await placeService.deletePlace(placeId);
      await fetchTripData();
    } catch (error) {
      console.error('Error deleting place:', error);
    }
  };

  // Handle transport mode change
  const handleTransportModeChange = async (
    placeId: string,
    mode: string
  ) => {
    if (!accessToken) return;

    try {
      // Find the place and its previous place to clear the route cache
      const place = allPlaces.find(p => p.id === placeId);
      if (place) {
        // Find the day this place belongs to
        const day = daysWithPlaces.find(d => d.places.some(p => p.id === placeId));
        if (day) {
          const placeIndex = day.places.findIndex(p => p.id === placeId);
          if (placeIndex > 0) {
            const previousPlace = day.places[placeIndex - 1];
            // Clear the route cache for this segment
            routeCalculationService.clearRouteCache(previousPlace.id, placeId);
          }
        }
      }

      // Update the transport mode
      await placeService.updatePlace(placeId, {
        transport_mode: mode as any,
      });
      
      // Refresh data to trigger route recalculation
      await fetchTripData();
      
      showSuccess('Transport mode updated');
    } catch (error) {
      console.error('Error updating transport mode:', error);
      showError('Failed to update transport mode');
    }
  };

  // Handle time change
  const handleTimeChange = async (
    placeId: string,
    startTime: string,
    endTime: string
  ) => {
    if (!accessToken) return;

    try {
      // Update the place times
      await placeService.updatePlace(placeId, {
        time_start: startTime,
        time_end: endTime,
      });
      
      // Refresh data to trigger time recalculation
      await fetchTripData();
      
      showSuccess('Time updated');
    } catch (error) {
      console.error('Error updating time:', error);
      showError('Failed to update time');
    }
  };

  // Handle map click to add place
  const handleMapClick = async (lat: number, lng: number) => {
    if (!accessToken || daysWithPlaces.length === 0) return;
                                                                                                                                                      
    try {
      const lastDay = daysWithPlaces[daysWithPlaces.length - 1];
      await placeService.createPlace({
        trip_day_id: lastDay.id,
        name: 'New Place',
        lat,
        lng,
        display_order: lastDay.places.length,
      });

      await fetchTripData();
    } catch (error) {
      console.error('Error adding place from map:', error);
    }
  };

  // Get all places for map
  const allPlaces = daysWithPlaces.flatMap((day) => day.places || []);

  // Get routes for map
  const { getAllRoutes } = useRouteIntegration(allPlaces);
  const routes = getAllRoutes();
  
  // Calculate total distance
  const totalDistance = daysWithPlaces.reduce((sum: number, day: TripDayWithPlaces) => {
    return sum + day.places.reduce((daySum: number, place: Place) => daySum + (place.travel_distance_meters || 0), 0);
  }, 0);
  
  // Budget export handlers
  const handleExportPDF = async () => {
    if (!trip || !budgetSummary) return;
    try {
      await budgetExportService.exportPDF(trip, budgetSummary, [], []);
      showSuccess('Budget PDF generated successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError('Failed to export PDF');
    }
  };

  const handleExportCSV = () => {
    if (!trip) return;
    try {
      budgetExportService.exportCSV(trip, allPlaces, daysWithPlaces);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="large" />
          <p className="text-gray-600 mt-4">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Trip not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="trip-planner-container">
        {/* New Header with Packing Progress */}
        <TripHeader
          tripTitle={trip.title}
          destination={trip.destination || undefined}
          startDate={trip.start_date || undefined}
          endDate={trip.end_date || undefined}
          onBack={() => navigate('/')}
          onShare={() => setIsShareModalOpen(true)}
          onSettings={() => {
            // Open settings or show menu
            console.log('Settings clicked');
          }}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
        />
        
        <div className="trip-planner-body">
          {/* Left Sidebar */}
          <TripSidebar
            tripId={trip.id}
            tripTitle={trip.title}
            destination={trip.destination || undefined}
            startDate={trip.start_date || undefined}
            endDate={trip.end_date || undefined}
            packingProgress={packingProgress}
            budgetSummary={budgetSummary}
            totalDistance={totalDistance / 1000}
            collaborators={[]}
            isOpen={showSidebar}
            onClose={() => setShowSidebar(false)}
            onOpenCollaborators={() => setIsCollaboratorsOpen(true)}
            onOpenBudget={() => setIsBudgetOpen(true)}
            onOpenSettings={() => console.log('Settings')}
          />
          
          {/* Main Content Area */}
          <div className="trip-planner-main">{/* Feature flag banner */}
      {isNewUIEnabled && (
        <FeatureFlagBanner
          flagName="New Trip Planner UI"
          description="You're using the enhanced interface with drag-and-drop, automatic routing, and real-time updates."
        />
      )}
      
      <PlaceEditorModal
        place={editingPlace}
        dayId={addingPlaceDayId || undefined}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPlace(null);
          setAddingPlaceDayId(null);
        }}
        onSave={handlePlaceSave}
        onCreate={handlePlaceCreate}
      />
      
      <TripPlannerLayout
        tripId={trip.id}
        timelinePanel={
          <EnhancedItineraryView
            days={daysWithPlaces}
            tripStartDate={trip.start_date}
            activeTab={activeItineraryTab}
            onTabChange={setActiveItineraryTab}
            onPlaceSelect={handlePlaceSelect}
            onPlaceEdit={handlePlaceEdit}
            onPlaceDelete={handlePlaceDelete}
            onAddPlace={handleAddPlace}
            onAddDay={handleAddDay}
            onPlaceMove={handlePlaceMove}
            onTransportModeChange={handleTransportModeChange}
            onTimeChange={handleTimeChange}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        }
        mapPanel={
          <MapPanel
            places={allPlaces}
            selectedPlaceId={ui.selectedPlaceId}
            onPlaceSelect={handlePlaceSelect}
            onMapClick={handleMapClick}
            initialDayPlaces={daysWithPlaces.length > 0 ? daysWithPlaces[0].places : []}
            routes={routes.map((route) => {
              const from = allPlaces.find((p) => p.id === route.from_place_id);
              const to = allPlaces.find((p) => p.id === route.to_place_id);
              return {
                from: from!,
                to: to!,
                polyline: route.polyline || '',
                mode: route.transport_mode,
              };
            })}
          />
        }
      />
      
          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareToken={trip.share_token}
        tripTitle={trip.title}
        tripId={trip.id}
        isPublic={trip.is_public}
        isCommunity={trip.is_community}
        onTripUpdate={fetchTripData}
      />
      
      {/* Packing List Modal */}
      <Modal
        isOpen={isPackingListOpen}
        onClose={() => setIsPackingListOpen(false)}
        title="Packing List"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <PackingList tripId={trip.id} tripTitle={trip.title} />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={() => {
              setIsPackingListOpen(false);
              navigate(`/trips/${trip.id}/packing`);
            }}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Open Full Page
          </button>
          <Button onClick={() => setIsPackingListOpen(false)} variant="secondary">
            Close
          </Button>
        </div>
      </Modal>
      
      {/* Budget Modal */}
      {trip.total_budget && budgetSummary && (
        <Modal
          isOpen={isBudgetOpen}
          onClose={() => setIsBudgetOpen(false)}
          title="Budget Tracking"
        >
          <div className="space-y-4">
            <BudgetCard
              summary={budgetSummary}
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
              onShare={handleShareBudget}
            />
            <div className="flex justify-end">
              <Button onClick={() => setIsBudgetOpen(false)} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Collaborators Modal */}
      <Modal
        isOpen={isCollaboratorsOpen}
        onClose={() => setIsCollaboratorsOpen(false)}
        title="Manage Collaborators"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <CollaboratorManager tripId={trip.id} isOwner={trip.owner_id === useEnhancedAuthStore.getState().user?.id} />
        </div>
      </Modal>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default TripPlanner;

// Add styles for the new layout
const styles = `
  .trip-planner-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .trip-planner-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .trip-planner-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
