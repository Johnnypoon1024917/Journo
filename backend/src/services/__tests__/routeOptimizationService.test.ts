import { RouteOptimizationService, SuggestedPlace, RouteOptimizationRequest } from '../routeOptimizationService.js';

describe('RouteOptimizationService', () => {
  const mockPlaces: SuggestedPlace[] = [
    {
      id: '1',
      name: 'Tokyo Tower',
      address: 'Tokyo, Japan',
      coordinates: { lat: 35.6586, lng: 139.7454 },
      placeType: 'attraction',
      description: 'Famous tower',
      estimatedDuration: 90,
      estimatedCost: 1000,
      source: 'scraping'
    },
    {
      id: '2',
      name: 'Senso-ji Temple',
      address: 'Asakusa, Tokyo',
      coordinates: { lat: 35.7148, lng: 139.7967 },
      placeType: 'culture',
      description: 'Historic temple',
      estimatedDuration: 60,
      estimatedCost: 0,
      source: 'scraping'
    },
    {
      id: '3',
      name: 'Tsukiji Fish Market',
      address: 'Tsukiji, Tokyo',
      coordinates: { lat: 35.6654, lng: 139.7707 },
      placeType: 'food',
      description: 'Famous fish market',
      estimatedDuration: 120,
      estimatedCost: 2000,
      source: 'scraping'
    }
  ];

  describe('optimizeDailyRoute', () => {
    it('should handle empty places array', async () => {
      const request: RouteOptimizationRequest = {
        places: [],
        travelStyle: 'moderate',
        availableTime: 480 // 8 hours
      };

      const result = await RouteOptimizationService.optimizeDailyRoute(request);

      expect(result.orderedPlaces).toHaveLength(0);
      expect(result.totalTravelTime).toBe(0);
      expect(result.optimizationScore).toBe(1.0);
    });

    it('should handle single place', async () => {
      const request: RouteOptimizationRequest = {
        places: [mockPlaces[0]],
        travelStyle: 'moderate',
        availableTime: 480
      };

      const result = await RouteOptimizationService.optimizeDailyRoute(request);

      expect(result.orderedPlaces).toHaveLength(1);
      expect(result.orderedPlaces[0].id).toBe('1');
      expect(result.totalTravelTime).toBe(0);
      expect(result.optimizationScore).toBe(1.0);
    });

    it('should optimize multiple places', async () => {
      const request: RouteOptimizationRequest = {
        places: mockPlaces,
        travelStyle: 'moderate',
        availableTime: 480
      };

      const result = await RouteOptimizationService.optimizeDailyRoute(request);

      expect(result.orderedPlaces).toHaveLength(3);
      expect(result.routeSegments).toHaveLength(2);
      expect(result.optimizationScore).toBeGreaterThan(0);
      expect(result.optimizationScore).toBeLessThanOrEqual(1);
    });

    it('should provide feasibility warnings for tight schedules', async () => {
      const request: RouteOptimizationRequest = {
        places: mockPlaces,
        travelStyle: 'fast-paced',
        availableTime: 120 // Only 2 hours for 3 places
      };

      const result = await RouteOptimizationService.optimizeDailyRoute(request);

      expect(result.feasibilityWarnings.length).toBeGreaterThan(0);
      expect(result.feasibilityWarnings.some(w => w.includes('exceeds available time'))).toBe(true);
    });
  });

  describe('optimizeMultiDayItinerary', () => {
    it('should optimize multiple days', async () => {
      const dailyPlaces = [
        [mockPlaces[0], mockPlaces[1]], // Day 1
        [mockPlaces[2]] // Day 2
      ];

      const travelInfo = {
        travelStyle: 'moderate' as const,
        availableTimePerDay: 480
      };

      const results = await RouteOptimizationService.optimizeMultiDayItinerary(dailyPlaces, travelInfo);

      expect(results).toHaveLength(2);
      expect(results[0].orderedPlaces).toHaveLength(2);
      expect(results[1].orderedPlaces).toHaveLength(1);
    });
  });
});