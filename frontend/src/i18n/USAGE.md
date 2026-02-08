# Internationalization (i18n) Usage Guide

This guide explains how to use the internationalization features in the Journo application.

## Supported Languages

- **English** (`en`)
- **Traditional Chinese** (`zh-TW`)
- **Simplified Chinese** (`zh-CN`)
- **Japanese** (`ja`)

## Basic Usage

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common:appName')}</h1>
      <button>{t('common:actions.save')}</button>
      <p>{t('kawaii:navigation.schedule')}</p>
    </div>
  );
}
```

### Using Translations with Namespaces

```tsx
import { useTranslation } from 'react-i18next';

function ScheduleScreen() {
  // Specify the namespace
  const { t } = useTranslation('kawaii');

  return (
    <div>
      <h1>{t('schedule.title')}</h1>
      <button>{t('schedule.addActivity')}</button>
    </div>
  );
}
```

### Using Translations with Interpolation

```tsx
import { useTranslation } from 'react-i18next';

function CountdownTimer({ days, hours, minutes, seconds }) {
  const { t } = useTranslation('kawaii');

  return (
    <div>
      <span>{t('countdown.days', { count: days })}</span>
      <span>{t('countdown.hours', { count: hours })}</span>
      <span>{t('countdown.minutes', { count: minutes })}</span>
      <span>{t('countdown.seconds', { count: seconds })}</span>
    </div>
  );
}
```

### Changing Language

```tsx
import { useTranslation } from 'react-i18next';

function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <select value={i18n.language} onChange={(e) => changeLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="zh-TW">繁體中文</option>
      <option value="zh-CN">简体中文</option>
      <option value="ja">日本語</option>
    </select>
  );
}
```

## Date and Number Formatting

### Using the Formatters Hook

```tsx
import { useFormatters } from '@/i18n';

function TripDetails({ trip }) {
  const { formatDate, formatCurrency, formatPercent, datePatterns } = useFormatters();

  return (
    <div>
      {/* Format dates */}
      <p>Start: {formatDate(trip.startDate, datePatterns.medium)}</p>
      <p>End: {formatDate(trip.endDate, datePatterns.long)}</p>

      {/* Format currency */}
      <p>Budget: {formatCurrency(trip.budget, 'USD')}</p>

      {/* Format percentages */}
      <p>Progress: {formatPercent(trip.progress, 1)}</p>
    </div>
  );
}
```

### Date Formatting Examples

```tsx
import { useFormatters } from '@/i18n';

function DateExamples() {
  const { formatDate, datePatterns } = useFormatters();
  const date = new Date('2024-03-15');

  return (
    <div>
      {/* Short: "Mar 15" (en), "3月15日" (zh-TW, zh-CN, ja) */}
      <p>{formatDate(date, datePatterns.short)}</p>

      {/* Medium: "Mar 15, 2024" (en), "2024年3月15日" (zh-TW, zh-CN, ja) */}
      <p>{formatDate(date, datePatterns.medium)}</p>

      {/* Long: "March 15, 2024" (en), "2024年3月15日" (zh-TW, zh-CN, ja) */}
      <p>{formatDate(date, datePatterns.long)}</p>

      {/* Full: "Friday, March 15, 2024" (en), "2024年3月15日 星期五" (zh-TW, zh-CN, ja) */}
      <p>{formatDate(date, datePatterns.full)}</p>

      {/* Time: "3:30 PM" (en), "下午3:30" (zh-TW, zh-CN, ja) */}
      <p>{formatDate(date, datePatterns.time)}</p>
    </div>
  );
}
```

### Number Formatting Examples

```tsx
import { useFormatters } from '@/i18n';

