import { WeatherClassification, weatherService } from './weatherService.js';

export interface PlaceWithWeatherSuitability {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeType: string;
  rating?: number;
  tips?: string;
  estimatedCost?: number;
  weatherSuitability?: number;
  weatherCategory?: 'indoor' | 'outdoor' | 'flexible';
}

export interface WeatherBasedFilterOptions {
  weatherClassification: WeatherClassification;
  minSuitabilityScore?: number; // Default 0.5
  prioritizeIndoor?: boolean;
  prioritizeOutdoor?: boolean;
}

export interface DailyScheduleAdjustment {
  dayNumber: number;
  date: string;
  weatherClassification: WeatherClassification;
  originalPlaces: PlaceWithWeatherSuitability[];
  adjustedPlaces: PlaceWithWeatherSuitability[];
  adjustmentReason: string;
}

/**
 * Service for filtering and adjusting places based on weather conditions
 */
export class WeatherBasedPlaceFilteringService {
  /**
   * Filter places based on weather conditions
   * Prioritizes places suitable for the given weather
   */
  static filterPlacesByWeather(
    places: PlaceWithWeatherSuitability[],
    options: WeatherBasedFilterOptions
  ): PlaceWithWeatherSuitability[] {
    const { weatherClassification, minSuitabilityScore = 0.5 } = options;

    // Add weather suitability scores to places
    const scoredPlaces = weatherService.addWeatherSuitabilityScoring(
      places,
      weatherClassification
    );

    // Filter by minimum suitability score
    const filteredPlaces = scoredPlaces.filter(
      place => place.weatherSuitability >= minSuitabilityScore
    );

    // Sort by weather suitability (highest first)
    return filteredPlaces.sort((a, b) => b.weatherSuitability - a.weatherSuitability);
  }

  /**
   * Apply rainy weather logic - prioritize indoor attractions and museums
   */
  static applyRainyWeatherLogic(
    places: PlaceWithWeatherSuitability[]
  ): PlaceWithWeatherSuitability[] {
    const indoorKeywords = [
      'museum', 'gallery', 'shopping', 'mall', 'market', 'restaurant',
      'cafe', 'theater', 'cinema', 'aquarium', 'spa', 'indoor'
    ];

    return places
      .map(place => {
        const isIndoor = indoorKeywords.some(keyword =>
          place.name.toLowerCase().includes(keyword) ||
          place.placeType.toLowerCase().includes(keyword)
        );

        return {
          ...place,
          weatherCategory: isIndoor ? 'indoor' as const : 'outdoor' as const,
          weatherSuitability: isIndoor ? 0.9 : 0.2
        };
      })
      .sort((a, b) => b.weatherSuitability - a.weatherSuitability);
  }

  /**
   * Apply sunny weather logic - include outdoor activities, parks, and beaches
   */
  static applySunnyWeatherLogic(
    places: PlaceWithWeatherSuitability[]
  ): PlaceWithWeatherSuitability[] {
    const outdoorKeywords = [
      'park', 'beach', 'garden', 'outdoor', 'hiking', 'viewpoint',
      'monument', 'bridge', 'lake', 'river', 'mountain', 'zoo', 'stadium'
    ];

    return places
      .map(place => {
        const isOutdoor = outdoorKeywords.some(keyword =>
          place.name.toLowerCase().includes(keyword) ||
          place.placeType.toLowerCase().includes(keyword)
        );

        return {
          ...place,
          weatherCategory: isOutdoor ? 'outdoor' as const : 'indoor' as const,
          weatherSuitability: isOutdoor ? 0.9 : 0.4
        };
      })
      .sort((a, b) => b.weatherSuitability - a.weatherSuitability);
  }

