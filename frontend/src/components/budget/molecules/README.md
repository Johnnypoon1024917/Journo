# Budget Page - Molecular Components

This directory contains the molecular (composite) UI components for the Budget page feature. Molecules are composed of atomic components and form more complex, reusable UI patterns.

## Components

### CurrencySelector
Dropdown selector for choosing trip currency.
- **Props**: `selectedCurrency`, `onCurrencyChange`, `label`, `className`
- **Features**: 
  - Pre-populated with common currencies (HKD, USD, EUR, GBP, JPY, CNY, KRW, TWD, SGD, AUD, CAD, THB)
  - Shows currency symbol and full name
  - Displays selected currency info below dropdown
  - Accessible with ARIA labels
- **Usage**: Budget setup, currency conversion settings
- **Requirements**: 1.7

### TotalBudgetInput
Input field for entering total budget amount with validation.
- **Props**: `value`, `currency`, `onChange`, `onBlur`, `error`, `label`, `placeholder`, `className`
- **Features**:
  - Real-time validation (positive numbers only)
  - Visual feedback (green checkmark for valid, red X for invalid)
  - Currency symbol prefix
  - Automatic formatting on blur (2 decimal places)
  - Error message display
  - Accessible with ARIA attributes
- **Usage**: Budget setup form
- **Requirements**: 1.1, 1.2

### CategoryAllocationItem
Interactive item for adjusting category budget allocation.
- **Props**: `category`, `percentage`, `allocatedAmount`, `currency`, `onPercentageChange`, `className`
- **Features**:
  - Category icon and color-coded badge
  - Dual input: slider and numeric input
  - Real-time percentage adjustment (0-100%)
  - Shows allocated amount in currency
  - Visual progress bar
  - Smooth animations
  - Touch-friendly slider
- **Usage**: Budget setup, category allocation adjustment
- **Requirements**: 1.3, 1.4, 5.6

### BudgetProgressRing
Circular progress visualization showing budget consumption.
- **Props**: `totalBudget`, `spent`, `remaining`, `currency`, `percentageSpent`, `status`, `size`, `showAnimation`, `className`
- **Sizes**: `sm` (120px), `md` (180px), `lg` (240px)
- **Status Colors**:
  - **Safe** (< 70%): Green
  - **Warning** (70-90%): Yellow
  - **Danger** (90-100%): Red
  - **Over** (> 100%): Dark red
- **Features**:
  - Animated progress ring
  - Center percentage display
  - Stats grid (Total, Spent, Left)
  - Status message
  - Color-coded by budget status
- **Usage**: Budget dashboard header
- **Requirements**: 4.1, 4.2, 4.3

### CatEatingAnimation
Animated cat character that reacts to budget spending.
- **Props**: `percentageSpent`, `size`, `className`
- **Sizes**: `sm`, `md`, `lg`
- **States**:
  - **Happy** (< 50%): 😻 "Great spending!"
  - **Eating** (50-70%): 😸 "Nom nom nom..."
  - **Worried** (70-90%): 😿 "Watch your budget..."
  - **Sad** (90-100%): 🙀 "Budget exceeded!"
- **Features**:
  - State-based emoji changes
  - Bounce animation on state change
  - Pulse animation when eating
  - Contextual messages
  - Gradient background
- **Usage**: Budget dashboard, visual feedback
- **Requirements**: 10.3, 10.4

### AlertBanner
Dismissible alert banner for warnings and notifications.
- **Props**: `type`, `title`, `message`, `dismissible`, `onDismiss`, `action`, `className`
- **Types**: `info`, `warning`, `danger`, `success`
- **Features**:
  - Color-coded by alert type
  - Icon for each type
  - Dismissible with X button
  - Optional action button
  - Accessible with ARIA live regions
  - Smooth dismiss animation
- **Usage**: Budget warnings, burn rate alerts, over-budget notifications
- **Requirements**: 4.7, 13.1, 13.2, 13.3, 13.4, 13.5

## Styling

