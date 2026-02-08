/**
 * Trip Settings Screen Component
 * 
 * Trip-specific settings page including theme customization
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TripThemeSettings } from '@/components/trip/TripThemeSettings';
import { Card } from '@/components/kawaii/Card';
import { Button } from '@/components/kawaii/Button';
import { BottomNavigation } from '@/components/kawaii/BottomNavigation';
import { SideNavigation } from '@/components/kawaii/SideNavigation';
import { tripService } from '@/services/tripService';
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Trip } from '@/types/trip';

export const TripSettingsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accessToken, user } = useEnhancedAuthStore();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Responsive layout
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [navActiveTab, setNavActiveTab] = useState('settings');

  // Debug log to verify this component is rendering
  console.log('🎯 TripSettingsScreen is rendering!');
  console.log('Trip ID:', id);
  console.log('User:', user);
  console.log('Is mobile:', isMobile);

  const handleNavTabChange = (tab: string) => {
    setNavActiveTab(tab);
    
    // Navigate to the appropriate page
    const routes: Record<string, string> = {
      schedule: `/trip/${id}`,
      booking: `/trip/${id}/booking`,
      budget: `/trip/${id}/shopping`,
      shopping: `/trip/${id}/shopping`,
      checklist: `/trip/${id}/checklist`,
      members: `/trip/${id}/members`,
      settings: `/trip/${id}/settings`,
    };
    
    if (routes[tab]) {
      navigate(routes[tab]);
    }
  };

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id || !accessToken) return;
      
      try {
        const response = await tripService.getTripById(id, accessToken);
        setTrip(response.data);
      } catch (error) {
        console.error('Failed to fetch trip:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrip();
  }, [id, accessToken]);
  
  const isOwner = trip?.owner_id === user?.id;

  if (!id) {
    return <div>Trip not found</div>;
  }

  if (isLoading) {
    console.log('⏳ TripSettingsScreen: Loading trip data...');
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  console.log('✅ TripSettingsScreen: Rendering full page');
  console.log('Trip data:', trip);
  console.log('Is owner:', isOwner);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--kawaii-cream)' }}>
      {/* Desktop/Tablet: Side Navigation */}
      {!isMobile && (
        <SideNavigation 
          activeTab={navActiveTab}
          onTabChange={handleNavTabChange}
        />
      )}

      {/* Main Content */}
      <div className={!isMobile ? 'ml-64' : ''}>
        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Trip Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <TripThemeSettings tripId={id} isOwner={isOwner} />
          </Card>
        </motion.div>

        {/* Trip Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--kawaii-primary-500)' }}>
              {t('settings.tripInfo', 'Trip Information')}
            </h2>
            {trip && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-neutral-500">
                    {t('settings.tripName', 'Trip Name')}
                  </label>
                  <p className="text-neutral-800 font-medium">{trip.title}</p>
                </div>
                {trip.start_date && (
                  <div>
                    <label className="text-xs text-neutral-500">
                      {t('settings.startDate', 'Start Date')}
                    </label>
                    <p className="text-neutral-800 font-medium">
                      {new Date(trip.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {trip.end_date && (
                  <div>
                    <label className="text-xs text-neutral-500">
                      {t('settings.endDate', 'End Date')}
                    </label>
                    <p className="text-neutral-800 font-medium">
                      {new Date(trip.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Danger Zone - Only for trip owner */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-6 border-2 border-red-200 bg-red-50">
              <h2 className="text-2xl font-bold mb-2 text-red-700">
                {t('settings.dangerZone', 'Danger Zone')}
              </h2>
              <p className="text-sm text-red-600 mb-4">
                {t('settings.deleteWarning', 'Once you delete a trip, there is no going back. Please be certain.')}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm(t('settings.deleteConfirm', 'Are you sure you want to delete this trip? This action cannot be undone.'))) {
                    // TODO: Implement trip deletion
                    console.log('Delete trip:', id);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                {t('settings.deleteTrip', 'Delete Trip')}
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
      </div>

      {/* Mobile: Bottom Navigation */}
      {isMobile && (
        <BottomNavigation 
          activeTab={navActiveTab}
          onTabChange={handleNavTabChange}
        />
      )}
    </div>
  );
};
