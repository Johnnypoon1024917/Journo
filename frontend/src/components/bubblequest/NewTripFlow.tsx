/**
 * NewTripFlow Component
 * 
 * Multi-step wizard for creating a new trip with:
 * - Template selection
 * - Basic information
 * - Theme customization
 * - AI assistance (optional)
 * 
 * Includes progress indicator and navigation between steps.
 * Navigates to schedule screen on completion.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';
import { useBubbleQuestThemeStore } from '@/stores/bubbleQuestThemeStore';
import { tripService } from '@/services/tripService';
import { quickPlanService } from '@/services/quickPlanService';
import stickerService from '@/services/stickerService';
import { Button } from '@/design-system/atoms/Button';
import { TripTemplateSelector, TripTemplate } from './TripTemplateSelector';
import { TripBasicInfoForm, TripBasicInfo } from './TripBasicInfoForm';
import { TripThemeSelector, TripThemeConfig } from './TripThemeSelector';
import { TripAIAssistance, AIAssistanceConfig } from './TripAIAssistance';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

type Step = 'template' | 'info' | 'theme' | 'ai';

export interface NewTripFlowProps {
  onCancel?: () => void;
  onComplete?: (tripId: string) => void;
  className?: string;
}

export const NewTripFlow: React.FC<NewTripFlowProps> = ({
  onCancel,
  onComplete,
  className,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useEnhancedAuthStore();
  const { setPrimaryColor, setAnimations } = useBubbleQuestThemeStore();

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  // Form data
  const [template, setTemplate] = useState<TripTemplate>('custom');
  const [tripInfo, setTripInfo] = useState<TripBasicInfo>({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
  });
  const [theme, setTheme] = useState<TripThemeConfig>({
    primaryColor: 'var(--bubblequest-primary-500)',
    stickerStyle: 'cute',
    animations: 'none',
  });
  const [aiConfig, setAIConfig] = useState<AIAssistanceConfig>({
    enabled: true,
    generateItinerary: true,
    generateStickers: true,
    interests: [],
    travelStyle: 'moderate',
    budgetLevel: 'medium',
  });

  // Validation and loading states
  const [isInfoValid, setIsInfoValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step configuration
  const steps: Array<{ id: Step; label: string; optional?: boolean }> = [
    { id: 'template', label: t('newTrip.steps.template', 'Template') },
    { id: 'info', label: t('newTrip.steps.info', 'Details') },
    { id: 'theme', label: t('newTrip.steps.theme', 'Theme') },
    { id: 'ai', label: t('newTrip.steps.ai', 'AI Assist'), optional: true },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Navigation
  const goToNextStep = () => {
    if (isLastStep) return;
    
    // Mark current step as completed
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    
    // Move to next step
    const nextStep = steps[currentStepIndex + 1];
    setCurrentStep(nextStep.id);
  };

  const goToPreviousStep = () => {
    if (isFirstStep) return;
    const previousStep = steps[currentStepIndex - 1];
    setCurrentStep(previousStep.id);
  };

  // Check if current step can proceed
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'template':
        return true; // Template is always valid (has default)
      case 'info':
        return isInfoValid;
      case 'theme':
        return true; // Theme is always valid (has defaults)
      case 'ai':
        return true; // AI config is optional
      default:
        return false;
    }
  };

  // Create trip
  const handleCreateTrip = async () => {
    if (!accessToken) {
      setError(t('newTrip.errors.notAuthenticated', 'Please log in to create a trip'));
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Apply theme settings
      setPrimaryColor(theme.primaryColor);
      setAnimations(theme.animations);

      // Create trip with basic info
      const tripData = {
        title: tripInfo.title,
        destination: tripInfo.destination,
        start_date: tripInfo.startDate,
        end_date: tripInfo.endDate,
        theme: template as any, // Map template to TripTheme
        total_budget: 0,
        currency_code: 'USD',
      };

      const response = await tripService.createTrip(tripData, accessToken);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create trip');
      }

      const tripId = response.data.id;

      // Generate AI content if enabled
      if (aiConfig.enabled) {
        const promises: Promise<any>[] = [];

        // Generate itinerary
        if (aiConfig.generateItinerary) {
          const quickPlanRequest = {
            destination: tripInfo.destination,
            startDate: tripInfo.startDate,
            endDate: tripInfo.endDate,
            duration: Math.ceil(
              (new Date(tripInfo.endDate).getTime() - new Date(tripInfo.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            ),
            interests: aiConfig.interests,
            travelStyle: aiConfig.travelStyle,
            budgetLevel: aiConfig.budgetLevel,
            groupSize: tripInfo.travelers,
          };

          promises.push(
            quickPlanService.generateSuggestions(quickPlanRequest as any).catch((err) => {
              console.error('Failed to generate itinerary:', err);
              return null;
            })
          );
        }

        // Generate stickers
        if (aiConfig.generateStickers) {
          const season = stickerService.getSeasonFromDate(new Date(tripInfo.startDate));
          
          promises.push(
            stickerService
              .getStickers()
              .catch((err: any) => {
                console.error('Failed to get stickers:', err);
                return null;
              })
          );
        }

        // Wait for AI generation (but don't block on failures)
        await Promise.allSettled(promises);
      }

      // Navigate to trip schedule
      if (onComplete) {
        onComplete(tripId);
      } else {
        navigate(`/trip/${tripId}/schedule`);
      }
    } catch (err: any) {
      console.error('Error creating trip:', err);
      setError(err.message || t('newTrip.errors.createFailed', 'Failed to create trip. Please try again.'));
      setIsCreating(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <TripTemplateSelector
            selectedTemplate={template}
            onSelect={setTemplate}
          />
        );
      case 'info':
        return (
          <TripBasicInfoForm
            initialData={tripInfo}
            onChange={setTripInfo}
            onValidationChange={setIsInfoValid}
          />
        );
      case 'theme':
        return (
          <TripThemeSelector
            initialTheme={theme}
            onChange={setTheme}
          />
        );
      case 'ai':
        return (
          <TripAIAssistance
            tripInfo={tripInfo}
            template={template}
            initialConfig={aiConfig}
            onChange={setAIConfig}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('newTrip.title', 'Create New Trip')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t('newTrip.subtitle', 'Plan your next adventure with AI assistance')}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = completedSteps.has(step.id);
            const isPast = index < currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPast || isCompleted) {
                        setCurrentStep(step.id);
                      }
                    }}
                    disabled={!isPast && !isCompleted && !isActive}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'font-semibold text-sm transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                      isActive && 'bg-primary-500 text-white shadow-lg scale-110',
                      isCompleted && 'bg-primary-500 text-white',
                      !isActive && !isCompleted && 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400',
                      (isPast || isCompleted) && 'cursor-pointer hover:scale-105'
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </button>
                  <div className="mt-2 text-xs font-medium text-center">
                    <div className={cn(
                      isActive && 'text-primary-600 dark:text-primary-400',
                      !isActive && 'text-neutral-600 dark:text-neutral-400'
                    )}>
                      {step.label}
                    </div>
                    {step.optional && (
                      <div className="text-neutral-500 dark:text-neutral-500">
                        {t('newTrip.optional', '(Optional)')}
                      </div>
                    )}
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 transition-colors',
                      isPast || isCompleted
                        ? 'bg-primary-500'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8 min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
          <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {!isFirstStep && (
            <Button
              variant="secondary"
              onClick={goToPreviousStep}
              disabled={isCreating}
              icon={<ArrowLeft />}
              iconPosition="left"
            >
              {t('newTrip.back', 'Back')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isCreating}
            >
              {t('newTrip.cancel', 'Cancel')}
            </Button>
          )}

          {!isLastStep ? (
            <Button
              variant="primary"
              onClick={goToNextStep}
              disabled={!canProceed() || isCreating}
              icon={<ArrowRight />}
              iconPosition="right"
            >
              {t('newTrip.next', 'Next')}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCreateTrip}
              disabled={!canProceed() || isCreating}
              loading={isCreating}
              icon={<Check />}
              iconPosition="right"
            >
              {isCreating
                ? t('newTrip.creating', 'Creating...')
                : t('newTrip.create', 'Create Trip')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
