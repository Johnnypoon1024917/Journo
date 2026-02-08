// Export the i18n configuration
export { default as i18n } from './config';

// Export formatting utilities
export {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatDuration,
  getDateFormatPatterns,
  getDecimalSeparator,
  getThousandsSeparator,
  parseLocalizedNumber,
  getDateLocale,
} from './formatters';

// Export the formatters hook
export { useFormatters } from './useFormatters';

// Export types
export type { } from './i18n.d';
