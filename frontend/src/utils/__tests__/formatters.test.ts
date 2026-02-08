import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatTimeAgo,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDistanceMetric,
  formatDuration,
} from '../formatters';

describe('Date Formatting', () => {
  const testDate = new Date('2025-06-15T14:30:00');

  describe('formatDate', () => {
    it('should format date in English', () => {
      const result = formatDate(testDate, 'PPP', 'en');
      expect(result).toContain('June');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('should format date in Traditional Chinese', () => {
      const result = formatDate(testDate, 'PPP', 'zh-TW');
      expect(result).toBeTruthy();
      expect(result).toContain('2025');
    });

    it('should format date in Simplified Chinese', () => {
      const result = formatDate(testDate, 'PPP', 'zh-CN');
      expect(result).toBeTruthy();
      expect(result).toContain('2025');
    });

    it('should handle string dates', () => {
      const result = formatDate('2025-06-15', 'PPP', 'en');
      expect(result).toContain('June');
    });

    it('should handle timestamp dates', () => {
      const result = formatDate(testDate.getTime(), 'PPP', 'en');
      expect(result).toContain('June');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time in English', () => {
      const result = formatDateTime(testDate, 'PPpp', 'en');
      expect(result).toMatch(/Jun|June/); // Accept both abbreviated and full month
      expect(result).toContain('2025');
    });

    it('should format date and time in Traditional Chinese', () => {
      const result = formatDateTime(testDate, 'PPpp', 'zh-TW');
      expect(result).toBeTruthy();
      expect(result).toContain('2025');
    });

    it('should format date and time in Simplified Chinese', () => {
      const result = formatDateTime(testDate, 'PPpp', 'zh-CN');
      expect(result).toBeTruthy();
      expect(result).toContain('2025');
    });
  });

  describe('formatTime', () => {
    it('should format time in English', () => {
      const result = formatTime(testDate, 'p', 'en');
      expect(result).toBeTruthy();
      expect(result.toLowerCase()).toMatch(/am|pm/);
    });

    it('should format time in Traditional Chinese', () => {
      const result = formatTime(testDate, 'p', 'zh-TW');
      expect(result).toBeTruthy();
    });

    it('should format time in Simplified Chinese', () => {
      const result = formatTime(testDate, 'p', 'zh-CN');
      expect(result).toBeTruthy();
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time in English', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const result = formatRelativeTime(pastDate, new Date(), 'en');
      expect(result).toContain('ago');
      expect(result).toContain('hour');
    });

    it('should format relative time in Traditional Chinese', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(pastDate, new Date(), 'zh-TW');
      expect(result).toBeTruthy();
    });

    it('should format relative time in Simplified Chinese', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(pastDate, new Date(), 'zh-CN');
      expect(result).toBeTruthy();
    });
  });

  describe('formatTimeAgo', () => {
    it('should format time ago in English', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = formatTimeAgo(yesterday, new Date(), 'en');
      expect(result).toBeTruthy();
      expect(result.toLowerCase()).toContain('yesterday');
    });

    it('should format time ago in Traditional Chinese', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = formatTimeAgo(yesterday, new Date(), 'zh-TW');
      expect(result).toBeTruthy();
    });

    it('should format time ago in Simplified Chinese', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = formatTimeAgo(yesterday, new Date(), 'zh-CN');
      expect(result).toBeTruthy();
    });
  });
});

describe('Currency Formatting', () => {
  describe('formatCurrency', () => {
    it('should format USD in English locale', () => {
      const result = formatCurrency(1234.56, 'USD', 'en');
      expect(result).toContain('1,234');
      expect(result).toMatch(/\$|USD/);
    });

    it('should format USD in Traditional Chinese locale', () => {
      const result = formatCurrency(1234.56, 'USD', 'zh-TW');
      expect(result).toContain('1,234');
      expect(result).toMatch(/\$|USD/);
    });

    it('should format USD in Simplified Chinese locale', () => {
      const result = formatCurrency(1234.56, 'USD', 'zh-CN');
      expect(result).toContain('1,234');
      expect(result).toMatch(/\$|USD/);
    });

    it('should format EUR in English locale', () => {
      const result = formatCurrency(1234.56, 'EUR', 'en');
      expect(result).toContain('1,234');
      expect(result).toMatch(/€|EUR/);
    });

    it('should format JPY in English locale', () => {
      const result = formatCurrency(1234, 'JPY', 'en');
      expect(result).toContain('1,234');
      expect(result).toMatch(/¥|JPY/);
    });

    it('should format CNY in Traditional Chinese locale', () => {
      const result = formatCurrency(1234.56, 'CNY', 'zh-TW');
      expect(result).toContain('1,234');
    });

    it('should format CNY in Simplified Chinese locale', () => {
      const result = formatCurrency(1234.56, 'CNY', 'zh-CN');
      expect(result).toContain('1,234');
    });

    it('should handle zero amounts', () => {
      const result = formatCurrency(0, 'USD', 'en');
      expect(result).toMatch(/0|USD/);
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100, 'USD', 'en');
      expect(result).toContain('100');
      expect(result).toMatch(/-|\(|\)/); // Different locales use different negative formats
    });
  });
});

