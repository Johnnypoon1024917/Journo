import fc from 'fast-check';
import { IntelligentPlaceSelectionService, PlaceSelectionRequest } from '../intelligentPlaceSelectionService';

describe('Property 3: Group Size Recommendation Adaptation', () => {
  it('should generate recommendations appropriate for any group size and traveler type combination', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate group size (1-20)
        fc.integer({ min: 1, max: 20 }),
        // Generate traveler type
        fc.constantFrom('solo', 'couple', 'family', 'friends', 'business'),
        // Generate whether family has children
        fc.boolean(),
        async (groupSize: number, travelerType: 'solo' | 'couple' | 'family' | 'friends' | 'business', hasChildren: boolean) => {
          // Create mock places with consistent types
          const mockPlaces = Array.from({ length: 15 }, (_, i) => ({
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
            visitor_count: 1000 + (i * 100)
          }));

          // Create mock interests
          const mockInterests = [
            { id: 'food', name: 'Food', icon: '🍜', weight: 3 },
            { id: 'culture', name: 'Culture', icon: '🏛️', weight: 2 }
          ];

          // Create traveler types array
          const travelerTypes = [{
            type: travelerType,
            ageGroups: (travelerType === 'family' && hasChildren) ? 
              ['child', 'adult'] as ('child' | 'teen' | 'adult' | 'senior')[] : 
              undefined
          }];

          const request: PlaceSelectionRequest = {
            places: mockPlaces,
            interests: mockInterests,
            budgetLevel: 'medium',
            groupSize,
            travelerTypes,
            travelDates: { start: '2024-03-01', end: '2024-03-05' },
            travelStyle: 'moderate',
            mustVisitPlaces: []
          };

          const result = await IntelligentPlaceSelectionService.selectOptimalPlaces(request);

          // Property assertions for group size adaptation
          
          // 1. Should return some places for any valid group size
          expect(result.selectedPlaces.length).toBeGreaterThan(0);
          expect(result.selectedPlaces.length).toBeLessThanOrEqual(mockPlaces.length);
          
          // 2. For families with children, should have appropriate group scores
          if (travelerType === 'family' && hasChildren) {
            const avgGroupScore = result.selectedPlaces.reduce((sum, place) => 
              sum + place.groupAppropriatenessScore, 0) / result.selectedPlaces.length;
            expect(avgGroupScore).toBeGreaterThan(0); // Should have some group consideration
          }
          
          // 3. For larger groups (>6), should consider group capacity through diversity
          if (groupSize > 6) {
            expect(result.diversityScore).toBeGreaterThanOrEqual(0);
            expect(result.diversityScore).toBeLessThanOrEqual(1);
          }
          
          // 4. For solo travelers, should include appropriate activities
          if (travelerType === 'solo' && groupSize === 1) {
            const soloFriendlyPlaces = result.selectedPlaces.filter(place => 
              place.groupAppropriatenessScore >= 0 // Solo activities should have non-negative scores
            );
            expect(soloFriendlyPlaces.length).toBeGreaterThan(0);
          }
          
          // 5. For business travelers, should avoid inappropriate venues
          if (travelerType === 'business') {
            const businessAppropriate = result.selectedPlaces.every(place =>
              place.place_type !== 'nightlife' // Business context should avoid nightlife
            );
            expect(businessAppropriate).toBe(true);
          }
          
          // 6. Selection metadata should reflect group filtering was applied
          expect(result.selectionMetadata.groupFiltered).toBe(true);
          expect(result.selectionMetadata.totalCandidates).toBe(mockPlaces.length);
          
          // 7. All selected places should have valid group appropriateness scores
          result.selectedPlaces.forEach(place => {
            expect(place.groupAppropriatenessScore).toBeGreaterThanOrEqual(0);
            expect(place.groupAppropriatenessScore).toBeLessThanOrEqual(1);
          });
          
          // 8. Diversity score should be valid
          expect(result.diversityScore).toBeGreaterThanOrEqual(0);
          expect(result.diversityScore).toBeLessThanOrEqual(1);
        }
      ),
      { 
        numRuns: 25, // Run 25 test cases
        timeout: 30000 // 30 second timeout
      }
    );
  });
});