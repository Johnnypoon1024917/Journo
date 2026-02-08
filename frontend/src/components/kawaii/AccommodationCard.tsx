/**
 * Kawaii AccommodationCard Component
 * 
 * Displays hotel/accommodation booking with image support.
 * 
 * Features:
 * - Display hotel name, check-in/out dates, location
 * - Card layout with optional image
 * - Edit/delete actions via menu
 * - Swipe to delete gesture
 * - Touch-optimized interactions
 * - Framer Motion animations
 * 
 * Requirements: 10.4
 */

import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { BuildingOffice2Icon } from '@heroicons/react/24/solid';
import { cn } from '@/utils/cn';

export interface AccommodationBooking {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  location: string;
  confirmationNumber?: string;
  image?: string;
  notes?: string;
}

export interface AccommodationCardProps {
  booking: AccommodationBooking;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const AccommodationCard: React.FC<AccommodationCardProps> = ({
  booking,
  onEdit,
  onDelete,
  className,
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mapError, setMapError] = useState(false);
  
  // Swipe to delete
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0], [0, 1]);
  const deleteOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);

  // Generate Google Maps Static API URL
  const getGoogleMapsStaticUrl = (address: string): string => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=600x300&markers=color:red%7C${encodedAddress}&key=${apiKey}`;
  };

  // Determine what to show in the image section
  const hasLocation = booking.location && booking.location.trim().length > 0;
  const showMapImage = hasLocation && !mapError && !booking.image;
  const showCustomImage = booking.image && !imageError;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100 && onDelete) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 300);
    } else {
      x.set(0);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 300);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end px-6 bg-red-500 rounded-2xl"
        style={{ opacity: deleteOpacity }}
      >
        <TrashIcon className="w-6 h-6 text-white" />
      </motion.div>

      {/* Accommodation card */}
      <motion.div
        className={cn(
          'relative overflow-hidden',
          'bg-white dark:bg-kawaii-neutral-800',
          'rounded-2xl',
          'shadow-lg',
          'touch-manipulation'
        )}
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={isDeleting ? { x: -400, opacity: 0 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Image, Map, or placeholder */}
        {showCustomImage ? (
          <div className="relative h-48 overflow-hidden">
            <img
              src={booking.image}
              alt={booking.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : showMapImage ? (
          <div className="relative h-48 overflow-hidden">
            <img
              src={getGoogleMapsStaticUrl(booking.location)}
              alt={`Map of ${booking.location}`}
              className="w-full h-full object-cover"
              onError={() => setMapError(true)}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {/* Map indicator badge */}
            <div className="absolute top-3 right-3 bg-white/90 dark:bg-kawaii-neutral-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              <MapPinIcon className="w-4 h-4 text-kawaii-primary-600 dark:text-kawaii-primary-400" />
              <span className="text-xs font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
                Map View
              </span>
            </div>
          </div>
        ) : (
          <div className="relative h-48 bg-gradient-to-br from-kawaii-primary-100 to-kawaii-primary-200 dark:from-kawaii-primary-900 dark:to-kawaii-primary-800 flex items-center justify-center">
            <BuildingOffice2Icon className="w-20 h-20 text-kawaii-primary-400 dark:text-kawaii-primary-600" />
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Header with name and menu */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 truncate">
                {booking.name}
              </h3>
              {booking.confirmationNumber && (
                <p className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400 mt-1">
                  {t('booking.confirmationNumber', { number: booking.confirmationNumber })}
                </p>
              )}
            </div>

            {/* Three-dot menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  'p-2 rounded-lg',
                  'text-kawaii-neutral-600 dark:text-kawaii-neutral-400',
                  'hover:bg-kawaii-neutral-100 dark:hover:bg-kawaii-neutral-700',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500',
                  'min-w-[44px] min-h-[44px]',
                  'flex items-center justify-center'
                )}
                aria-label="Menu"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <motion.div
                  className={cn(
                    'absolute right-0 top-full mt-2 z-10',
                    'bg-white dark:bg-kawaii-neutral-800',
                    'rounded-lg shadow-xl',
                    'overflow-hidden',
                    'min-w-[160px]'
                  )}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {onEdit && (
                    <button
                      onClick={handleEdit}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3',
                        'text-left text-sm',
                        'text-kawaii-neutral-700 dark:text-kawaii-neutral-200',
                        'hover:bg-kawaii-neutral-100 dark:hover:bg-kawaii-neutral-700',
                        'transition-colors duration-150'
                      )}
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3',
                        'text-left text-sm',
                        'text-red-600 dark:text-red-400',
                        'hover:bg-red-50 dark:hover:bg-red-900/20',
                        'transition-colors duration-150'
                      )}
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 mb-4">
            <MapPinIcon className="w-5 h-5 text-kawaii-neutral-400 dark:text-kawaii-neutral-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-300 line-clamp-2">
              {booking.location}
            </p>
          </div>

          {/* Check-in and Check-out dates */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="w-4 h-4 text-kawaii-neutral-400 dark:text-kawaii-neutral-500" />
                <span className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                  {t('booking.checkIn')}
                </span>
              </div>
              <p className="text-sm font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
                {booking.checkIn}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-kawaii-neutral-300 dark:text-kawaii-neutral-600">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="w-4 h-4 text-kawaii-neutral-400 dark:text-kawaii-neutral-500" />
                <span className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                  {t('booking.checkOut')}
                </span>
              </div>
              <p className="text-sm font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
                {booking.checkOut}
              </p>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="mt-4 pt-4 border-t border-kawaii-neutral-200 dark:border-kawaii-neutral-700">
              <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-300 line-clamp-2">
                {booking.notes}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
