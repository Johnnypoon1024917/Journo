/**
 * OptimizedImage Component Tests
 * 
 * Tests for the image optimization component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

describe('OptimizedImage', () => {
  it('renders with required props', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
  });

  it('uses lazy loading by default', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('uses eager loading for high priority images', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority="high"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('generates modern format sources', () => {
    const { container } = render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const picture = container.querySelector('picture');
    expect(picture).toBeInTheDocument();

    const sources = container.querySelectorAll('source');
    expect(sources.length).toBeGreaterThanOrEqual(2); // AVIF and WebP
  });

  it('applies custom className', () => {
    const { container } = render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('shows error fallback when image fails to load', async () => {
    render(
      <OptimizedImage
        src="https://example.com/invalid-image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simulate image load error
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      const fallback = screen.getByRole('img', { name: 'Test image' });
      expect(fallback).toBeInTheDocument();
    });
  });

  it('calls onLoad callback when image loads', async () => {
    const onLoad = vi.fn();

    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        onLoad={onLoad}
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simulate image load
    img.dispatchEvent(new Event('load'));

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onError callback when image fails', async () => {
    const onError = vi.fn();

    render(
      <OptimizedImage
        src="https://example.com/invalid-image.jpg"
        alt="Test image"
        onError={onError}
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simulate image error
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  it('applies correct sizes attribute', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
  });

  it('generates srcset for Unsplash images', () => {
    render(
      <OptimizedImage
        src="https://images.unsplash.com/photo-123?w=1200&q=80"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    const srcset = img.getAttribute('srcset');
    
    expect(srcset).toBeTruthy();
    expect(srcset).toContain('640w');
    expect(srcset).toContain('1920w');
  });
});
