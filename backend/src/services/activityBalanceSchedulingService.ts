import { EnhancedPlace } from './intelligentPlaceSelectionService.js';
import { PlaceType } from '../types/index.js';

export interface ActivityIntensity {
  level: 'low' | 'medium' | 'high';
  physicalDemand: number; // 0-1 scale
  mentalDemand: number; // 0-1 scale
  socialDemand: number; // 0-1 scale
  duration: number; // minutes
}

export interface ScheduledActivity extends EnhancedPlace {
  scheduledTime: string; // HH:MM format
  endTime: string; // HH:MM format
  activityIntensity: ActivityIntensity;
  fatigueImpact: number; // 0-1 scale
  restPeriodAfter: number; // minutes
  mealTiming?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  transportTime?: number; // minutes to next activity
}

export interface DailySchedule {
  dayNumber: number;
  date: string;
  activities: ScheduledActivity[];
  totalIntensity: number;
  balanceScore: number;
  fatigueLevel: number;
  mealSchedule: MealSchedule;
  restPeriods: RestPeriod[];
  dailySummary: {
    totalActivities: number;
    totalActiveTime: number; // minutes
    totalRestTime: number; // minutes
    intensityDistribution: Record<string, number>;
    sustainabilityScore: number;
  };
}

export interface MealSchedule {
  breakfast?: ScheduledActivity;
  lunch?: ScheduledActivity;
  dinner?: ScheduledActivity;
  snacks: ScheduledActivity[];
}

export interface RestPeriod {
  startTime: string;
  endTime: string;
  duration: number; // minutes
  type: 'short_break' | 'meal_break' | 'rest_period' | 'free_time';
  location?: string;
}

export interface SchedulingRequest {
  places: EnhancedPlace[];
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced';
  groupSize: number;
  startTime?: string; // Default start time for each day
  endTime?: string; // Default end time for each day
  mealPreferences?: {
    breakfastTime?: string;
    lunchTime?: string;
    dinnerTime?: string;
    includeSnacks?: boolean;
  };
  accessibilityNeeds?: string[];
  energyProfile?: 'morning_person' | 'evening_person' | 'consistent';
}

export interface SchedulingResult {
  dailySchedules: DailySchedule[];
  overallBalance: {
    averageIntensity: number;
    balanceScore: number;
    sustainabilityScore: number;
    fatigueManagement: number;
  };
  recommendations: string[];
  warnings: string[];
}

export class ActivityBalanceSchedulingService {
  // Main scheduling algorithm
  static async createBalancedSchedule(request: SchedulingRequest): Promise<SchedulingResult> {
    const startTime = Date.now();
    
    // Step 1: Classify activity intensities
    const classifiedPlaces = this.classifyActivityIntensities(request.places);
    
    // Step 2: Group places by days (assuming places are already distributed)
    const dailyGroups = this.groupPlacesByDays(classifiedPlaces);
    
    // Step 3: Create daily schedules with balance algorithms
    const dailySchedules: DailySchedule[] = [];
    
    for (let dayIndex = 0; dayIndex < dailyGroups.length; dayIndex++) {
      const dayPlaces = dailyGroups[dayIndex];
      const dayNumber = dayIndex + 1;
      
      // Create balanced daily schedule
      const dailySchedule = await this.createDailyBalancedSchedule(
        dayPlaces,
        dayNumber,
        request
      );
      
      dailySchedules.push(dailySchedule);
    }
    
    // Step 4: Apply fatigue modeling across days
    const fatigueAdjustedSchedules = this.applyFatigueModeling(dailySchedules, request);
    
    // Step 5: Optimize meal timing
    const mealOptimizedSchedules = this.optimizeMealTiming(fatigueAdjustedSchedules, request);
    
    // Step 6: Add rest periods for sustainability
    const finalSchedules = this.addRestPeriods(mealOptimizedSchedules, request);
    
    // Step 7: Calculate overall metrics and recommendations
    const overallBalance = this.calculateOverallBalance(finalSchedules);
    const recommendations = this.generateRecommendations(finalSchedules, request);
    const warnings = this.generateWarnings(finalSchedules, request);
    
    const processingTime = Date.now() - startTime;
    console.log(`Activity balance scheduling completed in ${processingTime}ms`);
    
    return {
      dailySchedules: finalSchedules,
      overallBalance,
      recommendations,
      warnings
    };
  }

