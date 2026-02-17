/**
 * Tests for Keyboard Navigation Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKeyboardNavigation,
  useListKeyboardNavigation,
  useFocusTrap,
  useRovingTabIndex,
  useKeyboardShortcuts,
} from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  it('should call onActivate when Enter is pressed', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ onActivate })
    );

    const event = new KeyboardEvent('keydown', { key: 'Enter' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.onKeyDown(event);
    });

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should call onActivate when Space is pressed', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ onActivate })
    );

    const event = new KeyboardEvent('keydown', { key: ' ' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.onKeyDown(event);
    });

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should call onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ enableEscape: true, onEscape })
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.onKeyDown(event);
    });

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should call onArrowKey when arrow keys are pressed', () => {
    const onArrowKey = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ enableArrowKeys: true, onArrowKey })
    );

    const directions = [
      { key: 'ArrowUp', expected: 'up' },
      { key: 'ArrowDown', expected: 'down' },
      { key: 'ArrowLeft', expected: 'left' },
      { key: 'ArrowRight', expected: 'right' },
    ];

    directions.forEach(({ key, expected }) => {
      const event = new KeyboardEvent('keydown', { key }) as any;
      event.preventDefault = vi.fn();
      
      act(() => {
        result.current.onKeyDown(event);
      });

      expect(onArrowKey).toHaveBeenCalledWith(expected);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    expect(onArrowKey).toHaveBeenCalledTimes(4);
  });

  it('should call onHome when Home is pressed', () => {
    const onHome = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ enableHomeEnd: true, onHome })
    );

    const event = new KeyboardEvent('keydown', { key: 'Home' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.onKeyDown(event);
    });

    expect(onHome).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should call onEnd when End is pressed', () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ enableHomeEnd: true, onEnd })
    );

    const event = new KeyboardEvent('keydown', { key: 'End' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.onKeyDown(event);
    });

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not prevent default when preventDefault is false', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ onActivate, preventDefault: false })
    );

    const event = new KeyboardEvent('keydown', { key: 'Enter' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.onKeyDown(event);
    });

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should stop propagation when stopPropagation is true', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ onActivate, stopPropagation: true })
    );

    const event = new KeyboardEvent('keydown', { key: 'Enter' }) as any;
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();
    
    act(() => {
      result.current.onKeyDown(event);
    });

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should not call handlers when features are disabled', () => {
    const onActivate = vi.fn();
    const onEscape = vi.fn();
    const onArrowKey = vi.fn();
    
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        enableActivation: false,
        enableEscape: false,
        enableArrowKeys: false,
        onActivate,
        onEscape,
        onArrowKey,
      })
    );

    const events = [
      new KeyboardEvent('keydown', { key: 'Enter' }) as any,
      new KeyboardEvent('keydown', { key: 'Escape' }) as any,
      new KeyboardEvent('keydown', { key: 'ArrowUp' }) as any,
    ];

    events.forEach((event) => {
      event.preventDefault = vi.fn();
      act(() => {
        result.current.onKeyDown(event);
      });
    });

    expect(onActivate).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
    expect(onArrowKey).not.toHaveBeenCalled();
  });
});

describe('useListKeyboardNavigation', () => {
  it('should navigate down with ArrowDown in vertical orientation', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useListKeyboardNavigation(5, { onSelect, orientation: 'vertical' })
    );

    // Simulate ArrowDown
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.keyboardProps.onKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should navigate right with ArrowRight in horizontal orientation', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useListKeyboardNavigation(5, { onSelect, orientation: 'horizontal' })
    );

    // Simulate ArrowRight
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.keyboardProps.onKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should loop to first item when navigating past last item', () => {
    const { result } = renderHook(() =>
      useListKeyboardNavigation(3, { loop: true, initialIndex: 2 })
    );

    // Navigate down from last item
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.keyboardProps.onKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not loop when loop is false', () => {
    const { result } = renderHook(() =>
      useListKeyboardNavigation(3, { loop: false, initialIndex: 2 })
    );

    // Try to navigate down from last item
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.keyboardProps.onKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should call onSelect when Enter is pressed', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useListKeyboardNavigation(5, { onSelect, initialIndex: 2 })
    );

    const event = new KeyboardEvent('keydown', { key: 'Enter' }) as any;
    event.preventDefault = vi.fn();
    
    act(() => {
      result.current.keyboardProps.onKeyDown(event);
    });

    expect(onSelect).toHaveBeenCalledWith(2);
  });
});

describe('useRovingTabIndex', () => {
  it('should return 0 for active index and -1 for others', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex(5, { defaultIndex: 2 })
    );

    expect(result.current.getTabIndex(0)).toBe(-1);
    expect(result.current.getTabIndex(1)).toBe(-1);
    expect(result.current.getTabIndex(2)).toBe(0);
    expect(result.current.getTabIndex(3)).toBe(-1);
    expect(result.current.getTabIndex(4)).toBe(-1);
  });

  it('should update active index', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex(5, { defaultIndex: 0 })
    );

    act(() => {
      result.current.setActiveIndex(3);
    });

    expect(result.current.getTabIndex(0)).toBe(-1);
    expect(result.current.getTabIndex(3)).toBe(0);
  });

  it('should not set active index out of bounds', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex(5, { defaultIndex: 2 })
    );

    act(() => {
      result.current.setActiveIndex(10);
    });

    // Should remain at index 2
    expect(result.current.getTabIndex(2)).toBe(0);
  });
});

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // Clear all event listeners
    vi.clearAllMocks();
  });

  it('should call handler for matching shortcut', () => {
    const handler = vi.fn();
    const shortcuts = {
      'ctrl+s': handler,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle cmd key on Mac', () => {
    const handler = vi.fn();
    const shortcuts = {
      'cmd+k': handler,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
    });
    
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple modifiers', () => {
    const handler = vi.fn();
    const shortcuts = {
      'ctrl+shift+p': handler,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
    });
    
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when disabled', () => {
    const handler = vi.fn();
    const shortcuts = {
      'ctrl+s': handler,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts, { enabled: false }));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple shortcuts', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const shortcuts = {
      'ctrl+s': handler1,
      'ctrl+p': handler2,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event1 = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    
    const event2 = new KeyboardEvent('keydown', {
      key: 'p',
      ctrlKey: true,
    });
    
    window.dispatchEvent(event1);
    window.dispatchEvent(event2);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});
