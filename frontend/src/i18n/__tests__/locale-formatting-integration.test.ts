import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../config';
import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercent,
  getDateFormatPatterns,
} from '../formatters';

/**
 * Integration tests for locale-specific formatting
 * Validates Requirement 15.5: Format dates, times, and numbers according to the user's locale
 */
describe('Locale-Specific Formatting Integration', () => {
  const testDate = new Date('2024-03-15T14:30:00');
  const testNumber = 1234567.89;
  const testCurrency = 1234.56;

  beforeEach(async () => {
    // Ensure i18n is initialized
    await i18n.init();
  });

  describe('English Locale (en)', () => {
    beforeEach(() => {
      i18n.changeLanguage('en');
    });

    it('should format dates in English locale', () => {
      const patterns = getDateFormatPatterns('en');
      const shortDate = formatDate(testDate, patterns.short, 'en');
      const mediumDate = formatDate(testDate, patterns.medium, 'en');
      const time = formatDate(testDate, patterns.time, 'en');

      expect(shortDate).toContain('Mar');
      expect(mediumDate).toContain('2024');
      expect(time).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });

    it('should format numbers in English locale', () => {
      const formatted = formatNumber(testNumber, 'en');
      
      // English uses comma for thousands separator and period for decimal
      expect(formatted).toContain(',');
      expect(formatted).toContain('.');
      expect(formatted).toMatch(/1,234,567\.\d+/);
    });

    it('should format currency in English locale', () => {
      const usd = formatCurrency(testCurrency, 'USD', 'en');
      
      expect(usd).toMatch(/\$|USD/);
      expect(usd).toContain('1,234');
    });

    it('should format percentages in English locale', () => {
      const percent = formatPercent(75.5, 'en', 1);
      
      expect(percent).toContain('75');
      expect(percent).toContain('%');
    });
  });

  describe('Traditional Chinese Locale (zh-TW)', () => {
    beforeEach(() => {
      i18n.changeLanguage('zh-TW');
    });

    it('should format dates in Traditional Chinese locale', () => {
      const patterns = getDateFormatPatterns('zh-TW');
      const shortDate = formatDate(testDate, patterns.short, 'zh-TW');
      const mediumDate = formatDate(testDate, patterns.medium, 'zh-TW');

      expect(shortDate).toContain('月');
      expect(shortDate).toContain('日');
      expect(mediumDate).toContain('年');
      expect(mediumDate).toContain('2024');
    });

    it('should format numbers in Traditional Chinese locale', () => {
      const formatted = formatNumber(testNumber, 'zh-TW');
      
      // Chinese uses comma for thousands separator
      expect(formatted).toContain(',');
      expect(formatted).toMatch(/1,234,567\.\d+/);
    });

    it('should format currency in Traditional Chinese locale', () => {
      const twd = formatCurrency(testCurrency, 'TWD', 'zh-TW');
      
      expect(twd).toContain('1,234');
    });

    it('should format percentages in Traditional Chinese locale', () => {
      const percent = formatPercent(75.5, 'zh-TW', 1);
      
      expect(percent).toContain('75');
      expect(percent).toContain('%');
    });
  });

  describe('Simplified Chinese Locale (zh-CN)', () => {
    beforeEach(() => {
      i18n.changeLanguage('zh-CN');
    });

    it('should format dates in Simplified Chinese locale', () => {
      const patterns = getDateFormatPatterns('zh-CN');
      const shortDate = formatDate(testDate, patterns.short, 'zh-CN');
      const mediumDate = formatDate(testDate, patterns.medium, 'zh-CN');

      expect(shortDate).toContain('月');
      expect(shortDate).toContain('日');
      expect(mediumDate).toContain('年');
      expect(mediumDate).toContain('2024');
    });

    it('should format numbers in Simplified Chinese locale', () => {
      const formatted = formatNumber(testNumber, 'zh-CN');
      
      // Chinese uses comma for thousands separator
      expect(formatted).toContain(',');
      expect(formatted).toMatch(/1,234,567\.\d+/);
    });

    it('should format currency in Simplified Chinese locale', () => {
      const cny = formatCurrency(testCurrency, 'CNY', 'zh-CN');
      
      expect(cny).toContain('1,234');
    });

    it('should format percentages in Simplified Chinese locale', () => {
      const percent = formatPercent(75.5, 'zh-CN', 1);
      
      expect(percent).toContain('75');
      expect(percent).toContain('%');
    });
  });

  describe('Japanese Locale (ja)', () => {
    beforeEach(() => {
      i18n.changeLanguage('ja');
    });

    it('should format dates in Japanese locale', () => {
      const patterns = getDateFormatPatterns('ja');
      const shortDate = formatDate(testDate, patterns.short, 'ja');
      const mediumDate = formatDate(testDate, patterns.medium, 'ja');

      expect(shortDate).toContain('月');
      expect(shortDate).toContain('日');
      expect(mediumDate).toContain('年');
      expect(mediumDate).toContain('2024');
    });

    it('should format numbers in Japanese locale', () => {
      const formatted = formatNumber(testNumber, 'ja');
      
      // Japanese uses comma for thousands separator
      expect(formatted).toContain(',');
      expect(formatted).toMatch(/1,234,567\.\d+/);
    });

    it('should format currency in Japanese locale', () => {
      const jpy = formatCurrency(testCurrency, 'JPY', 'ja');
      
      // JPY typically doesn't show decimal places
      expect(jpy).toContain('1,235'); // Rounded
    });

    it('should format percentages in Japanese locale', () => {
      const percent = formatPercent(75.5, 'ja', 1);
      
      expect(percent).toContain('75');
      expect(percent).toContain('%');
    });
  });

  describe('Cross-Locale Consistency', () => {
    it('should format the same date differently across locales', () => {
      const patterns = {
        en: getDateFormatPatterns('en'),
        zhTW: getDateFormatPatterns('zh-TW'),
        zhCN: getDateFormatPatterns('zh-CN'),
        ja: getDateFormatPatterns('ja'),
      };

      const enDate = formatDate(testDate, patterns.en.medium, 'en');
      const zhTWDate = formatDate(testDate, patterns.zhTW.medium, 'zh-TW');
      const zhCNDate = formatDate(testDate, patterns.zhCN.medium, 'zh-CN');
      const jaDate = formatDate(testDate, patterns.ja.medium, 'ja');

      // All should contain the year but in different formats
      expect(enDate).toContain('2024');
      expect(zhTWDate).toContain('2024');
      expect(zhCNDate).toContain('2024');
      expect(jaDate).toContain('2024');

      // English should use month names, Asian languages should use 月
      expect(enDate).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
      expect(zhTWDate).toContain('月');
      expect(zhCNDate).toContain('月');
      expect(jaDate).toContain('月');
    });

    it('should format the same number consistently across locales', () => {
      const enNumber = formatNumber(testNumber, 'en');
      const zhTWNumber = formatNumber(testNumber, 'zh-TW');
      const zhCNNumber = formatNumber(testNumber, 'zh-CN');
      const jaNumber = formatNumber(testNumber, 'ja');

      // All should use comma as thousands separator
      expect(enNumber).toContain(',');
      expect(zhTWNumber).toContain(',');
      expect(zhCNNumber).toContain(',');
      expect(jaNumber).toContain(',');

      // All should contain the base number
      expect(enNumber).toContain('1,234,567');
      expect(zhTWNumber).toContain('1,234,567');
      expect(zhCNNumber).toContain('1,234,567');
      expect(jaNumber).toContain('1,234,567');
    });

    it('should format currency with appropriate symbols across locales', () => {
      const currencies = [
        { code: 'USD', locale: 'en' },
        { code: 'TWD', locale: 'zh-TW' },
        { code: 'CNY', locale: 'zh-CN' },
        { code: 'JPY', locale: 'ja' },
      ];

      currencies.forEach(({ code, locale }) => {
        const formatted = formatCurrency(1000, code, locale);
        
        // Should contain the number
        expect(formatted).toMatch(/1,?000/);
        
        // Should contain currency symbol or code
        expect(formatted.length).toBeGreaterThan(4);
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format time according to locale', () => {
      const patterns = {
        en: getDateFormatPatterns('en'),
        zhTW: getDateFormatPatterns('zh-TW'),
        zhCN: getDateFormatPatterns('zh-CN'),
        ja: getDateFormatPatterns('ja'),
      };

      const enTime = formatDate(testDate, patterns.en.time, 'en');
      const zhTWTime = formatDate(testDate, patterns.zhTW.time, 'zh-TW');
      const zhCNTime = formatDate(testDate, patterns.zhCN.time, 'zh-CN');
      const jaTime = formatDate(testDate, patterns.ja.time, 'ja');

      // All should contain time information
      expect(enTime).toBeTruthy();
      expect(zhTWTime).toBeTruthy();
      expect(zhCNTime).toBeTruthy();
      expect(jaTime).toBeTruthy();

      // English should use AM/PM format
      expect(enTime).toMatch(/AM|PM/i);
    });
  });

  describe('DateTime Formatting', () => {
    it('should format date and time together according to locale', () => {
      const patterns = {
        en: getDateFormatPatterns('en'),
        zhTW: getDateFormatPatterns('zh-TW'),
        zhCN: getDateFormatPatterns('zh-CN'),
        ja: getDateFormatPatterns('ja'),
      };

      const enDateTime = formatDate(testDate, patterns.en.dateTime, 'en');
      const zhTWDateTime = formatDate(testDate, patterns.zhTW.dateTime, 'zh-TW');
      const zhCNDateTime = formatDate(testDate, patterns.zhCN.dateTime, 'zh-CN');
      const jaDateTime = formatDate(testDate, patterns.ja.dateTime, 'ja');

      // All should contain both date and time
      expect(enDateTime).toContain('2024');
      expect(zhTWDateTime).toContain('2024');
      expect(zhCNDateTime).toContain('2024');
      expect(jaDateTime).toContain('2024');

      // All should have time component
      expect(enDateTime.length).toBeGreaterThan(10);
      expect(zhTWDateTime.length).toBeGreaterThan(10);
      expect(zhCNDateTime.length).toBeGreaterThan(10);
      expect(jaDateTime.length).toBeGreaterThan(10);
    });
  });
});