  // 1. Activity intensity classification system
  private static classifyActivityIntensities(places: EnhancedPlace[]): EnhancedPlace[] {
    return places.map(place => {
      const intensity = this.calculateActivityIntensity(place);
      return {
        ...place,
        activityIntensity: intensity
      } as EnhancedPlace & { activityIntensity: ActivityIntensity };
    });
  }

  // Calculate activity intensity based on place type and characteristics
  private static calculateActivityIntensity(place: EnhancedPlace): ActivityIntensity {
    const placeType = place.place_type || 'other';
    const rawDuration = place.estimated_duration || 120; // Default 2 hours
    
    // Define reasonable duration limits by place type
    const durationLimits: Record<PlaceType, { min: number; max: number }> = {
      attraction: { min: 60, max: 300 },    // 1 - 5 hours for attractions
      food: { min: 30, max: 180 },          // 30 min - 3 hours for food
      hotel: { min: 15, max: 30 },          // 15 - 30 min for check-in/out
      transport: { min: 15, max: 120 },     // 15 min - 2 hours for transport
      other: { min: 30, max: 180 },         // 30 min - 3 hours for other
      temple: { min: 30, max: 120 },        // 30 min - 2 hours for temples
      observation_deck: { min: 30, max: 90 }, // 30 min - 1.5 hours for viewing
      shrine: { min: 20, max: 90 },         // 20 min - 1.5 hours for shrines
      market: { min: 45, max: 180 },        // 45 min - 3 hours for markets
      garden: { min: 30, max: 180 },        // 30 min - 3 hours for gardens
      landmark: { min: 30, max: 120 },      // 30 min - 2 hours for landmarks
      cathedral: { min: 30, max: 120 },     // 30 min - 2 hours for cathedrals
      castle: { min: 60, max: 240 },        // 1 - 4 hours for castles
      monument: { min: 20, max: 90 },       // 20 min - 1.5 hours for monuments
      district: { min: 60, max: 300 },      // 1 - 5 hours for exploring districts
      restaurant: { min: 30, max: 180 },    // 30 min - 3 hours for meals
      museum: { min: 60, max: 240 },        // 1 - 4 hours for museums
      shopping: { min: 30, max: 180 },      // 30 min - 3 hours for shopping
      nightlife: { min: 60, max: 240 },     // 1 - 4 hours for nightlife
      entertainment: { min: 60, max: 180 }, // 1 - 3 hours for entertainment
      nature: { min: 30, max: 300 },        // 30 min - 5 hours for nature
      park: { min: 30, max: 240 },          // 30 min - 4 hours for parks
      activity: { min: 60, max: 300 },      // 1 - 5 hours for activities
      cultural: { min: 45, max: 180 },      // 45 min - 3 hours for cultural sites
      accommodation: { min: 15, max: 30 }   // 15 - 30 min for check-in/out
    };
    
    // Apply duration constraints based on place type
    const limits = durationLimits[placeType];
    const duration = Math.max(limits.min, Math.min(limits.max, rawDuration));
    
    // Base intensity levels for different place types
    const intensityProfiles: Record<PlaceType, {
      level: 'low' | 'medium' | 'high';
      physical: number;
      mental: number;
      social: number;
    }> = {
      attraction: { level: 'medium', physical: 0.5, mental: 0.6, social: 0.4 },
      food: { level: 'low', physical: 0.1, mental: 0.2, social: 0.6 },
      hotel: { level: 'low', physical: 0.1, mental: 0.1, social: 0.2 },
      transport: { level: 'low', physical: 0.2, mental: 0.3, social: 0.3 },
      other: { level: 'medium', physical: 0.4, mental: 0.4, social: 0.4 },
      temple: { level: 'low', physical: 0.3, mental: 0.7, social: 0.3 },
      observation_deck: { level: 'medium', physical: 0.4, mental: 0.5, social: 0.4 },
      shrine: { level: 'low', physical: 0.3, mental: 0.7, social: 0.3 },
      market: { level: 'medium', physical: 0.5, mental: 0.4, social: 0.6 },
      garden: { level: 'low', physical: 0.4, mental: 0.3, social: 0.4 },
      landmark: { level: 'medium', physical: 0.5, mental: 0.6, social: 0.5 },
      cathedral: { level: 'low', physical: 0.3, mental: 0.7, social: 0.3 },
      castle: { level: 'medium', physical: 0.6, mental: 0.7, social: 0.4 },
      monument: { level: 'medium', physical: 0.4, mental: 0.6, social: 0.4 },
      district: { level: 'medium', physical: 0.5, mental: 0.4, social: 0.6 },
      restaurant: { level: 'low', physical: 0.1, mental: 0.2, social: 0.6 },
      museum: { level: 'low', physical: 0.3, mental: 0.8, social: 0.3 },
      shopping: { level: 'medium', physical: 0.4, mental: 0.4, social: 0.5 },
      nightlife: { level: 'high', physical: 0.4, mental: 0.3, social: 0.9 },
      entertainment: { level: 'medium', physical: 0.3, mental: 0.4, social: 0.7 },
      nature: { level: 'medium', physical: 0.7, mental: 0.4, social: 0.3 },
      park: { level: 'medium', physical: 0.6, mental: 0.3, social: 0.5 },
      activity: { level: 'high', physical: 0.8, mental: 0.5, social: 0.6 },
      cultural: { level: 'low', physical: 0.2, mental: 0.7, social: 0.4 },
      accommodation: { level: 'low', physical: 0.1, mental: 0.1, social: 0.2 }
    };
    
    const profile = intensityProfiles[placeType];
    
    // Adjust based on place characteristics
    let physicalAdjustment = 0;
    let mentalAdjustment = 0;
    let socialAdjustment = 0;
    
    const tips = (place.tips || '').toLowerCase();
    
    // Physical adjustments
    if (tips.includes('hiking') || tips.includes('climbing')) physicalAdjustment += 0.3;
    if (tips.includes('walking') || tips.includes('stairs')) physicalAdjustment += 0.2;
    if (tips.includes('accessible') || tips.includes('elevator')) physicalAdjustment -= 0.2;
    
    // Mental adjustments
    if (tips.includes('complex') || tips.includes('detailed')) mentalAdjustment += 0.2;
    if (tips.includes('relaxing') || tips.includes('peaceful')) mentalAdjustment -= 0.3;
    
    // Social adjustments
    if (tips.includes('crowded') || tips.includes('busy')) socialAdjustment += 0.2;
    if (tips.includes('quiet') || tips.includes('private')) socialAdjustment -= 0.3;
    
    // Apply adjustments
    const physicalDemand = Math.max(0, Math.min(1, profile.physical + physicalAdjustment));
    const mentalDemand = Math.max(0, Math.min(1, profile.mental + mentalAdjustment));
    const socialDemand = Math.max(0, Math.min(1, profile.social + socialAdjustment));
    
    // Determine overall level
    const averageDemand = (physicalDemand + mentalDemand + socialDemand) / 3;
    let level: 'low' | 'medium' | 'high';
    
    if (averageDemand < 0.4) level = 'low';
    else if (averageDemand < 0.7) level = 'medium';
    else level = 'high';
    
    return {
      level,
      physicalDemand,
      mentalDemand,
      socialDemand,
      duration
    };
  }

