import { useTranslation } from 'react-i18next';
import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatDuration,
  getDateFormatPatterns,
  parseLocalizedNumber,
} from './formatters';

/**
 * Hook that provides localized formatting functions
 * Uses the current i18n language automatically
 */
export function useFormatters() {
  const { i18n } = useTranslation();
  const language = i18n.language;

  return {
    /**
     * Format a date according to the current language
     * @param date - The date to format
     * @param formatStr - The format string (date-fns format)
     */
    formatDate: (date: Date | number, formatStr: string) => formatDate(date, formatStr, language),

    /**
     * Format a number according to the current language
     * @param value - The number to format
     * @param options - Intl.NumberFormatOptions
     */
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, language, options),

    /**
     * Format a currency value according to the current language
     * @param value - The amount to format
     * @param currency - The currency code (USD, TWD, CNY, JPY)
     */
    formatCurrency: (value: number, currency: string) => formatCurrency(value, currency, language),

    /**
     * Format a percentage according to the current language
     * @param value - The percentage value (0-100)
     * @param decimals - Number of decimal places (default: 0)
     */
    formatPercent: (value: number, decimals?: number) => formatPercent(value, language, decimals),

    /**
     * Format a relative time (e.g., "2 days ago", "in 3 hours")
     * @param date - The date to format
     */
    formatRelativeTime: (date: Date | number) => formatRelativeTime(date, language),

    /**
     * Format a duration in seconds to a human-readable string
     * @param seconds - The duration in seconds
     */
    formatDuration: (seconds: number) => formatDuration(seconds),

    /**
     * Parse a localized number string back to a number
     * @param value - The localized number string
     */
    parseNumber: (value: string) => parseLocalizedNumber(value, language),

    /**
     * Get common date format patterns for the current language
     */
    datePatterns: getDateFormatPatterns(language),

    /**
     * The current language code
     */
    language,
  };
}
