/**
 * ParticleSystem Component
 * 
 * Renders decorative particle animations (snow, sakura) that don't block user interactions.
 * Uses requestAnimationFrame for smooth 60fps performance.
 * Respects reduced motion preferences for accessibility.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useEffect, useRef, useCallback } from 'react';

export type ParticleType = 'snow' | 'sakura';

export interface ParticleSystemProps {
  type: ParticleType;
  particleCount?: number;
  enabled: boolean;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  type,
  particleCount = 50,
  enabled,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Initialize particles
  const initializeParticles = useCallback(() => {
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(i, type));
    }
    
    particlesRef.current = particles;
  }, [particleCount, type]);

  // Create a single particle
  const createParticle = (id: number, particleType: ParticleType): Particle => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return {
        id,
        x: 0,
        y: 0,
        size: 0,
        speed: 0,
        drift: 0,
        rotation: 0,
        rotationSpeed: 0,
        opacity: 0,
      };
    }

    // Generate particle off-screen (above viewport)
    const x = Math.random() * canvas.width;
    const y = -Math.random() * canvas.height;

    if (particleType === 'snow') {
      return {
        id,
        x,
        y,
        size: Math.random() * 3 + 2, // 2-5px
        speed: Math.random() * 1 + 0.5, // 0.5-1.5 px/frame
        drift: Math.random() * 0.5 - 0.25, // -0.25 to 0.25 px/frame
        rotation: 0,
        rotationSpeed: 0,
        opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8
      };
    } else {
      // Sakura petals
      return {
        id,
        x,
        y,
        size: Math.random() * 8 + 6, // 6-14px
        speed: Math.random() * 1.5 + 0.5, // 0.5-2 px/frame
        drift: Math.random() * 1 - 0.5, // -0.5 to 0.5 px/frame
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1, // -1 to 1 degrees/frame
        opacity: Math.random() * 0.4 + 0.4, // 0.4-0.8
      };
    }
  };

  // Update particle positions
  const updateParticles = useCallback((deltaTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Normalize deltaTime to maintain consistent speed (target 60fps = ~16.67ms)
    const normalizedDelta = deltaTime / 16.67;

    particlesRef.current = particlesRef.current.map((particle) => {
      let { x, y, speed, drift, rotation, rotationSpeed } = particle;

      // Update position
      y += speed * normalizedDelta;
      x += drift * normalizedDelta;

      // Update rotation (for sakura)
      rotation += rotationSpeed * normalizedDelta;

      // Reset particle if it goes off-screen
      if (y > canvas.height + 10) {
        return createParticle(particle.id, type);
      }

      // Wrap horizontally
      if (x < -10) {
        x = canvas.width + 10;
      } else if (x > canvas.width + 10) {
        x = -10;
      }

      return {
        ...particle,
        x,
        y,
        rotation,
      };
    });
  }, [type]);

  // Draw particles on canvas
  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each particle
    particlesRef.current.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);

      if (type === 'snow') {
        // Draw snowflake as a simple circle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw sakura petal as an ellipse
        ctx.fillStyle = '#FFB7C5';
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size, particle.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add a small detail to make it look more like a petal
        ctx.fillStyle = '#FFC0CB';
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size * 0.5, particle.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }, [type]);

  // Animation loop
  const animate = useCallback((currentTime: number) => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Calculate delta time
    const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16.67;
    lastTimeRef.current = currentTime;

    // Update and draw
    updateParticles(deltaTime);
    drawParticles(ctx);

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [enabled, updateParticles, drawParticles]);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // Initialize and start animation
  useEffect(() => {
    if (!enabled) {
      // Cancel animation if disabled
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    handleResize();

    // Initialize particles
    initializeParticles();

    // Start animation
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);

    // Handle window resize
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, animate, handleResize, initializeParticles]);

  if (!enabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
};

export default ParticleSystem;