  // 2. Group places by days (simple distribution for now)
  private static groupPlacesByDays(places: EnhancedPlace[]): EnhancedPlace[][] {
    // Distribute places across multiple days to avoid over-scheduling
    const maxPlacesPerDay = 6; // Reasonable limit
    const groups: EnhancedPlace[][] = [];
    
    for (let i = 0; i < places.length; i += maxPlacesPerDay) {
      groups.push(places.slice(i, i + maxPlacesPerDay));
    }
    
    // Ensure we have at least one group
    if (groups.length === 0 && places.length > 0) {
      groups.push(places);
    }
    
    return groups;
  }

  // 3. Create daily balance algorithms for varied experiences
  private static async createDailyBalancedSchedule(
    places: EnhancedPlace[],
    dayNumber: number,
    request: SchedulingRequest
  ): Promise<DailySchedule> {
    // Sort places for optimal balance
    const balancedOrder = this.optimizeDailyBalance(places, request);
    
    // Schedule activities with timing
    const scheduledActivities = this.scheduleActivitiesWithTiming(balancedOrder, request);
    
    // Calculate daily metrics
    const totalIntensity = this.calculateDailyIntensity(scheduledActivities);
    const balanceScore = this.calculateDailyBalanceScore(scheduledActivities);
    const fatigueLevel = this.calculateDailyFatigueLevel(scheduledActivities);
    
    // Create meal schedule
    const mealSchedule = this.createMealSchedule(scheduledActivities);
    
    // Calculate daily summary
    const dailySummary = this.calculateDailySummary(scheduledActivities);
    
    const today = new Date();
    today.setDate(today.getDate() + dayNumber - 1);
    
    return {
      dayNumber,
      date: today.toISOString().split('T')[0],
      activities: scheduledActivities,
      totalIntensity,
      balanceScore,
      fatigueLevel,
      mealSchedule,
      restPeriods: [], // Will be added later
      dailySummary
    };
  }

