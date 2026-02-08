/**
 * TravelCard Component
 * 
 * A modern card component for displaying travel destinations, trips, and activities
 * with hover effects, micro-interactions, and smooth animations.
 * 
 * Features:
 * - Consistent spacing, shadows, and visual hierarchy
 * - Smooth hover effects with elevation changes
 * - Micro-interactions for engagement
 * - Responsive image handling
 * - Flexible content layout
 */

import React from 'react';
import { colors, shadows, borderRadius, spacing } from '../tokens';
import { transitions, microInteractions } from '../animations';
import type { BaseComponentProps } from '../types';

export interface TravelCardProps extends BaseComponentProps {
  /** Card variant style */
  variant?: 'default' | 'elevated' | 'outlined' | 'minimal';
  
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Image source URL */
  image?: string;
  
  /** Image alt text for accessibility */
  imageAlt?: string;
  
  /** Card title */
  title: string;
  
  /** Card description */
  description?: string;
  
  /** Category or tag */
  category?: string;
  
  /** Rating value (0-5) */
  rating?: number;
  
  /** Price level indicator */
  priceLevel?: 1 | 2 | 3 | 4;
  
  /** Footer content */
  footer?: React.ReactNode;
  
  /** Badge content (top-right corner) */
  badge?: React.ReactNode;
  
  /** Whether the card is interactive/clickable */
  interactive?: boolean;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Favorite/bookmark handler */
  onFavorite?: () => void;
  
  /** Whether the item is favorited */
  isFavorite?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Aspect ratio for image */
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/4';
}

export const TravelCard: React.FC<TravelCardProps> = ({
  variant = 'default',
  size = 'md',
  image,
  imageAlt = '',
  title,
  description,
  category,
  rating,
  priceLevel,
  footer,
  badge,
  interactive = false,
  onClick,
  onFavorite,
  isFavorite = false,
  loading = false,
  aspectRatio = '16/9',
  className = '',
  children,
  'data-testid': dataTestId,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: spacing.md,
      titleSize: '1rem',
      descriptionSize: '0.875rem',
      imageHeight: '150px',
    },
    md: {
      padding: spacing.lg,
      titleSize: '1.25rem',
      descriptionSize: '0.875rem',
      imageHeight: '200px',
    },
    lg: {
      padding: spacing.xl,
      titleSize: '1.5rem',
      descriptionSize: '1rem',
      imageHeight: '250px',
    },
  };

  const config = sizeConfig[size];

  // Variant styles
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: '#ffffff',
      border: `1px solid ${colors.neutral[200]}`,
      boxShadow: shadows.sm,
    },
    elevated: {
      backgroundColor: '#ffffff',
      border: 'none',
      boxShadow: shadows.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `2px solid ${colors.neutral[300]}`,
      boxShadow: 'none',
    },
    minimal: {
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
    },
  };

  // Hover styles
  const hoverStyles: React.CSSProperties = interactive && isHovered ? {
    transform: 'translateY(-4px)',
    boxShadow: variant === 'minimal' ? 'none' : shadows.lg,
  } : {};

  const cardStyle: React.CSSProperties = {
    ...variantStyles[variant],
    ...hoverStyles,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    transition: transitions.all.property + ' ' + transitions.all.duration + ' ' + transitions.all.easing,
    cursor: interactive ? 'pointer' : 'default',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: aspectRatio,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: transitions.transform.property + ' ' + transitions.transform.duration + ' ' + transitions.transform.easing,
    transform: isHovered && interactive ? 'scale(1.05)' : 'scale(1)',
    opacity: imageLoaded ? 1 : 0,
  };

  const contentStyle: React.CSSProperties = {
    padding: config.padding,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    flex: 1,
  };

  const categoryStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: colors.primary[600],
    marginBottom: spacing.xs,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: config.titleSize,
    fontWeight: '600',
    color: colors.neutral[900],
    lineHeight: '1.3',
    margin: 0,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: config.descriptionSize,
    color: colors.neutral[600],
    lineHeight: '1.5',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const footerStyle: React.CSSProperties = {
    marginTop: 'auto',
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.neutral[200]}`,
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  };

  const favoriteButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: borderRadius.full,
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: transitions.all.property + ' ' + transitions.all.duration + ' ' + transitions.all.easing,
    boxShadow: shadows.sm,
  };

  const skeletonStyle: React.CSSProperties = {
    background: `linear-gradient(90deg, ${colors.neutral[200]} 25%, ${colors.neutral[100]} 50%, ${colors.neutral[200]} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
  };

  const renderRating = () => {
    if (!rating) return null;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            style={{
              color: i < Math.floor(rating) ? colors.secondary[500] : colors.neutral[300],
              fontSize: '1rem',
            }}
          >
            ★
          </span>
        ))}
        <span style={{ fontSize: '0.875rem', color: colors.neutral[600], marginLeft: spacing.xs }}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const renderPriceLevel = () => {
    if (!priceLevel) return null;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            style={{
              color: i < priceLevel ? colors.neutral[700] : colors.neutral[300],
              fontSize: '0.875rem',
            }}
          >
            $
          </span>
        ))}
      </div>
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite();
    }
  };

  if (loading) {
    return (
      <div style={cardStyle} className={className} data-testid={dataTestId}>
        <div style={{ ...imageContainerStyle, ...skeletonStyle }} />
        <div style={contentStyle}>
          <div style={{ ...skeletonStyle, height: '20px', width: '60%', borderRadius: borderRadius.sm }} />
          <div style={{ ...skeletonStyle, height: '24px', width: '80%', borderRadius: borderRadius.sm }} />
          <div style={{ ...skeletonStyle, height: '16px', width: '100%', borderRadius: borderRadius.sm }} />
          <div style={{ ...skeletonStyle, height: '16px', width: '90%', borderRadius: borderRadius.sm }} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={cardStyle}
      className={className}
      data-testid={dataTestId}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick(e as any);
        }
      }}
    >
      {image && (
        <div style={imageContainerStyle}>
          <img
            src={image}
            alt={imageAlt}
            style={imageStyle}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && <div style={{ ...skeletonStyle, position: 'absolute', inset: 0 }} />}
          
          {onFavorite && (
            <button
              style={favoriteButtonStyle}
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span style={{ fontSize: '1.25rem', color: isFavorite ? colors.semantic.error[500] : colors.neutral[600] }}>
                {isFavorite ? '♥' : '♡'}
              </span>
            </button>
          )}
          
          {badge && <div style={badgeStyle}>{badge}</div>}
        </div>
      )}
      
      <div style={contentStyle}>
        {category && <div style={categoryStyle}>{category}</div>}
        
        <h3 style={titleStyle}>{title}</h3>
        
        {description && <p style={descriptionStyle}>{description}</p>}
        
        {(rating || priceLevel) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs }}>
            {renderRating()}
            {renderPriceLevel()}
          </div>
        )}
        
        {children}
        
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
};

export default TravelCard;
