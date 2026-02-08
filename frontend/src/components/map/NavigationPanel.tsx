import { useState, useEffect } from 'react';
import { Place } from '../../types/trip';
import { navigationService, NavigationRoute } from '../../services/navigationService';
import { Modal } from '../common/Modal';

interface NavigationPanelProps {
  places: Place[];
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationPanel({ places, isOpen, onClose }: NavigationPanelProps) {
  const [routes, setRoutes] = useState<NavigationRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  useEffect(() => {
    if (isOpen && places.length > 1) {
      loadNavigation();
    }
  }, [isOpen, places]);

  const loadNavigation = async () => {
    setIsLoading(true);
    try {
      const navigationRoutes = await navigationService.getNavigationForTrip(places);
      setRoutes(navigationRoutes);
      setSelectedRouteIndex(0);
    } catch (error) {
      console.error('Error loading navigation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoute = routes[selectedRouteIndex];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Turn-by-Turn Navigation">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">
              No navigation routes available
            </p>
          </div>
        ) : (
          <>
            {/* Route Selector */}
            {routes.length > 1 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Route Segment
                </label>
                <select
                  value={selectedRouteIndex}
                  onChange={(e) => setSelectedRouteIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {routes.map((route, index) => (
                    <option key={index} value={index}>
                      {route.origin.name} → {route.destination.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Route Summary */}
            {selectedRoute && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">From</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedRoute.origin.name}
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">To</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedRoute.destination.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-around pt-3 border-t border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Distance</p>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {selectedRoute.totalDistance}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-blue-200 dark:bg-blue-800"></div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {selectedRoute.totalDuration}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Offline Mode Notice */}
                {selectedRoute.isOffline && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        Showing simplified offline navigation. Directions are approximate and based on straight-line distance.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Steps */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Directions
                  </h3>
                  {selectedRoute.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        {step.maneuver === 'arrive' ? (
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {step.instruction}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <span>{step.distance}</span>
                          <span>•</span>
                          <span>{step.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
