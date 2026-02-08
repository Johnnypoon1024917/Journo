import { pool } from '../config/database.js';
import { LocationScraperService } from './locationScraperService.js';
import { weatherService, WeatherData } from './weatherService.js';
import { WeatherBasedPlaceFilteringService, PlaceWithWeatherSuitability } from './weatherBasedPlaceFilteringService.js';
import { BudgetIntegrationService } from './budgetIntegrationService.js';
import { QuickPlanCompatibilityService } from './quickPlanCompatibilityService.js';
import { IntelligentPlaceSelectionService, PlaceSelectionRequest } from './intelligentPlaceSelectionService.js';
import { ActivityBalanceSchedulingService, SchedulingRequest } from './activityBalanceSchedulingService.js';
import { QuickPlanPerformanceService } from './quickPlanPerformanceService.js';
import { QuickPlanAnalyticsService } from './quickPlanAnalyticsService.js';
import { v4 as uuidv4 } from 'uuid';

export interface QuickPlanRequest {
  destination: string;
  startDate: string;
  duration: number; // days
  interests?: string[]; // e.g., ['food', 'culture', 'adventure']
  budget?: 'low' | 'medium' | 'high';
  enableWeatherOptimization?: boolean; // Default true
}

export interface EnhancedQuickPlanRequest {
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  interests: Array<{
    id: string;
    name: string;
    icon: string;
    weight: number;
  }>;
  budgetLevel: 'low' | 'medium' | 'high';
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced';
  groupSize: number;
  travelerTypes: Array<{
    type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
    ageGroups?: ('child' | 'teen' | 'adult' | 'senior')[];
  }>;
  mustVisitPlaces?: string[];
  enableWeatherOptimization?: boolean;
}

export interface QuickPlanResult {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  suggestedPlaces: Array<{
    dayNumber: number;
    date: string;
    weatherClassification?: any;
    places: PlaceWithWeatherSuitability[];
  }>;
  weatherForecast?: WeatherData;
  packingList?: string[];
  weatherOptimizationApplied?: boolean;
}

export interface EnhancedQuickPlanResult {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  theme: string;
  totalBudget: number;
  currencyCode: string;
  suggestedPlaces: Array<{
    dayNumber: number;
    date: string;
    weather?: any;
    places: PlaceWithWeatherSuitability[];
    totalTravelTime: number;
    estimatedCost: number;
  }>;
  weatherForecast?: WeatherData;
  packingList?: string[];
  budgetEntries: Array<{
    category: string;
    amount: number;
    currency: string;
  }>;
  success: boolean;
  message?: string;
  shareToken?: string;
  compatibilityReport?: {
    collaboration: boolean;
    sharing: boolean;
    maps: boolean;
    budget: boolean;
    realtime: boolean;
    badges: boolean;
    export: boolean;
  };
}

export class QuickPlanService {
  // Enhanced trip generation from approved suggestions with intelligent algorithms
  static async generateTripFromSuggestions(
    userId: string,
    request: EnhancedQuickPlanRequest,
    approvedSuggestions: Array<{
      dayNumber: number;
      date: string;
      weather?: any;
      places: PlaceWithWeatherSuitability[];
      totalTravelTime: number;
      estimatedCost: number;
    }>
  ): Promise<EnhancedQuickPlanResult> {
    // Start performance tracking
    const sessionId = await QuickPlanPerformanceService.startPerformanceTracking(
      userId,
      request.destination,
      {
        interests: request.interests,
        budgetLevel: request.budgetLevel,
        travelStyle: request.travelStyle,
        groupSize: request.groupSize
      }
    );

    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Track usage analytics
      await QuickPlanAnalyticsService.trackQuickPlanUsage(
        userId,
        request.destination,
        request.interests.map(i => i.name),
        request.budgetLevel,
        request.travelStyle,
        request.groupSize,
        sessionId
      );

      const { 
        destination, 
        startDate, 
        endDate, 
        duration, 
        interests, 
        budgetLevel,
        travelStyle,
        groupSize,
        travelerTypes,
        enableWeatherOptimization = true
      } = request;

      // Update performance metrics - place search stage
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'place_search',
        { placesFound: approvedSuggestions.reduce((sum, day) => sum + day.places.length, 0) }
      );

      // Apply intelligent place selection algorithms to approved suggestions
      const allPlaces = approvedSuggestions.flatMap(day => day.places.map(place => ({
        id: `place-${Date.now()}-${Math.random()}`,
        location_name: place.name,
        source: 'user_approved',
        visitor_count: null,
        rating: place.rating || null,
        tips: place.tips || null,
        lat: place.lat,
        lng: place.lng,
        city: 'Unknown',
        country: 'Unknown',
        place_type: place.placeType as any, // Cast to avoid type issues
        estimated_cost: place.estimatedCost,
        estimated_duration: 120, // Default duration
        budget_category: 'medium' as const,
        interest_match: 0.7, // Default interest match
        popularity_score: place.rating ? place.rating / 5 : 0.5,
        weather_suitability: place.weatherCategory || 'flexible',
        opening_hours: undefined,
        crowd_level: 'medium' as const,
        cached_at: new Date(),
        created_at: new Date()
      })));
      
      const placeSelectionRequest: PlaceSelectionRequest = {
        places: allPlaces,
        interests,
        budgetLevel,
        groupSize,
        travelerTypes,
        travelDates: { start: startDate, end: endDate },
        travelStyle,
        mustVisitPlaces: request.mustVisitPlaces
      };

      console.log('Applying intelligent place selection algorithms...');
      const intelligentSelection = await IntelligentPlaceSelectionService.selectOptimalPlaces(placeSelectionRequest);
      
