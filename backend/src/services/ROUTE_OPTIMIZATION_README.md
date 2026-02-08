# Route Optimization System

## Overview

The Route Optimization System provides intelligent route planning and schedule generation for the Quick Plan Enhancement feature. It consists of two main services:

1. **RouteOptimizationService**: Handles geographical clustering, TSP-based route optimization, and travel mode selection
2. **ScheduleGenerationService**: Manages time allocation, opening hours validation, activity balance, and meal scheduling

## Features

### RouteOptimizationService

#### Core Capabilities
- **Geographical Clustering**: Groups nearby places using distance-based clustering (1.5km radius)
- **TSP Optimization**: Uses nearest neighbor heuristic to solve the Traveling Salesman Problem
- **Travel Mode Selection**: Automatically selects walking (<2km) or driving/transit (>2km)
- **Multi-day Optimization**: Optimizes itineraries across multiple days with cross-day considerations
- **Route Feasibility Validation**: Checks time constraints and provides warnings

#### Key Methods

```typescript
// Optimize a single day's route
static async optimizeDailyRoute(request: RouteOptimizationRequest): Promise<OptimizedRoute>

// Optimize multiple days with cross-day considerations
static async optimizeMultiDayItinerary(
  dailyPlaces: SuggestedPlace[][],
  travelInfo: { travelStyle: string; availableTimePerDay: number }
): Promise<OptimizedRoute[]>

// Generate complete schedule with time allocations
static async generateCompleteSchedule(
  request: RouteOptimizationRequest & {
    startTime: string;
    endTime: string;
    date?: string;
    includeMeals?: boolean;
  }
): Promise<{ optimizedRoute: OptimizedRoute; scheduledRoute: any }>
```

#### Optimization Algorithm

1. **Clustering Phase**
   - Groups places within 1.5km radius
   - Calculates cluster center points
   - Handles single and multiple cluster scenarios

2. **Route Optimization Phase**
   - Applies nearest neighbor heuristic for TSP
   - Optimizes cluster order for multi-cluster routes
   - Minimizes total travel distance

3. **Travel Mode Selection**
   - Walking: distances ≤ 2km
   - Driving/Transit: distances > 2km
   - Integrates with Google Directions API for accurate times

4. **Validation Phase**
   - Checks total time vs available time
   - Identifies long travel segments (>60 min)
   - Warns about high place density (>6 places)

#### Optimization Score

The optimization score (0-1) considers:
- Travel time ratio (penalizes >30% travel time)
- Number of warnings and errors
- Average segment time (bonus for <15 min segments)

### ScheduleGenerationService

#### Core Capabilities
- **Time Allocation**: Assigns specific time slots to each place
- **Meal Integration**: Schedules breakfast, lunch, and dinner breaks
- **Opening Hours Validation**: Ensures places are visited during open hours
- **Activity Balance**: Mixes active and relaxed activities
- **Free Time Management**: Ensures adequate spontaneous exploration time

#### Key Methods

```typescript
// Generate complete schedule with time allocations
static async generateSchedule(request: ScheduleGenerationRequest): Promise<ScheduledRoute>

// Calculate activity balance score
static calculateActivityBalance(places: ScheduledPlace[]): ActivityBalance

// Validate free time adequacy
static validateFreeTime(
  scheduledRoute: ScheduledRoute,
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced'
): { adequate: boolean; warnings: string[] }
```

#### Schedule Generation Process

1. **Time Calculation**
   - Calculates available time between start and end
   - Allocates time for visits, travel, buffers, and meals
   - Determines free time remaining

2. **Meal Scheduling**
   - Breakfast: 08:00 (45 min)
   - Lunch: 12:00 (60 min)
   - Dinner: 18:30 (90 min)
   - Aligns food places with meal times

3. **Time Slot Allocation**
   - Assigns start and end times to each place
   - Adds 15-minute buffers between activities
   - Integrates travel time from route segments

