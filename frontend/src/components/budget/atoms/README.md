# Budget Page - Atomic Components

This directory contains the atomic (smallest reusable) UI components for the Budget page feature.

## Components

### TripTitle
Displays the trip name as a heading.
- **Props**: `title`, `className`
- **Usage**: Header section of budget page

### StatCard
Displays a statistic with label, value, and optional sub-value.
- **Props**: `label`, `value`, `subValue`, `icon`, `variant`, `className`
- **Variants**: `default`, `success`, `warning`, `danger`
- **Usage**: Budget dashboard statistics

### BurnRateIndicator
Shows daily spending rate with color-coded status.
- **Props**: `burnRate`, `plannedRate`, `currency`, `className`
- **Status Colors**: 
  - Green: On track (≤ planned rate)
  - Yellow: Warning (> planned rate, < 120% of planned)
  - Red: Danger (≥ 120% of planned rate)
- **Usage**: Budget dashboard burn rate display

### FilterTab
Tab button for filtering expense lists.
- **Props**: `label`, `value`, `isActive`, `count`, `onClick`, `className`
- **Features**: Active state styling, optional count badge
- **Usage**: Expense list filtering

### FloatingAddButton
Floating action button (FAB) for adding new expenses.
- **Props**: `onClick`, `label`, `className`
- **Features**: Fixed positioning, hover animations, ripple effect
- **Usage**: Quick access to add expense form

### ExpenseAmount
Displays expense amount with optional dual currency support.
- **Props**: `amount`, `currency`, `homeCurrency`, `homeAmount`, `size`, `showBothCurrencies`, `className`
- **Sizes**: `sm`, `md`, `lg`
- **Features**: Automatic currency symbol lookup, dual currency display
- **Usage**: Expense cards, summary displays

### ExpenseCategory
Shows expense category with icon and label.
- **Props**: `category`, `size`, `showLabel`, `className`
- **Categories**: flights, accommodation, food, transport, activities, shopping, misc
- **Features**: Color-coded badges, emoji icons
- **Usage**: Expense cards, category filters

### SplitInfo
Displays split expense information.
- **Props**: `splitType`, `splitWith`, `paidBy`, `memberNames`, `isSettled`, `size`, `className`
- **Features**: Shows split type, member count, paid by info, settlement status
- **Usage**: Expense cards with group expenses

## Styling

All components follow the BubbleQuest theme with:
- Pastel colors (pink, beige, soft pastels)
- Rounded corners (rounded-2xl, rounded-full)
- Soft shadows
- Smooth transitions
- Touch-friendly sizing (min-h-touch, min-w-touch)
- Dark mode support

## Testing

Comprehensive unit tests are available in `__tests__/atoms.test.tsx`:
- Component rendering
- Props handling
- User interactions
- Accessibility features
- Variant styling

Run tests with:
```bash
npm test -- atoms.test.tsx
```

## Usage Example

```tsx
import {
  TripTitle,
  StatCard,
  BurnRateIndicator,
  FilterTab,
  FloatingAddButton,
  ExpenseAmount,
  ExpenseCategory,
  SplitInfo,
} from './components/budget/atoms';

// In your component
<TripTitle title="Tokyo Adventure" />

<StatCard 
  label="Total Budget" 
  value="$1000" 
  variant="success" 
/>

<BurnRateIndicator 
  burnRate={45} 
  plannedRate={50} 
  currency="$" 
/>

<FilterTab 
  label="All" 
  value="all" 
  isActive={true} 
  count={10}
  onClick={handleFilterChange} 
/>

<FloatingAddButton onClick={handleAddExpense} />

<ExpenseAmount 
  amount={100} 
  currency="USD" 
  homeCurrency="HKD" 
  homeAmount={780}
  showBothCurrencies={true} 
/>

<ExpenseCategory category="food" />

<SplitInfo 
  splitType="equal" 
  splitWith={['user1', 'user2']}
  paidBy="user1"
  memberNames={{ user1: 'Alice', user2: 'Bob' }}
  isSettled={false}
/>
```

## Requirements Satisfied

- **Requirement 2.7**: Expense display with all required fields
- **Requirement 4.6**: Burn rate calculation and display
- **Requirement 7.1**: Expense filtering interface
- **Requirement 10.1**: BubbleQuest theme with pastel colors
- **Requirement 10.2**: Rounded cards and soft shadows
- **Requirement 10.8**: Floating action button for quick access
- **Requirement 10.9**: Responsive design
- **Requirement 10.10**: Accessibility compliance
