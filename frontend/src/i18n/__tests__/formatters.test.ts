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

describe('Date Formatting', () => {
  const testDate = new Date('2024-03-15T15:30:00');

  it('should format dates in English', () => {
    const patterns = getDateFormatPatterns('en');
    expect(formatDate(testDate, patterns.short, 'en')).toContain('Mar');
    expect(formatDate(testDate, patterns.medium, 'en')).toContain('2024');
  });

  it('should format dates in Traditional Chinese', () => {
    const patterns = getDateFormatPatterns('zh-TW');
    expect(formatDate(testDate, patterns.short, 'zh-TW')).toContain('月');
    expect(formatDate(testDate, patterns.medium, 'zh-TW')).toContain('年');
  });

  it('should format dates in Simplified Chinese', () => {
    const patterns = getDateFormatPatterns('zh-CN');
    expect(formatDate(testDate, patterns.short, 'zh-CN')).toContain('月');
    expect(formatDate(testDate, patterns.medium, 'zh-CN')).toContain('年');
  });

  it('should format dates in Japanese', () => {
    const patterns = getDateFormatPatterns('ja');
    expect(formatDate(testDate, patterns.short, 'ja')).toContain('月');
    expect(formatDate(testDate, patterns.medium, 'ja')).toContain('年');
  });
});

describe('Number Formatting', () => {
  it('should format numbers with correct separators', () => {
    const number = 1234567.89;

    // English uses comma for thousands, period for decimal
    const enFormatted = formatNumber(number, 'en');
    expect(enFormatted).toContain(',');
    expect(enFormatted).toContain('.');

    // Chinese and Japanese also use comma and period
    const zhTWFormatted = formatNumber(number, 'zh-TW');
    expect(zhTWFormatted).toContain(',');

    const jaFormatted = formatNumber(number, 'ja');
    expect(jaFormatted).toContain(',');
  });

  it('should get correct decimal separators', () => {
    expect(getDecimalSeparator('en')).toBe('.');
    expect(getDecimalSeparator('zh-TW')).toBe('.');
    expect(getDecimalSeparator('zh-CN')).toBe('.');
    expect(getDecimalSeparator('ja')).toBe('.');
  });

  it('should get correct thousands separators', () => {
    expect(getThousandsSeparator('en')).toBe(',');
    expect(getThousandsSeparator('zh-TW')).toBe(',');
    expect(getThousandsSeparator('zh-CN')).toBe(',');
    expect(getThousandsSeparator('ja')).toBe(',');
  });
});

describe('Currency Formatting', () => {
  it('should format USD currency', () => {
    const amount = 1234.56;
    const formatted = formatCurrency(amount, 'USD', 'en');
    expect(formatted).toContain('$');
    expect(formatted).toContain('1,234');
  });

  it('should format TWD currency', () => {
    const amount = 1234.56;
    const formatted = formatCurrency(amount, 'TWD', 'zh-TW');
    expect(formatted).toContain('1,234');
  });

  it('should format CNY currency', () => {
    const amount = 1234.56;
    const formatted = formatCurrency(amount, 'CNY', 'zh-CN');
    expect(formatted).toContain('1,234');
  });

  it('should format JPY currency without decimals', () => {
    const amount = 1234.56;
    const formatted = formatCurrency(amount, 'JPY', 'ja');
    // JPY typically doesn't show decimal places
    expect(formatted).toContain('1,235'); // Rounded
  });
});

describe('Percentage Formatting', () => {
  it('should format percentages', () => {
    expect(formatPercent(75, 'en')).toBe('75%');
    expect(formatPercent(75.5, 'en', 1)).toBe('75.5%');
    expect(formatPercent(100, 'en')).toBe('100%');
  });

  it('should format percentages in different languages', () => {
    expect(formatPercent(50, 'zh-TW')).toBe('50%');
    expect(formatPercent(50, 'zh-CN')).toBe('50%');
    expect(formatPercent(50, 'ja')).toBe('50%');
  });
});

describe('Date Format Patterns', () => {
  it('should return correct patterns for English', () => {
    const patterns = getDateFormatPatterns('en');
    expect(patterns.short).toBe('MMM d');
    expect(patterns.medium).toBe('MMM d, yyyy');
    expect(patterns.time).toBe('h:mm a');
  });

  it('should return correct patterns for Traditional Chinese', () => {
    const patterns = getDateFormatPatterns('zh-TW');
    expect(patterns.short).toBe('M月d日');
    expect(patterns.medium).toBe('yyyy年M月d日');
    expect(patterns.time).toBe('ah:mm');
  });

  it('should return correct patterns for Simplified Chinese', () => {
    const patterns = getDateFormatPatterns('zh-CN');
    expect(patterns.short).toBe('M月d日');
    expect(patterns.medium).toBe('yyyy年M月d日');
    expect(patterns.time).toBe('ah:mm');
  });

  it('should return correct patterns for Japanese', () => {
    const patterns = getDateFormatPatterns('ja');
    expect(patterns.short).toBe('M月d日');
    expect(patterns.medium).toBe('yyyy年M月d日');
    expect(patterns.time).toBe('ah:mm');
  });

  it('should fallback to English for unknown languages', () => {
    const patterns = getDateFormatPatterns('unknown');
    expect(patterns.short).toBe('MMM d');
    expect(patterns.medium).toBe('MMM d, yyyy');
  });
});