  // Optimize daily balance by reordering activities
  private static optimizeDailyBalance(places: EnhancedPlace[], request: SchedulingRequest): EnhancedPlace[] {
    const classified = places as (EnhancedPlace & { activityIntensity: ActivityIntensity })[];
    
    // Separate by intensity levels
    const lowIntensity = classified.filter(p => p.activityIntensity.level === 'low');
    const mediumIntensity = classified.filter(p => p.activityIntensity.level === 'medium');
    const highIntensity = classified.filter(p => p.activityIntensity.level === 'high');
    
    // Create balanced sequence based on travel style
    const balanced: EnhancedPlace[] = [];
    
    switch (request.travelStyle) {
      case 'relaxed':
        // Start easy, mix gently, end easy
        balanced.push(...this.interleaveActivities([lowIntensity, mediumIntensity, lowIntensity]));
        break;
      case 'moderate':
        // Gradual build-up, peak in middle, wind down
        balanced.push(...this.interleaveActivities([lowIntensity, mediumIntensity, highIntensity, mediumIntensity, lowIntensity]));
        break;
      case 'fast-paced':
        // Quick start, maintain energy, strong finish
        balanced.push(...this.interleaveActivities([mediumIntensity, highIntensity, mediumIntensity, highIntensity]));
        break;
    }
    
    return balanced;
  }

  // Interleave activities from different intensity groups
  private static interleaveActivities(groups: EnhancedPlace[][]): EnhancedPlace[] {
    const result: EnhancedPlace[] = [];
    const maxLength = Math.max(...groups.map(g => g.length));
    
    for (let i = 0; i < maxLength; i++) {
      for (const group of groups) {
        if (i < group.length) {
          result.push(group[i]);
        }
      }
    }
    
    return result;
  }

