/**
 * Country Recommendations Page
 * 
 * Main page for discovering travel destinations based on month and weather preferences.
 * Integrates RecommendationSelector and CountryCardGrid components with real-time filtering.
 * 
 * Features:
 * - Month and weather preference selection
 * - Real-time client-side filtering
 * - Loading states
 * - Error boundary for graceful error handling
 * - BubbleQuest theming
 * - Responsive layout
 * 
 * Requirements: 6.6
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { RecommendationSelector } from '../components/destination/RecommendationSelector';
import { CountryCardGrid } from '../components/destination/CountryCardGrid';
import { EnhancedErrorBoundary } from '../components/common/EnhancedErrorBoundary';
import { 
  CountryRecommendation, 
  RecommendationFilters 
} from '../types/countryRecommendation';
import { filterByMonth, filterByWeather } from '../utils/countryFiltering';

export const CountryRecommendations: React.FC = () => {
  const [allCountries, setAllCountries] = useState<CountryRecommendation[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<CountryRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<RecommendationFilters>({
    month: new Date().getMonth() + 1,
    weatherPreference: 'Any',
    useGeolocation: false
  });

  /**
   * Handle search results from RecommendationSelector
   * Stores all countries for client-side filtering
   */
  const handleSearch = (countries: CountryRecommendation[]) => {
    setAllCountries(countries);
    setIsLoading(false);
  };

  /**
   * Handle filter changes from RecommendationSelector
   * Updates current filters for real-time filtering
   */
  const handleFiltersChange = (filters: RecommendationFilters) => {
    setCurrentFilters(filters);
  };

  /**
   * Apply real-time client-side filtering whenever filters or countries change
   * Implements Requirements 6.2, 6.3, 6.4, 6.5, 8.2
   */
  useEffect(() => {
    if (allCountries.length === 0) {
      setFilteredCountries([]);
      return;
    }

    let results = [...allCountries];

    // Filter by month (if specified)
    if (currentFilters.month) {
      results = filterByMonth(results, currentFilters.month);
    }

    // Filter by weather preference
    if (currentFilters.weatherPreference) {
      results = filterByWeather(results, currentFilters.weatherPreference);
    }

    // Note: Geolocation prioritization is optional and not yet implemented
    // When useGeolocation hook is available, uncomment:
    // if (currentFilters.useGeolocation && location?.region) {
    //   results = prioritizeByRegion(results, location.region);
    // }

    setFilteredCountries(results);
  }, [allCountries, currentFilters]);

  return (
    <EnhancedErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-bubblequest-cream-50 via-bubblequest-primary-50/30 to-bubblequest-secondary-50/30 dark:from-bubblequest-neutral-900 dark:via-bubblequest-neutral-800 dark:to-bubblequest-neutral-900">
        {/* Skip Link for Keyboard Navigation */}
        <a
          href="#main-content"
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-bubblequest-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Header */}
        <header 
          className="sticky top-0 z-50 bg-white/80 dark:bg-bubblequest-neutral-900/80 backdrop-blur-md border-b border-bubblequest-primary-100 dark:border-bubblequest-neutral-700 shadow-sm"
          role="banner"
        >
          <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link 
                to="/" 
                className="flex items-center space-x-2 focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500 focus:ring-offset-2 rounded-lg"
                aria-label="Journo home page"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-bubblequest-primary-400 to-bubblequest-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl" aria-hidden="true">J</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-bubblequest-primary-600 to-bubblequest-secondary-600 bg-clip-text text-transparent">
                  journo
                </span>
              </Link>

              <Link
                to="/"
                className="text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 hover:text-bubblequest-primary-600 dark:hover:text-bubblequest-primary-400 px-4 py-2 rounded-full hover:bg-bubblequest-primary-50 dark:hover:bg-bubblequest-neutral-800 transition-all focus:outline-none focus:ring-3 focus:ring-bubblequest-primary-500 focus:ring-offset-2 min-h-touch"
                aria-label="Go back to home page"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main 
          id="main-content"
          className="max-w-screen-xl mx-auto px-6 lg:px-8 py-12"
          role="main"
        >
          {/* Hero Section */}
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              aria-hidden="true"
            >
              <span className="text-7xl">🌍</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-bubblequest-primary-600 via-bubblequest-secondary-600 to-bubblequest-primary-600 bg-clip-text text-transparent">
                Discover Your Next
              </span>
              <br />
              <span className="text-bubblequest-neutral-800 dark:text-bubblequest-neutral-100">
                Adventure
              </span>
            </h1>
            
            <p className="text-xl text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 max-w-2xl mx-auto">
              Find the perfect destination based on your travel month and weather preferences
            </p>
          </motion.div>

          {/* Recommendation Selector */}
          <motion.section
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            aria-label="Search filters"
          >
            <RecommendationSelector
              onSearch={handleSearch}
              onFiltersChange={handleFiltersChange}
              isLoading={isLoading}
            />
          </motion.section>

          {/* Geolocation Note */}
          {currentFilters.useGeolocation && (
            <motion.div
              className="mb-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
              aria-live="polite"
            >
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📍 Regional prioritization is enabled but not yet fully implemented. Showing all matching destinations.
              </p>
            </motion.div>
          )}

          {/* Results Header */}
          {filteredCountries.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <h2 className="text-2xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
                {filteredCountries.length} {filteredCountries.length === 1 ? 'Destination' : 'Destinations'} Found
              </h2>
              <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mt-1">
                Perfect for your travel plans
              </p>
            </motion.div>
          )}

          {/* Country Card Grid */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            aria-label="Country recommendations"
          >
            <CountryCardGrid
              countries={filteredCountries}
              isLoading={isLoading}
            />
          </motion.section>
        </main>

        {/* Footer */}
        <footer 
          className="border-t border-bubblequest-primary-100 dark:border-bubblequest-neutral-700 bg-white/80 dark:bg-bubblequest-neutral-900/80 backdrop-blur-md py-12 px-6 mt-20"
          role="contentinfo"
        >
          <div className="max-w-screen-xl mx-auto text-center">
            <p className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
              &copy; 2024 Journo. Made with 💖 for travelers
            </p>
          </div>
        </footer>
      </div>
    </EnhancedErrorBoundary>
  );
};

export default CountryRecommendations;
