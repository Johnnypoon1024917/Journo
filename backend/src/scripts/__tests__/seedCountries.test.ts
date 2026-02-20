/**
 * Unit tests for country seeding script
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { pool } from '../../config/database.js';
import { 
  seedCountries, 
  validateCountryData, 
  validateAllCountries,
  getSeedDataStats,
  CountrySeedData 
} from '../seedCountries.js';

describe('Country Seeding Script', () => {
  describe('validateCountryData', () => {
    it('should validate a correct country record', () => {
      const validCountry: CountrySeedData = {
        country_name: 'Test Country',
        best_months: [1, 2, 3],
        temp_range: '20-30°C',
        avoid_months: [7, 8],
        region: 'Asia',
        description: 'This is a test country with a description that is long enough to pass validation requirements.'
      };

      const result = validateCountryData(validCountry);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject country with empty name', () => {
      const invalidCountry: CountrySeedData = {
        country_name: '',
        best_months: [1, 2, 3],
        temp_range: '20-30°C',
        avoid_months: [],
        region: 'Asia',
        description: 'This is a test country with a description that is long enough to pass validation requirements.'
      };

      const result = validateCountryData(invalidCountry);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('country_name is required and cannot be empty');
    });

    it('should reject country with empty best_months array', () => {
      const invalidCountry: CountrySeedData = {
        country_name: 'Test Country',
        best_months: [],
        temp_range: '20-30°C',
        avoid_months: [],
        region: 'Asia',
        description: 'This is a test country with a description that is long enough to pass validation requirements.'
      };

      const result = validateCountryData(invalidCountry);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('best_months must be a non-empty array');
    });

    it('should reject country with invalid month values', () => {
      const invalidCountry: CountrySeedData = {
        country_name: 'Test Country',
        best_months: [1, 2, 13],
        temp_range: '20-30°C',
        avoid_months: [0],
        region: 'Asia',
        description: 'This is a test country with a description that is long enough to pass validation requirements.'
      };

      const result = validateCountryData(invalidCountry);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid values'))).toBe(true);
    });

    it('should reject country with invalid region', () => {
      const invalidCountry: CountrySeedData = {
        country_name: 'Test Country',
        best_months: [1, 2, 3],
        temp_range: '20-30°C',
        avoid_months: [],
        region: 'Invalid Region' as any,
        description: 'This is a test country with a description that is long enough to pass validation requirements.'
      };

      const result = validateCountryData(invalidCountry);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('region must be one of'))).toBe(true);
    });

    it('should reject country with short description', () => {
      const invalidCountry: CountrySeedData = {
        country_name: 'Test Country',
        best_months: [1, 2, 3],
        temp_range: '20-30°C',
        avoid_months: [],
        region: 'Asia',
        description: 'Too short'
      };

      const result = validateCountryData(invalidCountry);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('description should be at least 50 characters');
    });

    it('should reject country with overlapping best_months and avoid_months', () => {
      const invalidCountry: CountrySeedData = {
        country_name: 'Test Country',
        best_months: [1, 2, 3],
        temp_range: '20-30°C',
        avoid_months: [2, 3, 4],
        region: 'Asia',
        description: 'This is a test country with a description that is long enough to pass validation requirements.'
      };

      const result = validateCountryData(invalidCountry);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('should not overlap'))).toBe(true);
    });
  });

  describe('validateAllCountries', () => {
    it('should validate all seed countries successfully', () => {
      const result = validateAllCountries();
      
      expect(result.valid).toBe(true);
      expect(result.totalErrors).toBe(0);
      expect(result.details).toHaveLength(0);
    });
  });

  describe('getSeedDataStats', () => {
    it('should return correct statistics', () => {
      const stats = getSeedDataStats();
      
      expect(stats.totalCountries).toBeGreaterThan(0);
      expect(stats.regionCounts).toBeDefined();
      expect(Object.keys(stats.regionCounts).length).toBeGreaterThan(0);
      expect(parseFloat(stats.avgBestMonths)).toBeGreaterThan(0);
      expect(parseFloat(stats.avgAvoidMonths)).toBeGreaterThanOrEqual(0);
    });

    it('should have all valid regions', () => {
      const stats = getSeedDataStats();
      const validRegions = ['Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East'];
      
      Object.keys(stats.regionCounts).forEach(region => {
        expect(validRegions).toContain(region);
      });
    });
  });

  describe('Seed data quality', () => {
    it('should have at least 50 countries', () => {
      expect(seedCountries.length).toBeGreaterThanOrEqual(50);
    });

    it('should have countries from all major regions', () => {
      const regions = new Set(seedCountries.map(c => c.region));
      
      expect(regions.has('Asia')).toBe(true);
      expect(regions.has('Europe')).toBe(true);
      expect(regions.has('Americas')).toBe(true);
      expect(regions.has('Africa')).toBe(true);
      expect(regions.has('Oceania')).toBe(true);
    });

    it('should have unique country names', () => {
      const names = seedCountries.map(c => c.country_name);
      const uniqueNames = new Set(names);
      
      expect(names.length).toBe(uniqueNames.size);
    });

    it('should have all countries with valid temperature ranges', () => {
      seedCountries.forEach(country => {
        expect(country.temp_range).toBeTruthy();
        expect(country.temp_range.length).toBeGreaterThan(0);
      });
    });

    it('should have all countries with descriptions', () => {
      seedCountries.forEach(country => {
        expect(country.description).toBeTruthy();
        expect(country.description.length).toBeGreaterThanOrEqual(50);
      });
    });
  });
});