  /**
   * Apply cold weather logic - prioritize indoor markets, hot springs, winter activities
   */
  static applyColdWeatherLogic(
    places: PlaceWithWeatherSuitability[]
  ): PlaceWithWeatherSuitability[] {
    const coldWeatherKeywords = [
      'indoor', 'market', 'hot spring', 'spa', 'museum', 'gallery',
      'shopping', 'mall', 'restaurant', 'cafe', 'theater', 'cinema',
      'winter', 'ski', 'ice', 'snow'
    ];

    return places
      .map(place => {
        const isColdWeatherSuitable = coldWeatherKeywords.some(keyword =>
          place.name.toLowerCase().includes(keyword) ||
          place.placeType.toLowerCase().includes(keyword)
        );

        return {
          ...place,
          weatherCategory: isColdWeatherSuitable ? 'indoor' as const : 'outdoor' as const,
          weatherSuitability: isColdWeatherSuitable ? 0.8 : 0.3
        };
      })
      .sort((a, b) => b.weatherSuitability - a.weatherSuitability);
  }

  /**
   * Adjust daily schedule based on weather conditions
   * Moves indoor activities to rainy days and outdoor activities to sunny days
   */
  static adjustScheduleForWeather(
    dailyPlaces: Array<{
      dayNumber: number;
      date: string;
      weatherClassification: WeatherClassification;
      places: PlaceWithWeatherSuitability[];
    }>
  ): DailyScheduleAdjustment[] {
    const adjustments: DailyScheduleAdjustment[] = [];

    // Categorize all places by weather suitability
    const allPlaces = dailyPlaces.flatMap(day => 
      day.places.map(place => ({
        ...place,
        originalDay: day.dayNumber,
        originalDate: day.date
      }))
    );

    // Score each place for each day
    const placeScores = allPlaces.map(place => {
      const dayScores = dailyPlaces.map(day => {
        const scoredPlace = weatherService.addWeatherSuitabilityScoring(
          [place],
          day.weatherClassification
        )[0];
        
        return {
          dayNumber: day.dayNumber,
          date: day.date,
          weatherClassification: day.weatherClassification,
          suitabilityScore: scoredPlace.weatherSuitability
        };
      });

      return {
        place,
        dayScores
      };
    });

    // Reassign places to optimal days
    const newDailyPlaces: Map<number, PlaceWithWeatherSuitability[]> = new Map();
    dailyPlaces.forEach(day => newDailyPlaces.set(day.dayNumber, []));

    placeScores.forEach(({ place, dayScores }) => {
      // Find the best day for this place
      const bestDay = dayScores.reduce((best, current) => 
        current.suitabilityScore > best.suitabilityScore ? current : best
      );

      const assignedPlaces = newDailyPlaces.get(bestDay.dayNumber) || [];
      assignedPlaces.push({
        ...place,
        weatherSuitability: bestDay.suitabilityScore
      });
      newDailyPlaces.set(bestDay.dayNumber, assignedPlaces);
    });

    // Create adjustment records
    dailyPlaces.forEach(day => {
      const adjustedPlaces = newDailyPlaces.get(day.dayNumber) || [];
      const originalPlaceNames = day.places.map(p => p.name).sort();
      const adjustedPlaceNames = adjustedPlaces.map(p => p.name).sort();
      
      const hasChanges = JSON.stringify(originalPlaceNames) !== JSON.stringify(adjustedPlaceNames);

      adjustments.push({
        dayNumber: day.dayNumber,
        date: day.date,
        weatherClassification: day.weatherClassification,
        originalPlaces: day.places,
        adjustedPlaces,
        adjustmentReason: hasChanges
          ? `Optimized for ${day.weatherClassification.primary} weather`
          : 'No adjustment needed'
      });
    });

    return adjustments;
  }