describe('Number Formatting', () => {
  describe('formatNumber', () => {
    it('should format numbers in English locale', () => {
      const result = formatNumber(1234567.89, 'en');
      expect(result).toBe('1,234,567.89');
    });

    it('should format numbers in Traditional Chinese locale', () => {
      const result = formatNumber(1234567.89, 'zh-TW');
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('567');
    });

    it('should format numbers in Simplified Chinese locale', () => {
      const result = formatNumber(1234567.89, 'zh-CN');
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('567');
    });

    it('should format integers without decimals', () => {
      const result = formatNumber(1234, 'en', { maximumFractionDigits: 0 });
      expect(result).toBe('1,234');
    });

    it('should respect custom formatting options', () => {
      const result = formatNumber(1234.5678, 'en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result).toBe('1,234.57');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages in English locale', () => {
      const result = formatPercent(75, 'en', 0);
      expect(result).toBe('75%');
    });

    it('should format percentages in Traditional Chinese locale', () => {
      const result = formatPercent(75, 'zh-TW', 0);
      expect(result).toContain('75');
      expect(result).toContain('%');
    });

    it('should format percentages in Simplified Chinese locale', () => {
      const result = formatPercent(75, 'zh-CN', 0);
      expect(result).toContain('75');
      expect(result).toContain('%');
    });

    it('should format percentages with decimals', () => {
      const result = formatPercent(75.5, 'en', 1);
      expect(result).toBe('75.5%');
    });

    it('should handle zero percent', () => {
      const result = formatPercent(0, 'en', 0);
      expect(result).toBe('0%');
    });

    it('should handle 100 percent', () => {
      const result = formatPercent(100, 'en', 0);
      expect(result).toBe('100%');
    });
  });
});

describe('Distance Formatting', () => {
  describe('formatDistanceMetric', () => {
    it('should format meters in English (imperial)', () => {
      const result = formatDistanceMetric(500, 'en');
      expect(result).toContain('ft');
    });

    it('should format kilometers in English (imperial)', () => {
      const result = formatDistanceMetric(5000, 'en');
      expect(result).toContain('mi');
    });

    it('should format meters in Traditional Chinese (metric)', () => {
      const result = formatDistanceMetric(500, 'zh-TW');
      expect(result).toContain('m');
      expect(result).toContain('500');
    });

    it('should format kilometers in Traditional Chinese (metric)', () => {
      const result = formatDistanceMetric(5000, 'zh-TW');
      expect(result).toContain('km');
      expect(result).toContain('5');
    });

    it('should format meters in Simplified Chinese (metric)', () => {
      const result = formatDistanceMetric(500, 'zh-CN');
      expect(result).toContain('m');
      expect(result).toContain('500');
    });

    it('should format kilometers in Simplified Chinese (metric)', () => {
      const result = formatDistanceMetric(5000, 'zh-CN');
      expect(result).toContain('km');
      expect(result).toContain('5');
    });

    it('should handle zero distance', () => {
      const result = formatDistanceMetric(0, 'en');
      expect(result).toContain('0');
    });
  });
});

describe('Duration Formatting', () => {
  describe('formatDuration', () => {
    it('should format minutes only in English', () => {
      const result = formatDuration(45, 'en');
      expect(result).toBe('45m');
    });

    it('should format hours only in English', () => {
      const result = formatDuration(120, 'en');
      expect(result).toBe('2h');
    });

    it('should format hours and minutes in English', () => {
      const result = formatDuration(150, 'en');
      expect(result).toBe('2h 30m');
    });

    it('should format minutes only in Traditional Chinese', () => {
      const result = formatDuration(45, 'zh-TW');
      expect(result).toBe('45分钟');
    });

    it('should format hours only in Traditional Chinese', () => {
      const result = formatDuration(120, 'zh-TW');
      expect(result).toBe('2小时');
    });

    it('should format hours and minutes in Traditional Chinese', () => {
      const result = formatDuration(150, 'zh-TW');
      expect(result).toBe('2小时30分钟');
    });

    it('should format minutes only in Simplified Chinese', () => {
      const result = formatDuration(45, 'zh-CN');
      expect(result).toBe('45分钟');
    });

    it('should format hours only in Simplified Chinese', () => {
      const result = formatDuration(120, 'zh-CN');
      expect(result).toBe('2小时');
    });

    it('should format hours and minutes in Simplified Chinese', () => {
      const result = formatDuration(150, 'zh-CN');
      expect(result).toBe('2小时30分钟');
    });

    it('should handle zero duration', () => {
      const result = formatDuration(0, 'en');
      expect(result).toBe('0m');
    });
  });
});
