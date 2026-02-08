import { pool } from '../config/database.js';

export interface Traveler {
  name: string;
  age?: number;
  ageGroup?: 'adult' | 'child' | 'baby';
}

export interface PackingSuggestionParams {
  destination?: string;
  destinationType?: string;
  weather?: {
    maxTemp: number;
    minTemp: number;
    condition?: string;
  };
  tripDurationDays?: number;
  activities?: string[];
  travelers?: Traveler[];
}

export interface PackingSuggestion {
  item: string;
  category: string;
  reason?: string;
}

export class PackingSuggestionService {
  // Generate packing suggestions based on trip parameters
  static async generateSuggestions(params: PackingSuggestionParams): Promise<PackingSuggestion[]> {
    const suggestions: PackingSuggestion[] = [];

    // Add base essentials
    suggestions.push(...this.getBaseEssentials());

    // Add destination-specific suggestions
    if (params.destination) {
      suggestions.push(...this.getDestinationSpecificSuggestions(params.destination));
    }

    // Add destination type suggestions
    if (params.destinationType) {
      suggestions.push(...this.getDestinationTypeSuggestions(params.destinationType));
    }

    // Add weather-based suggestions
    if (params.weather) {
      suggestions.push(...this.getWeatherBasedSuggestions(params.weather));
    }

    // Add duration-based suggestions
    if (params.tripDurationDays) {
      suggestions.push(...this.getDurationBasedSuggestions(params.tripDurationDays));
    }

    // Add activity-based suggestions
    if (params.activities && params.activities.length > 0) {
      suggestions.push(...this.getActivityBasedSuggestions(params.activities));
    }

    // Add traveler-specific suggestions
    if (params.travelers && params.travelers.length > 0) {
      suggestions.push(...this.getTravelerSpecificSuggestions(params.travelers));
    }

    // Remove duplicates
    const uniqueSuggestions = this.removeDuplicates(suggestions);

    return uniqueSuggestions;
  }

  // Base essentials for any trip
  private static getBaseEssentials(): PackingSuggestion[] {
    return [
      { item: 'Passport', category: 'documents', reason: 'Essential for travel' },
      { item: 'Phone charger', category: 'electronics', reason: 'Essential for travel' },
      { item: 'Wallet', category: 'essentials', reason: 'Essential for travel' },
      { item: 'Toothbrush', category: 'toiletries', reason: 'Essential for travel' },
      { item: 'Toothpaste', category: 'toiletries', reason: 'Essential for travel' },
      { item: 'Underwear (3-5 pairs)', category: 'clothing', reason: 'Essential for travel' },
      { item: 'Socks (3-5 pairs)', category: 'clothing', reason: 'Essential for travel' },
    ];
  }

  // Destination-specific suggestions
  private static getDestinationSpecificSuggestions(destination: string): PackingSuggestion[] {
    const suggestions: PackingSuggestion[] = [];
    const destLower = destination.toLowerCase();

    // Japan-specific
    if (destLower.includes('japan') || destLower.includes('tokyo') || destLower.includes('osaka') || destLower.includes('kyoto')) {
      suggestions.push(
        { item: 'Travel adapter (Type A/B)', category: 'electronics', reason: 'Japan uses Type A/B outlets' },
        { item: 'JR Pass', category: 'documents', reason: 'Useful for train travel in Japan' },
        { item: 'Pocket WiFi', category: 'electronics', reason: 'Helpful for navigation in Japan' }
      );
    }

    // UK-specific
    if (destLower.includes('uk') || destLower.includes('london') || destLower.includes('england')) {
      suggestions.push(
        { item: 'Travel adapter (Type G)', category: 'electronics', reason: 'UK uses Type G outlets' },
        { item: 'Umbrella', category: 'essentials', reason: 'Frequent rain in UK' }
      );
    }

    // Europe-specific
    if (destLower.includes('europe') || destLower.includes('france') || destLower.includes('germany') || destLower.includes('italy') || destLower.includes('spain')) {
      suggestions.push(
        { item: 'Travel adapter (Type C/E/F)', category: 'electronics', reason: 'Europe uses Type C/E/F outlets' }
      );
    }

    // Australia-specific
    if (destLower.includes('australia') || destLower.includes('sydney') || destLower.includes('melbourne')) {
      suggestions.push(
        { item: 'Travel adapter (Type I)', category: 'electronics', reason: 'Australia uses Type I outlets' },
        { item: 'Sunscreen SPF50+', category: 'health', reason: 'Strong UV in Australia' }
      );
    }

    return suggestions;
  }

