/**
 * BubbleQuest ShoppingScreen Page Component
 * 
 * Main shopping screen that integrates all BubbleQuest shopping components.
 * 
 * Features:
 * - ShoppingStats for displaying to buy/bought counts
 * - FilterDropdown for filtering by category
 * - ShoppingItem for displaying individual items
 * - FAB for adding new items
 * - Shopping item add/edit/delete/toggle functionality
 * - Connection to shopping service (localStorage-based, ready for API)
 * - Responsive design with bottom/side navigation
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// Types
import { Trip } from '@/types/trip';
import {
  ShoppingItem as ShoppingItemType,
  ShoppingStats as ShoppingStatsType,
  ShoppingFilterOption,
} from '@/types/shopping';

// Services
import { tripService } from '@/services/tripService';
import { shoppingService } from '@/services/shoppingService';

// Stores
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';

// Hooks
import { useToast } from '@/hooks/useToast';
import { useFABPosition, getFABStyle } from '@/hooks/useFABPosition';
import { useScrollDirection } from '@/hooks/useScrollDirection';

// Components
import { FilterDropdown } from '@/components/bubblequest/FilterDropdown';
import { ShoppingItem } from '@/components/bubblequest/ShoppingItem';
import { StickerModal } from '@/components/bubblequest/StickerModal';
import { StickerDisplay } from '@/components/bubblequest/StickerDisplay';
import { AddShoppingItemModal, ShoppingItemFormData } from '@/components/bubblequest/AddShoppingItemModal';
import { PageLayout, NavigationWrapper } from '@/components/layout';
import type { NavigationTab } from '@/components/layout';

// Stores
import { useStickerStore } from '@/stores/stickerStore';

// Icons
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#f7f3eb] dark:bg-bubblequest-neutral-900">
    <motion.div
      className="w-16 h-16 border-4 border-bubblequest-primary-200 border-t-bubblequest-primary-600 rounded-full"
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
    <div className="flex items-center justify-center min-h-screen bg-[#f7f3eb] dark:bg-bubblequest-neutral-900 p-4">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">😢</span>
        <p className="text-xl text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-bubblequest-primary-500 text-white rounded-lg hover:bg-bubblequest-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="px-6 py-2 bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 rounded-lg hover:bg-bubblequest-neutral-300 dark:hover:bg-bubblequest-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-bubblequest-neutral-500 focus:ring-offset-2"
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
 * Empty state component
 */
const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
  const { t } = useTranslation('bubbleQuest');

  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="text-8xl mb-6 block">🛍️</span>
      <h3 className="text-2xl font-semibold text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-3">
        {t('shopping.noItems')}
      </h3>
      <p className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mb-6 max-w-md mx-auto">
        Start building your shopping list for the trip
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        <PlusIcon className="w-5 h-5 inline-block mr-2" />
        {t('shopping.addItem')}
      </button>
    </motion.div>
  );
};

/**
 * Main ShoppingScreen component
 */
