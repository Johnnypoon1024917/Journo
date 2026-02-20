/**
 * HeroBackground Component Tests
 * 
 * Tests for the HeroBackground component functionality
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroBackground } from '../HeroBackground';

describe('HeroBackground', () => {
  it('renders children content', () => {
    render(
      <HeroBackground>
        <h1>Test Content</h1>
      </HeroBackground>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with default gradient when no image provided', () => {
    const { container } = render(
      <HeroBackground>
        <div>Content</div>
      </HeroBackground>
    );
    
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('renders with custom minHeight', () => {
    const { container } = render(
      <HeroBackground minHeight="50vh">
        <div>Content</div>
      </HeroBackground>
    );
    
    const section = container.querySelector('section');
    expect(section).toHaveStyle({ minHeight: '50vh' });
  });

  it('renders image with proper alt text', () => {
    render(
      <HeroBackground
        imageSrc="https://example.com/hero.jpg"
        imageAlt="Beautiful landscape"
      >
        <div>Content</div>
      </HeroBackground>
    );
    
    const img = screen.getByAltText('Beautiful landscape');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('applies custom className', () => {
    const { container } = render(
      <HeroBackground className="custom-class">
        <div>Content</div>
      </HeroBackground>
    );
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('custom-class');
  });

  it('renders particles when enabled', () => {
    const { container } = render(
      <HeroBackground enableParticles particleCount={5}>
        <div>Content</div>
      </HeroBackground>
    );
    
    // Check that particle container exists
    const particleContainer = container.querySelector('.overflow-hidden.pointer-events-none');
    expect(particleContainer).toBeInTheDocument();
  });

  it('renders decorative blobs when particles disabled', () => {
    const { container } = render(
      <HeroBackground enableParticles={false}>
        <div>Content</div>
      </HeroBackground>
    );
    
    // Check for decorative blob elements
    const blobs = container.querySelectorAll('.blur-3xl');
    expect(blobs.length).toBeGreaterThan(0);
  });

  it('renders vignette effect by default', () => {
    const { container } = render(
      <HeroBackground>
        <div>Content</div>
      </HeroBackground>
    );
    
    // Check for vignette layer
    const vignette = container.querySelector('[style*="radial-gradient"]');
    expect(vignette).toBeInTheDocument();
  });

  it('does not render vignette when disabled', () => {
    const { container } = render(
      <HeroBackground enableVignette={false}>
        <div>Content</div>
      </HeroBackground>
    );
    
    // Check that vignette layer doesn't exist
    const vignette = container.querySelector('[style*="radial-gradient"]');
    expect(vignette).not.toBeInTheDocument();
  });

  it('supports responsive image formats', () => {
    render(
      <HeroBackground
        imageSrcSet={{
          avif: 'hero.avif',
          webp: 'hero.webp',
          fallback: 'hero.jpg',
        }}
        imageAlt="Hero image"
      >
        <div>Content</div>
      </HeroBackground>
    );
    
    const picture = screen.getByAltText('Hero image').closest('picture');
    expect(picture).toBeInTheDocument();
    
    const avifSource = picture?.querySelector('source[type="image/avif"]');
    const webpSource = picture?.querySelector('source[type="image/webp"]');
    
    expect(avifSource).toBeInTheDocument();
    expect(webpSource).toBeInTheDocument();
  });
});
