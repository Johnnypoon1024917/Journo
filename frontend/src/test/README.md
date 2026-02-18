# Test Utilities

This folder contains test utilities and setup files used across the test suite.

## Files

- `setup.ts` - Test environment setup and configuration
- `testUtils.tsx` - Common test utilities and helpers
- `i18nTestHelper.tsx` - Internationalization test helpers

## Usage

Import these utilities in your test files:

```typescript
import { render, screen } from '../test/testUtils';
import { setupI18n } from '../test/i18nTestHelper';
```

## Note

Actual test files (`.test.tsx`, `.test.ts`) should be placed in:
- `src/__tests__/` for top-level integration tests
- Component-specific `__tests__/` folders for unit tests (e.g., `src/hooks/__tests__/`)
