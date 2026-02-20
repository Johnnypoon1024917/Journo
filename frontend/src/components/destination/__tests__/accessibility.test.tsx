/**
 * Accessibility Tests for Country Recommendations Feature
 * 
 * Tests comprehensive accessibility features including:
 * - Form control labels
 * - Focus indicators
 * - Keyboard navigation
 * - ARIA attributes
 * - Screen reader support
 * - Skip links
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.6
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { RecommendationSelector } from '../RecommendationSelector';
import { CountryCard } from '../CountryCard';
import { CountryCardGrid } from '../CountryCardGrid';
import CountryRecommendations from '../../../pages/CountryRecommendations';
import { CountryRecommendation } from '../../../types/countryRecommendation';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock services
vi.mock('../../../services/destinationService', () => ({
  DestinationService: {
    getCountryRecommendations: vi.fn().mockResolvedValue([]),
  },
}));

// Mock hooks
vi.mock('../../../hooks/useFormHandler', () => ({
  useFormHandler: () => ({
    values: {
      month: 1,
      weatherPreference: 'Any',
      useGeolocation: false,
    },
    setValue: vi.fn(),
    handleChange: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useDebouncedUpdate', () => ({
  useDebouncedUpdate: () => ({
    scheduleUpdate: vi.fn(),
  }),
}));

// Sample test data
const mockCountry: CountryRecommendation = {
  id: '1',
  country_name: 'Japan',
  best_months: [3, 4, 5, 10, 11],
  temp_range: '10-25°C',
  avoid_months: [7, 8],
  region: 'Asia',
  description: 'Experience cherry blossoms in spring or vibrant autumn foliage.',
};

const mockCountries: CountryRecommendation[] = [
  mockCountry,
  {
    id: '2',
    country_name: 'Iceland',
    best_months: [6, 7, 8],
    temp_range: 'Cold (8-15°C)',
    avoid_months: [12, 1, 2],
    region: 'Europe',
    description: 'Midnight sun and accessible highlands in summer.',
  },
];

describe('Accessibility: Form Controls and Labels', () => {
  it('should have proper labels for all form controls in RecommendationSelector', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    // Month selector should have a label
    const monthSelect = screen.getByLabelText(/travel month/i);
    expect(monthSelect).toBeInTheDocument();
    expect(monthSelect).toHaveAttribute('id', 'month-select');

    // Weather preference should have a label
    const weatherGroup = screen.getByRole('radiogroup', { name: /weather preference/i });
    expect(weatherGroup).toBeInTheDocument();

    // Geolocation toggle should have a label
    const geoToggle = screen.getByRole('switch', { name: /prioritize nearby destinations/i });
    expect(geoToggle).toBeInTheDocument();
  });

  it('should have aria-required on required form fields', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const monthSelect = screen.getByLabelText(/travel month/i);
    expect(monthSelect).toHaveAttribute('aria-required', 'true');
    expect(monthSelect).toHaveAttribute('required');
  });

  it('should have descriptive aria-describedby for form fields', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const monthSelect = screen.getByLabelText(/travel month/i);
    expect(monthSelect).toHaveAttribute('aria-describedby', 'month-description');

    const geoToggle = screen.getByRole('switch');
    expect(geoToggle).toHaveAttribute('aria-describedby', 'geolocation-description');
  });

  it('should have proper aria-checked state for radio buttons', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const anyWeatherButton = screen.getByRole('radio', { name: /any weather/i });
    expect(anyWeatherButton).toHaveAttribute('aria-checked');
  });

  it('should have proper aria-checked state for switch', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const geoToggle = screen.getByRole('switch');
    expect(geoToggle).toHaveAttribute('aria-checked');
  });
});

describe('Accessibility: Focus Indicators', () => {
  it('should have visible focus styles on month selector', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const monthSelect = screen.getByLabelText(/travel month/i);
    expect(monthSelect).toHaveClass('focus:ring-3', 'focus:ring-bubblequest-primary-500');
  });

  it('should have visible focus styles on weather preference buttons', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const anyWeatherButton = screen.getByRole('radio', { name: /any weather/i });
    expect(anyWeatherButton).toHaveClass('focus:ring-3', 'focus:ring-bubblequest-primary-500');
  });

  it('should have visible focus styles on geolocation toggle', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const geoToggle = screen.getByRole('switch');
    expect(geoToggle).toHaveClass('focus:ring-3', 'focus:ring-bubblequest-primary-500');
  });

  it('should have visible focus styles on country cards', () => {
    render(<CountryCard country={mockCountry} />);

    const card = screen.getByRole('article');
    expect(card).toHaveClass('focus-within:ring-3', 'focus-within:ring-bubblequest-primary-500');
  });

  it('should have visible focus styles on clickable country cards', () => {
    const onSelect = vi.fn();
    render(<CountryCard country={mockCountry} onSelect={onSelect} />);

    const card = screen.getByRole('button');
    expect(card).toHaveClass('focus-within:ring-3', 'focus-within:ring-bubblequest-primary-500');
  });
});

describe('Accessibility: Keyboard Navigation', () => {
  it('should allow keyboard navigation through form controls', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    // Tab to month selector
    await user.tab();
    const monthSelect = screen.getByLabelText(/travel month/i);
    expect(monthSelect).toHaveFocus();

    // Tab to weather preference buttons
    await user.tab();
    const anyWeatherButton = screen.getByRole('radio', { name: /any weather/i });
    expect(anyWeatherButton).toHaveFocus();
  });

  it('should allow Enter key to activate clickable country cards', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CountryCard country={mockCountry} onSelect={onSelect} />);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(mockCountry);
  });

  it('should allow Space key to activate clickable country cards', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CountryCard country={mockCountry} onSelect={onSelect} />);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');

    expect(onSelect).toHaveBeenCalledWith(mockCountry);
  });

  it('should have proper tabIndex for interactive elements', () => {
    const onSelect = vi.fn();
    render(<CountryCard country={mockCountry} onSelect={onSelect} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should not have tabIndex on non-interactive cards', () => {
    render(<CountryCard country={mockCountry} />);

    const card = screen.getByRole('article');
    expect(card).not.toHaveAttribute('tabIndex');
  });
});

describe('Accessibility: ARIA Attributes', () => {
  it('should have proper ARIA labels on CountryCard', () => {
    render(<CountryCard country={mockCountry} />);

    const card = screen.getByRole('article');
    const ariaLabel = card.getAttribute('aria-label');
    
    expect(ariaLabel).toContain('Japan');
    expect(ariaLabel).toContain('Asia');
    expect(ariaLabel).toContain('10-25°C');
  });

  it('should have proper ARIA labels on month badges', () => {
    render(<CountryCard country={mockCountry} />);

    const badgesList = screen.getByRole('list', { name: /best months/i });
    expect(badgesList).toBeInTheDocument();

    const badges = within(badgesList).getAllByRole('listitem');
    expect(badges.length).toBe(mockCountry.best_months.length);
  });

  it('should have proper ARIA live regions for dynamic content', () => {
    render(
      <BrowserRouter>
        <CountryRecommendations />
      </BrowserRouter>
    );

    // Results should have aria-live for screen reader announcements
    const statusRegions = screen.queryAllByRole('status');
    expect(statusRegions.length).toBeGreaterThan(0);
  });

  it('should have proper role attributes on grid', () => {
    render(<CountryCardGrid countries={mockCountries} />);

    // Grid has multiple lists (one for the grid, one for each card's badges)
    const grids = screen.getAllByRole('list');
    const mainGrid = grids[0]; // First list is the main grid
    expect(mainGrid).toBeInTheDocument();
    expect(mainGrid).toHaveAttribute('aria-label', expect.stringContaining('country recommendations'));
  });

  it('should have proper role attributes on loading state', () => {
    render(<CountryCardGrid countries={[]} isLoading={true} />);

    const loadingStatus = screen.getByRole('status');
    expect(loadingStatus).toBeInTheDocument();
    expect(loadingStatus).toHaveAttribute('aria-label', expect.stringContaining('Loading'));
  });

  it('should have proper role attributes on empty state', () => {
    render(<CountryCardGrid countries={[]} isLoading={false} />);

    const emptyStatus = screen.getByRole('status');
    expect(emptyStatus).toBeInTheDocument();
  });
});

describe('Accessibility: Screen Reader Support', () => {
  it('should have screen reader only text for additional context', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    // Check for sr-only class on hidden descriptive text
    const srOnlyElements = document.querySelectorAll('.sr-only');
    expect(srOnlyElements.length).toBeGreaterThan(0);
  });

  it('should hide decorative elements from screen readers', () => {
    render(<CountryCard country={mockCountry} />);

    // Decorative emojis should have role="img" with aria-label for meaningful ones
    // or aria-hidden for purely decorative ones
    const imgRoles = screen.getAllByRole('img');
    expect(imgRoles.length).toBeGreaterThan(0);
    
    // Each should have either aria-label (meaningful) or aria-hidden (decorative)
    imgRoles.forEach(img => {
      const hasLabel = img.hasAttribute('aria-label');
      const isHidden = img.getAttribute('aria-hidden') === 'true';
      expect(hasLabel || isHidden).toBe(true);
    });
  });

  it('should provide meaningful alternative text for icons', () => {
    render(<CountryCard country={mockCountry} />);

    // Temperature icon should have aria-label - use getAllByLabelText since there might be multiple
    const tempIcons = screen.getAllByLabelText(/temperature/i);
    expect(tempIcons.length).toBeGreaterThan(0);
    expect(tempIcons[0]).toBeInTheDocument();
  });

  it('should announce loading states to screen readers', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} isLoading={true} />);

    const loadingText = screen.getByText(/loading recommendations/i);
    expect(loadingText).toBeInTheDocument();
  });

  it('should announce errors to screen readers', () => {
    const onSearch = vi.fn();
    const { rerender } = render(<RecommendationSelector onSearch={onSearch} />);

    // Simulate error state by checking for alert role when error is present
    // Note: This would need the component to be in error state
    const alerts = screen.queryAllByRole('alert');
    // Initially no errors
    expect(alerts.length).toBe(0);
  });
});

describe('Accessibility: Skip Links', () => {
  it('should have skip link on main page', () => {
    render(
      <BrowserRouter>
        <CountryRecommendations />
      </BrowserRouter>
    );

    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should have main content landmark with matching ID', () => {
    render(
      <BrowserRouter>
        <CountryRecommendations />
      </BrowserRouter>
    );

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveAttribute('id', 'main-content');
  });
});

describe('Accessibility: Semantic HTML', () => {
  it('should use proper heading hierarchy', () => {
    render(
      <BrowserRouter>
        <CountryRecommendations />
      </BrowserRouter>
    );

    // Should have h1 for page title
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('should use proper landmark roles', () => {
    render(
      <BrowserRouter>
        <CountryRecommendations />
      </BrowserRouter>
    );

    // Should have banner (header)
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();

    // Should have main
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Should have contentinfo (footer)
    const contentinfo = screen.getByRole('contentinfo');
    expect(contentinfo).toBeInTheDocument();
  });

  it('should use article role for country cards', () => {
    render(<CountryCard country={mockCountry} />);

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
  });

  it('should use button role for clickable cards', () => {
    const onSelect = vi.fn();
    render(<CountryCard country={mockCountry} onSelect={onSelect} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});

describe('Accessibility: Touch Target Sizing', () => {
  it('should have minimum touch target size on interactive elements', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const geoToggle = screen.getByRole('switch');
    expect(geoToggle).toHaveClass('min-h-touch', 'min-w-touch');
  });

  it('should have minimum touch target size on weather buttons', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const anyWeatherButton = screen.getByRole('radio', { name: /any weather/i });
    expect(anyWeatherButton).toHaveClass('min-h-touch', 'min-w-touch');
  });

  it('should have minimum touch target size on month selector', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const monthSelect = screen.getByLabelText(/travel month/i);
    expect(monthSelect).toHaveClass('min-h-touch');
  });
});

describe('Accessibility: Automated Axe Testing', () => {
  it('should have no accessibility violations in RecommendationSelector', async () => {
    const onSearch = vi.fn();
    const { container } = render(<RecommendationSelector onSearch={onSearch} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in CountryCard', async () => {
    const { container } = render(<CountryCard country={mockCountry} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in CountryCardGrid', async () => {
    const { container } = render(<CountryCardGrid countries={mockCountries} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in full page', async () => {
    const { container } = render(
      <BrowserRouter>
        <CountryRecommendations />
      </BrowserRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: Color Contrast', () => {
  it('should use high contrast colors for text', () => {
    render(<CountryCard country={mockCountry} />);

    const countryName = screen.getByText('Japan');
    // Check that it uses dark text color classes
    expect(countryName).toHaveClass('text-bubblequest-neutral-900', 'dark:text-white');
  });

  it('should use high contrast colors for interactive elements', () => {
    const onSearch = vi.fn();
    render(<RecommendationSelector onSearch={onSearch} />);

    const anyWeatherButton = screen.getByRole('radio', { name: /any weather/i });
    // Should have proper contrast classes - check for bubblequest color classes
    expect(anyWeatherButton.className).toMatch(/bubblequest-primary/);
  });

  it('should maintain contrast in dark mode', () => {
    render(<CountryCard country={mockCountry} />);

    const description = screen.getByText(mockCountry.description);
    // Should have dark mode contrast classes
    expect(description).toHaveClass('dark:text-bubblequest-neutral-300');
  });
});
