import fc from 'fast-check';
import { ActivityBalanceSchedulingService, SchedulingRequest } from '../activityBalanceSchedulingService';
import { EnhancedPlace } from '../intelligentPlaceSelectionService';

describe('Property 16: Time Allocation Accuracy', () => {
  it('should assign appropriate visit durations for any place type and ensure meal times are integrated', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of places (5-15)
        fc.integer({ min: 5, max: 15 }),
        // Generate travel style
        fc.constantFrom('relaxed', 'moderate', 'fast-paced'),
        // Generate group size
        fc.integer({ min: 1, max: 8 }),
        async (numPlaces: number, travelStyle: 'relaxed' | 'moderate' | 'fast-paced', groupSize: number) => {
          // Create mock enhanced places with consistent types
          const mockPlaces: EnhancedPlace[] = Array.from({ length: numPlaces }, (_, i) => ({
            location_name: `Test Place ${i + 1}`,
            source: 'test',
            lat: 40.7128 + (i * 0.01),
            lng: -74.0060 + (i * 0.01),
            place_type: ['attraction', 'food', 'other'][i % 3] as any,
            estimated_cost: 20 + (i * 5),
            estimated_duration: 60 + (i * 30),
            budget_category: 'medium' as const,
            interest_match: 0.5 + (i * 0.05),
            popularity_score: 0.3 + (i * 0.04),
            weather_suitability: 'flexible' as const,
            crowd_level: 'medium' as const,
            rating: 4.0 + (i * 0.1),
            visitor_count: 1000 + (i * 100),
            // Enhanced place properties
            diversityScore: 0.5 + (i * 0.03),
            popularityWeight: 0.4 + (i * 0.04),
            seasonalRelevance: 0.6 + (i * 0.02),
            groupAppropriatenessScore: 0.7 + (i * 0.02),
            interestMatchScore: 0.5 + (i * 0.03),
            finalScore: 0.6 + (i * 0.02),
            selectionReason: [`Reason ${i + 1}`]
          }));

          const request: SchedulingRequest = {
            places: mockPlaces,
            travelStyle,
            groupSize,
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

          // Property assertions for time allocation accuracy
          
          // 1. Each activity should have appropriate duration based on place type
          for (const dailySchedule of result.dailySchedules) {
            for (const activity of dailySchedule.activities) {
              const duration = activity.activityIntensity.duration;
              
              // All durations should be positive and reasonable
              expect(duration).toBeGreaterThan(0);
              expect(duration).toBeLessThanOrEqual(480); // Max 8 hours per activity
              
              switch (activity.place_type) {
                case 'food':
                  // Food places should have meal-appropriate durations (15-180 minutes)
                  expect(duration).toBeGreaterThanOrEqual(15);
                  expect(duration).toBeLessThanOrEqual(180);
                  break;
                case 'attraction':
                  // Attractions should have visit-appropriate durations (30-300 minutes)
                  expect(duration).toBeGreaterThanOrEqual(30);
                  expect(duration).toBeLessThanOrEqual(300);
                  break;
                default:
                  // Other places should have reasonable durations (15-240 minutes)
                  expect(duration).toBeGreaterThanOrEqual(15);
                  expect(duration).toBeLessThanOrEqual(240);
              }
            }
          }
          
          // 2. Meal times should be integrated into daily schedules (basic validation)
          for (const dailySchedule of result.dailySchedules) {
            // Should have meal schedule structure
            expect(dailySchedule.mealSchedule).toBeDefined();
            expect(Array.isArray(dailySchedule.mealSchedule.snacks)).toBe(true);
            
            // Check if any activities are marked as meals
            const mealActivities = dailySchedule.activities.filter(activity => 
              activity.mealTiming !== undefined
            );
            
            // Meal activities should have valid timing if they exist
            for (const mealActivity of mealActivities) {
              const scheduledTime = mealActivity.scheduledTime;
              const [hours, minutes] = scheduledTime.split(':').map(Number);
              const totalMinutes = hours * 60 + minutes;
              
              // Should be within daily operating hours (6:00 - 23:00)
              expect(totalMinutes).toBeGreaterThanOrEqual(6 * 60);
              expect(totalMinutes).toBeLessThanOrEqual(23 * 60);
              
              if (mealActivity.mealTiming) {
                switch (mealActivity.mealTiming) {
                  case 'breakfast':
                    // Breakfast should be between 6:00-11:00
                    expect(totalMinutes).toBeGreaterThanOrEqual(6 * 60);
                    expect(totalMinutes).toBeLessThanOrEqual(11 * 60);
                    break;
                  case 'lunch':
                    // Lunch should be between 11:00-15:00
                    expect(totalMinutes).toBeGreaterThanOrEqual(11 * 60);
                    expect(totalMinutes).toBeLessThanOrEqual(15 * 60);
                    break;
                  case 'dinner':
                    // Dinner should be between 17:00-22:00
                    expect(totalMinutes).toBeGreaterThanOrEqual(17 * 60);
                    expect(totalMinutes).toBeLessThanOrEqual(22 * 60);
                    break;
                }
              }
            }
          }
          
          // 3. Daily schedules should not exceed reasonable time limits
          for (const dailySchedule of result.dailySchedules) {
            const totalActiveTime = dailySchedule.dailySummary.totalActiveTime;
            const totalRestTime = dailySchedule.dailySummary.totalRestTime;
            
            // Total active time should be positive and reasonable
            expect(totalActiveTime).toBeGreaterThan(0);
            expect(totalActiveTime).toBeLessThanOrEqual(16 * 60); // Max 16 hours active time
            
            // Total rest time should be non-negative
            expect(totalRestTime).toBeGreaterThanOrEqual(0);
            
            // Total time should be reasonable based on travel style
            switch (travelStyle) {
              case 'relaxed':
                expect(totalActiveTime).toBeLessThanOrEqual(10 * 60); // 10 hours max for relaxed
                break;
              case 'moderate':
                expect(totalActiveTime).toBeLessThanOrEqual(12 * 60); // 12 hours max for moderate
                break;
              case 'fast-paced':
                expect(totalActiveTime).toBeLessThanOrEqual(14 * 60); // 14 hours max for fast-paced
                break;
            }
          }
          
          // 4. Activities should be scheduled in chronological order
          for (const dailySchedule of result.dailySchedules) {
            for (let i = 1; i < dailySchedule.activities.length; i++) {
              const prevActivity = dailySchedule.activities[i - 1];
              const currentActivity = dailySchedule.activities[i];
              
              const prevEndTime = prevActivity.endTime;
              const currentStartTime = currentActivity.scheduledTime;
              
              // Convert times to minutes for comparison
              const [prevHours, prevMinutes] = prevEndTime.split(':').map(Number);
              const [currHours, currMinutes] = currentStartTime.split(':').map(Number);
              
              const prevEndMinutes = prevHours * 60 + prevMinutes;
              const currStartMinutes = currHours * 60 + currMinutes;
              
              // Current activity should start at or after previous activity ends
              expect(currStartMinutes).toBeGreaterThanOrEqual(prevEndMinutes);
            }
          }
          
          // 5. Rest periods should be appropriately scheduled
          for (const dailySchedule of result.dailySchedules) {
            expect(Array.isArray(dailySchedule.restPeriods)).toBe(true);
            
            for (const restPeriod of dailySchedule.restPeriods) {
              expect(restPeriod.duration).toBeGreaterThan(0);
              expect(['short_break', 'meal_break', 'rest_period', 'free_time']).toContain(restPeriod.type);
              
              // Rest period times should be valid
              const [startHours, startMinutes] = restPeriod.startTime.split(':').map(Number);
              const [endHours, endMinutes] = restPeriod.endTime.split(':').map(Number);
              
              const startTotalMinutes = startHours * 60 + startMinutes;
              const endTotalMinutes = endHours * 60 + endMinutes;
              
              expect(endTotalMinutes).toBeGreaterThan(startTotalMinutes);
              expect(endTotalMinutes - startTotalMinutes).toBe(restPeriod.duration);
            }
          }
          
          // 6. Overall scheduling should be valid
          expect(result.dailySchedules.length).toBeGreaterThan(0);
          expect(result.overallBalance).toBeDefined();
          expect(Array.isArray(result.recommendations)).toBe(true);
          expect(Array.isArray(result.warnings)).toBe(true);
        }
      ),
      { 
        numRuns: 20, // Run 20 test cases
        timeout: 45000 // 45 second timeout
      }
    );
  });
});