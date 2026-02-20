/**
 * DestinationResultCard Component
 * 
 * Displays a single destination recommendation card with beautiful imagery,
 * temperature badge, and "Plan This Trip" CTA button.
 * 
 * Features:
 * - High-quality cover photo with lazy loading
 * - Temperature badge overlay
 * - Glassmorphic design with hover effects
 * - "Plan This Trip" CTA button
 * - Touch-friendly for mobile
 * - Keyboard accessible
 * 
 * Requirements: Task 3.2
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CountryRecommendation } from '../../types/countryRecommendation';
import { cn } from '../../utils/cn';
import { OptimizedImage } from '../common/OptimizedImage';

export interface DestinationResultCardProps {
  country: CountryRecommendation;
  onPlanTrip?: (country: CountryRecommendation) => void;
  index?: number;
}

// Region emoji mapping for visual interest
const REGION_EMOJI: Record<string, string> = {
  'Asia': '🌏',
  'Europe': '🇪🇺',
  'Americas': '🌎',
  'Africa': '🌍',
  'Oceania': '🏝️',
  'Middle East': '🕌'
};

// Placeholder images for countries (using Unsplash)
const COUNTRY_IMAGES: Record<string, string> = {
  'Japan': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  'France': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&q=80',
  'Italy': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
  'Spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80',
  'Thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
  'Greece': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
  'Portugal': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
  'Iceland': 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=80',
  'Norway': 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80',
  'New Zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80',
  'Australia': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80',
  'Morocco': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&q=80',
  'Turkey': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
  'Indonesia': 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&q=80',
  'Vietnam': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'
};

export const DestinationResultCard: React.FC<DestinationResultCardProps> = ({
  country,
  onPlanTrip,
  index = 0
}) => {
  const handlePlanTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlanTrip) {
      onPlanTrip(country);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onPlanTrip) {
        onPlanTrip(country);
      }
    }
  };

  // Get image for country or use default
  const imageUrl = COUNTRY_IMAGES[country.country_name] || COUNTRY_IMAGES.default;

  return (
    <motion.article
      className={cn(
        'flex-shrink-0 w-[320px] md:w-[360px]',
        'bg-white dark:bg-bubblequest-neutral-800',
        'rounded-3xl overflow-hidden',
        'shadow-lg hover:shadow-2xl',
        'transition-all duration-300',
        'border-2 border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700',
        'group'
      )}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      {/* Cover Image with Temperature Badge */}
      <div className="relative h-48 overflow-hidden">
        <OptimizedImage
          src={imageUrl}
          alt={`${country.country_name} destination`}
          priority="low"
          sizes="(max-width: 768px) 320px, 360px"
          objectFit="cover"
          className="w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Temperature Badge */}
        <div 
          className={cn(
            'absolute top-4 right-4',
            'px-4 py-2 rounded-full',
            'bg-white/90 dark:bg-bubblequest-neutral-800/90',
            'backdrop-blur-md',
            'border border-white/20',
            'shadow-lg'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="Temperature">
              🌡️
            </span>
            <span className="text-sm font-bold text-bubblequest-neutral-900 dark:text-white">
              {country.temp_range}
            </span>
          </div>
        </div>

        {/* Region Badge */}
        <div 
          className={cn(
            'absolute bottom-4 left-4',
            'px-3 py-1.5 rounded-full',
            'bg-bubblequest-primary-500/90 dark:bg-bubblequest-primary-600/90',
            'backdrop-blur-md',
            'text-white text-sm font-medium'
          )}
        >
          {REGION_EMOJI[country.region] || '🌍'} {country.region}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {/* Country Name */}
        <h3 className="text-2xl font-bold text-bubblequest-neutral-900 dark:text-white mb-3">
          {country.country_name}
        </h3>

        {/* Description */}
        <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mb-4 line-clamp-2 leading-relaxed">
          {country.description}
        </p>

        {/* Plan This Trip Button */}
        <button
          onClick={handlePlanTrip}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full py-3 px-6 rounded-2xl',
            'bg-gradient-to-r from-bubblequest-primary-500 to-bubblequest-secondary-500',
            'hover:from-bubblequest-primary-600 hover:to-bubblequest-secondary-600',
            'text-white font-bold text-base',
            'shadow-md hover:shadow-xl',
            'transition-all duration-200',
            'transform hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500 focus:ring-offset-2'
          )}
          aria-label={`Plan a trip to ${country.country_name}`}
        >
          Plan This Trip ✈️
        </button>
      </div>
    </motion.article>
  );
};
