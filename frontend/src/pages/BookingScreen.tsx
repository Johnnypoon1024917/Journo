/**
 * Kawaii BookingScreen Page Component
 * 
 * Main booking screen that integrates all kawaii booking components.
 * Displays reservations in a cute, cat-themed interface with expandable sections.
 * 
 * Features:
 * - Expandable sections for Flights, Accommodation, Car Rental, Tickets
 * - BoardingPassCard for flight/train bookings
 * - AccommodationCard for hotel bookings
 * - FAB for adding new bookings
 * - Booking add/edit/delete functionality
 * - Cat-themed decorations and illustrations
 * - Connection to booking service (localStorage-based, ready for API)
 * - Responsive design with bottom/side navigation
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

// Types
import { Trip } from '@/types/trip';
import { FlightBooking } from '@/components/kawaii/BoardingPassCard';
import { AccommodationBooking } from '@/components/kawaii/AccommodationCard';

// Services
import { tripService } from '@/services/tripService';
import { bookingService, Booking, BookingType } from '@/services/bookingService';

// Stores
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';

// Hooks
import { useToast } from '@/hooks/useToast';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Components
import { BoardingPassCard } from '@/components/kawaii/BoardingPassCard';
import { AccommodationCard } from '@/components/kawaii/AccommodationCard';
import { AddBookingModal, BookingFormData, BookingCategory } from '@/components/kawaii/AddBookingModal';
import { StickerModal } from '@/components/kawaii/StickerModal';
import { StickerDisplay } from '@/components/kawaii/StickerDisplay';
import { PageLayout, NavigationWrapper, FABContainer } from '@/components/layout';
import type { NavigationTab } from '@/components/layout';

// Stores
import { useStickerStore } from '@/stores/stickerStore';

// Icons
import { 
  PlusIcon, 
  ChevronDownIcon,
  TicketIcon,
  BuildingOffice2Icon,
  TruckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/**
 * Booking section type
 */
type BookingSectionType = 'flights' | 'accommodation' | 'carRental' | 'tickets';

interface BookingSection {
  id: BookingSectionType;
  titleKey: string;
  icon: React.ComponentType<{ className?: string }>;
  catEmoji: string;
  types: BookingType[];
}

const bookingSections: BookingSection[] = [
  {
    id: 'flights',
    titleKey: 'booking.sections.flights',
    icon: TicketIcon,
    catEmoji: '✈️',
    types: ['flight', 'train'],
  },
  {
    id: 'accommodation',
    titleKey: 'booking.sections.accommodation',
    icon: BuildingOffice2Icon,
    catEmoji: '🏨',
    types: ['accommodation'],
  },
  {
    id: 'carRental',
    titleKey: 'booking.sections.carRental',
    icon: TruckIcon,
    catEmoji: '🚗',
    types: [],
  },
  {
    id: 'tickets',
    titleKey: 'booking.sections.attractionTickets',
    icon: SparklesIcon,
    catEmoji: '🎫',
    types: [],
  },
];

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900">
    <motion.div
      className="w-16 h-16 border-4 border-kawaii-primary-200 border-t-kawaii-primary-600 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

/**
 * Error display component
 */