function NumberExamples() {
  const { formatNumber, formatCurrency, formatPercent } = useFormatters();

  return (
    <div>
      {/* Format numbers with thousands separators */}
      <p>{formatNumber(1234567.89)}</p>
      {/* en: "1,234,567.89" */}
      {/* zh-TW, zh-CN, ja: "1,234,567.89" */}

      {/* Format currency */}
      <p>{formatCurrency(1234.56, 'USD')}</p>
      {/* en: "$1,234.56" */}
      <p>{formatCurrency(1234.56, 'TWD')}</p>
      {/* zh-TW: "NT$1,234.56" */}
      <p>{formatCurrency(1234.56, 'CNY')}</p>
      {/* zh-CN: "¥1,234.56" */}
      <p>{formatCurrency(1234.56, 'JPY')}</p>
      {/* ja: "¥1,235" (no decimals for JPY) */}

      {/* Format percentages */}
      <p>{formatPercent(75)}</p>
      {/* All languages: "75%" */}
      <p>{formatPercent(75.5, 1)}</p>
      {/* All languages: "75.5%" */}
    </div>
  );
}
```

### Relative Time Formatting

```tsx
import { useFormatters } from '@/i18n';

function RelativeTimeExamples() {
  const { formatRelativeTime } = useFormatters();
  const yesterday = new Date(Date.now() - 86400000);
  const tomorrow = new Date(Date.now() + 86400000);

  return (
    <div>
      {/* "yesterday" (en), "昨天" (zh-TW, zh-CN), "昨日" (ja) */}
      <p>{formatRelativeTime(yesterday)}</p>

      {/* "tomorrow" (en), "明天" (zh-TW, zh-CN), "明日" (ja) */}
      <p>{formatRelativeTime(tomorrow)}</p>

      {/* "2 days ago" (en), "2天前" (zh-TW, zh-CN), "2日前" (ja) */}
      <p>{formatRelativeTime(new Date(Date.now() - 172800000))}</p>
    </div>
  );
}
```

## Translation Namespaces

### Available Namespaces

- **common**: Common UI elements (buttons, actions, status messages)
- **trip**: Trip-related translations
- **place**: Place/location-related translations
- **budget**: Budget and expense tracking
- **packing**: Packing list translations
- **community**: Community feed translations
- **settings**: Settings screen translations
- **errors**: Error messages
- **kawaii**: Kawaii UI redesign translations (navigation, countdown, weather, etc.)

### Kawaii Namespace Structure

```typescript
// Navigation tabs
t('kawaii:navigation.schedule') // "Schedule" / "行程" / "スケジュール"
t('kawaii:navigation.booking') // "Booking" / "預約" / "予約"
t('kawaii:navigation.shopping') // "Shopping" / "購物" / "買い物"

// Countdown timer
t('kawaii:countdown.days', { count: 5 }) // "5 days" / "5 天" / "5 日"
t('kawaii:countdown.hours', { count: 3 }) // "3 hours" / "3 小時" / "3 時間"

// Weather
t('kawaii:weather.conditions.sunny') // "Sunny" / "晴天" / "晴れ"
t('kawaii:weather.conditions.rainy') // "Rainy" / "下雨" / "雨"

// Theme customization
t('kawaii:theme.colors.pink') // "Pink" / "粉紅" / "ピンク"
t('kawaii:theme.animationTypes.sakura') // "Sakura" / "櫻花" / "桜"

