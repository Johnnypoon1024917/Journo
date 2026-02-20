/**
 * HeroBackground Component
 * 
 * A reusable hero background component with high-quality imagery,
 * gradient overlays, and optional particle effects.
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface HeroBackgroundProps {
  /** Image source URL (supports WebP/AVIF with fallbacks) */
  imageSrc?: string;
  /** Alt text for the background image */
  imageAlt?: string;
  /** Gradient overlay colors (CSS gradient string) */
  gradientOverlay?: string;
  /** Enable particle animation effect */
  enableParticles?: boolean;
  /** Children to render on top of the background */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Image loading priority */
  priority?: 'high' | 'low';
  /** Blur placeholder color */
  blurColor?: string;
}

export function HeroBackground({
  imageSrc = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80',
  imageAlt = 'Travel destination background',
  gradientOverlay = 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(59, 130, 246, 0.3) 100%)',
  enableParticles = false,
  children,
  className,
  priority = 'high',
  blurColor = 'rgb(139, 92, 246)',
}: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Particle animation effect
  useEffect(() => {
    if (!enableParticles || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const particleCount = 50;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enableParticles]);

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      {/* Background Image with Optimization */}
      <div className="absolute inset-0">
        <OptimizedImage
          src={imageSrc}
          alt={imageAlt}
          priority={priority}
          sizes="100vw"
          objectFit="cover"
          blurColor={blurColor}
          className="w-full h-full"
        />
      </div>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: gradientOverlay,
          backdropFilter: 'blur(0px)',
        }}
      />

      {/* Vignette Effect */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)',
        }}
      />

      {/* Particle Canvas */}
      {enableParticles && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
