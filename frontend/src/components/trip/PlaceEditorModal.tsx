import React, { useState, useEffect } from 'react';
import { Place } from '../../types/trip';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { LocationSearch } from '../common/LocationSearch';

interface PlaceEditorModalProps {
  place: Place | null;
  dayId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (placeId: string, updates: Partial<Place>) => Promise<void>;
  onCreate?: (dayId: string, placeData: any) => Promise<void>;
}

export const PlaceEditorModal: React.FC<PlaceEditorModalProps> = ({
  place,
  dayId,
  isOpen,
  onClose,
  onSave,
  onCreate,
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
    time_start: string;
    time_end: string;
    cost: string;
    cost_currency: string;
    notes: string;
    place_type: 'attraction' | 'food' | 'hotel' | 'transport' | 'other';
  }>({
    name: '',
    address: '',
    lat: null,
    lng: null,
    time_start: '',
    time_end: '',
    cost: '',
    cost_currency: 'USD',
    notes: '',
    place_type: 'attraction',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name || '',
        address: place.address || '',
        lat: place.lat || null,
        lng: place.lng || null,
        time_start: place.time_start || '',
        time_end: place.time_end || '',
        cost: place.cost?.toString() || '',
        cost_currency: place.cost_currency || 'USD',
        notes: place.notes || '',
        place_type: place.place_type || 'attraction',
      });
    } else {
      // Reset form for new place
      setFormData({
        name: '',
        address: '',
        lat: null,
        lng: null,
        time_start: '',
        time_end: '',
        cost: '',
        cost_currency: 'USD',
        notes: '',
        place_type: 'attraction',
      });
    }
  }, [place, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Place name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const placeData = {
        name: formData.name,
        address: formData.address || null,
        lat: formData.lat,
        lng: formData.lng,
        time_start: formData.time_start || null,
        time_end: formData.time_end || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        cost_currency: formData.cost_currency,
        notes: formData.notes || null,
        place_type: formData.place_type,
      };

      if (place) {
        // Update existing place
        await onSave(place.id, placeData);
      } else if (dayId && onCreate) {
        // Create new place
        await onCreate(dayId, placeData);
      } else {
        setError('Cannot create place: missing day ID or create function');
        return;
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save place');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={place ? 'Edit Place' : 'Add Place'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location Search - Prominent at the top */}
        <LocationSearch
          label="Search Location"
          value={formData.address}
          onChange={(value, placeDetails) => {
            if (placeDetails) {
              // Auto-fill all fields when a place is selected
              setFormData({
                ...formData,
                address: placeDetails.address,
                lat: placeDetails.lat,
                lng: placeDetails.lng,
                // Only auto-fill name if it's empty
                name: formData.name || placeDetails.name || '',
              });
            } else {
              // Just update the address field when typing
              setFormData({ ...formData, address: value });
            }
          }}
          placeholder="Search for a place (e.g., Eiffel Tower, Tokyo Station)..."
        />

        {/* Coordinates Display */}
        {formData.lat && formData.lng && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm">
                <span className="font-medium text-green-800 dark:text-green-300">
                  Location set:
                </span>
                <span className="text-green-700 dark:text-green-400 ml-2">
                  {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                </span>
              </div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-7">
              This location will be shown on the map
            </p>
          </div>
        )}

        <Input
          label="Place Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Will be filled from search or enter manually"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Place Type
          </label>
          <select
            value={formData.place_type}
            onChange={(e) => setFormData({ ...formData, place_type: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg min-h-touch
              bg-white text-gray-900
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500
              dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-400 dark:border-gray-500"
          >
            <option value="attraction">Attraction</option>
            <option value="food">Food</option>
            <option value="hotel">Hotel</option>
            <option value="transport">Transport</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="time"
            value={formData.time_start}
            onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
          />

          <Input
            label="End Time"
            type="time"
            value={formData.time_end}
            onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="0.00"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select
              value={formData.cost_currency}
              onChange={(e) => setFormData({ ...formData, cost_currency: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg min-h-touch
                bg-white text-gray-900
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500
                dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-400 dark:border-gray-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CNY">CNY</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg min-h-touch
              bg-white text-gray-900
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500
              dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-400 dark:border-gray-500"
            placeholder="Add notes about this place..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            disabled={isSaving}
          >
            {place ? 'Save Changes' : 'Add Place'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
