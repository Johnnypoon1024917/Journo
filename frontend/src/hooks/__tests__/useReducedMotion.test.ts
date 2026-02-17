import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../useAccessibility';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useReducedMotion', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let listeners: Array<(event: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    listeners = [];
    matchMediaMock = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners = listeners.filter(l => l !== listener);
      }),
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
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(false);
    });

    it('should return true when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(true);
    });

    it('should update when media query changes', () => {
      const mediaQuery = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.push(listener);
        }),
        removeEventListener: vi.fn(),
      };

      matchMediaMock.mockReturnValue(mediaQuery);

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(false);

      // Simulate media query change
      act(() => {
        listeners.forEach(listener => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      });

      expect(result.current.prefersReducedMotion).toBe(true);
    });
  });

  describe('shouldAnimate', () => {
    it('should return true when user does not prefer reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.shouldAnimate).toBe(true);
    });

    it('should return false when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.shouldAnimate).toBe(false);
    });
  });

  describe('getAnimationDuration', () => {
    it('should return original duration when animations are enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.getAnimationDuration(300)).toBe(300);
      expect(result.current.getAnimationDuration(500)).toBe(500);
      expect(result.current.getAnimationDuration(1000)).toBe(1000);
    });

    it('should return 0 when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.getAnimationDuration(300)).toBe(0);
      expect(result.current.getAnimationDuration(500)).toBe(0);
      expect(result.current.getAnimationDuration(1000)).toBe(0);
    });
  });

  describe('getTransitionDuration', () => {
    it('should return original duration when animations are enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.getTransitionDuration(200)).toBe(200);
      expect(result.current.getTransitionDuration(300)).toBe(300);
      expect(result.current.getTransitionDuration(500)).toBe(500);
    });

    it('should return 1ms when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion());

      // Returns 1ms instead of 0 to ensure transitions still fire
      expect(result.current.getTransitionDuration(200)).toBe(1);
      expect(result.current.getTransitionDuration(300)).toBe(1);
      expect(result.current.getTransitionDuration(500)).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeEventListener = vi.fn();
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener,
      });

      const { unmount } = renderHook(() => useReducedMotion());

      unmount();

      expect(removeEventListener).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple preference changes', () => {
      const mediaQuery = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.push(listener);
        }),
        removeEventListener: vi.fn(),
      };

      matchMediaMock.mockReturnValue(mediaQuery);

      const { result } = renderHook(() => useReducedMotion());

      // Initial state
      expect(result.current.prefersReducedMotion).toBe(false);
      expect(result.current.shouldAnimate).toBe(true);

      // Enable reduced motion
      act(() => {
        listeners.forEach(listener => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      });

      expect(result.current.prefersReducedMotion).toBe(true);
      expect(result.current.shouldAnimate).toBe(false);
      expect(result.current.getAnimationDuration(300)).toBe(0);
      expect(result.current.getTransitionDuration(200)).toBe(1);

      // Disable reduced motion
      act(() => {
        listeners.forEach(listener => {
          listener({ matches: false } as MediaQueryListEvent);
        });
      });

      expect(result.current.prefersReducedMotion).toBe(false);
      expect(result.current.shouldAnimate).toBe(true);
      expect(result.current.getAnimationDuration(300)).toBe(300);
      expect(result.current.getTransitionDuration(200)).toBe(200);
    });

    it('should provide consistent values across multiple calls', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion());

      // Call multiple times
      const duration1 = result.current.getAnimationDuration(300);
      const duration2 = result.current.getAnimationDuration(300);
      const duration3 = result.current.getAnimationDuration(300);

      expect(duration1).toBe(duration2);
      expect(duration2).toBe(duration3);
      expect(duration1).toBe(0);
    });
  });
});
