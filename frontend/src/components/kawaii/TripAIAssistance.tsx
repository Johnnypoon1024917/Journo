/**
 * TripAIAssistance Component
 * 
 * Provides optional AI-generated itinerary suggestions and themed stickers for trip creation.
 * Integrates with Quick Plan service for itinerary generation and Sticker service for themed stickers.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { Sparkles, Lightbulb } from 'lucide-react';
import type { TripBasicInfo } from './TripBasicInfoForm';
import type { TripTemplate } from './TripTemplateSelector';

export interface AIAssistanceConfig {
  enabled: boolean;
  generateItinerary: boolean;
  generateStickers: boolean;
  interests: string[];
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced';
  budgetLevel: 'low' | 'medium' | 'high';
}

export interface TripAIAssistanceProps {
  tripInfo?: TripBasicInfo; // Optional, used for context
  template: TripTemplate;
  initialConfig?: Partial<AIAssistanceConfig>;
  onChange: (config: AIAssistanceConfig) => void;
  className?: string;
}

export const TripAIAssistance: React.FC<TripAIAssistanceProps> = ({
  template,
  initialConfig,
  onChange,
  className,
}) => {
  const { t } = useTranslation();

  const [config, setConfig] = useState<AIAssistanceConfig>({
    enabled: initialConfig?.enabled ?? true,
    generateItinerary: initialConfig?.generateItinerary ?? true,
    generateStickers: initialConfig?.generateStickers ?? true,
    interests: initialConfig?.interests ?? [],
    travelStyle: initialConfig?.travelStyle ?? 'moderate',
    budgetLevel: initialConfig?.budgetLevel ?? 'medium',
  });

  // Update config and notify parent
  const updateConfig = (updates: Partial<AIAssistanceConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange(newConfig);
  };

  // Interest options based on template
  const getInterestOptions = (): string[] => {
    const baseInterests = [
      'sightseeing',
      'food',
      'shopping',
      'culture',
      'nature',
      'photography',
      'adventure',
      'relaxation',
    ];

    // Add template-specific interests
    switch (template) {
      case 'beach':
        return [...baseInterests, 'beach', 'water-sports', 'sunset'];
      case 'mountain':
        return [...baseInterests, 'hiking', 'skiing', 'camping'];
      case 'city':
        return [...baseInterests, 'nightlife', 'museums', 'architecture'];
      case 'cultural':
        return [...baseInterests, 'history', 'temples', 'local-cuisine'];
      default:
        return baseInterests;
    }
  };

  const interestOptions = getInterestOptions();

  const toggleInterest = (interest: string) => {
    const newInterests = config.interests.includes(interest)
      ? config.interests.filter((i) => i !== interest)
      : [...config.interests, interest];
    updateConfig({ interests: newInterests });
  };

  if (!config.enabled) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-neutral-400" />
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('tripAI.title', 'AI Assistance')}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('tripAI.disabled', 'AI assistance is disabled')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateConfig({ enabled: true })}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            {t('tripAI.enable', 'Enable')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('tripAI.title', 'AI Assistance')}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('tripAI.subtitle', 'Let AI help plan your perfect trip')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => updateConfig({ enabled: false })}
          className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          {t('tripAI.disable', 'Disable')}
        </button>
      </div>

      {/* AI Features */}
      <div className="space-y-3">
        {/* Generate Itinerary */}
        <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
          <input
            type="checkbox"
            checked={config.generateItinerary}
            onChange={(e) => updateConfig({ generateItinerary: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          <div className="flex-1">
            <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              {t('tripAI.generateItinerary', 'Generate Itinerary')}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('tripAI.generateItineraryDesc', 'AI will suggest attractions, restaurants, and daily schedules based on your preferences')}
            </div>
          </div>
        </label>

        {/* Generate Stickers */}
        <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
          <input
            type="checkbox"
            checked={config.generateStickers}
            onChange={(e) => updateConfig({ generateStickers: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          <div className="flex-1">
            <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              {t('tripAI.generateStickers', 'Generate Themed Stickers')}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('tripAI.generateStickersDesc', 'AI will create custom kawaii stickers matching your destination and season')}
            </div>
          </div>
        </label>
      </div>

      {/* Preferences (shown if itinerary generation is enabled) */}
      {config.generateItinerary && (
        <div className="space-y-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <Lightbulb className="w-5 h-5" />
            {t('tripAI.preferences', 'Your Preferences')}
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('tripAI.interests', 'Interests')}
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => {
                const isSelected = config.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      'border-2',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                    )}
                  >
                    {t(`tripAI.interest.${interest}`, interest)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('tripAI.travelStyle', 'Travel Style')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['relaxed', 'moderate', 'fast-paced'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateConfig({ travelStyle: style })}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2',
                    config.travelStyle === style
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                  )}
                >
                  {t(`tripAI.travelStyle.${style}`, style)}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Level */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('tripAI.budgetLevel', 'Budget Level')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateConfig({ budgetLevel: level })}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2',
                    config.budgetLevel === level
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                  )}
                >
                  {t(`tripAI.budgetLevel.${level}`, level)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
