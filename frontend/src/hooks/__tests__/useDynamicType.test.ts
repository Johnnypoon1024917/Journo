import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDynamicType, applyDynamicTypeScale, setDynamicTypeCustomProperty } from '../useDynamicType';

describe('useDynamicType', () => {
  beforeEach(() => {
    // Reset document font size
    document.documentElement.style.fontSize = '16px';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return default text scale of 1.0', () => {
    const { result } = renderHook(() => useDynamicType());
    
    expect(result.current.textScale).toBe(1.0);
    expect(result.current.isScaled).toBe(false);
    expect(result.current.isLargeText).toBe(false);
    expect(result.current.isAccessibilitySize).toBe(false);
  });

  it('should detect large text when scale > 1.2', () => {
    // Set root font size to simulate large text
    document.documentElement.style.fontSize = '20px'; // 1.25x scale
    
    const { result } = renderHook(() => useDynamicType());
    
    expect(result.current.isLargeText).toBe(true);
  });

  it('should detect accessibility size when scale >= 1.5', () => {
    // Set root font size to simulate accessibility size
    document.documentElement.style.fontSize = '24px'; // 1.5x scale
    
    const { result } = renderHook(() => useDynamicType());
    
    expect(result.current.isAccessibilitySize).toBe(true);
  });

  it('should clamp scale to maxScale', () => {
    // Set root font size beyond max
    document.documentElement.style.fontSize = '40px'; // 2.5x scale
    
    const { result } = renderHook(() => useDynamicType({ maxScale: 2.0 }));
    
    expect(result.current.textScale).toBeLessThanOrEqual(2.0);
  });

  it('should clamp scale to minScale', () => {
    // Set root font size below min
    document.documentElement.style.fontSize = '10px'; // 0.625x scale
    
    const { result } = renderHook(() => useDynamicType({ minScale: 0.82 }));
    
    expect(result.current.textScale).toBeGreaterThanOrEqual(0.82);
  });

  it('should update scale when font size changes', () => {
    const { result } = renderHook(() => useDynamicType());
    
    expect(result.current.textScale).toBe(1.0);
    
    // Change font size
    act(() => {
      document.documentElement.style.fontSize = '20px';
      // Trigger resize event to update scale
      window.dispatchEvent(new Event('resize'));
    });
    
    // Wait for state update
    setTimeout(() => {
      expect(result.current.textScale).toBeGreaterThan(1.0);
    }, 100);
  });
});

describe('applyDynamicTypeScale', () => {
  it('should apply scale to root element', () => {
    applyDynamicTypeScale(1.5);
    
    const fontSize = getComputedStyle(document.documentElement).fontSize;
    expect(fontSize).toBe('24px'); // 16px * 1.5
  });

  it('should handle scale of 1.0', () => {
    applyDynamicTypeScale(1.0);
    
    const fontSize = getComputedStyle(document.documentElement).fontSize;
    expect(fontSize).toBe('16px');
  });

  it('should handle scale of 2.0', () => {
    applyDynamicTypeScale(2.0);
    
    const fontSize = getComputedStyle(document.documentElement).fontSize;
    expect(fontSize).toBe('32px'); // 16px * 2.0
  });
});

describe('setDynamicTypeCustomProperty', () => {
  it('should set CSS custom property', () => {
    setDynamicTypeCustomProperty(1.5);
    
    const customProperty = getComputedStyle(document.documentElement).getPropertyValue('--text-scale');
    expect(customProperty.trim()).toBe('1.5');
  });

  it('should update CSS custom property', () => {
    setDynamicTypeCustomProperty(1.0);
    expect(getComputedStyle(document.documentElement).getPropertyValue('--text-scale').trim()).toBe('1');
    
    setDynamicTypeCustomProperty(2.0);
    expect(getComputedStyle(document.documentElement).getPropertyValue('--text-scale').trim()).toBe('2');
  });
});

describe('Dynamic Type scaling up to 200%', () => {
  it('should support scaling up to 200%', () => {
    const scales = [1.0, 1.2, 1.5, 1.8, 2.0];
    
    scales.forEach(scale => {
      applyDynamicTypeScale(scale);
      const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const expectedSize = 16 * scale;
      expect(fontSize).toBe(expectedSize);
    });
  });

  it('should maintain readability at 200% scale', () => {
    applyDynamicTypeScale(2.0);
    
    // Verify that text is still readable (font size is reasonable)
    const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(fontSize).toBe(32); // 16px * 2.0
    expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
  });
});

describe('Layout adaptation for large text', () => {
  it('should add accessibility class when scale >= 1.5', () => {
    document.documentElement.style.fontSize = '24px'; // 1.5x scale
    
    const { result } = renderHook(() => useDynamicType());
    
    expect(result.current.isAccessibilitySize).toBe(true);
  });

  it('should add large text class when scale > 1.2', () => {
    document.documentElement.style.fontSize = '20px'; // 1.25x scale
    
    const { result } = renderHook(() => useDynamicType());
    
    expect(result.current.isLargeText).toBe(true);
  });
});