All components follow the BubbleQuest theme with:
- **Pastel colors**: Pink (#FFB6C1), beige (#F5E6D3), soft pastels
- **Rounded corners**: `rounded-2xl` for cards, `rounded-full` for circles
- **Soft shadows**: Subtle elevation with `shadow-md`, `shadow-lg`
- **Smooth transitions**: 200-300ms duration for hover/focus states
- **Touch-friendly**: Minimum 44x44px touch targets
- **Dark mode**: Full support with dark: variants
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Component Composition

These molecules are composed of atomic components and will be used in organism components:

```
BudgetDashboard (Organism)
├── CurrencySelector (Molecule)
├── BudgetProgressRing (Molecule)
│   └── CatEatingAnimation (Molecule)
└── AlertBanner (Molecule)

BudgetSetupSection (Organism)
├── TotalBudgetInput (Molecule)
└── CategoryAllocationItem (Molecule) × 7
```

## Usage Example

```tsx
import {
  CurrencySelector,
  TotalBudgetInput,
  CategoryAllocationItem,
  BudgetProgressRing,
  CatEatingAnimation,
  AlertBanner,
} from './components/budget/molecules';

// Currency selector
<CurrencySelector
  selectedCurrency="JPY"
  onCurrencyChange={(currency) => console.log(currency)}
/>

// Budget input
<TotalBudgetInput
  value={10000}
  currency="HKD"
  onChange={(value) => console.log(value)}
  error={value <= 0 ? "Budget must be greater than 0" : undefined}
/>

// Category allocation
<CategoryAllocationItem
  category="food"
  percentage={15}
  allocatedAmount={1500}
  currency="HKD"
  onPercentageChange={(category, percentage) => console.log(category, percentage)}
/>

// Progress ring
<BudgetProgressRing
  totalBudget={10000}
  spent={7500}
  remaining={2500}
  currency="HKD"
  percentageSpent={75}
  status="warning"
  size="md"
  showAnimation={true}
/>

// Cat animation
<CatEatingAnimation
  percentageSpent={75}
  size="md"
/>

// Alert banner
<AlertBanner
  type="warning"
  title="Budget Warning"
  message="You've spent 70% of your budget. Watch your spending!"
  dismissible={true}
  onDismiss={() => console.log('dismissed')}
  action={{
    label: "View Details",
    onClick: () => console.log('action clicked')
  }}
/>
```

## Validation

### TotalBudgetInput Validation
- Must be a positive number (> 0)
- Accepts decimal values with up to 2 decimal places
- Automatically formats on blur
- Shows error state for invalid input

### CategoryAllocationItem Validation
- Percentage must be between 0 and 100
- Slider and input are synchronized
- Visual feedback with progress bar
- Parent component should validate that all categories sum to 100%

## Accessibility

All components include:
- **ARIA labels**: Descriptive labels for screen readers
- **Keyboard navigation**: Full keyboard support
- **Focus indicators**: Visible focus rings
- **Color contrast**: WCAG AA compliant
- **Touch targets**: Minimum 44x44px
- **Live regions**: Dynamic updates announced to screen readers

## Testing

Unit tests should cover:
- Component rendering with various props
- User interactions (clicks, input changes, slider adjustments)
- Validation logic
- State changes and animations
- Accessibility features
- Responsive behavior

## Requirements Satisfied

- **Requirement 1.1**: Budget setup interface with total budget input
- **Requirement 1.2**: Budget amount validation (positive number > 0)
- **Requirement 1.3**: Category allocation interface
- **Requirement 1.4**: Category allocation percentage validation
- **Requirement 1.7**: Currency selection and persistence
- **Requirement 4.1**: Progress ring showing budget, spent, remaining
- **Requirement 4.2**: Color-coded progress (green < 70%, yellow 70-90%, red > 90%)
- **Requirement 4.3**: Budget status visualization
- **Requirement 4.7**: Burn rate warning display
- **Requirement 5.6**: Category allocation adjustment
- **Requirement 10.1**: BubbleQuest theme with pastel colors
- **Requirement 10.2**: Rounded corners and soft shadows
- **Requirement 10.3**: Cat animation in dashboard
- **Requirement 10.4**: Visual feedback with animations
- **Requirement 13.1**: Warning banner at 70% budget
- **Requirement 13.2**: Critical warning at 90% budget
- **Requirement 13.3**: Over-budget alert
- **Requirement 13.4**: Category-specific warnings
- **Requirement 13.5**: Burn rate warning



## Expense Management Components

### ExpenseCard
Display card for individual expense entries with full details and actions.
- **Props**: `expense`, `homeCurrency`, `exchangeRate`, `onEdit`, `onDelete`, `className`
- **Features**:
  - Category icon and color-coded badge
  - Dual currency display (trip currency + home currency)
  - Formatted date display
  - Optional note display
  - Split expense information (type, members, settled status)
  - Sync status indicators (syncing, error)
  - Edit and delete action buttons
  - Confirmation dialog for delete
  - Hover effects and transitions
- **Usage**: Expense list display
- **Requirements**: 2.7, 2.8, 2.9

### ExpenseForm
Complete form for creating and editing expense entries.
- **Props**: `tripId`, `initialData`, `tripMembers`, `currency`, `onSubmit`, `onCancel`, `className`
- **Features**:
  - All expense fields (amount, category, date, note)
  - Split expense configuration
  - Form validation with error messages
  - Loading states during submission
  - Cancel with confirmation
  - Auto-populates for editing
  - Accessible form controls
- **Usage**: Add/edit expense modal or page
- **Requirements**: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.1, 6.2

### AmountInput
Specialized input field for monetary amounts with validation.
- **Props**: `value`, `currency`, `onChange`, `onBlur`, `error`, `label`, `placeholder`, `required`, `className`
- **Features**:
  - Decimal validation (max 2 decimal places)
  - Currency symbol prefix
  - Visual validation feedback (green checkmark, red X)
  - Auto-formatting on blur (2 decimals)
  - Prevents invalid input (letters, multiple decimals)
  - Required field indicator
  - Accessible with ARIA attributes
- **Usage**: Expense amount input, budget input
- **Requirements**: 2.3

### CategorySelect
Dropdown selector for expense categories with icons.
- **Props**: `value`, `onChange`, `error`, `label`, `required`, `className`
- **Categories**: Flights ✈️, Accommodation 🏨, Food 🍜, Transport 🚇, Activities 🎭, Shopping 🛍️, Miscellaneous 📦
- **Features**:
  - Category emoji icons
  - Visual category badge when selected
  - Color-coded categories
  - Validation feedback
  - Required field indicator
  - Accessible dropdown
- **Usage**: Expense category selection
- **Requirements**: 2.2

### DatePicker
Date input with formatted display and validation.
- **Props**: `value`, `onChange`, `error`, `label`, `required`, `min`, `max`, `className`
- **Features**:
  - ISO date string handling
  - Formatted date display (e.g., "Fri, Mar 15, 2024")
  - Min/max date constraints
  - Visual validation feedback
  - Calendar icon
  - Required field indicator
  - Accessible date input
- **Usage**: Expense date selection
- **Requirements**: 2.2

### NoteInput
Textarea for expense notes with character counter.
- **Props**: `value`, `onChange`, `error`, `label`, `placeholder`, `maxLength`, `rows`, `className`
- **Features**:
  - Character counter (current/max)
  - Warning when near limit (80%+)
  - Clear button when text present
  - Max length enforcement
  - Auto-resize option
  - Accessible textarea
- **Usage**: Expense notes, optional details
- **Requirements**: 2.4

### SplitSelector
Complex component for configuring group expense splitting.
- **Props**: `tripMembers`, `paidBy`, `splitWith`, `splitType`, `customSplits`, `totalAmount`, callbacks, `error`, `className`
- **Features**:
  - Collapsible interface (starts collapsed)
  - "Paid By" member selection
  - "Split With" member checkboxes with avatars
  - Split type toggle (Equal / Custom)
  - Equal split preview (amount per person)
  - Custom split inputs with validation
  - Visual feedback for split total mismatch
  - Member avatars or initials
  - Accessible form controls
- **Usage**: Group expense splitting configuration
- **Requirements**: 6.1, 6.2, 6.3

## Expense Component Usage Examples

```tsx
import {
  ExpenseCard,
  ExpenseForm,
  AmountInput,
  CategorySelect,
  DatePicker,
  NoteInput,
  SplitSelector,
} from './components/budget/molecules';

// Display expense card
<ExpenseCard
  expense={{
    id: '1',
    tripId: 'trip-123',
    amount: 1200,
    currency: 'JPY',
    category: 'food',
    date: '2024-03-15T00:00:00Z',
    note: 'Dinner at restaurant',
    isSettled: false,
    createdBy: 'user1',
    createdAt: '2024-03-15T18:30:00Z',
    updatedAt: '2024-03-15T18:30:00Z',
    syncStatus: 'synced',
  }}
  homeCurrency="HKD"
  exchangeRate={0.058}
  onEdit={(expense) => setEditingExpense(expense)}
  onDelete={(id) => deleteExpense(id)}
/>

// Expense form
<ExpenseForm
  tripId="trip-123"
  tripMembers={[
    { id: 'user1', name: 'Alice', email: 'alice@example.com' },
    { id: 'user2', name: 'Bob', email: 'bob@example.com' },
  ]}
  currency="HKD"
  onSubmit={async (data) => {
    await createExpense(data);
    closeModal();
  }}
  onCancel={() => closeModal()}
/>

// Individual form components
<AmountInput
  value={100}
  currency="HKD"
  onChange={setAmount}
  label="Amount"
  required
/>

<CategorySelect
  value="food"
  onChange={setCategory}
  label="Category"
  required
/>

<DatePicker
  value={new Date().toISOString()}
  onChange={setDate}
  label="Date"
  required
/>

<NoteInput
  value={note}
  onChange={setNote}
  label="Note"
  maxLength={200}
/>

<SplitSelector
  tripMembers={members}
  paidBy={paidBy}
  splitWith={splitWith}
  splitType="equal"
  totalAmount={amount}
  onPaidByChange={setPaidBy}
  onSplitWithChange={setSplitWith}
  onSplitTypeChange={setSplitType}
  onCustomSplitsChange={setCustomSplits}
/>
```

## Expense Validation

### AmountInput Validation
- Must be a positive number (> 0)
- Maximum 2 decimal places
- Rejects non-numeric input
- Auto-formats on blur

### CategorySelect Validation
- Required field (must select a category)
- One of 7 predefined categories

### DatePicker Validation
- Required field (must select a date)
- Optional min/max constraints
- ISO date format

### SplitSelector Validation
- Custom splits must sum to total amount
- Visual feedback for mismatch
- At least one member must be selected for split

## Additional Requirements Satisfied

- **Requirement 2.1**: Expense entry form with floating "+" button
- **Requirement 2.2**: Required fields (amount, category, date)
- **Requirement 2.3**: Decimal amount validation (2 decimal places)
- **Requirement 2.4**: Optional fields (note, payment method, split info)
- **Requirement 2.5**: Immediate dashboard update on save
- **Requirement 2.6**: Persistence to Local Storage and PostgreSQL
- **Requirement 2.7**: Expense card display with all details
- **Requirement 2.8**: Edit and delete actions on expense card
- **Requirement 2.9**: Immediate update on delete
- **Requirement 6.1**: Split expense member selection
- **Requirement 6.2**: Split expense configuration
- **Requirement 6.3**: Equal and custom splitting support

## Testing Coverage

All expense components have comprehensive unit tests covering:
- **Rendering**: Various props and states
- **User interactions**: Clicks, input changes, form submission
- **Validation**: Required fields, format validation, custom validation
- **Edge cases**: Empty inputs, max lengths, boundary values
- **Accessibility**: ARIA labels, keyboard navigation, screen readers
- **Error handling**: Error messages, validation feedback

Run tests:
```bash
npm test -- molecules.test.tsx
```

Current test coverage: **81 tests passing** ✅
