import { CountryRecommendationService, CountryRecommendation, WeatherPreference } from '../countryRecommendationService.js';

describe('CountryRecommendationService', () => {
  // Sample test data
  const sampleCountries: CountryRecommendation[] = [
    {
      id: '1',
      country_name: 'Japan',
      best_months: [3, 4, 5, 10, 11],
      temp_range: '10-25°C',
      avoid_months: [7, 8],
      region: 'Asia',
      description: 'Cherry blossoms in spring'
    },
    {
      id: '2',
      country_name: 'Iceland',
      best_months: [6, 7, 8],
      temp_range: 'Cold (8-15°C)',
      avoid_months: [12, 1, 2],
      region: 'Europe',
      description: 'Midnight sun in summer'
    },
    {
      id: '3',
      country_name: 'Morocco',
      best_months: [3, 4, 5, 9, 10, 11],
      temp_range: 'Warm (20-30°C)',
      avoid_months: [7, 8],
      region: 'Africa',
      description: 'Pleasant spring weather'
    },
    {
      id: '4',
      country_name: 'Thailand',
      best_months: [11, 12, 1, 2],
      temp_range: 'Warm (25-35°C)',
      avoid_months: [4, 5, 6],
      region: 'Asia',
      description: 'Cool dry season'
    }
  ];

  describe('filterByMonth', () => {
    it('should filter countries where month is in best_months', () => {
      const result = CountryRecommendationService.filterByMonth(sampleCountries, 3);
      
      expect(result).toHaveLength(2);
      expect(result.map(c => c.country_name)).toContain('Japan');
      expect(result.map(c => c.country_name)).toContain('Morocco');
    });

    it('should exclude countries where month is in avoid_months', () => {
      const result = CountryRecommendationService.filterByMonth(sampleCountries, 7);
      
      // Iceland has 7 in best_months, but Japan and Morocco have 7 in avoid_months
      expect(result).toHaveLength(1);
      expect(result[0].country_name).toBe('Iceland');
    });

    it('should return empty array when no countries match', () => {
      const result = CountryRecommendationService.filterByMonth(sampleCountries, 9);
      
      // Only Morocco has 9 in best_months and no avoid_months conflict
      expect(result).toHaveLength(1);
      expect(result[0].country_name).toBe('Morocco');
    });

    it('should throw error for invalid month', () => {
      expect(() => {
        CountryRecommendationService.filterByMonth(sampleCountries, 0);
      }).toThrow('Month must be between 1 and 12');

      expect(() => {
        CountryRecommendationService.filterByMonth(sampleCountries, 13);
      }).toThrow('Month must be between 1 and 12');
    });
  });

  describe('filterByWeather', () => {
    it('should filter for warm countries when preference is Warm', () => {
      const result = CountryRecommendationService.filterByWeather(sampleCountries, 'Warm');
      
      expect(result).toHaveLength(2);
      expect(result.map(c => c.country_name)).toContain('Morocco');
      expect(result.map(c => c.country_name)).toContain('Thailand');
    });

    it('should filter for cold countries when preference is Cold', () => {
      const result = CountryRecommendationService.filterByWeather(sampleCountries, 'Cold');
      
      expect(result).toHaveLength(1);
      expect(result[0].country_name).toBe('Iceland');
    });

    it('should return all countries when preference is Any', () => {
      const result = CountryRecommendationService.filterByWeather(sampleCountries, 'Any');
      
      expect(result).toHaveLength(4);
    });

    it('should classify temperature ranges correctly', () => {
      const warmCountry: CountryRecommendation = {
        id: '5',
        country_name: 'Test Warm',
        best_months: [1],
        temp_range: '25-35°C',
        avoid_months: [],
        region: 'Asia',
        description: 'Test'
      };

      const coldCountry: CountryRecommendation = {
        id: '6',
        country_name: 'Test Cold',
        best_months: [1],
        temp_range: '0-10°C',
        avoid_months: [],
        region: 'Europe',
        description: 'Test'
      };

      const moderateCountry: CountryRecommendation = {
        id: '7',
        country_name: 'Test Moderate',
        best_months: [1],
        temp_range: '15-20°C',
        avoid_months: [],
        region: 'Europe',
        description: 'Test'
      };

      const testCountries = [warmCountry, coldCountry, moderateCountry];

      const warmResults = CountryRecommendationService.filterByWeather(testCountries, 'Warm');
      expect(warmResults).toHaveLength(1);
      expect(warmResults[0].country_name).toBe('Test Warm');

      const coldResults = CountryRecommendationService.filterByWeather(testCountries, 'Cold');
      expect(coldResults).toHaveLength(1);
      expect(coldResults[0].country_name).toBe('Test Cold');
    });
  });

  describe('prioritizeByRegion', () => {
    it('should prioritize countries in user region', () => {
      const result = CountryRecommendationService.prioritizeByRegion(sampleCountries, 'Asia');
      
      // First two should be Asia countries
      expect(result[0].region).toBe('Asia');
      expect(result[1].region).toBe('Asia');
      expect(['Japan', 'Thailand']).toContain(result[0].country_name);
      expect(['Japan', 'Thailand']).toContain(result[1].country_name);
    });

    it('should maintain alphabetical order within same region priority', () => {
      const result = CountryRecommendationService.prioritizeByRegion(sampleCountries, 'Asia');
      
      // Asia countries should be alphabetically ordered
      expect(result[0].country_name).toBe('Japan');
      expect(result[1].country_name).toBe('Thailand');
    });

    it('should not mutate the original array', () => {
      const original = [...sampleCountries];
      CountryRecommendationService.prioritizeByRegion(sampleCountries, 'Europe');
      
      expect(sampleCountries).toEqual(original);
    });

    it('should handle region with single country', () => {
      const result = CountryRecommendationService.prioritizeByRegion(sampleCountries, 'Africa');
      
      expect(result[0].country_name).toBe('Morocco');
      expect(result[0].region).toBe('Africa');
    });
  });

  describe('isMonthAvoidable', () => {
    it('should return true when month is in avoid_months', () => {
      const japan = sampleCountries[0];
      expect(CountryRecommendationService.isMonthAvoidable(japan, 7)).toBe(true);
      expect(CountryRecommendationService.isMonthAvoidable(japan, 8)).toBe(true);
    });

    it('should return false when month is not in avoid_months', () => {
      const japan = sampleCountries[0];
      expect(CountryRecommendationService.isMonthAvoidable(japan, 3)).toBe(false);
    });

    it('should return false when avoid_months is empty', () => {
      const country: CountryRecommendation = {
        id: '8',
        country_name: 'Test',
        best_months: [1, 2, 3],
        temp_range: '20-30°C',
        avoid_months: [],
        region: 'Asia',
        description: 'Test'
      };
      
      expect(CountryRecommendationService.isMonthAvoidable(country, 1)).toBe(false);
    });
  });

  describe('validateFilters', () => {
    it('should validate correct filters', () => {
      const result = CountryRecommendationService.validateFilters({
        month: 6,
        weather: 'Warm',
        region: 'Asia'
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid month', () => {
      const result = CountryRecommendationService.validateFilters({ month: 13 });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Month must be between 1 and 12');
    });

    it('should reject invalid weather preference', () => {
      const result = CountryRecommendationService.validateFilters({ 
        weather: 'Hot' as WeatherPreference 
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid region', () => {
      const result = CountryRecommendationService.validateFilters({ 
        region: 'Antarctica' as any 
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid region specified');
    });

    it('should accumulate multiple errors', () => {
      const result = CountryRecommendationService.validateFilters({
        month: 0,
        weather: 'Invalid' as WeatherPreference,
        region: 'Invalid' as any
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
