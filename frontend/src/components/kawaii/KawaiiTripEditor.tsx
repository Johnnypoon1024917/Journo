import React, { useState, useEffect } from 'react';
import { Trip, TripTheme } from '../../types/trip';
import { CURRENCIES } from '../../constants/currencies';
import { useFormHandler } from '../../hooks/useFormHandler';
import { ValidationSchema, CustomValidators } from '../../services/formHandler';
import { Button as KawaiiButton } from './Button';
import { Input as KawaiiInput } from './Input';

interface KawaiiTripEditorProps {
  trip?: Trip;
  mode: 'create' | 'edit';
  onSave: (tripData: any) => Promise<void>;
  onCancel: () => void;
}

const KAWAII_THEME_OPTIONS: { value: TripTheme; label: string; emoji: string; color: string }[] = [
  { value: 'default', label: 'Classic', emoji: '✨', color: 'from-purple-400 to-pink-400' },
  { value: 'adventure', label: 'Adventure', emoji: '🏔️', color: 'from-orange-400 to-red-400' },
  { value: 'romantic', label: 'Romantic', emoji: '💕', color: 'from-pink-400 to-rose-400' },
  { value: 'foodie', label: 'Foodie', emoji: '🍜', color: 'from-yellow-400 to-orange-400' },
  { value: 'chill', label: 'Chill', emoji: '🌊', color: 'from-blue-400 to-cyan-400' },
];

export const KawaiiTripEditor: React.FC<KawaiiTripEditorProps> = ({
  trip,
  mode,
  onSave,
  onCancel,
}) => {
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
        required: true,
        type: 'text',
        maxLength: 200,
      },
      start_date: {
        required: true,
        type: 'date',
      },
      end_date: {
        required: true,
        type: 'date',
      },
      total_budget: {
        type: 'number',
        min: 0,
      },
    },
    customValidators: [
      CustomValidators.dateRange('start_date', 'end_date'),
    ],
  };

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
    if (submitError) setSubmitError('');
  };

  const handleThemeSelect = (theme: TripTheme) => {
    setValue('theme', theme);
    if (submitError) setSubmitError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSubmitError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
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
                reader.onloadend = () => resolve(reader.result as string);
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
    setSubmitError('');

    if (!validateForm()) {
      setSubmitError('Please fill in all required fields correctly');
      return;
    }

    if (isProcessing || formIsSubmitting) return;

    setIsProcessing(true);

    try {
      const tripData = { ...values };

      if (imageFile) {
        const compressedImage = await compressImage(imageFile);
        tripData.cover_image_url = compressedImage;
      }

      const cleanedData: any = { ...tripData };
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === '') {
          cleanedData[key] = undefined;
        }
      });

      await onSave(cleanedData);
    } catch (error: any) {
      console.error('Error saving trip:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to save trip. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <KawaiiInput
        label="Trip Title ✨"
        name="title"
        value={values.title}
        onChange={handleInputChange}
        placeholder="e.g., Tokyo Adventure 2025"
        required
        error={errors.title}
      />

      {/* Destination */}
      <KawaiiInput
        label="Destination 🗺️"
        name="destination"
        value={values.destination}
        onChange={handleInputChange}
        placeholder="e.g., Tokyo, Japan"
        required
        error={errors.destination}
      />

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KawaiiInput
          label="Start Date 📅"
          name="start_date"
          type="date"
          value={values.start_date}
          onChange={handleInputChange}
          required
          error={errors.start_date}
        />
        <KawaiiInput
          label="End Date 📅"
          name="end_date"
          type="date"
          value={values.end_date}
          onChange={handleInputChange}
          required
          error={errors.end_date}
        />
      </div>

      {/* Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KawaiiInput
          label="Total Budget 💰"
          name="total_budget"
          type="number"
          value={values.total_budget || ''}
          onChange={handleInputChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          error={errors.total_budget}
        />
        <div>
          <label className="block text-sm font-medium mb-2 kawaii-text">
            Currency 💱
          </label>
          <select
            name="currency_code"
            value={values.currency_code}
            onChange={(e) => {
              setValue('currency_code', e.target.value);
              if (submitError) setSubmitError('');
            }}
            className="w-full px-4 py-3 rounded-2xl border-2 border-kawaii-purple/20 
              focus:border-kawaii-purple focus:ring-2 focus:ring-kawaii-purple/20
              bg-white/80 backdrop-blur-sm transition-all duration-200
              hover:border-kawaii-purple/40"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Theme Selector */}
      <div>
        <label className="block text-sm font-medium mb-3 kawaii-text">
          Choose Your Vibe ✨
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {KAWAII_THEME_OPTIONS.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => handleThemeSelect(theme.value)}
              className={`
                p-4 rounded-2xl border-2 transition-all duration-200
                hover:scale-105 hover:shadow-lg
                ${
                  values.theme === theme.value
                    ? 'border-kawaii-purple bg-gradient-to-br ' + theme.color + ' text-white shadow-lg scale-105'
                    : 'border-kawaii-purple/20 bg-white/80 backdrop-blur-sm hover:border-kawaii-purple/40'
                }
              `}
            >
              <div className="text-3xl mb-2">{theme.emoji}</div>
              <div className="font-medium text-sm">
                {theme.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium mb-2 kawaii-text">
          Cover Image 📸
        </label>
        <div className="space-y-3">
          {imagePreview && (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-kawaii-purple/20">
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
                  if (submitError) setSubmitError('');
                }}
                className="absolute top-2 right-2 bg-kawaii-pink text-white p-2 rounded-full 
                  hover:bg-kawaii-pink/80 transition-all duration-200 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="px-4 py-3 rounded-2xl border-2 border-dashed border-kawaii-purple/30 
              bg-white/80 backdrop-blur-sm cursor-pointer
              hover:border-kawaii-purple hover:bg-kawaii-purple/5 transition-all duration-200
              text-center">
              <span className="text-kawaii-purple font-medium">
                {imagePreview ? '📷 Change Image' : '📷 Upload Image'}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Max 5MB • JPG, PNG, GIF
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-kawaii-purple/5 to-kawaii-pink/5 border border-kawaii-purple/10">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            name="is_public"
            checked={values.is_public}
            onChange={handleInputChange}
            className="w-5 h-5 text-kawaii-purple border-kawaii-purple/30 rounded-lg 
              focus:ring-kawaii-purple/20 focus:ring-2"
          />
          <span className="text-sm font-medium group-hover:text-kawaii-purple transition-colors">
            🌍 Make this trip public
          </span>
        </label>
        <label className="flex items-center space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            name="is_community"
            checked={values.is_community}
            onChange={handleInputChange}
            className="w-5 h-5 text-kawaii-purple border-kawaii-purple/30 rounded-lg 
              focus:ring-kawaii-purple/20 focus:ring-2"
          />
          <span className="text-sm font-medium group-hover:text-kawaii-purple transition-colors">
            ✨ Share with community
          </span>
        </label>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl animate-shake">
          <p className="text-sm text-red-600 font-medium">⚠️ {submitError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <KawaiiButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isProcessing || formIsSubmitting}
        >
          Cancel
        </KawaiiButton>
        <KawaiiButton
          type="submit"
          variant="primary"
          loading={isProcessing || formIsSubmitting}
          disabled={isProcessing || formIsSubmitting}
        >
          {mode === 'create' ? '✨ Create Trip' : '💾 Save Changes'}
        </KawaiiButton>
      </div>
    </form>
  );
};
