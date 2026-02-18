/**
 * Date Formatter Utility
 * 
 * Locale-aware date formatting using Intl.DateTimeFormat
 * Supports multiple locales and formats (DD/MM/YYYY, MM/DD/YYYY, etc.)
 */

export interface DateFormatOptions {
  locale?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  includeTime?: boolean;
  includeWeekday?: boolean;
  includeYear?: boolean;
}

/**
 * Format date using user's locale
 */
export function formatDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const {
    locale = getUserLocale(),
    dateStyle = 'medium',
    timeStyle,
    includeTime = false,
    includeWeekday = false,
    includeYear = true,
  } = options;

  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  // Build Intl.DateTimeFormat options
  const intlOptions: Intl.DateTimeFormatOptions = {};

  if (dateStyle && !includeTime) {
    intlOptions.dateStyle = dateStyle;
  } else {
    // Custom format
    if (includeWeekday) {
      intlOptions.weekday = 'short';
    }
    intlOptions.day = 'numeric';
    intlOptions.month = 'short';
    if (includeYear) {
      intlOptions.year = 'numeric';
    }
    if (includeTime) {
      intlOptions.hour = 'numeric';
      intlOptions.minute = '2-digit';
    }
  }

  if (timeStyle && includeTime) {
    intlOptions.timeStyle = timeStyle;
  }

  return new Intl.DateTimeFormat(locale, intlOptions).format(dateObj);
}

/**
 * Format date range
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const {
    locale = getUserLocale(),
    dateStyle = 'medium',
  } = options;

  const start = typeof startDate === 'string' || typeof startDate === 'number'
    ? new Date(startDate)
    : startDate;

  const end = typeof endDate === 'string' || typeof endDate === 'number'
    ? new Date(endDate)
    : endDate;

  const intlOptions: Intl.DateTimeFormatOptions = {
    dateStyle,
  };

  return new Intl.DateTimeFormat(locale, intlOptions).formatRange(start, end);
}

/**
 * Format time only
 */
export function formatTime(
  date: Date | string | number,
  options: { locale?: string; timeStyle?: 'full' | 'long' | 'medium' | 'short' } = {}
): string {
  const {
    locale = getUserLocale(),
    timeStyle = 'short',
  } = options;

  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  return new Intl.DateTimeFormat(locale, { timeStyle }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  baseDate: Date = new Date(),
  options: { locale?: string; style?: 'long' | 'short' | 'narrow' } = {}
): string {
  const {
    locale = getUserLocale(),
    style = 'long',
  } = options;

  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const diffMs = dateObj.getTime() - baseDate.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { style, numeric: 'auto' });

  // Choose appropriate unit
  if (Math.abs(diffYear) >= 1) {
    return rtf.format(diffYear, 'year');
  } else if (Math.abs(diffMonth) >= 1) {
    return rtf.format(diffMonth, 'month');
  } else if (Math.abs(diffWeek) >= 1) {
    return rtf.format(diffWeek, 'week');
  } else if (Math.abs(diffDay) >= 1) {
    return rtf.format(diffDay, 'day');
  } else if (Math.abs(diffHour) >= 1) {
    return rtf.format(diffHour, 'hour');
  } else if (Math.abs(diffMin) >= 1) {
    return rtf.format(diffMin, 'minute');
  } else {
    return rtf.format(diffSec, 'second');
  }
}

/**
 * Get user's locale from browser
 */
export function getUserLocale(): string {
  if (typeof navigator === 'undefined') return 'en-US';
  
  return navigator.language || 'en-US';
}

/**
 * Get locale-specific date format pattern
 */
export function getLocaleDateFormat(locale?: string): string {
  const userLocale = locale || getUserLocale();
  
  // Create a sample date to determine format
  const sampleDate = new Date(2024, 0, 15); // Jan 15, 2024
  const formatted = new Intl.DateTimeFormat(userLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(sampleDate);

  // Determine format based on output
  if (formatted.startsWith('15')) {
    return 'DD/MM/YYYY'; // European format
  } else if (formatted.startsWith('01')) {
    return 'MM/DD/YYYY'; // US format
  } else if (formatted.startsWith('2024')) {
    return 'YYYY/MM/DD'; // Asian format
  }

  return 'MM/DD/YYYY'; // Default to US format
}

/**
 * Format trip date range with smart formatting
 */
export function formatTripDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  options: { locale?: string; includeYear?: boolean } = {}
): string {
  const {
    locale = getUserLocale(),
    includeYear = true,
  } = options;

  const start = typeof startDate === 'string' || typeof startDate === 'number'
    ? new Date(startDate)
    : startDate;

  const end = typeof endDate === 'string' || typeof endDate === 'number'
    ? new Date(endDate)
    : endDate;

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    // Same month: "Jan 15-20, 2024"
    const monthDay = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(start);

    const endDay = end.getDate();
    const year = includeYear ? `, ${end.getFullYear()}` : '';

    return `${monthDay}-${endDay}${year}`;
  } else if (sameYear) {
    // Same year: "Jan 15 - Feb 20, 2024"
    const startFormatted = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(start);

    const endFormatted = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(end);

    const year = includeYear ? `, ${end.getFullYear()}` : '';

    return `${startFormatted} - ${endFormatted}${year}`;
  } else {
    // Different years: "Dec 25, 2024 - Jan 5, 2025"
    return formatDateRange(start, end, { locale, dateStyle: 'medium' });
  }
}
