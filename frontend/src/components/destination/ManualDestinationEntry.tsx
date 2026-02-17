import React, { useState } from 'react';
import { Button } from '../../design-system/atoms/Button';
import { Input } from '../../design-system/atoms/Input';
import { Text } from '../../design-system/atoms/Text';

interface ManualDestinationEntryProps {
  onSubmit: (destinationName: string, country: string) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Manual destination entry component
 * Implements Requirements 3.4: Manual destination entry fallback
 */
export const ManualDestinationEntry: React.FC<ManualDestinationEntryProps> = ({
  onSubmit,
  onCancel,
  className = ''
}) => {
  const [destinationName, setDestinationName] = useState('');
  const [country, setCountry] = useState('');
  const [errors, setErrors] = useState<{ destination?: string; country?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { destination?: string; country?: string } = {};
    
    if (!destinationName.trim()) {
      newErrors.destination = 'Destination name is required';
    }
    
    if (!country.trim()) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(destinationName.trim(), country.trim());
      // Reset form
      setDestinationName('');
      setCountry('');
      setErrors({});
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-4">
        <Text variant="subheading" className="mb-2">
          Enter Destination Manually
        </Text>
        <Text variant="body" className="text-gray-600 dark:text-gray-400">
          Can't find what you're looking for? Enter your destination details manually.
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="destination-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Destination Name
          </label>
          <Input
            id="destination-name"
            type="text"
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
            placeholder="e.g., Paris, Tokyo, New York"
            className="w-full"
            aria-invalid={!!errors.destination}
            aria-describedby={errors.destination ? "destination-error" : undefined}
          />
          {errors.destination && (
            <Text id="destination-error" variant="caption" className="text-red-600 mt-1" role="alert">
              {errors.destination}
            </Text>
          )}
        </div>

        <div>
          <label htmlFor="destination-country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Country
          </label>
          <Input
            id="destination-country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g., France, Japan, USA"
            className="w-full"
            aria-invalid={!!errors.country}
            aria-describedby={errors.country ? "country-error" : undefined}
          />
          {errors.country && (
            <Text id="country-error" variant="caption" className="text-red-600 mt-1" role="alert">
              {errors.country}
            </Text>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
          >
            Add Destination
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
