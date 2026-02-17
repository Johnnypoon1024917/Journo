/**
 * BubbleQuest BoardingPassCard Component
 * 
 * Displays flight/train booking in boarding pass style with pink gradient.
 * 
 * Features:
 * - Pink gradient background with white text
 * - Display origin, destination, times, flight number, date
 * - Three-dot menu for edit/delete actions
 * - Swipe to delete gesture
 * - Touch-optimized interactions
 * - Framer Motion animations
 * 
 * Requirements: 10.1, 10.3
 */

import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

export interface LocationInfo {
  code: string;
  name: string;
  time: string;
}

export interface FlightBooking {
  id: string;
  type: 'flight' | 'train';
  origin: LocationInfo;
  destination: LocationInfo;
  flightNumber: string;
  date: string;
  route?: string;
}

export interface BoardingPassCardProps {
  booking: FlightBooking;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const BoardingPassCard: React.FC<BoardingPassCardProps> = ({
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

      {/* Boarding pass card */}
      <motion.div
        className={cn(
          'relative overflow-hidden',
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
        {/* Top Section: Soft coral/salmon pink background with route info */}
        <div className="relative bg-gradient-to-br from-[#FFB5B5] via-[#FFA5A5] to-[#FF9999] dark:from-pink-600 dark:via-pink-700 dark:to-rose-700 p-6 pb-8">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

          {/* Header with type and menu */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-white/90 text-sm font-medium uppercase tracking-wide">
                BOARDING PASS
              </span>
            </div>

            {/* Three-dot menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  'p-2 rounded-lg',
                  'text-white hover:bg-white/20',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-white/50',
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

          {/* Route title */}
          <div className="relative text-white text-xl font-bold mb-6">
            {booking.origin.name} → {booking.destination.name}
          </div>

          {/* Route visualization */}
          <div className="relative flex items-center justify-between">
            {/* Origin */}
            <div className="flex-1">
              <div className="text-white text-4xl font-bold mb-1">
                {booking.origin.code}
              </div>
              <div className="text-white/80 text-xs mb-2">
                出發
              </div>
              <div className="text-white text-2xl font-semibold">
                {booking.origin.time}
              </div>
            </div>

            {/* Arrow/Plane icon */}
            <div className="flex-1 flex flex-col items-center px-4">
              <div className="text-white text-3xl">
                ✈️
              </div>
            </div>

            {/* Destination */}
            <div className="flex-1 text-right">
              <div className="text-white text-4xl font-bold mb-1">
                {booking.destination.code}
              </div>
              <div className="text-white/80 text-xs mb-2">
                抵達
              </div>
              <div className="text-white text-2xl font-semibold">
                {booking.destination.time}
              </div>
            </div>
          </div>

          {/* Decorative perforated edge */}
          <div className="absolute bottom-0 left-0 right-0 h-4 flex items-center justify-center gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-white/30"
              />
            ))}
          </div>
        </div>

        {/* Bottom Section: Warm cream/beige background with flight details */}
        <div className="relative bg-[#FFF5E6] dark:bg-bubblequest-neutral-800 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Flight Number */}
            <div>
              <div className="text-[#8B7355] dark:text-bubblequest-neutral-400 text-xs mb-1">
                航班編號
              </div>
              <div className="text-[#4A4A4A] dark:text-bubblequest-neutral-100 text-lg font-bold">
                {booking.flightNumber}
              </div>
            </div>

            {/* Date */}
            <div className="text-right">
              <div className="text-[#8B7355] dark:text-bubblequest-neutral-400 text-xs mb-1">
                日期
              </div>
              <div className="text-[#4A4A4A] dark:text-bubblequest-neutral-100 text-lg font-bold">
                {booking.date}
              </div>
            </div>
          </div>
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
