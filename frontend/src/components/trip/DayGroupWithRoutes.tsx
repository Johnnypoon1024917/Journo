import React, { useMemo } from 'react';
import { TripDayWithPlaces } from '../../types/trip';
import { DayGroup } from './DayGroup';
import { OptimisticPlaceList } from './OptimisticPlaceList';
import { TransportSegment } from './TransportSegment';
import { DroppableDayContent } from './DroppableDayContent';
import { useRouteIntegration } from '../../hooks/useRouteIntegration';
import { useTimeIntegration } from '../../hooks/useTimeIntegration';

interface DayGroupWithRoutesProps {
  day: TripDayWithPlaces;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPlaceSelect?: (placeId: string) => void;
  onPlaceEdit?: (placeId: string) => void;
  onPlaceDelete?: (placeId: string) => void;
  onTransportModeChange?: (fromId: string, toId: string, mode: string) => void;
  selectedPlaceId?: string | null;
  tripStartDate?: string | null;
}

export const DayGroupWithRoutes: React.FC<DayGroupWithRoutesProps> = ({
  day,
  isExpanded = true,
  onToggle,
  onPlaceSelect,
  onPlaceEdit,
  onPlaceDelete,
  onTransportModeChange,
  selectedPlaceId,
  tripStartDate,
}) => {
  const { getRoute, isCalculating, getError, retryRoute, recalculate } = useRouteIntegration(day.places);

  // Enrich places with route data FIRST
  const enrichedPlaces = useMemo(() => {
    return day.places.map((place, index) => {
      if (index === 0) return place;
      
      const prevPlace = day.places[index - 1];
      const route = getRoute(prevPlace.id, place.id);
      
      // Inject route data into place for time calculation
      return {
        ...place,
        travel_time_seconds: route?.duration_seconds || place.travel_time_seconds || null,
        travel_distance_meters: route?.distance_meters || place.travel_distance_meters || null,
      };
    });
  }, [day.places, getRoute]);

  // Use time integration with enriched places
  const { calculateArrivalTimes } = useTimeIntegration(enrichedPlaces);

  // Calculate times for all places
  const placesWithTimes = useMemo(() => {
    return calculateArrivalTimes();
  }, [calculateArrivalTimes]);

  // Trigger route recalculation when places order changes
  React.useEffect(() => {
    recalculate();
  }, [day.places.map(p => p.id).join(','), recalculate]);

  // Create a custom render function for the OptimisticPlaceList that includes transport segments
  const renderPlaceWithTransport = (place: any, index: number) => {
    if (index === 0) return null; // No transport before first place
    
    const prevPlace = placesWithTimes[index - 1];
    const route = getRoute(prevPlace.id, place.id);
    
    // Priority: calculated route > stored place data > null
    // This ensures we always show the most up-to-date route information
    const durationSeconds = route?.duration_seconds || place.travel_time_seconds || null;
    const distanceMeters = route?.distance_meters || place.travel_distance_meters || null;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Route ${prevPlace.name} -> ${place.name}:`, {
        route,
        durationSeconds,
        distanceMeters,
        placeData: {
          travel_time_seconds: place.travel_time_seconds,
          travel_distance_meters: place.travel_distance_meters,
        },
      });
    }
    
    return (
      <TransportSegment
        mode={place.transport_mode || 'driving'}
        durationSeconds={durationSeconds}
        distanceMeters={distanceMeters}
        durationText={place.travel_time_text || undefined}
        distanceText={place.travel_distance_text || undefined}
        isCalculating={isCalculating(prevPlace.id, place.id)}
        hasError={!!getError(prevPlace.id, place.id)}
        errorMessage={getError(prevPlace.id, place.id)}
        onModeChange={(mode) => {
          if (onTransportModeChange) {
            onTransportModeChange(prevPlace.id, place.id, mode);
          }
        }}
        onRetry={() => retryRoute(prevPlace.id, place.id)}
      />
    );
  };

  return (
    <DayGroup day={day} isExpanded={isExpanded} onToggle={onToggle} tripStartDate={tripStartDate}>
      <DroppableDayContent dayId={day.id} isEmpty={placesWithTimes.length === 0}>
        <OptimisticPlaceList
          dayId={day.id}
          places={placesWithTimes}
          onPlaceSelect={onPlaceSelect}
          onPlaceEdit={onPlaceEdit}
          onPlaceDelete={onPlaceDelete}
          selectedPlaceId={selectedPlaceId}
          renderBeforePlace={renderPlaceWithTransport}
        />
      </DroppableDayContent>
    </DayGroup>
  );
};
