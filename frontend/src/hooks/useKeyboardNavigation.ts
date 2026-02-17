/**
 * Keyboard Navigation Hook
 * 
 * Provides comprehensive keyboard navigation support for interactive elements
 * Ensures all functionality is accessible via keyboard (WCAG 2.1 - 2.1.1)
 */

import { useEffect, useRef, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  /**
   * Enable arrow key navigation (up/down/left/right)
   */
  enableArrowKeys?: boolean;
  
  /**
   * Enable Enter and Space key activation
   */
  enableActivation?: boolean;
  
  /**
   * Enable Escape key to close/cancel
   */
  enableEscape?: boolean;
  
  /**
   * Enable Home/End keys for first/last navigation
   */
  enableHomeEnd?: boolean;
  
  /**
   * Callback when Enter or Space is pressed
   */
  onActivate?: () => void;
  
  /**
   * Callback when Escape is pressed
   */
  onEscape?: () => void;
  
  /**
   * Callback when arrow keys are pressed
   */
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  
  /**
   * Callback when Home key is pressed
   */
  onHome?: () => void;
  
  /**
   * Callback when End key is pressed
   */
  onEnd?: () => void;
  
  /**
   * Prevent default behavior for handled keys
   */
  preventDefault?: boolean;
  
  /**
   * Stop propagation for handled keys
   */
  stopPropagation?: boolean;
}

/**
 * Hook for adding keyboard navigation to an element
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    enableArrowKeys = false,
    enableActivation = true,
    enableEscape = false,
    enableHomeEnd = false,
    onActivate,
    onEscape,
    onArrowKey,
    onHome,
    onEnd,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Handle activation keys (Enter and Space)
    if (enableActivation && (event.key === 'Enter' || event.key === ' ')) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      onActivate?.();
      return;
    }

    // Handle Escape key
    if (enableEscape && event.key === 'Escape') {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      onEscape?.();
      return;
    }

    // Handle arrow keys
    if (enableArrowKeys && onArrowKey) {
      let direction: 'up' | 'down' | 'left' | 'right' | null = null;
      
      switch (event.key) {
        case 'ArrowUp':
          direction = 'up';
          break;
        case 'ArrowDown':
          direction = 'down';
          break;
        case 'ArrowLeft':
          direction = 'left';
          break;
        case 'ArrowRight':
          direction = 'right';
          break;
      }

      if (direction) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        onArrowKey(direction);
        return;
      }
    }

    // Handle Home key
    if (enableHomeEnd && event.key === 'Home' && onHome) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      onHome();
      return;
    }

    // Handle End key
    if (enableHomeEnd && event.key === 'End' && onEnd) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      onEnd();
      return;
    }
  }, [
    enableArrowKeys,
    enableActivation,
    enableEscape,
    enableHomeEnd,
    onActivate,
    onEscape,
    onArrowKey,
    onHome,
    onEnd,
    preventDefault,
    stopPropagation,
  ]);

  return { onKeyDown: handleKeyDown };
}

/**
 * Hook for managing focus within a list of items
 */