  // Schedule activities with specific timing
  private static scheduleActivitiesWithTiming(
    places: EnhancedPlace[],
    request: SchedulingRequest
  ): ScheduledActivity[] {
    const scheduled: ScheduledActivity[] = [];
    const startTime = request.startTime || '09:00';
    let currentTime = this.parseTime(startTime);
    
    // Define maximum daily active time based on travel style
    const maxDailyActiveTime = {
      'relaxed': 8 * 60,    // 8 hours max for relaxed
      'moderate': 10 * 60,  // 10 hours max for moderate
      'fast-paced': 12 * 60 // 12 hours max for fast-paced
    };
    
    const maxTime = maxDailyActiveTime[request.travelStyle];
    let totalActiveTime = 0;
    
    for (let i = 0; i < places.length; i++) {
      const place = places[i] as EnhancedPlace & { activityIntensity: ActivityIntensity };
      const duration = place.activityIntensity.duration;
      
      // Check if adding this activity would exceed the daily limit
      if (totalActiveTime + duration > maxTime) {
        // Skip this activity if it would exceed the time limit
        console.log(`Skipping activity ${place.location_name} to stay within ${request.travelStyle} time limit`);
        break;
      }
      
      // Calculate fatigue impact
      const fatigueImpact = this.calculateFatigueImpact(place.activityIntensity, i, places.length);
      
      // Calculate rest period needed after this activity
      const restPeriod = this.calculateRestPeriod(place.activityIntensity, fatigueImpact);
      
      // Calculate transport time to next activity
      const transportTime = i < places.length - 1 ? this.estimateTransportTime(place, places[i + 1]) : 0;
      
      const scheduledActivity: ScheduledActivity = {
        ...place,
        scheduledTime: this.formatTime(currentTime),
        endTime: this.formatTime(currentTime + duration),
        activityIntensity: place.activityIntensity,
        fatigueImpact,
        restPeriodAfter: restPeriod,
        transportTime
      };
      
      scheduled.push(scheduledActivity);
      
      // Advance time and track total active time
      currentTime += duration + restPeriod + transportTime;
      totalActiveTime += duration;
    }
    
    return scheduled;
  }

  // Calculate fatigue impact of an activity
  private static calculateFatigueImpact(intensity: ActivityIntensity, position: number, totalActivities: number): number {
    // Base fatigue from intensity
    const baseFatigue = (intensity.physicalDemand + intensity.mentalDemand + intensity.socialDemand) / 3;
    
    // Cumulative fatigue factor (increases throughout the day)
    const cumulativeFactor = 1 + (position / totalActivities) * 0.5;
    
    // Duration factor
    const durationFactor = Math.min(intensity.duration / 180, 1.5); // 3 hours = max factor
    
    return Math.min(baseFatigue * cumulativeFactor * durationFactor, 1.0);
  }

  // Calculate rest period needed after activity
  private static calculateRestPeriod(intensity: ActivityIntensity, fatigueImpact: number): number {
    // Base rest periods by intensity level
    const baseRest = {
      low: 15,
      medium: 30,
      high: 45
    };
    
    const base = baseRest[intensity.level];
    
    // Adjust based on fatigue impact
    const fatigueAdjustment = fatigueImpact * 30; // Up to 30 extra minutes
    
    return Math.round(base + fatigueAdjustment);
  }

  // Estimate transport time between activities
  private static estimateTransportTime(from: EnhancedPlace, to: EnhancedPlace): number {
    // Simple estimation - in real implementation would use actual routing
    if (from.lat && from.lng && to.lat && to.lng) {
      const distance = this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
      
      // Estimate based on distance
      if (distance < 0.5) return 10; // Walking distance
      if (distance < 2) return 20; // Short transport
      if (distance < 5) return 30; // Medium transport
      return 45; // Long transport
    }
    
    return 20; // Default estimate
  }

  // Calculate distance between two points (Haversine formula)
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // 4. Fatigue modeling to prevent over-scheduling
  private static applyFatigueModeling(schedules: DailySchedule[], request: SchedulingRequest): DailySchedule[] {
    let cumulativeFatigue = 0;
    
    return schedules.map((schedule, dayIndex) => {
      // Adjust activities based on cumulative fatigue
      const adjustedActivities = schedule.activities.map(activity => {
        // Reduce intensity if fatigue is high
        if (cumulativeFatigue > 0.7) {
          const fatigueReduction = (cumulativeFatigue - 0.7) * 0.5;
          activity.fatigueImpact = Math.max(0, activity.fatigueImpact - fatigueReduction);
          activity.restPeriodAfter += Math.round(fatigueReduction * 60); // Add extra rest
        }
        
        return activity;
      });
      
      // Update cumulative fatigue
      const dailyFatigueIncrease = schedule.fatigueLevel * 0.3;
      const fatigueRecovery = this.calculateOvernightRecovery(request.travelStyle);
      cumulativeFatigue = Math.max(0, cumulativeFatigue + dailyFatigueIncrease - fatigueRecovery);
      
      return {
        ...schedule,
        activities: adjustedActivities,
        fatigueLevel: Math.min(schedule.fatigueLevel + cumulativeFatigue * 0.2, 1.0)
      };
    });
  }