  // Destination type suggestions (beach, city, mountain, winter)
  private static getDestinationTypeSuggestions(type: string): PackingSuggestion[] {
    const suggestions: PackingSuggestion[] = [];
    const typeLower = type.toLowerCase();

    if (typeLower.includes('beach')) {
      suggestions.push(
        { item: 'Swimsuit', category: 'clothing', reason: 'Beach destination' },
        { item: 'Beach towel', category: 'essentials', reason: 'Beach destination' },
        { item: 'Sunscreen SPF50', category: 'health', reason: 'Beach destination' },
        { item: 'Sunglasses', category: 'essentials', reason: 'Beach destination' },
        { item: 'Flip flops', category: 'clothing', reason: 'Beach destination' },
        { item: 'Hat', category: 'clothing', reason: 'Beach destination' }
      );
    }

    if (typeLower.includes('city')) {
      suggestions.push(
        { item: 'Comfortable walking shoes', category: 'clothing', reason: 'City exploration' },
        { item: 'Day backpack', category: 'essentials', reason: 'City exploration' },
        { item: 'Portable charger', category: 'electronics', reason: 'City exploration' }
      );
    }

    if (typeLower.includes('mountain') || typeLower.includes('hiking')) {
      suggestions.push(
        { item: 'Hiking boots', category: 'clothing', reason: 'Mountain destination' },
        { item: 'Waterproof jacket', category: 'clothing', reason: 'Mountain destination' },
        { item: 'Water bottle', category: 'essentials', reason: 'Mountain destination' },
        { item: 'First aid kit', category: 'health', reason: 'Mountain destination' },
        { item: 'Hiking backpack', category: 'essentials', reason: 'Mountain destination' }
      );
    }

    if (typeLower.includes('winter') || typeLower.includes('ski') || typeLower.includes('snow')) {
      suggestions.push(
        { item: 'Winter coat', category: 'clothing', reason: 'Winter destination' },
        { item: 'Gloves', category: 'clothing', reason: 'Winter destination' },
        { item: 'Scarf', category: 'clothing', reason: 'Winter destination' },
        { item: 'Warm hat', category: 'clothing', reason: 'Winter destination' },
        { item: 'Thermal underwear', category: 'clothing', reason: 'Winter destination' },
        { item: 'Hand warmers', category: 'essentials', reason: 'Winter destination' }
      );
    }

    return suggestions;
  }

  // Weather-based suggestions
  private static getWeatherBasedSuggestions(weather: { maxTemp: number; minTemp: number; condition?: string }): PackingSuggestion[] {
    const suggestions: PackingSuggestion[] = [];

    // Hot weather (>30°C)
    if (weather.maxTemp > 30) {
      suggestions.push(
        { item: 'Sunscreen SPF50', category: 'health', reason: 'Hot weather protection' },
        { item: 'Hat', category: 'clothing', reason: 'Sun protection' },
        { item: 'Light clothing', category: 'clothing', reason: 'Hot weather' },
        { item: 'Sunglasses', category: 'essentials', reason: 'Sun protection' }
      );
    }

    // Cold weather (<10°C)
    if (weather.minTemp < 10) {
      suggestions.push(
        { item: 'Jacket', category: 'clothing', reason: 'Cold weather protection' },
        { item: 'Warm layers', category: 'clothing', reason: 'Cold weather' },
        { item: 'Scarf', category: 'clothing', reason: 'Cold weather' }
      );
    }

    // Very cold weather (<0°C)
    if (weather.minTemp < 0) {
      suggestions.push(
        { item: 'Winter coat', category: 'clothing', reason: 'Very cold weather' },
        { item: 'Gloves', category: 'clothing', reason: 'Very cold weather' },
        { item: 'Thermal underwear', category: 'clothing', reason: 'Very cold weather' }
      );
    }

    // Rainy conditions
    if (weather.condition && weather.condition.toLowerCase().includes('rain')) {
      suggestions.push(
        { item: 'Umbrella', category: 'essentials', reason: 'Rainy weather' },
        { item: 'Waterproof jacket', category: 'clothing', reason: 'Rainy weather' }
      );
    }

    return suggestions;
  }

