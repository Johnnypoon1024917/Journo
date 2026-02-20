/**
 * ParticleEffect Component Tests
 */

import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { ParticleEffect } from '../ParticleEffect';

// Mock matchMedia for reduced motion tests
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('ParticleEffect', () => {
  beforeEach(() => {
    // Reset matchMedia mock before each test
    mockMatchMedia(false);
  });

  describe('Rendering', () => {
    it('should render particle effect when enabled', () => {
      const { container } = render(<ParticleEffect type="particles" enabled={true} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render wave effect', () => {
      const { container } = render(<ParticleEffect type="waves" enabled={true} />);
      const waveContainer = container.querySelector('div[aria-hidden="true"]');
      expect(waveContainer).toBeInTheDocument();
    });

    it('should render bubble effect', () => {
      const { container } = render(<ParticleEffect type="bubbles" enabled={true} />);
      const bubbleContainer = container.querySelector('div[aria-hidden="true"]');
      expect(bubbleContainer).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      const { container } = render(<ParticleEffect type="particles" enabled={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should respect reduced motion preference', () => {
      mockMatchMedia(true); // User prefers reduced motion
      const { container } = render(<ParticleEffect type="particles" enabled={true} />);
      expect(container.firstChild).toBeNull();
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<ParticleEffect type="waves" enabled={true} />);
      const element = container.querySelector('[aria-hidden="true"]');
      expect(element).toBeInTheDocument();
    });

    it('should be pointer-events-none', () => {
      const { container } = render(<ParticleEffect type="particles" enabled={true} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveClass('pointer-events-none');
    });
  });

  describe('Density Settings', () => {
    it('should render with low density', () => {
      const { container } = render(
        <ParticleEffect type="bubbles" enabled={true} density="low" />
      );
      const bubbles = container.querySelectorAll('div[style*="animation"]');
      expect(bubbles.length).toBe(8);
    });

    it('should render with medium density', () => {
      const { container } = render(
        <ParticleEffect type="bubbles" enabled={true} density="medium" />
      );
      const bubbles = container.querySelectorAll('div[style*="animation"]');
      expect(bubbles.length).toBe(12);
    });

    it('should render with high density', () => {
      const { container } = render(
        <ParticleEffect type="bubbles" enabled={true} density="high" />
      );
      const bubbles = container.querySelectorAll('div[style*="animation"]');
      expect(bubbles.length).toBe(16);
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ParticleEffect type="particles" enabled={true} className="custom-class" />
      );
      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveClass('custom-class');
    });
  });

  describe('Performance', () => {
    it('should use requestAnimationFrame for particles', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      render(<ParticleEffect type="particles" enabled={true} />);
      
      // Wait for effect to initialize
      setTimeout(() => {
        expect(rafSpy).toHaveBeenCalled();
      }, 100);
    });

    it('should cleanup animation frame on unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      const { unmount } = render(<ParticleEffect type="particles" enabled={true} />);
      
      unmount();
      
      setTimeout(() => {
        expect(cancelSpy).toHaveBeenCalled();
      }, 100);
    });
  });
});
