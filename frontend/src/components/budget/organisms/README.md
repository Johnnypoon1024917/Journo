# Budget Organisms

Organism components are complex UI components that compose multiple molecules and atoms to create complete sections of the Budget page.

## Components

### BudgetDashboard

The main dashboard component that displays budget overview, progress tracking, and alerts.

**Features:**
- Sticky header behavior on scroll
- Budget progress ring with color-coded status
- Cat eating animation based on budget percentage
- Budget statistics (days elapsed, projected total)
- Burn rate indicator with warnings
- Alert banners for budget thresholds (70%, 90%, 100%)
- Burn rate warnings (20% over planned)
- Currency selector integration
- Alert dismissal with 24-hour suppression

**Props:**
```typescript
interface BudgetDashboardProps {
  tripId: string;           // Trip identifier for localStorage keys
  tripTitle: string;        // Trip name to display
  summary: BudgetPageSummary; // Budget summary with calculations
  currency: string;         // Current currency code
  onCurrencyChange: (currency: string) => void; // Currency change handler
  className?: string;       // Additional CSS classes
}
```

**Requirements Validated:**
- 4.1: Progress ring showing total, spent, remaining
- 4.2: Color-coded status (green < 70%, yellow 70-90%, red > 90%)
- 4.3: Cat animation based on budget percentage
- 4.7: Burn rate warning when exceeding planned daily budget
- 10.7: Sticky header behavior on scroll
- 13.1: Warning banner at 70% budget
- 13.2: Critical warning banner at 90% budget
- 13.3: Over-budget alert banner at 100%
- 13.5: Burn rate warning at 20% over planned
- 13.7: Alert dismissal with 24-hour suppression

**Usage:**
```tsx
import { BudgetDashboard } from './organisms';

<BudgetDashboard
  tripId={trip.id}
  tripTitle={trip.title}
  summary={budgetSummary}
  currency={tripCurrency}
  onCurrencyChange={handleCurrencyChange}
/>
```

**Sticky Behavior:**
The dashboard uses an Intersection Observer to detect when it should become sticky. When scrolling down, the dashboard:
- Sticks to the top of the viewport
- Adds a shadow and border for visual separation
- Reduces the progress ring size to 'sm'
- Hides the cat animation to save space
- Maintains z-index of 40 to stay above content

**Alert Logic:**
Alerts are generated based on budget thresholds and burn rate:
1. **Over Budget (100%+)**: Danger alert showing amount over budget
2. **Critical Warning (90-99%)**: Danger alert showing percentage used
3. **Budget Warning (70-89%)**: Warning alert showing percentage used
4. **Burn Rate Warning**: Warning when daily spending exceeds planned by 20%

Dismissed alerts are stored in localStorage with timestamps and suppressed for 24 hours.

**Responsive Design:**
- Mobile: Single column layout, full-width currency selector
- Tablet/Desktop: Two-column layout with progress ring on left, stats on right
- Sticky mode: Compact layout with smaller progress ring

**Accessibility:**
- Semantic HTML with proper heading hierarchy
- ARIA labels for interactive elements
- ARIA live regions for alert banners
- Keyboard navigation support
- Screen reader friendly


---

### BudgetSetupSection

A comprehensive budget configuration component that allows users to set up their trip budget and allocate it across categories.

**Features:**
- Total budget input with validation
- Category allocation with percentage sliders
- Real-time allocation sum validation (must equal 100%)
- Interactive pie chart visualization
- Collapsible behavior after initial setup
- Save button with loading state
- Default category allocations (Flights 30%, Accommodation 25%, Food 15%, Transport 10%, Activities 10%, Shopping 5%, Misc 5%)
- Automatic allocated amount calculation based on percentages

**Props:**
```typescript
interface BudgetSetupSectionProps {
  budgetConfig: BudgetConfig | null;  // Current budget configuration
  onSave: (config: Partial<BudgetConfig>) => Promise<void>; // Save handler
  isCollapsed?: boolean;              // Collapsed state
  onToggleCollapse?: () => void;      // Toggle collapse handler
  className?: string;                 // Additional CSS classes
}
```

