import React, { useState } from 'react';
import { PackingCategory } from '../../types/packing';

interface AddPackingItemProps {
  onAdd: (item: string, category: PackingCategory) => void;
  onCancel: () => void;
}

const categoryOptions: { value: PackingCategory; label: string }[] = [
  { value: 'clothing', label: '👕 Clothing' },
  { value: 'warm_layers', label: '🧥 Warm Layers' },
  { value: 'toiletries', label: '🧴 Toiletries' },
  { value: 'electronics', label: '🔌 Electronics' },
  { value: 'documents', label: '📄 Documents' },
  { value: 'health', label: '💊 Health' },
  { value: 'snacks', label: '🍿 Snacks' },
  { value: 'misc', label: '📦 Miscellaneous' },
];

export const AddPackingItem: React.FC<AddPackingItemProps> = ({ onAdd, onCancel }) => {
  const [item, setItem] = useState('');
  const [category, setCategory] = useState<PackingCategory>('clothing');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item.trim()) {
      onAdd(item.trim(), category);
      setItem('');
      setCategory('clothing');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="item" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Item Name
          </label>
          <input
            type="text"
            id="item"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g., Sunscreen, Passport, Hiking boots"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as PackingCategory)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!item.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Add Item
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};
