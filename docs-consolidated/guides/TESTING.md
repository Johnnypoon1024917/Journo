# Testing Guide

## Overview

Comprehensive testing strategy covering unit tests, integration tests, and end-to-end tests.

## Test Stack

### Frontend
- **Vitest**: Unit and integration tests
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Playwright**: E2E tests

### Backend
- **Jest**: Unit and integration tests
- **Supertest**: API testing
- **pg-mem**: In-memory database for tests

## Running Tests

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- StickerCanvas.test.tsx
```

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test suite
npm test -- auth.test.js
```

### E2E Tests

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in headed mode
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- tests/login.spec.ts
```

## Writing Tests

### Frontend Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Frontend Store Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });
  
  it('initializes with null user', () => {
    const { user } = useAuthStore.getState();
    expect(user).toBeNull();
  });
  
  it('sets user on login', async () => {
    const { login } = useAuthStore.getState();
    await login('test@example.com', 'password');
    
    const { user } = useAuthStore.getState();
    expect(user).not.toBeNull();
    expect(user?.email).toBe('test@example.com');
  });
});
```

### Backend API Test

```javascript
import request from 'supertest';
import app from '../app';
import { setupTestDb, teardownTestDb } from './helpers/db';

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  
  afterAll(async () => {
    await teardownTestDb();
  });
  
  describe('POST /auth/login', () => {
    it('returns token on valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
    });
    
    it('returns 401 on invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
```

### E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
  
  test('invalid credentials show error', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });
});
```

## Test Patterns

### Mocking API Calls

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/trips', (req, res, ctx) => {
    return res(ctx.json([
      { id: '1', name: 'Trip 1' },
      { id: '2', name: 'Trip 2' }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Testing Async Operations

```typescript
it('loads trips on mount', async () => {
  render(<TripList />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Trip 1')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
it('adds new trip on form submit', async () => {
  const user = userEvent.setup();
  render(<AddTripForm />);
  
  await user.type(screen.getByLabelText('Trip Name'), 'New Trip');
  await user.click(screen.getByRole('button', { name: 'Add Trip' }));
  
  await waitFor(() => {
    expect(screen.getByText('Trip added successfully')).toBeInTheDocument();
  });
});
```

## Test Coverage

### Coverage Goals

- Unit tests: 80%+ coverage
- Integration tests: Key user flows
- E2E tests: Critical paths

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Reports

- Lines: Percentage of code lines executed
- Branches: Percentage of conditional branches tested
- Functions: Percentage of functions called
- Statements: Percentage of statements executed

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Data

### Test Users

```javascript
export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin'
  },
  user: {
    email: 'test@example.com',
    password: 'Test123!',
    role: 'user'
  }
};
```

### Test Fixtures

```javascript
export const testTrips = [
  {
    id: '1',
    name: 'Tokyo Adventure',
    startDate: '2026-03-01',
    endDate: '2026-03-10',
    ownerId: 'user-1'
  }
];
```

## Debugging Tests

### Debug Single Test

```bash
# Frontend
npm test -- --reporter=verbose StickerCanvas.test.tsx

# Backend
npm test -- --verbose auth.test.js
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal"
}
```

## Best Practices

1. **Test behavior, not implementation**
2. **Keep tests isolated and independent**
3. **Use descriptive test names**
4. **Follow AAA pattern**: Arrange, Act, Assert
5. **Mock external dependencies**
6. **Test edge cases and error conditions**
7. **Keep tests fast**
8. **Maintain test data fixtures**
9. **Use test utilities and helpers**
10. **Review test coverage regularly**

## Common Issues

### Tests Timing Out

- Increase timeout: `test('...', async () => {}, 10000)`
- Check for unresolved promises
- Verify async operations complete

### Flaky Tests

- Avoid time-dependent tests
- Use `waitFor` for async operations
- Mock random/date functions
- Ensure proper cleanup

### Memory Leaks

- Clean up event listeners
- Clear timers and intervals
- Reset mocks between tests
- Close database connections

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
