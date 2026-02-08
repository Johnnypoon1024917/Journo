import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ResponsiveLayout, ResponsiveGrid, ResponsiveStack, ResponsiveCard } from '../ResponsiveLayout';

describe('ResponsiveLayout', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ResponsiveLayout', () => {
    it('renders children correctly', () => {
      render(
        <ResponsiveLayout>
          <div>Test content</div>
        </ResponsiveLayout>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('applies base layout classes', () => {
      render(
        <ResponsiveLayout data-testid="layout">
          <div>Content</div>
        </ResponsiveLayout>
      );

      const layout = screen.getByTestId('layout');
      expect(layout).toHaveClass('mx-auto', 'w-full');
    });

    it('applies correct max-width classes', () => {
      render(
        <ResponsiveLayout maxWidth="tablet" data-testid="layout">
          <div>Content</div>
        </ResponsiveLayout>
      );

      const layout = screen.getByTestId('layout');
      expect(layout).toHaveClass('max-w-tablet');
    });

    it('applies safe area classes when enabled', () => {
      render(
        <ResponsiveLayout safeArea={true} data-testid="layout">
          <div>Content</div>
        </ResponsiveLayout>
      );

      const layout = screen.getByTestId('layout');
      expect(layout).toHaveClass('pt-safe', 'pb-safe', 'pl-safe', 'pr-safe');
    });

    it('does not apply safe area classes when disabled', () => {
      render(
        <ResponsiveLayout safeArea={false} data-testid="layout">
          <div>Content</div>
        </ResponsiveLayout>
      );

      const layout = screen.getByTestId('layout');
      expect(layout).not.toHaveClass('pt-safe', 'pb-safe', 'pl-safe', 'pr-safe');
    });

    it('applies padding classes', () => {
      render(
        <ResponsiveLayout padding="md" data-testid="layout">
          <div>Content</div>
        </ResponsiveLayout>
      );

      const layout = screen.getByTestId('layout');
      // Should have some padding class (responsive behavior tested in useResponsive hook tests)
      expect(layout.className).toMatch(/px-\d+/);
    });

    it('applies no padding when padding is none', () => {
      render(
        <ResponsiveLayout padding="none" data-testid="layout">
          <div>Content</div>
        </ResponsiveLayout>
      );

      const layout = screen.getByTestId('layout');
      expect(layout.className).not.toMatch(/px-\d+/);
    });
  });

  describe('ResponsiveGrid', () => {
    it('renders grid with correct classes', () => {
      render(
        <ResponsiveGrid data-testid="grid">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1'); // Default mobile columns
    });

    it('applies correct gap classes', () => {
      render(
        <ResponsiveGrid gap="lg" data-testid="grid">
          <div>Item 1</div>
        </ResponsiveGrid>
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('gap-4', 'sm:gap-6', 'lg:gap-8');
    });

    it('applies responsive column classes', () => {
      render(
        <ResponsiveGrid 
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
          data-testid="grid"
        >
          <div>Item 1</div>
        </ResponsiveGrid>
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('applies min item width when specified', () => {
      render(
        <ResponsiveGrid 
          minItemWidth="200px"
          data-testid="grid"
        >
          <div>Item 1</div>
        </ResponsiveGrid>
      );

      const grid = screen.getByTestId('grid');
      expect(grid.className).toContain('grid-cols-[repeat(auto-fit,minmax(200px,1fr))]');
    });
  });

  describe('ResponsiveStack', () => {
    it('renders vertical stack by default', () => {
      render(
        <ResponsiveStack data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveStack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('flex', 'flex-col');
    });

    it('renders horizontal stack when specified', () => {
      render(
        <ResponsiveStack direction="horizontal" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveStack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('flex', 'flex-row');
    });

    it('renders responsive stack with breakpoint classes', () => {
      render(
        <ResponsiveStack direction="responsive" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveStack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('flex-col', 'md:flex-row');
    });

    it('applies correct alignment classes', () => {
      render(
        <ResponsiveStack align="center" justify="between" data-testid="stack">
          <div>Item 1</div>
        </ResponsiveStack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('items-center', 'justify-between');
    });

    it('applies wrap class when enabled', () => {
      render(
        <ResponsiveStack wrap={true} data-testid="stack">
          <div>Item 1</div>
        </ResponsiveStack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('flex-wrap');
    });

    it('applies correct gap classes', () => {
      render(
        <ResponsiveStack gap="lg" data-testid="stack">
          <div>Item 1</div>
        </ResponsiveStack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('gap-6');
    });
  });

  describe('ResponsiveCard', () => {
    it('renders card with base classes', () => {
      render(
        <ResponsiveCard data-testid="card">
          <div>Card content</div>
        </ResponsiveCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white', 'dark:bg-gray-800');
    });

    it('applies padding classes', () => {
      render(
        <ResponsiveCard padding="md" data-testid="card">
          <div>Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByTestId('card');
      // Should have some padding class (responsive behavior tested in useResponsive hook tests)
      expect(card.className).toMatch(/p-\d+/);
    });

    it('applies shadow classes', () => {
      render(
        <ResponsiveCard shadow="lg" data-testid="card">
          <div>Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-lg');
    });

    it('applies border classes when enabled', () => {
      render(
        <ResponsiveCard border={true} data-testid="card">
          <div>Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border', 'border-gray-200', 'dark:border-gray-700');
    });

    it('does not apply border classes when disabled', () => {
      render(
        <ResponsiveCard border={false} data-testid="card">
          <div>Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('border');
    });

    it('applies rounded corner classes', () => {
      render(
        <ResponsiveCard rounded="xl" data-testid="card">
          <div>Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-xl');
    });

    it('applies hover classes when enabled', () => {
      render(
        <ResponsiveCard hover={true} data-testid="card">
          <div>Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByTestId('card');
      // Hover behavior depends on device type, but classes should be present
      expect(card.className).toMatch(/(hover:shadow-lg|transition-shadow)/);
    });

    it('applies no shadow when shadow is none', () => {
      render(
        <ResponsiveCard shadow="none" data-testid="card">
          <div>Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByTestId('card');
      expect(card.className).not.toMatch(/shadow-/);
    });
  });
});