4. **Opening Hours Validation**
   - Checks day of week from date
   - Validates scheduled times against opening hours
   - Generates warnings for conflicts

5. **Activity Balance Check**
   - Classifies activities as active or relaxed
   - Calculates balance score (ideal: 50/50 split)
   - Warns about consecutive active activities (≥3)

#### Activity Classification

- **Active**: attraction, shopping, nature, culture
- **Relaxed**: food, hotel, entertainment, other

#### Free Time Requirements

- **Relaxed**: 120 minutes minimum
- **Moderate**: 60 minutes minimum
- **Fast-paced**: 30 minutes minimum

## Integration with Quick Plan

The route optimization system integrates with the Quick Plan Enhancement workflow:

1. **Place Suggestions**: Receives suggested places from LocationScraperService
2. **Route Optimization**: Optimizes the order and calculates travel times
3. **Schedule Generation**: Creates detailed time-based schedule
4. **Trip Creation**: Provides optimized data for trip generation

## Usage Example

```typescript
import { RouteOptimizationService } from './services/routeOptimizationService.js';
import { ScheduleGenerationService } from './services/scheduleGenerationService.js';

// Step 1: Optimize route
const routeRequest = {
  places: suggestedPlaces,
  travelStyle: 'moderate',
  availableTime: 480 // 8 hours
};

const optimizedRoute = await RouteOptimizationService.optimizeDailyRoute(routeRequest);

// Step 2: Generate schedule
const scheduleRequest = {
  optimizedRoute,
  startTime: '09:00',
  endTime: '18:00',
  travelStyle: 'moderate',
  date: '2024-01-15',
  includeMeals: true
};

const schedule = await ScheduleGenerationService.generateSchedule(scheduleRequest);

// Step 3: Validate and use
if (schedule.feasible) {
  // Create trip with optimized route and schedule
  console.log('Schedule is feasible!');
  console.log('Free time:', schedule.freeTime, 'minutes');
} else {
  console.log('Warnings:', schedule.warnings);
}
```

## Performance Considerations

### Optimization Complexity
- **Clustering**: O(n²) for distance calculations
- **TSP Heuristic**: O(n²) nearest neighbor
- **Overall**: Suitable for typical itineraries (3-10 places per day)

### Caching Strategy
- Route segments cached via Google Maps service
- Optimization results can be cached by place combination hash
- Schedule generation is fast (no external API calls)

### Fallback Behavior
- Falls back to simple geographical ordering if optimization fails
- Uses distance-based estimates if Google Directions API unavailable
- Gracefully handles missing opening hours data

## Testing

Run the test suite:

```bash
npx tsx src/utils/testRouteOptimization.ts
```

Tests cover:
- Empty and single place edge cases
- Multi-place optimization
- Schedule generation
- Activity balance calculation
- Multi-day optimization
- Opening hours validation

## Future Enhancements

1. **Advanced TSP Algorithms**: Implement 2-opt or genetic algorithms for better optimization
2. **Real-time Traffic**: Integrate traffic data for more accurate travel times
3. **User Preferences**: Learn from user modifications to improve suggestions
4. **Weather Integration**: Adjust schedules based on weather forecasts
5. **Crowd Prediction**: Avoid peak times at popular attractions
6. **Accessibility Options**: Consider mobility constraints in route planning

## Requirements Validation

This implementation satisfies the following requirements:

- **4.1**: Geographical clustering and TSP-based optimization ✓
- **4.2**: Travel time minimization with opening hours consideration ✓
- **4.3**: Geographical clustering of nearby places ✓
- **4.4**: Travel mode selection based on distance ✓
- **4.5**: Realistic schedule validation with time buffers ✓
- **4.7**: Multi-day optimization with cross-day considerations ✓
- **7.2**: Time allocation based on place types ✓
- **7.3**: Meal time integration ✓
- **7.4**: Realistic schedule validation ✓
- **7.5**: Opening hours compliance checking ✓
- **7.6**: Activity balance algorithm ✓
- **7.7**: Adequate free time for exploration ✓
