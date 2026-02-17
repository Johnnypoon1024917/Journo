# Test Update Guide - i18n Integration

## Overview
This guide explains how to update tests to work with the new i18n integration. The test suite now includes comprehensive i18n mocking and utilities.

## What Was Fixed

### 1. Test Setup (`src/test/setup.ts`)
- Added comprehensive i18n mocking for `react-i18next`
- Added i18next mock
- Added language utils mock
- All mocks return translation keys by default for easy testing

### 2. i18n Test Helper (`src/test/i18nTestHelper.tsx`)
- Created `I18nTestProvider` component with real English translations
- Added `createTestI18n()` function for creating test i18n instances
- Added `withI18n()` helper for wrapping components
- Added `getTranslation()` helper for getting translated text
- Added `translations` object for common assertions
- **Fixed missing navigation translations in English kawaii.json**

### 3. Test Utils (`src/test/testUtils.tsx`)
- Created `renderWithProviders()` function that wraps components with all providers
- Created `AllProviders` component that includes Router + i18n
- Re-exported all testing-library utilities for convenience

### 4. Translation Files
- Added missing `navigation` section to `src/locales/en/kawaii.json`

## How to Update Your Tests

### Option 1: Use renderWithProviders (Recommended)

This is the easiest approach. Replace `render()` with `renderWithProviders()`:

```typescript
// Before
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const { container } = render(
  <BrowserRouter>
    <MyComponent />
  </BrowserRouter>
);

// After
import { renderWithProviders, screen } from '../../../test/testUtils';

const { container } = renderWithProviders(
  <MyComponent />,
  { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
);
```

### Option 2: Use I18nTestProvider Directly

If you need more control:

```typescript
import { render } from '@testing-library/react';
import { I18nTestProvider } from '../../../test/i18nTestHelper';
import { BrowserRouter } from 'react-router-dom';

render(
  <BrowserRouter>
    <I18nTestProvider>
      <MyComponent />
    </I18nTestProvider>
  </BrowserRouter>
);
```

### Option 3: Use Translation Keys (Simplest)

The default mock returns translation keys, so you can test against keys:

```typescript
// Component renders: t('navigation.schedule') -> 'navigation.schedule'
expect(screen.getByLabelText('navigation.schedule')).toBeInTheDocument();
```

## Common Test Patterns

### Testing Navigation Components

```typescript
import { renderWithProviders, screen } from '../../../test/testUtils';

describe('MyNavigationComponent', () => {
  it('renders navigation items', () => {
    renderWithProviders(
      <MyNavigationComponent />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    // Test with actual English text (using I18nTestProvider)
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    
    // Or test with aria-label
    expect(screen.getByLabelText('Schedule')).toBeInTheDocument();
  });
});
```

### Testing Components with Translations

```typescript
import { renderWithProviders, screen } from '../../../test/testUtils';

describe('MyComponent', () => {
  it('displays translated text', () => {
    renderWithProviders(<MyComponent />);

    // The component uses t('common.actions.save')
    // With I18nTestProvider, this renders as 'Save'
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});
```

### Testing Components with Interpolation

```typescript
import { renderWithProviders, screen } from '../../../test/testUtils';

describe('MyComponent', () => {
  it('displays interpolated text', () => {
    renderWithProviders(<MyComponent count={5} />);

    // Component uses: t('shopping.totalItems', { count: 5 })
    // Renders as: '5 item(s)'
    expect(screen.getByText('5 item(s)')).toBeInTheDocument();
  });
});
```

### Testing Without i18n (Simple Components)

If your component doesn't use i18n, you can still use the old approach:

```typescript
import { render, screen } from '@testing-library/react';

describe('SimpleComponent', () => {
  it('renders', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Fixing Common Test Failures

### 1. "Unable to find element with text"

**Problem:** Component uses translation keys, test looks for English text.

**Solution:** Use `renderWithProviders()` or test against translation keys:

```typescript
// Option A: Use renderWithProviders for real translations
renderWithProviders(<MyComponent />);
expect(screen.getByText('Schedule')).toBeInTheDocument();

// Option B: Test against translation key
render(<MyComponent />);
expect(screen.getByText('navigation.schedule')).toBeInTheDocument();
```

### 2. "Cannot find element with aria-label"

**Problem:** aria-label uses translated text.

**Solution:** Use `renderWithProviders()`:

```typescript
renderWithProviders(<MyComponent />);
expect(screen.getByLabelText('Schedule')).toBeInTheDocument();
```

### 3. CSS Class Assertions Failing

**Problem:** Components now use inline styles instead of CSS classes.

**Solution:** Test inline styles or functionality instead:

```typescript
// Before
expect(element).toHaveClass('custom-class');

// After - test inline styles
expect(element).toHaveStyle({ width: '80px' });

// Or - test functionality instead of styling
expect(element).toBeInTheDocument();
```

### 4. Router Context Missing

**Problem:** Component uses routing but test doesn't provide router.

**Solution:** Use `renderWithProviders()` with route options:

```typescript
renderWithProviders(
  <MyComponent />,
  { 
    initialRoute: '/trips/123/schedule',
    useMemoryRouter: true 
  }
);
```

## Translation Namespaces

Components use different namespaces for translations:

- `common` - Common actions, status messages
- `kawaii` - Navigation, UI components
- `trip` - Trip-related content
- `budget` - Budget features
- `shopping` - Shopping list
- `checklist` - Checklist/packing
- `members` - Member management
- `settings` - Settings page
- `errors` - Error messages
- `notifications` - Notification messages

## Available Translation Keys

### Navigation (kawaii namespace)
```typescript
t('navigation.schedule')   // 'Schedule'
t('navigation.booking')    // 'Booking'
t('navigation.budget')     // 'Budget'
t('navigation.shopping')   // 'Shopping'
t('navigation.checklist')  // 'Checklist'
t('navigation.members')    // 'Members'
t('navigation.settings')   // 'Settings'
```

### Common Actions (common namespace)
```typescript
t('actions.save')     // 'Save'
t('actions.cancel')   // 'Cancel'
t('actions.delete')   // 'Delete'
t('actions.edit')     // 'Edit'
t('actions.add')      // 'Add'
```

### Status Messages (common namespace)
```typescript
t('status.loading')   // 'Loading...'
t('status.saving')    // 'Saving...'
t('status.saved')     // 'Saved'
t('status.error')     // 'Error'
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- SideNavigation.test.tsx

# Run with coverage
npm test -- --coverage
```

## Example: Complete Test File Update

### Before
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });
});
```

### After
```typescript
import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '../../../test/testUtils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders', () => {
    renderWithProviders(
      <MyComponent />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );
    
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });
});
```

## Next Steps

1. Update remaining test files to use `renderWithProviders()`
2. Fix CSS class assertions (change to style checks or remove)
3. Update deprecated theme store tests
4. Fix service mocks to match current API

## Need Help?

- Check `src/test/testUtils.tsx` for available utilities
- Check `src/test/i18nTestHelper.tsx` for i18n helpers
- Look at `src/components/kawaii/__tests__/SideNavigation.test.tsx` for a complete example
- Check translation files in `src/locales/en/` for available keys