  // Duration-based suggestions
  private static getDurationBasedSuggestions(days: number): PackingSuggestion[] {
    const suggestions: PackingSuggestion[] = [];

    // Long trips (7+ days)
    if (days >= 7) {
      suggestions.push(
        { item: 'Extra underwear', category: 'clothing', reason: 'Long trip' },
        { item: 'Laundry detergent packets', category: 'toiletries', reason: 'Long trip' },
        { item: 'Extra socks', category: 'clothing', reason: 'Long trip' }
      );
    }

    // Very long trips (14+ days)
    if (days >= 14) {
      suggestions.push(
        { item: 'Medications refill', category: 'health', reason: 'Very long trip' },
        { item: 'Extra toiletries', category: 'toiletries', reason: 'Very long trip' }
      );
    }

    return suggestions;
  }

  // Activity-based suggestions
  private static getActivityBasedSuggestions(activities: string[]): PackingSuggestion[] {
    const suggestions: PackingSuggestion[] = [];
    const activitiesLower = activities.map(a => a.toLowerCase()).join(' ');

    // Hiking
    if (activitiesLower.includes('hik') || activitiesLower.includes('trek') || activitiesLower.includes('trail')) {
      suggestions.push(
        { item: 'Hiking boots', category: 'clothing', reason: 'Hiking activity' },
        { item: 'Water bottle', category: 'essentials', reason: 'Hiking activity' },
        { item: 'First aid kit', category: 'health', reason: 'Hiking activity' }
      );
    }

    // Swimming
    if (activitiesLower.includes('swim') || activitiesLower.includes('pool') || activitiesLower.includes('beach')) {
      suggestions.push(
        { item: 'Swimsuit', category: 'clothing', reason: 'Swimming activity' },
        { item: 'Goggles', category: 'activities', reason: 'Swimming activity' },
        { item: 'Beach towel', category: 'essentials', reason: 'Swimming activity' }
      );
    }

    // Business
    if (activitiesLower.includes('business') || activitiesLower.includes('meeting') || activitiesLower.includes('conference')) {
      suggestions.push(
        { item: 'Business attire', category: 'clothing', reason: 'Business activity' },
        { item: 'Laptop', category: 'electronics', reason: 'Business activity' },
        { item: 'Business cards', category: 'documents', reason: 'Business activity' }
      );
    }

    // Photography
    if (activitiesLower.includes('photo') || activitiesLower.includes('camera')) {
      suggestions.push(
        { item: 'Camera', category: 'electronics', reason: 'Photography activity' },
        { item: 'Extra memory cards', category: 'electronics', reason: 'Photography activity' },
        { item: 'Camera battery charger', category: 'electronics', reason: 'Photography activity' }
      );
    }

    // Camping
    if (activitiesLower.includes('camp')) {
      suggestions.push(
        { item: 'Sleeping bag', category: 'essentials', reason: 'Camping activity' },
        { item: 'Tent', category: 'essentials', reason: 'Camping activity' },
        { item: 'Flashlight', category: 'essentials', reason: 'Camping activity' }
      );
    }

    return suggestions;
  }

