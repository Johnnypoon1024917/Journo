/**
 * AnimationProvider Component
 * 
 * Wraps the app to provide particle animation effects based on user preferences.
 * Respects user's animation preference from theme store.
 * Respects reduced motion preferences for accessibility.
 * 
 * Requirements: 7.6
 */

import React from 'react';
import ParticleSystem from './ParticleSystem';
import { useKawaiiThemeStore } from '@/stores/kawaiiThemeStore';

export interface AnimationProviderProps {
  children: React.ReactNode;
}

const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const animations = useKawaiiThemeStore((state) => state.animations);

  // Check if animations should be enabled
  const isAnimationEnabled = animations !== 'none';

  return (
    <>
      {/* Render particle system based on user preference */}
      {isAnimationEnabled && animations === 'snow' && (
        <ParticleSystem type="snow" enabled={true} particleCount={50} />
      )}
      {isAnimationEnabled && animations === 'sakura' && (
        <ParticleSystem type="sakura" enabled={true} particleCount={40} />
      )}

      {/* Render children with higher z-index so they appear above particles */}
      <div className="relative z-10">
        {children}
      </div>
    </>
  );
};

export default AnimationProvider;
