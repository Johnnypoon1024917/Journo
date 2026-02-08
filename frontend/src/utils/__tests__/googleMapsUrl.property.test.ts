import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  generateGoogleMapsUrl,
  isValidCoordinates,
  type Coordinates,
} from '../googleMapsUrl';

/**
 * Property-Based Tests for Google Maps URL Generation
 * Feature: kawaii-ui-redesign
 * 
 * These tests verify that the Google Maps URL generation functions
 * maintain correctness properties across a wide range of inputs.
 */

describe('Property-Based Tests: Google Maps URL Generation', () => {
  /**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * Property: For any location with valid coordinates, the generated URL
   * should contain those coordinates and be a valid Google Maps URL.
   */
  it('generates valid coordinate-based URLs for any valid coordinates', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          coordinates: fc.record({
            lat: fc.double({ min: -90, max: 90, noNaN: true }),
            lng: fc.double({ min: -180, max: 180, noNaN: true }),
          }),
        }),
        (location) => {
          const url = generateGoogleMapsUrl(location.name, location.coordinates);

          // URL should not be null
          expect(url).not.toBeNull();

          // URL should contain Google Maps base
          expect(url).toContain('google.com/maps');

          // URL should contain the coordinates
          expect(url).toContain(`${location.coordinates.lat},${location.coordinates.lng}`);

          // URL should be parseable
          expect(() => new URL(url!)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.2, 3.3**
   * 
   * Property: For any location, the generated URL should either contain
   * coordinates (if available and valid) or use search format (if coordinates
   * unavailable), and both formats should be valid Google Maps URLs.
   */
  it('generates valid URLs for any location with optional coordinates', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          coordinates: fc.option(
            fc.record({
              lat: fc.double({ min: -90, max: 90, noNaN: true }),
              lng: fc.double({ min: -180, max: 180, noNaN: true }),
            }),
            { nil: null }
          ),
        }),
        (location) => {
          const url = generateGoogleMapsUrl(location.name, location.coordinates);

          // URL should not be null for non-empty names
          if (location.name.trim().length > 0 || location.coordinates) {
            expect(url).not.toBeNull();
            expect(url).toContain('google.com/maps');

            if (location.coordinates) {
              // Should use coordinate-based URL
              expect(url).toContain(`${location.coordinates.lat},${location.coordinates.lng}`);
            } else {
              // Should use search-based URL
              expect(url).toContain(encodeURIComponent(location.name.trim()));
            }

            // URL should be parseable
            expect(() => new URL(url!)).not.toThrow();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.3, 3.4**
   * 
   * Property: For any location name without coordinates, the generated URL
   * should use search format and properly encode the location name.
   */
  it('generates valid search-based URLs for any location name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (locationName) => {
          const url = generateGoogleMapsUrl(locationName);

          if (locationName.trim().length > 0) {
            // URL should not be null
            expect(url).not.toBeNull();

            // URL should contain Google Maps base
            expect(url).toContain('google.com/maps');

            // URL should contain encoded location name
            expect(url).toContain(encodeURIComponent(locationName.trim()));

            // URL should be parseable
            expect(() => new URL(url!)).not.toThrow();
          } else {
            // Empty or whitespace-only names should return null
            expect(url).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.4**
   * 
   * Property: For any invalid coordinates (out of range or NaN), the function
   * should fall back to search-based URL if location name is provided.
   */
  it('handles invalid coordinates gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          coordinates: fc.oneof(
            // Out of range latitude
            fc.record({
              lat: fc.oneof(
                fc.double({ min: 90.1, max: 200 }),
                fc.double({ min: -200, max: -90.1 })
              ),
              lng: fc.double({ min: -180, max: 180 }),
            }),
            // Out of range longitude
            fc.record({
              lat: fc.double({ min: -90, max: 90 }),
              lng: fc.oneof(
                fc.double({ min: 180.1, max: 360 }),
                fc.double({ min: -360, max: -180.1 })
              ),
            }),
            // NaN values
            fc.constant({ lat: NaN, lng: 0 }),
            fc.constant({ lat: 0, lng: NaN })
          ),
        }),
        (location) => {
          const url = generateGoogleMapsUrl(location.name, location.coordinates);

          if (location.name.trim().length > 0) {
            // Should fall back to search-based URL
            expect(url).not.toBeNull();
            expect(url).toContain('google.com/maps');
            expect(url).toContain(encodeURIComponent(location.name.trim()));

            // Should NOT contain invalid coordinates
            expect(url).not.toContain(`${location.coordinates.lat},${location.coordinates.lng}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.4**
   * 
   * Property: Empty or whitespace-only location names with no valid
   * coordinates should always return null.
   */
  it('returns null for empty locations without valid coordinates', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t\t'),
          fc.constant('\n\n')
        ),
        (emptyLocation) => {
          const url = generateGoogleMapsUrl(emptyLocation);
          expect(url).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Validates: Requirements 3.2**
   * 
   * Property: Coordinates should always be preferred over location name
   * when both are provided and coordinates are valid.
   */
  it('prefers coordinates over location name when both are valid', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          coordinates: fc.record({
            lat: fc.double({ min: -90, max: 90, noNaN: true }),
            lng: fc.double({ min: -180, max: 180, noNaN: true }),
          }),
        }),
        (location) => {
          const url = generateGoogleMapsUrl(location.name, location.coordinates);

          expect(url).not.toBeNull();
          // Should contain coordinates
          expect(url).toContain(`${location.coordinates.lat},${location.coordinates.lng}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * Property: All generated URLs should have the correct base format
   * and be parseable as valid URLs.
   */
  it('generates URLs with consistent format', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          coordinates: fc.option(
            fc.record({
              lat: fc.double({ min: -90, max: 90, noNaN: true }),
              lng: fc.double({ min: -180, max: 180, noNaN: true }),
            }),
            { nil: null }
          ),
        }),
        (location) => {
          const url = generateGoogleMapsUrl(location.name, location.coordinates);

          if (location.name.trim().length > 0 || location.coordinates) {
            expect(url).not.toBeNull();

            // Should start with correct base URL
            expect(url).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);

            // Should be a valid URL
            const urlObj = new URL(url!);
            expect(urlObj.protocol).toBe('https:');
            expect(urlObj.hostname).toBe('www.google.com');
            expect(urlObj.pathname).toBe('/maps/search/');
            expect(urlObj.searchParams.get('api')).toBe('1');
            expect(urlObj.searchParams.get('query')).toBeTruthy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.2**
   * 
   * Property: Coordinate validation should correctly identify valid
   * and invalid coordinate ranges.
   */
  it('validates coordinates correctly for any input', () => {
    fc.assert(
      fc.property(
        fc.record({
          lat: fc.double({ min: -200, max: 200 }),
          lng: fc.double({ min: -360, max: 360 }),
        }),
        (coords) => {
          const isValid = isValidCoordinates(coords);
          const expectedValid =
            !isNaN(coords.lat) &&
            !isNaN(coords.lng) &&
            coords.lat >= -90 &&
            coords.lat <= 90 &&
            coords.lng >= -180 &&
            coords.lng <= 180;

          expect(isValid).toBe(expectedValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.3**
   * 
   * Property: URL encoding should handle any Unicode characters correctly.
   */
  it('properly encodes location names with any characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
          const trimmed = s.trim();
          if (trimmed.length === 0) return false;
          // Avoid strings that would cause URI malformed errors
          try {
            encodeURIComponent(trimmed);
            decodeURIComponent(encodeURIComponent(trimmed));
            return true;
          } catch {
            return false;
          }
        }),
        (locationName) => {
          const url = generateGoogleMapsUrl(locationName);

          expect(url).not.toBeNull();

          // URL should be parseable
          const urlObj = new URL(url!);
          const queryParam = urlObj.searchParams.get('query');

          // Decoded query should match trimmed location name
          expect(queryParam).toBe(locationName.trim());
        }
      ),
      { numRuns: 100 }
    );
  });
});
