# Locale-Specific Formatting Implementation

## Overview

This document describes the locale-specific formatting implementation for the Journo application, which ensures that dates, times, and numbers are displayed according to the user's language preference.

**Validates Requirement 15.5**: Format dates, times, and numbers according to the user's locale

## Supported Locales

The application supports the following locales:
- **English (en)**: en-US format
- **Traditional Chinese (zh-TW)**: Taiwan format
- **Simplified Chinese (zh-CN)**: China format
- **Japanese (ja)**: Japan format

## Implementation

### Core Formatting Functions

The application provides two sets of formatting utilities:

1. **`frontend/src/i18n/formatters.ts`** - Original i18n formatters
2. **`frontend/src/utils/formatters.ts`** - Enhanced formatters with additional features

Both implementations use:
- **date-fns** for date/time formatting with locale support
- **Intl.NumberFormat** for number, currency, and percentage formatting
- **Intl.RelativeTimeFormat** for relative time formatting

### Available Formatters

#### Date and Time Formatting

```typescript
import { formatDate, formatDateTime, formatTime } from '@/utils/formatters';

// Format date according to locale
formatDate(new Date(), 'PPP', 'en');        // "March 15, 2024"
formatDate(new Date(), 'PPP', 'zh-TW');     // "2024年3月15日"
formatDate(new Date(), 'PPP', 'zh-CN');     // "2024年3月15日"
formatDate(new Date(), 'PPP', 'ja');        // "2024年3月15日"

// Format date and time
formatDateTime(new Date(), 'PPpp', 'en');   // "Mar 15, 2024, 2:30 PM"
formatDateTime(new Date(), 'PPpp', 'zh-TW'); // "2024年3月15日 下午2:30"

// Format time only
formatTime(new Date(), 'p', 'en');          // "2:30 PM"
formatTime(new Date(), 'p', 'zh-TW');       // "下午2:30"
```

#### Number Formatting

```typescript
import { formatNumber } from '@/utils/formatters';

// Format numbers with locale-specific separators
formatNumber(1234567.89, 'en');             // "1,234,567.89"
formatNumber(1234567.89, 'zh-TW');          // "1,234,567.89"
formatNumber(1234567.89, 'zh-CN');          // "1,234,567.89"
formatNumber(1234567.89, 'ja');             // "1,234,567.89"

// With custom options
formatNumber(1234.5, 'en', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});                                          // "1,234.50"
```

#### Currency Formatting

```typescript
import { formatCurrency } from '@/utils/formatters';

// Format currency with locale-specific symbols
formatCurrency(1234.56, 'USD', 'en');       // "$1,234.56"
formatCurrency(1234.56, 'TWD', 'zh-TW');    // "NT$1,235"
formatCurrency(1234.56, 'CNY', 'zh-CN');    // "¥1,234.56"
formatCurrency(1234.56, 'JPY', 'ja');       // "¥1,235" (no decimals)
```

#### Percentage Formatting

```typescript
import { formatPercent } from '@/utils/formatters';

// Format percentages
formatPercent(75.5, 'en', 1);               // "75.5%"
formatPercent(75.5, 'zh-TW', 1);            // "75.5%"
formatPercent(75.5, 'zh-CN', 1);            // "75.5%"
formatPercent(75.5, 'ja', 1);               // "75.5%"
```

#### Relative Time Formatting

```typescript
import { formatRelativeTime, formatTimeAgo } from '@/utils/formatters';

// Format relative time
formatRelativeTime(new Date(), new Date(), 'en');     // "0 seconds ago"
formatRelativeTime(pastDate, new Date(), 'zh-TW');    // "2天前"

// Format time ago
formatTimeAgo(pastDate, new Date(), 'en');            // "yesterday at 3:00 PM"
formatTimeAgo(pastDate, new Date(), 'zh-TW');         // "昨天 下午3:00"
```

#### Distance and Duration Formatting

