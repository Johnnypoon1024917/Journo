import { 
  SuggestedPlace, 
  ScheduledPlace, 
  ScheduledRoute, 
  OpeningHours,
  RouteSegment,
  OptimizedRoute
} from './routeOptimizationService.js';

export interface ScheduleGenerationRequest {
  optimizedRoute: OptimizedRoute;
  startTime: string; // HH:MM format (e.g., "09:00")
  endTime: string; // HH:MM format (e.g., "21:00")
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced';
  date?: string; // YYYY-MM-DD for day of week calculation
  includeMeals?: boolean;
}

export interface ActivityBalance {
  activeCount: number;
  relaxedCount: number;
  balanceScore: number; // 0-1, higher is better
  recommendations: string[];
}

export class ScheduleGenerationService {
  private static readonly TIME_BUFFER_MINUTES = 15;
  private static readonly MEAL_TIMES = {
    breakfast: { start: '08:00', duration: 45 },
    lunch: { start: '12:00', duration: 60 },
    dinner: { start: '18:30', duration: 90 }
  };

  private static readonly ACTIVITY_INTENSITY: { [key: string]: 'active' | 'relaxed' } = {
    'attraction': 'active',
    'food': 'relaxed',
    'hotel': 'relaxed',
    'shopping': 'active',
    'nature': 'active',
    'culture': 'active',
    'entertainment': 'relaxed',
    'other': 'relaxed'
  };

  /**
   * Generate a complete schedule with time allocations
   */
  static async generateSchedule(request: ScheduleGenerationRequest): Promise<ScheduledRoute> {
    const { optimizedRoute, startTime, endTime, travelStyle, date, includeMeals = true } = request;
    const { orderedPlaces, routeSegments } = optimizedRoute;

    if (orderedPlaces.length === 0) {
      return this.createEmptySchedule();
    }

    // Calculate available time
    const availableMinutes = this.calculateTimeDifference(startTime, endTime);
    
    // Allocate time for meals if requested
    const mealBreaks = includeMeals ? this.scheduleMealBreaks(startTime, endTime) : [];
    const mealTime = mealBreaks.reduce((sum, meal) => sum + meal.duration, 0);

    // Calculate time needed for visits and travel
    const visitTime = orderedPlaces.reduce((sum, place) => sum + place.estimatedDuration, 0);
    const travelTime = routeSegments.reduce((sum, seg) => sum + seg.duration, 0);
    const bufferTime = (orderedPlaces.length - 1) * this.TIME_BUFFER_MINUTES;

    const totalNeededTime = visitTime + travelTime + bufferTime + mealTime;
    const freeTime = Math.max(0, availableMinutes - totalNeededTime);

    // Generate scheduled places with time slots
    const scheduledPlaces = await this.allocateTimeSlots(
      orderedPlaces,
      routeSegments,
      startTime,
      mealBreaks,
      date
    );

    // Validate opening hours compliance
    const openingHoursWarnings = this.validateOpeningHours(scheduledPlaces, date);

    // Check activity balance
    const balanceWarnings = this.checkActivityBalance(scheduledPlaces);

    // Determine feasibility
    const feasible = totalNeededTime <= availableMinutes && openingHoursWarnings.length === 0;
    const warnings = [
      ...openingHoursWarnings,
      ...balanceWarnings,
      ...(totalNeededTime > availableMinutes ? [`Schedule exceeds available time by ${totalNeededTime - availableMinutes} minutes`] : [])
    ];

    return {
      scheduledPlaces,
      totalScheduledTime: totalNeededTime,
      freeTime,
      mealBreaks,
      feasible,
      warnings
    };
  }

