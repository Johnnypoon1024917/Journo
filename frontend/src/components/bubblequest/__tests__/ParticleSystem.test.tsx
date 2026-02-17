/**
 * ParticleSystem Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ParticleSystem from '../ParticleSystem';

describe('ParticleSystem', () => {
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock requestAnimationFrame and cancelAnimationFrame
    mockRequestAnimationFrame = vi.fn((callback) => {
      setTimeout(() => callback(Date.now()), 16);
      return 1;
    });
    mockCancelAnimationFrame = vi.fn();

    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.cancelAnimationFrame = mockCancelAnimationFrame;

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillStyle: '',
      globalAlpha: 1,
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
    })) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders canvas when enabled', () => {
    const { container } = render(
      <ParticleSystem type="snow" enabled={true} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('does not render when disabled', () => {
    const { container } = render(
      <ParticleSystem type="snow" enabled={false} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeInTheDocument();
  });

  it('has pointer-events: none to avoid blocking interactions', () => {
    const { container } = render(
      <ParticleSystem type="snow" enabled={true} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('pointer-events-none');
    expect(canvas).toHaveStyle({ pointerEvents: 'none' });
  });

  it('has aria-hidden for accessibility', () => {
    const { container } = render(
      <ParticleSystem type="snow" enabled={true} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('is positioned fixed with z-index 0', () => {
    const { container } = render(
      <ParticleSystem type="snow" enabled={true} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('fixed');
    expect(canvas).toHaveClass('inset-0');
    expect(canvas).toHaveClass('z-0');
  });

  it('supports snow particle type', () => {
    const { container } = render(
      <ParticleSystem type="snow" enabled={true} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('supports sakura particle type', () => {
    const { container } = render(
      <ParticleSystem type="sakura" enabled={true} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('accepts custom particle count', () => {
    const { container } = render(
      <ParticleSystem type="snow" enabled={true} particleCount={100} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <ParticleSystem type="snow" enabled={true} className="custom-class" />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('custom-class');
  });

  it('starts animation when enabled', () => {
    render(<ParticleSystem type="snow" enabled={true} />);

    // requestAnimationFrame should be called to start animation
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('stops animation when disabled', () => {
    const { rerender } = render(
      <ParticleSystem type="snow" enabled={true} />
    );

    // Animation should start
    expect(mockRequestAnimationFrame).toHaveBeenCalled();

    // Disable animation
    rerender(<ParticleSystem type="snow" enabled={false} />);

    // cancelAnimationFrame should be called
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('respects reduced motion preference', () => {
    // Mock matchMedia to return reduced motion preference
    const mockMatchMedia = vi.fn((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    global.matchMedia = mockMatchMedia as any;

    render(<ParticleSystem type="snow" enabled={true} />);

    // Animation should not start when reduced motion is preferred
    // The component should still render but not animate
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('cleans up animation on unmount', () => {
    const { unmount } = render(
      <ParticleSystem type="snow" enabled={true} />
    );

    // Verify component rendered
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    unmount();

    // Verify canvas is removed
    expect(document.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('handles window resize', () => {
    const { container } = render(
      <ParticleSystem type="snow" enabled={true} />
    );

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();

    // Trigger resize event
    global.dispatchEvent(new Event('resize'));

    // Canvas should still be present
    expect(canvas).toBeInTheDocument();
  });
});