```typescript
import { formatDistanceMetric, formatDuration } from '@/utils/formatters';

// Format distance (metric for Asian locales, imperial for English)
formatDistanceMetric(5000, 'en');           // "3.1mi"
formatDistanceMetric(5000, 'zh-TW');        // "5.0km"
formatDistanceMetric(5000, 'zh-CN');        // "5.0km"
formatDistanceMetric(5000, 'ja');           // "5.0km"

// Format duration
formatDuration(150, 'en');                  // "2h 30m"
formatDuration(150, 'zh-TW');               // "2小时30分钟"
formatDuration(150, 'zh-CN');               // "2小时30分钟"
formatDuration(150, 'ja');                  // "2時間30分"
```

### Using the useI18n Hook

The recommended way to use formatters in React components is through the `useI18n` hook, which automatically uses the current user's language:

```typescript
import { useI18n } from '@/hooks/useI18n';

function MyComponent() {
  const { formatDate, formatNumber, formatCurrency, language } = useI18n();

  return (
    <div>
      <p>Date: {formatDate(new Date())}</p>
      <p>Number: {formatNumber(1234567.89)}</p>
      <p>Price: {formatCurrency(1234.56, 'USD')}</p>
      <p>Current language: {language}</p>
    </div>
  );
}
```

### Using the useFormatters Hook

Alternatively, you can use the `useFormatters` hook from the i18n module:

```typescript
import { useFormatters } from '@/i18n/useFormatters';

function MyComponent() {
  const { formatDate, formatNumber, formatCurrency } = useFormatters();

  return (
    <div>
      <p>Date: {formatDate(new Date(), 'PPP')}</p>
      <p>Number: {formatNumber(1234567.89)}</p>
      <p>Price: {formatCurrency(1234.56, 'USD')}</p>
    </div>
  );
}
```

## Date Format Patterns

Each locale has predefined date format patterns:

### English (en)
- **short**: `MMM d` → "Mar 15"
- **medium**: `MMM d, yyyy` → "Mar 15, 2024"
- **long**: `MMMM d, yyyy` → "March 15, 2024"
- **full**: `EEEE, MMMM d, yyyy` → "Friday, March 15, 2024"
- **time**: `h:mm a` → "2:30 PM"
- **dateTime**: `MMM d, yyyy h:mm a` → "Mar 15, 2024 2:30 PM"

### Traditional Chinese (zh-TW)
- **short**: `M月d日` → "3月15日"
- **medium**: `yyyy年M月d日` → "2024年3月15日"
- **long**: `yyyy年M月d日` → "2024年3月15日"
- **full**: `yyyy年M月d日 EEEE` → "2024年3月15日 星期五"
- **time**: `ah:mm` → "下午2:30"
- **dateTime**: `yyyy年M月d日 ah:mm` → "2024年3月15日 下午2:30"

### Simplified Chinese (zh-CN)
- **short**: `M月d日` → "3月15日"
- **medium**: `yyyy年M月d日` → "2024年3月15日"
- **long**: `yyyy年M月d日` → "2024年3月15日"
- **full**: `yyyy年M月d日 EEEE` → "2024年3月15日 星期五"
- **time**: `ah:mm` → "下午2:30"
- **dateTime**: `yyyy年M月d日 ah:mm` → "2024年3月15日 下午2:30"

### Japanese (ja)
- **short**: `M月d日` → "3月15日"
- **medium**: `yyyy年M月d日` → "2024年3月15日"
- **long**: `yyyy年M月d日` → "2024年3月15日"
- **full**: `yyyy年M月d日 EEEE` → "2024年3月15日 金曜日"
- **time**: `ah:mm` → "午後2:30"
- **dateTime**: `yyyy年M月d日 ah:mm` → "2024年3月15日 午後2:30"

## Number Formatting Details

### Thousands Separator
All supported locales use comma (`,`) as the thousands separator:
- English: `1,234,567`
- Chinese: `1,234,567`
- Japanese: `1,234,567`

### Decimal Separator
All supported locales use period (`.`) as the decimal separator:
- English: `1,234.56`
- Chinese: `1,234.56`
- Japanese: `1,234.56`

