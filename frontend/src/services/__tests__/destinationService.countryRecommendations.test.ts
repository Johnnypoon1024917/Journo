/**
 * Unit tests for DestinationService Country Recommendations
 * 
 * Tests country recommendation methods including caching, retry logic, and error handling
 * Validates: Requirements 9.3, 3.3, 3.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DestinationService, DestinationServiceError, DestinationServiceErrorType } from '../destinationService';
import api from '../api';
import { getAuthToken } from '../../utils/auth';
import { CountryRecommendation, WeatherPreference } from '../../types/countryRecommendation';

// Mock dependencies
vi.mock('../api');
vi.mock('../../utils/auth');

const mockApi = api as any;
const mockGetAuthToken = getAuthToken as any;

describe('DestinationService - Country Recommendations', () => {
  const mockCountries: CountryRecommendation[] = [
    {
      id: '1',
      country_name: 'Japan',
      best_months: [3, 4, 5, 10, 11],
      temp_range: '10-25°C',
      avoid_months: [7, 8],
      region: 'Asia',
      description: 'Experience cherry blossoms in spring or vibrant autumn foliage.'
    },
    {
      id: '2',
      country_name: 'Iceland',
      best_months: [6, 7, 8],
      temp_range: 'Cold (8-15°C)',
      avoid_months: [12, 1, 2],
      region: 'Europe',
      description: 'Midnight sun and accessible highlands in summer.'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    DestinationService.clearCountryCache();
    vi.mocked(mockGetAuthToken).mockReturnValue('test-token');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCountryRecommendations', () => {
    it('should fetch country recommendations without filters', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: mockCountries }
      });

      const result = await DestinationService.getCountryRecommendations();

      expect(mockApi.get).toHaveBeenCalledWith(
        '/countries/recommendations',
        { token: 'test-token' }
      );
      expect(result).toEqual(mockCountries);
    });

    it('should fetch country recommendations with month filter', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: [mockCountries[0]] }
      });

      const result = await DestinationService.getCountryRecommendations({ month: 4 });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/countries/recommendations?month=4',
        { token: 'test-token' }
      );
      expect(result).toEqual([mockCountries[0]]);
    });

    it('should fetch country recommendations with weather filter', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: [mockCountries[1]] }
      });

      const result = await DestinationService.getCountryRecommendations({ 
        weatherPreference: 'Cold' 
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/countries/recommendations?weather=cold',
        { token: 'test-token' }
      );
      expect(result).toEqual([mockCountries[1]]);
    });

    it('should fetch country recommendations with multiple filters', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: mockCountries }
      });

      const result = await DestinationService.getCountryRecommendations({
        month: 7,
        weatherPreference: 'Warm',
        region: 'Asia'
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/countries/recommendations?month=7&weather=warm&region=Asia',
        { token: 'test-token' }
      );
      expect(result).toEqual(mockCountries);
    });

    it('should use cached data when available and fresh', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: mockCountries }
      });

      // First call - should fetch from API
      await DestinationService.getCountryRecommendations({ month: 4 });
      expect(mockApi.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result = await DestinationService.getCountryRecommendations({ month: 4 });
      expect(mockApi.get).toHaveBeenCalledTimes(1); // Still 1, not called again
      expect(result).toEqual(mockCountries);
    });

    it('should handle network errors with retry', async () => {
      const networkError = new Error('Failed to fetch');
      vi.mocked(mockApi.get)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          data: { countries: mockCountries }
        });

      const promise = DestinationService.getCountryRecommendations();
      
      // Fast-forward through retry delays
      await vi.runAllTimersAsync();
      
      const result = await promise;

      expect(mockApi.get).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result).toEqual(mockCountries);
    });

    it('should fallback to expired cache on error', async () => {
      // First, populate the cache
      vi.mocked(mockApi.get).mockResolvedValueOnce({
        data: { countries: mockCountries }
      });
      await DestinationService.getCountryRecommendations({ month: 4 });

      // Clear the mock to simulate a new request
      vi.mocked(mockApi.get).mockClear();

      // Now simulate an error
      vi.mocked(mockApi.get).mockRejectedValue(new Error('Network error'));

      // Should return cached data as fallback
      const result = await DestinationService.getCountryRecommendations({ month: 4 });
      expect(result).toEqual(mockCountries);
    });

    it('should throw error when no cache available and API fails', async () => {
      vi.mocked(mockApi.get).mockRejectedValue(new Error('Network error'));

      const promise = DestinationService.getCountryRecommendations();
      
      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
    });

    it('should not retry on authentication errors', async () => {
      const authError = {
        response: { status: 401 },
        message: 'Unauthorized'
      };
      vi.mocked(mockApi.get).mockRejectedValue(authError);

      await expect(
        DestinationService.getCountryRecommendations()
      ).rejects.toThrow(DestinationServiceError);

      expect(mockApi.get).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('getCountryRecommendationsByMonth', () => {
    it('should fetch country recommendations for specific month', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: [mockCountries[0]] }
      });

      const result = await DestinationService.getCountryRecommendationsByMonth(4);

      expect(mockApi.get).toHaveBeenCalledWith(
        '/countries/recommendations/4',
        { token: 'test-token' }
      );
      expect(result).toEqual([mockCountries[0]]);
    });

    it('should fetch country recommendations for month with weather filter', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: [mockCountries[1]] }
      });

      const result = await DestinationService.getCountryRecommendationsByMonth(7, 'Cold');

      expect(mockApi.get).toHaveBeenCalledWith(
        '/countries/recommendations/7?weather=cold',
        { token: 'test-token' }
      );
      expect(result).toEqual([mockCountries[1]]);
    });

    it('should use cached data when available and fresh', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: mockCountries }
      });

      // First call - should fetch from API
      await DestinationService.getCountryRecommendationsByMonth(7, 'Warm');
      expect(mockApi.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result = await DestinationService.getCountryRecommendationsByMonth(7, 'Warm');
      expect(mockApi.get).toHaveBeenCalledTimes(1); // Still 1, not called again
      expect(result).toEqual(mockCountries);
    });

    it('should handle network errors with retry', async () => {
      const networkError = new Error('Failed to fetch');
      vi.mocked(mockApi.get)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          data: { countries: mockCountries }
        });

      const promise = DestinationService.getCountryRecommendationsByMonth(4);
      
      // Fast-forward through retry delays
      await vi.runAllTimersAsync();
      
      const result = await promise;

      expect(mockApi.get).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result).toEqual(mockCountries);
    });

    it('should fallback to expired cache on error', async () => {
      // First, populate the cache
      vi.mocked(mockApi.get).mockResolvedValueOnce({
        data: { countries: mockCountries }
      });
      await DestinationService.getCountryRecommendationsByMonth(7);

      // Clear the mock to simulate a new request
      vi.mocked(mockApi.get).mockClear();

      // Now simulate an error
      vi.mocked(mockApi.get).mockRejectedValue(new Error('Network error'));

      // Should return cached data as fallback
      const result = await DestinationService.getCountryRecommendationsByMonth(7);
      expect(result).toEqual(mockCountries);
    });

    it('should throw error when no cache available and API fails', async () => {
      vi.mocked(mockApi.get).mockRejectedValue(new Error('Network error'));

      const promise = DestinationService.getCountryRecommendationsByMonth(4);
      
      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
    });
  });

  describe('Cache Management', () => {
    it('should clear country cache', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: mockCountries }
      });

      // Populate cache
      await DestinationService.getCountryRecommendations({ month: 4 });
      expect(mockApi.get).toHaveBeenCalledTimes(1);

      // Clear cache
      DestinationService.clearCountryCache();

      // Next call should fetch from API again
      await DestinationService.getCountryRecommendations({ month: 4 });
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });

    it('should maintain separate caches for different filter combinations', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({
        data: { countries: mockCountries }
      });

      // Call with different filters
      await DestinationService.getCountryRecommendations({ month: 4 });
      await DestinationService.getCountryRecommendations({ month: 7 });
      await DestinationService.getCountryRecommendationsByMonth(4);

      // Should have made 3 API calls (different cache keys)
      expect(mockApi.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Classification', () => {
    it('should classify network errors correctly', async () => {
      const networkError = new Error('Failed to fetch');
      vi.mocked(mockApi.get).mockRejectedValue(networkError);

      const promise = DestinationService.getCountryRecommendations();
      
      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      try {
        await promise;
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(DestinationServiceError);
        const serviceError = error as DestinationServiceError;
        expect(serviceError.type).toBe(DestinationServiceErrorType.NETWORK_ERROR);
        expect(serviceError.canRetry).toBe(true);
      }
    });

    it('should classify service unavailable errors correctly', async () => {
      const serviceError = {
        response: { status: 503 },
        message: 'Service Unavailable'
      };
      vi.mocked(mockApi.get).mockRejectedValue(serviceError);

      const promise = DestinationService.getCountryRecommendations();
      
      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      try {
        await promise;
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(DestinationServiceError);
        const destError = error as DestinationServiceError;
        expect(destError.type).toBe(DestinationServiceErrorType.SERVICE_UNAVAILABLE);
        expect(destError.canRetry).toBe(true);
      }
    });

    it('should classify authentication errors correctly', async () => {
      const authError = {
        response: { status: 401 },
        message: 'Unauthorized'
      };
      vi.mocked(mockApi.get).mockRejectedValue(authError);

      try {
        await DestinationService.getCountryRecommendations();
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(DestinationServiceError);
        const destError = error as DestinationServiceError;
        expect(destError.type).toBe(DestinationServiceErrorType.AUTHENTICATION_ERROR);
        expect(destError.canRetry).toBe(false);
      }
    });
  });
});
