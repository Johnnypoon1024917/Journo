import React, { useState } from 'react';
import { PackingItem as PackingItemType, PackingCategory as CategoryType } from '../../types/packing';
import { PackingItem } from './PackingItem';

interface PackingCategoryProps {
  category: CategoryType;
  items: PackingItemType[];
  onToggle: (itemId: string, isChecked: boolean) => void;
  onDelete?: (itemId: string) => void;
  onAddItem?: (item: string, category: CategoryType) => void;
}

const categoryEmojis: Record<CategoryType, string> = {
  clothing: '👕',
  warm_layers: '🧥',
  toiletries: '🧴',
  electronics: '🔌',
  documents: '📄',
  health: '💊',
  snacks: '🍿',
  misc: '📦',
};

const categoryLabels: Record<CategoryType, string> = {
  documents: 'Important Documents',
  clothing: 'Clothing',
  warm_layers: 'Warm Layers',
  electronics: 'Electronics',
  toiletries: 'Toiletries',
  health: 'Health & Medicine',
  snacks: 'Snacks & Food',
  misc: 'Other Items',
};

export const PackingCategory: React.FC<PackingCategoryProps> = ({
  category,
  items,
  onToggle,
  onDelete,
  onAddItem,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const checkedCount = items.filter((item) => item.is_packed).length;
  const totalCount = items.length;

  const handleAddItem = () => {
    if (newItemName.trim() && onAddItem) {
      onAddItem(newItemName.trim(), category);
      setNewItemName('');
      setIsAddingItem(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    } else if (e.key === 'Escape') {
      setIsAddingItem(false);
      setNewItemName('');
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{categoryEmojis[category]}</span>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {categoryLabels[category]}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {checkedCount} / {totalCount} items
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-2 bg-white dark:bg-gray-900">
          {items.map((item) => (
            <PackingItem key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
          ))}
          
          {/* Add Item Section */}
          {isAddingItem ? (
            <div className="flex gap-2 p-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter item name..."
                autoFocus
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddItem}
                disabled={!newItemName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItemName('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            onAddItem && (
              <button
                onClick={() => setIsAddingItem(true)}
                className="w-full p-2 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border-t border-gray-200 dark:border-gray-700"
              >
                + Add item to {categoryLabels[category]}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
