# Quick Test Reference Card

## 🚀 Quick Start

```typescript
// 1. Import utilities
import { renderWithProviders, screen } from '../../../test/testUtils';
import { translations } from '../../../test/i18nTestHelper';

// 2. Render component
renderWithProviders(
  <MyComponent />,
  { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
);

// 3. Make assertions
expect(screen.getByText(translations['navigation.schedule'])).toBeInTheDocument();
```

## 📦 Common Imports

```typescript
// Test utilities (includes routing)
import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/testUtils';

// Translation helpers
import { translations, getTranslation } from '../../../test/i18nTestHelper';

// Vitest
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

## 🎯 Common Patterns

### Pattern 1: Basic Component Test
```typescript
it('renders component', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Pattern 2: Component with Routing
```typescript
it('renders with routing', () => {
  renderWithProviders(
    <MyComponent />,
    { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
  );
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

### Pattern 3: Component with Translations
```typescript
it('renders translated text', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText(translations['navigation.schedule'])).toBeInTheDocument();
});
```

### Pattern 4: Component with User Interaction
```typescript
it('handles click', () => {
  const handleClick = vi.fn();
  renderWithProviders(<MyComponent onClick={handleClick} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

### Pattern 5: Async Component
```typescript
it('loads data', async () => {
  renderWithProviders(<MyComponent />);
  
  expect(screen.getByText(translations['status.loading'])).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByText(translations['status.loading'])).not.toBeInTheDocument();
  });
});
```

## 🔑 Available Translations

### Navigation
```typescript
translations['navigation.schedule']   // 'Schedule'
translations['navigation.booking']    // 'Booking'
translations['navigation.budget']     // 'Budget'
translations['navigation.shopping']   // 'Shopping'
translations['navigation.checklist']  // 'Checklist'
translations['navigation.members']    // 'Members'
translations['navigation.settings']   // 'Settings'
```

### Actions
```typescript
translations['actions.save']     // 'Save'
translations['actions.cancel']   // 'Cancel'
translations['actions.delete']   // 'Delete'
translations['actions.edit']     // 'Edit'
translations['actions.add']      // 'Add'
```

### Status
```typescript
translations['status.loading']   // 'Loading...'
translations['status.saving']    // 'Saving...'
translations['status.saved']     // 'Saved'
translations['status.error']     // 'Error'
```

## 🛠️ Common Assertions

### Text Content
```typescript
expect(screen.getByText('Hello')).toBeInTheDocument();
expect(screen.getByText(/hello/i)).toBeInTheDocument(); // Case insensitive
expect(screen.queryByText('Hello')).not.toBeInTheDocument();
```

### Aria Labels
```typescript
expect(screen.getByLabelText('Schedule')).toBeInTheDocument();
expect(screen.getByLabelText(translations['navigation.schedule'])).toBeInTheDocument();
```

### Roles
```typescript
expect(screen.getByRole('button')).toBeInTheDocument();
expect(screen.getByRole('navigation')).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
```

### Attributes
```typescript
expect(element).toHaveAttribute('aria-current', 'page');
expect(element).toHaveAttribute('disabled');
```

### Styles
```typescript
expect(element).toHaveStyle({ width: '80px' });
expect(element).toHaveStyle({ backgroundColor: 'white' });
```

### Visibility
```typescript
expect(element).toBeVisible();
expect(element).not.toBeVisible();
```

## 🎭 Mocking

### Mock Function
```typescript
const mockFn = vi.fn();
mockFn('arg');
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenCalledTimes(1);
```

### Mock Module
```typescript
vi.mock('../myModule', () => ({
  myFunction: vi.fn().mockReturnValue('mocked'),
}));
```

### Mock API Call
```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

## 🏃 Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- SideNavigation.test.tsx --run

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Helper script
./scripts/update-tests.sh failures
./scripts/update-tests.sh run SideNavigation.test.tsx
```

## 📝 Test Structure

```typescript
describe('MyComponent', () => {
  // Setup
  beforeEach(() => {
    // Runs before each test
  });

  afterEach(() => {
    // Runs after each test
  });

  // Test cases
  it('does something', () => {
    // Arrange
    renderWithProviders(<MyComponent />);
    
    // Act
    fireEvent.click(screen.getByRole('button'));
    
    // Assert
    expect(screen.getByText('Result')).toBeInTheDocument();
  });

  it('does something else', () => {
    // ...
  });
});
```

## 🐛 Common Issues

### Issue: "Cannot find element with text"
```typescript
// ❌ Wrong - looking for English text
expect(screen.getByText('Schedule')).toBeInTheDocument();

// ✅ Right - use translation
expect(screen.getByText(translations['navigation.schedule'])).toBeInTheDocument();
```

### Issue: "Router context missing"
```typescript
// ❌ Wrong - no router
render(<MyComponent />);

// ✅ Right - with router
renderWithProviders(<MyComponent />, { useMemoryRouter: true });
```

### Issue: "CSS class not found"
```typescript
// ❌ Wrong - component uses inline styles
expect(element).toHaveClass('custom-class');

// ✅ Right - test inline styles
expect(element).toHaveStyle({ width: '80px' });
```

## 📚 More Info

- Full guide: `I18N_TEST_SOLUTION_COMPLETE.md`
- Update guide: `TEST_UPDATE_GUIDE.md`
- Analysis: `TEST_FAILURES_ANALYSIS.md`
