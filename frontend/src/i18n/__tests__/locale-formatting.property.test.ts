/**
 * Property Test: Locale-Specific Formatting
 * 
 * Validates Requirement 15.5:
 * - Dates, times, and numbers are formatted according to user's locale
 * - Formatting is consistent within each locale
 * - All supported locales have proper formatting
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercent,
  getDateFormatPatterns,
  getDecimalSeparator,
  getThousandsSeparator,
} from '../formatters';

const SUPPORTED_LOCALES = ['en', 'zh-TW', 'zh-CN', 'ja'];

describe('Property Test: Locale-Specific Formatting', () => {
  /**
   * Property 31: Locale-Specific Formatting
   * 
   * For any supported locale L and value V:
   * - formatDate(V, pattern, L) should return a locale-appropriate date string
   * - formatNumber(V, L) should return a locale-appropriate number string
   * - formatCurrency(V, currency, L) should return a locale-appropriate currency string
   */
  describe('Property 31: All locales have proper formatting', () => {
    const testDate = new Date('2024-03-15T14:30:00');
    const testNumber = 1234567.89;
    const testCurrency = 1234.56;

    it('should format dates for all supported locales', () => {
      for (const locale of SUPPORTED_LOCALES) {
        const patterns = getDateFormatPatterns(locale);
        
        // Property: Each locale must have date format patterns
        expect(patterns).toBeDefined();
        expect(patterns.short).toBeDefined();
        expect(patterns.medium).toBeDefined();
        expect(patterns.long).toBeDefined();
        expect(patterns.time).toBeDefined();
        expect(patterns.dateTime).toBeDefined();
        
        // Property: Formatting should return non-empty strings
        const shortDate = formatDate(testDate, patterns.short, locale);
        const mediumDate = formatDate(testDate, patterns.medium, locale);
        const longDate = formatDate(testDate, patterns.long, locale);
        const time = formatDate(testDate, patterns.time, locale);
        const dateTime = formatDate(testDate, patterns.dateTime, locale);
        
        expect(shortDate).toBeTruthy();
        expect(mediumDate).toBeTruthy();
        expect(longDate).toBeTruthy();
        expect(time).toBeTruthy();
        expect(dateTime).toBeTruthy();
        
        // Property: All formatted dates should contain the year
        expect(mediumDate).toContain('2024');
        expect(longDate).toContain('2024');
      }
    });

    it('should format numbers for all supported locales', () => {
      for (const locale of SUPPORTED_LOCALES) {
        const formatted = formatNumber(testNumber, locale);
        
        // Property: Should return a non-empty string
        expect(formatted).toBeTruthy();
        expect(typeof formatted).toBe('string');
        
        // Property: Should contain the base digits
        expect(formatted).toMatch(/1.*2.*3.*4.*5.*6.*7/);
        
        // Property: Should have thousands separator
        const separator = getThousandsSeparator(locale);
        expect(formatted).toContain(separator);
      }
    });

    it('should format currency for all supported locales', () => {
      const currencies = [
        { locale: 'en', currency: 'USD' },
        { locale: 'zh-TW', currency: 'TWD' },
        { locale: 'zh-CN', currency: 'CNY' },
        { locale: 'ja', currency: 'JPY' },
      ];
      
      for (const { locale, currency } of currencies) {
        const formatted = formatCurrency(testCurrency, currency, locale);
        
        // Property: Should return a non-empty string
        expect(formatted).toBeTruthy();
        expect(typeof formatted).toBe('string');
        
        // Property: Should contain the number (possibly rounded for JPY)
        expect(formatted.length).toBeGreaterThan(3);
      }
    });

    it('should format percentages for all supported locales', () => {
      const testPercent = 75.5;
      
      for (const locale of SUPPORTED_LOCALES) {
        const formatted = formatPercent(testPercent, locale, 1);
        
        // Property: Should return a non-empty string
        expect(formatted).toBeTruthy();
        expect(typeof formatted).toBe('string');
        
        // Property: Should contain the percent sign
        expect(formatted).toContain('%');
        
        // Property: Should contain the number
        expect(formatted).toContain('75');
      }
    });
  });

  /**
   * Property: Consistent separators
   * 
   * For any locale L:
   * - getDecimalSeparator(L) should return a consistent separator
   * - getThousandsSeparator(L) should return a consistent separator
   * - Separators should be different from each other
   */
  describe('Property: Consistent number separators', () => {
    it('should have consistent decimal separators for each locale', () => {
      for (const locale of SUPPORTED_LOCALES) {
        const separator1 = getDecimalSeparator(locale);
        const separator2 = getDecimalSeparator(locale);
        
        // Property: Should return the same separator on multiple calls
        expect(separator1).toBe(separator2);
        
        // Property: Should be a single character
        expect(separator1.length).toBe(1);
      }
    });

    it('should have consistent thousands separators for each locale', () => {
      for (const locale of SUPPORTED_LOCALES) {
        const separator1 = getThousandsSeparator(locale);
        const separator2 = getThousandsSeparator(locale);
        
        // Property: Should return the same separator on multiple calls
        expect(separator1).toBe(separator2);
        
        // Property: Should be a single character
        expect(separator1.length).toBe(1);
      }
    });

    it('should have different decimal and thousands separators', () => {
      for (const locale of SUPPORTED_LOCALES) {
        const decimalSep = getDecimalSeparator(locale);
        const thousandsSep = getThousandsSeparator(locale);
        
        // Property: Separators should be different
        expect(decimalSep).not.toBe(thousandsSep);
      }
    });
  });

  /**
   * Property: Formatting consistency
   * 
   * For any value V and locale L:
   * - Formatting the same value multiple times should return the same result
   */
  describe('Property: Formatting is deterministic', () => {
    it('should format the same date consistently', () => {
      const testDate = new Date('2024-06-20T10:30:00');
      
      for (const locale of SUPPORTED_LOCALES) {
        const patterns = getDateFormatPatterns(locale);
        
        const result1 = formatDate(testDate, patterns.medium, locale);
        const result2 = formatDate(testDate, patterns.medium, locale);
        const result3 = formatDate(testDate, patterns.medium, locale);
        
        // Property: Should return the same result every time
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      }
    });

    it('should format the same number consistently', () => {
      const testNumber = 9876.54;
      
      for (const locale of SUPPORTED_LOCALES) {
        const result1 = formatNumber(testNumber, locale);
        const result2 = formatNumber(testNumber, locale);
        const result3 = formatNumber(testNumber, locale);
        
        // Property: Should return the same result every time
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      }
    });

    it('should format the same currency consistently', () => {
      const testAmount = 500.25;
      
      for (const locale of SUPPORTED_LOCALES) {
        const currency = locale === 'en' ? 'USD' : locale === 'zh-TW' ? 'TWD' : locale === 'zh-CN' ? 'CNY' : 'JPY';
        
        const result1 = formatCurrency(testAmount, currency, locale);
        const result2 = formatCurrency(testAmount, currency, locale);
        const result3 = formatCurrency(testAmount, currency, locale);
        
        // Property: Should return the same result every time
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      }
    });
  });

  /**
   * Property: Locale-specific characteristics
   * 
   * Different locales should produce different formatting for the same value
   */
  describe('Property: Locale-specific differences', () => {
    it('should format dates differently across locales', () => {
      const testDate = new Date('2024-03-15T14:30:00');
      const results: Record<string, string> = {};
      
      for (const locale of SUPPORTED_LOCALES) {
        const patterns = getDateFormatPatterns(locale);
        results[locale] = formatDate(testDate, patterns.medium, locale);
      }
      
      // Property: English should use month names
      expect(results.en).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
      
      // Property: Asian languages should use 月 (month character)
      expect(results['zh-TW']).toContain('月');
      expect(results['zh-CN']).toContain('月');
      expect(results.ja).toContain('月');
    });

    it('should use appropriate thousands separators', () => {
      const testNumber = 1234567;
      
      for (const locale of SUPPORTED_LOCALES) {
        const formatted = formatNumber(testNumber, locale);
        const separator = getThousandsSeparator(locale);
        
        // Property: Formatted number should use the locale's separator
        expect(formatted).toContain(separator);
      }
    });
  });

  /**
   * Property: Edge cases
   * 
   * Formatting should handle edge cases gracefully
   */
  describe('Property: Edge case handling', () => {
    it('should handle zero values', () => {
      for (const locale of SUPPORTED_LOCALES) {
        const number = formatNumber(0, locale);
        const currency = formatCurrency(0, 'USD', locale);
        const percent = formatPercent(0, locale);
        
        // Property: Should return valid strings
        expect(number).toBeTruthy();
        expect(currency).toBeTruthy();
        expect(percent).toBeTruthy();
        
        // Property: Should contain zero
        expect(number).toContain('0');
      }
    });

    it('should handle negative numbers', () => {
      const testNumber = -1234.56;
      
      for (const locale of SUPPORTED_LOCALES) {
        const formatted = formatNumber(testNumber, locale);
        
        // Property: Should return a valid string
        expect(formatted).toBeTruthy();
        
        // Property: Should indicate negative value (minus sign or parentheses)
        expect(formatted).toMatch(/-|−|\(.*\)/);
      }
    });

    it('should handle very large numbers', () => {
      const largeNumber = 999999999.99;
      
      for (const locale of SUPPORTED_LOCALES) {
        const formatted = formatNumber(largeNumber, locale);
        
        // Property: Should return a valid string
        expect(formatted).toBeTruthy();
        
        // Property: Should contain thousands separators
        const separator = getThousandsSeparator(locale);
        expect(formatted).toContain(separator);
      }
    });

    it('should handle very small decimal numbers', () => {
      const smallNumber = 0.0001;
      
      for (const locale of SUPPORTED_LOCALES) {
        const formatted = formatNumber(smallNumber, locale, 4);
        
        // Property: Should return a valid string
        expect(formatted).toBeTruthy();
        
        // Property: Should contain decimal separator
        const separator = getDecimalSeparator(locale);
        expect(formatted).toContain(separator);
      }
    });
  });

  /**
   * Property: Precision control
   * 
   * For any number N and precision P:
   * - formatNumber(N, locale, P) should respect the precision
   */
  describe('Property: Precision control', () => {
    it('should respect decimal precision for numbers', () => {
      const testNumber = 123.456789;
      
      for (const locale of SUPPORTED_LOCALES) {
        const precision0 = formatNumber(testNumber, locale, 0);
        const precision2 = formatNumber(testNumber, locale, 2);
        const precision4 = formatNumber(testNumber, locale, 4);
        
        // Property: Different precisions should produce different results
        expect(precision0).not.toBe(precision2);
        expect(precision2).not.toBe(precision4);
        
        // Property: All should be valid strings
        expect(precision0).toBeTruthy();
        expect(precision2).toBeTruthy();
        expect(precision4).toBeTruthy();
      }
    });

    it('should respect decimal precision for percentages', () => {
      const testPercent = 33.333333;
      
      for (const locale of SUPPORTED_LOCALES) {
        const precision0 = formatPercent(testPercent, locale, 0);
        const precision1 = formatPercent(testPercent, locale, 1);
        const precision2 = formatPercent(testPercent, locale, 2);
        
        // Property: Different precisions should produce different results
        expect(precision0).not.toBe(precision1);
        expect(precision1).not.toBe(precision2);
        
        // Property: All should contain percent sign
        expect(precision0).toContain('%');
        expect(precision1).toContain('%');
        expect(precision2).toContain('%');
      }
    });
  });
});
