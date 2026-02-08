# Internationalization (i18n) Guide

This project uses `react-i18next` for internationalization with support for English, Traditional Chinese (繁體中文), Simplified Chinese (简体中文), and Japanese (日本語).

## Quick Start

### Using translations in components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common'); // Load 'common' namespace
  
  return (
    <div>
      <h1>{t('appName')}</h1>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### Using multiple namespaces

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['common', 'trip']);
  
  return (
    <div>
      <button>{t('common:actions.save')}</button>
      <h2>{t('trip:createTrip')}</h2>
    </div>
  );
}
```

### Using the custom useI18n hook

For locale-aware formatting, use the custom `useI18n` hook:

```tsx
import { useI18n } from '../hooks/useI18n';

function MyComponent() {
  const { t, formatDate, formatCurrency, formatDistance } = useI18n();
  
  return (
    <div>
      <p>{formatDate(new Date())}</p>
      <p>{formatCurrency(1000, 'USD')}</p>
      <p>{formatDistance(5000)}</p>
    </div>
  );
}
```

## Available Namespaces

- **common**: General UI elements (buttons, navigation, status messages)
- **trip**: Trip-related content
- **place**: Place/location-related content
- **budget**: Budget tracking features
- **packing**: Packing list features
- **community**: Community feed features
- **settings**: Settings page content
- **errors**: Error messages and validation

## Translation Keys

### Common namespace

```typescript
t('common:appName')              // "Journo"
t('common:navigation.home')      // "Home"
t('common:actions.save')         // "Save"
t('common:status.loading')       // "Loading..."
t('common:time.today')           // "Today"
```

### Trip namespace

```typescript
t('trip:createTrip')             // "Create Trip"
t('trip:fields.title')           // "Title"
t('trip:themes.adventure')       // "Adventure"
t('trip:stats.days', { count: 5 })  // "5 days"
```

### Pluralization

The system automatically handles pluralization:

```typescript
t('trip:stats.days', { count: 1 })   // "1 day"
t('trip:stats.days', { count: 5 })   // "5 days"
```

### Interpolation

Pass variables to translations:

```typescript
t('budget:warnings.exceeded', { amount: '$100' })
// "You've exceeded your budget by $100"

t('packing:progress', { checked: 10, total: 20 })
// "10 of 20 items packed"
```

## Locale-Aware Formatting

### Date Formatting

```typescript
import { useI18n } from '../hooks/useI18n';

const { formatDate, formatDateTime, formatTime } = useI18n();

formatDate(new Date())                    // "Nov 13, 2025" (en) / "2025年11月13日" (zh)
formatDateTime(new Date())                // "Nov 13, 2025, 3:00 PM"
formatTime(new Date())                    // "3:00 PM"
formatRelativeTime(yesterday)             // "1 day ago"
formatTimeAgo(yesterday)                  // "yesterday at 3:00 PM"
```

### Number and Currency Formatting

```typescript
const { formatNumber, formatCurrency, formatPercent } = useI18n();

formatNumber(1234567.89)                  // "1,234,567.89" (en) / "1,234,567.89" (zh)
formatCurrency(1000, 'USD')               // "$1,000" (en) / "US$1,000" (zh)
formatPercent(75)                         // "75%"
```

### Distance and Duration

```typescript
const { formatDistance, formatDuration } = useI18n();

formatDistance(1500)                      // "1.5km" (zh) / "0.9mi" (en)
formatDuration(90)                        // "1h 30m" (en) / "1小时30分钟" (zh)
```

## Language Detection

The system automatically detects the user's language preference:

1. **Saved preference**: Checks localStorage for previously saved language
2. **Browser language**: Detects browser language and maps to supported languages
   - `zh-TW`, `zh-HK`, `zh-Hant` → Traditional Chinese
   - `zh-CN`, `zh-Hans`, `zh` → Simplified Chinese
   - `ja`, `ja-JP` → Japanese
   - Others → English (default)
3. **Manual selection**: Users can change language in Settings

## Adding New Translations

### 1. Add to English translation file

Edit `src/locales/en/[namespace].json`:

```json
{
  "myNewKey": "My new translation",
  "nested": {
    "key": "Nested value"
  }
}
```

### 2. Add to Chinese translation files

Edit `src/locales/zh-TW/[namespace].json` and `src/locales/zh-CN/[namespace].json`:

```json
{
  "myNewKey": "我的新翻譯",
  "nested": {
    "key": "嵌套值"
  }
}
```

### 3. Use in components

```tsx
const { t } = useTranslation('namespace');
<div>{t('myNewKey')}</div>
```

## Type Safety

TypeScript types are automatically generated from English translation files. You'll get autocomplete and type checking for translation keys:

```tsx
// ✅ Valid - autocomplete works
t('common:actions.save')

// ❌ Invalid - TypeScript error
t('common:actions.invalid')
```

## Best Practices

1. **Use namespaces**: Organize translations by feature/domain
2. **Keep keys descriptive**: Use clear, hierarchical key names
3. **Avoid hardcoded text**: Always use translation keys
4. **Test all languages**: Verify translations in all supported languages
5. **Use formatters**: Use locale-aware formatters for dates, numbers, etc.
6. **Preserve user content**: Don't translate user-generated content (trip titles, notes, etc.)

## Language Selector Component

The `LanguageSelector` component is available in Settings:

```tsx
import LanguageSelector from '../components/common/LanguageSelector';

<LanguageSelector />
```

## Troubleshooting

### Translations not loading

Make sure i18n is initialized in `App.tsx`:

```tsx
import './i18n/config';
```

### Missing translations

Check browser console for missing translation warnings. Add missing keys to translation files.

### Type errors

If TypeScript doesn't recognize translation keys, restart your TypeScript server or rebuild the project.

## Resources

- [react-i18next documentation](https://react.i18next.com/)
- [i18next documentation](https://www.i18next.com/)
- [date-fns locales](https://date-fns.org/docs/I18n)