export const ShoppingScreen: React.FC = () => {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('bubbleQuest');
  const { accessToken, logout } = useEnhancedAuthStore();
  const { showSuccess, showError } = useToast();

  // State
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<ShoppingItemType[]>([]);
  const [filteredItems, setFilteredItems] = useState<ShoppingItemType[]>([]);
  const [stats, setStats] = useState<ShoppingStatsType>({ toBuy: 0, bought: 0, total: 0 });
  const [filterOptions, setFilterOptions] = useState<ShoppingFilterOption[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navActiveTab, setNavActiveTab] = useState<NavigationTab>('shopping');
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItemType | null>(null);

  // FAB positioning - primary action (add item) at index 0, secondary (add sticker) at index 1
  const addItemFABPosition = useFABPosition({ type: 'primary', index: 0, hasBottomNav: true });
  const addStickerFABPosition = useFABPosition({ type: 'secondary', index: 1, hasBottomNav: true });

  // Scroll direction detection for collapsible FABs
  const { isScrollingDown } = useScrollDirection({ threshold: 5 });

  /**
   * Fetch trip and shopping data
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

      // Fetch trip, items, stats, and filter options in parallel
      const [tripResponse, itemsResponse, statsResponse, options] = await Promise.all([
        tripService.getTripById(tripId, accessToken),
        shoppingService.getShoppingItems(tripId),
        shoppingService.getShoppingStats(tripId),
        shoppingService.getFilterOptions(tripId),
      ]);

      setTrip(tripResponse.data);
      setItems(itemsResponse.data);
      setFilteredItems(itemsResponse.data);
      setStats(statsResponse.data);
      setFilterOptions(options);
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
      console.log('ShoppingScreen: Loading stickers for trip');
      useStickerStore.getState().loadStickers(tripId);
      useStickerStore.getState().loadPlacements(tripId);
    }
  }, [tripId, accessToken]);

  /**
   * Update stats and filter options when items change
   */
  const updateStatsAndFilters = async () => {
    if (!tripId) return;

    try {
      const [statsResponse, options] = await Promise.all([
        shoppingService.getShoppingStats(tripId),
        shoppingService.getFilterOptions(tripId),
      ]);

      setStats(statsResponse.data);
      setFilterOptions(options);
    } catch (err: any) {
      console.error('Error updating stats:', err);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = async (filterId: string) => {
    if (!tripId) return;

    setSelectedFilter(filterId);

    try {
      const response = await shoppingService.getFilteredItems(tripId, filterId);
      setFilteredItems(response.data);
    } catch (err: any) {
      console.error('Error filtering items:', err);
      showError('Error', err.message || 'Failed to filter items');
    }
  };

  /**
   * Handle item toggle
   */
  const handleToggle = async (itemId: string) => {
    if (!tripId) return;

    try {
      const response = await shoppingService.toggleShoppingItem(tripId, itemId);
      
      if (response) {
        // Update local state
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? response.data : item))
        );
        setFilteredItems((prev) =>
          prev.map((item) => (item.id === itemId ? response.data : item))
        );

        // Update stats
        await updateStatsAndFilters();
      }
    } catch (err: any) {
      console.error('Error toggling item:', err);
      showError('Error', err.message || 'Failed to update item');
    }
  };

  /**
   * Handle item edit
   */
  const handleEdit = (item: ShoppingItemType) => {
    console.log('Edit item:', item);
    setEditingItem(item);
    setIsAddItemModalOpen(true);
  };

  /**
   * Handle item delete
   */
  const handleDelete = async (itemId: string) => {
    if (!tripId) return;

    try {
      await shoppingService.deleteShoppingItem(tripId, itemId);
      
      // Update local state
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setFilteredItems((prev) => prev.filter((item) => item.id !== itemId));

      // Update stats and filters
      await updateStatsAndFilters();
      
      showSuccess('Success', 'Item deleted successfully');
    } catch (err: any) {
      console.error('Error deleting item:', err);
      showError('Error', err.message || 'Failed to delete item');
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
      
      // Attach sticker to the trip itself
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
   * Handle add item button click
   */
  const handleAddItem = () => {
    console.log('Opening add item modal');
    setEditingItem(null);
    setIsAddItemModalOpen(true);
  };

  /**
   * Handle shopping item form submission
   */
  const handleItemSubmit = async (formData: ShoppingItemFormData) => {
    if (!tripId) return;

    try {
      setIsSubmitting(true);

      if (editingItem) {
        // Update existing item
        const updatedItem = await shoppingService.updateShoppingItem(tripId, editingItem.id, {
          name: formData.name,
          store: formData.store,
          weblink: formData.weblink,
          tags: formData.tags as any,
          priority: formData.priority,
        });

        // Update local state
        if (updatedItem) {
          setItems((prev) =>
            prev.map((item) => (item.id === editingItem.id ? updatedItem.data : item))
          );
          setFilteredItems((prev) =>
            prev.map((item) => (item.id === editingItem.id ? updatedItem.data : item))
          );
        }

        showSuccess('Success', 'Item updated successfully');
      } else {
        // Create new item
        const newItem = await shoppingService.createShoppingItem({
          trip_id: tripId,
          name: formData.name,
          store: formData.store,
          weblink: formData.weblink,
          tags: formData.tags as any,
          priority: formData.priority,
        });

        // Update local state
        setItems((prev) => [...prev, newItem.data]);
        setFilteredItems((prev) => [...prev, newItem.data]);

        showSuccess('Success', 'Item added successfully');
      }

      // Update stats and filters
      await updateStatsAndFilters();

      // Close modal
      setIsAddItemModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error('Error saving item:', err);
      showError('Error', err.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle tab change in navigation
   */
  const handleNavTabChange = (tab: NavigationTab) => {
    setNavActiveTab(tab);

    // Navigate to different sections based on tab
    switch (tab) {
      case 'schedule':
        navigate(`/trips/${tripId}`);
        break;
      case 'booking':
        navigate(`/trips/${tripId}/booking`);
        break;
      case 'shopping':
        // Already on shopping
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
    <NavigationWrapper
      activeTab={navActiveTab}
      onTabChange={handleNavTabChange}
    >
      <PageLayout tripId={tripId} showStickers>
        {/* Header Section - Matching Screenshot Design */}
        <div className="sticky top-0 z-30 w-full bg-white dark:bg-bubblequest-neutral-800 border-b border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 w-full bg-white dark:bg-bubblequest-neutral-800">
            {/* Title Row with Add Button */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-1">
                  {t('shopping.title')}
                </h1>
                <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
                  {t('shopping.subtitle')}
                </p>
              </div>
              
              {/* Cat Illustration */}
              {/*<div className="flex-shrink-0 mx-4">
                <motion.div
                  className="text-5xl md:text-6xl"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                >
                  🐱🛍️
                </motion.div>
              </div>*/}
              
              {/* Add Button - Pink Rounded */}
              {/*<motion.button
                onClick={handleAddItem}
                className="flex-shrink-0 px-6 py-2.5 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusIcon className="w-5 h-5" />
                <span>{t('shopping.addItem')}</span>
              </motion.button>*/}
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {/* To Buy Card */}
              <motion.div
                className="bg-[#f7f3eb] dark:bg-bubblequest-neutral-700 rounded-2xl p-4 border-2 border-[#d5d0c2] dark:border-bubblequest-neutral-600"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
                      {stats.toBuy}
                    </div>
                    <div className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mt-1">
                      {t('shopping.toBuy')}
                    </div>
                  </div>
                  <div className="text-4xl">
                    🛒
                  </div>
                </div>
              </motion.div>

              {/* Bought Card */}
              <motion.div
                className="bg-[#f7f3eb] dark:bg-bubblequest-neutral-700 rounded-2xl p-4 border-2 border-[#d5d0c2] dark:border-bubblequest-neutral-600"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
                      {stats.bought}
                    </div>
                    <div className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mt-1">
                      {t('shopping.bought')}
                    </div>
                  </div>
                  <div className="text-4xl">
                    👜
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Shopping Items Content Section */}
        <div className="max-w-7xl mx-auto px-4 py-6 w-full relative">
          {/* Sticker Display - overlays on the shopping content */}
          {tripId && (
            <StickerDisplay
              elementId={tripId}
              elementType="trip"
              tripId={tripId}
              editable={true}
              className="absolute inset-0 pointer-events-none"
            />
          )}
          
          {/* Section Header with Filter */}
          {items.length > 0 && (
            <motion.div
              className="flex items-center justify-between mb-4 relative z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
                {t('shopping.toBuy')}
              </h2>
              <div className="flex items-center gap-2 relative">
                {/* Sticker Button */}
                <motion.button
                  onClick={handleAddSticker}
                  className="p-2 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Add Sticker"
                >
                  <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </motion.button>
                <div className="relative z-20">
                  <FilterDropdown
                    options={filterOptions}
                    selectedFilter={selectedFilter}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Shopping Items List */}
          <AnimatePresence mode="wait">
            {filteredItems.length === 0 ? (
              items.length === 0 ? (
                <EmptyState key="empty" onAdd={handleAddItem} />
              ) : (
                <motion.div
                  key="no-results"
                  className="text-center py-16 relative z-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-6xl mb-4 block">🔍</span>
                  <p className="text-xl text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                    {t('shopping.noResults')}
                  </p>
                </motion.div>
              )
            ) : (
              <motion.div
                key="items"
                className="space-y-4 relative z-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ShoppingItem
                      item={item}
                      onToggle={handleToggle}
                      onEdit={() => handleEdit(item)}
                      onDelete={() => handleDelete(item.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageLayout>

      {/* Add/Edit Shopping Item Modal */}
      <AddShoppingItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleItemSubmit}
        isSubmitting={isSubmitting}
        initialData={editingItem ? {
          name: editingItem.name,
          store: editingItem.store,
          weblink: editingItem.weblink,
          tags: editingItem.tags,
          priority: editingItem.priority,
        } : undefined}
        isEditing={!!editingItem}
      />

      {/* Sticker Modal */}
      <StickerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        onSelect={handleStickerSelect}
        tripId={tripId || ''}
      />

      {/* Floating Action Buttons */}
      <motion.button
        onClick={handleAddItem}
        style={getFABStyle(addItemFABPosition)}
        className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all text-white"
        aria-label={t('shopping.addItem')}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ 
          scale: isScrollingDown ? 0 : 1,
          opacity: isScrollingDown ? 0 : 1,
        }}
        transition={{ 
          duration: 0.2,
          ease: 'easeInOut'
        }}
      >
        <PlusIcon className="w-6 h-6" />
      </motion.button>

      <motion.button
        onClick={handleAddSticker}
        style={getFABStyle(addStickerFABPosition)}
        className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all text-white"
        aria-label="Add Sticker"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ 
          scale: isScrollingDown ? 0 : 1,
          opacity: isScrollingDown ? 0 : 1,
        }}
        transition={{ 
          duration: 0.2,
          ease: 'easeInOut'
        }}
      >
        <SparklesIcon className="w-6 h-6" />
      </motion.button>
    </NavigationWrapper>
  );
};

export default ShoppingScreen;