  // Calculate overnight fatigue recovery
  private static calculateOvernightRecovery(travelStyle: string): number {
    const recoveryRates = {
      relaxed: 0.8,   // Good recovery
      moderate: 0.6,  // Moderate recovery
      'fast-paced': 0.4 // Limited recovery
    };
    
    return recoveryRates[travelStyle as keyof typeof recoveryRates] || 0.6;
  }

  // 5. Meal timing optimization with restaurant integration
  private static optimizeMealTiming(schedules: DailySchedule[], request: SchedulingRequest): DailySchedule[] {
    return schedules.map(schedule => {
      const mealTimes = {
        breakfast: request.mealPreferences?.breakfastTime || '08:00',
        lunch: request.mealPreferences?.lunchTime || '12:30',
        dinner: request.mealPreferences?.dinnerTime || '19:00'
      };
      
      // Find restaurants in activities
      const restaurants = schedule.activities.filter(a => 
        a.place_type === 'restaurant' || a.place_type === 'food'
      );
      
      // Assign meal timings
      const updatedActivities = schedule.activities.map(activity => {
        if (restaurants.includes(activity)) {
          const mealTiming = this.determineMealTiming(activity.scheduledTime, mealTimes);
          return { ...activity, mealTiming };
        }
        return activity;
      });
      
      // Create meal schedule
      const mealSchedule = this.createMealSchedule(updatedActivities);
      
      return {
        ...schedule,
        activities: updatedActivities,
        mealSchedule
      };
    });
  }

  // Determine which meal this restaurant visit represents
  private static determineMealTiming(
    scheduledTime: string,
    mealTimes: { breakfast: string; lunch: string; dinner: string }
  ): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    const time = this.parseTime(scheduledTime);
    const breakfast = this.parseTime(mealTimes.breakfast);
    const lunch = this.parseTime(mealTimes.lunch);
    const dinner = this.parseTime(mealTimes.dinner);
    
    // Find closest meal time
    const distances = {
      breakfast: Math.abs(time - breakfast),
      lunch: Math.abs(time - lunch),
      dinner: Math.abs(time - dinner)
    };
    
    const closest = Object.entries(distances).reduce((min, [meal, distance]) => 
      distance < min.distance ? { meal, distance } : min,
      { meal: 'snack', distance: Infinity }
    );
    
    // If within 2 hours of a meal time, assign it
    if (closest.distance <= 120) {
      return closest.meal as 'breakfast' | 'lunch' | 'dinner';
    }
    