  /**
   * Generate weather-appropriate packing list items
   */
  static generateWeatherPackingItems(
    weatherClassifications: WeatherClassification[]
  ): string[] {
    const packingItems: Set<string> = new Set();

    // Count weather types
    const weatherCounts = weatherClassifications.reduce((acc, classification) => {
      acc[classification.primary] = (acc[classification.primary] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalDays = weatherClassifications.length;

    // Rainy weather items
    if (weatherCounts.rainy && weatherCounts.rainy / totalDays > 0.3) {
      packingItems.add('Umbrella');
      packingItems.add('Rain jacket');
      packingItems.add('Waterproof shoes');
      packingItems.add('Waterproof bag');
    }

    // Sunny weather items
    if (weatherCounts.sunny && weatherCounts.sunny / totalDays > 0.3) {
      packingItems.add('Sunscreen');
      packingItems.add('Sunglasses');
      packingItems.add('Hat');
      packingItems.add('Light clothing');
      packingItems.add('Swimwear');
    }

    // Cold weather items
    if (weatherCounts.cold && weatherCounts.cold / totalDays > 0.3) {
      packingItems.add('Warm jacket');
      packingItems.add('Gloves');
      packingItems.add('Scarf');
      packingItems.add('Thermal wear');
      packingItems.add('Warm socks');
      packingItems.add('Winter boots');
    }

    // Hot weather items
    if (weatherCounts.hot && weatherCounts.hot / totalDays > 0.3) {
      packingItems.add('Light breathable clothing');
      packingItems.add('Cooling towel');
      packingItems.add('Portable fan');
      packingItems.add('Hydration pack');
      packingItems.add('Sunscreen (high SPF)');
    }

    // Mixed weather items
    if (Object.keys(weatherCounts).length > 2) {
      packingItems.add('Layered clothing');
      packingItems.add('Versatile jacket');
      packingItems.add('Comfortable walking shoes');
    }

    return Array.from(packingItems);
  }

  /**
   * Get place recommendations based on weather classification
   */
  static getWeatherBasedRecommendations(
    weatherClassification: WeatherClassification
  ): {
    recommendedPlaceTypes: string[];
    avoidPlaceTypes: string[];
    tips: string[];
  } {
    const recommendations = {
      recommendedPlaceTypes: [] as string[],
      avoidPlaceTypes: [] as string[],
      tips: [] as string[]
    };

    switch (weatherClassification.primary) {
      case 'rainy':
        recommendations.recommendedPlaceTypes = [
          'museum', 'gallery', 'shopping_mall', 'market', 'restaurant',
          'cafe', 'theater', 'cinema', 'aquarium', 'spa'
        ];
        recommendations.avoidPlaceTypes = [
          'park', 'beach', 'hiking', 'outdoor_market', 'viewpoint'
        ];
        recommendations.tips = [
          'Bring an umbrella and waterproof clothing',
          'Plan indoor activities for the day',
          'Check if outdoor attractions have indoor sections',
          'Consider visiting museums and galleries'
        ];
        break;

      case 'sunny':
        recommendations.recommendedPlaceTypes = [
          'park', 'beach', 'garden', 'viewpoint', 'outdoor_market',
          'hiking', 'zoo', 'stadium', 'monument'
        ];
        recommendations.avoidPlaceTypes = [];
        recommendations.tips = [
          'Apply sunscreen regularly',
          'Stay hydrated throughout the day',
          'Wear light, breathable clothing',
          'Take advantage of outdoor activities'
        ];
        break;

      case 'cold':
        recommendations.recommendedPlaceTypes = [
          'museum', 'gallery', 'shopping_mall', 'indoor_market',
          'restaurant', 'cafe', 'hot_spring', 'spa', 'winter_sports'
        ];
        recommendations.avoidPlaceTypes = [
          'beach', 'water_park', 'outdoor_pool'
        ];
        recommendations.tips = [
          'Dress in warm layers',
          'Bring gloves and a scarf',
          'Consider indoor attractions',
          'Try local hot springs or spas'
        ];
        break;

      case 'hot':
        recommendations.recommendedPlaceTypes = [
          'beach', 'water_park', 'indoor_attraction', 'air_conditioned_mall',
          'swimming_pool', 'shaded_park'
        ];
        recommendations.avoidPlaceTypes = [
          'hiking', 'outdoor_market', 'exposed_viewpoint'
        ];
        recommendations.tips = [
          'Stay hydrated and take frequent breaks',
          'Avoid outdoor activities during peak heat hours',
          'Seek air-conditioned spaces',
          'Wear light, breathable clothing'
        ];
        break;
    }

    return recommendations;
  }
}