**Requirements Validated:**
- 1.1: Budget setup interface with total budget input and category allocation
- 1.2: Budget amount validation (positive number > 0)
- 1.3: Pre-set category allocations with default percentages
- 1.4: Category allocation validation (sum must equal 100%)
- 1.5: Save budget configuration with persistence
- 1.6: Interactive pie chart showing budget allocation

**Usage:**
```tsx
import { BudgetSetupSection } from './organisms';

<BudgetSetupSection
  budgetConfig={budgetConfig}
  onSave={handleSaveBudgetConfig}
  isCollapsed={isSetupComplete}
  onToggleCollapse={toggleSetup}
/>
```

**Validation Rules:**
1. **Total Budget**: Must be a positive number greater than 0
2. **Category Allocations**: Sum of all percentages must equal 100% (within 0.01% tolerance for floating point)
3. **Save Button**: Disabled until both validations pass

**Collapsible Behavior:**
- **Expanded State**: Shows full setup interface with all controls
- **Collapsed State**: Shows compact header with budget amount
- Toggle button available when `onToggleCollapse` is provided
- Typically collapsed after initial budget setup is complete

**Default Allocations:**
When no budget config is provided, the component initializes with these default percentages:
- Flights: 30%
- Accommodation: 25%
- Food: 15%
- Transport: 10%
- Activities: 10%
- Shopping: 5%
- Miscellaneous: 5%

**Responsive Design:**
- Mobile: Single column layout, full-width inputs
- Tablet/Desktop: Optimized spacing and larger touch targets
- All inputs have minimum 44x44px touch targets

**Accessibility:**
- Semantic HTML with proper heading hierarchy
- ARIA labels for all interactive elements
- ARIA expanded state for collapse/expand button
- Keyboard navigation support
- Screen reader friendly with descriptive labels
- Error messages linked to inputs via aria-describedby



---

### ExpenseListSection

A comprehensive expense list component with filtering, grouping, and virtual scrolling support for large lists.

**Features:**
- Five filter tabs: 全部 (All), 待支付 (Pending), 已結算 (Settled), 按類別 (By Category), 按日期 (By Date)
- Filter tab switching with active state
- Expense grouping by category or date
- Virtual scrolling for lists > 50 items
- Empty state messages for each filter type
- Reverse chronological sorting
- Floating add button for quick expense entry
- Filter counts displayed on tabs
- Sticky filter tabs on scroll

**Props:**
```typescript
interface ExpenseListSectionProps {
  expenses: ExpenseEntry[];           // Array of expense entries
  homeCurrency: string;               // Home currency code (e.g., 'HKD')
  exchangeRate: number;               // Exchange rate for currency conversion
  onAddExpense: () => void;           // Handler for add expense button
  onEditExpense: (expense: ExpenseEntry) => void;  // Handler for edit expense
  onDeleteExpense: (expenseId: string) => void;    // Handler for delete expense
  className?: string;                 // Additional CSS classes
}
```

**Requirements Validated:**
- 2.1: Expense entry display with all required fields
- 7.1: Filter tabs for expense organization
- 7.2: Display all expenses in reverse chronological order
- 7.3: Filter pending (unsettled split) expenses
- 7.4: Filter settled split expenses
- 7.5: Group expenses by category
- 7.6: Group expenses by date
- 14.6: Virtual scrolling for lists > 50 items

**Usage:**
```tsx
import { ExpenseListSection } from './organisms';

<ExpenseListSection
  expenses={expenses}
  homeCurrency="HKD"
  exchangeRate={7.8}
  onAddExpense={handleAddExpense}
  onEditExpense={handleEditExpense}
  onDeleteExpense={handleDeleteExpense}
/>
```

**Filter Behavior:**

1. **全部 (All)**: Shows all expenses in reverse chronological order (newest first)
2. **待支付 (Pending)**: Shows only split expenses that are not settled
3. **已結算 (Settled)**: Shows only split expenses that are settled
4. **按類別 (By Category)**: Groups expenses by category with category headers
5. **按日期 (By Date)**: Groups expenses by date with formatted date headers

**Virtual Scrolling:**
For performance optimization, when the expense list exceeds 50 items:
- Applies `max-h-[600px]` and `overflow-y-auto` to the list container
- Enables smooth scrolling with GPU acceleration
- Maintains 60fps scroll performance
- Can be enhanced with libraries like react-window for more advanced virtualization