const ErrorDisplay: React.FC<{ message: string; onRetry?: () => void; onGoHome?: () => void }> = ({
  message,
  onRetry,
  onGoHome,
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900 p-4">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">😢</span>
        <p className="text-xl text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-kawaii-primary-500 text-white rounded-lg hover:bg-kawaii-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="px-6 py-2 bg-kawaii-neutral-200 dark:bg-kawaii-neutral-700 text-kawaii-neutral-700 dark:text-kawaii-neutral-300 rounded-lg hover:bg-kawaii-neutral-300 dark:hover:bg-kawaii-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-kawaii-neutral-500 focus:ring-offset-2"
            >
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty state component for a section
 */
const SectionEmptyState: React.FC<{ 
  section: BookingSection; 
  onAdd: () => void;
}> = ({ section, onAdd }) => {
  const { t } = useTranslation('kawaii');

  return (
    <motion.div
      className="text-center py-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-5xl mb-3 block">{section.catEmoji}</span>
      <p className="text-sm text-kawaii-neutral-500 dark:text-kawaii-neutral-400 mb-4">
        {t('booking.noItemsInSection')}
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 text-sm bg-kawaii-primary-500 text-white rounded-lg hover:bg-kawaii-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:ring-offset-2"
      >
        <PlusIcon className="w-4 h-4 inline-block mr-1" />
        {t('booking.add')}
      </button>
    </motion.div>
  );
};

/**
 * Expandable booking section component
 */
const BookingSectionCard: React.FC<{
  section: BookingSection;
  bookings: Booking[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
  onAdd: () => void;
}> = ({ section, bookings, isExpanded, onToggle, onEdit, onDelete, onAdd }) => {
  const { t } = useTranslation('kawaii');
  const Icon = section.icon;

  return (
    <motion.div
      className="bg-white dark:bg-kawaii-neutral-800 rounded-2xl shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Section Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between p-5',
          'hover:bg-kawaii-neutral-50 dark:hover:bg-kawaii-neutral-700/50',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-kawaii-primary-500'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-kawaii-primary-100 dark:bg-kawaii-primary-900/30">
            <Icon className="w-5 h-5 text-kawaii-primary-600 dark:text-kawaii-primary-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
              {t(section.titleKey)}
            </h3>
            {bookings.length > 0 && (
              <p className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                {t('booking.itemCount', { count: bookings.length })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Count Badge */}
          {bookings.length > 0 && (
            <motion.span
              className="flex items-center justify-center min-w-[28px] h-7 px-2 text-sm font-bold text-kawaii-primary-700 dark:text-kawaii-primary-300 bg-kawaii-primary-100 dark:bg-kawaii-primary-900/30 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              {bookings.length}
            </motion.span>
          )}

          {/* Expand/Collapse Icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="w-5 h-5 text-kawaii-neutral-400 dark:text-kawaii-neutral-500" />
          </motion.div>
        </div>
      </button>

      {/* Section Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-kawaii-neutral-100 dark:border-kawaii-neutral-700 pt-4">
              {bookings.length === 0 ? (
                <SectionEmptyState section={section} onAdd={onAdd} />
              ) : (
                bookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    {section.types.includes('flight' as BookingType) || 
                     section.types.includes('train' as BookingType) ? (
                      <BoardingPassCard
                        booking={booking.data as FlightBooking}
                        onEdit={() => onEdit(booking)}
                        onDelete={() => onDelete(booking.id)}
                      />
                    ) : (
                      <AccommodationCard
                        booking={booking.data as AccommodationBooking}
                        onEdit={() => onEdit(booking)}
                        onDelete={() => onDelete(booking.id)}
                      />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Main BookingScreen component
 */
export const BookingScreen: React.FC = () => {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('kawaii');
  const { accessToken, logout } = useEnhancedAuthStore();
  const { showSuccess, showError } = useToast();

  // State
  const [trip, setTrip] = useState<Trip | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<BookingSectionType>>(
    new Set(['flights', 'accommodation'])
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navActiveTab, setNavActiveTab] = useState<NavigationTab>('booking');
  const [isAddBookingModalOpen, setIsAddBookingModalOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BookingCategory>('flights');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  /**
   * Fetch trip and booking data
   */
  const fetchData = async () => {
    if (!tripId || !accessToken) {
      setError('Missing trip ID or authentication');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch trip and bookings in parallel
      const [tripResponse, bookingsResponse] = await Promise.all([
        tripService.getTripById(tripId, accessToken),
        bookingService.getBookingsByTrip(tripId),
      ]);

      setTrip(tripResponse.data);
      setBookings(bookingsResponse.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);

      // Handle authentication errors
      if (err.status === 401 || err.message?.includes('Invalid or expired token')) {
        await logout();
        showError('Session Expired', 'Your session has expired. Please login again.');
        navigate('/login', { replace: true });
        return;
      }

      // Handle not found errors
      if (err.status === 404) {
        setError('Trip not found');
        return;
      }

      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when tripId changes
  useEffect(() => {
    fetchData();
    
    // Load stickers for this trip
    if (tripId) {
      console.log('BookingScreen: Loading stickers for trip');
      useStickerStore.getState().loadStickers(tripId);
      useStickerStore.getState().loadPlacements(tripId);
    }
  }, [tripId, accessToken]);

  /**
   * Toggle section expansion
   */
  const toggleSection = (sectionId: BookingSectionType) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  /**
   * Convert Booking to BookingFormData for editing
   */
  const convertBookingToFormData = (booking: Booking): Partial<BookingFormData> => {
    if (booking.type === 'flight' || booking.type === 'train') {
      const data = booking.data as FlightBooking;
      return {
        category: 'flights',
        type: data.type,
        origin: data.origin,
        destination: data.destination,
        flightNumber: data.flightNumber,
        date: data.date,
        route: data.route,
      };
    } else if (booking.type === 'accommodation') {
      const data = booking.data as AccommodationBooking;
      return {
        category: 'accommodation',
        name: data.name,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        location: data.location,
        confirmationNumber: data.confirmationNumber,
        notes: data.notes,
      };
    }
    return { category: 'flights' };
  };

  /**
   * Handle booking edit
   */
  const handleEdit = (booking: Booking) => {
    console.log('Edit booking:', booking);
    
    // Determine category from booking type
    let category: BookingCategory;
    if (booking.type === 'flight' || booking.type === 'train') {
      category = 'flights';
    } else if (booking.type === 'accommodation') {
      category = 'accommodation';
    } else {
      category = 'flights'; // fallback
    }
    
    setEditingBooking(booking);
    setSelectedCategory(category);
    setIsAddBookingModalOpen(true);
  };

  /**
   * Handle booking delete
   */
  const handleDelete = async (bookingId: string) => {
    if (!tripId) return;

    try {
      await bookingService.deleteBooking(tripId, bookingId);
      
      // Update local state
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      
      showSuccess('Success', 'Booking deleted successfully');
    } catch (err: any) {
      console.error('Error deleting booking:', err);
      showError('Error', err.message || 'Failed to delete booking');
    }
  };

  /**
   * Handle add sticker button click
   */
  const handleAddSticker = () => {
    console.log('✨ Opening sticker modal for trip:', tripId);
    setIsStickerModalOpen(true);
  };

  /**
   * Handle sticker selection
   */
  const { attachSticker, loadPlacements } = useStickerStore();
  
  const handleStickerSelect = async (stickerId: string) => {
    if (!tripId) return;

    try {
      console.log('📌 Attaching sticker to trip:', { stickerId, tripId });
      
      // Attach sticker to the trip itself (use 'trip' as entity type, not 'booking')
      await attachSticker(tripId, stickerId, tripId, 'trip', { x: 50, y: 50 });
      
      // Reload placements to show the new sticker without full page refresh
      await loadPlacements(tripId);
      
      setIsStickerModalOpen(false);
      showSuccess('Success', 'Sticker added successfully!');
    } catch (err: any) {
      console.error('Error attaching sticker:', err);
      showError('Error', err.message || 'Failed to attach sticker');
    }
  };

  /**
   * Handle add booking FAB click
   */
  const handleAddBooking = (sectionId?: BookingSectionType) => {
    console.log('Add booking for section:', sectionId);
    
    // Map section ID to category
    const categoryMap: Record<BookingSectionType, BookingCategory> = {
      flights: 'flights',
      accommodation: 'accommodation',
      carRental: 'carRental',
      tickets: 'tickets',
    };
    
    setSelectedCategory(sectionId ? categoryMap[sectionId] : 'flights');
    setIsAddBookingModalOpen(true);
  };

  /**
   * Handle booking form submission
   */
  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!tripId) return;

    try {
      setIsSubmitting(true);
      console.log('Submitting booking:', data, 'Editing:', editingBooking);

      // Determine booking type based on category
      let bookingType: BookingType;
      let bookingData: any;

      if (data.category === 'flights') {
        bookingType = data.type || 'flight';
        bookingData = {
          id: editingBooking?.data.id || `${bookingType}-${Date.now()}`,
          type: bookingType,
          origin: data.origin,
          destination: data.destination,
          flightNumber: data.flightNumber,
          date: data.date,
          route: data.route,
        };
      } else if (data.category === 'accommodation') {
        bookingType = 'accommodation';
        bookingData = {
          id: editingBooking?.data.id || `accommodation-${Date.now()}`,
          name: data.name,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          location: data.location,
          confirmationNumber: data.confirmationNumber,
          notes: data.notes,
        };
      } else {
        showError('Error', 'This booking type is not yet supported');
        return;
      }

      if (editingBooking) {
        // Update existing booking
        await bookingService.updateBooking(tripId, editingBooking.id, bookingData);
        showSuccess('Success', 'Booking updated successfully!');
      } else {
        // Create new booking
        await bookingService.createBooking(tripId, bookingType, bookingData);
        showSuccess('Success', 'Booking added successfully!');
      }

      // Refresh bookings
      const bookingsResponse = await bookingService.getBookingsByTrip(tripId);
      setBookings(bookingsResponse.data);

      // Close modal and reset editing state
      setIsAddBookingModalOpen(false);
      setEditingBooking(null);
    } catch (err: any) {
      console.error('Error saving booking:', err);
      showError('Error', err.message || 'Failed to save booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle tab change in navigation
   */
  const handleNavTabChange = (tab: string) => {
    setNavActiveTab(tab);

    // Navigate to different sections based on tab
    switch (tab) {
      case 'schedule':
        navigate(`/trips/${tripId}`);
        break;
      case 'booking':
        // Already on booking
        break;
      case 'budget':
        navigate(`/trips/${tripId}/budget`);
        break;
      case 'shopping':
        navigate(`/trips/${tripId}/shopping`);
        break;
      case 'checklist':
        navigate(`/trips/${tripId}/checklist`);
        break;
      case 'members':
        navigate(`/trips/${tripId}/members`);
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  // Filter bookings by section
  const getBookingsForSection = (section: BookingSection): Booking[] => {
    if (section.types.length === 0) return [];
    return bookings.filter((b) => section.types.includes(b.type));
  };

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error || !trip) {
    return (
      <ErrorDisplay
        message={error || 'Trip not found'}
        onRetry={error ? fetchData : undefined}
        onGoHome={() => navigate('/')}
      />
    );
  }

  return (
    <PageLayout tripId={tripId} showStickers maxWidth="xl">
      <NavigationWrapper
        activeTab={navActiveTab}
        onTabChange={handleNavTabChange}
      >
        {/* Header Section with Gradient Background and Cat Decorations */}
        <div className="relative bg-gradient-to-br from-kawaii-primary-100 via-pink-100 to-kawaii-primary-200 dark:from-kawaii-primary-900/30 dark:via-pink-900/30 dark:to-kawaii-primary-800/30 p-6 md:p-8 overflow-hidden">
          {/* Decorative elements */}

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Trip Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-2">
                {trip.title}
              </h1>
              <p className="text-lg text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-4">
                {t('booking.title')} {/* 預約管理 */}
              </p>
              <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                {t('booking.subtitle')}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Bookings Sections */}
        <div className="max-w-7xl mx-auto p-4 md:p-8 relative">
          {/* Sticker Display - overlays on the booking content */}
          {tripId && (
            <StickerDisplay
              elementId={tripId}
              elementType="trip"
              tripId={tripId}
              editable={true}
              className="absolute inset-0 pointer-events-none"
            />
          )}
          
          <div className="space-y-4 relative z-10">
            {bookingSections
              .filter((section) => section.id === 'flights' || section.id === 'accommodation')
              .map((section, index) => {
                const sectionBookings = getBookingsForSection(section);
                
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <BookingSectionCard
                      section={section}
                      bookings={sectionBookings}
                      isExpanded={expandedSections.has(section.id)}
                      onToggle={() => toggleSection(section.id)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAdd={() => handleAddBooking(section.id)}
                    />
                  </motion.div>
                );
              })}
          </div>
        </div>
      </NavigationWrapper>

      {/* Add/Edit Booking Modal */}
      <AddBookingModal
        isOpen={isAddBookingModalOpen}
        onClose={() => {
          setIsAddBookingModalOpen(false);
          setEditingBooking(null);
        }}
        onSubmit={handleBookingSubmit}
        isSubmitting={isSubmitting}
        initialCategory={selectedCategory}
        initialData={editingBooking ? convertBookingToFormData(editingBooking) : undefined}
        isEditing={!!editingBooking}
      />

      {/* Sticker Modal */}
      <StickerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        onSelect={handleStickerSelect}
        tripId={tripId || ''}
      />

      {/* Floating Action Buttons */}
      <FABContainer
        primary={{
          icon: <PlusIcon className="w-6 h-6" />,
          onClick: () => handleAddBooking(),
          label: t('booking.addBooking')
        }}
        secondary={[
          {
            icon: <SparklesIcon className="w-5 h-5" />,
            onClick: handleAddSticker,
            label: t('stickers.attach')
          }
        ]}
      />
    </PageLayout>
  );
};

export default BookingScreen;
