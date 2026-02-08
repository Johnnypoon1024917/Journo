import { ActivityBalanceSchedulingService, SchedulingRequest } from '../activityBalanceSchedulingService.js';
import { EnhancedPlace } from '../intelligentPlaceSelectionService.js';

describe('ActivityBalanceSchedulingService', () => {
  const mockPlaces: EnhancedPlace[] = [
    {
      location_name: 'Morning Cafe',
      source: 'test',
      place_type: 'restaurant',
      rating: 4.5,
      estimated_cost: 20,
      lat: 40.7128,
      lng: -74.0060,
      diversityScore: 0.8,
      popularityWeight: 0.7,
      seasonalRelevance: 0.6,
      groupAppropriatenessScore: 0.9,
      interestMatchScore: 0.8,
      finalScore: 0.76,
      selectionReason: ['High food interest match']
    },
    {
      location_name: 'Art Museum',
      source: 'test',
      place_type: 'museum',
      rating: 4.2,
      estimated_cost: 15,
      lat: 40.7589,
      lng: -73.9851,
      diversityScore: 0.7,
      popularityWeight: 0.6,
      seasonalRelevance: 0.8,
      groupAppropriatenessScore: 0.8,
      interestMatchScore: 0.9,
      finalScore: 0.76,
      selectionReason: ['High culture interest match']
    },
    {
      location_name: 'Adventure Park',
      source: 'test',
      place_type: 'activity',
      rating: 4.0,
      estimated_cost: 40,
      lat: 40.7829,
      lng: -73.9654,
      diversityScore: 0.6,
      popularityWeight: 0.5,
      seasonalRelevance: 0.7,
      groupAppropriatenessScore: 0.7,
      interestMatchScore: 0.6,
      finalScore: 0.62,
      selectionReason: ['Adventure activity']
    }
  ];

  it('should create balanced daily schedule', async () => {
    const request: SchedulingRequest = {
      places: mockPlaces,
      travelStyle: 'moderate',
      groupSize: 2,
      startTime: '09:00',
      endTime: '21:00',
      mealPreferences: {
        breakfastTime: '08:00',
        lunchTime: '12:30',
        dinnerTime: '19:00',
        includeSnacks: true
      }
    };

    const result = await ActivityBalanceSchedulingService.createBalancedSchedule(request);

    expect(result.dailySchedules).toBeDefined();
    expect(result.dailySchedules.length).toBeGreaterThan(0);
    
    const firstDay = result.dailySchedules[0];
    expect(firstDay.activities).toBeDefined();
    expect(firstDay.activities.length).toBeGreaterThan(0);
    expect(firstDay.balanceScore).toBeGreaterThanOrEqual(0);
    expect(firstDay.balanceScore).toBeLessThanOrEqual(1);
    expect(firstDay.fatigueLevel).toBeGreaterThanOrEqual(0);
    expect(firstDay.fatigueLevel).toBeLessThanOrEqual(1);
  });

  it('should assign appropriate activity intensities', async () => {
    const request: SchedulingRequest = {
      places: mockPlaces,
      travelStyle: 'moderate',
      groupSize: 2
    };

    const result = await ActivityBalanceSchedulingService.createBalancedSchedule(request);

    const firstDay = result.dailySchedules[0];
    firstDay.activities.forEach(activity => {
      expect(activity.activityIntensity).toBeDefined();
      expect(activity.activityIntensity.level).toMatch(/^(low|medium|high)$/);
      expect(activity.activityIntensity.physicalDemand).toBeGreaterThanOrEqual(0);
      expect(activity.activityIntensity.physicalDemand).toBeLessThanOrEqual(1);
      expect(activity.activityIntensity.mentalDemand).toBeGreaterThanOrEqual(0);
      expect(activity.activityIntensity.mentalDemand).toBeLessThanOrEqual(1);
      expect(activity.activityIntensity.socialDemand).toBeGreaterThanOrEqual(0);
      expect(activity.activityIntensity.socialDemand).toBeLessThanOrEqual(1);
    });
  });

  it('should schedule activities with proper timing', async () => {
    const request: SchedulingRequest = {
      places: mockPlaces,
      travelStyle: 'moderate',
      groupSize: 2,
      startTime: '09:00'
    };

    const result = await ActivityBalanceSchedulingService.createBalancedSchedule(request);

    const firstDay = result.dailySchedules[0];
    let previousEndTime = 0;

    firstDay.activities.forEach(activity => {
      expect(activity.scheduledTime).toMatch(/^\d{2}:\d{2}$/);
      expect(activity.endTime).toMatch(/^\d{2}:\d{2}$/);
      
      const startMinutes = parseTime(activity.scheduledTime!);
      const endMinutes = parseTime(activity.endTime!);
      
      expect(endMinutes).toBeGreaterThan(startMinutes);
      expect(startMinutes).toBeGreaterThanOrEqual(previousEndTime);
      
      previousEndTime = endMinutes;
    });
  });

  it('should adjust for different travel styles', async () => {
    const relaxedRequest: SchedulingRequest = {
      places: mockPlaces,
      travelStyle: 'relaxed',
      groupSize: 2
    };

    const fastPacedRequest: SchedulingRequest = {
      places: mockPlaces,
      travelStyle: 'fast-paced',
      groupSize: 2
    };

    const relaxedResult = await ActivityBalanceSchedulingService.createBalancedSchedule(relaxedRequest);
    const fastPacedResult = await ActivityBalanceSchedulingService.createBalancedSchedule(fastPacedRequest);

    // Relaxed should have more rest time
    const relaxedDay = relaxedResult.dailySchedules[0];
    const fastPacedDay = fastPacedResult.dailySchedules[0];

    expect(relaxedDay.dailySummary.totalRestTime).toBeGreaterThan(fastPacedDay.dailySummary.totalRestTime);
  });

  it('should provide meaningful recommendations', async () => {
    const request: SchedulingRequest = {
      places: mockPlaces,
      travelStyle: 'moderate',
      groupSize: 2
    };

    const result = await ActivityBalanceSchedulingService.createBalancedSchedule(request);

    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('should calculate overall balance metrics', async () => {
    const request: SchedulingRequest = {
      places: mockPlaces,
      travelStyle: 'moderate',
      groupSize: 2
    };

    const result = await ActivityBalanceSchedulingService.createBalancedSchedule(request);

    expect(result.overallBalance).toBeDefined();
    expect(result.overallBalance.averageIntensity).toBeGreaterThanOrEqual(0);
    expect(result.overallBalance.averageIntensity).toBeLessThanOrEqual(1);
    expect(result.overallBalance.balanceScore).toBeGreaterThanOrEqual(0);
    expect(result.overallBalance.balanceScore).toBeLessThanOrEqual(1);
    expect(result.overallBalance.sustainabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.overallBalance.sustainabilityScore).toBeLessThanOrEqual(1);
    expect(result.overallBalance.fatigueManagement).toBeGreaterThanOrEqual(0);
    expect(result.overallBalance.fatigueManagement).toBeLessThanOrEqual(1);
  });
});

// Helper function for parsing time
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}