**Empty States:**
Context-aware empty states based on active filter:
- **All/By Category/By Date**: "No expenses yet" with prompt to add first expense
- **Pending**: "No pending expenses" with explanation about split expenses
- **Settled**: "No settled expenses" with explanation about settled expenses

**Grouping Logic:**

**By Category:**
- Groups expenses by their category field
- Displays category name as uppercase header
- Sorts groups alphabetically by category name
- Within each group, expenses sorted by date (newest first)

**By Date:**
- Groups expenses by their date field
- Displays formatted date as header (e.g., "March 15, 2024")
- Sorts groups by date (newest first)
- Within each group, expenses sorted by time (newest first)

**Responsive Design:**
- Mobile: Single column layout, horizontal scrolling for filter tabs
- Tablet/Desktop: Optimized spacing and larger touch targets
- Filter tabs use horizontal scroll with hidden scrollbar for clean appearance
- Sticky filter tabs remain visible when scrolling through expenses

**Accessibility:**
- Semantic HTML with proper section and list structure
- ARIA labels for section and list
- ARIA pressed state for filter tabs
- Role attributes for list and list items
- Keyboard navigation support for all interactive elements
- Screen reader friendly with descriptive labels
- Dynamic ARIA label updates based on filtered count

**Performance Considerations:**
- Memoized filter and grouping logic to prevent unnecessary recalculations
- Callback memoization for event handlers
- Virtual scrolling for large lists (>50 items)
- Efficient sorting and grouping algorithms
- Lazy rendering of expense cards


---

### VisualizationSection

A comprehensive data visualization component that displays budget analytics through multiple chart types and progress indicators.

**Features:**
- Category comparison bar chart (planned vs actual spending)
- Spending over time line chart (cumulative spending)
- Category progress bars with detailed breakdowns
- Expandable/collapsible behavior
- Loading states for chart rendering
- Empty state when no expense data
- Smooth animations and transitions
- Responsive chart sizing
- Color-coded visual indicators

**Props:**
```typescript
interface VisualizationSectionProps {
  categorySummaries: CategorySummary[];  // Category spending summaries
  expenses: ExpenseEntry[];              // Array of expense entries
  totalBudget: number;                   // Total trip budget
  currency: string;                      // Current currency code
  tripStartDate?: string;                // Trip start date (ISO format)
  tripEndDate?: string;                  // Trip end date (ISO format)
  isCollapsed?: boolean;                 // Collapsed state
  onToggleCollapse?: () => void;         // Toggle collapse handler
  className?: string;                    // Additional CSS classes
}
```

**Requirements Validated:**
- 4.8: Pie chart comparing planned vs actual spending by category
- 4.9: Bar chart showing spending by category with planned vs actual amounts
- 5.2: Category progress display with allocated, spent, and remaining amounts
- 5.3: Progress bars for each category with color-coding
- 14.4: Chart rendering within 500ms of data load

**Usage:**
```tsx
import { VisualizationSection } from './organisms';

<VisualizationSection
  categorySummaries={categorySummaries}
  expenses={expenses}
  totalBudget={totalBudget}
  currency={tripCurrency}
  tripStartDate={trip.startDate}
  tripEndDate={trip.endDate}
  isCollapsed={false}
  onToggleCollapse={toggleVisualizations}
/>
```

**Chart Components:**

1. **Category Comparison Chart**
   - Bar chart comparing allocated vs spent amounts per category
   - Color-coded bars (blue for allocated, pink for spent)
   - Interactive tooltips showing detailed amounts
   - Filters out categories with zero allocation
   - Responsive height (default 300px)

2. **Spending Over Time Chart**
   - Line chart showing cumulative spending progression
   - Reference line for total budget limit
   - Daily spending data points
   - Interactive tooltips with daily and cumulative amounts
   - Responsive to trip date range

3. **Category Progress Bars**
   - Detailed progress bars for each category
   - Shows allocated, spent, remaining amounts
   - Color-coded status (safe/warning/danger/over)
   - Expense count per category
   - Over-budget indicators and warnings

**Collapsible Behavior:**
- **Expanded State**: Shows all three chart components with full details
- **Collapsed State**: Shows compact header with section description
- Toggle button available when `onToggleCollapse` is provided
- Smooth expand/collapse animations
- Maintains state across page navigation