// Stickers
t('kawaii:stickers.categories.characters') // "Characters" / "角色" / "キャラクター"
t('kawaii:stickers.categories.food') // "Food" / "美食" / "食べ物"
```

## Best Practices

### 1. Always Use Translation Keys

❌ **Bad:**
```tsx
<button>Save</button>
```

✅ **Good:**
```tsx
<button>{t('common:actions.save')}</button>
```

### 2. Use Appropriate Namespaces

❌ **Bad:**
```tsx
const { t } = useTranslation();
return <h1>{t('kawaii:schedule.title')}</h1>;
```

✅ **Good:**
```tsx
const { t } = useTranslation('kawaii');
return <h1>{t('schedule.title')}</h1>;
```

### 3. Use Formatters for Dates and Numbers

❌ **Bad:**
```tsx
<p>{new Date().toLocaleDateString()}</p>
<p>${amount.toFixed(2)}</p>
```

✅ **Good:**
```tsx
const { formatDate, formatCurrency, datePatterns } = useFormatters();
return (
  <>
    <p>{formatDate(new Date(), datePatterns.medium)}</p>
    <p>{formatCurrency(amount, 'USD')}</p>
  </>
);
```

### 4. Handle Pluralization

❌ **Bad:**
```tsx
<p>{count} {count === 1 ? 'day' : 'days'}</p>
```

✅ **Good:**
```tsx
<p>{t('kawaii:countdown.days', { count })}</p>
```

### 5. Provide Context with Interpolation

```tsx
// Translation key: "shopping.stats": "{{bought}} bought, {{toBuy}} to buy"
<p>{t('kawaii:shopping.stats', { bought: 5, toBuy: 3 })}</p>
// Result: "5 bought, 3 to buy" / "已買 5 件，待買 3 件"
```

## Testing Translations

### Test Different Languages

```tsx
import { renderWithI18n } from '@/test-utils';

describe('MyComponent', () => {
  it('renders in English', () => {
    const { getByText } = renderWithI18n(<MyComponent />, { language: 'en' });
    expect(getByText('Schedule')).toBeInTheDocument();
  });

  it('renders in Traditional Chinese', () => {
    const { getByText } = renderWithI18n(<MyComponent />, { language: 'zh-TW' });
    expect(getByText('行程')).toBeInTheDocument();
  });

  it('renders in Japanese', () => {
    const { getByText } = renderWithI18n(<MyComponent />, { language: 'ja' });
    expect(getByText('スケジュール')).toBeInTheDocument();
  });
});
```

## Adding New Translations

### 1. Add to English (en/kawaii.json)

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my new feature"
  }
}
```

### 2. Add to All Other Languages

Repeat for `zh-TW/kawaii.json`, `zh-CN/kawaii.json`, and `ja/kawaii.json`.

### 3. Use in Components

```tsx
const { t } = useTranslation('kawaii');
return <h1>{t('myFeature.title')}</h1>;
```

## Language Detection

The app automatically detects the user's language in this order:

1. **localStorage**: Previously saved language preference
2. **Browser language**: Detected from `navigator.language`
3. **Fallback**: English (`en`)

The language preference is automatically saved to localStorage when changed.

## Performance Considerations

### Lazy Loading

Currently, all translations are loaded upfront. For future optimization, consider implementing lazy loading:

```tsx
// Future implementation
const loadNamespace = async (ns: string) => {
  const resources = await import(`./locales/${i18n.language}/${ns}.json`);
  i18n.addResourceBundle(i18n.language, ns, resources.default);
};
```

### Bundle Size

Each language bundle is approximately:
- English: ~8KB
- Traditional Chinese: ~10KB
- Simplified Chinese: ~10KB
- Japanese: ~12KB

Total i18n bundle size: ~40KB (gzipped: ~12KB)

## Troubleshooting

### Missing Translation Keys

If a translation key is missing, the key itself will be displayed:

```tsx
t('kawaii:nonexistent.key') // Returns: "nonexistent.key"
```

Check the browser console for warnings about missing keys.

### Wrong Language Displayed

1. Check localStorage: `localStorage.getItem('i18nextLng')`
2. Clear localStorage: `localStorage.removeItem('i18nextLng')`
3. Reload the page

### Date/Number Formatting Issues

Ensure you're using the `useFormatters` hook and not native JavaScript methods:

```tsx
// ❌ Don't use
new Date().toLocaleDateString()
number.toLocaleString()

// ✅ Use instead
const { formatDate, formatNumber } = useFormatters();
formatDate(new Date(), datePatterns.medium)
formatNumber(number)
```
