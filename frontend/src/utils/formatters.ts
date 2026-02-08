import { format, formatDistance as dateFnsFormatDistance, formatRelative } from 'date-fns';
import { enUS, zhCN, zhTW, ja, Locale } from 'date-fns/locale';

// Map i18n language codes to date-fns locales
const localeMap: Record<string, Locale> = {
  'en': enUS,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'ja': ja,
};

/**
 * Get date-fns locale for current language
 */
export function getDateLocale(language: string): Locale {
  return localeMap[language] || enUS;
}

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string = 'PPP',
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: getDateLocale(language) });
}

/**
 * Format date and time according to locale
 */
export function formatDateTime(
  date: Date | string | number,
  formatStr: string = 'PPpp',
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: getDateLocale(language) });
}

/**
 * Format time according to locale
 */
export function formatTime(
  date: Date | string | number,
  formatStr: string = 'p',
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: getDateLocale(language) });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  baseDate: Date = new Date(),
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return dateFnsFormatDistance(dateObj, baseDate, {
    addSuffix: true,
    locale: getDateLocale(language),
  });
}

/**
 * Format time ago (e.g., "yesterday at 3:00 PM")
 */
export function formatTimeAgo(
  date: Date | string | number,
  baseDate: Date = new Date(),
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatRelative(dateObj, baseDate, { locale: getDateLocale(language) });
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  language: string = 'en'
): string {
  // Map language codes to locale strings for Intl
  const localeString = 
    language === 'zh-TW' ? 'zh-TW' : 
    language === 'zh-CN' ? 'zh-CN' : 
    language === 'ja' ? 'ja-JP' : 
    'en-US';
  
  return new Intl.NumberFormat(localeString, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number according to locale
 */
export function formatNumber(
  value: number,
  language: string = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const localeString = 
    language === 'zh-TW' ? 'zh-TW' : 
    language === 'zh-CN' ? 'zh-CN' : 
    language === 'ja' ? 'ja-JP' : 
    'en-US';
  
  return new Intl.NumberFormat(localeString, options).format(value);
}

/**
 * Format percentage according to locale
 */
export function formatPercent(
  value: number,
  language: string = 'en',
  decimals: number = 0
): string {
  const localeString = 
    language === 'zh-TW' ? 'zh-TW' : 
    language === 'zh-CN' ? 'zh-CN' : 
    language === 'ja' ? 'ja-JP' : 
    'en-US';
  
  return new Intl.NumberFormat(localeString, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format distance (meters/kilometers or feet/miles based on locale)
 */
export function formatDistanceMetric(
  meters: number,
  language: string = 'en'
): string {
  // Use metric for Chinese and Japanese locales, imperial for English
  const useMetric = language.startsWith('zh') || language.startsWith('ja');
  
  if (useMetric) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  } else {
    const feet = meters * 3.28084;
    if (feet < 5280) {
      return `${Math.round(feet)}ft`;
    }
    const miles = feet / 5280;
    return `${miles.toFixed(1)}mi`;
  }
}

/**
 * Format duration in minutes to human-readable format
 */
export function formatDuration(
  minutes: number,
  language: string = 'en'
): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (language.startsWith('zh')) {
    if (hours > 0 && mins > 0) {
      return `${hours}小时${mins}分钟`;
    } else if (hours > 0) {
      return `${hours}小时`;
    } else {
      return `${mins}分钟`;
    }
  } else if (language.startsWith('ja')) {
    if (hours > 0 && mins > 0) {
      return `${hours}時間${mins}分`;
    } else if (hours > 0) {
      return `${hours}時間`;
    } else {
      return `${mins}分`;
    }
  } else {
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  }
}
