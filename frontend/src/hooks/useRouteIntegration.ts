import { useState, useEffect, useCallback, useRef } from 'react';
import { Place, TransportRoute } from '../types/trip';
import { routeCalculationService } from '../services/routeCalculationService';

interface RouteState {
  routes: Map<string, TransportRoute>;
  calculating: Set<string>;
  errors: Map<string, string>;
}

export function useRouteIntegration(places: Place[]) {
  const [routeState, setRouteState] = useState<RouteState>({
    routes: new Map(),
    calculating: new Set(),
    errors: new Map(),
  });

  const routeService = routeCalculationService;
  const lastPlacesRef = useRef<string>('');

  // Safety check - if route service is not available, return empty functions
  if (!routeService) {
    return {
      getRoute: () => null,
      isCalculating: () => false,
      getError: () => null,
      retryRoute: async () => {},
      getAllRoutes: () => [],
      recalculate: async () => {},
    };
  }

  // Generate route key for caching
  const getRouteKey = useCallback((fromId: string, toId: string): string => {
    return `${fromId}-${toId}`;
  }, []);

  // Calculate routes for consecutive places
  const calculateRoutes = useCallback(async () => {
    if (places.length < 2) return;

    for (let i = 0; i < places.length - 1; i++) {
      const from = places[i];
      const to = places[i + 1];

      if (!from.lat || !from.lng || !to.lat || !to.lng) continue;

      const routeKey = getRouteKey(from.id, to.id);
      const mode = to.transport_mode || 'driving';

      // Check if already calculated with same mode and not expired
      const shouldRecalculate = (() => {
        const existingRoute = routeState.routes.get(routeKey);
        if (!existingRoute) return true;
        if (new Date(existingRoute.expires_at) <= new Date()) return true;
        // Recalculate if transport mode changed
        if (existingRoute.transport_mode !== mode) return true;
        return false;
      })();

      if (!shouldRecalculate) continue;

      // Mark as calculating
      setRouteState((prev) => {
        const newCalculating = new Set(prev.calculating);
        newCalculating.add(routeKey);
        return {
          ...prev,
          calculating: newCalculating,
        };
      });

      try {
        const route = await routeService.calculateRoute(
          from,
          to,
          mode
        );

        // Check if route calculation was successful
        if (!route) {
          throw new Error('Route calculation returned null');
        }

        setRouteState((prev) => {
          const newRoutes = new Map(prev.routes);
          newRoutes.set(routeKey, {
            id: routeKey,
            from_place_id: from.id,
            to_place_id: to.id,
            transport_mode: mode,
            duration_seconds: route.duration || 0,
            distance_meters: route.distance || 0,
            polyline: route.polyline || null,
            route_steps: null,
            calculated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          });

          const newCalculating = new Set(prev.calculating);
          newCalculating.delete(routeKey);

          return {
            ...prev,
            routes: newRoutes,
            calculating: newCalculating,
          };
        });
      } catch (error) {
        console.error(`Failed to calculate route ${routeKey}:`, error);
        
        setRouteState((prev) => {
          const newErrors = new Map(prev.errors);
          newErrors.set(routeKey, error instanceof Error ? error.message : 'Route calculation failed');

          const newCalculating = new Set(prev.calculating);
          newCalculating.delete(routeKey);

          return {
            ...prev,
            errors: newErrors,
            calculating: newCalculating,
          };
        });
      }
    }
  }, [places, getRouteKey, routeService]);

  // Recalculate when places change
  useEffect(() => {
    try {
      // Create a stable key from place IDs to detect actual changes
      const placesKey = places.map(p => p.id).join(',');
      
      // Only recalculate if places actually changed
      if (placesKey !== lastPlacesRef.current) {
        lastPlacesRef.current = placesKey;
        calculateRoutes().catch(error => {
          console.error('Error in calculateRoutes:', error);
        });
      }
    } catch (error) {
      console.error('Error in useRouteIntegration useEffect:', error);
    }
  }, [places, calculateRoutes]);

  // Get route for a specific pair of places
  const getRoute = useCallback(
    (fromId: string, toId: string): TransportRoute | null => {
      const routeKey = getRouteKey(fromId, toId);
      return routeState.routes.get(routeKey) || null;
    },
    [routeState.routes, getRouteKey]
  );

  // Check if route is being calculated
  const isCalculating = useCallback(
    (fromId: string, toId: string): boolean => {
      const routeKey = getRouteKey(fromId, toId);
      return routeState.calculating.has(routeKey);
    },
    [routeState.calculating, getRouteKey]
  );

  // Get error for a specific route
  const getError = useCallback(
    (fromId: string, toId: string): string | null => {
      const routeKey = getRouteKey(fromId, toId);
      return routeState.errors.get(routeKey) || null;
    },
    [routeState.errors, getRouteKey]
  );

  // Retry failed route calculation
  const retryRoute = useCallback(
    async (fromId: string, toId: string) => {
      const from = places.find((p) => p.id === fromId);
      const to = places.find((p) => p.id === toId);

      if (!from || !to || !from.lat || !from.lng || !to.lat || !to.lng) return;

      const routeKey = getRouteKey(fromId, toId);

      setRouteState((prev) => ({
        ...prev,
        calculating: new Set(prev.calculating).add(routeKey),
        errors: new Map(Array.from(prev.errors).filter(([k]) => k !== routeKey)),
      }));

      try {
        const mode = to.transport_mode || 'driving';
        const route = await routeService.calculateRoute(
          from,
          to,
          mode
        );

        // Check if route calculation was successful
        if (!route) {
          throw new Error('Route calculation returned null');
        }

        setRouteState((prev) => {
          const newRoutes = new Map(prev.routes);
          newRoutes.set(routeKey, {
            id: routeKey,
            from_place_id: from.id,
            to_place_id: to.id,
            transport_mode: mode,
            duration_seconds: route.duration || 0,
            distance_meters: route.distance || 0,
            polyline: route.polyline || null,
            route_steps: null, // Convert if needed
            calculated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          });

          const newCalculating = new Set(prev.calculating);
          newCalculating.delete(routeKey);

          return {
            ...prev,
            routes: newRoutes,
            calculating: newCalculating,
          };
        });
      } catch (error) {
        console.error(`Retry failed for route ${routeKey}:`, error);
        setRouteState((prev) => {
          const newErrors = new Map(prev.errors);
          newErrors.set(routeKey, error instanceof Error ? error.message : 'Route calculation failed');

          const newCalculating = new Set(prev.calculating);
          newCalculating.delete(routeKey);

          return {
            ...prev,
            errors: newErrors,
            calculating: newCalculating,
          };
        });
      }
    },
    [places, getRouteKey, routeService]
  );

  // Get all routes as array for map display
  const getAllRoutes = useCallback((): TransportRoute[] => {
    return Array.from(routeState.routes.values());
  }, [routeState.routes]);

  return {
    getRoute,
    isCalculating,
    getError,
    retryRoute,
    getAllRoutes,
    recalculate: calculateRoutes,
  };
}
