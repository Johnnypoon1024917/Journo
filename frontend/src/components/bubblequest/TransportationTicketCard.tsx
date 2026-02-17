/**
 * BubbleQuest TransportationTicketCard Component
 * 
 * Displays transportation ticket bookings (bus, car rental, ferry, etc.)
 * 
 * Features:
 * - Display ticket type, pickup/dropoff info, dates
 * - Card layout with transportation icon
 * - Edit/delete actions via menu
 * - Swipe to delete gesture
 * - Touch-optimized interactions
 * - Framer Motion animations
 */

import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { TruckIcon } from '@heroicons/react/24/solid';
import { cn } from '@/utils/cn';

export interface TransportationTicket {
  id: string;
  type: 'car_rental' | 'bus' | 'ferry' | 'other';
  name: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime?: string;
  dropoffDate: string;
  dropoffTime?: string;
  confirmationNumber?: string;
  notes?: string;
}

export interface TransportationTicketCardProps {
  booking: TransportationTicket;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const transportationIcons: Record<string, string> = {
  car_rental: '🚗',
  bus: '🚌',
  ferry: '⛴️',
  other: '🚐',
};

const transportationLabels: Record<string, string> = {
  car_rental: '租車',
  bus: '巴士',
  ferry: '渡輪',
  other: '其他',
};

export const TransportationTicketCard: React.FC<TransportationTicketCardProps> = ({
  booking,
  onEdit,
  onDelete,
  className,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Swipe to delete
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0], [0, 1]);
  const deleteOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);

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

      {/* Transportation ticket card */}
      <motion.div
        className={cn(
          'relative overflow-hidden',
          'bg-white dark:bg-bubblequest-neutral-800',
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
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 dark:from-blue-900/30 dark:via-cyan-900/30 dark:to-teal-900/30 p-5">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12" />
          
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 bg-white/80 dark:bg-bubblequest-neutral-700/80 rounded-xl flex items-center justify-center text-2xl">
                {transportationIcons[booking.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  {transportationLabels[booking.type]}
                </div>
                <h3 className="text-lg font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 truncate">
                  {booking.name}
                </h3>
              </div>
            </div>

            {/* Three-dot menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  'p-2 rounded-lg',
                  'text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400',
                  'hover:bg-white/50 dark:hover:bg-bubblequest-neutral-700/50',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500',
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
                    'bg-white dark:bg-bubblequest-neutral-800',
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
                        'text-bubblequest-neutral-700 dark:text-bubblequest-neutral-200',
                        'hover:bg-bubblequest-neutral-100 dark:hover:bg-bubblequest-neutral-700',
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
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Confirmation Number */}
          {booking.confirmationNumber && (
            <div className="mb-4 pb-4 border-b border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700">
              <p className="text-xs text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
                確認編號: {booking.confirmationNumber}
              </p>
            </div>
          )}

          {/* Pickup Location */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPinIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
                取車地點
              </span>
            </div>
            <p className="text-sm font-semibold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 ml-6">
              {booking.pickupLocation}
            </p>
            <div className="flex items-center gap-2 mt-1 ml-6">
              <CalendarIcon className="w-4 h-4 text-bubblequest-neutral-400 dark:text-bubblequest-neutral-500" />
              <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-300">
                {booking.pickupDate}
                {booking.pickupTime && ` ${booking.pickupTime}`}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center mb-4">
            <div className="text-bubblequest-neutral-300 dark:text-bubblequest-neutral-600">
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
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Dropoff Location */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPinIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
                還車地點
              </span>
            </div>
            <p className="text-sm font-semibold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 ml-6">
              {booking.dropoffLocation}
            </p>
            <div className="flex items-center gap-2 mt-1 ml-6">
              <CalendarIcon className="w-4 h-4 text-bubblequest-neutral-400 dark:text-bubblequest-neutral-500" />
              <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-300">
                {booking.dropoffDate}
                {booking.dropoffTime && ` ${booking.dropoffTime}`}
              </p>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="pt-4 border-t border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700">
              <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-300 line-clamp-2">
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
