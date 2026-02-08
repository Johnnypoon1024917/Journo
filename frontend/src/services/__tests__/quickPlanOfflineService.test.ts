import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuickPlanOfflineService } from '../quickPlanOfflineService';
import { offlineStorage } from '../offlineStorage';

// Mock offlineStorage
vi.mock('../offlineStorage', () => ({
  offlineStorage: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

describe('QuickPlanOfflineService', () => {
  const mockOfflineStorage = offlineStorage as any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      },
      writable: true
    });
  });

  describe('cacheSuggestions', () => {
    it('should cache suggestions with expiration', async () => {
      const requestHash = 'test-hash';
      const suggestions = [{ name: 'Test Place', type: 'attraction' }];
      const expirationHours = 24;

      await QuickPlanOfflineService.cacheSuggestions(requestHash, suggestions, expirationHours);

      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith(
        `quickplan_suggestions_${requestHash}`,
        expect.objectContaining({
          requestHash,
          suggestions,
          cachedAt: expect.any(String),
          expiresAt: expect.any(String)
        })
      );
    });

    it('should update generation cache metadata', async () => {
      mockOfflineStorage.getItem.mockResolvedValue({});
      
      const requestHash = 'test-hash';
      const suggestions = [{ name: 'Test Place' }];

      await QuickPlanOfflineService.cacheSuggestions(requestHash, suggestions);

      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith(
        'quickplan_generation_cache',
        expect.objectContaining({
          [requestHash]: expect.objectContaining({
            cachedAt: expect.any(String),
            expiresAt: expect.any(String),
            suggestionsCount: 1
          })
        })
      );
    });
  });

  describe('getCachedSuggestions', () => {
    it('should return cached suggestions if not expired', async () => {
      const requestHash = 'test-hash';
      const cachedData = {
        requestHash,
        suggestions: [{ name: 'Test Place' }],
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60000).toISOString() // 1 minute from now
      };

      mockOfflineStorage.getItem.mockResolvedValue(cachedData);

      const result = await QuickPlanOfflineService.getCachedSuggestions(requestHash);

      expect(result).toEqual(cachedData.suggestions);
    });

    it('should return null for expired cache', async () => {
      const requestHash = 'test-hash';
      const cachedData = {
        requestHash,
        suggestions: [{ name: 'Test Place' }],
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 60000).toISOString() // 1 minute ago
      };

      mockOfflineStorage.getItem.mockResolvedValue(cachedData);

      const result = await QuickPlanOfflineService.getCachedSuggestions(requestHash);

      expect(result).toBeNull();
      expect(mockOfflineStorage.removeItem).toHaveBeenCalledWith(`quickplan_suggestions_${requestHash}`);
    });

    it('should return null if no cache exists', async () => {
      mockOfflineStorage.getItem.mockResolvedValue(null);

      const result = await QuickPlanOfflineService.getCachedSuggestions('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('cacheGeneratedTrip', () => {
    it('should cache complete trip data', async () => {
      const trip = {
        id: 'trip-1',
        title: 'Test Trip',
        destination: 'Tokyo',
        days: [
          {
            id: 'day-1',
            trip_id: 'trip-1',
            day_number: 1,
            places: [
              {
                id: 'place-1',
                trip_day_id: 'day-1',
                name: 'Test Place'
              }
            ]
          }
        ]
      };

      mockOfflineStorage.getItem.mockResolvedValue([]);

      await QuickPlanOfflineService.cacheGeneratedTrip(trip);

      // Should cache the trip
      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith(`trip_${trip.id}`, trip);
      
      // Should update trips list
      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith('quickplan_trips', [trip]);
      
      // Should cache individual components
      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith(`trip_day_${trip.days[0].id}`, trip.days[0]);
      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith(`place_${trip.days[0].places[0].id}`, trip.days[0].places[0]);
    });

    it('should update existing trip in cache', async () => {
      const existingTrip = { id: 'trip-1', title: 'Old Title', days: [] };
      const updatedTrip = { id: 'trip-1', title: 'New Title', days: [] };

      mockOfflineStorage.getItem.mockResolvedValue([existingTrip]);

      await QuickPlanOfflineService.cacheGeneratedTrip(updatedTrip);

      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith('quickplan_trips', [updatedTrip]);
    });
  });

  describe('handleOfflineMode', () => {
    it('should return online status when navigator.onLine is true', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      const result = await QuickPlanOfflineService.handleOfflineMode();

      expect(result.isOffline).toBe(false);
      expect(result.canUseQuickPlan).toBe(true);
      expect(result.message).toContain('Online');
    });

    it('should return offline status with cache info when navigator.onLine is false', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const mockCache = {
        'hash1': { cachedAt: new Date().toISOString() },
        'hash2': { cachedAt: new Date().toISOString() }
      };

      mockOfflineStorage.getItem.mockResolvedValue(mockCache);

      const result = await QuickPlanOfflineService.handleOfflineMode();

      expect(result.isOffline).toBe(true);
      expect(result.canUseQuickPlan).toBe(true);
      expect(result.cachedSuggestionsCount).toBe(2);
      expect(result.message).toContain('2 cached suggestion(s)');
    });

    it('should indicate no Quick Plan capability when offline with no cache', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      mockOfflineStorage.getItem.mockResolvedValue({});

      const result = await QuickPlanOfflineService.handleOfflineMode();

      expect(result.isOffline).toBe(true);
      expect(result.canUseQuickPlan).toBe(false);
      expect(result.cachedSuggestionsCount).toBe(0);
      expect(result.message).toContain('no cached suggestions available');
    });
  });

  describe('generateRequestHash', () => {
    it('should generate consistent hash for same request', () => {
      const request = {
        destination: 'Tokyo',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        interests: [{ id: 'food', name: 'Food' }, { id: 'culture', name: 'Culture' }],
        budgetLevel: 'medium',
        travelStyle: 'moderate',
        groupSize: 2,
        travelerTypes: [{ type: 'couple' }]
      };

      const hash1 = QuickPlanOfflineService.generateRequestHash(request);
      const hash2 = QuickPlanOfflineService.generateRequestHash(request);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for different requests', () => {
      const request1 = {
        destination: 'Tokyo',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        interests: [{ id: 'food', name: 'Food' }],
        budgetLevel: 'medium',
        travelStyle: 'moderate',
        groupSize: 2,
        travelerTypes: [{ type: 'couple' }]
      };

      const request2 = {
        ...request1,
        destination: 'Osaka'
      };

      const hash1 = QuickPlanOfflineService.generateRequestHash(request1);
      const hash2 = QuickPlanOfflineService.generateRequestHash(request2);

      expect(hash1).not.toBe(hash2);
    });

    it('should normalize destination case and whitespace', () => {
      const request1 = {
        destination: 'Tokyo',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        interests: [],
        budgetLevel: 'medium',
        travelStyle: 'moderate',
        groupSize: 2,
        travelerTypes: []
      };

      const request2 = {
        ...request1,
        destination: '  TOKYO  '
      };

      const hash1 = QuickPlanOfflineService.generateRequestHash(request1);
      const hash2 = QuickPlanOfflineService.generateRequestHash(request2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('cleanupExpiredCache', () => {
    it('should remove expired cache entries', async () => {
      const now = new Date();
      const expiredTime = new Date(now.getTime() - 60000).toISOString(); // 1 minute ago
      const validTime = new Date(now.getTime() + 60000).toISOString(); // 1 minute from now

      const mockCache = {
        'expired-hash': { expiresAt: expiredTime },
        'valid-hash': { expiresAt: validTime }
      };

      mockOfflineStorage.getItem.mockResolvedValue(mockCache);

      const result = await QuickPlanOfflineService.cleanupExpiredCache();

      expect(result.removed).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return comprehensive cache statistics', async () => {
      const mockGenerationCache = {
        'hash1': { cachedAt: '2024-01-01T00:00:00Z' },
        'hash2': { cachedAt: '2024-01-02T00:00:00Z' }
      };

      const mockTrips = [
        { id: 'trip-1', title: 'Trip 1' },
        { id: 'trip-2', title: 'Trip 2' }
      ];

      mockOfflineStorage.getItem
        .mockResolvedValueOnce(mockGenerationCache) // generation cache
        .mockResolvedValueOnce(mockTrips); // trips

      const result = await QuickPlanOfflineService.getCacheStats();

      expect(result.totalSuggestions).toBe(2);
      expect(result.totalTrips).toBe(2);
      expect(result.storageUsed).toBeGreaterThan(0);
      expect(result.oldestCache).toBe('2024-01-01T00:00:00Z');
      expect(result.newestCache).toBe('2024-01-02T00:00:00Z');
    });

    it('should handle empty cache gracefully', async () => {
      mockOfflineStorage.getItem
        .mockResolvedValueOnce({}) // generation cache
        .mockResolvedValueOnce([]); // trips (empty array instead of empty object)

      const result = await QuickPlanOfflineService.getCacheStats();

      expect(result.totalSuggestions).toBe(0);
      expect(result.totalTrips).toBe(0);
      expect(result.storageUsed).toBeGreaterThanOrEqual(0); // Storage size can be > 0 due to JSON overhead
      expect(result.oldestCache).toBeNull();
      expect(result.newestCache).toBeNull();
    });
  });
});