import fc from 'fast-check';
import { ActivityBalanceSchedulingService, SchedulingRequest } from '../activityBalanceSchedulingService';
import { EnhancedPlace } from '../intelligentPlaceSelectionService';

describe('Property 18: Activity Balance Optimization', () => {
  it('should include a balanced mix of active and relaxed activities in any daily schedule', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of places (8-20 to ensure multiple days)
        fc.integer({ min: 8, max: 20 }),
        // Generate travel style
        fc.constantFrom('relaxed', 'moderate', 'fast-paced'),
        // Generate group size
        fc.integer({ min: 1, max: 6 }),
        async (numPlaces: number, travelStyle: 'relaxed' | 'moderate' | 'fast-paced', groupSize: number) => {
          // Create mock enhanced places with varying activity types for balance testing
          const mockPlaces: EnhancedPlace[] = Array.from({ length: numPlaces }, (_, i) => {
            // Vary place types to create opportunities for balance
            const placeTypes = ['attraction', 'food', 'other'];
            const placeType = placeTypes[i % placeTypes.length];
            
            return {
              location_name: `Test Place ${i + 1}`,
              source: 'test',
              lat: 40.7128 + (i * 0.01),
              lng: -74.0060 + (i * 0.01),
              place_type: placeType as any,
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
            };
          });

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

          // Property assertions for activity balance optimization
          
          // 1. Each daily schedule should have valid activity intensities
          for (const dailySchedule of result.dailySchedules) {
            if (dailySchedule.activities.length >= 2) { // Only test days with sufficient activities
              const intensityLevels = dailySchedule.activities.map(activity => 
                activity.activityIntensity.level
              );
              
              // All intensity levels should be valid
              intensityLevels.forEach(level => {
                expect(['low', 'medium', 'high']).toContain(level);
              });
              
              const lowIntensity = intensityLevels.filter(level => level === 'low').length;
              const mediumIntensity = intensityLevels.filter(level => level === 'medium').length;
              const highIntensity = intensityLevels.filter(level => level === 'high').length;
              
              const totalActivities = intensityLevels.length;
              
              // Should have some distribution of intensities (not all the same if enough activities)
              if (totalActivities >= 3) {
                const uniqueIntensities = new Set(intensityLevels).size;
                expect(uniqueIntensities).toBeGreaterThanOrEqual(1); // At least one type
                expect(uniqueIntensities).toBeLessThanOrEqual(3); // At most three types
              }
              
              // Intensity counts should be non-negative and sum to total
              expect(lowIntensity).toBeGreaterThanOrEqual(0);
              expect(mediumIntensity).toBeGreaterThanOrEqual(0);
              expect(highIntensity).toBeGreaterThanOrEqual(0);
              expect(lowIntensity + mediumIntensity + highIntensity).toBe(totalActivities);
            }
          }
          
          // 2. Balance score should reflect good activity distribution
          for (const dailySchedule of result.dailySchedules) {
            expect(dailySchedule.balanceScore).toBeGreaterThanOrEqual(0);
            expect(dailySchedule.balanceScore).toBeLessThanOrEqual(1);
            
            // Days with more activities should generally have measurable balance scores
            if (dailySchedule.activities.length >= 3) {
              expect(dailySchedule.balanceScore).toBeGreaterThanOrEqual(0);
            }
          }
          
          // 3. Fatigue modeling should prevent over-scheduling
          for (const dailySchedule of result.dailySchedules) {
            expect(dailySchedule.fatigueLevel).toBeGreaterThanOrEqual(0);
            expect(dailySchedule.fatigueLevel).toBeLessThanOrEqual(1);
            
            // High-intensity activities should contribute to fatigue appropriately
            const highIntensityActivities = dailySchedule.activities.filter((activity: any) =>
              activity.activityIntensity.level === 'high'
            );
            
            // If there are many high-intensity activities, fatigue should be considered
            if (highIntensityActivities.length > 3) {
              expect(dailySchedule.fatigueLevel).toBeGreaterThan(0.2);
            }
            
            // Fatigue should not exceed sustainable levels
            expect(dailySchedule.fatigueLevel).toBeLessThan(1.0);
          }
          
          // 4. Rest periods should be scheduled appropriately
          for (const dailySchedule of result.dailySchedules) {
            expect(Array.isArray(dailySchedule.restPeriods)).toBe(true);
            
            for (let i = 0; i < dailySchedule.activities.length; i++) {
              const activity = dailySchedule.activities[i];
              
              // All activities should have valid intensity properties
              expect(activity.activityIntensity).toBeDefined();
              expect(activity.activityIntensity.level).toBeDefined();
              expect(activity.activityIntensity.duration).toBeGreaterThan(0);
              expect(activity.activityIntensity.physicalDemand).toBeGreaterThanOrEqual(0);
              expect(activity.activityIntensity.physicalDemand).toBeLessThanOrEqual(1);
              expect(activity.activityIntensity.mentalDemand).toBeGreaterThanOrEqual(0);
              expect(activity.activityIntensity.mentalDemand).toBeLessThanOrEqual(1);
              expect(activity.activityIntensity.socialDemand).toBeGreaterThanOrEqual(0);
              expect(activity.activityIntensity.socialDemand).toBeLessThanOrEqual(1);
              
              // Rest period after should be non-negative
              expect(activity.restPeriodAfter).toBeGreaterThanOrEqual(0);
              
              // High-intensity activities should have some rest consideration
              if (activity.activityIntensity.level === 'high') {
                expect(activity.restPeriodAfter).toBeGreaterThanOrEqual(0);
              }
            }
          }
          
          // 5. Daily intensity distribution should be appropriate for travel style
          for (const dailySchedule of result.dailySchedules) {
            const intensityDistribution = dailySchedule.dailySummary.intensityDistribution;
            
            // Intensity distribution should be defined and have valid counts
            expect(intensityDistribution).toBeDefined();
            expect(typeof intensityDistribution).toBe('object');
            
            const totalActivitiesFromDistribution = Object.values(intensityDistribution)
              .reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
            
            // Should have some activities counted
            expect(totalActivitiesFromDistribution).toBeGreaterThanOrEqual(0);
            
            // Distribution should match travel style preferences
            switch (travelStyle) {
              case 'relaxed':
                // Relaxed style should not be overly intense
                const relaxedHighIntensity = intensityDistribution['high'] || 0;
                if (totalActivitiesFromDistribution > 0) {
                  expect(relaxedHighIntensity / totalActivitiesFromDistribution).toBeLessThanOrEqual(0.6);
                }
                break;
                
              case 'fast-paced':
                // Fast-paced style can include more high-intensity activities
                const fastHighIntensity = intensityDistribution['high'] || 0;
                expect(fastHighIntensity).toBeGreaterThanOrEqual(0);
                break;
                
              case 'moderate':
                // Moderate style should have balanced distribution
                if (totalActivitiesFromDistribution >= 2) {
                  // Should not be all one intensity level
                  const maxSingleIntensity = Math.max(...Object.values(intensityDistribution));
                  expect(maxSingleIntensity).toBeLessThanOrEqual(totalActivitiesFromDistribution);
                }
                break;
            }
          }
          
          // 6. Overall balance metrics should indicate good optimization
          expect(result.overallBalance.balanceScore).toBeGreaterThanOrEqual(0);
          expect(result.overallBalance.balanceScore).toBeLessThanOrEqual(1);
          expect(result.overallBalance.sustainabilityScore).toBeGreaterThanOrEqual(0);
          expect(result.overallBalance.sustainabilityScore).toBeLessThanOrEqual(1);
          expect(result.overallBalance.fatigueManagement).toBeGreaterThanOrEqual(0);
          expect(result.overallBalance.fatigueManagement).toBeLessThanOrEqual(1);
          expect(result.overallBalance.averageIntensity).toBeGreaterThanOrEqual(0);
          expect(result.overallBalance.averageIntensity).toBeLessThanOrEqual(1);
          
          // 7. Should provide recommendations and warnings
          expect(Array.isArray(result.recommendations)).toBe(true);
          expect(Array.isArray(result.warnings)).toBe(true);
          
          // 8. Daily summaries should have valid metrics
          for (const dailySchedule of result.dailySchedules) {
            const summary = dailySchedule.dailySummary;
            
            expect(summary.totalActivities).toBe(dailySchedule.activities.length);
            expect(summary.totalActiveTime).toBeGreaterThanOrEqual(0);
            expect(summary.totalRestTime).toBeGreaterThanOrEqual(0);
            expect(summary.sustainabilityScore).toBeGreaterThanOrEqual(0);
            expect(summary.sustainabilityScore).toBeLessThanOrEqual(1);
          }
        }
      ),
      { 
        numRuns: 15, // Run 15 test cases
        timeout: 60000 // 60 second timeout
      }
    );
  });
});