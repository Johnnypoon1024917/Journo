/**
 * DiscoveryWidget Component
 * 
 * Interactive widget for discovering travel destinations based on preferences.
 * Replaces static "Discover Your Next Adventure" section with dynamic functionality.
 * 
 * Features:
 * - Month and weather preference selection via DiscoveryForm
 * - Integration with country recommendations API
 * - Loading states with skeleton loaders
 * - Error handling with friendly messages
 * - Display 3-6 destination results
 * - BubbleQuest theming
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { DiscoveryForm } from './DiscoveryForm';
import { DestinationResults } from './DestinationResults';
import { DiscoveryEmptyState } from './DiscoveryEmptyState';
import { DiscoveryErrorState } from './DiscoveryErrorState';
import { DestinationCardsSkeleton } from '../common/SkeletonCard';
import { DestinationService } from '../../services/destinationService';
import { CountryRecommendation, WeatherPreference } from '../../types/countryRecommendation';
import { useNavigate } from 'react-router-dom';

export interface DiscoveryWidgetProps {
  className?: string;
}

export const DiscoveryWidget: React.FC<DiscoveryWidgetProps> = ({ className }) => {
  // Get current month as default
  const currentMonth = new Date().getMonth() + 1;
  const navigate = useNavigate();
  
  const [month, setMonth] = useState<number>(currentMonth);
  const [weatherPreference, setWeatherPreference] = useState<WeatherPreference>('Any');
  const [countries, setCountries] = useState<CountryRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await DestinationService.getCountryRecommendations({
        month,
        weatherPreference
      });
      
      // Limit to 6 results for display
      setCountries(results.slice(0, 6));
    } catch (err: any) {
      console.error('Error fetching country recommendations:', err);
      setError(err.message || 'Failed to load recommendations. Please try again.');
      setCountries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanTrip = (country: CountryRecommendation) => {
    // Navigate to country recommendations page with pre-selected country
    navigate('/country-recommendations', { 
      state: { 
        selectedCountry: country,
        month,
        weatherPreference 
      } 
    });
  };

  return (
    <motion.div
      className={cn(
        'bg-gradient-to-br from-bubblequest-primary-50 to-bubblequest-secondary-50',
        'dark:from-bubblequest-primary-900/20 dark:to-bubblequest-secondary-900/20',
        'rounded-3xl p-8',
        'border-2 border-bubblequest-primary-200 dark:border-bubblequest-primary-700',
        'shadow-lg',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          className="inline-block mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-3">
          Discover Your Next Adventure
        </h2>
        <p className="text-lg text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
          Tell us when you want to travel and we'll find the perfect destinations
        </p>
      </div>

      {/* Discovery Form */}
      <div className="max-w-md mx-auto mb-8">
        <DiscoveryForm
          month={month}
          weatherPreference={weatherPreference}
          onMonthChange={setMonth}
          onWeatherChange={setWeatherPreference}
          onSubmit={handleSearch}
          isLoading={isLoading}
        />
      </div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DestinationCardsSkeleton count={4} />
          </motion.div>
        )}

        {error && !isLoading && (
          <DiscoveryErrorState
            key="error"
            error={error}
            onRetry={handleSearch}
          />
        )}

        {!isLoading && !error && hasSearched && countries.length === 0 && (
          <DiscoveryEmptyState key="empty" />
        )}

        {!isLoading && !error && countries.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DestinationResults
              countries={countries}
              onPlanTrip={handlePlanTrip}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
