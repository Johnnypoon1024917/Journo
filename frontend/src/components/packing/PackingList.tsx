import React, { useState, useEffect, useCallback } from 'react';
import {
  PackingItem as PackingItemType,
  PackingCategory as CategoryType,
  PackingListProgress,
} from '../../types/packing';
import { packingService } from '../../services/packingService';
import { packingExportService } from '../../services/packingExportService';
import { PackingCategory } from './PackingCategory.tsx';
import { PackingProgress } from './PackingProgress.tsx';
import { AddPackingItem } from './AddPackingItem.tsx';
import { TravelerManager } from './TravelerManager.tsx';
import { useSocket } from '../../hooks/useSocket';
import { Traveler } from '../../types/packing';

interface PackingListProps {
  tripId: string;
  tripTitle?: string;
}

export const PackingList: React.FC<PackingListProps> = ({ tripId, tripTitle = 'Trip' }) => {
  const [items, setItems] = useState<PackingItemType[]>([]);
  const [progress, setProgress] = useState<PackingListProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Default category order
  const defaultCategories: CategoryType[] = [
    'documents',
    'clothing',
    'electronics',
    'toiletries',
    'health',
    'misc',
    'snacks',
    'warm_layers',
  ];

  // Get all unique categories from items (including custom ones)
  const allCategories = React.useMemo(() => {
    const itemCategories = new Set(items.map(item => item.category).filter(Boolean));
    const categories: string[] = [];
    
    // Add default categories first (in order)
    defaultCategories.forEach(cat => {
      if (itemCategories.has(cat)) {
        categories.push(cat);
      }
    });
    
    // Add any custom categories
    itemCategories.forEach(cat => {
      if (cat && !defaultCategories.includes(cat as CategoryType)) {
        categories.push(cat);
      }
    });
    
    return categories;
  }, [items]);

  // Handle real-time packing updates via Socket.IO
  const handlePackingUpdate = useCallback((data: any) => {
    console.log('Packing update received:', data);
    
    if (data.action === 'added' && data.item) {
      setItems((prev) => {
        // Check if item already exists
        if (prev.some(item => item.id === data.item.id)) {
          return prev;
        }
        return [...prev, data.item];
      });
      // Reload progress
      packingService.getPackingProgress(tripId).then(setProgress);
    } else if (data.action === 'updated' && data.item) {
      setItems((prev) =>
        prev.map((item) => (item.id === data.item.id ? data.item : item))
      );
      // Reload progress
      packingService.getPackingProgress(tripId).then(setProgress);
    } else if (data.action === 'deleted' && data.itemId) {
      setItems((prev) => prev.filter((item) => item.id !== data.itemId));
      // Reload progress
      packingService.getPackingProgress(tripId).then(setProgress);
    }
  }, [tripId]);

  // Set up Socket.IO connection
  useSocket({
    tripId,
    onPackingUpdated: handlePackingUpdate,
  });

  useEffect(() => {
    loadPackingList();
  }, [tripId]);

  const loadPackingList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get packing items
      const itemsData = await packingService.getPackingItems(tripId);
      const progressData = await packingService.getPackingProgress(tripId);
      
      setItems(itemsData);
      setProgress(progressData);
    } catch (err: any) {
      console.error('Error loading packing list:', err);
      setError(err.message || 'Failed to load packing list');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (itemId: string, isChecked: boolean) => {
    try {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, is_checked: isChecked } : item))
      );

      // Update progress optimistically
      if (progress) {
        const delta = isChecked ? 1 : -1;
        const newChecked = progress.checked_items + delta;
        const newPercentage =
          progress.total_items > 0 ? Math.round((newChecked / progress.total_items) * 100) : 0;
        setProgress({
          ...progress,
          checked_items: newChecked,
          percentage: newPercentage,
        });
      }

      await packingService.togglePackingItem(tripId, itemId, isChecked);
    } catch (err: any) {
      console.error('Error toggling item:', err);
      // Revert on error
      loadPackingList();
    }
  };

  const handleAddItem = async (item: string, category: CategoryType) => {
    try {
      const newItem = await packingService.addPackingItem(tripId, {
        name: item,
        category,
      });
      setItems((prev) => [...prev, newItem]);
      setShowAddItem(false);
      // Reload progress
      const progressData = await packingService.getPackingProgress(tripId);
      setProgress(progressData);
    } catch (err: any) {
      console.error('Error adding item:', err);
      alert('Failed to add item: ' + err.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await packingService.deletePackingItem(tripId, itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      // Reload progress
      const progressData = await packingService.getPackingProgress(tripId);
      setProgress(progressData);
    } catch (err: any) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item: ' + err.message);
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      setGeneratingSuggestions(true);
      const result = await packingService.applySuggestions(tripId);
      alert(result.message);
      // Reload the packing list
      await loadPackingList();
    } catch (err: any) {
      console.error('Error generating suggestions:', err);
      alert('Failed to generate suggestions: ' + err.message);
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handleExportPDF = () => {
    packingExportService.exportAsPDF(tripTitle, items);
  };

  const handlePrintView = () => {
    packingExportService.openPrintView(tripTitle, items);
  };

  const handleCheckDuplicates = () => {
    const duplicates = packingExportService.detectDuplicates(items);
    if (duplicates.length === 0) {
      alert('No duplicate items found!');
    } else {
      const message = duplicates
        .map((d) => `"${d.item1.name}" and "${d.item2.name}"`)
        .join('\n');
      alert(`Found ${duplicates.length} potential duplicate(s):\n\n${message}`);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    // Add a placeholder item to create the category
    try {
      const newItem = await packingService.addPackingItem(tripId, {
        name: 'New Item',
        category: newCategoryName.trim() as CategoryType,
      });
      setItems((prev) => [...prev, newItem]);
      setNewCategoryName('');
      setShowAddCategory(false);
      // Reload progress
      const progressData = await packingService.getPackingProgress(tripId);
      setProgress(progressData);
    } catch (err: any) {
      console.error('Error adding category:', err);
      alert('Failed to add category: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={loadPackingList}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      {progress && <PackingProgress progress={progress} />}

      {/* Warning for oversized lists */}
      {progress && progress.total_items > 50 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            ⚠️ Your packing list has {progress.total_items} items. Consider packing lighter!
          </p>
        </div>
      )}

      {/* Header with Actions */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Packing List</h2>
          <div className="flex gap-2">
            {items.length === 0 && (
              <button
                onClick={handleGenerateSuggestions}
                disabled={generatingSuggestions}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                {generatingSuggestions ? 'Generating...' : '✨ Generate Suggestions'}
              </button>
            )}
            <button
              onClick={() => setShowAddItem(!showAddItem)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* Export and Tools */}
        {items.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
            >
              📄 Export PDF
            </button>
            <button
              onClick={handlePrintView}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleCheckDuplicates}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
            >
              🔍 Check Duplicates
            </button>
          </div>
        )}
      </div>

      {/* Traveler Manager */}
      <TravelerManager travelers={travelers} onTravelersChange={setTravelers} />

      {/* Add Item Form */}
      {showAddItem && (
        <AddPackingItem
          onAdd={handleAddItem}
          onCancel={() => setShowAddItem(false)}
        />
      )}

      {/* Categories */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No packing items yet</p>
          <p className="text-sm">Add items to start building your packing list</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allCategories.map((category) => {
            const categoryItems = items.filter((item) => item.category === category);
            return (
              <PackingCategory
                key={category}
                category={category as CategoryType}
                items={categoryItems}
                onToggle={handleToggle}
                onDelete={handleDeleteItem}
                onAddItem={handleAddItem}
              />
            );
          })}
          
          {/* Add Category Section */}
          {showAddCategory ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Add New Category</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory();
                    if (e.key === 'Escape') {
                      setShowAddCategory(false);
                      setNewCategoryName('');
                    }
                  }}
                  placeholder="Category name..."
                  autoFocus
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategoryName('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              + Add New Category
            </button>
          )}
        </div>
      )}
    </div>
  );
};