    return 'snack';
  }

  // Create meal schedule from activities
  private static createMealSchedule(activities: ScheduledActivity[]): MealSchedule {
    const mealSchedule: MealSchedule = { snacks: [] };
    
    for (const activity of activities) {
      if (activity.mealTiming) {
        switch (activity.mealTiming) {
          case 'breakfast':
            mealSchedule.breakfast = activity;
            break;
          case 'lunch':
            mealSchedule.lunch = activity;
            break;
          case 'dinner':
            mealSchedule.dinner = activity;
            break;
          case 'snack':
            mealSchedule.snacks.push(activity);
            break;
        }
      }
    }
    
    return mealSchedule;
  }

  // 6. Rest period scheduling for sustainable itineraries
  private static addRestPeriods(schedules: DailySchedule[], request: SchedulingRequest): DailySchedule[] {
    return schedules.map(schedule => {
      const restPeriods: RestPeriod[] = [];
      
      for (let i = 0; i < schedule.activities.length - 1; i++) {
        const current = schedule.activities[i];
        const next = schedule.activities[i + 1];
        
        const restStart = current.endTime;
        const restEnd = next.scheduledTime;
        const duration = this.parseTime(restEnd) - this.parseTime(restStart);
        
        if (duration > 0) {
          const restType = this.determineRestType(duration, current.fatigueImpact);
          
          restPeriods.push({
            startTime: restStart,
            endTime: restEnd,
            duration,
            type: restType,
            location: current.location_name
          });
        }
      }
      
      return {
        ...schedule,
        restPeriods
      };
    });
  }

  // Determine type of rest period based on duration and context
  private static determineRestType(duration: number, fatigueImpact: number): RestPeriod['type'] {
    if (duration >= 120) return 'free_time';
    if (duration >= 60) return 'rest_period';
    if (duration >= 30 && fatigueImpact > 0.6) return 'meal_break';
    return 'short_break';
  }

  // Calculate daily intensity
  private static calculateDailyIntensity(activities: ScheduledActivity[]): number {
    if (activities.length === 0) return 0;
    
    const totalIntensity = activities.reduce((sum, activity) => {
      const intensity = (
        activity.activityIntensity.physicalDemand +
        activity.activityIntensity.mentalDemand +
        activity.activityIntensity.socialDemand
      ) / 3;
      return sum + intensity;
    }, 0);
    
    return totalIntensity / activities.length;
  }

  // Calculate daily balance score
  private static calculateDailyBalanceScore(activities: ScheduledActivity[]): number {
    if (activities.length === 0) return 0;
    
    // Check intensity distribution
    const intensityCounts = { low: 0, medium: 0, high: 0 };
    activities.forEach(activity => {
      intensityCounts[activity.activityIntensity.level]++;
    });
    
    // Ideal distribution: some of each type
    const total = activities.length;
    const lowRatio = intensityCounts.low / total;
    const mediumRatio = intensityCounts.medium / total;
    const highRatio = intensityCounts.high / total;
    
    // Balance score based on variety (not too much of any one type)
    const variety = 1 - Math.max(lowRatio, mediumRatio, highRatio);
    
    // Check for good pacing (not all high intensity activities together)
    const pacingScore = this.calculatePacingScore(activities);
    
    return (variety * 0.6 + pacingScore * 0.4);
  }

  // Calculate pacing score (smooth transitions between intensities)
  private static calculatePacingScore(activities: ScheduledActivity[]): number {
    if (activities.length <= 1) return 1;
    
    let goodTransitions = 0;
    let totalTransitions = activities.length - 1;
    
    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i].activityIntensity.level;
      const next = activities[i + 1].activityIntensity.level;
      
      // Good transitions: not jumping from low to high or high to low
      if (
        (current === 'low' && next !== 'high') ||
        (current === 'medium') ||
        (current === 'high' && next !== 'low')
      ) {
        goodTransitions++;
      }
    }
    
    return goodTransitions / totalTransitions;
  }

  // Calculate daily fatigue level
  private static calculateDailyFatigueLevel(activities: ScheduledActivity[]): number {
    if (activities.length === 0) return 0;
    
    let cumulativeFatigue = 0;
    
    activities.forEach((activity, index) => {
      // Fatigue accumulates throughout the day
      const positionMultiplier = 1 + (index / activities.length) * 0.5;
      cumulativeFatigue += activity.fatigueImpact * positionMultiplier;
    });
    
    return Math.min(cumulativeFatigue / activities.length, 1.0);
  }

  // Calculate daily summary
  private static calculateDailySummary(activities: ScheduledActivity[]): DailySchedule['dailySummary'] {
    const totalActivities = activities.length;
    const totalActiveTime = activities.reduce((sum, a) => sum + a.activityIntensity.duration, 0);
    const totalRestTime = activities.reduce((sum, a) => sum + a.restPeriodAfter, 0);
    
    const intensityDistribution = {
      low: activities.filter(a => a.activityIntensity.level === 'low').length,
      medium: activities.filter(a => a.activityIntensity.level === 'medium').length,
      high: activities.filter(a => a.activityIntensity.level === 'high').length
    };
    
    // Sustainability score based on balance and rest
    const balanceScore = this.calculateDailyBalanceScore(activities);
    const restRatio = totalRestTime / (totalActiveTime + totalRestTime);
    const sustainabilityScore = (balanceScore * 0.7 + restRatio * 0.3);
    
    return {
      totalActivities,
      totalActiveTime,
      totalRestTime,
      intensityDistribution,
      sustainabilityScore
    };
  }

  // Calculate overall balance across all days
  private static calculateOverallBalance(schedules: DailySchedule[]): SchedulingResult['overallBalance'] {
    if (schedules.length === 0) {
      return {
        averageIntensity: 0,
        balanceScore: 0,
        sustainabilityScore: 0,
        fatigueManagement: 0
      };
    }
    
    const averageIntensity = schedules.reduce((sum, s) => sum + s.totalIntensity, 0) / schedules.length;
    const balanceScore = schedules.reduce((sum, s) => sum + s.balanceScore, 0) / schedules.length;
    const sustainabilityScore = schedules.reduce((sum, s) => sum + s.dailySummary.sustainabilityScore, 0) / schedules.length;
    
    // Fatigue management: how well fatigue is controlled across days
    const maxFatigue = Math.max(...schedules.map(s => s.fatigueLevel));
    const fatigueVariance = this.calculateVariance(schedules.map(s => s.fatigueLevel));
    const fatigueManagement = 1 - (maxFatigue * 0.6 + fatigueVariance * 0.4);
    
    return {
      averageIntensity,
      balanceScore,
      sustainabilityScore,
      fatigueManagement: Math.max(0, fatigueManagement)
    };
  }

  // Calculate variance of an array
  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  // Generate recommendations
  private static generateRecommendations(schedules: DailySchedule[], request: SchedulingRequest): string[] {
    const recommendations: string[] = [];
    
    // Check overall balance
    const overallBalance = this.calculateOverallBalance(schedules);
    
    if (overallBalance.averageIntensity > 0.8) {
      recommendations.push('Consider reducing activity intensity for a more sustainable pace');
    }
    
    if (overallBalance.balanceScore < 0.6) {
      recommendations.push('Try to mix different types of activities throughout each day');
    }
    
    if (overallBalance.fatigueManagement < 0.5) {
      recommendations.push('Add more rest periods and consider lighter activities in later days');
    }
    
    // Check individual days
    schedules.forEach((schedule, index) => {
      if (schedule.fatigueLevel > 0.8) {
        recommendations.push(`Day ${index + 1}: Consider reducing the number of activities or adding more breaks`);
      }
      
      if (schedule.dailySummary.sustainabilityScore < 0.5) {
        recommendations.push(`Day ${index + 1}: Schedule needs better balance between active time and rest`);
      }
    });
    
    return recommendations;
  }

  // Generate warnings
  private static generateWarnings(schedules: DailySchedule[], request: SchedulingRequest): string[] {
    const warnings: string[] = [];
    
    schedules.forEach((schedule, index) => {
      // Check for over-scheduling
      if (schedule.activities.length > 8) {
        warnings.push(`Day ${index + 1}: Too many activities scheduled (${schedule.activities.length})`);
      }
      
      // Check for insufficient rest
      const totalRestTime = schedule.dailySummary.totalRestTime;
      const totalActiveTime = schedule.dailySummary.totalActiveTime;
      
      if (totalRestTime < totalActiveTime * 0.2) {
        warnings.push(`Day ${index + 1}: Insufficient rest time scheduled`);
      }
      
      // Check for meal timing issues
      if (!schedule.mealSchedule.lunch) {
        warnings.push(`Day ${index + 1}: No lunch scheduled`);
      }
      
      if (!schedule.mealSchedule.dinner) {
        warnings.push(`Day ${index + 1}: No dinner scheduled`);
      }
    });
    
    return warnings;
  }

  // Utility functions
  private static parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}