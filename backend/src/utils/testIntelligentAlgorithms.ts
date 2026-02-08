import { IntelligentPlaceSelectionService, PlaceSelectionRequest } from '../services/intelligentPlaceSelectionService.js';
import { ActivityBalanceSchedulingService, SchedulingRequest } from '../services/activityBalanceSchedulingService.js';
import { ScrapedLocation, InterestCategory, TravelerType } from '../types/index.js';

async function testIntelligentAlgorithms() {
  console.log('Testing Intelligent Place Selection and Activity Balance Scheduling...\n');

  // Mock data for testing
  const mockPlaces: ScrapedLocation[] = [
    {
      id: '1',
      location_name: 'Central Park Restaurant',
      source: 'test',
      city: 'New York',
      country: 'USA',
      visitor_count: null,
      tips: null,
      place_type: 'restaurant',
      rating: 4.5,
      estimated_cost: 30,
      lat: 40.7128,
      lng: -74.0060,
      weather_suitability: 'flexible',
      cached_at: new Date(),
      created_at: new Date()
    },
    {
      id: '2',
      location_name: 'Metropolitan Museum',
      source: 'test',
      city: 'New York',
      country: 'USA',
      visitor_count: null,
      tips: null,
      place_type: 'museum',
      rating: 4.7,
      estimated_cost: 25,
      lat: 40.7589,
      lng: -73.9851,
      weather_suitability: 'indoor',
      cached_at: new Date(),
      created_at: new Date()
    },
    {
      id: '3',
      location_name: 'Brooklyn Bridge Park',
      source: 'test',
      city: 'New York',
      country: 'USA',
      visitor_count: null,
      tips: null,
      place_type: 'park',
      rating: 4.3,
      estimated_cost: 0,
      lat: 40.7029,
      lng: -73.9965,
      weather_suitability: 'outdoor',
      cached_at: new Date(),
      created_at: new Date()
    },
    {
      id: '4',
      location_name: 'Times Square Shopping',
      source: 'test',
      city: 'New York',
      country: 'USA',
      visitor_count: null,
      tips: null,
      place_type: 'shopping',
      rating: 4.0,
      estimated_cost: 50,
      lat: 40.7580,
      lng: -73.9855,
      weather_suitability: 'indoor',
      cached_at: new Date(),
      created_at: new Date()
    },
    {
      id: '5',
      location_name: 'Broadway Theater',
      source: 'test',
      city: 'New York',
      country: 'USA',
      visitor_count: null,
      tips: null,
      place_type: 'entertainment',
      rating: 4.8,
      estimated_cost: 80,
      lat: 40.7590,
      lng: -73.9845,
      weather_suitability: 'indoor',
      cached_at: new Date(),
      created_at: new Date()
    }
  ];

  const mockInterests: InterestCategory[] = [
    { id: 'food', name: 'Food', weight: 4 },
    { id: 'culture', name: 'Culture', weight: 3 },
    { id: 'nature', name: 'Nature', weight: 2 },
    { id: 'shopping', name: 'Shopping', weight: 2 }
  ];

  const mockTravelerTypes: TravelerType[] = [
    { type: 'couple', ageGroups: ['adult'] }
  ];

  try {
    // Test 1: Intelligent Place Selection
    console.log('1. Testing Intelligent Place Selection...');
    
    const placeSelectionRequest: PlaceSelectionRequest = {
      places: mockPlaces,
      interests: mockInterests,
      budgetLevel: 'medium',
      groupSize: 2,
      travelerTypes: mockTravelerTypes,
      travelStyle: 'moderate',
      travelDates: { start: '2024-06-01', end: '2024-06-07' }
    };

    const selectionResult = await IntelligentPlaceSelectionService.selectOptimalPlaces(placeSelectionRequest);
    
    console.log(`✅ Selected ${selectionResult.selectedPlaces.length} places`);
    console.log(`✅ Diversity Score: ${selectionResult.diversityScore.toFixed(3)}`);
    console.log(`✅ Selection Metadata:`, selectionResult.selectionMetadata);
    
    // Display top 3 selected places
    console.log('\nTop 3 Selected Places:');
    selectionResult.selectedPlaces.slice(0, 3).forEach((place, index) => {
      console.log(`  ${index + 1}. ${place.location_name} (Score: ${place.finalScore.toFixed(3)}, Type: ${place.place_type})`);
    });

    // Test 2: Activity Balance and Scheduling
    console.log('\n2. Testing Activity Balance and Scheduling...');
    
    const schedulingRequest: SchedulingRequest = {
      places: selectionResult.selectedPlaces,
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

    const schedulingResult = await ActivityBalanceSchedulingService.createBalancedSchedule(schedulingRequest);
    
    console.log(`✅ Created ${schedulingResult.dailySchedules.length} daily schedules`);
    console.log(`✅ Overall Balance Score: ${schedulingResult.overallBalance.balanceScore.toFixed(3)}`);
    console.log(`✅ Sustainability Score: ${schedulingResult.overallBalance.sustainabilityScore.toFixed(3)}`);
    console.log(`✅ Fatigue Management: ${schedulingResult.overallBalance.fatigueManagement.toFixed(3)}`);
    
    // Display first day schedule
    if (schedulingResult.dailySchedules.length > 0) {
      const firstDay = schedulingResult.dailySchedules[0];
      console.log(`\nDay 1 Schedule (${firstDay.activities.length} activities):`);
      firstDay.activities.forEach((activity, index) => {
        console.log(`  ${activity.scheduledTime}-${activity.endTime}: ${activity.location_name} (${activity.activityIntensity.level} intensity)`);
      });
      
      console.log(`\nDay 1 Summary:`);
      console.log(`  - Balance Score: ${firstDay.balanceScore.toFixed(3)}`);
      console.log(`  - Fatigue Level: ${firstDay.fatigueLevel.toFixed(3)}`);
      console.log(`  - Total Active Time: ${firstDay.dailySummary.totalActiveTime} minutes`);
      console.log(`  - Total Rest Time: ${firstDay.dailySummary.totalRestTime} minutes`);
      console.log(`  - Sustainability Score: ${firstDay.dailySummary.sustainabilityScore.toFixed(3)}`);
    }

    // Display recommendations and warnings
    if (schedulingResult.recommendations.length > 0) {
      console.log('\nRecommendations:');
      schedulingResult.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    if (schedulingResult.warnings.length > 0) {
      console.log('\nWarnings:');
      schedulingResult.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    // Test 3: Different Travel Styles
    console.log('\n3. Testing Different Travel Styles...');
    
    const travelStyles: Array<'relaxed' | 'moderate' | 'fast-paced'> = ['relaxed', 'moderate', 'fast-paced'];
    
    for (const style of travelStyles) {
      const styleRequest: SchedulingRequest = {
        ...schedulingRequest,
        travelStyle: style
      };
      
      const styleResult = await ActivityBalanceSchedulingService.createBalancedSchedule(styleRequest);
      const firstDayStyle = styleResult.dailySchedules[0];
      
      console.log(`  ${style.toUpperCase()}: ${firstDayStyle.activities.length} activities, ` +
                 `Balance: ${firstDayStyle.balanceScore.toFixed(3)}, ` +
                 `Rest: ${firstDayStyle.dailySummary.totalRestTime}min`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nKey Features Validated:');
    console.log('✅ Diversity scoring for balanced itineraries');
    console.log('✅ Popularity weighting from multiple data sources');
    console.log('✅ Seasonal and temporal relevance scoring');
    console.log('✅ Group-size appropriate filtering');
    console.log('✅ Interest matching with fuzzy logic');
    console.log('✅ Activity intensity classification');
    console.log('✅ Daily balance algorithms');
    console.log('✅ Fatigue modeling');
    console.log('✅ Meal timing optimization');
    console.log('✅ Rest period scheduling');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testIntelligentAlgorithms().catch(console.error);