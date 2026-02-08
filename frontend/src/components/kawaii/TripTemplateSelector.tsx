/**
 * TripTemplateSelector Component
 * 
 * Displays template options for new trip creation with visual cards and illustrations.
 * Supports beach, mountain, city, cultural, and custom templates.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import {
  Waves,
  Mountain,
  Building2,
  Landmark,
  Sparkles,
} from 'lucide-react';

export type TripTemplate = 'beach' | 'mountain' | 'city' | 'cultural' | 'custom';

export interface TripTemplateOption {
  id: TripTemplate;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

export interface TripTemplateSelectorProps {
  selectedTemplate?: TripTemplate;
  onSelect: (template: TripTemplate) => void;
  className?: string;
}

export const TripTemplateSelector: React.FC<TripTemplateSelectorProps> = ({
  selectedTemplate,
  onSelect,
  className,
}) => {
  const { t } = useTranslation();

  const templates: TripTemplateOption[] = [
    {
      id: 'beach',
      name: t('tripTemplate.beach.name', 'Beach Paradise'),
      description: t('tripTemplate.beach.description', 'Relax by the ocean with sun and sand'),
      icon: <Waves className="w-8 h-8" />,
      color: '#4FC3F7',
      gradient: 'from-blue-400 to-cyan-300',
    },
    {
      id: 'mountain',
      name: t('tripTemplate.mountain.name', 'Mountain Adventure'),
      description: t('tripTemplate.mountain.description', 'Explore peaks and scenic trails'),
      icon: <Mountain className="w-8 h-8" />,
      color: '#81C784',
      gradient: 'from-green-400 to-emerald-300',
    },
    {
      id: 'city',
      name: t('tripTemplate.city.name', 'City Explorer'),
      description: t('tripTemplate.city.description', 'Discover urban culture and nightlife'),
      icon: <Building2 className="w-8 h-8" />,
      color: '#9575CD',
      gradient: 'from-purple-400 to-violet-300',
    },
    {
      id: 'cultural',
      name: t('tripTemplate.cultural.name', 'Cultural Journey'),
      description: t('tripTemplate.cultural.description', 'Immerse in history and traditions'),
      icon: <Landmark className="w-8 h-8" />,
      color: '#FFB74D',
      gradient: 'from-orange-400 to-amber-300',
    },
    {
      id: 'custom',
      name: t('tripTemplate.custom.name', 'Custom Trip'),
      description: t('tripTemplate.custom.description', 'Create your own unique adventure'),
      icon: <Sparkles className="w-8 h-8" />,
      color: '#F06292',
      gradient: 'from-pink-400 to-rose-300',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('tripTemplate.title', 'Choose Your Trip Style')}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('tripTemplate.subtitle', 'Select a template to get started with personalized suggestions')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                'relative group',
                'flex flex-col items-center',
                'p-6 rounded-2xl',
                'border-2 transition-all duration-300',
                'hover:shadow-lg hover:-translate-y-1',
                'active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600',
                'focus:ring-primary-500'
              )}
              aria-pressed={isSelected}
            >
              {/* Icon with gradient background */}
              <div
                className={cn(
                  'w-16 h-16 rounded-full',
                  'flex items-center justify-center',
                  'mb-4 transition-transform duration-300',
                  'group-hover:scale-110',
                  `bg-gradient-to-br ${template.gradient}`,
                  'text-white shadow-md'
                )}
              >
                {template.icon}
              </div>

              {/* Template name */}
              <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2 text-center">
                {template.name}
              </h4>

              {/* Template description */}
              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center line-clamp-2">
                {template.description}
              </p>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
