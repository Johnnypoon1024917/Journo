/**
 * TripBasicInfoForm Component
 * 
 * Collects basic trip information including name, destination, dates, and number of travelers.
 * Includes validation for required fields and date ranges.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export interface TripBasicInfo {
  title: string;
  destination: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  travelers: number;
}

export interface TripBasicInfoFormProps {
  initialData?: Partial<TripBasicInfo>;
  onChange: (data: TripBasicInfo) => void;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
}

export const TripBasicInfoForm: React.FC<TripBasicInfoFormProps> = ({
  initialData,
  onChange,
  onValidationChange,
  className,
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<TripBasicInfo>({
    title: initialData?.title || '',
    destination: initialData?.destination || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    travelers: initialData?.travelers || 1,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TripBasicInfo, string>>>({});

  // Validate form data
  const validateForm = (data: TripBasicInfo): boolean => {
    const newErrors: Partial<Record<keyof TripBasicInfo, string>> = {};

    // Validate title
    if (!data.title.trim()) {
      newErrors.title = t('tripForm.errors.titleRequired', 'Trip name is required');
    } else if (data.title.length > 100) {
      newErrors.title = t('tripForm.errors.titleTooLong', 'Trip name must be less than 100 characters');
    }

    // Validate destination
    if (!data.destination.trim()) {
      newErrors.destination = t('tripForm.errors.destinationRequired', 'Destination is required');
    }

    // Validate dates
    if (!data.startDate) {
      newErrors.startDate = t('tripForm.errors.startDateRequired', 'Start date is required');
    }

    if (!data.endDate) {
      newErrors.endDate = t('tripForm.errors.endDateRequired', 'End date is required');
    }

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);

      if (isAfter(start, end)) {
        newErrors.endDate = t('tripForm.errors.endDateBeforeStart', 'End date must be after start date');
      }

      // Check if trip is too long (more than 365 days)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        newErrors.endDate = t('tripForm.errors.tripTooLong', 'Trip cannot be longer than 365 days');
      }
    }

    // Validate travelers
    if (data.travelers < 1) {
      newErrors.travelers = t('tripForm.errors.travelersMin', 'At least 1 traveler is required');
    } else if (data.travelers > 50) {
      newErrors.travelers = t('tripForm.errors.travelersMax', 'Maximum 50 travelers allowed');
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    if (onValidationChange) {
      onValidationChange(isValid);
    }

    return isValid;
  };

  // Handle field changes
  const handleChange = (field: keyof TripBasicInfo, value: string | number) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    validateForm(newData);
    onChange(newData);
  };

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  // Get minimum end date (start date + 1 day)
  const minEndDate = formData.startDate
    ? format(addDays(new Date(formData.startDate), 1), 'yyyy-MM-dd')
    : today;

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('tripForm.title', 'Trip Details')}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('tripForm.subtitle', 'Tell us about your upcoming adventure')}
        </p>
      </div>

      <div className="space-y-4">
        {/* Trip Name */}
        <div>
          <label
            htmlFor="trip-title"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            {t('tripForm.fields.title', 'Trip Name')} <span className="text-error-500">*</span>
          </label>
          <input
            id="trip-title"
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={t('tripForm.placeholders.title', 'e.g., Tokyo Winter Adventure')}
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'border-2 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
              'placeholder:text-neutral-400',
              errors.title
                ? 'border-error-500 bg-error-50 dark:bg-error-900/20'
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
            )}
            maxLength={100}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.title}
            </p>
          )}
        </div>

        {/* Destination */}
        <div>
          <label
            htmlFor="trip-destination"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            {t('tripForm.fields.destination', 'Destination')} <span className="text-error-500">*</span>
          </label>
          <input
            id="trip-destination"
            type="text"
            value={formData.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
            placeholder={t('tripForm.placeholders.destination', 'e.g., Tokyo, Japan')}
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'border-2 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
              'placeholder:text-neutral-400',
              errors.destination
                ? 'border-error-500 bg-error-50 dark:bg-error-900/20'
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
            )}
            aria-invalid={!!errors.destination}
            aria-describedby={errors.destination ? 'destination-error' : undefined}
          />
          {errors.destination && (
            <p id="destination-error" className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.destination}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label
              htmlFor="trip-start-date"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              {t('tripForm.fields.startDate', 'Start Date')} <span className="text-error-500">*</span>
            </label>
            <input
              id="trip-start-date"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              min={today}
              className={cn(
                'w-full px-4 py-3 rounded-lg',
                'border-2 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                errors.startDate
                  ? 'border-error-500 bg-error-50 dark:bg-error-900/20'
                  : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
              )}
              aria-invalid={!!errors.startDate}
              aria-describedby={errors.startDate ? 'start-date-error' : undefined}
            />
            {errors.startDate && (
              <p id="start-date-error" className="mt-1 text-sm text-error-600 dark:text-error-400">
                {errors.startDate}
              </p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="trip-end-date"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              {t('tripForm.fields.endDate', 'End Date')} <span className="text-error-500">*</span>
            </label>
            <input
              id="trip-end-date"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              min={minEndDate}
              className={cn(
                'w-full px-4 py-3 rounded-lg',
                'border-2 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                errors.endDate
                  ? 'border-error-500 bg-error-50 dark:bg-error-900/20'
                  : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
              )}
              aria-invalid={!!errors.endDate}
              aria-describedby={errors.endDate ? 'end-date-error' : undefined}
            />
            {errors.endDate && (
              <p id="end-date-error" className="mt-1 text-sm text-error-600 dark:text-error-400">
                {errors.endDate}
              </p>
            )}
          </div>
        </div>

        {/* Number of Travelers */}
        <div>
          <label
            htmlFor="trip-travelers"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            {t('tripForm.fields.travelers', 'Number of Travelers')} <span className="text-error-500">*</span>
          </label>
          <input
            id="trip-travelers"
            type="number"
            value={formData.travelers}
            onChange={(e) => handleChange('travelers', parseInt(e.target.value, 10) || 1)}
            min={1}
            max={50}
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'border-2 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
              errors.travelers
                ? 'border-error-500 bg-error-50 dark:bg-error-900/20'
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
            )}
            aria-invalid={!!errors.travelers}
            aria-describedby={errors.travelers ? 'travelers-error' : undefined}
          />
          {errors.travelers && (
            <p id="travelers-error" className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.travelers}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
