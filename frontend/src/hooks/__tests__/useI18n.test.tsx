import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { useI18n } from '../useI18n';
import i18n from '../../i18n/config';
import { ReactNode } from 'react';

// Wrapper component for tests
const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('useI18n Hook', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  describe('Translation Function', () => {
    it('should provide translation function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.t).toBeDefined();
      expect(typeof result.current.t).toBe('function');
    });

    it('should translate keys correctly', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      const translation = result.current.t('common:appName');
      expect(translation).toBe('Journo');
    });

    it('should translate with namespace', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      const translation = result.current.t('trip:createTrip');
      expect(translation).toBe('Create Trip');
    });
  });

  describe('Language Property', () => {
    it('should provide current language', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.language).toBe('en');
    });

    it('should update language when changed', async () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      
      await act(async () => {
        await i18n.changeLanguage('zh-TW');
      });

      await waitFor(() => {
        expect(result.current.language).toBe('zh-TW');
      });
    });
  });

  describe('Date Formatters', () => {
    it('should provide formatDate function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatDate).toBeDefined();
      expect(typeof result.current.formatDate).toBe('function');
    });

    it('should format dates with current locale', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      const testDate = new Date('2025-06-15');
      const formatted = result.current.formatDate(testDate);
      expect(formatted).toContain('June');
    });

    it('should format dates with Chinese locale after language change', async () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      
      await act(async () => {
        await i18n.changeLanguage('zh-TW');
      });

      await waitFor(() => {
        const testDate = new Date('2025-06-15');
        const formatted = result.current.formatDate(testDate);
        expect(formatted).toBeTruthy();
      });
    });

    it('should provide formatDateTime function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatDateTime).toBeDefined();
    });

    it('should provide formatTime function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatTime).toBeDefined();
    });

    it('should provide formatRelativeTime function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatRelativeTime).toBeDefined();
    });

    it('should provide formatTimeAgo function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatTimeAgo).toBeDefined();
    });
  });

  describe('Currency Formatters', () => {
    it('should provide formatCurrency function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatCurrency).toBeDefined();
    });

    it('should format currency with current locale', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      const formatted = result.current.formatCurrency(1234.56, 'USD');
      expect(formatted).toContain('1,234');
    });

    it('should format currency with Chinese locale after language change', async () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      
      await act(async () => {
        await i18n.changeLanguage('zh-CN');
      });

      await waitFor(() => {
        const formatted = result.current.formatCurrency(1234.56, 'CNY');
        expect(formatted).toContain('1,234');
      });
    });
  });

  describe('Number Formatters', () => {
    it('should provide formatNumber function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatNumber).toBeDefined();
    });

    it('should format numbers with current locale', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      const formatted = result.current.formatNumber(1234567.89);
      expect(formatted).toBe('1,234,567.89');
    });

    it('should provide formatPercent function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatPercent).toBeDefined();
    });

    it('should format percentages correctly', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      const formatted = result.current.formatPercent(75, 0);
      expect(formatted).toBe('75%');
    });
  });

  describe('Distance and Duration Formatters', () => {
    it('should provide formatDistance function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatDistance).toBeDefined();
    });

    it('should format distance in imperial for English', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      const formatted = result.current.formatDistance(5000);
      expect(formatted).toContain('mi');
    });

    it('should format distance in metric for Chinese', async () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      
      await act(async () => {
        await i18n.changeLanguage('zh-CN');
      });

      await waitFor(() => {
        const formatted = result.current.formatDistance(5000);
        expect(formatted).toContain('km');
      });
    });

    it('should provide formatDuration function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.formatDuration).toBeDefined();
    });

    it('should format duration in English', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      const formatted = result.current.formatDuration(150);
      expect(formatted).toBe('2h 30m');
    });

    it('should format duration in Chinese', async () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      
      await act(async () => {
        await i18n.changeLanguage('zh-CN');
      });

      await waitFor(() => {
        const formatted = result.current.formatDuration(150);
        expect(formatted).toBe('2小时30分钟');
      });
    });
  });

  describe('i18n Instance', () => {
    it('should provide i18n instance', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.i18n).toBeDefined();
      expect(result.current.i18n.changeLanguage).toBeDefined();
    });

    it('should allow language changes through i18n instance', async () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      
      await act(async () => {
        await result.current.i18n.changeLanguage('zh-TW');
      });

      await waitFor(() => {
        expect(result.current.language).toBe('zh-TW');
      });
    });
  });
});
