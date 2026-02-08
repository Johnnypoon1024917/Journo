import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateGoogleMapsUrl,
  openGoogleMaps,
  isValidCoordinates,
  type Coordinates,
} from '../googleMapsUrl';

describe('isValidCoordinates', () => {
  it('should return true for valid coordinates', () => {
    expect(isValidCoordinates({ lat: 35.6586, lng: 139.7454 })).toBe(true);
    expect(isValidCoordinates({ lat: 0, lng: 0 })).toBe(true);
    expect(isValidCoordinates({ lat: -90, lng: -180 })).toBe(true);
    expect(isValidCoordinates({ lat: 90, lng: 180 })).toBe(true);
  });

  it('should return false for coordinates out of range', () => {
    expect(isValidCoordinates({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidCoordinates({ lat: -91, lng: 0 })).toBe(false);
    expect(isValidCoordinates({ lat: 0, lng: 181 })).toBe(false);
    expect(isValidCoordinates({ lat: 0, lng: -181 })).toBe(false);
  });

  it('should return false for NaN values', () => {
    expect(isValidCoordinates({ lat: NaN, lng: 0 })).toBe(false);
    expect(isValidCoordinates({ lat: 0, lng: NaN })).toBe(false);
    expect(isValidCoordinates({ lat: NaN, lng: NaN })).toBe(false);
  });

  it('should return false for non-number values', () => {
    expect(isValidCoordinates({ lat: '35.6586' as any, lng: 139.7454 })).toBe(false);
    expect(isValidCoordinates({ lat: 35.6586, lng: '139.7454' as any })).toBe(false);
  });

  it('should return false for undefined or null', () => {
    expect(isValidCoordinates(undefined)).toBe(false);
    expect(isValidCoordinates(null)).toBe(false);
  });
});

describe('generateGoogleMapsUrl', () => {
  describe('with valid coordinates', () => {
    it('should generate URL with coordinates when available', () => {
      const url = generateGoogleMapsUrl('Tokyo Tower', { lat: 35.6586, lng: 139.7454 });
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=35.6586,139.7454');
    });

    it('should prefer coordinates over location name', () => {
      const url = generateGoogleMapsUrl('Some Place', { lat: 40.7128, lng: -74.0060 });
      expect(url).toContain('40.7128,-74.006'); // Note: JavaScript may drop trailing zeros
      expect(url).not.toContain('Some%20Place');
    });

    it('should handle coordinates at equator and prime meridian', () => {
      const url = generateGoogleMapsUrl('Null Island', { lat: 0, lng: 0 });
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=0,0');
    });

    it('should handle coordinates at extreme valid values', () => {
      const url1 = generateGoogleMapsUrl('North Pole', { lat: 90, lng: 0 });
      expect(url1).toBe('https://www.google.com/maps/search/?api=1&query=90,0');

      const url2 = generateGoogleMapsUrl('South Pole', { lat: -90, lng: 0 });
      expect(url2).toBe('https://www.google.com/maps/search/?api=1&query=-90,0');

      const url3 = generateGoogleMapsUrl('Date Line', { lat: 0, lng: 180 });
      expect(url3).toBe('https://www.google.com/maps/search/?api=1&query=0,180');

      const url4 = generateGoogleMapsUrl('Date Line West', { lat: 0, lng: -180 });
      expect(url4).toBe('https://www.google.com/maps/search/?api=1&query=0,-180');
    });

    it('should handle negative coordinates', () => {
      const url = generateGoogleMapsUrl('Sydney Opera House', { lat: -33.8568, lng: 151.2153 });
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=-33.8568,151.2153');
    });

    it('should handle coordinates with many decimal places', () => {
      const url = generateGoogleMapsUrl('Precise Location', { lat: 35.658581, lng: 139.745438 });
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=35.658581,139.745438');
    });
  });

  describe('without coordinates (search-based)', () => {
    it('should generate search-based URL when coordinates unavailable', () => {
      const url = generateGoogleMapsUrl('Tokyo Tower');
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower');
    });

    it('should encode special characters in location name', () => {
      const url = generateGoogleMapsUrl('Café & Restaurant');
      expect(url).toContain(encodeURIComponent('Café & Restaurant'));
    });

    it('should handle location names with multiple words', () => {
      const url = generateGoogleMapsUrl('Empire State Building New York');
      expect(url).toContain('Empire%20State%20Building%20New%20York');
    });

    it('should handle location names with unicode characters', () => {
      const url = generateGoogleMapsUrl('東京タワー');
      expect(url).toContain(encodeURIComponent('東京タワー'));
    });

    it('should trim whitespace from location name', () => {
      const url = generateGoogleMapsUrl('  Tokyo Tower  ');
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower');
    });

    it('should handle location names with commas', () => {
      const url = generateGoogleMapsUrl('123 Main St, Tokyo, Japan');
      expect(url).toContain(encodeURIComponent('123 Main St, Tokyo, Japan'));
    });
  });

  describe('edge cases', () => {
    it('should return null for empty location name and no coordinates', () => {
      const url = generateGoogleMapsUrl('');
      expect(url).toBeNull();
    });

    it('should return null for whitespace-only location name and no coordinates', () => {
      const url = generateGoogleMapsUrl('   ');
      expect(url).toBeNull();
    });

    it('should return null for empty location and invalid coordinates', () => {
      const url = generateGoogleMapsUrl('', { lat: 91, lng: 0 });
      expect(url).toBeNull();
    });

    it('should fall back to search when coordinates are invalid', () => {
      const url = generateGoogleMapsUrl('Tokyo Tower', { lat: 91, lng: 0 });
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower');
    });

    it('should fall back to search when coordinates contain NaN', () => {
      const url = generateGoogleMapsUrl('Tokyo Tower', { lat: NaN, lng: 139.7454 });
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower');
    });

    it('should handle null coordinates', () => {
      const url = generateGoogleMapsUrl('Tokyo Tower', null);
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower');
    });

    it('should handle undefined coordinates', () => {
      const url = generateGoogleMapsUrl('Tokyo Tower', undefined);
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower');
    });

    it('should use coordinates even with empty location name', () => {
      const url = generateGoogleMapsUrl('', { lat: 35.6586, lng: 139.7454 });
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=35.6586,139.7454');
    });
  });

  describe('URL format validation', () => {
    it('should always start with Google Maps base URL', () => {
      const url1 = generateGoogleMapsUrl('Tokyo Tower');
      expect(url1).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);

      const url2 = generateGoogleMapsUrl('Tokyo Tower', { lat: 35.6586, lng: 139.7454 });
      expect(url2).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
    });

    it('should generate valid URLs that can be parsed', () => {
      const url = generateGoogleMapsUrl('Tokyo Tower', { lat: 35.6586, lng: 139.7454 });
      expect(url).not.toBeNull();
      expect(() => new URL(url!)).not.toThrow();
    });
  });
});

describe('openGoogleMaps', () => {
  let windowOpenSpy: any;

  beforeEach(() => {
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it('should open Google Maps with coordinates', () => {
    const result = openGoogleMaps('Tokyo Tower', { lat: 35.6586, lng: 139.7454 });
    
    expect(result).toBe(true);
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=35.6586,139.7454',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should open Google Maps with search query', () => {
    const result = openGoogleMaps('Tokyo Tower');
    
    expect(result).toBe(true);
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=Tokyo%20Tower',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should return false for empty location', () => {
    const result = openGoogleMaps('');
    
    expect(result).toBe(false);
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('should return false for invalid coordinates and empty location', () => {
    const result = openGoogleMaps('', { lat: 91, lng: 0 });
    
    expect(result).toBe(false);
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('should handle window.open errors gracefully', () => {
    windowOpenSpy.mockImplementation(() => {
      throw new Error('Popup blocked');
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = openGoogleMaps('Tokyo Tower');
    
    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should log warning for invalid location data', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    openGoogleMaps('');
    
    expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot open Google Maps: invalid location data');
    
    consoleWarnSpy.mockRestore();
  });
});
