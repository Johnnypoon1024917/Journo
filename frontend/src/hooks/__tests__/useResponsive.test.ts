import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useResponsive, useResponsiveColumns, useResponsiveSpacing } from '../useResponsive';

// Mock useMediaQuery
const mockUseMediaQuery = vi.fn();
vi.mock('../useMediaQuery', () => ({
  useMediaQuery: (query: string) => mockUseMediaQuery(query),
}));

// Mock window dimensions
const mockWindowDimensions = {
  innerWidth: 1024,
  innerHeight: 768,
};

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: mockWindowDimensions.innerWidth,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: mockWindowDimensions.innerHeight,
});

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Default desktop setup
    mockUseMediaQuery.mockImplementation((query: string) => {
      switch (query) {
        case '(min-width: 320px)': return true;  // isXs
        case '(min-width: 640px)': return true;  // isSm
        case '(min-width: 768px)': return true;  // isMd
        case '(min-width: 1024px)': return true; // isLg
        case '(min-width: 1280px)': return false; // isXl
        case '(min-width: 1536px)': return false; // is2Xl
        case '(min-width: 1920px)': return false; // is3Xl
        case '(max-width: 767px)': return false; // isMobile
        case '(min-width: 768px) and (max-width: 1023px)': return false; // isTablet
        case '(min-width: 1024px)': return true; // isDesktop
        case '(hover: none) and (pointer: coarse)': return false; // isTouch
        case '(orientation: portrait)': return false; // isPortrait
        case '(orientation: landscape)': return true; // isLandscape
        default: return false;
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useResponsive hook', () => {
    it('returns correct breakpoint values for desktop', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isXs).toBe(true);
      expect(result.current.isSm).toBe(true);
      expect(result.current.isMd).toBe(true);
      expect(result.current.isLg).toBe(true);
      expect(result.current.isXl).toBe(false);
      expect(result.current.is2Xl).toBe(false);
      expect(result.current.is3Xl).toBe(false);
    });

    it('returns correct device type values for desktop', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTouch).toBe(false);
    });

    it('returns correct layout helpers for desktop', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobileLayout).toBe(false);
      expect(result.current.isTabletLayout).toBe(false);
      expect(result.current.isDesktopLayout).toBe(true);
    });

    it('returns correct viewport dimensions', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.viewport.width).toBe(1024);
      expect(result.current.viewport.height).toBe(768);
      expect(result.current.viewport.aspectRatio).toBe(1024 / 768);
    });

    it('detects mobile layout correctly', () => {
      // Mock mobile breakpoints
      mockUseMediaQuery.mockImplementation((query: string) => {
        switch (query) {
          case '(min-width: 320px)': return true;
          case '(min-width: 640px)': return false;
          case '(min-width: 768px)': return false;
          case '(min-width: 1024px)': return false;
          case '(max-width: 767px)': return true; // isMobile
          case '(hover: none) and (pointer: coarse)': return true; // isTouch
          default: return false;
        }
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTouch).toBe(true);
      expect(result.current.isMobileLayout).toBe(true);
    });

    it('detects tablet layout correctly', () => {
      // Mock tablet breakpoints
      mockUseMediaQuery.mockImplementation((query: string) => {
        switch (query) {
          case '(min-width: 768px)': return true;
          case '(min-width: 1024px)': return false;
          case '(max-width: 767px)': return false; // isMobile
          case '(min-width: 768px) and (max-width: 1023px)': return true; // isTablet
          case '(hover: none) and (pointer: coarse)': return false; // isTouch
          default: return false;
        }
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTabletLayout).toBe(true);
    });
  });

  describe('useResponsiveColumns hook', () => {
    it('returns mobile columns on mobile devices', () => {
      // Mock mobile
      mockUseMediaQuery.mockImplementation((query: string) => {
        return query === '(max-width: 767px)'; // Only isMobile is true
      });

      const { result } = renderHook(() => useResponsiveColumns({
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4,
      }));

      expect(result.current).toBe(1);
    });

    it('returns tablet columns on tablet devices', () => {
      // Mock tablet
      mockUseMediaQuery.mockImplementation((query: string) => {
        switch (query) {
          case '(max-width: 767px)': return false; // isMobile
          case '(min-width: 768px) and (max-width: 1023px)': return true; // isTablet
          default: return false;
        }
      });

      const { result } = renderHook(() => useResponsiveColumns({
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4,
      }));

      expect(result.current).toBe(2);
    });

    it('returns desktop columns on desktop devices', () => {
      // Mock desktop (default setup)
      const { result } = renderHook(() => useResponsiveColumns({
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4,
      }));

      expect(result.current).toBe(3);
    });

    it('returns wide columns on wide screens', () => {
      // Mock wide screen
      mockUseMediaQuery.mockImplementation((query: string) => {
        switch (query) {
          case '(min-width: 1024px)': return true; // isDesktop
          case '(min-width: 1536px)': return true; // is2Xl
          case '(max-width: 767px)': return false; // isMobile
          case '(min-width: 768px) and (max-width: 1023px)': return false; // isTablet
          default: return false;
        }
      });

      const { result } = renderHook(() => useResponsiveColumns({
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4,
      }));

      expect(result.current).toBe(4);
    });

    it('uses default values when options not provided', () => {
      const { result } = renderHook(() => useResponsiveColumns());

      expect(result.current).toBe(3); // Default desktop value
    });
  });

  describe('useResponsiveSpacing hook', () => {
    it('returns mobile spacing on mobile devices', () => {
      // Mock mobile
      mockUseMediaQuery.mockImplementation((query: string) => {
        return query === '(max-width: 767px)'; // Only isMobile is true
      });

      const { result } = renderHook(() => useResponsiveSpacing({
        mobile: '0.5rem',
        tablet: '1rem',
        desktop: '1.5rem',
      }));

      expect(result.current).toBe('0.5rem');
    });

    it('returns tablet spacing on tablet devices', () => {
      // Mock tablet
      mockUseMediaQuery.mockImplementation((query: string) => {
        switch (query) {
          case '(max-width: 767px)': return false; // isMobile
          case '(min-width: 768px) and (max-width: 1023px)': return true; // isTablet
          default: return false;
        }
      });

      const { result } = renderHook(() => useResponsiveSpacing({
        mobile: '0.5rem',
        tablet: '1rem',
        desktop: '1.5rem',
      }));

      expect(result.current).toBe('1rem');
    });

    it('returns desktop spacing on desktop devices', () => {
      // Mock desktop (default setup)
      const { result } = renderHook(() => useResponsiveSpacing({
        mobile: '0.5rem',
        tablet: '1rem',
        desktop: '1.5rem',
      }));

      expect(result.current).toBe('1.5rem');
    });

    it('uses default values when options not provided', () => {
      const { result } = renderHook(() => useResponsiveSpacing());

      expect(result.current).toBe('2rem'); // Default desktop value
    });
  });
});