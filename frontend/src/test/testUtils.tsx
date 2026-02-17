/**
 * Test Utilities
 * 
 * Provides common test wrappers and utilities for component testing.
 * This includes routing and other context providers.
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

/**
 * Wrapper that provides routing context for testing
 */
interface RouterProvidersProps {
  children: React.ReactNode;
  initialRoute?: string;
  useMemoryRouter?: boolean;
}

export const RouterProviders: React.FC<RouterProvidersProps> = ({ 
  children, 
  initialRoute = '/',
  useMemoryRouter = false,
}) => {
  const Router = useMemoryRouter ? MemoryRouter : BrowserRouter;
  const routerProps = useMemoryRouter ? { initialEntries: [initialRoute] } : {};

  return (
    <Router {...routerProps}>
      {children}
    </Router>
  );
};

/**
 * Custom render function that wraps components with routing
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  useMemoryRouter?: boolean;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialRoute, useMemoryRouter, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <RouterProviders initialRoute={initialRoute} useMemoryRouter={useMemoryRouter}>
        {children}
      </RouterProviders>
    ),
    ...renderOptions,
  });
};

/**
 * Wrapper for components that only need routing
 */
export const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

/**
 * Wrapper for components that need routing with specific initial route
 */
interface MemoryRouterWrapperProps {
  children: React.ReactNode;
  initialRoute?: string;
}

export const MemoryRouterWrapper: React.FC<MemoryRouterWrapperProps> = ({ 
  children, 
  initialRoute = '/' 
}) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    {children}
  </MemoryRouter>
);

/**
 * Re-export everything from testing library
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
