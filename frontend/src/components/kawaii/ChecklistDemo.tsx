/**
 * Checklist Components Demo
 * 
 * Demonstrates the ChecklistItem and ChecklistProgress components.
 */

import React, { useState } from 'react';
import { ChecklistItem } from './ChecklistItem';
import { ChecklistProgress } from './ChecklistProgress';
import { PackingItem, PackingListProgress } from '@/types/packing';

export const ChecklistDemo: React.FC = () => {
  const [items, setItems] = useState<PackingItem[]>([
    {
      id: '1',
      trip_id: 'demo-trip',
      item: 'Passport',
      category: 'documents',
      is_checked: false,
      added_by: 'user-1',
      is_custom: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      trip_id: 'demo-trip',
      item: 'T-shirts',
      category: 'clothing',
      is_checked: true,
      added_by: 'user-1',
      is_custom: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      trip_id: 'demo-trip',
      item: 'Toothbrush',
      category: 'toiletries',
      is_checked: false,
      added_by: 'user-1',
      is_custom: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '4',
      trip_id: 'demo-trip',
      item: 'Phone charger',
      category: 'electronics',
      is_checked: true,
      added_by: 'user-1',
      is_custom: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '5',
      trip_id: 'demo-trip',
      item: 'First aid kit',
      category: 'health',
      is_checked: false,
      added_by: 'user-1',
      is_custom: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]);

  const handleToggle = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, is_checked: !item.is_checked } : item
    ));
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEdit = (id: string) => {
    console.log('Edit item:', id);
    // In a real app, this would open an edit modal
  };

  // Calculate progress
  const checkedCount = items.filter(item => item.is_checked).length;
  const progress: PackingListProgress = {
    total_items: items.length,
    checked_items: checkedCount,
    percentage: items.length > 0 ? (checkedCount / items.length) * 100 : 0,
    by_category: {},
  };

  return (
    <div className="min-h-screen bg-kawaii-neutral-50 dark:bg-kawaii-neutral-900 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-6">
          Checklist Components Demo
        </h1>

        {/* Progress */}
        <ChecklistProgress progress={progress} />

        {/* Items */}
        <div className="space-y-3">
          {items.map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onEdit={() => handleEdit(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
            All items deleted! Refresh to reset the demo.
          </div>
        )}
      </div>
    </div>
  );
};
