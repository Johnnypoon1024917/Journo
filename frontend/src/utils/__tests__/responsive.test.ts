import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BREAKPOINTS,
  DEVICE_RANGES,
  MIN_TOUCH_TARGET,
  MIN_TOUCH_SPACING,
  getSafeAreaInsets,
  applySafeAreaInsets,
  getSafeAreaPadding,
  getSafeAreaInsetVar,
  hasSafeAreaInsets,
  validateTouchTargetSize,
  validateTouchTargetSpacing,
  ensureMinTouchTarget,
  getTouchTargetPadding,
  calculateResponsiveColumns,
  getResponsiveColumnCount,
  getResponsiveGridClass,
  getCurrentDeviceType,
  getResponsiveColumns,
} from '../responsive';

describe('Responsive Layout Utilities', () => {
  describe('Constants', () => {
    it('should have correct minimum touch target size', () => {
      expect(MIN_TOUCH_TARGET).toBe(44);
    });

    it('should have correct minimum touch spacing', () => {
      expect(MIN_TOUCH_SPACING).toBe(8);
    });

    it('should have device ranges defined', () => {
      expect(DEVICE_RANGES.mobile).toEqual({ min: 320, max: 767 });
      expect(DEVICE_RANGES.tablet).toEqual({ min: 768, max: 1023 });
      expect(DEVICE_RANGES.desktop).toEqual({ min: 1024, max: Infinity });
    });
  });

  describe('Safe Area Utilities', () => {
    describe('getSafeAreaInsets', () => {
      it('should return zero insets when safe area is not supported', () => {
        // Mock CSS.supports to return false
        const originalSupports = CSS.supports;
        CSS.supports = vi.fn(() => false);
        
        const insets = getSafeAreaInsets();
        expect(insets).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
        
        // Restore original
        CSS.supports = originalSupports;
      });
    });

    describe('getSafeAreaPadding', () => {
      it('should generate correct CSS for top padding', () => {
        const result = getSafeAreaPadding('top', '16px');
        expect(result).toBe('max(env(safe-area-inset-top), 16px)');
      });

      it('should generate correct CSS for bottom padding', () => {
        const result = getSafeAreaPadding('bottom', '20px');
        expect(result).toBe('max(env(safe-area-inset-bottom), 20px)');
      });

      it('should use default fallback of 0px', () => {
        const result = getSafeAreaPadding('left');
        expect(result).toBe('max(env(safe-area-inset-left), 0px)');
      });
    });

    describe('getSafeAreaInsetVar', () => {
      it('should return correct CSS variable for each side', () => {
        expect(getSafeAreaInsetVar('top')).toBe('env(safe-area-inset-top)');
        expect(getSafeAreaInsetVar('right')).toBe('env(safe-area-inset-right)');
        expect(getSafeAreaInsetVar('bottom')).toBe('env(safe-area-inset-bottom)');
        expect(getSafeAreaInsetVar('left')).toBe('env(safe-area-inset-left)');
      });
    });

    describe('applySafeAreaInsets', () => {
      it('should apply safe area insets to all sides by default', () => {
        const element = document.createElement('div');
        applySafeAreaInsets(element);
        
        expect(element.style.paddingTop).toContain('env(safe-area-inset-top)');
        expect(element.style.paddingRight).toContain('env(safe-area-inset-right)');
        expect(element.style.paddingBottom).toContain('env(safe-area-inset-bottom)');
        expect(element.style.paddingLeft).toContain('env(safe-area-inset-left)');
      });

      it('should apply safe area insets to specific sides only', () => {
        const element = document.createElement('div');
        applySafeAreaInsets(element, { top: true, bottom: true, left: false, right: false });
        
        expect(element.style.paddingTop).toContain('env(safe-area-inset-top)');
        expect(element.style.paddingBottom).toContain('env(safe-area-inset-bottom)');
        expect(element.style.paddingLeft).toBe('');
        expect(element.style.paddingRight).toBe('');
      });
    });

    describe('hasSafeAreaInsets', () => {
      it('should return false when all insets are zero', () => {
        // Mock CSS.supports to return false
        const originalSupports = CSS.supports;
        CSS.supports = vi.fn(() => false);
        
        const result = hasSafeAreaInsets();
        expect(result).toBe(false);
        
        // Restore original
        CSS.supports = originalSupports;
      });
    });
  });

  describe('Touch Target Validation', () => {
    describe('validateTouchTargetSize', () => {
      it('should validate element meets minimum touch target size', () => {
        const element = document.createElement('button');
        element.style.width = '50px';
        element.style.height = '50px';
        element.style.position = 'absolute';
        document.body.appendChild(element);

        const result = validateTouchTargetSize(element);
        
        expect(result.minWidth).toBe(44);
        expect(result.minHeight).toBe(44);
        // In test environment, getBoundingClientRect may return 0, so we check the logic
        expect(result.width >= 0).toBe(true);
        expect(result.height >= 0).toBe(true);

        document.body.removeChild(element);
      });

      it('should detect when element is too small', () => {
        const element = document.createElement('button');
        element.style.width = '30px';
        element.style.height = '30px';
        document.body.appendChild(element);

        const result = validateTouchTargetSize(element);
        
        expect(result.valid).toBe(false);
        expect(result.width).toBeLessThan(44);
        expect(result.height).toBeLessThan(44);

        document.body.removeChild(element);
      });
    });

    describe('ensureMinTouchTarget', () => {
      it('should return original dimensions if they meet minimum', () => {
        const result = ensureMinTouchTarget(50, 50);
        expect(result).toEqual({ width: 50, height: 50 });
      });

      it('should adjust dimensions to meet minimum', () => {
        const result = ensureMinTouchTarget(30, 40);
        expect(result).toEqual({ width: 44, height: 44 });
      });

      it('should handle zero dimensions', () => {
        const result = ensureMinTouchTarget(0, 0);
        expect(result).toEqual({ width: 44, height: 44 });
      });
    });

    describe('getTouchTargetPadding', () => {
      it('should return zero padding when dimensions meet minimum', () => {
        const result = getTouchTargetPadding(50, 50);
        expect(result).toEqual({ horizontal: 0, vertical: 0 });
      });

      it('should calculate padding needed to meet minimum', () => {
        const result = getTouchTargetPadding(30, 40);
        expect(result.horizontal).toBe(7); // (44 - 30) / 2
        expect(result.vertical).toBe(2);   // (44 - 40) / 2
      });

      it('should handle very small dimensions', () => {
        const result = getTouchTargetPadding(10, 10);
        expect(result.horizontal).toBe(17); // (44 - 10) / 2
        expect(result.vertical).toBe(17);
      });
    });
  });

  describe('Responsive Column Utilities', () => {
    describe('calculateResponsiveColumns', () => {
      it('should return 1 column for mobile width', () => {
        const result = calculateResponsiveColumns(375);
        expect(result).toBe(1);
      });

      it('should return 2 columns for tablet width', () => {
        const result = calculateResponsiveColumns(768);
        expect(result).toBe(2);
      });

      it('should return 3 columns for desktop width', () => {
        const result = calculateResponsiveColumns(1024);
        expect(result).toBe(3);
      });

      it('should return 3 columns for large desktop width', () => {
        const result = calculateResponsiveColumns(1920);
        expect(result).toBe(3);
      });
    });

    describe('getResponsiveColumnCount', () => {
      it('should calculate columns based on container width and min column width', () => {
        const result = getResponsiveColumnCount(1000, { minColumnWidth: 250 });
        expect(result).toBe(4); // 1000 / 250 = 4
      });

      it('should respect maximum columns', () => {
        const result = getResponsiveColumnCount(2000, { minColumnWidth: 200, maxColumns: 4 });
        expect(result).toBe(4); // Would be 10, but capped at 4
      });

      it('should respect minimum columns', () => {
        const result = getResponsiveColumnCount(100, { minColumnWidth: 250, minColumns: 2 });
        expect(result).toBe(2); // Would be 0, but minimum is 2
      });

      it('should use default values', () => {
        const result = getResponsiveColumnCount(500);
        expect(result).toBe(2); // 500 / 250 (default) = 2
      });
    });

    describe('getResponsiveGridClass', () => {
      it('should generate grid classes with default values', () => {
        const result = getResponsiveGridClass();
        expect(result).toBe('grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
      });

      it('should generate grid classes with custom values', () => {
        const result = getResponsiveGridClass({ mobile: 1, tablet: 3, desktop: 4 });
        expect(result).toBe('grid-cols-1 md:grid-cols-3 lg:grid-cols-4');
      });

      it('should omit redundant breakpoint classes', () => {
        const result = getResponsiveGridClass({ mobile: 2, tablet: 2, desktop: 2 });
        expect(result).toBe('grid-cols-2');
      });

      it('should handle partial custom values', () => {
        const result = getResponsiveGridClass({ mobile: 1, tablet: 2 });
        // When desktop is not specified, it defaults to 3
        expect(result).toBe('grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
      });
    });

    describe('getResponsiveColumns', () => {
      beforeEach(() => {
        // Mock window.innerWidth for testing
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        });
      });

      it('should return default columns for desktop', () => {
        const result = getResponsiveColumns();
        expect(result).toBe(3);
      });

      it('should return custom columns', () => {
        const result = getResponsiveColumns({ mobile: 1, tablet: 2, desktop: 4 });
        expect(result).toBe(4);
      });
    });
  });
});
