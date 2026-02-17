import React, { useEffect } from 'react';
import { useAutoDynamicType } from '../hooks/useDynamicType';

/**
 * DynamicTypeProvider
 * 
 * Provides Dynamic Type support across the entire application.
 * Automatically detects and applies system font size preferences.
 * Supports scaling up to 200% for accessibility.
 */

interface DynamicTypeProviderProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
}

export const DynamicTypeProvider: React.FC<DynamicTypeProviderProps> = ({
  children,
  minScale = 0.82,
  maxScale = 2.0,
}) => {
  const textScale = useAutoDynamicType({ minScale, maxScale, defaultScale: 1.0 });

  useEffect(() => {
    // Add data attribute to body for CSS targeting
    document.body.setAttribute('data-text-scale', textScale.toFixed(2));
    
    // Add accessibility size class if needed
    if (textScale >= 1.5) {
      document.body.classList.add('accessibility-text-size');
    } else {
      document.body.classList.remove('accessibility-text-size');
    }
    
    // Add large text class if needed
    if (textScale > 1.2) {
      document.body.classList.add('large-text-size');
    } else {
      document.body.classList.remove('large-text-size');
    }
  }, [textScale]);

  return <>{children}</>;
};

export default DynamicTypeProvider;