  /**
   * Allocate specific time slots to each place
   */
  private static async allocateTimeSlots(
    places: SuggestedPlace[],
    segments: RouteSegment[],
    startTime: string,
    mealBreaks: { time: string; duration: number; type: 'breakfast' | 'lunch' | 'dinner' }[],
    date?: string
  ): Promise<ScheduledPlace[]> {
    const scheduledPlaces: ScheduledPlace[] = [];
    let currentTime = this.parseTime(startTime);

    for (let i = 0; i < places.length; i++) {
      const place = places[i];

      // Check if we need to insert a meal break before this place
      const mealBreak = this.findNextMealBreak(this.formatTime(currentTime), mealBreaks);
      if (mealBreak && !this.isMealScheduled(scheduledPlaces, mealBreak.type)) {
        const mealTime = this.parseTime(mealBreak.time);
        
        // If current time is before meal time, skip to meal time
        if (currentTime < mealTime) {
          currentTime = mealTime;
        }
        
        // Add meal duration
        currentTime += mealBreak.duration;
      }

      // Add travel time from previous place
      if (i > 0 && segments[i - 1]) {
        currentTime += segments[i - 1].duration;
        currentTime += this.TIME_BUFFER_MINUTES; // Add buffer
      }

      // Check if place is a restaurant and align with meal time
      if (place.placeType === 'food') {
        const nearestMealTime = this.findNearestMealTime(currentTime);
        if (nearestMealTime && Math.abs(currentTime - nearestMealTime) <= 60) {
          currentTime = nearestMealTime;
        }
      }

      const scheduledStartTime = this.formatTime(currentTime);
      currentTime += place.estimatedDuration;
      const scheduledEndTime = this.formatTime(currentTime);

      scheduledPlaces.push({
        ...place,
        scheduledStartTime,
        scheduledEndTime,
        bufferTime: i < places.length - 1 ? this.TIME_BUFFER_MINUTES : 0
      });
    }

    return scheduledPlaces;
  }

  /**
   * Schedule meal breaks at appropriate times
   */
  private static scheduleMealBreaks(
    startTime: string,
    endTime: string
  ): { time: string; duration: number; type: 'breakfast' | 'lunch' | 'dinner' }[] {
    const meals: { time: string; duration: number; type: 'breakfast' | 'lunch' | 'dinner' }[] = [];
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    // Check which meals fall within the time range
    if (this.isTimeInRange(this.MEAL_TIMES.breakfast.start, startTime, endTime)) {
      meals.push({
        time: this.MEAL_TIMES.breakfast.start,
        duration: this.MEAL_TIMES.breakfast.duration,
        type: 'breakfast'
      });
    }

    if (this.isTimeInRange(this.MEAL_TIMES.lunch.start, startTime, endTime)) {
      meals.push({
        time: this.MEAL_TIMES.lunch.start,
        duration: this.MEAL_TIMES.lunch.duration,
        type: 'lunch'
      });
    }

    if (this.isTimeInRange(this.MEAL_TIMES.dinner.start, startTime, endTime)) {
      meals.push({
        time: this.MEAL_TIMES.dinner.start,
        duration: this.MEAL_TIMES.dinner.duration,
        type: 'dinner'
      });
    }

    return meals;
  }

  /**
   * Validate that places are scheduled during their opening hours
   */
  private static validateOpeningHours(scheduledPlaces: ScheduledPlace[], date?: string): string[] {
    const warnings: string[] = [];

    if (!date) {
      return warnings; // Can't validate without date
    }

    const dayOfWeek = this.getDayOfWeek(date);

    for (const place of scheduledPlaces) {
      if (!place.openingHours) {
        continue; // No opening hours data available
      }

      const dayHours = this.getHoursForDay(place.openingHours, dayOfWeek);
      
      if (!dayHours) {
        warnings.push(`${place.name} may be closed on ${dayOfWeek}`);
        continue;
      }

      const scheduledStart = this.parseTime(place.scheduledStartTime);
      const scheduledEnd = this.parseTime(place.scheduledEndTime);
      const openTime = this.parseTime(dayHours.open);
      const closeTime = this.parseTime(dayHours.close);

      if (scheduledStart < openTime || scheduledEnd > closeTime) {
        warnings.push(
          `${place.name} is scheduled outside opening hours (${dayHours.open}-${dayHours.close})`
        );
      }
    }

    return warnings;
  }

  /**
   * Check activity balance (mix of active and relaxed activities)
   */
  private static checkActivityBalance(scheduledPlaces: ScheduledPlace[]): string[] {
    const warnings: string[] = [];
    const balance = this.calculateActivityBalance(scheduledPlaces);

    if (balance.balanceScore < 0.3) {
      warnings.push('Schedule is heavily skewed towards one activity type. Consider mixing active and relaxed activities.');
    }

    if (balance.activeCount > balance.relaxedCount * 3) {
      warnings.push('Too many active activities. Consider adding more relaxed activities for balance.');
    }

    if (balance.relaxedCount > balance.activeCount * 3) {
      warnings.push('Too many relaxed activities. Consider adding more active activities for variety.');
    }

    // Check for consecutive active activities
    let consecutiveActive = 0;
    for (const place of scheduledPlaces) {
      const intensity = this.ACTIVITY_INTENSITY[place.placeType] || 'relaxed';
      if (intensity === 'active') {
        consecutiveActive++;
        if (consecutiveActive >= 3) {
          warnings.push('Three or more consecutive active activities detected. Consider adding breaks.');
          break;
        }
      } else {
        consecutiveActive = 0;
      }
    }

    return warnings;
  }

