import React, { useState, useEffect } from 'react';
import { Trip, TripTheme } from '../../types/trip';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CURRENCIES, getCurrencySymbol } from '../../constants/currencies';
import { useFormHandler } from '../../hooks/useFormHandler';
import { ValidationSchema, CustomValidators } from '../../services/formHandler';

interface TripEditorProps {
  trip?: Trip;
  mode: 'create' | 'edit';
  onSave: (tripData: any) => Promise<void>;
  onCancel: () => void;
}

const THEME_OPTIONS: { value: TripTheme; label: string; description: string; color: string }[] = [
  { value: 'default', label: 'Default', description: 'Classic travel style', color: 'bg-gray-500' },
  { value: 'adventure', label: 'Adventure', description: 'For thrill seekers', color: 'bg-orange-500' },
  { value: 'romantic', label: 'Romantic', description: 'Love and romance', color: 'bg-pink-500' },
  { value: 'foodie', label: 'Foodie', description: 'Culinary exploration', color: 'bg-yellow-500' },
  { value: 'chill', label: 'Chill', description: 'Relaxed vibes', color: 'bg-blue-500' },
];

export const TripEditor: React.FC<TripEditorProps> = ({
  trip,
  mode,
  onSave,
  onCancel,
}) => {
  // Define validation schema for the trip form
  const validationSchema: ValidationSchema = {
    fields: {
      title: {
        required: true,
        type: 'text',
        minLength: 1,
        maxLength: 200,
        validateOnChange: true,
      },
      destination: {
        type: 'text',
        maxLength: 200,
      },
      start_date: {
        type: 'date',
      },
      end_date: {
        type: 'date',
      },
      total_budget: {
        type: 'number',
        min: 0,
      },
    },
    customValidators: [
      // Validate that end date is after start date
      CustomValidators.dateRange('start_date', 'end_date'),
    ],
  };

  // Initialize form handler with validation schema
  const {
    values,
    setValues,
    setValue,
    errors,
    isSubmitting: formIsSubmitting,
    validateForm,
  } = useFormHandler(validationSchema, {
    initialValues: {
      title: trip?.title || '',
      destination: trip?.destination || '',
      start_date: trip?.start_date || '',
      end_date: trip?.end_date || '',
      cover_image_url: trip?.cover_image_url || '',
      theme: trip?.theme || 'default',
      total_budget: trip?.total_budget || undefined,
      currency_code: trip?.currency_code || 'USD',
      is_public: trip?.is_public ?? true,
      is_community: trip?.is_community ?? false,
    },
    validateOnChange: true,
    validateOnBlur: true,
  });

  const [imagePreview, setImagePreview] = useState<string>(trip?.cover_image_url || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Update form values when trip prop changes (for edit mode)
  useEffect(() => {
    if (trip) {
      setValues({
        title: trip.title || '',
        destination: trip.destination || '',
        start_date: trip.start_date || '',
        end_date: trip.end_date || '',
        cover_image_url: trip.cover_image_url || '',
        theme: trip.theme || 'default',
        total_budget: trip.total_budget || undefined,
        currency_code: trip.currency_code || 'USD',
        is_public: trip.is_public ?? true,
        is_community: trip.is_community ?? false,
      });
      setImagePreview(trip.cover_image_url || '');
    }
  }, [trip, setValues]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValue(name, fieldValue);
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleThemeSelect = (theme: TripTheme) => {
    setValue('theme', theme);
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSubmitError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error
      setSubmitError('');
    }
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                  resolve(reader.result as string);
                };
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous submit errors
    setSubmitError('');

    // Validate form using FormHandler
    if (!validateForm()) {
      setSubmitError('Please fix the errors before submitting');
      return;
    }

    // Prevent duplicate submissions
    if (isProcessing || formIsSubmitting) {
      return;
    }

    setIsProcessing(true);

    try {
      let tripData = { ...values };

      // Compress and upload image if a new file was selected
      if (imageFile) {
        const compressedImage = await compressImage(imageFile);
        tripData.cover_image_url = compressedImage;
      }

      // Clean up empty strings
      const cleanedData: any = { ...tripData };
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === '') {
          cleanedData[key] = undefined;
        }
      });
      tripData = cleanedData;

      // Call the onSave callback provided by parent
      await onSave(tripData);
      
      // Success - parent component will handle navigation and success message
    } catch (error: any) {
      console.error('Error saving trip:', error);
      
      // Display user-friendly error message
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to save trip. Please try again.';
      setSubmitError(errorMessage);
      
      // If there are field-specific errors, we could handle them here
      if (error?.response?.data?.errors) {
        // Field errors are already handled by FormHandler
        console.error('Field errors:', error.response.data.errors);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="Trip Title"
        name="title"
        value={values.title}
        onChange={handleInputChange}
        placeholder="e.g., Tokyo Adventure 2025"
        required
        error={errors.title}
      />

      {/* Destination */}
      <Input
        label="Destination"
        name="destination"
        value={values.destination}
        onChange={handleInputChange}
        placeholder="e.g., Tokyo, Japan"
        error={errors.destination}
      />

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          name="start_date"
          type="date"
          value={values.start_date}
          onChange={handleInputChange}
          error={errors.start_date}
        />
        <Input
          label="End Date"
          name="end_date"
          type="date"
          value={values.end_date}
          onChange={handleInputChange}
          error={errors.end_date}
        />
      </div>

      {/* Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Total Budget (Optional)"
          name="total_budget"
          type="number"
          value={values.total_budget || ''}
          onChange={handleInputChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          error={errors.total_budget}
          helperText={
            values.total_budget && values.start_date && values.end_date
              ? `Daily budget: ${getCurrencySymbol(values.currency_code || 'USD')}${(
                  values.total_budget /
                  Math.max(
                    1,
                    Math.ceil(
                      (new Date(values.end_date).getTime() -
                        new Date(values.start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1
                  )
                ).toFixed(2)}`
              : undefined
          }
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency
          </label>
          <select
            name="currency_code"
            value={values.currency_code}
            onChange={(e) => {
              setValue('currency_code', e.target.value);
              if (submitError) {
                setSubmitError('');
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
          {errors.currency_code && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currency_code}</p>
          )}
        </div>
      </div>

      {/* Theme Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Theme
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => handleThemeSelect(theme.value)}
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${
                  values.theme === theme.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className={`w-8 h-8 rounded-full ${theme.color} mb-2`} />
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                {theme.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {theme.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cover Image
        </label>
        <div className="space-y-3">
          {imagePreview && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img
                src={imagePreview}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview('');
                  setImageFile(null);
                  setValue('cover_image_url', '');
                  if (submitError) {
                    setSubmitError('');
                  }
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900/20 dark:file:text-blue-400
              dark:hover:file:bg-blue-900/30"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Max file size: 5MB. Image will be compressed automatically.
          </p>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="is_public"
            checked={values.is_public}
            onChange={handleInputChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Make this trip public (anyone with the link can view)
          </span>
        </label>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="is_community"
            checked={values.is_community}
            onChange={handleInputChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Post to community feed
          </span>
        </label>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel} 
          disabled={isProcessing || formIsSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          isLoading={isProcessing || formIsSubmitting}
          disabled={isProcessing || formIsSubmitting}
        >
          {mode === 'create' ? 'Create Trip' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
