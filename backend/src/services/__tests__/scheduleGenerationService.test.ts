import { ScheduleGenerationService } from '../scheduleGenerationService.js';
import { OptimizedRoute, SuggestedPlace, RouteSegment } from '../routeOptimizationService.js';

describe('ScheduleGenerationService', () => {
  const mockPlaces: SuggestedPlace[] = [
    {
      id: '1',
      name: 'Morning Museum',
      address: 'Tokyo, Japan',
      coordinates: { lat: 35.6586, lng: 139.7454 },
      placeType: 'culture',
      description: 'Museum',
      estimatedDuration: 90,
      estimatedCost: 1000,
      source: 'scraping',
      openingHours: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' }
      }
    },
    {
      id: '2',
      name: 'Lunch Restaurant',
      address: 'Tokyo, Japan',
      coordinates: { lat: 35.6654, lng: 139.7707 },
      placeType: 'food',
      description: 'Restaurant',
      estimatedDuration: 60,
      estimatedCost: 1500,
      source: 'scraping'
    },
    {
      id: '3',
      name: 'Afternoon Park',
      address: 'Tokyo, Japan',
      coordinates: { lat: 35.7148, lng: 139.7967 },
      placeType: 'nature',
      description: 'Park',
      estimatedDuration: 120,
      estimatedCost: 0,
      source: 'scraping'
    }
  ];

  const mockSegments: RouteSegment[] = [
    {
      fromPlace: mockPlaces[0],
      toPlace: mockPlaces[1],
      travelMode: 'walking',
      duration: 15,
      distance: 1000,
      polyline: ''
    },
    {
      fromPlace: mockPlaces[1],
      toPlace: mockPlaces[2],
      travelMode: 'transit',
      duration: 20,
      distance: 3000,
      polyline: ''
    }
  ];

  const mockOptimizedRoute: OptimizedRoute = {
    orderedPlaces: mockPlaces,
    totalTravelTime: 35,
    totalDistance: 4000,
    routeSegments: mockSegments,
    optimizationScore: 0.8,
    feasibilityWarnings: []
  };

  describe('generateSchedule', () => {
    it('should generate schedule with time allocations', async () => {
      const request = {
        optimizedRoute: mockOptimizedRoute,
        startTime: '09:00',
        endTime: '18:00',
        travelStyle: 'moderate' as const,
        includeMeals: true
      };

      const result = await ScheduleGenerationService.generateSchedule(request);

      expect(result.scheduledPlaces).toHaveLength(3);
      expect(result.scheduledPlaces[0].scheduledStartTime).toBeDefined();
      expect(result.scheduledPlaces[0].scheduledEndTime).toBeDefined();
      expect(result.mealBreaks.length).toBeGreaterThan(0);
    });

    it('should handle empty route', async () => {
      const emptyRoute: OptimizedRoute = {
        orderedPlaces: [],
        totalTravelTime: 0,
        totalDistance: 0,
        routeSegments: [],
        optimizationScore: 1.0,
        feasibilityWarnings: []
      };

      const request = {
        optimizedRoute: emptyRoute,
        startTime: '09:00',
        endTime: '18:00',
        travelStyle: 'moderate' as const
      };

      const result = await ScheduleGenerationService.generateSchedule(request);

      expect(result.scheduledPlaces).toHaveLength(0);
      expect(result.feasible).toBe(true);
    });

    it('should detect infeasible schedules', async () => {
      const request = {
        optimizedRoute: mockOptimizedRoute,
        startTime: '09:00',
        endTime: '11:00', // Only 2 hours for 3 places
        travelStyle: 'moderate' as const,
        includeMeals: true
      };

      const result = await ScheduleGenerationService.generateSchedule(request);

      expect(result.feasible).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate opening hours when date is provided', async () => {
      const request = {
        optimizedRoute: mockOptimizedRoute,
        startTime: '20:00', // After closing time
        endTime: '22:00',
        travelStyle: 'moderate' as const,
        date: '2024-01-15', // Monday
        includeMeals: false
      };

      const result = await ScheduleGenerationService.generateSchedule(request);

      expect(result.warnings.some(w => w.includes('opening hours'))).toBe(true);
    });
  });

  describe('calculateActivityBalance', () => {
    it('should calculate balance for mixed activities', () => {
      const scheduledPlaces = mockPlaces.map((place, index) => ({
        ...place,
        scheduledStartTime: `${9 + index * 2}:00`,
        scheduledEndTime: `${10 + index * 2}:00`,
        bufferTime: 15
      }));

      const balance = ScheduleGenerationService.calculateActivityBalance(scheduledPlaces);

      expect(balance.activeCount).toBeGreaterThan(0);
      expect(balance.relaxedCount).toBeGreaterThan(0);
      expect(balance.balanceScore).toBeGreaterThanOrEqual(0);
      expect(balance.balanceScore).toBeLessThanOrEqual(1);
    });

    it('should detect imbalanced schedules', () => {
      const allActivePlaces = Array(5).fill(null).map((_, i) => ({
        ...mockPlaces[0],
        id: `${i}`,
        placeType: 'attraction' as const,
        scheduledStartTime: `${9 + i}:00`,
        scheduledEndTime: `${10 + i}:00`,
        bufferTime: 15
      }));

      const balance = ScheduleGenerationService.calculateActivityBalance(allActivePlaces);

      expect(balance.activeCount).toBe(5);
      expect(balance.relaxedCount).toBe(0);
      expect(balance.balanceScore).toBeLessThan(0.5);
      expect(balance.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('validateFreeTime', () => {
    it('should validate adequate free time for relaxed style', () => {
      const scheduledRoute = {
        scheduledPlaces: [],
        totalScheduledTime: 300,
        freeTime: 180, // 3 hours
        mealBreaks: [],
        feasible: true,
        warnings: []
      };

      const result = ScheduleGenerationService.validateFreeTime(scheduledRoute, 'relaxed');

      expect(result.adequate).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about insufficient free time', () => {
      const scheduledRoute = {
        scheduledPlaces: [],
        totalScheduledTime: 450,
        freeTime: 30, // Only 30 minutes
        mealBreaks: [],
        feasible: true,
        warnings: []
      };

      const result = ScheduleGenerationService.validateFreeTime(scheduledRoute, 'relaxed');

      expect(result.adequate).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Insufficient free time');
    });
  });
});