  /**
   * Calculate activity balance score
   */
  static calculateActivityBalance(places: ScheduledPlace[]): ActivityBalance {
    let activeCount = 0;
    let relaxedCount = 0;

    for (const place of places) {
      const intensity = this.ACTIVITY_INTENSITY[place.placeType] || 'relaxed';
      if (intensity === 'active') {
        activeCount++;
      } else {
        relaxedCount++;
      }
    }

    const total = activeCount + relaxedCount;
    const idealRatio = 0.5; // 50/50 split is ideal
    const actualRatio = total > 0 ? activeCount / total : 0.5;
    const balanceScore = 1 - Math.abs(actualRatio - idealRatio) * 2;

    const recommendations: string[] = [];
    if (balanceScore < 0.5) {
      if (activeCount > relaxedCount) {
        recommendations.push('Add more relaxed activities like cafes or scenic viewpoints');
      } else {
        recommendations.push('Add more active activities like museums or outdoor attractions');
      }
    }

    return {
      activeCount,
      relaxedCount,
      balanceScore: Math.max(0, Math.min(1, balanceScore)),
      recommendations
    };
  }

  /**
   * Ensure adequate free time for spontaneous exploration
   */
  static validateFreeTime(
    scheduledRoute: ScheduledRoute,
    travelStyle: 'relaxed' | 'moderate' | 'fast-paced'
  ): { adequate: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Minimum free time based on travel style
    const minFreeTime = {
      'relaxed': 120, // 2 hours
      'moderate': 60, // 1 hour
      'fast-paced': 30 // 30 minutes
    };

    const required = minFreeTime[travelStyle];
    const adequate = scheduledRoute.freeTime >= required;

    if (!adequate) {
      warnings.push(
        `Insufficient free time (${scheduledRoute.freeTime} min). ` +
        `Recommended: ${required} min for ${travelStyle} travel style.`
      );
    }

    return { adequate, warnings };
  }

  // Helper methods

  private static parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private static calculateTimeDifference(startTime: string, endTime: string): number {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    return end > start ? end - start : (24 * 60 - start) + end;
  }

  private static isTimeInRange(time: string, startTime: string, endTime: string): boolean {
    const t = this.parseTime(time);
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    
    if (end > start) {
      return t >= start && t <= end;
    } else {
      return t >= start || t <= end;
    }
  }

  private static findNextMealBreak(
    currentTime: string,
    mealBreaks: { time: string; duration: number; type: 'breakfast' | 'lunch' | 'dinner' }[]
  ): { time: string; duration: number; type: 'breakfast' | 'lunch' | 'dinner' } | null {
    const current = this.parseTime(currentTime);
    
    for (const meal of mealBreaks) {
      const mealTime = this.parseTime(meal.time);
      if (mealTime >= current - 30 && mealTime <= current + 60) {
        return meal;
      }
    }
    
    return null;
  }

  private static isMealScheduled(
    scheduledPlaces: ScheduledPlace[],
    mealType: 'breakfast' | 'lunch' | 'dinner'
  ): boolean {
    // Check if a food place is already scheduled near the meal time
    const mealTime = this.parseTime(this.MEAL_TIMES[mealType].start);
    
    return scheduledPlaces.some(place => {
      if (place.placeType !== 'food') return false;
      const placeTime = this.parseTime(place.scheduledStartTime);
      return Math.abs(placeTime - mealTime) <= 60; // Within 1 hour
    });
  }

  private static findNearestMealTime(currentMinutes: number): number | null {
    const mealTimes = [
      this.parseTime(this.MEAL_TIMES.breakfast.start),
      this.parseTime(this.MEAL_TIMES.lunch.start),
      this.parseTime(this.MEAL_TIMES.dinner.start)
    ];

    let nearest: number | null = null;
    let minDiff = Infinity;

    for (const mealTime of mealTimes) {
      const diff = Math.abs(currentMinutes - mealTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = mealTime;
      }
    }

    return nearest;
  }

  private static getDayOfWeek(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private static getHoursForDay(
    openingHours: OpeningHours,
    dayOfWeek: string
  ): { open: string; close: string } | null {
    const day = dayOfWeek.toLowerCase() as keyof OpeningHours;
    return openingHours[day] || null;
  }

  private static createEmptySchedule(): ScheduledRoute {
    return {
      scheduledPlaces: [],
      totalScheduledTime: 0,
      freeTime: 0,
      mealBreaks: [],
      feasible: true,
      warnings: []
    };
  }
}
