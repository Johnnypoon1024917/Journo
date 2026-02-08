import { describe, it, expect } from 'vitest';
import {
  getRelativeLuminance,
  getContrastRatio,
  hexToRgb,
  meetsWCAGAA,
  meetsWCAGAAA,
  getAccessibleTextColor,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
    });

    it('should handle hex without #', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
    });
  });

  describe('getRelativeLuminance', () => {
    it('should calculate luminance for white', () => {
      const luminance = getRelativeLuminance(255, 255, 255);
      expect(luminance).toBeCloseTo(1, 2);
    });

    it('should calculate luminance for black', () => {
      const luminance = getRelativeLuminance(0, 0, 0);
      expect(luminance).toBeCloseTo(0, 2);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio between black and white', () => {
      const ratio = getContrastRatio(
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 }
      );
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate contrast ratio for same colors', () => {
      const ratio = getContrastRatio(
        { r: 128, g: 128, b: 128 },
        { r: 128, g: 128, b: 128 }
      );
      expect(ratio).toBeCloseTo(1, 0);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should pass for high contrast combinations', () => {
      // Black text on white background
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
      
      // Dark blue on white (our primary button color)
      expect(meetsWCAGAA('#1d4ed8', '#ffffff')).toBe(true);
    });

    it('should fail for low contrast combinations', () => {
      // Light gray on white
      expect(meetsWCAGAA('#e5e7eb', '#ffffff')).toBe(false);
    });

    it('should use different threshold for large text', () => {
      // This might pass for large text but fail for normal text
      const fg = '#6b7280';
      const bg = '#ffffff';
      
      // Check if it meets the 3:1 ratio for large text
      const rgb1 = hexToRgb(fg)!;
      const rgb2 = hexToRgb(bg)!;
      const ratio = getContrastRatio(rgb1, rgb2);
      
      expect(ratio).toBeGreaterThan(3);
    });
  });

  describe('meetsWCAGAAA', () => {
    it('should pass for very high contrast combinations', () => {
      expect(meetsWCAGAAA('#000000', '#ffffff')).toBe(true);
    });

    it('should fail for moderate contrast combinations', () => {
      // This might pass AA but fail AAA
      expect(meetsWCAGAAA('#6b7280', '#ffffff')).toBe(false);
    });
  });

  describe('getAccessibleTextColor', () => {
    it('should return white for dark backgrounds', () => {
      expect(getAccessibleTextColor('#000000')).toBe('#ffffff');
      expect(getAccessibleTextColor('#1f2937')).toBe('#ffffff');
    });

    it('should return black for light backgrounds', () => {
      expect(getAccessibleTextColor('#ffffff')).toBe('#000000');
      expect(getAccessibleTextColor('#f9fafb')).toBe('#000000');
    });
  });
});
