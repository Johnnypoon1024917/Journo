import { format as dateFnsFormat } from 'date-fns';
import { enUS, zhTW, zhCN, ja } from 'date-fns/locale';

/**
 * Locale mapping for date-fns
 */
const localeMap = {
  en: enUS,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  ja: ja,
};

/**
 * Get the date-fns locale for the current language
 */
export function getDateLocale(language: string) {
  return localeMap[language as keyof typeof localeMap] || enUS;
}

/**
 * Format a date according to the user's language
 * @param date - The date to format
 * @param formatStr - The format string (date-fns format)
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 */
export function formatDate(date: Date | number, formatStr: string, language: string): string {
  const locale = getDateLocale(language);
  return dateFnsFormat(date, formatStr, { locale });
}

/**
 * Format a number according to the user's language
 * @param value - The number to format
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 * @param options - Intl.NumberFormatOptions
 */
export function formatNumber(
  value: number,
  language: string,
  options?: Intl.NumberFormatOptions
): string {
  // Map our language codes to BCP 47 language tags
  const localeMap: Record<string, string> = {
    en: 'en-US',
    'zh-TW': 'zh-TW',
    'zh-CN': 'zh-CN',
    ja: 'ja-JP',
  };

  const locale = localeMap[language] || 'en-US';
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a currency value according to the user's language
 * @param value - The amount to format
 * @param currency - The currency code (USD, TWD, CNY, JPY)
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 */
export function formatCurrency(value: number, currency: string, language: string): string {
  return formatNumber(value, language, {
    style: 'currency',
    currency: currency,
  });
}

/**
 * Format a percentage according to the user's language
 * @param value - The percentage value (0-100)
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 * @param decimals - Number of decimal places (default: 0)
 */
export function formatPercent(value: number, language: string, decimals: number = 0): string {
  return formatNumber(value / 100, language, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours")
 * @param date - The date to format
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 */
export function formatRelativeTime(date: Date | number, language: string): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    'zh-TW': 'zh-TW',
    'zh-CN': 'zh-CN',
    ja: 'ja-JP',
  };

  const locale = localeMap[language] || 'en-US';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const now = new Date();
  const targetDate = typeof date === 'number' ? new Date(date) : date;
  const diffInSeconds = Math.floor((targetDate.getTime() - now.getTime()) / 1000);

  // Determine the appropriate unit
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const { unit, seconds } of units) {
    const value = Math.floor(diffInSeconds / seconds);
    if (Math.abs(value) >= 1) {
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Get the decimal separator for a language
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 */
export function getDecimalSeparator(language: string): string {
  const formatted = formatNumber(1.1, language);
  return formatted.charAt(1); // The character between 1 and 1
}

/**
 * Get the thousands separator for a language
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 */
export function getThousandsSeparator(language: string): string {
  const formatted = formatNumber(1000, language);
  return formatted.charAt(1); // The character after the first digit
}

/**
 * Parse a localized number string back to a number
 * @param value - The localized number string
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 */
export function parseLocalizedNumber(value: string, language: string): number {
  const decimalSeparator = getDecimalSeparator(language);
  const thousandsSeparator = getThousandsSeparator(language);

  // Remove thousands separators and replace decimal separator with '.'
  const normalized = value
    .replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '')
    .replace(decimalSeparator, '.');

  return parseFloat(normalized);
}

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds - The duration in seconds
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
}

/**
 * Get common date format patterns for a language
 * @param language - The language code (en, zh-TW, zh-CN, ja)
 */
export function getDateFormatPatterns(language: string) {
  const patterns: Record<string, Record<string, string>> = {
    en: {
      short: 'MMM d',
      medium: 'MMM d, yyyy',
      long: 'MMMM d, yyyy',
      full: 'EEEE, MMMM d, yyyy',
      time: 'h:mm a',
      dateTime: 'MMM d, yyyy h:mm a',
    },
    'zh-TW': {
      short: 'M月d日',
      medium: 'yyyy年M月d日',
      long: 'yyyy年M月d日',
      full: 'yyyy年M月d日 EEEE',
      time: 'ah:mm',
      dateTime: 'yyyy年M月d日 ah:mm',
    },
    'zh-CN': {
      short: 'M月d日',
      medium: 'yyyy年M月d日',
      long: 'yyyy年M月d日',
      full: 'yyyy年M月d日 EEEE',
      time: 'ah:mm',
      dateTime: 'yyyy年M月d日 ah:mm',
    },
    ja: {
      short: 'M月d日',
      medium: 'yyyy年M月d日',
      long: 'yyyy年M月d日',
      full: 'yyyy年M月d日 EEEE',
      time: 'ah:mm',
      dateTime: 'yyyy年M月d日 ah:mm',
    },
  };

  return patterns[language] || patterns.en;
}
