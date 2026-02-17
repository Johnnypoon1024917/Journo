/**
 * BubbleQuest AddBookingModal Component
 * 
 * Modal for adding new flight, train, accommodation, car rental, or ticket bookings.
 * 
 * Features:
 * - Form for booking details
 * - Category selection (flights, accommodation, car rental, tickets)
 * - Validation
 * - Submit handling
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BubbleQuestModal } from './BubbleQuestModal';
import { 
  TicketIcon,
  BuildingOffice2Icon,
  TruckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export type BookingCategory = 'flights' | 'accommodation' | 'carRental' | 'tickets';

export interface BookingFormData {
  category: BookingCategory;
  // Flight/Train fields
  type?: 'flight' | 'train' | 'car_rental' | 'bus' | 'ferry' | 'theme_park' | 'museum' | 'show' | 'tour' | 'other';
  origin?: {
    code: string;
    name: string;
    time: string;
  };
  destination?: {
    code: string;
    name: string;
    time: string;
  };
  flightNumber?: string;
  date?: string;
  route?: string;
  // Accommodation fields
  name?: string;
  checkIn?: string;
  checkOut?: string;
  location?: string;
  confirmationNumber?: string;
  notes?: string;
  // Transportation fields
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  pickupTime?: string;
  dropoffDate?: string;
  dropoffTime?: string;
  // Attraction fields
  time?: string;
  quantity?: number;
}

export interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => void;
  isSubmitting?: boolean;
  initialCategory?: BookingCategory;
  initialData?: Partial<BookingFormData>;
  isEditing?: boolean;
}

export const AddBookingModal: React.FC<AddBookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialCategory = 'flights',
  initialData,
  isEditing = false,
}) => {
  const { t } = useTranslation('bubbleQuest');
  const [category, setCategory] = useState<BookingCategory>(initialCategory);
  const [formData, setFormData] = useState<Partial<BookingFormData>>(
    initialData || { category: initialCategory }
  );

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setCategory(initialData.category || initialCategory);
    } else {
      setFormData({ category: initialCategory });
      setCategory(initialCategory);
    }
  }, [initialData, initialCategory]);

  const categories = [
    { id: 'flights' as BookingCategory, icon: TicketIcon, label: t('booking.sections.flights') },
    { id: 'accommodation' as BookingCategory, icon: BuildingOffice2Icon, label: t('booking.sections.accommodation') },
    { id: 'carRental' as BookingCategory, icon: TruckIcon, label: t('booking.sections.carRental') },
    { id: 'tickets' as BookingCategory, icon: SparklesIcon, label: t('booking.sections.attractionTickets') },
  ];

  const handleCategoryChange = (newCategory: BookingCategory) => {
    setCategory(newCategory);
    setFormData({ category: newCategory });
  };

  const handleSubmit = () => {
    onSubmit({ ...formData, category } as BookingFormData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderFlightForm = () => (
    <div className="space-y-4">
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.type')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleChange('type', 'flight')}
            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'flight'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            ✈️ {t('booking.types.flight')}
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'train')}
            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'train'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            🚄 {t('booking.types.train')}
          </button>
        </div>
      </div>

      {/* Flight/Train Number */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {formData.type === 'train' ? t('booking.trainNumber', { number: '' }) : t('booking.flightNumber', { number: '' })}
        </label>
        <input
          type="text"
          value={formData.flightNumber || ''}
          onChange={(e) => handleChange('flightNumber', e.target.value)}
          placeholder="CX596"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Origin */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            {t('booking.origin.code')}
          </label>
          <input
            type="text"
            value={formData.origin?.code || ''}
            onChange={(e) => handleChange('origin', { ...formData.origin, code: e.target.value })}
            placeholder="HKG"
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            {t('booking.origin.name')}
          </label>
          <input
            type="text"
            value={formData.origin?.name || ''}
            onChange={(e) => handleChange('origin', { ...formData.origin, name: e.target.value })}
            placeholder="Hong Kong"
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            {t('booking.origin.time')}
          </label>
          <input
            type="time"
            value={formData.origin?.time || ''}
            onChange={(e) => handleChange('origin', { ...formData.origin, time: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
      </div>

      {/* Destination */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            {t('booking.destination.code')}
          </label>
          <input
            type="text"
            value={formData.destination?.code || ''}
            onChange={(e) => handleChange('destination', { ...formData.destination, code: e.target.value })}
            placeholder="KIX"
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            {t('booking.destination.name')}
          </label>
          <input
            type="text"
            value={formData.destination?.name || ''}
            onChange={(e) => handleChange('destination', { ...formData.destination, name: e.target.value })}
            placeholder="Osaka"
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            {t('booking.destination.time')}
          </label>
          <input
            type="time"
            value={formData.destination?.time || ''}
            onChange={(e) => handleChange('destination', { ...formData.destination, time: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.date')}
        </label>
        <input
          type="date"
          value={formData.date || ''}
          onChange={(e) => handleChange('date', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>
    </div>
  );

  const renderAccommodationForm = () => (
    <div className="space-y-4">
      {/* Hotel Name */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.hotelName')}
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Hotel Name"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Check-in / Check-out */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            {t('booking.checkIn')}
          </label>
          <input
            type="date"
            value={formData.checkIn || ''}
            onChange={(e) => handleChange('checkIn', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            {t('booking.checkOut')}
          </label>
          <input
            type="date"
            value={formData.checkOut || ''}
            onChange={(e) => handleChange('checkOut', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.location')}
        </label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Address"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Confirmation Number */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.confirmationNumber', { number: '' })}
        </label>
        <input
          type="text"
          value={formData.confirmationNumber || ''}
          onChange={(e) => handleChange('confirmationNumber', e.target.value)}
          placeholder="ABC123"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.notes')}
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          placeholder="Additional notes..."
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500 resize-none"
        />
      </div>
    </div>
  );

  const renderComingSoon = () => (
    <div className="text-center py-12">
      <span className="text-6xl mb-4 block">🚧</span>
      <p className="text-lg text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
        {t('booking.comingSoon')}
      </p>
    </div>
  );

  const renderTransportationForm = () => (
    <div className="space-y-4">
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.type')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleChange('type', 'car_rental')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'car_rental'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            🚗 租車
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'bus')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'bus'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            🚌 巴士
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'ferry')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'ferry'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            ⛴️ 渡輪
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'other')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'other'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            🚐 其他
          </button>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          名稱
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Toyota Camry"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Pickup Location */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          取車地點
        </label>
        <input
          type="text"
          value={formData.pickupLocation || ''}
          onChange={(e) => handleChange('pickupLocation', e.target.value)}
          placeholder="Osaka Airport"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Pickup Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            取車日期
          </label>
          <input
            type="date"
            value={formData.pickupDate || ''}
            onChange={(e) => handleChange('pickupDate', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            取車時間
          </label>
          <input
            type="time"
            value={formData.pickupTime || ''}
            onChange={(e) => handleChange('pickupTime', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
      </div>

      {/* Dropoff Location */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          還車地點
        </label>
        <input
          type="text"
          value={formData.dropoffLocation || ''}
          onChange={(e) => handleChange('dropoffLocation', e.target.value)}
          placeholder="Kyoto Station"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Dropoff Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            還車日期
          </label>
          <input
            type="date"
            value={formData.dropoffDate || ''}
            onChange={(e) => handleChange('dropoffDate', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            還車時間
          </label>
          <input
            type="time"
            value={formData.dropoffTime || ''}
            onChange={(e) => handleChange('dropoffTime', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
      </div>

      {/* Confirmation Number */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          確認編號
        </label>
        <input
          type="text"
          value={formData.confirmationNumber || ''}
          onChange={(e) => handleChange('confirmationNumber', e.target.value)}
          placeholder="ABC123"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.notes')}
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          placeholder="Additional notes..."
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500 resize-none"
        />
      </div>
    </div>
  );

  const renderAttractionForm = () => (
    <div className="space-y-4">
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.type')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleChange('type', 'theme_park')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'theme_park'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            🎢 主題樂園
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'museum')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'museum'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            🏛️ 博物館
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'show')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'show'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            🎭 表演
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'tour')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              formData.type === 'tour'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            🗺️ 導覽
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'other')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors col-span-2 ${
              formData.type === 'other'
                ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
            }`}
          >
            🎫 其他
          </button>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          景點名稱
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Universal Studios Japan"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.location')}
        </label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Osaka, Japan"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            {t('booking.date')}
          </label>
          <input
            type="date"
            value={formData.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
            時間
          </label>
          <input
            type="time"
            value={formData.time || ''}
            onChange={(e) => handleChange('time', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
          />
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          票數
        </label>
        <input
          type="number"
          min="1"
          value={formData.quantity || 1}
          onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Confirmation Number */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.confirmationNumber', { number: '' })}
        </label>
        <input
          type="text"
          value={formData.confirmationNumber || ''}
          onChange={(e) => handleChange('confirmationNumber', e.target.value)}
          placeholder="ABC123"
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-2">
          {t('booking.notes')}
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          placeholder="Additional notes..."
          className="w-full px-4 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500 resize-none"
        />
      </div>
    </div>
  );

  return (
    <BubbleQuestModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('booking.editBooking') : t('booking.addBooking')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Category Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20'
                    : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 hover:border-bubblequest-primary-300'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive
                      ? 'text-bubblequest-primary-600 dark:text-bubblequest-primary-400'
                      : 'text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                      : 'text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="min-h-[300px]">
          {category === 'flights' && renderFlightForm()}
          {category === 'accommodation' && renderAccommodationForm()}
          {category === 'carRental' && renderTransportationForm()}
          {category === 'tickets' && renderAttractionForm()}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 hover:bg-bubblequest-neutral-50 dark:hover:bg-bubblequest-neutral-800 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-bubblequest-primary-500 text-white hover:bg-bubblequest-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {t('common.save')}
          </button>
        </div>
      </div>
    </BubbleQuestModal>
  );
};
