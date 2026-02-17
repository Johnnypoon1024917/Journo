# Budget Components

This document describes the Budget screen components for the BubbleQuest UI redesign.

## Components

### ExpenseItem

Displays a single expense item with amount, category, date, and notes.

**Features:**
- Display amount with currency formatting
- Category icon and color coding
- Date display
- Notes preview
- Three-dot menu for edit/delete actions
- Touch-optimized interactions
- Framer Motion animations

**Props:**
```typescript
interface ExpenseItemProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}
```

**Category Colors:**
- Accommodation: Purple
- Food: Orange
- Transport: Blue
- Activities: Pink
- Shopping: Teal
- Miscellaneous: Gray

**Requirements:** 12.1

### ExpenseSummary

Displays total expenses with category breakdown and visual chart.

**Features:**
- Display total expenses in a gradient card
- Category breakdown with percentages
- Visual bar chart for each category
- Color-coded categories
- Responsive layout
- Empty state handling
- Framer Motion animations

**Props:**
```typescript
interface ExpenseSummaryProps {
  stats: ExpenseStats;
  className?: string;
}
```

**Requirements:** 12.2, 12.3

## Usage Example

```tsx
import { ExpenseItem, ExpenseSummary } from '@/components/bubblequest';
import { Expense, ExpenseStats } from '@/types/expense';

function BudgetScreen() {
  const expenses: Expense[] = [...];
  const stats: ExpenseStats = {
    total: 500.00,
    currency: 'USD',
    byCategory: [
      { category: 'food', amount: 200, percentage: 40, count: 3 },
      { category: 'transport', amount: 150, percentage: 30, count: 2 },
    ],
  };

  return (
    <div>
      <ExpenseSummary stats={stats} />
      
      <div className="space-y-4 mt-6">
        {expenses.map(expense => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            onEdit={() => handleEdit(expense.id)}
            onDelete={() => handleDelete(expense.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

## Testing

All components have comprehensive unit tests in `__tests__/BudgetComponents.test.tsx`:

- ExpenseItem rendering with all details
- ExpenseItem without notes
- Edit/delete button interactions
- Category icon and color variations
- ExpenseSummary total display
- Category breakdown rendering
- Amounts and percentages display
- Item counts display
- Empty state handling
- Zero amount filtering
- Multiple currency support

## Internationalization

All text is internationalized using react-i18next with the following keys:

- `budget.categories.accommodation`
- `budget.categories.food`
- `budget.categories.transport`
- `budget.categories.activities`
- `budget.categories.shopping`
- `budget.categories.misc`
- `budget.totalExpenses`
- `budget.categoryBreakdown`
- `budget.noExpenses`
- `common.edit`
- `common.delete`

Translations are available in:
- English (en)
- Traditional Chinese (zh-TW)
- Simplified Chinese (zh-CN)
- Japanese (ja)

## Implementation Status

✅ Task 15.1: ExpenseItem component - Complete
✅ Task 15.2: ExpenseSummary component - Complete

## Next Steps

Task 16: Assemble Budget screen
- Create BudgetScreen page component
- Integrate ExpenseSummary and ExpenseItem
- Implement FAB for adding expenses
- Handle expense CRUD operations
- Support multiple currencies with conversion
- Connect to backend APIs
