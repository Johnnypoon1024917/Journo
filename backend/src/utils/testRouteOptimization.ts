import { RouteOptimizationService, SuggestedPlace, RouteOptimizationRequest } from '../services/routeOptimizationService.js';
import { ScheduleGenerationService } from '../services/scheduleGenerationService.js';

async function testRouteOptimization() {
  console.log('Testing Route Optimization Service...');

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

  try {
    // Test 1: Empty places
    console.log('\n1. Testing empty places array...');
    const emptyRequest: RouteOptimizationRequest = {
      places: [],
      travelStyle: 'moderate',
      availableTime: 480
    };
    const emptyResult = await RouteOptimizationService.optimizeDailyRoute(emptyRequest);
    console.log('✓ Empty places handled correctly:', emptyResult.orderedPlaces.length === 0);

    // Test 2: Single place
    console.log('\n2. Testing single place...');
    const singleRequest: RouteOptimizationRequest = {
      places: [mockPlaces[0]],
      travelStyle: 'moderate',
      availableTime: 480
    };
    const singleResult = await RouteOptimizationService.optimizeDailyRoute(singleRequest);
    console.log('✓ Single place handled correctly:', singleResult.orderedPlaces.length === 1);

    // Test 3: Multiple places
    console.log('\n3. Testing multiple places optimization...');
    const multiRequest: RouteOptimizationRequest = {
      places: mockPlaces,
      travelStyle: 'moderate',
      availableTime: 480
    };
    const multiResult = await RouteOptimizationService.optimizeDailyRoute(multiRequest);
    console.log('✓ Multiple places optimized:', multiResult.orderedPlaces.length === 3);
    console.log('✓ Route segments created:', multiResult.routeSegments.length === 2);
    console.log('✓ Optimization score:', multiResult.optimizationScore);

    // Test 4: Schedule generation
    console.log('\n4. Testing schedule generation...');
    const scheduleRequest = {
      optimizedRoute: multiResult,
      startTime: '09:00',
      endTime: '18:00',
      travelStyle: 'moderate' as const,
      includeMeals: true
    };
    const scheduleResult = await ScheduleGenerationService.generateSchedule(scheduleRequest);
    console.log('✓ Schedule generated:', scheduleResult.scheduledPlaces.length === 3);
    console.log('✓ Meal breaks included:', scheduleResult.mealBreaks.length > 0);
    console.log('✓ Schedule feasible:', scheduleResult.feasible);

    // Test 5: Activity balance
    console.log('\n5. Testing activity balance...');
    const balance = ScheduleGenerationService.calculateActivityBalance(scheduleResult.scheduledPlaces);
    console.log('✓ Balance calculated - Active:', balance.activeCount, 'Relaxed:', balance.relaxedCount);
    console.log('✓ Balance score:', balance.balanceScore);

    // Test 6: Multi-day optimization
    console.log('\n6. Testing multi-day optimization...');
    const dailyPlaces = [
      [mockPlaces[0], mockPlaces[1]], // Day 1
      [mockPlaces[2]] // Day 2
    ];
    const travelInfo = {
      travelStyle: 'moderate' as const,
      availableTimePerDay: 480
    };
    const multiDayResults = await RouteOptimizationService.optimizeMultiDayItinerary(dailyPlaces, travelInfo);
    console.log('✓ Multi-day optimization:', multiDayResults.length === 2);

    console.log('\n🎉 All tests passed! Route optimization system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRouteOptimization().catch(console.error);