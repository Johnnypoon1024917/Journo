/**
 * ParticleEffect Component
 * 
 * Lightweight particle animation component with multiple effect types.
 * Supports reduced motion preferences and GPU acceleration.
 * Total size: <10kb (CSS-based animations)
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

type EffectType = 'particles' | 'waves' | 'bubbles';

interface ParticleEffectProps {
  /** Type of animation effect */
  type?: EffectType;
  /** Enable/disable the animation */
  enabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Particle density (for particle type) */
  density?: 'low' | 'medium' | 'high';
  /** Animation speed multiplier */
  speed?: number;
}

export function ParticleEffect({
  type = 'particles',
  enabled = true,
  className,
  density = 'medium',
  speed = 1,
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Canvas-based particle animation
  useEffect(() => {
    if (!enabled || prefersReducedMotion || type !== 'particles' || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
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
      life: number;
      maxLife: number;
    }

    const densityMap = { low: 30, medium: 50, high: 80 };
    const particleCount = densityMap[density];
    const particles: Particle[] = [];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const maxLife = 200 + Math.random() * 200;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3 * speed,
        speedY: (Math.random() - 0.5) * 0.3 * speed,
        opacity: Math.random() * 0.4 + 0.1,
        life: Math.random() * maxLife,
        maxLife,
      });
    }

    // Animation loop
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life += 1;

        // Fade in/out based on life
        const lifeCycle = particle.life / particle.maxLife;
        if (lifeCycle < 0.1) {
          particle.opacity = lifeCycle * 10 * (Math.random() * 0.4 + 0.1);
        } else if (lifeCycle > 0.9) {
          particle.opacity = (1 - lifeCycle) * 10 * (Math.random() * 0.4 + 0.1);
        }

        // Reset particle when life ends
        if (particle.life >= particle.maxLife) {
          particle.x = Math.random() * rect.width;
          particle.y = Math.random() * rect.height;
          particle.life = 0;
          particle.opacity = Math.random() * 0.4 + 0.1;
        }

        // Wrap around edges
        if (particle.x < -10) particle.x = rect.width + 10;
        if (particle.x > rect.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = rect.height + 10;
        if (particle.y > rect.height + 10) particle.y = -10;

        // Draw particle with glow effect
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 2
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${particle.opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, prefersReducedMotion, type, density, speed]);

  // Don't render if disabled or reduced motion is preferred
  if (!enabled || prefersReducedMotion) {
    return null;
  }

  // Render canvas for particle effect
  if (type === 'particles') {
    return (
      <canvas
        ref={canvasRef}
        className={cn('absolute inset-0 pointer-events-none', className)}
        aria-hidden="true"
      />
    );
  }

  // CSS-based wave animation
  if (type === 'waves') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)} aria-hidden="true">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)',
            animation: `wave ${20 / speed}s ease-in-out infinite`,
            transformOrigin: 'center',
          }}
        />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: 'linear-gradient(225deg, transparent 0%, rgba(236, 72, 153, 0.3) 50%, transparent 100%)',
            animation: `wave ${25 / speed}s ease-in-out infinite`,
            animationDelay: '-5s',
            transformOrigin: 'center',
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: 'linear-gradient(315deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)',
            animation: `wave ${30 / speed}s ease-in-out infinite`,
            animationDelay: '-10s',
            transformOrigin: 'center',
          }}
        />
        <style>{`
          @keyframes wave {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            25% {
              transform: translateY(-10px) scale(1.02);
            }
            50% {
              transform: translateY(0) scale(1);
            }
            75% {
              transform: translateY(10px) scale(0.98);
            }
          }
        `}</style>
      </div>
    );
  }

  // CSS-based bubble animation
  if (type === 'bubbles') {
    const bubbleCount = density === 'low' ? 8 : density === 'medium' ? 12 : 16;
    
    return (
      <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)} aria-hidden="true">
        {Array.from({ length: bubbleCount }).map((_, i) => {
          const size = Math.random() * 60 + 20;
          const left = Math.random() * 100;
          const delay = Math.random() * 15;
          const duration = (15 + Math.random() * 10) / speed;
          
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                bottom: '-100px',
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05))',
                backdropFilter: 'blur(2px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                animation: `bubble ${duration}s ease-in infinite`,
                animationDelay: `${delay}s`,
                willChange: 'transform',
              }}
            />
          );
        })}
        <style>{`
          @keyframes bubble {
            0% {
              transform: translateY(0) translateX(0) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
              transform: translateY(-10vh) translateX(0) scale(1);
            }
            90% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(-110vh) translateX(${Math.random() * 100 - 50}px) scale(0.8);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
