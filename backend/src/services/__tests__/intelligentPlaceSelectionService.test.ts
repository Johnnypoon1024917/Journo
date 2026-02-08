import { IntelligentPlaceSelectionService, PlaceSelectionRequest } from '../intelligentPlaceSelectionService.js';
import { ScrapedLocation, InterestCategory, TravelerType } from '../locationScraperService.js';

describe('IntelligentPlaceSelectionService', () => {
  const mockPlaces: ScrapedLocation[] = [
    {
      location_name: 'Test Restaurant',
      source: 'test',
      place_type: 'restaurant',
      rating: 4.5,
      estimated_cost: 30,
      lat: 40.7128,
      lng: -74.0060
    },
    {
      location_name: 'Test Museum',
      source: 'test',
      place_type: 'museum',
      rating: 4.2,
      estimated_cost: 15,
      lat: 40.7589,
      lng: -73.9851
    },
    {
      location_name: 'Test Park',
      source: 'test',
      place_type: 'park',
      rating: 4.0,
      estimated_cost: 0,
      lat: 40.7829,
      lng: -73.9654
    }
  ];

  const mockInterests: InterestCategory[] = [
    { id: 'food', name: 'Food', icon: '🍽️', weight: 4 },
    { id: 'culture', name: 'Culture', icon: '🏛️', weight: 3 },
    { id: 'nature', name: 'Nature', icon: '🌳', weight: 2 }
  ];

  const mockTravelerTypes: TravelerType[] = [
    { type: 'couple', ageGroups: ['adult'] }
  ];

  it('should select optimal places with diversity scoring', async () => {
    const request: PlaceSelectionRequest = {
      places: mockPlaces,
      interests: mockInterests,
      budgetLevel: 'medium',
      groupSize: 2,
      travelerTypes: mockTravelerTypes,
      travelStyle: 'moderate',
      travelDates: { start: '2024-06-01', end: '2024-06-07' }
    };

    const result = await IntelligentPlaceSelectionService.selectOptimalPlaces(request);

    expect(result.selectedPlaces).toBeDefined();
    expect(result.selectedPlaces.length).toBeGreaterThan(0);
    expect(result.diversityScore).toBeGreaterThan(0);
    expect(result.selectionMetadata.diversityApplied).toBe(true);
    expect(result.selectionMetadata.popularityWeighted).toBe(true);
    expect(result.selectionMetadata.seasonalAdjusted).toBe(true);
    expect(result.selectionMetadata.groupFiltered).toBe(true);
    expect(result.selectionMetadata.interestMatched).toBe(true);
  });

  it('should handle empty places array', async () => {
    const request: PlaceSelectionRequest = {
      places: [],
      interests: mockInterests,
      budgetLevel: 'medium',
      groupSize: 2,
      travelerTypes: mockTravelerTypes,
      travelStyle: 'moderate'
    };

    const result = await IntelligentPlaceSelectionService.selectOptimalPlaces(request);

    expect(result.selectedPlaces).toEqual([]);
    expect(result.diversityScore).toBe(0);
  });

  it('should prioritize places based on interest weights', async () => {
    const foodInterests: InterestCategory[] = [
      { id: 'food', name: 'Food', icon: '🍽️', weight: 5 }
    ];

    const request: PlaceSelectionRequest = {
      places: mockPlaces,
      interests: foodInterests,
      budgetLevel: 'medium',
      groupSize: 2,
      travelerTypes: mockTravelerTypes,
      travelStyle: 'moderate'
    };

    const result = await IntelligentPlaceSelectionService.selectOptimalPlaces(request);

    // Restaurant should have higher score due to food interest
    const restaurant = result.selectedPlaces.find(p => p.place_type === 'restaurant');
    expect(restaurant).toBeDefined();
    expect(restaurant!.interestMatchScore).toBeGreaterThan(0.5);
  });

  it('should adjust for group size appropriateness', async () => {
    const largeGroupRequest: PlaceSelectionRequest = {
      places: mockPlaces,
      interests: mockInterests,
      budgetLevel: 'medium',
      groupSize: 15, // Large group
      travelerTypes: [{ type: 'friends' }],
      travelStyle: 'moderate'
    };

    const result = await IntelligentPlaceSelectionService.selectOptimalPlaces(largeGroupRequest);

    expect(result.selectedPlaces).toBeDefined();
    // All places should have group appropriateness scores
    result.selectedPlaces.forEach(place => {
      expect(place.groupAppropriatenessScore).toBeGreaterThanOrEqual(0);
      expect(place.groupAppropriatenessScore).toBeLessThanOrEqual(1);
    });
  });

  it('should handle family-friendly filtering', async () => {
    const familyTravelers: TravelerType[] = [
      { type: 'family', ageGroups: ['adult', 'child'] }
    ];

    const nightlifePlace: ScrapedLocation = {
      location_name: 'Test Nightclub',
      source: 'test',
      place_type: 'nightlife',
      rating: 4.0,
      estimated_cost: 50
    };

    const request: PlaceSelectionRequest = {
      places: [...mockPlaces, nightlifePlace],
      interests: mockInterests,
      budgetLevel: 'medium',
      groupSize: 4,
      travelerTypes: familyTravelers,
      travelStyle: 'moderate'
    };

    const result = await IntelligentPlaceSelectionService.selectOptimalPlaces(request);

    // Nightlife places should have lower scores for families with children
    const nightclub = result.selectedPlaces.find(p => p.place_type === 'nightlife');
    if (nightclub) {
      expect(nightclub.groupAppropriatenessScore).toBeLessThan(0.5);
    }
  });
});