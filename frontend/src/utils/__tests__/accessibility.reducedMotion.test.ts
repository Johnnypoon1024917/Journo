import {
  prefersReducedMotion,
  getAnimationDuration,
  getTransitionDuration,
  createAccessibleTransition,
  createAccessibleAnimation,
} from '../accessibility';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Accessibility - Reduced Motion Utilities', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('prefersReducedMotion', () => {
    it('should return false when user does not prefer reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(prefersReducedMotion()).toBe(false);
    });

    it('should return true when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(prefersReducedMotion()).toBe(true);
    });

    it('should query the correct media feature', () => {
      prefersReducedMotion();

      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });

  describe('getAnimationDuration', () => {
    it('should return original duration when animations are enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(getAnimationDuration(300)).toBe(300);
      expect(getAnimationDuration(500)).toBe(500);
      expect(getAnimationDuration(1000)).toBe(1000);
    });

    it('should return 0 when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(getAnimationDuration(300)).toBe(0);
      expect(getAnimationDuration(500)).toBe(0);
      expect(getAnimationDuration(1000)).toBe(0);
    });

    it('should handle edge cases', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(getAnimationDuration(0)).toBe(0);
      expect(getAnimationDuration(1)).toBe(1);
      expect(getAnimationDuration(10000)).toBe(10000);
    });
  });

  describe('getTransitionDuration', () => {
    it('should return original duration when animations are enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(getTransitionDuration(200)).toBe(200);
      expect(getTransitionDuration(300)).toBe(300);
      expect(getTransitionDuration(500)).toBe(500);
    });

    it('should return 1ms when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
      });

      // Returns 1ms instead of 0 to ensure transitions still fire
      expect(getTransitionDuration(200)).toBe(1);
      expect(getTransitionDuration(300)).toBe(1);
      expect(getTransitionDuration(500)).toBe(1);
    });

    it('should handle edge cases', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(getTransitionDuration(0)).toBe(0);
      expect(getTransitionDuration(1)).toBe(1);
      expect(getTransitionDuration(10000)).toBe(10000);
    });
  });

  describe('createAccessibleTransition', () => {
    it('should create transition string with original duration when animations are enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(createAccessibleTransition('opacity', 200)).toBe('opacity 200ms ease');
      expect(createAccessibleTransition('transform', 300, 'ease-in-out')).toBe('transform 300ms ease-in-out');
      expect(createAccessibleTransition('all', 500, 'cubic-bezier(0.4, 0, 0.2, 1)')).toBe(
        'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
      );
    });

    it('should create transition string with 1ms duration when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(createAccessibleTransition('opacity', 200)).toBe('opacity 1ms ease');
      expect(createAccessibleTransition('transform', 300, 'ease-in-out')).toBe('transform 1ms ease-in-out');
      expect(createAccessibleTransition('all', 500, 'cubic-bezier(0.4, 0, 0.2, 1)')).toBe(
        'all 1ms cubic-bezier(0.4, 0, 0.2, 1)'
      );
    });

    it('should use default easing when not provided', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(createAccessibleTransition('opacity', 200)).toBe('opacity 200ms ease');
    });

    it('should handle multiple properties', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(createAccessibleTransition('opacity, transform', 200)).toBe('opacity, transform 200ms ease');
    });
  });

  describe('createAccessibleAnimation', () => {
    it('should create animation string with original duration when animations are enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(createAccessibleAnimation('fadeIn', 300)).toBe('fadeIn 300ms ease forwards');
      expect(createAccessibleAnimation('slideUp', 500, 'ease-in-out')).toBe('slideUp 500ms ease-in-out forwards');
      expect(createAccessibleAnimation('bounce', 600, 'cubic-bezier(0.4, 0, 0.2, 1)', 'both')).toBe(
        'bounce 600ms cubic-bezier(0.4, 0, 0.2, 1) both'
      );
    });

    it('should create animation string with 0ms duration when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(createAccessibleAnimation('fadeIn', 300)).toBe('fadeIn 0ms ease forwards');
      expect(createAccessibleAnimation('slideUp', 500, 'ease-in-out')).toBe('slideUp 0ms ease-in-out forwards');
      expect(createAccessibleAnimation('bounce', 600, 'cubic-bezier(0.4, 0, 0.2, 1)', 'both')).toBe(
        'bounce 0ms cubic-bezier(0.4, 0, 0.2, 1) both'
      );
    });

    it('should use default easing and fillMode when not provided', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(createAccessibleAnimation('fadeIn', 300)).toBe('fadeIn 300ms ease forwards');
    });

    it('should support different fill modes', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(createAccessibleAnimation('fadeIn', 300, 'ease', 'forwards')).toBe('fadeIn 300ms ease forwards');
      expect(createAccessibleAnimation('fadeIn', 300, 'ease', 'backwards')).toBe('fadeIn 300ms ease backwards');
      expect(createAccessibleAnimation('fadeIn', 300, 'ease', 'both')).toBe('fadeIn 300ms ease both');
      expect(createAccessibleAnimation('fadeIn', 300, 'ease', 'none')).toBe('fadeIn 300ms ease none');
    });
  });

  describe('integration scenarios', () => {
    it('should consistently respect reduced motion preference across all functions', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(prefersReducedMotion()).toBe(true);
      expect(getAnimationDuration(300)).toBe(0);
      expect(getTransitionDuration(200)).toBe(1);
      expect(createAccessibleTransition('opacity', 200)).toBe('opacity 1ms ease');
      expect(createAccessibleAnimation('fadeIn', 300)).toBe('fadeIn 0ms ease forwards');
    });

    it('should consistently allow animations when reduced motion is disabled', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      });

      expect(prefersReducedMotion()).toBe(false);
      expect(getAnimationDuration(300)).toBe(300);
      expect(getTransitionDuration(200)).toBe(200);
      expect(createAccessibleTransition('opacity', 200)).toBe('opacity 200ms ease');
      expect(createAccessibleAnimation('fadeIn', 300)).toBe('fadeIn 300ms ease forwards');
    });
  });
});
