/**
 * Country Filtering Utilities
 * 
 * Client-side filtering functions for country recommendations.
 * Implements deterministic filtering logic based on month and weather preferences.
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5, 8.2
 */

import type { CountryRecommendation, WeatherPreference, Region } from '../types/countryRecommendation';

/**
 * Classify a temperature range string as Warm, Cold, or Moderate
 * 
 * Classification rules:
 * - Warm: Contains "warm" or "hot", or average temp > 20°C
 * - Cold: Contains "cold" or "cool", or average temp < 15°C
 * - Moderate: Everything else
 * 
 * @param temp_range - Temperature range string (e.g., "20-30°C", "Cold (0-10°C)")
 * @returns Weather classification
 */
export function classifyWeather(temp_range: string): 'Warm' | 'Cold' | 'Moderate' {
  const lower = temp_range.toLowerCase();
  
  // Check for explicit keywords
  if (lower.includes('warm') || lower.includes('hot')) {
    return 'Warm';
  }
  
  if (lower.includes('cold') || lower.includes('cool')) {
    return 'Cold';
  }
  
  // Parse numeric range (e.g., "20-30°C" or "20-30")
  const match = temp_range.match(/(\d+)-(\d+)/);
  if (match) {
    const min = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    const avg = (min + max) / 2;
    
    if (avg > 20) return 'Warm';
    if (avg < 15) return 'Cold';
  }
  
  return 'Moderate';
}

/**
 * Filter countries by selected month
 * 
 * A country is included if:
 * - The month is in the best_months array, AND
 * - The month is NOT in the avoid_months array
 * 
 * Requirements: 6.2, 7.3, 7.4
 * 
 * @param countries - Array of country recommendations
 * @param month - Selected month (1-12)
 * @returns Filtered array of countries
 */
export function filterByMonth(
  countries: CountryRecommendation[],
  month: number
): CountryRecommendation[] {
  return countries.filter(country => {
    const isInBestMonths = country.best_months.includes(month);
    const isInAvoidMonths = country.avoid_months.includes(month);
    
    return isInBestMonths && !isInAvoidMonths;
  });
}

/**
 * Filter countries by weather preference
 * 
 * Filtering rules:
 * - "Warm": Only countries with warm temperature classification
 * - "Cold": Only countries with cold temperature classification
 * - "Any": All countries (no filtering)
 * 
 * Requirements: 6.3, 6.4, 6.5
 * 
 * @param countries - Array of country recommendations
 * @param preference - Weather preference
 * @returns Filtered array of countries
 */
export function filterByWeather(
  countries: CountryRecommendation[],
  preference: WeatherPreference
): CountryRecommendation[] {
  if (preference === 'Any') {
    return countries;
  }
  
  return countries.filter(country => {
    const classification = classifyWeather(country.temp_range);
    return classification === preference;
  });
}

/**
 * Prioritize countries by region proximity
 * 
 * Sorts countries to place those in the user's region first,
 * while maintaining the original order within each group.
 * 
 * This function does NOT filter - it only reorders.
 * All input countries are included in the output.
 * 
 * Requirements: 8.2, 8.4
 * 
 * @param countries - Array of country recommendations
 * @param userRegion - User's geographic region
 * @returns Sorted array with nearby regions prioritized
 */
export function prioritizeByRegion(
  countries: CountryRecommendation[],
  userRegion: Region
): CountryRecommendation[] {
  // Separate countries into two groups: same region and other regions
  const sameRegion: CountryRecommendation[] = [];
  const otherRegions: CountryRecommendation[] = [];
  
  countries.forEach(country => {
    if (country.region === userRegion) {
      sameRegion.push(country);
    } else {
      otherRegions.push(country);
    }
  });
  
  // Return same region first, then other regions
  return [...sameRegion, ...otherRegions];
}