**Loading States:**
The component includes a loading state that can be triggered during:
- Initial data fetch
- Chart rendering for large datasets
- Data recalculation after updates

Loading state displays:
- Animated spinner
- "Loading charts..." message
- Centered in the content area

**Empty State:**
When no expense data is available:
- Displays friendly empty state message
- Icon indicating no data
- Helpful prompt to add expenses
- Charts are not rendered to avoid confusion

**Visual Indicators:**
- **Purple accent**: Main section theme color
- **Colored bars**: Each chart section has a colored accent bar (purple, pink, green)
- **Section icons**: Chart icon in header, distinct icons for each subsection
- **Borders**: Rounded borders with subtle shadows for depth
- **Dark mode**: Full dark mode support with appropriate color adjustments

**Responsive Design:**
- Mobile: Single column layout, full-width charts
- Tablet: Optimized chart sizing with better spacing
- Desktop: Larger charts with more detail
- Charts use ResponsiveContainer for automatic sizing
- Maintains aspect ratio across breakpoints

**Accessibility:**
- Semantic HTML with proper heading hierarchy (h3 for main, h4 for subsections)
- ARIA labels for interactive elements
- ARIA expanded state for collapse/expand button
- Descriptive section descriptions for screen readers
- Keyboard navigation support
- Color-blind friendly chart colors
- High contrast mode support

**Performance Optimizations:**
- Memoized chart data calculations
- Lazy rendering of charts (only when expanded)
- Efficient chart library (recharts) with optimized rendering
- Conditional rendering based on data availability
- Smooth animations using CSS transforms
- GPU-accelerated transitions

**Chart Customization:**
All chart components accept customization props:
- `height`: Chart height in pixels (default 300)
- `showLegend`: Toggle legend display (default true)
- `width`: Chart width (default '100%' responsive)
- Custom colors via theme configuration

**Integration:**
The VisualizationSection integrates with:
- BudgetStore for category summaries and expenses
- Currency service for amount formatting
- Theme system for consistent styling
- Responsive layout system for proper sizing


---

### ExpenseFormModal

A modal wrapper for the ExpenseForm molecule component that provides a complete expense entry/editing experience with animations, loading states, and error handling.

**Features:**
- Modal backdrop with blur effect
- Smooth open/close animations using Framer Motion
- Form submission with loading overlay
- Error display with dismissible error banner
- Escape key to close (disabled during submission)
- Click outside to close (disabled during submission)
- Prevents body scroll when open
- Accessible modal with proper ARIA attributes
- Cat emoji in header for theme consistency
- Automatic error reset on modal close
- Success callback after submission

**Props:**
```typescript
interface ExpenseFormModalProps {
  isOpen: boolean;                    // Whether the modal is open
  onClose: () => void;                // Callback when modal should close
  tripId: string;                     // Trip ID for the expense
  tripMembers: TripMember[];          // Trip members for split expense functionality
  currency: string;                   // Currency to display in the form
  initialData?: ExpenseEntry;         // Initial data for editing an existing expense
  onSuccess?: () => void;             // Callback after successful submission (optional)
}
```

**Requirements Validated:**
- 2.1: Expense entry form with modal wrapper
- 2.2: Required field validation (amount, category, date)
- 2.3: Decimal amount validation
- 2.4: Optional fields (note, payment method, split information)
- 2.5: Immediate dashboard update after expense save
- 2.6: Data persistence to Local Storage and PostgreSQL within 1 second

**Usage:**
```tsx
import { ExpenseFormModal } from './organisms';

<ExpenseFormModal
  isOpen={isExpenseFormOpen}
  onClose={closeExpenseForm}
  tripId={trip.id}
  tripMembers={tripMembers}
  currency={tripCurrency}
  initialData={editingExpense}
  onSuccess={handleExpenseAdded}
/>
```

**Modal Behavior:**

**Opening:**
- Fades in backdrop with blur effect
- Scales up modal content from 95% to 100%
- Slides up modal content from 20px below
- Prevents body scroll
- Focuses on first form field (handled by ExpenseForm)

**Closing:**
- Triggered by close button, backdrop click, or Escape key
- Reverses opening animation
- Restores body scroll
- Resets error state
- Resets submitting state