export function useListKeyboardNavigation<T extends HTMLElement = HTMLElement>(
  itemCount: number,
  options: {
    onSelect?: (index: number) => void;
    orientation?: 'vertical' | 'horizontal';
    loop?: boolean;
    initialIndex?: number;
  } = {}
) {
  const {
    onSelect,
    orientation = 'vertical',
    loop = true,
    initialIndex = 0,
  } = options;

  const currentIndexRef = useRef(initialIndex);
  const itemsRef = useRef<T[]>([]);

  const setItemRef = useCallback((index: number) => (element: T | null) => {
    if (element) {
      itemsRef.current[index] = element;
    }
  }, []);

  const focusItem = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      currentIndexRef.current = index;
      itemsRef.current[index]?.focus();
    }
  }, [itemCount]);

  const handleArrowKey = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const isNext = 
      (orientation === 'vertical' && direction === 'down') ||
      (orientation === 'horizontal' && direction === 'right');
    
    const isPrev = 
      (orientation === 'vertical' && direction === 'up') ||
      (orientation === 'horizontal' && direction === 'left');

    if (!isNext && !isPrev) return;

    let newIndex = currentIndexRef.current;

    if (isNext) {
      newIndex = currentIndexRef.current + 1;
      if (newIndex >= itemCount) {
        newIndex = loop ? 0 : itemCount - 1;
      }
    } else if (isPrev) {
      newIndex = currentIndexRef.current - 1;
      if (newIndex < 0) {
        newIndex = loop ? itemCount - 1 : 0;
      }
    }

    focusItem(newIndex);
  }, [itemCount, orientation, loop, focusItem]);

  const handleHome = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  const handleEnd = useCallback(() => {
    focusItem(itemCount - 1);
  }, [itemCount, focusItem]);

  const handleActivate = useCallback(() => {
    onSelect?.(currentIndexRef.current);
  }, [onSelect]);

  const keyboardProps = useKeyboardNavigation({
    enableArrowKeys: true,
    enableActivation: true,
    enableHomeEnd: true,
    onArrowKey: handleArrowKey,
    onHome: handleHome,
    onEnd: handleEnd,
    onActivate: handleActivate,
  });

  return {
    keyboardProps,
    setItemRef,
    focusItem,
    currentIndex: currentIndexRef.current,
  };
}

/**
 * Hook for trapping focus within a container (useful for modals)
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]):not(:disabled)'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing roving tabindex in a group of elements
 * Only one element in the group is tabbable at a time
 */
export function useRovingTabIndex<T extends HTMLElement = HTMLElement>(
  itemCount: number,
  options: {
    defaultIndex?: number;
    orientation?: 'vertical' | 'horizontal';
  } = {}
) {
  const { defaultIndex = 0, orientation = 'vertical' } = options;
  const activeIndexRef = useRef(defaultIndex);

  const getTabIndex = useCallback((index: number) => {
    return index === activeIndexRef.current ? 0 : -1;
  }, []);

  const setActiveIndex = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      activeIndexRef.current = index;
    }
  }, [itemCount]);

  const handleKeyDown = useCallback((index: number) => (event: React.KeyboardEvent) => {
    let newIndex = index;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          event.preventDefault();
          newIndex = (index + 1) % itemCount;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          event.preventDefault();
          newIndex = (index - 1 + itemCount) % itemCount;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          event.preventDefault();
          newIndex = (index + 1) % itemCount;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          event.preventDefault();
          newIndex = (index - 1 + itemCount) % itemCount;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = itemCount - 1;
        break;
    }

    if (newIndex !== index) {
      setActiveIndex(newIndex);
      // Focus will be handled by the component
      (event.currentTarget as HTMLElement).blur();
      // Find and focus the new element
      const parent = (event.currentTarget as HTMLElement).parentElement;
      const siblings = parent?.querySelectorAll<HTMLElement>('[role="tab"], [role="option"], [role="menuitem"]');
      siblings?.[newIndex]?.focus();
    }
  }, [itemCount, orientation, setActiveIndex]);

  return {
    getTabIndex,
    setActiveIndex,
    handleKeyDown,
    activeIndex: activeIndexRef.current,
  };
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  options: {
    enabled?: boolean;
    preventDefault?: boolean;
  } = {}
) {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Build shortcut key string (e.g., "ctrl+s", "cmd+k")
      const parts: string[] = [];
      
      if (event.ctrlKey) parts.push('ctrl');
      if (event.metaKey) parts.push('cmd');
      if (event.altKey) parts.push('alt');
      if (event.shiftKey) parts.push('shift');
      
      // Add the main key (lowercase)
      const key = event.key.toLowerCase();
      if (key !== 'control' && key !== 'meta' && key !== 'alt' && key !== 'shift') {
        parts.push(key);
      }

      const shortcutKey = parts.join('+');
      const handler = shortcuts[shortcutKey];

      if (handler) {
        if (preventDefault) event.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled, preventDefault]);
}