      // Update performance metrics - route optimization stage
      const routeOptimizationStart = Date.now();
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'route_optimization',
        {}
      );

      // Apply activity balance and scheduling algorithms
      const schedulingRequest: SchedulingRequest = {
        places: intelligentSelection.selectedPlaces,
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

      console.log('Applying activity balance and scheduling algorithms...');
      const balancedSchedule = await ActivityBalanceSchedulingService.createBalancedSchedule(schedulingRequest);
      
      const routeOptimizationTime = Date.now() - routeOptimizationStart;
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'route_optimization',
        { routeOptimizationTime }
      );

      // Determine theme based on dominant interests
      const theme = this.determineThemeFromInterests(interests);
      
      // Calculate total budget based on suggestions and budget level
      const totalEstimatedCost = approvedSuggestions.reduce((sum, day) => sum + day.estimatedCost, 0);
      const totalBudget = this.calculateTotalBudget(totalEstimatedCost, budgetLevel);
      const currencyCode = this.determineCurrencyFromDestination(destination);

      // Update performance metrics - trip creation stage
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'trip_creation',
        {}
      );

      // Create trip
      const tripId = uuidv4();
      const tripTitle = `${destination} ${this.getTripTitleSuffix(theme)}`;
      
      const tripQuery = `
        INSERT INTO trips (
          id, title, destination, start_date, end_date, owner_id, 
          is_public, theme, total_budget, currency_code, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `;
      
      await client.query(tripQuery, [
        tripId,
        tripTitle,
        destination,
        startDate,
        endDate,
        userId,
        false, // Default to private
        theme,
        totalBudget,
        currencyCode
      ]);

      // Get weather forecast and cache it
      let weatherForecast: WeatherData | undefined;
      const weatherApiStart = Date.now();
      if (enableWeatherOptimization) {
        try {
          const coordinates = await weatherService.geocodeLocation(destination);
          weatherForecast = await weatherService.getTravelPeriodForecast(
            coordinates.lat,
            coordinates.lng,
            startDate,
            endDate
          );
          await weatherService.cacheWeatherDataForTrip(tripId, weatherForecast);
        } catch (error) {
          console.error('Error fetching weather forecast:', error);
        }
      }
      const weatherApiTime = Date.now() - weatherApiStart;

      // Create budget tracking entries based on place cost estimates
      const placesForBudget = intelligentSelection.selectedPlaces.map(place => ({
        name: place.location_name,
        estimatedCost: place.estimated_cost || 0,
        placeType: place.place_type || 'other',
        currency: currencyCode
      }));

      const budgetEntries = await BudgetIntegrationService.createBudgetEntriesFromPlaces(
        placesForBudget,
        currencyCode
      );

      // Validate budget consistency
      const budgetValidation = await BudgetIntegrationService.validateBudgetConsistency(
        totalBudget,
        budgetEntries
      );

      if (!budgetValidation.isConsistent && budgetValidation.recommendation) {
        console.warn(`Budget inconsistency detected: ${budgetValidation.recommendation}`);
      }

      // Create trip days and places using balanced schedule
      for (const dailySchedule of balancedSchedule.dailySchedules) {
        const dayId = uuidv4();
        const dayQuery = `
          INSERT INTO trip_days (id, trip_id, day_number, date, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING *
        `;
        
        await client.query(dayQuery, [
          dayId,
          tripId,
          dailySchedule.dayNumber,
          dailySchedule.date
        ]);

        // Add scheduled activities for this day
        for (let i = 0; i < dailySchedule.activities.length; i++) {
          const activity = dailySchedule.activities[i];
          const placeId = uuidv4();
          
          // Determine budget category based on place type
          const budgetCategory = BudgetIntegrationService.mapPlaceTypeToBudgetCategory(activity.place_type || 'other');
          
          const placeQuery = `
            INSERT INTO places (
              id, trip_day_id, name, address, lat, lng, 
              place_type, notes, cost, cost_currency, budget_category,
              time_start, time_end, calculated_arrival_time,
              display_order, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
          `;
          
          await client.query(placeQuery, [
            placeId,
            dayId,
            activity.location_name,
            activity.source || '',
            activity.lat,
            activity.lng,
            activity.place_type,
            activity.tips || '',
            activity.estimated_cost,
            currencyCode,
            budgetCategory,
            activity.scheduledTime,
            activity.endTime,
            activity.scheduledTime,
            i + 1
          ]);
        }
      }

      // Generate weather-appropriate packing list
      const packingList = await this.generateWeatherAwarePackingList(
        destination, 
        weatherForecast, 
        duration,
        interests,
        travelStyle
      );

      await client.query('COMMIT');

      // Ensure full compatibility with existing features
      const compatibilityResult = await QuickPlanCompatibilityService.ensureFullCompatibility(tripId, userId);
      
      if (!compatibilityResult.success) {
        console.warn('Quick Plan trip compatibility issues:', compatibilityResult.issues);
      }

      // Track conversion
      await QuickPlanAnalyticsService.trackConversion(
        userId,
        sessionId,
        tripId,
        approvedSuggestions.length,
        0 // No customizations in this flow
      );

      // Convert balanced schedule back to the expected format
      const enhancedSuggestions = balancedSchedule.dailySchedules.map(schedule => ({
        dayNumber: schedule.dayNumber,
        date: schedule.date,
        weather: undefined, // Will be populated from weather forecast if available
        places: schedule.activities.map(activity => ({
          name: activity.location_name,
          address: activity.source || '',
          lat: activity.lat || 0,
          lng: activity.lng || 0,
          placeType: activity.place_type || 'other',
          rating: activity.rating || undefined,
          tips: activity.tips || undefined,
          estimatedCost: activity.estimated_cost || 0,
          weatherSuitability: activity.weather_suitability === 'indoor' ? 1 : 
                             activity.weather_suitability === 'outdoor' ? 0 : 0.5,
          weatherCategory: activity.weather_suitability
        })),
        totalTravelTime: schedule.activities.reduce((sum, a) => sum + (a.transportTime || 0), 0),
        estimatedCost: schedule.activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0)
      }));

      // Complete performance tracking
      const totalTime = Date.now() - startTime;
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'completed',
        {
          generationTime: totalTime,
          weatherApiTime,
          externalApiCalls: 1 // Weather API call
        }
      );

      await QuickPlanPerformanceService.completePerformanceTracking(
        sessionId,
        true
      );

      console.log(`Trip created successfully with intelligent algorithms. Diversity score: ${intelligentSelection.diversityScore.toFixed(2)}, Balance score: ${balancedSchedule.overallBalance.balanceScore.toFixed(2)}`);

      return {
        tripId,
        destination: request.destination,
        startDate: request.startDate,
        endDate: request.endDate,
        theme,
        totalBudget,
        currencyCode,
        suggestedPlaces: enhancedSuggestions,
        weatherForecast,
        packingList,
        budgetEntries,
        success: true,
        message: `Trip created successfully with intelligent algorithms. Diversity: ${intelligentSelection.diversityScore.toFixed(2)}, Balance: ${balancedSchedule.overallBalance.balanceScore.toFixed(2)}`,
        shareToken: compatibilityResult.shareToken,
        compatibilityReport: compatibilityResult.compatibilityReport
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating trip from suggestions:', error);
      
      // Track error in performance monitoring
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'error',
        { errorCount: 1 },
        error instanceof Error ? error.message : 'Unknown error'
      );

      await QuickPlanPerformanceService.completePerformanceTracking(
        sessionId,
        false
      );
      
      return {
        tripId: '',
        destination: request.destination,
        startDate: request.startDate,
        endDate: request.endDate,
        theme: 'default',
        totalBudget: 0,
        currencyCode: 'USD',
        suggestedPlaces: approvedSuggestions,
        budgetEntries: [],
        success: false,
        message: 'Failed to create trip. Please try again.'
      };
    } finally {
      client.release();
    }
  }

  // Generate a quick plan based on destination and preferences
  static async generateQuickPlan(
    userId: string,
    request: QuickPlanRequest
  ): Promise<QuickPlanResult> {
    const { 
      destination, 
      startDate, 
      duration, 
      interests = [], 
      budget = 'medium',
      enableWeatherOptimization = true
    } = request;

    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + duration - 1);

    // Create trip
    const tripId = uuidv4();
    const tripQuery = `
      INSERT INTO trips (id, title, destination, start_date, end_date, owner_id, is_public, theme, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const theme = this.determineTheme(interests);
    const tripTitle = `${destination} Adventure`;
    
    await pool.query(tripQuery, [
      tripId,
      tripTitle,
      destination,
      startDate,
      end.toISOString().split('T')[0],
      userId,
      false,
      theme
    ]);

    // Get weather forecast for the travel period
    let weatherForecast: WeatherData | undefined;
    let weatherOptimizationApplied = false;

    if (enableWeatherOptimization) {
      try {
        // Get coordinates for destination
        const coordinates = await weatherService.geocodeLocation(destination);
        weatherForecast = await weatherService.getTravelPeriodForecast(
          coordinates.lat,
          coordinates.lng,
          startDate,
          end.toISOString().split('T')[0]
        );

        // Cache weather data in trip
        await weatherService.cacheWeatherDataForTrip(tripId, weatherForecast);
        weatherOptimizationApplied = true;
      } catch (error) {
        console.error('Error fetching weather forecast:', error);
      }
    }

    // Get suggested places using location scraper
    const suggestedPlaces = await this.getSuggestedPlacesWithWeather(
      destination, 
      duration, 
      interests, 
      budget,
      weatherForecast,
      startDate
    );

    // Create trip days and places
    for (let dayNum = 1; dayNum <= duration; dayNum++) {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + dayNum - 1);
      
      const dayId = uuidv4();
      const dayQuery = `
        INSERT INTO trip_days (id, trip_id, day_number, date, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      
      await pool.query(dayQuery, [
        dayId,
        tripId,
        dayNum,
        dayDate.toISOString().split('T')[0]
      ]);

      // Add places for this day
      const dayPlaces = suggestedPlaces.find(d => d.dayNumber === dayNum)?.places || [];
      
      for (let i = 0; i < dayPlaces.length; i++) {
        const place = dayPlaces[i];
        const placeId = uuidv4();
        
        const placeQuery = `
          INSERT INTO places (
            id, trip_day_id, name, address, lat, lng, 
            place_type, notes, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `;
        
        await pool.query(placeQuery, [
          placeId,
          dayId,
          place.name,
          place.address,
          place.lat,
          place.lng,
          place.placeType,
          place.tips || ''
        ]);
      }
    }

    // Generate weather-appropriate packing list
    const packingList = await this.generateWeatherAwarePackingList(
      destination, 
      weatherForecast, 
      duration
    );

    return {
      tripId,
      destination,
      startDate,
      endDate: end.toISOString().split('T')[0],
      suggestedPlaces,
      weatherForecast,
      packingList,
      weatherOptimizationApplied
    };
  }

  // Get suggested places with weather optimization
  private static async getSuggestedPlacesWithWeather(
    destination: string,
    duration: number,
    interests: string[],
    budget: string,
    weatherForecast?: WeatherData,
    startDate?: string
  ): Promise<Array<{ 
    dayNumber: number; 
    date: string;
    weatherClassification?: any;
    places: PlaceWithWeatherSuitability[] 
  }>> {
    const result: Array<{ 
      dayNumber: number; 
      date: string;
      weatherClassification?: any;
      places: PlaceWithWeatherSuitability[] 
    }> = [];
    
    // Define search queries based on interests
    const searchQueries = this.buildSearchQueries(destination, interests);
    
    // Distribute places across days (3-4 places per day)
    const placesPerDay = Math.min(4, Math.max(3, Math.floor(searchQueries.length / duration)));
    
    let allPlaces: PlaceWithWeatherSuitability[] = [];
    
    // Search for places
    for (const query of searchQueries) {
      try {
        const places = await LocationScraperService.searchLocations(query);
        const convertedPlaces: PlaceWithWeatherSuitability[] = places.slice(0, 2).map(p => ({
          name: p.location_name,
          address: p.source || '',
          lat: p.lat || 0,
          lng: p.lng || 0,
          placeType: this.determinePlaceType(p.location_name),
          rating: p.rating || undefined,
          tips: p.tips || undefined,
          estimatedCost: this.estimateCost(budget)
        }));
        allPlaces = allPlaces.concat(convertedPlaces);
      } catch (error) {
        console.error(`Error searching for ${query}:`, error);
      }
    }

    // If weather forecast is available, apply weather-based optimization
    if (weatherForecast && weatherForecast.travel_period_summary) {
      const dailyWeatherData = [];
      
      // Prepare daily weather data
      for (let day = 1; day <= duration; day++) {
        const dayDate = new Date(startDate!);
        dayDate.setDate(dayDate.getDate() + day - 1);
        const dateStr = dayDate.toISOString().split('T')[0];
        
        const dayForecast = weatherForecast.forecast.find(f => f.date === dateStr);
        const weatherClassification = dayForecast?.weather_classification || 
          weatherForecast.travel_period_summary.dominant_weather;

        dailyWeatherData.push({
          dayNumber: day,
          date: dateStr,
          weatherClassification,
          places: []
        });
      }

      // Apply weather-based schedule adjustment
      const adjustments = WeatherBasedPlaceFilteringService.adjustScheduleForWeather(
        dailyWeatherData.map(day => ({
          ...day,
          places: allPlaces.slice((day.dayNumber - 1) * placesPerDay, day.dayNumber * placesPerDay)
        }))
      );

      // Convert adjustments to result format
      adjustments.forEach(adjustment => {
        result.push({
          dayNumber: adjustment.dayNumber,
          date: adjustment.date,
          weatherClassification: adjustment.weatherClassification,
          places: adjustment.adjustedPlaces
        });
      });

    } else {
      // Fallback to simple distribution without weather optimization
      for (let day = 1; day <= duration; day++) {
        const dayDate = new Date(startDate!);
        dayDate.setDate(dayDate.getDate() + day - 1);
        const startIdx = (day - 1) * placesPerDay;
        const endIdx = Math.min(startIdx + placesPerDay, allPlaces.length);
        const dayPlaces = allPlaces.slice(startIdx, endIdx);
        
        result.push({
          dayNumber: day,
          date: dayDate.toISOString().split('T')[0],
          places: dayPlaces
        });
      }
    }

    return result;
  }

  // Build search queries based on interests and weather
  private static buildSearchQueries(destination: string, interests: string[]): string[] {
    const queries: string[] = [];
    
    // Default queries
    queries.push(`${destination} top attractions`);
    queries.push(`${destination} must visit places`);
    
    // Interest-based queries
    if (interests.includes('food') || interests.includes('foodie')) {
      queries.push(`${destination} best restaurants`);
      queries.push(`${destination} local food`);
      queries.push(`${destination} indoor dining`); // Weather-aware
    }
    
    if (interests.includes('culture')) {
      queries.push(`${destination} museums`);
      queries.push(`${destination} historical sites`);
      queries.push(`${destination} galleries`); // Weather-aware indoor option
    }
    
    if (interests.includes('adventure')) {
      queries.push(`${destination} outdoor activities`);
      queries.push(`${destination} adventure sports`);
      queries.push(`${destination} indoor adventure`); // Weather-aware alternative
    }
    
    if (interests.includes('shopping')) {
      queries.push(`${destination} shopping districts`);
      queries.push(`${destination} markets`);
      queries.push(`${destination} shopping malls`); // Weather-aware indoor option
    }
    
    if (interests.includes('nature')) {
      queries.push(`${destination} parks`);
      queries.push(`${destination} nature spots`);
      queries.push(`${destination} botanical gardens`); // Weather-aware option
    }

    // Add weather-specific queries
    queries.push(`${destination} indoor attractions`);
    queries.push(`${destination} covered markets`);
    queries.push(`${destination} all weather activities`);
    
    return queries;
  }

  // Determine theme based on interests with weights
  private static determineThemeFromInterests(interests: Array<{ id: string; name: string; weight: number }>): string {
    if (interests.length === 0) return 'default';
    
    // Find the interest with highest weight
    const dominantInterest = interests.reduce((prev, current) => 
      (prev.weight > current.weight) ? prev : current
    );
    
    const interestName = dominantInterest.name.toLowerCase();
    
    if (interestName.includes('food') || interestName.includes('culinary')) return 'foodie';
    if (interestName.includes('adventure') || interestName.includes('outdoor')) return 'adventure';
    if (interestName.includes('romantic') || interestName.includes('romance')) return 'romantic';
    if (interestName.includes('chill') || interestName.includes('relaxation')) return 'chill';
    
    return 'default';
  }

  // Calculate total budget based on estimated costs and budget level
  private static calculateTotalBudget(estimatedCost: number, budgetLevel: string): number {
    const multipliers = {
      'low': 1.2,      // 20% buffer
      'medium': 1.3,   // 30% buffer  
      'high': 1.5      // 50% buffer
    };
    
    const multiplier = multipliers[budgetLevel as keyof typeof multipliers] || 1.3;
    return Math.round(estimatedCost * multiplier);
  }

  // Determine currency based on destination
  private static determineCurrencyFromDestination(destination: string): string {
    const currencyMap: { [key: string]: string } = {
      // Europe
      'france': 'EUR', 'germany': 'EUR', 'italy': 'EUR', 'spain': 'EUR',
      'netherlands': 'EUR', 'belgium': 'EUR', 'austria': 'EUR', 'portugal': 'EUR',
      'paris': 'EUR', 'berlin': 'EUR', 'rome': 'EUR', 'madrid': 'EUR',
      'amsterdam': 'EUR', 'barcelona': 'EUR', 'lisbon': 'EUR',
      
      // Asia
      'japan': 'JPY', 'tokyo': 'JPY', 'osaka': 'JPY', 'kyoto': 'JPY',
      'china': 'CNY', 'beijing': 'CNY', 'shanghai': 'CNY',
      'south korea': 'KRW', 'seoul': 'KRW',
      'thailand': 'THB', 'bangkok': 'THB',
      'singapore': 'SGD',
      'india': 'INR', 'mumbai': 'INR', 'delhi': 'INR',
      
      // Americas
      'canada': 'CAD', 'toronto': 'CAD', 'vancouver': 'CAD',
      'mexico': 'MXN', 'mexico city': 'MXN',
      'brazil': 'BRL', 'rio de janeiro': 'BRL', 'sao paulo': 'BRL',
      
      // Oceania
      'australia': 'AUD', 'sydney': 'AUD', 'melbourne': 'AUD',
      'new zealand': 'NZD', 'auckland': 'NZD',
      
      // UK
      'united kingdom': 'GBP', 'london': 'GBP', 'england': 'GBP',
      'scotland': 'GBP', 'wales': 'GBP'
    };
    
    const destLower = destination.toLowerCase();
    for (const [location, currency] of Object.entries(currencyMap)) {
      if (destLower.includes(location)) {
        return currency;
      }
    }
    
    return 'USD'; // Default fallback
  }

  // Get trip title suffix based on theme
  private static getTripTitleSuffix(theme: string): string {
    const suffixes = {
      'foodie': 'Food Adventure',
      'adventure': 'Adventure',
      'romantic': 'Getaway',
      'chill': 'Retreat',
      'default': 'Trip'
    };
    
    return suffixes[theme as keyof typeof suffixes] || 'Trip';
  }

  // Calculate place arrival time based on order and travel style
  private static calculatePlaceArrivalTime(placeIndex: number, travelStyle: string, duration: number): string {
    const startTimes = {
      'relaxed': 9,    // 9 AM start
      'moderate': 8,   // 8 AM start
      'fast-paced': 7  // 7 AM start
    };
    
    const bufferTimes = {
      'relaxed': 45,   // 45 min between places
      'moderate': 30,  // 30 min between places
      'fast-paced': 20 // 20 min between places
    };
    
    const startHour = startTimes[travelStyle as keyof typeof startTimes] || 8;
    const bufferMinutes = bufferTimes[travelStyle as keyof typeof bufferTimes] || 30;
    
    // Calculate total minutes from start
    let totalMinutes = startHour * 60;
    
    // Add time for previous places
    for (let i = 0; i < placeIndex; i++) {
      totalMinutes += duration + bufferMinutes; // Visit duration + buffer
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Calculate place end time
  private static calculatePlaceEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  // Determine theme based on interests
  private static determineTheme(interests: string[]): string {
    if (interests.includes('food') || interests.includes('foodie')) return 'foodie';
    if (interests.includes('adventure')) return 'adventure';
    if (interests.includes('romantic') || interests.includes('romance')) return 'romantic';
    if (interests.includes('chill') || interests.includes('relaxation')) return 'chill';
    return 'default';
  }

  // Determine place type from name
  private static determinePlaceType(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('food')) {
      return 'food';
    }
    if (lowerName.includes('hotel') || lowerName.includes('resort') || lowerName.includes('accommodation')) {
      return 'hotel';
    }
    if (lowerName.includes('museum') || lowerName.includes('temple') || lowerName.includes('palace')) {
      return 'attraction';
    }
    
    return 'attraction';
  }

  // Estimate cost based on budget level
  private static estimateCost(budget: string): number {
    switch (budget) {
      case 'low': return Math.floor(Math.random() * 20) + 5;
      case 'medium': return Math.floor(Math.random() * 50) + 20;
      case 'high': return Math.floor(Math.random() * 100) + 50;
      default: return 30;
    }
  }

  // Generate weather-aware packing list
  private static async generateWeatherAwarePackingList(
    destination: string,
    weatherForecast?: WeatherData,
    duration?: number,
    interests?: Array<{ id: string; name: string; weight: number }>,
    travelStyle?: string
  ): Promise<string[]> {
    const packingList: string[] = [
      'Passport',
      'Travel insurance documents',
      'Phone charger',
      'Camera',
      'Medications'
    ];

    // Add weather-based items using the weather service
    if (weatherForecast && weatherForecast.travel_period_summary) {
      const weatherItems = WeatherBasedPlaceFilteringService.generateWeatherPackingItems(
        weatherForecast.travel_period_summary.daily_classifications
      );
      packingList.push(...weatherItems);
    } else {
      // Fallback to generic items
      packingList.push('Light jacket', 'Comfortable shoes', 'Umbrella');
    }

    // Add duration-based items
    if (duration && duration > 7) {
      packingList.push('Laundry detergent', 'Extra toiletries');
    }

    // Add travel style specific items
    if (travelStyle) {
      switch (travelStyle) {
        case 'fast-paced':
          packingList.push('Energy bars', 'Portable phone battery', 'Comfortable walking shoes');
          break;
        case 'relaxed':
          packingList.push('Book or e-reader', 'Comfortable loungewear', 'Travel pillow');
          break;
        case 'moderate':
          packingList.push('Day backpack', 'Water bottle', 'Snacks');
          break;
      }
    }

    // Add interest-based items
    if (interests && interests.length > 0) {
      interests.forEach(interest => {
        const interestName = interest.name.toLowerCase();
        
        if (interestName.includes('food') || interestName.includes('culinary')) {
          packingList.push('Antacids', 'Probiotics', 'Food allergy cards');
        }
        
        if (interestName.includes('adventure') || interestName.includes('outdoor')) {
          packingList.push('Hiking boots', 'First aid kit', 'Sunscreen', 'Insect repellent');
        }
        
        if (interestName.includes('photography')) {
          packingList.push('Extra camera batteries', 'Memory cards', 'Lens cleaning kit');
        }
        
        if (interestName.includes('shopping')) {
          packingList.push('Extra luggage space', 'Portable luggage scale');
        }
        
        if (interestName.includes('culture') || interestName.includes('history')) {
          packingList.push('Guidebook', 'Notebook for journaling');
        }
      });
    }

    // Add destination-specific items (basic logic)
    const destLower = destination.toLowerCase();
    if (destLower.includes('beach') || destLower.includes('island')) {
      packingList.push('Swimwear', 'Beach towel', 'Flip flops', 'Waterproof phone case');
    }
    if (destLower.includes('mountain') || destLower.includes('hiking')) {
      packingList.push('Hiking boots', 'Backpack', 'Water bottle', 'Warm layers');
    }
    if (destLower.includes('city')) {
      packingList.push('Comfortable walking shoes', 'Portable charger', 'City map app');
    }

    // Remove duplicates and return
    return Array.from(new Set(packingList));
  }

  // Generate intelligent suggestions using advanced algorithms (new enhanced functionality)
  static async generateIntelligentSuggestions(
    userId: string,
    request: EnhancedQuickPlanRequest
  ): Promise<Array<{
    dayNumber: number;
    date: string;
    weather?: any;
    places: Array<{
      id: string;
      name: string;
      address: string;
      coordinates: { lat: number; lng: number };
      placeType: string;
      description: string;
      estimatedDuration: number;
      estimatedCost: number;
      rating: number;
      tips?: string;
      openingHours?: string;
      travelTimeFromPrevious?: number;
      source: string;
    }>;
    totalTravelTime: number;
    estimatedCost: number;
  }>> {
    // Start performance tracking
    const sessionId = await QuickPlanPerformanceService.startPerformanceTracking(
      userId,
      request.destination,
      {
        interests: request.interests,
        budgetLevel: request.budgetLevel,
        travelStyle: request.travelStyle,
        groupSize: request.groupSize
      }
    );

    const startTime = Date.now();
    let cacheHitCount = 0;
    let externalApiCalls = 0;

    try {
      // Track usage analytics
      await QuickPlanAnalyticsService.trackQuickPlanUsage(
        userId,
        request.destination,
        request.interests.map(i => i.name),
        request.budgetLevel,
        request.travelStyle,
        request.groupSize,
        sessionId
      );

      const { 
        destination, 
        startDate, 
        endDate, 
        duration, 
        interests, 
        budgetLevel,
        travelStyle,
        groupSize,
        travelerTypes,
        mustVisitPlaces = [],
        enableWeatherOptimization = true
      } = request;

      console.log(`Generating intelligent suggestions for ${destination}...`);

      // Update performance metrics - place search stage
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'place_search',
        {}
      );

      // Step 1: Get places using location scraper with enhanced queries
      const searchQueries = this.buildEnhancedSearchQueries(destination, interests);
      let allPlaces: any[] = [];
      
      for (const query of searchQueries) {
        try {
          const cacheStart = Date.now();
          const places = await LocationScraperService.searchLocations(query);
          const cacheTime = Date.now() - cacheStart;
          
          // Track cache performance (simplified - assume cache hit if response is fast)
          const cacheHit = cacheTime < 500;
          if (cacheHit) cacheHitCount++;
          await QuickPlanPerformanceService.trackCacheRequest(destination, cacheHit, cacheTime);
          
          externalApiCalls++;
          allPlaces = allPlaces.concat(places.slice(0, 3)); // Get top 3 from each query
        } catch (error) {
          console.error(`Error searching for ${query}:`, error);
          externalApiCalls++;
        }
      }

      // Fallback: If no places found from scraping, generate default places
      if (allPlaces.length === 0) {
        console.log('No places found from scraping, generating fallback places...');
        allPlaces = this.generateFallbackPlaces(destination, interests);
      }

      // Deduplicate places by name and coordinates
      const uniquePlaces = this.deduplicatePlaces(allPlaces);
      console.log(`Found ${allPlaces.length} places, ${uniquePlaces.length} unique places for intelligent selection`);

      // Update performance metrics with places found
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'place_search',
        { 
          placesFound: uniquePlaces.length,
          cacheHitRate: searchQueries.length > 0 ? cacheHitCount / searchQueries.length : 0,
          externalApiCalls
        }
      );

      // Step 2: Apply intelligent place selection algorithms
      const placeSelectionRequest: PlaceSelectionRequest = {
        places: uniquePlaces,
        interests,
        budgetLevel,
        groupSize,
        travelerTypes,
        travelDates: { start: startDate, end: endDate },
        travelStyle,
        mustVisitPlaces
      };

      console.log('Applying intelligent place selection algorithms...');
      const intelligentSelection = await IntelligentPlaceSelectionService.selectOptimalPlaces(placeSelectionRequest);
      
      // Step 3: Apply activity balance and scheduling algorithms
      const routeOptimizationStart = Date.now();
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'route_optimization',
        {}
      );

      const schedulingRequest: SchedulingRequest = {
        places: intelligentSelection.selectedPlaces,
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

      console.log('Applying activity balance and scheduling algorithms...');
      const balancedSchedule = await ActivityBalanceSchedulingService.createBalancedSchedule(schedulingRequest);
      
      const routeOptimizationTime = Date.now() - routeOptimizationStart;

      // Step 4: Get weather forecast if enabled
      let weatherForecast: WeatherData | undefined;
      const weatherApiStart = Date.now();
      if (enableWeatherOptimization) {
        try {
          const coordinates = await weatherService.geocodeLocation(destination);
          weatherForecast = await weatherService.getTravelPeriodForecast(
            coordinates.lat,
            coordinates.lng,
            startDate,
            endDate
          );
          externalApiCalls++;
          
          // Track weather API performance
          await QuickPlanPerformanceService.trackExternalApiCall(
            'weather_api',
            new Date(weatherApiStart),
            new Date(),
            true
          );
        } catch (error) {
          console.error('Error fetching weather forecast:', error);
          await QuickPlanPerformanceService.trackExternalApiCall(
            'weather_api',
            new Date(weatherApiStart),
            new Date(),
            false,
            error instanceof Error ? error.message : 'Weather API error'
          );
        }
      }
      const weatherApiTime = Date.now() - weatherApiStart;

      // Update performance metrics with route optimization time
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'route_optimization',
        { 
          routeOptimizationTime,
          weatherApiTime,
          externalApiCalls
        }
      );

      // Step 5: Convert balanced schedule to frontend format
      const suggestions = balancedSchedule.dailySchedules.map(dailySchedule => {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + dailySchedule.dayNumber - 1);
        
        // Get weather for this day
        const dayWeather = weatherForecast?.forecast.find(f => f.date === dailySchedule.date);
        
        const places = dailySchedule.activities.map((activity, index) => {
          const placeId = `place-${dailySchedule.dayNumber}-${index}`;
          
          // Track place addition to itinerary (async, don't wait)
          if (activity.source !== 'fallback' && activity.source !== 'static_data') {
            this.trackPlaceAddition(activity, placeId).catch(console.error);
          }
          
          return {
            id: placeId,
            name: activity.location_name,
            address: activity.source || `${destination} location`,
            coordinates: { lat: activity.lat || 0, lng: activity.lng || 0 },
            placeType: activity.place_type || 'attraction',
            description: activity.tips || `A wonderful ${activity.place_type || 'place'} in ${destination} that matches your interests.`,
            estimatedDuration: activity.activityIntensity.duration,
            estimatedCost: activity.estimated_cost || this.estimateCost(budgetLevel),
            rating: activity.rating || (4.0 + Math.random() * 1.0),
            tips: activity.tips || undefined,
            openingHours: activity.opening_hours || '9:00 AM - 6:00 PM',
            travelTimeFromPrevious: activity.transportTime || (index > 0 ? Math.floor(Math.random() * 30) + 5 : 0),
            source: activity.source || 'intelligent_selection'
          };
        });

        const totalTravelTime = places.reduce((sum, place) => sum + (place.travelTimeFromPrevious || 0), 0);
        const estimatedCost = places.reduce((sum, place) => sum + place.estimatedCost, 0);

        return {
          dayNumber: dailySchedule.dayNumber,
          date: dailySchedule.date,
          weather: dayWeather ? {
            date: dayWeather.date,
            temperature_high: dayWeather.temperature_high,
            temperature_low: dayWeather.temperature_low,
            condition: dayWeather.condition,
            precipitation_probability: dayWeather.precipitation_probability,
            icon: dayWeather.icon
          } : undefined,
          places,
          totalTravelTime,
          estimatedCost
        };
      });

      // Complete performance tracking
      const totalTime = Date.now() - startTime;
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'completed',
        {
          generationTime: totalTime,
          placesFound: uniquePlaces.length,
          routeOptimizationTime,
          weatherApiTime,
          cacheHitRate: searchQueries.length > 0 ? cacheHitCount / searchQueries.length : 0,
          externalApiCalls
        }
      );

      await QuickPlanPerformanceService.completePerformanceTracking(
        sessionId,
        true
      );

      console.log(`Generated ${suggestions.length} days of intelligent suggestions`);
      return suggestions;

    } catch (error) {
      console.error('Error generating intelligent suggestions:', error);
      
      // Track error in performance monitoring
      const totalTime = Date.now() - startTime;
      await QuickPlanPerformanceService.updatePerformanceMetrics(
        sessionId,
        'error',
        { 
          generationTime: totalTime,
          errorCount: 1,
          externalApiCalls
        },
        error instanceof Error ? error.message : 'Unknown error'
      );

      await QuickPlanPerformanceService.completePerformanceTracking(
        sessionId,
        false
      );

      throw error;
    }
  }

  // Build enhanced search queries based on interests and intelligent algorithms
  private static buildEnhancedSearchQueries(destination: string, interests: Array<{ id: string; name: string; weight: number }> | string[]): string[] {
    const queries: string[] = [];
    
    // Base queries
    queries.push(`${destination} top attractions`);
    queries.push(`${destination} must visit places`);
    queries.push(`${destination} hidden gems`);
    
    // Convert string interests to InterestCategory objects if needed
    const normalizedInterests: Array<{ id: string; name: string; weight: number }> = interests.map(interest => {
      if (typeof interest === 'string') {
        return { id: interest, name: interest, weight: 3 };
      }
      return interest;
    });
    
    // Interest-based queries with weights
    const sortedInterests = normalizedInterests.sort((a, b) => b.weight - a.weight);
    
    sortedInterests.forEach(interest => {
      const interestId = interest.id.toLowerCase();
      
      switch (interestId) {
        case 'food':
          queries.push(`${destination} best restaurants`);
          queries.push(`${destination} local cuisine`);
          queries.push(`${destination} food markets`);
          if (interest.weight >= 4) {
            queries.push(`${destination} michelin restaurants`);
            queries.push(`${destination} street food`);
          }
          break;
          
        case 'culture':
          queries.push(`${destination} museums`);
          queries.push(`${destination} historical sites`);
          queries.push(`${destination} cultural attractions`);
          if (interest.weight >= 4) {
            queries.push(`${destination} art galleries`);
            queries.push(`${destination} heritage sites`);
          }
          break;
          
        case 'adventure':
          queries.push(`${destination} outdoor activities`);
          queries.push(`${destination} adventure sports`);
          if (interest.weight >= 4) {
            queries.push(`${destination} extreme sports`);
            queries.push(`${destination} hiking trails`);
          }
          break;
          
        case 'shopping':
          queries.push(`${destination} shopping districts`);
          queries.push(`${destination} markets`);
          if (interest.weight >= 4) {
            queries.push(`${destination} luxury shopping`);
            queries.push(`${destination} local crafts`);
          }
          break;
          
        case 'nature':
          queries.push(`${destination} parks`);
          queries.push(`${destination} nature spots`);
          if (interest.weight >= 4) {
            queries.push(`${destination} botanical gardens`);
            queries.push(`${destination} scenic viewpoints`);
          }
          break;
          
        case 'relaxation':
          queries.push(`${destination} spas`);
          queries.push(`${destination} peaceful places`);
          if (interest.weight >= 4) {
            queries.push(`${destination} wellness centers`);
            queries.push(`${destination} meditation spots`);
          }
          break;
          
        case 'nightlife':
          queries.push(`${destination} nightlife`);
          queries.push(`${destination} bars`);
          if (interest.weight >= 4) {
            queries.push(`${destination} clubs`);
            queries.push(`${destination} live music`);
          }
          break;
          
        case 'photography':
          queries.push(`${destination} photo spots`);
          queries.push(`${destination} scenic views`);
          if (interest.weight >= 4) {
            queries.push(`${destination} instagram spots`);
            queries.push(`${destination} sunrise sunset`);
          }
          break;
      }
    });
    
    // Add weather-aware queries
    queries.push(`${destination} indoor attractions`);
    queries.push(`${destination} all weather activities`);
    
    return queries;
  }

  // Generate fallback places when scraping fails
  private static generateFallbackPlaces(destination: string, interests: Array<{ id: string; name: string; weight: number }>): any[] {
    const fallbackPlaces: any[] = [];
    
    // Generate basic places based on interests
    const topInterests = interests.sort((a, b) => b.weight - a.weight).slice(0, 3);
    
    topInterests.forEach((interest, index) => {
      const interestId = interest.id.toLowerCase();
      
      switch (interestId) {
        case 'food':
          fallbackPlaces.push({
            location_name: `Popular Restaurant in ${destination}`,
            source: 'fallback',
            rating: 4.2 + Math.random() * 0.6,
            place_type: 'restaurant',
            tips: `Highly rated local restaurant serving authentic ${destination} cuisine`,
            estimated_cost: 25 + Math.random() * 25,
            activityIntensity: { duration: 90, intensity: 'moderate' }
          });
          break;
          
        case 'culture':
          fallbackPlaces.push({
            location_name: `${destination} Cultural Center`,
            source: 'fallback',
            rating: 4.3 + Math.random() * 0.5,
            place_type: 'museum',
            tips: `Learn about the rich history and culture of ${destination}`,
            estimated_cost: 15 + Math.random() * 15,
            activityIntensity: { duration: 120, intensity: 'light' }
          });
          break;
          
        case 'nature':
          fallbackPlaces.push({
            location_name: `${destination} Nature Spot`,
            source: 'fallback',
            rating: 4.4 + Math.random() * 0.4,
            place_type: 'park',
            tips: `Beautiful natural area perfect for relaxation and sightseeing`,
            estimated_cost: 5 + Math.random() * 10,
            activityIntensity: { duration: 150, intensity: 'moderate' }
          });
          break;
          
        case 'adventure':
          fallbackPlaces.push({
            location_name: `${destination} Adventure Activity`,
            source: 'fallback',
            rating: 4.1 + Math.random() * 0.7,
            place_type: 'activity',
            tips: `Exciting adventure activity for thrill seekers`,
            estimated_cost: 40 + Math.random() * 40,
            activityIntensity: { duration: 180, intensity: 'high' }
          });
          break;
          
        default:
          fallbackPlaces.push({
            location_name: `${destination} Popular Attraction`,
            source: 'fallback',
            rating: 4.0 + Math.random() * 0.8,
            place_type: 'attraction',
            tips: `Must-visit attraction in ${destination}`,
            estimated_cost: 20 + Math.random() * 20,
            activityIntensity: { duration: 120, intensity: 'moderate' }
          });
      }
    });
    
    // Add some general attractions if we don't have enough
    while (fallbackPlaces.length < 6) {
      fallbackPlaces.push({
        location_name: `${destination} Landmark ${fallbackPlaces.length + 1}`,
        source: 'fallback',
        rating: 3.8 + Math.random() * 1.0,
        place_type: 'attraction',
        tips: `Popular landmark and tourist destination in ${destination}`,
        estimated_cost: 10 + Math.random() * 30,
        activityIntensity: { duration: 90 + Math.random() * 60, intensity: 'moderate' }
      });
    }
    
    return fallbackPlaces;
  }

  // Track place addition to itinerary for analytics
  private static async trackPlaceAddition(activity: any, placeId: string): Promise<void> {
    try {
      // Find the place in our database by name and location
      const query = `
        SELECT id FROM place_database 
        WHERE name ILIKE $1 
        AND (city ILIKE $2 OR address ILIKE $2)
        LIMIT 1
      `;
      
      const result = await pool.query(query, [
        `%${activity.location_name}%`,
        `%${activity.city || ''}%`
      ]);
      
      if (result.rows.length > 0) {
        const { ComprehensivePlaceScrapingService } = await import('./comprehensivePlaceScrapingService.js');
        await ComprehensivePlaceScrapingService.trackPlaceInteraction(
          'system', // Use system as user for quick plan generations
          result.rows[0].id,
          'added_to_itinerary',
          placeId
        );
      }
    } catch (error) {
      // Don't log error as this is optional analytics
    }
  }

  // Deduplicate places by name and coordinates
  private static deduplicatePlaces(places: any[]): any[] {
    const seen = new Set<string>();
    const uniquePlaces: any[] = [];

    for (const place of places) {
      // Create a unique key based on name and coordinates
      const name = place.location_name || place.name || '';
      const lat = place.lat || 0;
      const lng = place.lng || 0;
      const key = `${name.toLowerCase().trim()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniquePlaces.push(place);
      }
    }

    return uniquePlaces;
  }
}
