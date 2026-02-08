import { useState, useEffect, useRef } from 'react';
import { Place, PlaceType, BudgetCategory, TransportMode, CreatePlaceDto, UpdatePlaceDto } from '../../types/trip';
import { placeService } from '../../services/placeService';
import { travelTimeService } from '../../services/travelTimeService';
import { useToast } from '../../hooks/useToast';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import StickerPicker from './StickerPicker';
import ImageUpload from '../common/ImageUpload';
import RichTextEditor from '../common/RichTextEditor';
import PlaceSearchWithSuggestions from '../common/PlaceSearchWithSuggestions';
import { CURRENCIES, getCurrencySymbol } from '../../constants/currencies';

interface PlaceEditorProps {
  dayId: string;
  place?: Place;
  previousPlace?: Place; // For calculating travel time
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

import { mapsService } from '../../services/mapsService';

export default function PlaceEditor({ dayId, place, previousPlace, isOpen, onClose, onSave }: PlaceEditorProps) {
  const [formData, setFormData] = useState<Partial<CreatePlaceDto>>({
    trip_day_id: dayId,
    name: '',
    address: '',
    lat: undefined,
    lng: undefined,
    time_start: '',
    time_end: '',
    notes: '',
    place_type: undefined,
    cost: undefined,
    cost_currency: 'USD',
    budget_category: undefined,
    transport_mode: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [autocompleteLoaded, setAutocompleteLoaded] = useState(false);
  const [tipPercentage, setTipPercentage] = useState<number | null>(null);
  const [splitCount, setSplitCount] = useState<number>(1);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    if (place) {
      setFormData({
        trip_day_id: dayId,
        name: place.name,
        address: place.address || '',
        lat: place.lat || undefined,
        lng: place.lng || undefined,
        time_start: place.time_start || '',
        time_end: place.time_end || '',
        notes: place.notes || '',
        place_type: place.place_type || undefined,
        cost: place.cost || undefined,
        cost_currency: place.cost_currency || 'USD',
        budget_category: place.budget_category || undefined,
        transport_mode: place.transport_mode || undefined,
      });
    } else {
      setFormData({
        trip_day_id: dayId,
        name: '',
        address: '',
        lat: undefined,
        lng: undefined,
        time_start: '',
        time_end: '',
        notes: '',
        place_type: undefined,
        cost: undefined,
        cost_currency: 'USD',
        budget_category: undefined,
        transport_mode: undefined,
      });
    }
  }, [place, dayId]);

  useEffect(() => {
    const initAutocomplete = async () => {
      if (!mapsService.isApiKeyConfigured()) {
        console.warn('Google Maps API key not found');
        return;
      }

      try {
        await mapsService.loadGoogleMaps();
        setAutocompleteLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    if (isOpen) {
      initAutocomplete();
    }
  }, [isOpen]);

  useEffect(() => {
    if (autocompleteLoaded && autocompleteInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
        fields: ['name', 'formatted_address', 'geometry', 'place_id', 'types'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const selectedPlace = autocompleteRef.current?.getPlace();
        if (selectedPlace && selectedPlace.geometry && selectedPlace.geometry.location) {
          setFormData(prev => ({
            ...prev,
            name: selectedPlace.name || prev.name,
            address: selectedPlace.formatted_address || prev.address,
            lat: selectedPlace.geometry!.location!.lat(),
            lng: selectedPlace.geometry!.location!.lng(),
          }));
          
          // Clear the search input after selection
          if (autocompleteInputRef.current) {
            autocompleteInputRef.current.value = '';
          }
        }
      });
    }
  }, [autocompleteLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      showError('Place name is required');
      return;
    }

    try {
      setLoading(true);

      // Calculate travel time if this is a new place and we have coordinates
      let travelData = {};
      if (!place && previousPlace && formData.lat && formData.lng && previousPlace.lat && previousPlace.lng) {
        const travelTime = await travelTimeService.calculateTravelTime(
          { lat: previousPlace.lat, lng: previousPlace.lng },
          { lat: formData.lat, lng: formData.lng },
          formData.transport_mode || undefined
        );

        if (travelTime) {
          travelData = {
            travel_time_seconds: travelTime.duration_seconds,
            travel_distance_meters: travelTime.distance_meters,
            travel_time_text: travelTime.duration_text,
            travel_distance_text: travelTime.distance_text,
            transport_mode: travelTime.transport_mode,
          };
        }
      }

      // Clean up form data - convert empty strings to null for optional fields
      const cleanedData = {
        ...formData,
        address: formData.address || null,
        time_start: formData.time_start || null,
        time_end: formData.time_end || null,
        notes: formData.notes || null,
        image_url: formData.image_url || null,
        place_type: formData.place_type || null,
        sticker: formData.sticker || null,
        cost: formData.cost || null,
        budget_category: formData.budget_category || null,
        transport_mode: formData.transport_mode || null,
      };

      if (place) {
        // Update existing place
        console.log('Updating place:', place.id, cleanedData);
        const updatedPlace = await placeService.updatePlace(place.id, { ...cleanedData, ...travelData } as UpdatePlaceDto);
        console.log('Place updated successfully:', updatedPlace);
        showSuccess('Place updated successfully');
      } else {
        // Create new place
        console.log('Creating place:', cleanedData);
        const createdPlace = await placeService.createPlace({ ...cleanedData, ...travelData } as CreatePlaceDto);
        console.log('Place created successfully:', createdPlace);
        showSuccess('Place added successfully');
      }

      // Call onSave to refresh the data
      onSave();
      
      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error saving place:', error);
      showError(error.message || error.response?.data?.error || 'Failed to save place');
    } finally {
      setLoading(false);
    }
  };

  const placeTypes: { value: PlaceType; label: string }[] = [
    { value: 'attraction', label: 'Attraction' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'hotel', label: 'Accommodation' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' },
  ];

  const budgetCategories: { value: BudgetCategory; label: string }[] = [
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'food', label: 'Food' },
    { value: 'transport', label: 'Transport' },
    { value: 'activities', label: 'Activities' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'misc', label: 'Miscellaneous' },
  ];

  const transportModes: { value: TransportMode; label: string }[] = [
    { value: 'driving', label: 'Driving' },
    { value: 'walking', label: 'Walking' },
    { value: 'transit', label: 'Public Transit' },
    { value: 'flight', label: 'Flight' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={place ? 'Edit Place' : 'Add Place'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Enhanced Location Search with Suggestions */}
        <PlaceSearchWithSuggestions
          value=""
          onChange={(value, placeDetails) => {
            if (placeDetails) {
              setFormData(prev => ({
                ...prev,
                name: placeDetails.name || value,
                address: placeDetails.address,
                lat: placeDetails.lat,
                lng: placeDetails.lng,
              }));
            }
          }}
          onPlaceSelect={(placeDetails) => {
            setFormData(prev => ({
              ...prev,
              name: placeDetails.name || placeDetails.address,
              address: placeDetails.address,
              lat: placeDetails.lat,
              lng: placeDetails.lng,
            }));
          }}
          onSuggestionSelect={(suggestion) => {
            setFormData(prev => ({
              ...prev,
              name: suggestion.location_name,
              address: suggestion.location_name,
              lat: suggestion.lat || undefined,
              lng: suggestion.lng || undefined,
            }));
          }}
          placeholder="Search for a place (e.g., Eiffel Tower, Tokyo Station)..."
          label="Search Location *"
          showSuggestions={true}
        />

        {/* Name (Auto-filled from search) */}
        <Input
          label="Place Name *"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Will be filled from search or enter manually"
          required
        />

        {/* Address (Auto-filled from search) */}
        <Input
          label="Address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Will be filled from search or enter manually"
        />

        {/* Coordinates Display (Auto-filled from search) */}
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
              This location will be shown on the map and used for travel time calculations
            </p>
          </div>
        )}

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="time"
            value={formData.time_start || ''}
            onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
          />
          <Input
            label="End Time"
            type="time"
            value={formData.time_end || ''}
            onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
          />
        </div>

        {/* Place Type and Sticker */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Place Type
            </label>
            <select
              value={formData.place_type || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, place_type: e.target.value as PlaceType || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select type...</option>
              {placeTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <StickerPicker
            selectedSticker={formData.sticker}
            onSelect={(sticker) => setFormData({ ...formData, sticker })}
          />
        </div>

        {/* Budget Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Budget Category
          </label>
          <select
            value={formData.budget_category || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, budget_category: e.target.value as BudgetCategory || undefined })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select category...</option>
            {budgetCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Cost */}
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                label="Cost"
                type="number"
                step="0.01"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.00"
                helperText="Use negative values for refunds"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={formData.cost_currency || 'USD'}
                onChange={(e) => setFormData({ ...formData, cost_currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tip Calculator for Food */}
          {formData.budget_category === 'food' && formData.cost && formData.cost > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add Tip
              </label>
              <div className="flex gap-2">
                {[10, 15, 20].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => {
                      const baseCost = formData.cost || 0;
                      const tip = baseCost * (percent / 100);
                      setFormData({ ...formData, cost: baseCost + tip });
                      setTipPercentage(percent);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                      tipPercentage === percent
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {percent}%
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{getCurrencySymbol(formData.cost_currency || 'USD')}
                      {((formData.cost || 0) * (percent / 100)).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
              {tipPercentage && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tip included: {getCurrencySymbol(formData.cost_currency || 'USD')}
                  {((formData.cost || 0) * (tipPercentage / 100)).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Split Cost */}
          {formData.cost && formData.cost !== 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Split Cost Among Travelers
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={splitCount}
                  onChange={(e) => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                    focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  travelers
                </span>
                {splitCount > 1 && (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    = {getCurrencySymbol(formData.cost_currency || 'USD')}
                    {(Math.abs(formData.cost) / splitCount).toFixed(2)} per person
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transport Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transport Mode
          </label>
          <div className="flex gap-2">
            <select
              value={formData.transport_mode || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, transport_mode: e.target.value as TransportMode || undefined })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Auto-detect</option>
              {transportModes.map(mode => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>
          {formData.transport_mode && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.transport_mode === 'flight' 
                ? 'Flight mode: travel time will not be calculated' 
                : 'Travel time will be calculated automatically when you save'}
            </p>
          )}
        </div>

        {/* Image Upload */}
        <ImageUpload
          currentImage={formData.image_url}
          onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
          label="Place Image"
          buttonText="Upload place photo"
        />

        {/* Notes - Rich Text Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <RichTextEditor
            content={formData.notes || ''}
            onChange={(content) => setFormData({ ...formData, notes: content })}
            placeholder="Add notes, checklists, or details about this place..."
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use the toolbar to format text, create lists, or add checklists
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : place ? 'Update Place' : 'Add Place'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
