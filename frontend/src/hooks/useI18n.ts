import { useTranslation } from 'react-i18next';
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
} from '../utils/formatters';

/**
 * Custom hook that combines i18n translation with locale-aware formatting
 */
export function useI18n() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  return {
    t,
    i18n,
    language: currentLanguage,
    // Locale-aware formatters that automatically use current language
    formatDate: (date: Date | string | number, formatStr?: string) =>
      formatDate(date, formatStr, currentLanguage),
    formatDateTime: (date: Date | string | number, formatStr?: string) =>
      formatDateTime(date, formatStr, currentLanguage),
    formatTime: (date: Date | string | number, formatStr?: string) =>
      formatTime(date, formatStr, currentLanguage),
    formatRelativeTime: (date: Date | string | number, baseDate?: Date) =>
      formatRelativeTime(date, baseDate, currentLanguage),
    formatTimeAgo: (date: Date | string | number, baseDate?: Date) =>
      formatTimeAgo(date, baseDate, currentLanguage),
    formatCurrency: (amount: number, currencyCode?: string) =>
      formatCurrency(amount, currencyCode, currentLanguage),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, currentLanguage, options),
    formatPercent: (value: number, decimals?: number) =>
      formatPercent(value, currentLanguage, decimals),
    formatDistance: (meters: number) =>
      formatDistanceMetric(meters, currentLanguage),
    formatDuration: (minutes: number) =>
      formatDuration(minutes, currentLanguage),
  };
}