**Submission Flow:**
1. User fills out form and clicks submit
2. Modal shows loading overlay with spinner
3. Close button and Escape key are disabled
4. Form data is validated by ExpenseForm
5. Modal calls `addExpense` or `updateExpense` from budget store
6. On success: Modal closes and calls `onSuccess` callback
7. On error: Loading overlay hides, error banner appears

**Error Handling:**

**Error Display:**
- Red error banner with icon
- Error title: "Error Saving Expense"
- Error message from exception
- Dismissible with X button
- Animated slide-in from top

**Error States:**
- Network errors
- Validation errors from backend
- Permission errors
- Generic errors with fallback message

**Error Recovery:**
- User can dismiss error and retry
- Form data is preserved on error
- Modal remains open for correction
- Error resets when modal closes

**Loading States:**

**During Submission:**
- Semi-transparent white overlay covers entire modal
- Large pink spinner in center
- Loading message: "Adding expense..." or "Updating expense..."
- All interactions disabled (close button, backdrop, Escape key)
- Form inputs remain visible but disabled

**Animations:**

**Modal Entrance:**
```typescript
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

**Modal Exit:**
```typescript
exit={{ opacity: 0, scale: 0.95, y: 20 }}
```

**Backdrop:**
```typescript
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.2 }}
```

**Error Banner:**
```typescript
initial={{ opacity: 0, y: -10 }}
animate={{ opacity: 1, y: 0 }}
```

**Styling:**

**Modal Container:**
- Max width: 2xl (672px)
- Max height: 90vh
- Rounded corners: 3xl (24px)
- Border: 2px pink-200/30
- Background: Floral white (#FFFAF0)
- Shadow: 2xl with blur
- Z-index: 50

**Header:**
- Padding: 6 (24px)
- Border bottom: 2px pink-100/50
- Cat emoji: 3xl size
- Title: 2xl font-bold
- Close button: Hover scale 110%, pink-100/50 background

**Content:**
- Padding: 6 (24px)
- Max height: calc(90vh - 8rem)
- Overflow-y: auto
- Smooth scrolling

**Responsive Design:**
- Mobile: Full width with 16px padding
- Tablet/Desktop: Fixed max-width with centered positioning
- All touch targets minimum 44x44px
- Adequate spacing for touch interactions

**Accessibility:**

**ARIA Attributes:**
- `role="dialog"`: Identifies as modal dialog
- `aria-modal="true"`: Indicates modal behavior
- `aria-labelledby="expense-form-modal-title"`: Links to title
- `aria-label="Close modal"`: Close button label
- `aria-label="Dismiss error"`: Error dismiss button label
- `aria-hidden="true"`: Backdrop hidden from screen readers

**Keyboard Navigation:**
- Escape key closes modal (when not submitting)
- Tab navigation within modal
- Focus trap (handled by browser)
- Enter/Space activates buttons

**Screen Reader Support:**
- Semantic HTML structure
- Descriptive button labels
- Error announcements
- Loading state announcements
- Modal title properly linked

**Integration:**

**Budget Store:**
- Calls `addExpense` for new expenses
- Calls `updateExpense` for editing
- Receives expense data from form
- Handles optimistic updates
- Manages sync status

**ExpenseForm:**
- Passes all required props
- Receives form data on submit
- Handles form validation
- Manages form state
- Provides cancel callback

**Parent Components:**
- Controlled by `isOpen` prop
- Notified via `onClose` callback
- Notified via `onSuccess` callback
- Provides trip context
- Manages modal state

**Performance:**
- Lazy rendering (only when open)
- Efficient animations with Framer Motion
- Memoized callbacks
- Minimal re-renders
- GPU-accelerated transforms

**Testing:**
Comprehensive test coverage includes:
- Rendering in open/closed states
- Accessibility attributes
- User interactions (close, backdrop, Escape)
- Form submission (add and update)
- Loading states
- Error handling and display
- Props handling
- Body scroll prevention

**Dark Mode:**
The component includes dark mode support through Tailwind's dark: variants, though the budget page primarily uses the light BubbleQuest theme.

**Future Enhancements:**
- Confirmation dialog for unsaved changes
- Auto-save draft to localStorage
- Keyboard shortcuts (Cmd+S to save)
- Form field validation hints
- Recent expenses suggestions
- Receipt photo upload
- Voice input for amounts
- Expense templates
