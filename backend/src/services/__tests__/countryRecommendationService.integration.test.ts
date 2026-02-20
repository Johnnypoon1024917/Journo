import { CountryRecommendationService } from '../countryRecommendationService.js';
import { pool } from '../../config/database.js';

describe('CountryRecommendationService Integration Tests', () => {
  // Clean up test data after tests
  afterAll(async () => {
    await pool.end();
  });

  describe('queryCountries', () => {
    it('should query countries from database', async () => {
      const countries = await CountryRecommendationService.queryCountries();
      
      expect(Array.isArray(countries)).toBe(true);
      
      // If there are countries in the database, verify structure
      if (countries.length > 0) {
        const country = countries[0];
        expect(country).toHaveProperty('id');
        expect(country).toHaveProperty('country_name');
        expect(country).toHaveProperty('best_months');
        expect(country).toHaveProperty('temp_range');
        expect(country).toHaveProperty('region');
        expect(country).toHaveProperty('description');
        expect(Array.isArray(country.best_months)).toBe(true);
      }
    });

    it('should filter by month in database query', async () => {
      const month = 3; // March
      const countries = await CountryRecommendationService.queryCountries({ month });
      
      // All returned countries should have month in best_months and not in avoid_months
      countries.forEach(country => {
        expect(country.best_months).toContain(month);
        if (country.avoid_months) {
          expect(country.avoid_months).not.toContain(month);
        }
      });
    });

    it('should filter by region in database query', async () => {
      const region = 'Asia';
      const countries = await CountryRecommendationService.queryCountries({ region });
      
      // All returned countries should be in the specified region
      countries.forEach(country => {
        expect(country.region).toBe(region);
      });
    });

    it('should apply weather filtering after database query', async () => {
      const countries = await CountryRecommendationService.queryCountries({ 
        weather: 'Warm' 
      });
      
      // All returned countries should have warm temperature classification
      countries.forEach(country => {
        const tempRange = country.temp_range.toLowerCase();
        const hasWarmKeyword = tempRange.includes('warm') || tempRange.includes('hot');
        
        // Parse numeric range
        const match = country.temp_range.match(/(-?\d+)-(-?\d+)/);
        let hasWarmTemp = false;
        if (match) {
          const min = parseInt(match[1]);
          const max = parseInt(match[2]);
          const avg = (min + max) / 2;
          hasWarmTemp = avg > 20;
        }
        
        expect(hasWarmKeyword || hasWarmTemp).toBe(true);
      });
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const countries = await CountryRecommendationService.queryCountries({ limit });
      
      expect(countries.length).toBeLessThanOrEqual(limit);
    });

    it('should handle combined filters', async () => {
      const filters = {
        month: 4,
        weather: 'Warm' as const,
        region: 'Asia' as const,
        limit: 10
      };
      
      const countries = await CountryRecommendationService.queryCountries(filters);
      
      countries.forEach(country => {
        // Check month filter
        expect(country.best_months).toContain(4);
        if (country.avoid_months) {
          expect(country.avoid_months).not.toContain(4);
        }
        
        // Check region filter
        expect(country.region).toBe('Asia');
      });
      
      // Check limit
      expect(countries.length).toBeLessThanOrEqual(10);
    });

    it('should handle database errors gracefully', async () => {
      // Test with invalid limit to trigger potential error
      await expect(async () => {
        await CountryRecommendationService.queryCountries({ limit: -1 });
      }).rejects.toThrow();
    });
  });

  describe('validateFilters', () => {
    it('should validate filters before querying', () => {
      const invalidFilters = { month: 13 };
      const validation = CountryRecommendationService.validateFilters(invalidFilters);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should accept valid filters', () => {
      const validFilters = {
        month: 6,
        weather: 'Warm' as const,
        region: 'Europe' as const
      };
      
      const validation = CountryRecommendationService.validateFilters(validFilters);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});
