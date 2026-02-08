import React from 'react';
import { PackingItem as PackingItemType } from '../../types/packing';

interface PackingItemProps {
  item: PackingItemType;
  onToggle: (itemId: string, isChecked: boolean) => void;
  onDelete?: (itemId: string) => void;
}

export const PackingItem: React.FC<PackingItemProps> = ({ item, onToggle, onDelete }) => {
  const handleToggle = () => {
    onToggle(item.id, !item.is_packed);
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group">
      <input
        type="checkbox"
        checked={item.is_packed}
        onChange={handleToggle}
        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />
      <span
        className={`flex-1 text-sm ${
          item.is_packed
            ? 'line-through text-gray-400 dark:text-gray-500'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {item.name}
      </span>
      {onDelete && (
        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm transition-opacity"
          aria-label="Delete item"
        >
          ✕
        </button>
      )}
    </div>
  );
};
