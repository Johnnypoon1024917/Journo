/**
 * Kawaii ChecklistScreen Page Component
 * 
 * Main checklist screen that integrates all kawaii checklist components.
 * 
 * Features:
 * - ChecklistProgress for displaying progress bar and statistics
 * - ChecklistItem for displaying individual items
 * - FAB for adding new items
 * - Checklist item add/edit/delete/toggle functionality
 * - Support categorization (packing, documents, tasks)
 * - Connection to packing service (backend API)
 * - Responsive design with bottom/side navigation
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

// Types
import { Trip } from '@/types/trip';
import {
  PackingItem,
  PackingListProgress,
  PackingCategory,
  CreatePackingItemDto,
  UpdatePackingItemDto,
} from '@/types/packing';

// Services
import { tripService } from '@/services/tripService';
import { packingService } from '@/services/packingService';

// Stores
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';

// Hooks
import { useToast } from '@/hooks/useToast';
import { useFABPosition, getFABStyle } from '@/hooks/useFABPosition';
import { useScrollDirection } from '@/hooks/useScrollDirection';

// Components
import { CategorySection } from '@/components/kawaii/CategorySection';
import { KawaiiModal } from '@/components/kawaii/KawaiiModal';
import { DEFAULT_PACKING_ITEMS } from '@/services/defaultPackingItems';
import { PageLayout, NavigationWrapper } from '@/components/layout';
import type { NavigationTab } from '@/components/layout';

// Icons
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
 * Empty state component
 */
const EmptyState: React.FC<{ onAdd: () => void; onLoadDefaults: () => void }> = ({ onAdd, onLoadDefaults }) => {
  const { t } = useTranslation('packing');

  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="text-8xl mb-6 block">📋</span>
      <h3 className="text-2xl font-semibold text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-3">
        {t('checklist.noItems')}
      </h3>
      <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-6 max-w-md mx-auto">
        {t('checklist.emptyDescription')}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onLoadDefaults}
          className="px-6 py-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <SparklesIcon className="w-5 h-5" />
          {t('checklist.loadDefaults')}
        </button>
        <button
          onClick={onAdd}
          className="px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          {t('checklist.addItem')}
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Add/Edit Item Modal Component
 */
interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { item: string; category: PackingCategory | null }) => void;
  editItem?: PackingItem | null;
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSave, editItem }) => {
  const { t } = useTranslation('packing');
  const { t: tCommon } = useTranslation('common');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<PackingCategory | null>(null);

  // Update form when editItem changes
  useEffect(() => {
    if (editItem) {
      setItemName(editItem.name);
      setCategory(editItem.category);
    } else {
      setItemName('');
      setCategory(null);
    }
  }, [editItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName.trim()) {
      onSave({ item: itemName.trim(), category });
      setItemName('');
      setCategory(null);
      onClose();
    }
  };

  const categories: PackingCategory[] = [
    'clothing',
    'warm_layers',
    'toiletries',
    'electronics',
    'documents',
    'health',
    'misc',
    'snacks',
  ];

  return (
    <KawaiiModal
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? t('checklist.editItem') : t('checklist.addItem')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Name Input */}
        <div>
          <label
            htmlFor="item-name"
            className="block text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-2"
          >
            {t('checklist.itemName')}
          </label>
          <input
            id="item-name"
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={t('checklist.itemNamePlaceholder')}
            className={cn(
              'w-full px-4 py-3',
              'bg-white dark:bg-kawaii-neutral-800',
              'border-2 border-[#d5d0c2] dark:border-kawaii-neutral-700',
              'rounded-xl',
              'text-kawaii-neutral-900 dark:text-kawaii-neutral-100',
              'placeholder-kawaii-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:border-transparent',
              'transition-all duration-200'
            )}
            autoFocus
          />
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-2">
            {t('checklist.category')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500',
                  category === cat
                    ? 'bg-kawaii-primary-500 text-white'
                    : 'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-700 text-kawaii-neutral-700 dark:text-kawaii-neutral-300 hover:bg-kawaii-neutral-200 dark:hover:bg-kawaii-neutral-600'
                )}
              >
                {t(`categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl',
              'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-700',
              'text-kawaii-neutral-700 dark:text-kawaii-neutral-300',
              'font-medium',
              'hover:bg-kawaii-neutral-200 dark:hover:bg-kawaii-neutral-600',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-kawaii-neutral-500'
            )}
          >
            {tCommon('actions.cancel')}
          </button>
          <button
            type="submit"
            disabled={!itemName.trim()}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl',
              'bg-gradient-to-br from-primary-500 to-primary-600',
              'text-white font-medium',
              'hover:shadow-lg',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {editItem ? tCommon('actions.save') : tCommon('actions.add')}
          </button>
        </div>
      </form>
    </KawaiiModal>
  );
};

/**
 * Main ChecklistScreen component
 */
export const ChecklistScreen: React.FC = () => {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('packing');
  const { accessToken, logout } = useEnhancedAuthStore();
  const { showSuccess, showError } = useToast();

  // State
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [progress, setProgress] = useState<PackingListProgress>({
    total_items: 0,
    checked_items: 0,
    percentage: 0,
    by_category: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navActiveTab, setNavActiveTab] = useState<NavigationTab>('checklist');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // FAB positioning - primary action (add item) at index 1, secondary (add sticker) at index 2
  const addItemFABPosition = useFABPosition({ type: 'primary', index: 1, hasBottomNav: true });
  const addStickerFABPosition = useFABPosition({ type: 'secondary', index: 2, hasBottomNav: true });

  // Scroll direction detection for collapsible FABs
  const { isScrollingDown, isAtTop } = useScrollDirection({ threshold: 5 });

  /**
   * Group items by category
   */
  const itemsByCategory = React.useMemo(() => {
    const grouped = new Map<string, PackingItem[]>();
    
    items.forEach(item => {
      const category = item.category || 'misc';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });

    return grouped;
  }, [items]);

  /**
   * Get all categories (sorted)
   */
  const categories = React.useMemo(() => {
    return Array.from(itemsByCategory.keys()).sort();
  }, [itemsByCategory]);

  /**
   * Toggle category expansion
   */
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  /**
   * Expand all categories
   */
  const expandAll = () => {
    setExpandedCategories(new Set(categories));
  };

  /**
   * Collapse all categories
   */
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  /**
   * Initialize with all categories expanded
   */
  React.useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(categories));
    }
  }, [categories]);

  /**
   * Fetch trip and checklist data
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

      // Fetch trip first
      const tripResponse = await tripService.getTripById(tripId, accessToken);
      setTrip(tripResponse.data);

      // Then fetch packing items and progress
      try {
        const [itemsResponse, progressResponse] = await Promise.all([
          packingService.getPackingItems(tripId),
          packingService.getPackingProgress(tripId),
        ]);

        setItems(itemsResponse);
        setProgress(progressResponse);
      } catch (packingError: any) {
        // If packing items fail, just set empty arrays
        console.warn('Packing items not available:', packingError);
        setItems([]);
        setProgress({
          total_items: 0,
          checked_items: 0,
          percentage: 0,
          by_category: {},
        });
      }
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
  }, [tripId, accessToken]);

  /**
   * Update progress when items change
   */
  const updateProgress = async () => {
    if (!tripId) return;

    try {
      const progressResponse = await packingService.getPackingProgress(tripId);
      setProgress(progressResponse);
    } catch (err: any) {
      console.error('Error updating progress:', err);
    }
  };

  /**
   * Handle item toggle
   */
  const handleToggle = async (itemId: string) => {
    if (!tripId) return;

    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const updatedItem = await packingService.togglePackingItem(
        tripId,
        itemId,
        !item.is_packed
      );

      // Update local state
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? updatedItem : i))
      );

      // Update progress
      await updateProgress();
    } catch (err: any) {
      console.error('Error toggling item:', err);
      showError('Error', err.message || 'Failed to update item');
    }
  };

  /**
   * Handle item edit
   */
  const handleEdit = (item: PackingItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  /**
   * Handle item delete
   */
  const handleDelete = async (itemId: string) => {
    if (!tripId) return;

    try {
      await packingService.deletePackingItem(tripId, itemId);

      // Update local state
      setItems((prev) => prev.filter((item) => item.id !== itemId));

      // Update progress
      await updateProgress();

      showSuccess('Success', t('checklist.itemDeleted'));
    } catch (err: any) {
      console.error('Error deleting item:', err);
      showError('Error', err.message || 'Failed to delete item');
    }
  };

  /**
   * Handle add item FAB click
   */
  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  /**
   * Handle save item (add or edit)
   */
  const handleSaveItem = async (data: { item: string; category: PackingCategory | null }) => {
    if (!tripId) return;

    try {
      if (editingItem) {
        // Update existing item
        const updateData: UpdatePackingItemDto = {
          name: data.item,
          category: data.category || undefined,
        };
        const updatedItem = await packingService.updatePackingItem(
          tripId,
          editingItem.id,
          updateData
        );

        // Update local state
        setItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? updatedItem : i))
        );

        showSuccess('Success', t('checklist.itemUpdated'));
      } else {
        // Add new item
        const createData: CreatePackingItemDto = {
          name: data.item,
          category: data.category || 'misc',
          quantity: 1,
        };
        const newItem = await packingService.addPackingItem(tripId, createData);

        // Update local state
        setItems((prev) => [...prev, newItem]);

        showSuccess('Success', t('checklist.itemAdded'));
      }

      // Update progress
      await updateProgress();
    } catch (err: any) {
      console.error('Error saving item:', err);
      showError('Error', err.message || 'Failed to save item');
    }
  };

  /**
   * Handle load default items
   */
  const handleLoadDefaults = async () => {
    if (!tripId) return;

    try {
      setIsLoading(true);
      
      // Add all default items
      const promises = DEFAULT_PACKING_ITEMS.map(defaultItem =>
        packingService.addPackingItem(tripId, {
          name: defaultItem.item,
          category: defaultItem.category,
          notes: defaultItem.notes,
          quantity: 1,
        })
      );

      await Promise.all(promises);

      // Refresh data
      await fetchData();
      
      showSuccess('Success', t('checklist.defaultsLoaded'));
    } catch (err: any) {
      console.error('Error loading default items:', err);
      showError('Error', err.message || 'Failed to load default items');
    } finally {
      setIsLoading(false);
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
      case 'budget':
        navigate(`/trips/${tripId}/budget`);
        break;
      case 'shopping':
        navigate(`/trips/${tripId}/shopping`);
        break;
      case 'checklist':
        // Already on checklist
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
        {/* Header Section */}
        <div className="w-full bg-white dark:bg-kawaii-neutral-800 border-b border-[#d5d0c2] dark:border-kawaii-neutral-700">
          <div className="max-w-7xl mx-auto px-4 py-6 w-full">
            {/* Title Row with Add Button */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-1">
                  {t('checklist.title')}
                </h1>
                <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                  {t('checklist.subtitle')}
                </p>
              </div>

              {/* Cat Illustration */}
              {/* <div className="flex-shrink-0 mx-4">
                <motion.div
                  className="text-5xl md:text-6xl"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                >
                  🐱🎒
                </motion.div>
              </div> */}
              
              {/* Add Button - Pink Rounded */}
              {/* <motion.button
                onClick={handleAddItem}
                className="flex-shrink-0 px-6 py-2.5 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusIcon className="w-5 h-5" />
                <span>{t('checklist.addItem')}</span>
              </motion.button> */}

            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {/* To Pack Card */}
              <motion.div
                className="bg-[#f7f3eb] dark:bg-kawaii-neutral-700 rounded-2xl p-4 border-2 border-[#d5d0c2] dark:border-kawaii-neutral-600"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
                      {progress.total_items - progress.checked_items}
                    </div>
                    <div className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mt-1">
                      {t('checklist.toPack')}
                    </div>
                  </div>
                  <div className="text-4xl">
                    🧳
                  </div>
                </div>
              </motion.div>

              {/* Packed Card */}
              <motion.div
                className="bg-[#f7f3eb] dark:bg-kawaii-neutral-700 rounded-2xl p-4 border-2 border-[#d5d0c2] dark:border-kawaii-neutral-600"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
                      {progress.checked_items}
                    </div>
                    <div className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mt-1">
                      {t('checklist.packed')}
                    </div>
                  </div>
                  <div className="text-4xl">
                    ✅
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Checklist Items Content Section */}
        <div className="max-w-7xl mx-auto px-4 py-6 w-full">
          {/* Section Header with Expand/Collapse All */}
          {items.length > 0 && (
            <motion.div
              className="flex items-center justify-between mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
                {t('checklist.toPack')}
              </h2>
              
              {/* Expand/Collapse All Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className={cn(
                    'px-3 py-1.5 text-sm',
                    'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-800',
                    'text-kawaii-neutral-700 dark:text-kawaii-neutral-300',
                    'rounded-lg',
                    'hover:bg-kawaii-neutral-200 dark:hover:bg-kawaii-neutral-700',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-kawaii-primary/50'
                  )}
                >
                  {t('checklist.expandAll')}
                </button>
                <button
                  onClick={collapseAll}
                  className={cn(
                    'px-3 py-1.5 text-sm',
                    'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-800',
                    'text-kawaii-neutral-700 dark:text-kawaii-neutral-300',
                    'rounded-lg',
                    'hover:bg-kawaii-neutral-200 dark:hover:bg-kawaii-neutral-700',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-kawaii-primary/50'
                  )}
                >
                  {t('checklist.collapseAll')}
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Checklist Items by Category */}
          <AnimatePresence mode="wait">
            {items.length === 0 ? (
              <EmptyState key="empty" onAdd={handleAddItem} onLoadDefaults={handleLoadDefaults} />
            ) : (
              <motion.div
                key="categories"
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {categories.map((category, index) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <CategorySection
                      category={category}
                      items={itemsByCategory.get(category) || []}
                      isExpanded={expandedCategories.has(category)}
                      onToggleExpand={() => toggleCategory(category)}
                      onToggleItem={handleToggle}
                      onEditItem={handleEdit}
                      onDeleteItem={handleDelete}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageLayout>

      {/* Add/Edit Item Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editItem={editingItem}
      />

      {/* Floating Action Buttons */}
      <motion.button
        onClick={handleAddItem}
        style={getFABStyle(addItemFABPosition)}
        className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all text-white"
        aria-label={t('checklist.addItem')}
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
        onClick={() => {}} // TODO: Add sticker functionality
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

export default ChecklistScreen;