  // Traveler-specific suggestions
  private static getTravelerSpecificSuggestions(travelers: Traveler[]): PackingSuggestion[] {
    const suggestions: PackingSuggestion[] = [];

    travelers.forEach((traveler) => {
      const ageGroup = this.determineAgeGroup(traveler);

      if (ageGroup === 'baby') {
        suggestions.push(
          { item: `Diapers for ${traveler.name}`, category: 'essentials', reason: 'Baby traveler' },
          { item: `Baby wipes for ${traveler.name}`, category: 'toiletries', reason: 'Baby traveler' },
          { item: `Baby formula for ${traveler.name}`, category: 'health', reason: 'Baby traveler' },
          { item: `Baby bottles for ${traveler.name}`, category: 'essentials', reason: 'Baby traveler' },
          { item: `Baby food for ${traveler.name}`, category: 'health', reason: 'Baby traveler' },
          { item: `Pacifier for ${traveler.name}`, category: 'essentials', reason: 'Baby traveler' },
          { item: `Baby blanket for ${traveler.name}`, category: 'essentials', reason: 'Baby traveler' },
          { item: `Stroller for ${traveler.name}`, category: 'essentials', reason: 'Baby traveler' },
          { item: `Baby carrier for ${traveler.name}`, category: 'essentials', reason: 'Baby traveler' }
        );
      } else if (ageGroup === 'child') {
        suggestions.push(
          { item: `Toys for ${traveler.name}`, category: 'activities', reason: 'Child traveler' },
          { item: `Coloring books for ${traveler.name}`, category: 'activities', reason: 'Child traveler' },
          { item: `Snacks for ${traveler.name}`, category: 'health', reason: 'Child traveler' },
          { item: `Tablet/iPad for ${traveler.name}`, category: 'electronics', reason: 'Child traveler' },
          { item: `Headphones for ${traveler.name}`, category: 'electronics', reason: 'Child traveler' },
          { item: `Favorite stuffed animal for ${traveler.name}`, category: 'essentials', reason: 'Child traveler' }
        );
      }
    });

    return suggestions;
  }

  // Determine age group from traveler info
  private static determineAgeGroup(traveler: Traveler): 'adult' | 'child' | 'baby' {
    if (traveler.ageGroup) {
      return traveler.ageGroup;
    }

    if (traveler.age !== undefined) {
      if (traveler.age < 2) return 'baby';
      if (traveler.age < 13) return 'child';
      return 'adult';
    }

    // Default to adult if no age info
    return 'adult';
  }

  // Remove duplicate suggestions
  private static removeDuplicates(suggestions: PackingSuggestion[]): PackingSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Populate packing templates table with predefined rules
  static async populateTemplates(): Promise<void> {
    const templates = [
      // Beach destinations
      { destination_type: 'beach', weather_condition: null, trip_duration_days: null, item: 'Swimsuit', category: 'clothing' },
      { destination_type: 'beach', weather_condition: null, trip_duration_days: null, item: 'Sunscreen SPF50', category: 'health' },
      { destination_type: 'beach', weather_condition: null, trip_duration_days: null, item: 'Beach towel', category: 'essentials' },
      
      // City destinations
      { destination_type: 'city', weather_condition: null, trip_duration_days: null, item: 'Comfortable walking shoes', category: 'clothing' },
      { destination_type: 'city', weather_condition: null, trip_duration_days: null, item: 'Day backpack', category: 'essentials' },
      
      // Hot weather
      { destination_type: null, weather_condition: 'hot', trip_duration_days: null, item: 'Sunscreen SPF50', category: 'health' },
      { destination_type: null, weather_condition: 'hot', trip_duration_days: null, item: 'Hat', category: 'clothing' },
      
      // Cold weather
      { destination_type: null, weather_condition: 'cold', trip_duration_days: null, item: 'Jacket', category: 'clothing' },
      { destination_type: null, weather_condition: 'cold', trip_duration_days: null, item: 'Gloves', category: 'clothing' },
      
      // Long trips
      { destination_type: null, weather_condition: null, trip_duration_days: 7, item: 'Extra underwear', category: 'clothing' },
      { destination_type: null, weather_condition: null, trip_duration_days: 7, item: 'Laundry detergent', category: 'toiletries' },
    ];

    for (const template of templates) {
      try {
        await pool.query(
          `INSERT INTO packing_templates (destination_type, weather_condition, trip_duration_days, item, category)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [template.destination_type, template.weather_condition, template.trip_duration_days, template.item, template.category]
        );
      } catch (error) {
        console.error('Error inserting template:', error);
      }
    }
  }
}