### Currency Formatting
- **USD**: Uses `$` symbol
- **TWD**: Uses `NT$` prefix
- **CNY**: Uses `¥` symbol
- **JPY**: Uses `¥` symbol, no decimal places

## Migration Guide

### Replacing toLocaleDateString

**Before:**
```typescript
const date = new Date();
const formatted = date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
```

**After:**
```typescript
import { useI18n } from '@/hooks/useI18n';

const { formatDate } = useI18n();
const formatted = formatDate(date, 'PPP');
```

### Replacing toLocaleString for Numbers

**Before:**
```typescript
const number = 1234.56;
const formatted = number.toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
```

**After:**
```typescript
import { useI18n } from '@/hooks/useI18n';

const { formatNumber } = useI18n();
const formatted = formatNumber(number, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
```

### Replacing Currency Formatting

**Before:**
```typescript
const amount = 1234.56;
const formatted = `${currency} ${amount.toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;
```

**After:**
```typescript
import { useI18n } from '@/hooks/useI18n';

const { formatCurrency } = useI18n();
const formatted = formatCurrency(amount, currency);
```

## Testing

Comprehensive tests are available in:
- `frontend/src/i18n/__tests__/formatters.test.ts` - Unit tests for i18n formatters
- `frontend/src/utils/__tests__/formatters.test.ts` - Unit tests for utils formatters
- `frontend/src/i18n/__tests__/locale-formatting-integration.test.ts` - Integration tests
- `frontend/src/hooks/__tests__/useI18n.test.tsx` - Hook tests

Run tests with:
```bash
npm test -- src/i18n/__tests__/formatters.test.ts
npm test -- src/utils/__tests__/formatters.test.ts
npm test -- src/i18n/__tests__/locale-formatting-integration.test.ts
npm test -- src/hooks/__tests__/useI18n.test.tsx
```

## Best Practices

1. **Always use formatters instead of native JavaScript methods** like `toLocaleDateString`, `toLocaleString`, etc.

2. **Use the useI18n hook in React components** for automatic language detection:
   ```typescript
   const { formatDate, formatNumber, formatCurrency } = useI18n();
   ```

3. **Use consistent date format patterns** from `getDateFormatPatterns()` for consistency across the app.

4. **Test formatting in all supported locales** when adding new date/number displays.

5. **Avoid hardcoding date/number formats** - always use the provided formatters.

6. **Use appropriate currency codes** (USD, TWD, CNY, JPY) when formatting currency.

7. **Consider decimal places** - JPY typically doesn't use decimal places, while USD/TWD/CNY do.

## Implementation Status

✅ **Completed:**
- Date formatting with locale support (all 4 locales)
- Time formatting with locale support (all 4 locales)
- Number formatting with locale support (all 4 locales)
- Currency formatting with locale support (all 4 locales)
- Percentage formatting with locale support (all 4 locales)
- Relative time formatting with locale support (all 4 locales)
- Distance formatting with metric/imperial support
- Duration formatting with locale support
- Comprehensive test coverage (93 tests passing)
- Integration tests for cross-locale consistency
- React hooks for easy component integration

## Related Requirements

- **Requirement 15.1**: Support at least English, Japanese, Chinese (Simplified), and Chinese (Traditional) ✅
- **Requirement 15.2**: Detect device language and set app language accordingly ✅
- **Requirement 15.3**: Allow users to manually change app language in settings ✅
- **Requirement 15.4**: Translate all UI text, error messages, and notifications ✅
- **Requirement 15.5**: Format dates, times, and numbers according to user's locale ✅
- **Requirement 15.8**: Provide fallback to English for untranslated strings ✅
- **Requirement 15.9**: Update app language without requiring restart ✅

## Future Enhancements

- Add support for additional locales (Korean, Spanish, French, etc.)
- Implement locale-specific sorting and collation
- Add support for right-to-left (RTL) languages
- Implement locale-specific calendar systems
- Add support for locale-specific address formatting
