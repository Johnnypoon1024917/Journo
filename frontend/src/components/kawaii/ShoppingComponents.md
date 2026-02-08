# Shopping Components Implementation

## Overview

This document describes the implementation of the Shopping screen components for the Kawaii UI redesign.

## Components Implemented

### 1. ShoppingItem Component

**File**: `frontend/src/components/kawaii/ShoppingItem.tsx`

**Features**:
- Checkbox for marking items as bought/unbought
- Image thumbnail (60x60px) with placeholder icon
- Name display with strike-through when checked
- Store name display (optional)
- Tags as colored pills (一般, 寄食, 服飾, 重要, 其他)
- Three-dot menu for edit/delete actions
- Swipe to delete gesture with animation
- Touch-optimized interactions (44px minimum)
- Framer Motion animations

**Props**:
```typescript
interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle?: (id: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}
```

**Requirements**: 11.1, 11.6, 11.7

### 2. ShoppingStats Component

**File**: `frontend/src/components/kawaii/ShoppingStats.tsx`

**Features**:
- Display "to buy" count with shopping bag icon
- Display "bought" count with checkmark icon
- Progress bar showing completion percentage
- Total items count
- Real-time updates with animated transitions
- Kawaii styling with rounded corners

**Props**:
```typescript
interface ShoppingStatsProps {
  stats: ShoppingStatsType;
  className?: string;
}
```

**Requirements**: 11.2

### 3. FilterDropdown Component

**File**: `frontend/src/components/kawaii/FilterDropdown.tsx`

**Features**:
- Filter by category (all, food, clothing, important, other)
- Display item count for each category
- Dropdown with smooth animations
- Touch-optimized interactions
- Active filter highlighting
- Click outside to close

**Props**:
```typescript
interface FilterDropdownProps {
  options: ShoppingFilterOption[];
  selectedFilter: string;
  onFilterChange: (filterId: string) => void;
  className?: string;
}
```

**Requirements**: 11.4

## Type Definitions

**File**: `frontend/src/types/shopping.ts`

```typescript
export type ShoppingTag = '一般' | '寄食' | '服飾' | '重要' | '其他';
export type ShoppingPriority = 'normal' | 'important';

export interface ShoppingItem {
  id: string;
  trip_id: string;
  name: string;
  store?: string;
  image?: string;
  tags: ShoppingTag[];
  checked: boolean;
  priority: ShoppingPriority;
  created_at: string;
  updated_at: string;
}

export interface ShoppingStats {
  toBuy: number;
  bought: number;
  total: number;
}

export interface ShoppingFilterOption {
  id: string;
  label: string;
  tag?: ShoppingTag;
  count: number;
}
```

## Translations

Added shopping-related translations to all supported languages:
- English (`frontend/src/locales/en/kawaii.json`)
- Traditional Chinese (`frontend/src/locales/zh-TW/kawaii.json`)
- Simplified Chinese (`frontend/src/locales/zh-CN/kawaii.json`)
- Japanese (`frontend/src/locales/ja/kawaii.json`)

**Translation Keys**:
- `shopping.title` - Shopping List
- `shopping.addItem` - Add Item
- `shopping.toBuy` - To Buy
- `shopping.bought` - Bought
- `shopping.progress` - Progress
- `shopping.totalItems` - Total items count
- `shopping.check` - Mark as bought
- `shopping.uncheck` - Mark as not bought
- `shopping.filter` - Filter by category
- `shopping.allItems` - All Items
- `shopping.tags.*` - Tag labels

## Tests

**File**: `frontend/src/components/kawaii/__tests__/ShoppingComponents.test.tsx`

**Test Coverage**:
- ShoppingItem rendering with all data fields
- ShoppingItem rendering without optional fields
- Checked state with strike-through styling
- Toggle functionality
- Menu interactions (open, edit, delete)
- Image display and placeholder
- ShoppingStats display and calculations
- Progress percentage calculations
- FilterDropdown rendering and interactions
- Filter selection and change callbacks

**Test Results**: All 21 tests passing ✓

## Usage Example

```typescript
import { ShoppingItem, ShoppingStats, FilterDropdown } from '@/components/kawaii';
import { ShoppingItem as ShoppingItemType, ShoppingStats as StatsType } from '@/types/shopping';

// Shopping item
const item: ShoppingItemType = {
  id: '1',
  trip_id: 'trip-1',
  name: 'Sunscreen',
  store: 'Pharmacy',
  tags: ['重要'],
  checked: false,
  priority: 'important',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

<ShoppingItem
  item={item}
  onToggle={(id) => console.log('Toggle', id)}
  onEdit={() => console.log('Edit')}
  onDelete={() => console.log('Delete')}
/>

// Shopping stats
const stats: StatsType = {
  toBuy: 5,
  bought: 3,
  total: 8,
};

<ShoppingStats stats={stats} />

// Filter dropdown
const filterOptions = [
  { id: 'all', label: 'All Items', count: 8 },
  { id: 'food', label: 'Food', tag: '寄食', count: 3 },
  { id: 'important', label: 'Important', tag: '重要', count: 2 },
];

<FilterDropdown
  options={filterOptions}
  selectedFilter="all"
  onFilterChange={(id) => console.log('Filter changed', id)}
/>
```

## Tag Colors

The component uses predefined colors for each tag type:

- **一般** (General): Gray
- **寄食** (Food): Orange
- **服飾** (Clothing): Purple
- **重要** (Important): Red
- **其他** (Other): Blue

## Animations

All components use Framer Motion for smooth animations:
- Swipe to delete with visual feedback
- Menu open/close transitions
- Count updates with scale animation
- Progress bar fill animation
- Dropdown expand/collapse

## Accessibility

- Minimum 44px touch targets
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Next Steps

To complete the Shopping screen:
1. Create ShoppingScreen page component (Task 13.1)
2. Integrate all shopping components
3. Connect to backend APIs
4. Add FAB for creating new items
5. Implement item add/edit/delete functionality

## Notes

- All property tests (12.2, 12.4, 12.5) are commented out in the task list and will be implemented in a future phase
- Components follow the same patterns as BookingComponents for consistency
- Dark mode support is built-in
- Components are fully responsive
