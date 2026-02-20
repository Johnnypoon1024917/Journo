/**
 * HeroBackground Component Examples
 * 
 * Demonstrates various usage patterns for the HeroBackground component
 */

import { HeroBackground } from './HeroBackground';

/**
 * Example 1: Basic usage with gradient background (no image)
 */
export function BasicHeroExample() {
  return (
    <HeroBackground minHeight="60vh">
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Welcome to BubbleQuest</h1>
          <p className="text-xl">Your next adventure awaits</p>
        </div>
      </div>
    </HeroBackground>
  );
}

/**
 * Example 2: With background image and custom gradient
 */
export function ImageHeroExample() {
  return (
    <HeroBackground
      imageSrc="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80"
      imageAlt="Beautiful travel destination"
      gradient={{
        from: 'from-bubblequest-primary-900/60',
        via: 'via-bubblequest-primary-800/40',
        to: 'to-transparent',
        opacity: 1,
      }}
      minHeight="80vh"
    >
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center text-white max-w-4xl">
          <h1 className="text-6xl font-bold mb-6 drop-shadow-lg">
            Discover Your Next Adventure
          </h1>
          <p className="text-2xl mb-8 drop-shadow-md">
            Plan unforgettable trips with friends and family
          </p>
          <button className="bg-white text-bubblequest-primary-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-bubblequest-cream-50 transition-colors shadow-lg">
            Start Planning
          </button>
        </div>
      </div>
    </HeroBackground>
  );
}

/**
 * Example 3: With responsive image formats (WebP/AVIF)
 */
export function ResponsiveImageHeroExample() {
  return (
    <HeroBackground
      imageSrcSet={{
        avif: '/images/hero-1920.avif',
        webp: '/images/hero-1920.webp',
        fallback: '/images/hero-1920.jpg',
      }}
      imageAlt="Travel destination"
      enableVignette
      minHeight="70vh"
    >
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Optimized Performance</h1>
          <p className="text-xl">Modern image formats for faster loading</p>
        </div>
      </div>
    </HeroBackground>
  );
}

/**
 * Example 4: With particle effects
 */
export function ParticleHeroExample() {
  return (
    <HeroBackground
      enableParticles
      particleCount={30}
      gradient={{
        from: 'from-bubblequest-primary-600/50',
        via: 'via-bubblequest-secondary-500/30',
        to: 'to-transparent',
        opacity: 0.9,
      }}
      minHeight="100vh"
    >
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Magical Experience</h1>
          <p className="text-2xl">With subtle particle animations</p>
        </div>
      </div>
    </HeroBackground>
  );
}

/**
 * Example 5: Minimal with blur effect
 */
export function BlurHeroExample() {
  return (
    <HeroBackground
      imageSrc="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80"
      imageAlt="City skyline"
      enableBlur
      enableVignette
      gradient={{
        from: 'from-black/50',
        via: 'via-black/30',
        to: 'to-black/50',
        opacity: 1,
      }}
      minHeight="50vh"
    >
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-3">Soft Focus Background</h1>
          <p className="text-lg">Keeps attention on your content</p>
        </div>
      </div>
    </HeroBackground>
  );
}

/**
 * Example 6: Full-screen hero with custom styling
 */
export function FullScreenHeroExample() {
  return (
    <HeroBackground
      imageSrc="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80"
      imageAlt="Mountain landscape"
      minHeight="100vh"
      className="flex items-center justify-center"
      gradient={{
        from: 'from-bubblequest-primary-900/70',
        to: 'to-bubblequest-secondary-900/70',
        opacity: 1,
      }}
    >
      <div className="text-center text-white px-6 max-w-5xl">
        <h1 className="text-7xl font-bold mb-6 leading-tight drop-shadow-2xl">
          Where will you go next?
        </h1>
        <p className="text-2xl mb-10 drop-shadow-lg">
          Create beautiful itineraries and share them with the world
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-white text-bubblequest-primary-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-bubblequest-cream-50 transition-all hover:scale-105 shadow-xl">
            Get Started
          </button>
          <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all hover:scale-105 shadow-xl">
            Learn More
          </button>
        </div>
      </div>
    </HeroBackground>
  );
}
