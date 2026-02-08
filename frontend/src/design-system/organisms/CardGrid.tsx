/**
 * CardGrid Component
 * 
 * A responsive grid layout system for displaying cards with consistent spacing
 * and visual hierarchy. Supports multiple layout modes and responsive breakpoints.
 * 
 * Features:
 * - Responsive grid with configurable columns
 * - Masonry layout support
 * - Consistent gap spacing
 * - Loading states
 * - Empty states
 * - Smooth animations for card entrance
 */

import React from 'react';
import { spacing, breakpoints } from '../tokens';
import type { BaseComponentProps } from '../types';

export interface CardGridProps extends BaseComponentProps {
  /** Grid layout mode */
  layout?: 'grid' | 'masonry';
  
  /** Number of columns for different breakpoints */
  columns?: {
    mobile?: 1 | 2;
    tablet?: 2 | 3 | 4;
    desktop?: 2 | 3 | 4 | 5 | 6;
  };
  
  /** Gap between cards */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Loading state */
  loading?: boolean;
  
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
  
  /** Empty state content */
  emptyState?: React.ReactNode;
  
  /** Whether to animate card entrance */
  animateEntrance?: boolean;
  
  /** Minimum card width (for auto-fit grid) */
  minCardWidth?: string;
  
  /** Maximum card width (for auto-fit grid) */
  maxCardWidth?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  layout = 'grid',
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  gap = 'lg',
  loading = false,
  skeletonCount = 6,
  emptyState,
  animateEntrance = true,
  minCardWidth = '280px',
  maxCardWidth = '1fr',
  className = '',
  children,
  'data-testid': dataTestId,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Gap sizes
  const gapSizes = {
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
  };

  const gapSize = gapSizes[gap];

  // Grid styles
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: gapSize,
    width: '100%',
  };

  // Responsive column configuration
  const getGridTemplateColumns = () => {
    if (layout === 'masonry') {
      // Masonry uses auto-fit with min/max width
      return `repeat(auto-fit, minmax(${minCardWidth}, ${maxCardWidth}))`;
    }

    // Standard grid with responsive columns
    return `repeat(${columns.mobile || 1}, 1fr)`;
  };

  const containerStyle: React.CSSProperties = {
    ...gridStyle,
    gridTemplateColumns: getGridTemplateColumns(),
  };

  // Masonry-specific styles
  const masonryStyle: React.CSSProperties = layout === 'masonry' ? {
    gridAutoFlow: 'dense',
  } : {};

  // Animation styles
  const animationStyle: React.CSSProperties = animateEntrance && mounted ? {
    animation: 'fadeInUp 0.4s ease-out forwards',
  } : {};

  // Render skeleton cards
  const renderSkeletons = () => {
    return Array.from({ length: skeletonCount }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        style={{
          ...animationStyle,
          animationDelay: `${index * 50}ms`,
        }}
      >
        {/* Skeleton content will be provided by TravelCard with loading prop */}
      </div>
    ));
  };

  // Render children with animation
  const renderChildren = () => {
    if (!children) return null;

    const childArray = React.Children.toArray(children);
    
    return childArray.map((child, index) => (
      <div
        key={index}
        style={{
          ...animationStyle,
          animationDelay: animateEntrance ? `${index * 50}ms` : '0ms',
          opacity: animateEntrance && !mounted ? 0 : 1,
        }}
      >
        {child}
      </div>
    ));
  };

  // Check if grid is empty
  const isEmpty = !loading && (!children || React.Children.count(children) === 0);

  if (isEmpty && emptyState) {
    return (
      <div
        className={className}
        data-testid={dataTestId}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          width: '100%',
        }}
      >
        {emptyState}
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Responsive breakpoints */
          @media (min-width: ${breakpoints.sm}) {
            .card-grid-responsive {
              grid-template-columns: repeat(${columns.tablet || 2}, 1fr);
            }
          }

          @media (min-width: ${breakpoints.lg}) {
            .card-grid-responsive {
              grid-template-columns: repeat(${columns.desktop || 3}, 1fr);
            }
          }

          /* Masonry layout support for modern browsers */
          @supports (grid-template-rows: masonry) {
            .card-grid-masonry {
              grid-template-rows: masonry;
            }
          }
        `}
      </style>
      
      <div
        className={`${className} ${layout === 'grid' ? 'card-grid-responsive' : 'card-grid-masonry'}`}
        data-testid={dataTestId}
        style={{
          ...containerStyle,
          ...masonryStyle,
        }}
      >
        {loading ? renderSkeletons() : renderChildren()}
      </div>
    </>
  );
};

export default CardGrid;
