/**
 * Trip Settings Screen Component
 * 
 * Trip-specific settings page including theme customization
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/utils/languageUtils';
import { TripThemeSettings } from '@/components/trip/TripThemeSettings';
import { Card } from '@/components/kawaii/Card';
import { Button } from '@/components/kawaii/Button';
import { NavigationWrapper, PageLayout } from '@/components/layout';
import type { NavigationTab } from '@/components/layout';
import { tripService } from '@/services/tripService';
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';
import { useToast } from '@/hooks/useToast';
import type { Trip } from '@/types/trip';

export const TripSettingsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { accessToken, user } = useEnhancedAuthStore();
  const { showSuccess, showError } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navActiveTab, setNavActiveTab] = useState<NavigationTab>('settings');

  const handleNavTabChange = (tab: NavigationTab) => {
    setNavActiveTab(tab);
    
    // Navigate to the appropriate page
    const routes: Record<string, string> = {
      schedule: `/trips/${id}`,
      booking: `/trips/${id}/booking`,
      budget: `/trips/${id}/budget`,
      shopping: `/trips/${id}/shopping`,
      checklist: `/trips/${id}/checklist`,
      members: `/trips/${id}/members`,
      settings: `/trips/${id}/settings`,
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
        showError(t('common:status.error'), t('settings.loadError', 'Failed to load trip settings'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrip();
  }, [id, accessToken]);
  
  const isOwner = trip?.owner_id === user?.id;

  const handleDeleteTrip = async () => {
    if (!window.confirm(t('common:settings.account.deleteConfirmation'))) {
      return;
    }

    try {
      if (id && accessToken) {
        await tripService.deleteTrip(id, accessToken);
        showSuccess(t('common:status.success'), t('settings.deleteSuccess', 'Trip deleted successfully'));
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to delete trip:', error);
      showError(t('common:status.error'), t('settings.deleteError', 'Failed to delete trip'));
    }
  };

  if (!id) {
    return (
      <NavigationWrapper activeTab={navActiveTab} onTabChange={handleNavTabChange}>
        <PageLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('common:errors.tripNotFound')}</h2>
            </div>
          </div>
        </PageLayout>
      </NavigationWrapper>
    );
  }

  if (isLoading) {
    return (
      <NavigationWrapper activeTab={navActiveTab} onTabChange={handleNavTabChange}>
        <PageLayout tripId={id}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('settings.loading', 'Loading trip settings...')}</p>
            </div>
          </div>
        </PageLayout>
      </NavigationWrapper>
    );
  }

  return (
    <NavigationWrapper activeTab={navActiveTab} onTabChange={handleNavTabChange}>
      <PageLayout tripId={id}>
        {/* Header Section */}
        <div className="w-full bg-gradient-to-br from-kawaii-primary-100 to-kawaii-primary-200 dark:from-kawaii-primary-900/30 dark:to-kawaii-primary-800/30">
          <div className="max-w-7xl mx-auto px-4 py-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-2">
                {trip?.title || t('settings.title', 'Trip Settings')}
              </h1>
              <p className="text-lg text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                {t('settings.subtitle', 'Customize your trip settings')}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 py-6 w-full">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Language Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-kawaii-primary-600 dark:text-kawaii-primary-400">
                  Language / 語言
                </h2>
                <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
                  Choose your preferred language for the app interface
                </p>
                
                {/* Dropdown */}
                <div className="relative">
                  <select
                    value={i18n.language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-lg border-2 border-kawaii-neutral-200 dark:border-kawaii-neutral-700 bg-white dark:bg-kawaii-neutral-800 text-kawaii-neutral-800 dark:text-kawaii-neutral-100 font-medium focus:outline-none focus:border-kawaii-primary-500 focus:ring-2 focus:ring-kawaii-primary-500/20 transition-all cursor-pointer appearance-none"
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="zh-TW">🇹🇼 繁體中文 (Traditional Chinese)</option>
                    <option value="zh-CN">🇨🇳 简体中文 (Simplified Chinese)</option>
                    <option value="ja">🇯🇵 日本語 (Japanese)</option>
                  </select>
                  
                  {/* Custom dropdown arrow */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-kawaii-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Info text */}
                <p className="mt-4 text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                  Language changes are applied immediately across the app
                </p>
              </Card>
            </motion.div>

            {/* Trip Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-kawaii-primary-600 dark:text-kawaii-primary-400">
                  {t('settings.tripInfo', 'Trip Information')}
                </h2>
                {trip && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                        {t('settings.tripName', 'Trip Name')}
                      </label>
                      <p className="text-kawaii-neutral-800 dark:text-kawaii-neutral-100 font-medium">
                        {trip.title}
                      </p>
                    </div>
                    {trip.start_date && (
                      <div>
                        <label className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                          {t('settings.startDate', 'Start Date')}
                        </label>
                        <p className="text-kawaii-neutral-800 dark:text-kawaii-neutral-100 font-medium">
                          {new Date(trip.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {trip.end_date && (
                      <div>
                        <label className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                          {t('settings.endDate', 'End Date')}
                        </label>
                        <p className="text-kawaii-neutral-800 dark:text-kawaii-neutral-100 font-medium">
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
                <Card className="p-6 border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <h2 className="text-2xl font-bold mb-2 text-red-700 dark:text-red-400">
                    {t('common:settings.account.dangerZone')}
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                    {t('common:settings.account.deleteWarning')}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleDeleteTrip}
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                  >
                    {t('settings.deleteTrip', 'Delete Trip')}
                  </Button>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </PageLayout>
    </NavigationWrapper>
  );
};
