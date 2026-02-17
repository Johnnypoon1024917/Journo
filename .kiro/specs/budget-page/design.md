# Design Document: Budget Page

## Overview

The Budget page is a comprehensive budget management feature for a travel app built with React, TypeScript, and Tailwind CSS. It integrates with existing features including real-time collaboration (WebSocket), itinerary management, reservations, shopping, and packing lists. The page follows the app's established cute cat theme with pastel colors, rounded cards, and engaging animations.

### Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom kawaii theme
- **State Management**: Zustand stores
- **Backend**: PostgreSQL database with REST/GraphQL API
- **Real-time Sync**: WebSocket or Server-Sent Events for live updates
- **Local Storage**: IndexedDB via existing offline services
- **Currency API**: Frankfurter API (already integrated)
- **Internationalization**: i18next (already configured)

### Key Design Principles

1. **Mobile-First**: Responsive design starting from mobile viewport
2. **Real-Time Collaboration**: Instant sync across all trip members
3. **Offline-First**: Full functionality without network connectivity
4. **Progressive Enhancement**: Core features work, enhanced features add delight
5. **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support

## Architecture

### Component Hierarchy

```
BudgetPage (Page Component)
├── NavigationWrapper (Layout)
│   └── PageLayout (Layout)
│       ├── BudgetDashboard (Organism)
│       │   ├── BudgetHeader (Molecule)
│       │   │   ├── TripTitle (Atom)
│       │   │   └── CurrencySelector (Molecule)
│       │   ├── BudgetProgressRing (Molecule)
│       │   │   └── CatEatingAnimation (Atom)
│       │   ├── BudgetStats (Molecule)
│       │   │   ├── StatCard (Atom)
│       │   │   └── BurnRateIndicator (Atom)
│       │   └── AlertBanner (Molecule)
│       ├── BudgetSetupSection (Organism)
│       │   ├── TotalBudgetInput (Molecule)
│       │   ├── CategoryAllocationList (Molecule)
│       │   │   └── CategoryAllocationItem (Atom)
│       │   └── BudgetPieChart (Molecule)
│       ├── ExpenseListSection (Organism)
│       │   ├── ExpenseFilters (Molecule)
│       │   │   └── FilterTab (Atom)
│       │   ├── ExpenseList (Molecule)
│       │   │   └── ExpenseCard (Molecule)
│       │   │       ├── ExpenseAmount (Atom)
│       │   │       ├── ExpenseCategory (Atom)
│       │   │       └── SplitInfo (Atom)
│       │   └── FloatingAddButton (Atom)
│       ├── VisualizationSection (Organism)
│       │   ├── CategoryComparisonChart (Molecule)
│       │   ├── SpendingOverTimeChart (Molecule)
│       │   └── CategoryProgressBars (Molecule)
│       └── GroupSplitView (Organism)
│           ├── MemberAvatarList (Molecule)
│           ├── BalanceSummary (Molecule)
│           └── SettleButton (Atom)
└── ExpenseFormModal (Organism)
    ├── ExpenseForm (Molecule)
    │   ├── AmountInput (Atom)
    │   ├── CategorySelect (Atom)
    │   ├── DatePicker (Atom)
    │   ├── NoteInput (Atom)
    │   └── SplitSelector (Molecule)
    └── FormActions (Molecule)
```

### Data Flow

```
User Action → Component Event Handler → Zustand Store Action
                                              ↓
                                    Local Storage (Immediate)
                                              ↓
                                    API Request to Backend (Async)
                                              ↓
                                    PostgreSQL Database
                                              ↓
                                    WebSocket Broadcast → Other Clients
                                              ↓
                                    Store Update → UI Re-render
```

### State Management

The Budget page uses a dedicated Zustand store (`budgetStore`) that manages:

- Budget configuration (total, categories, allocations)
- Expense entries list
- Filter and sort preferences
- Sync status and queue
- UI state (modals, loading states)

## Components and Interfaces

### Core Data Models

```typescript
// Budget Configuration
interface BudgetConfig {
  id: string;
  tripId: string;
  totalBudget: number;
  homeCurrency: string; // Default: 'HKD'
  tripCurrency: string; // e.g., 'JPY', 'USD'
  categoryAllocations: CategoryAllocation[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryAllocation {
  category: BudgetCategory;
  percentage: number; // 0-100
  allocatedAmount: number; // Calculated from percentage
}

// Expense Entry
interface ExpenseEntry {
  id: string;
  tripId: string;
  amount: number;
  currency: string; // Trip currency
  category: BudgetCategory;
  date: string; // ISO date
  note?: string;
  paidBy?: string; // User ID
  splitWith?: string[]; // User IDs
  splitType?: 'equal' | 'custom';
  customSplits?: CustomSplit[];
  isSettled: boolean;
  linkedItemId?: string; // Link to reservation/shopping item
  linkedItemType?: 'reservation' | 'shopping' | 'itinerary';
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'error';
}

interface CustomSplit {
  userId: string;
  amount: number;
}

// Budget Summary (Computed)
interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageSpent: number;
  status: 'safe' | 'warning' | 'danger' | 'over';
  burnRate: number; // Average daily spending
  projectedTotal: number; // Based on burn rate
  daysElapsed: number;
  daysRemaining: number;
}

// Category Summary (Computed)
interface CategorySummary {
  category: BudgetCategory;
  allocated: number;
  spent: number;
  remaining: number;
  percentageSpent: number;
  expenseCount: number;
  status: 'safe' | 'warning' | 'danger' | 'over';
}

// Group Balance (Computed)
interface MemberBalance {
  userId: string;
  userName: string;
  avatarUrl?: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // Positive = owed to them, Negative = they owe
}

// Settlement
interface Settlement {
  from: string; // User ID
  to: string; // User ID
  amount: number;
  currency: string;
}
```

### Key Component Interfaces

```typescript
// BudgetDashboard Props
interface BudgetDashboardProps {
  tripId: string;
  summary: BudgetSummary;
  onCurrencyChange: (currency: string) => void;
}

// ExpenseCard Props
interface ExpenseCardProps {
  expense: ExpenseEntry;
  homeCurrency: string;
  exchangeRate: number;
  onEdit: (expense: ExpenseEntry) => void;
  onDelete: (expenseId: string) => void;
}

// ExpenseForm Props
interface ExpenseFormProps {
  tripId: string;
  initialData?: ExpenseEntry;
  tripMembers: TripMember[];
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
}

interface ExpenseFormData {
  amount: number;
  category: BudgetCategory;
  date: string;
  note?: string;
  paidBy?: string;
  splitWith?: string[];
  splitType?: 'equal' | 'custom';
  customSplits?: CustomSplit[];
}

// Chart Props
interface BudgetChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  colors?: string[];
}

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}
```

### Service Layer

```typescript
// Budget Service (extends existing budgetService.ts)
class BudgetService {
  // Budget Configuration
  async getBudgetConfig(tripId: string): Promise<BudgetConfig | null>;
  async createBudgetConfig(config: Omit<BudgetConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetConfig>;
  async updateBudgetConfig(configId: string, updates: Partial<BudgetConfig>): Promise<BudgetConfig>;
  
  // Expense Management
  async getExpenses(tripId: string): Promise<ExpenseEntry[]>;
  async createExpense(expense: Omit<ExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExpenseEntry>;
  async updateExpense(expenseId: string, updates: Partial<ExpenseEntry>): Promise<ExpenseEntry>;
  async deleteExpense(expenseId: string): Promise<void>;
  
  // Calculations
  calculateBudgetSummary(config: BudgetConfig, expenses: ExpenseEntry[], trip: Trip): BudgetSummary;
  calculateCategorySummaries(config: BudgetConfig, expenses: ExpenseEntry[]): CategorySummary[];
  calculateMemberBalances(expenses: ExpenseEntry[], members: TripMember[]): MemberBalance[];
  calculateSettlements(balances: MemberBalance[]): Settlement[];
  
  // Currency Conversion
  async convertExpenseToHomeCurrency(expense: ExpenseEntry, homeCurrency: string): Promise<number>;
  
  // Integration
  async linkExpenseToItem(expenseId: string, itemId: string, itemType: 'reservation' | 'shopping' | 'itinerary'): Promise<void>;
}

// Real-time Sync Service
class BudgetSyncService {
  // WebSocket connection
  private ws: WebSocket | null = null;
  
  // Real-time listeners
  subscribeToTripBudget(tripId: string, callback: (event: BudgetUpdateEvent) => void): () => void;
  
  // Sync operations
  async syncBudgetConfig(config: BudgetConfig): Promise<void>;
  async syncExpense(expense: ExpenseEntry): Promise<void>;
  async syncDeleteExpense(expenseId: string): Promise<void>;
  
  // Offline queue
  queueBudgetConfigUpdate(config: BudgetConfig): void;
  queueExpenseUpdate(expense: ExpenseEntry): void;
  processSyncQueue(): Promise<void>;
  
  // WebSocket management
  connect(): void;
  disconnect(): void;
  reconnect(): void;
}

// API Client
class BudgetApiClient {
  // Budget Config endpoints
  async fetchBudgetConfig(tripId: string): Promise<BudgetConfig | null>;
  async createBudgetConfig(config: CreateBudgetConfigDto): Promise<BudgetConfig>;
  async updateBudgetConfig(configId: string, updates: UpdateBudgetConfigDto): Promise<BudgetConfig>;
  
  // Expense endpoints
  async fetchExpenses(tripId: string, filters?: ExpenseFilters): Promise<ExpenseEntry[]>;
  async createExpense(expense: CreateExpenseDto): Promise<ExpenseEntry>;
  async updateExpense(expenseId: string, updates: UpdateExpenseDto): Promise<ExpenseEntry>;
  async deleteExpense(expenseId: string): Promise<void>;
  
  // Batch operations
  async batchSyncExpenses(expenses: ExpenseEntry[]): Promise<SyncResult>;
}

interface BudgetUpdateEvent {
  type: 'budget_config_updated' | 'expense_added' | 'expense_updated' | 'expense_deleted';
  tripId: string;
  userId: string;
  timestamp: string;
  data: BudgetConfig | ExpenseEntry | { expenseId: string };
}
```

### Zustand Store

```typescript
interface BudgetStore {
  // State
  budgetConfig: BudgetConfig | null;
  expenses: ExpenseEntry[];
  filterTab: FilterTab;
  selectedCategory: BudgetCategory | null;
  isExpenseFormOpen: boolean;
  editingExpense: ExpenseEntry | null;
  syncStatus: 'online' | 'offline' | 'syncing';
  
  // Computed (via selectors)
  budgetSummary: BudgetSummary | null;
  categorySummaries: CategorySummary[];
  memberBalances: MemberBalance[];
  filteredExpenses: ExpenseEntry[];
  
  // Actions
  loadBudgetData: (tripId: string) => Promise<void>;
  updateBudgetConfig: (updates: Partial<BudgetConfig>) => Promise<void>;
  addExpense: (expense: Omit<ExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (expenseId: string, updates: Partial<ExpenseEntry>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  setFilterTab: (tab: FilterTab) => void;
  setSelectedCategory: (category: BudgetCategory | null) => void;
  openExpenseForm: (expense?: ExpenseEntry) => void;
  closeExpenseForm: () => void;
  
  // Real-time sync
  startRealtimeSync: (tripId: string) => void;
  stopRealtimeSync: () => void;
}

type FilterTab = 'all' | 'pending' | 'settled' | 'by-category' | 'by-date';
```

## Data Models

### Database Schema (PostgreSQL)

```sql
-- Budget Configuration Table
CREATE TABLE budget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  total_budget DECIMAL(12, 2) NOT NULL CHECK (total_budget > 0),
  home_currency VARCHAR(3) NOT NULL DEFAULT 'HKD',
  trip_currency VARCHAR(3) NOT NULL,
  category_allocations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id)
);

-- Expenses Table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('flights', 'accommodation', 'food', 'transport', 'activities', 'shopping', 'misc')),
  date DATE NOT NULL,
  note TEXT,
  paid_by UUID REFERENCES users(id),
  split_with UUID[],
  split_type VARCHAR(20) CHECK (split_type IN ('equal', 'custom')),
  custom_splits JSONB,
  is_settled BOOLEAN DEFAULT FALSE,
  linked_item_id UUID,
  linked_item_type VARCHAR(20) CHECK (linked_item_type IN ('reservation', 'shopping', 'itinerary')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error'))
);

-- Indexes for performance
CREATE INDEX idx_budget_configs_trip_id ON budget_configs(trip_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_trip_date ON expenses(trip_id, date DESC);
CREATE INDEX idx_expenses_trip_category ON expenses(trip_id, category);
CREATE INDEX idx_expenses_trip_settled ON expenses(trip_id, is_settled);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_expenses_linked_item ON expenses(linked_item_id, linked_item_type);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_configs_updated_at
  BEFORE UPDATE ON budget_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Category Allocations JSONB structure
-- {
--   "allocations": [
--     { "category": "flights", "percentage": 30, "allocatedAmount": 3000 },
--     { "category": "accommodation", "percentage": 25, "allocatedAmount": 2500 },
--     ...
--   ]
-- }

-- Custom Splits JSONB structure
-- {
--   "splits": [
--     { "userId": "uuid", "amount": 100.50 },
--     { "userId": "uuid", "amount": 150.75 }
--   ]
-- }
```

### Backend API Endpoints

```typescript
// REST API Endpoints

// Budget Configuration
GET    /api/trips/:tripId/budget/config
POST   /api/trips/:tripId/budget/config
PUT    /api/trips/:tripId/budget/config/:configId
DELETE /api/trips/:tripId/budget/config/:configId

// Expenses
GET    /api/trips/:tripId/budget/expenses
POST   /api/trips/:tripId/budget/expenses
PUT    /api/trips/:tripId/budget/expenses/:expenseId
DELETE /api/trips/:tripId/budget/expenses/:expenseId

// Batch operations
POST   /api/trips/:tripId/budget/expenses/batch

// Calculations (computed on backend)
GET    /api/trips/:tripId/budget/summary
GET    /api/trips/:tripId/budget/categories
GET    /api/trips/:tripId/budget/balances
GET    /api/trips/:tripId/budget/settlements

// WebSocket endpoint for real-time updates
WS     /ws/trips/:tripId/budget
```

### Local Storage Schema (IndexedDB)

```
budgetConfigs (Object Store)
  - keyPath: 'id'
  - indexes: ['tripId']

expenses (Object Store)
  - keyPath: 'id'
  - indexes: ['tripId', 'category', 'date', 'syncStatus']

syncQueue (Object Store)
  - keyPath: 'id'
  - data: { operation: string, entity: string, data: any, timestamp: number }

exchangeRates (Object Store)
  - keyPath: 'currencyPair' (e.g., 'JPY_HKD')
  - data: { rate: number, cachedAt: timestamp }
```

### Validation Rules

```typescript
// Budget Config Validation
const budgetConfigSchema = {
  totalBudget: (value: number) => value > 0,
  categoryAllocations: (allocations: CategoryAllocation[]) => {
    const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
    return Math.abs(totalPercentage - 100) < 0.01; // Allow for floating point errors
  }
};

// Expense Entry Validation
const expenseEntrySchema = {
  amount: (value: number) => value > 0 && Number.isFinite(value),
  category: (value: string) => ['accommodation', 'food', 'transport', 'activities', 'shopping', 'misc'].includes(value),
  date: (value: string) => !isNaN(Date.parse(value)),
  customSplits: (splits: CustomSplit[], totalAmount: number) => {
    if (!splits || splits.length === 0) return true;
    const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
    return Math.abs(splitTotal - totalAmount) < 0.01;
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Budget Amount Validation
*For any* budget amount input, the system should accept only positive numbers greater than zero and reject all other values (negative, zero, non-numeric).
**Validates: Requirements 1.2**

### Property 2: Category Allocation Sum Invariant
*For any* set of category allocation modifications, the sum of all category percentages must always equal 100% (within floating-point tolerance of 0.01%).
**Validates: Requirements 1.4**

### Property 3: Data Persistence Round-Trip
*For any* budget configuration or expense entry, saving the data should result in it being retrievable from both Local Storage and PostgreSQL database with all fields intact.
**Validates: Requirements 1.5, 2.6, 12.1**

### Property 4: Currency Selection Persistence
*For any* trip currency selection, saving the selection should result in that currency being used consistently for all expense displays and persisted across sessions.
**Validates: Requirements 1.7**

### Property 5: Required Field Validation
*For any* expense entry submission, entries missing required fields (amount, category, or date) should be rejected, while entries with all required fields should be accepted.
**Validates: Requirements 2.2**

### Property 6: Decimal Amount Validation
*For any* expense amount input, the system should accept positive decimal numbers with up to 2 decimal places and reject invalid formats (negative, more than 2 decimals, non-numeric).
**Validates: Requirements 2.3**

### Property 7: Expense Addition Updates Dashboard
*For any* expense entry added or deleted, the budget dashboard totals (spent, remaining, percentage) should immediately reflect the change.
**Validates: Requirements 2.5, 2.9**

### Property 8: Expense Display Completeness
*For any* expense entry, the rendered expense card should contain all specified fields: amount in both currencies, date, category icon, note (if present), and split information (if applicable).
**Validates: Requirements 2.7**

### Property 9: Multi-Currency Display
*For any* expense entry, the display should show both the trip currency amount and the home currency equivalent using the current exchange rate.
**Validates: Requirements 3.3**

### Property 10: Home Currency Calculation Base
*For any* budget calculation (totals, remaining, category summaries), the calculation should use home currency as the base, converting all trip currency amounts using exchange rates.
**Validates: Requirements 3.6**

### Property 11: Burn Rate Calculation
*For any* set of expenses and trip duration, the burn rate should equal the total spent divided by the number of days elapsed.
**Validates: Requirements 4.6**

### Property 12: Burn Rate Warning Threshold
*For any* budget state where burn rate exceeds the planned daily budget, a warning banner should be displayed.
**Validates: Requirements 4.7**

### Property 13: Category Spending Totals
*For any* set of expenses, the sum of all category spending totals should equal the overall total spent amount.
**Validates: Requirements 5.1**

### Property 14: Category Display Completeness
*For any* category, the progress display should show allocated amount, spent amount, and remaining amount with correct calculations.
**Validates: Requirements 5.2**

### Property 15: Category Over-Budget Warning
*For any* category where spent amount exceeds allocated amount, a warning indicator should be displayed for that category.
**Validates: Requirements 5.4**

### Property 16: Category Filtering
*For any* selected category filter, the expense list should display only expenses matching that category, excluding all others.
**Validates: Requirements 5.5**

### Property 17: Category Allocation Recalculation
*For any* adjustment to category allocations, all category budget amounts should be recalculated based on the new percentages and total budget.
**Validates: Requirements 5.7**

### Property 18: Split Expense Calculation
*For any* split expense with equal splitting, each member's share should equal the total amount divided by the number of members. For custom splitting, the sum of custom splits should equal the total amount.
**Validates: Requirements 6.3**

### Property 19: Member Balance Calculation
*For any* set of split expenses, each member's net balance should equal the total they paid minus the total they owe, with all balances summing to zero across all members.
**Validates: Requirements 6.4, 6.5**

### Property 20: Settlement Updates Balances
*For any* split expense marked as settled, all affected member balances should be recalculated immediately to reflect the settlement.
**Validates: Requirements 6.9**

### Property 21: Expense List Filtering and Grouping
*For any* filter selection (all, pending, settled, by-category, by-date), the expense list should display only items matching the filter criteria, properly sorted or grouped according to the filter type.
**Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6**

### Property 22: Filter State Persistence
*For any* filter selection, navigating away from the budget page and returning should restore the same filter selection.
**Validates: Requirements 7.7**

### Property 23: Trip Data Loading
*For any* trip ID, accessing the budget page should load the correct budget configuration and expenses associated with that specific trip.
**Validates: Requirements 8.4**

### Property 24: Real-Time Sync Broadcast
*For any* budget data change (config update, expense add/edit/delete), the system should broadcast the change via the collaboration system for real-time sync to other users.
**Validates: Requirements 8.6, 8.7**

### Property 25: Offline Queue Management
*For any* data change made while offline, the change should be stored in local storage and added to a sync queue for later synchronization when connectivity is restored.
**Validates: Requirements 9.3, 9.4, 12.4, 12.5**

### Property 26: Conflict Resolution by Timestamp
*For any* sync conflict between two versions of the same data, the system should preserve the version with the most recent timestamp.
**Validates: Requirements 9.5, 12.6**

### Property 27: Collaboration Notifications
*For any* budget configuration modification, the system should send a notification to all trip members via the collaboration notification system.
**Validates: Requirements 9.7**

### Property 28: Language Switching Updates UI
*For any* language preference change, all text labels, buttons, messages, category names, and navigation labels should immediately update to the selected language.
**Validates: Requirements 11.3, 11.5**

### Property 29: Language Preference Persistence
*For any* language selection, the preference should be persisted to local storage and restored on subsequent app loads.
**Validates: Requirements 11.4**

### Property 30: Locale-Based Formatting
*For any* currency amount or date value, the display format should match the conventions of the selected language locale (e.g., HKD $1,234.56 vs ¥1,234 for different locales).
**Validates: Requirements 11.6, 11.7**

### Property 31: Offline Operations
*For any* read or write operation attempted while offline, the system should successfully complete the operation using local storage without requiring network connectivity.
**Validates: Requirements 12.3**

### Property 32: Budget Threshold Alerts
*For any* budget state, the system should display appropriate alert banners based on spending thresholds: warning at 70%, critical warning at 90%, and over-budget alert above 100%.
**Validates: Requirements 13.1, 13.2, 13.3**

### Property 33: Category Budget Alerts
*For any* category where spending exceeds the allocated budget, a category-specific warning should be displayed.
**Validates: Requirements 13.4**

### Property 34: Burn Rate Alert Threshold
*For any* budget state where burn rate exceeds planned daily budget by 20% or more, a burn rate warning should be displayed.
**Validates: Requirements 13.5**

### Property 35: Warning Dismissal Suppression
*For any* dismissed warning, if the warning condition persists, the same warning should not be re-displayed for 24 hours.
**Validates: Requirements 13.7**



## Error Handling

### Input Validation Errors

```typescript
class ValidationError extends Error {
  constructor(
    public field: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error codes
const VALIDATION_ERRORS = {
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  NEGATIVE_AMOUNT: 'NEGATIVE_AMOUNT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_PERCENTAGE: 'INVALID_PERCENTAGE',
  ALLOCATION_SUM_MISMATCH: 'ALLOCATION_SUM_MISMATCH',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_SPLIT: 'INVALID_SPLIT',
} as const;
```

**Handling Strategy**:
- Display inline error messages below invalid form fields
- Use red text with error icon for visibility
- Prevent form submission until all validation errors are resolved
- Provide helpful error messages in both Chinese and English

### Network and Sync Errors

```typescript
class SyncError extends Error {
  constructor(
    public operation: string,
    public retryable: boolean,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

// Sync error types
const SYNC_ERRORS = {
  NETWORK_UNAVAILABLE: { retryable: true, message: '網絡連接不可用 / Network unavailable' },
  API_PERMISSION_DENIED: { retryable: false, message: '權限被拒絕 / Permission denied' },
  API_TIMEOUT: { retryable: true, message: '請求超時 / Request timeout' },
  CONFLICT_DETECTED: { retryable: true, message: '檢測到衝突 / Conflict detected' },
  SERVER_ERROR: { retryable: true, message: '服務器錯誤 / Server error' },
} as const;
```

**Handling Strategy**:
- Queue failed operations for retry when network is restored
- Display sync status indicator (online/offline/syncing/error)
- Show toast notifications for sync errors with retry option
- Implement exponential backoff for retries (1s, 2s, 4s, 8s, max 30s)
- Log errors to console for debugging
- Store failed requests in IndexedDB for persistence across sessions

### Currency Conversion Errors

```typescript
class CurrencyError extends Error {
  constructor(
    public currencyPair: string,
    message: string
  ) {
    super(message);
    this.name = 'CurrencyError';
  }
}
```

**Handling Strategy**:
- Fall back to cached exchange rates when API is unavailable
- Display warning indicator when using cached rates
- Show last update timestamp for exchange rates
- Provide manual refresh option for exchange rates
- Default to 1:1 conversion if no rate available (with prominent warning)

### Data Integrity Errors

```typescript
class DataIntegrityError extends Error {
  constructor(
    public dataType: string,
    public issue: string,
    message: string
  ) {
    super(message);
    this.name = 'DataIntegrityError';
  }
}
```

**Handling Strategy**:
- Validate data structure on load from local storage
- Attempt to repair corrupted data when possible
- Prompt user to refresh data from backend API if local data is corrupted
- Log data integrity issues for debugging
- Provide "Reset Budget Data" option as last resort

### User-Facing Error Messages

All error messages should be:
- **Bilingual**: Display in both Chinese (primary) and English
- **Actionable**: Tell users what they can do to resolve the issue
- **Non-technical**: Avoid technical jargon
- **Contextual**: Explain what the user was trying to do

**Example Error Messages**:
```typescript
const ERROR_MESSAGES = {
  INVALID_AMOUNT: {
    zh: '請輸入有效的金額（大於0）',
    en: 'Please enter a valid amount (greater than 0)'
  },
  ALLOCATION_SUM_MISMATCH: {
    zh: '類別分配總和必須等於100%',
    en: 'Category allocations must sum to 100%'
  },
  NETWORK_UNAVAILABLE: {
    zh: '無法連接網絡。您的更改將在恢復連接後同步。',
    en: 'Unable to connect to network. Your changes will sync when connection is restored.'
  },
  SYNC_FAILED: {
    zh: '同步失敗。點擊重試。',
    en: 'Sync failed. Tap to retry.'
  }
};
```

## Testing Strategy

### Dual Testing Approach

The Budget page requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs using randomized test data

### Property-Based Testing Configuration

**Library**: Use **fast-check** for TypeScript/JavaScript property-based testing

**Configuration**:
- Minimum **100 iterations** per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: budget-page, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import fc from 'fast-check';

describe('Budget Page Property Tests', () => {
  it('Property 2: Category allocation sum invariant', () => {
    // Feature: budget-page, Property 2: Category allocation sum must equal 100%
    
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 0, max: 100 }), { minLength: 7, maxLength: 7 }),
        (percentages) => {
          // Normalize to sum to 100%
          const sum = percentages.reduce((a, b) => a + b, 0);
          const normalized = percentages.map(p => (p / sum) * 100);
          
          const allocations = createCategoryAllocations(normalized);
          const result = validateAllocations(allocations);
          
          expect(result.isValid).toBe(true);
          expect(Math.abs(result.sum - 100)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Focus Areas

**Component Tests**:
- BudgetDashboard renders with correct data
- ExpenseCard displays all required fields
- ExpenseForm validation and submission
- Filter tabs switch correctly
- Currency selector updates state

**Service Tests**:
- BudgetService calculations (summary, category totals, balances)
- Currency conversion with mocked exchange rates
- API client with mocked HTTP responses
- Local storage operations with mocked IndexedDB
- WebSocket connection and message handling

**Integration Tests**:
- Adding expense updates dashboard and category totals
- Deleting expense recalculates all summaries
- Changing currency updates all expense displays
- Offline mode queues changes and syncs when online
- Real-time sync updates UI when other users make changes

**Edge Cases**:
- Empty expense list
- Zero budget allocation for a category
- Expenses with missing optional fields
- Very large expense amounts (overflow handling)
- Expenses on trip start/end dates
- Single-member trip (no splitting)
- All expenses settled vs all pending

**Error Conditions**:
- Invalid form inputs (negative amounts, missing fields)
- Network failures during sync
- Corrupted local storage data
- Missing exchange rates
- API permission errors
- WebSocket disconnection and reconnection

### Test Data Generators

Create reusable generators for property tests:

```typescript
// Arbitrary generators for fast-check
const arbitraryBudgetConfig = fc.record({
  totalBudget: fc.float({ min: 100, max: 100000 }),
  homeCurrency: fc.constantFrom('HKD', 'USD', 'EUR'),
  tripCurrency: fc.constantFrom('JPY', 'USD', 'EUR', 'GBP'),
  categoryAllocations: fc.array(
    fc.record({
      category: fc.constantFrom('flights', 'accommodation', 'food', 'transport', 'activities', 'shopping', 'misc'),
      percentage: fc.float({ min: 0, max: 100 })
    }),
    { minLength: 7, maxLength: 7 }
  ).map(normalizeAllocations) // Ensure sum = 100%
});

const arbitraryExpense = fc.record({
  amount: fc.float({ min: 0.01, max: 10000 }),
  category: fc.constantFrom('flights', 'accommodation', 'food', 'transport', 'activities', 'shopping', 'misc'),
  date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  note: fc.option(fc.string({ minLength: 0, maxLength: 200 })),
  isSettled: fc.boolean()
});
```

### Testing Checklist

**Before Deployment**:
- [ ] All property tests pass (35 properties)
- [ ] All unit tests pass (target: >80% code coverage)
- [ ] Integration tests pass for all critical flows
- [ ] Manual testing on mobile devices (iOS Safari, Android Chrome)
- [ ] Accessibility testing (keyboard navigation, screen reader)
- [ ] Performance testing (load time, scroll performance)
- [ ] Offline mode testing (airplane mode)
- [ ] Multi-user collaboration testing (2+ users editing simultaneously)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Bilingual testing (Chinese and English)

## UI Implementation Details

### Layout Structure

```
┌─────────────────────────────────────┐
│  Navigation Bar (Top)               │ ← Existing app navigation
├─────────────────────────────────────┤
│  Budget Dashboard (Sticky)          │ ← Sticky on scroll
│  ┌─────────────────────────────┐   │
│  │ Trip Name | Currency Select │   │
│  ├─────────────────────────────┤   │
│  │   Progress Ring + Cat Anim  │   │
│  │   Total | Spent | Remaining │   │
│  ├─────────────────────────────┤   │
│  │ Burn Rate | Alert Banners   │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Budget Setup (Collapsible)         │ ← Collapsed after setup
│  ┌─────────────────────────────┐   │
│  │ Total Budget Input          │   │
│  │ Category Sliders/Inputs     │   │
│  │ Pie Chart Visualization     │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Expense Filters (Tabs)             │
│  [全部][待支付][已結算][類別][日期]  │
├─────────────────────────────────────┤
│  Expense List (Scrollable)          │
│  ┌─────────────────────────────┐   │
│  │ Expense Card 1              │   │
│  │ ¥1,200 (HKD 140) | 🍜 飲食  │   │
│  │ 2024-03-15 | Johnny paid    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Expense Card 2              │   │
│  └─────────────────────────────┘   │
│  ...                                │
├─────────────────────────────────────┤
│  Visualizations (Expandable)        │
│  ┌─────────────────────────────┐   │
│  │ Category Comparison Chart   │   │
│  │ Spending Over Time Chart    │   │
│  │ Category Progress Bars      │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Group Split View (If group trip)   │
│  ┌─────────────────────────────┐   │
│  │ Member Avatars + Balances   │   │
│  │ Settlement Summary          │   │
│  │ [Settle Up] Button          │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Bottom Navigation (Tabs)           │ ← Existing app navigation
│  [行程][預約][預算][購物][準備]      │
└─────────────────────────────────────┘

[+] Floating Add Button (Bottom Right)
```

### Responsive Breakpoints

```css
/* Mobile First (Default) */
/* 320px - 767px */

/* Tablet */
@media (min-width: 768px) {
  /* Side-by-side layouts for dashboard stats */
  /* Wider charts and visualizations */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Multi-column layout */
  /* Dashboard and expense list side-by-side */
  /* Larger charts with more detail */
}
```

### Color Palette (Cat Theme)

```typescript
const BUDGET_COLORS = {
  // Pastel theme colors
  primary: '#FFB6C1', // Pastel pink
  secondary: '#F5E6D3', // Pastel beige
  accent: '#FFD700', // Gold for highlights
  
  // Status colors
  safe: '#90EE90', // Light green
  warning: '#FFD700', // Gold/yellow
  danger: '#FF6B6B', // Soft red
  
  // Category colors
  flights: '#87CEEB', // Sky blue
  accommodation: '#DDA0DD', // Plum
  food: '#FFB6C1', // Pink
  transport: '#98FB98', // Pale green
  activities: '#FFD700', // Gold
  shopping: '#FFA07A', // Light salmon
  misc: '#D3D3D3', // Light gray
  
  // UI colors
  background: '#FFFAF0', // Floral white
  cardBackground: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.1)',
};
```

### Cat Animation States

```typescript
interface CatAnimationState {
  state: 'idle' | 'eating' | 'happy' | 'worried' | 'sad';
  budgetPercentage: number;
}

// Animation logic
const getCatState = (percentageSpent: number): CatAnimationState => {
  if (percentageSpent < 50) return { state: 'idle', budgetPercentage: percentageSpent };
  if (percentageSpent < 70) return { state: 'eating', budgetPercentage: percentageSpent };
  if (percentageSpent < 90) return { state: 'worried', budgetPercentage: percentageSpent };
  if (percentageSpent < 100) return { state: 'sad', budgetPercentage: percentageSpent };
  return { state: 'sad', budgetPercentage: percentageSpent };
};
```

**Animation Triggers**:
- **Idle**: Budget < 50% spent, cat sits contentedly
- **Eating**: Budget 50-70% spent, cat "munches" on pie chart
- **Worried**: Budget 70-90% spent, cat looks concerned
- **Sad**: Budget > 90% spent, cat looks worried
- **Confetti**: Milestone reached (25%, 50%, 75%) while under budget

### Accessibility Features

**Keyboard Navigation**:
- Tab through all interactive elements
- Enter/Space to activate buttons
- Arrow keys for slider adjustments
- Escape to close modals

**Screen Reader Support**:
- ARIA labels for all interactive elements
- ARIA live regions for dynamic updates (expense added, sync status)
- Semantic HTML (nav, main, section, article)
- Alt text for cat animations and icons

**Touch Targets**:
- Minimum 44x44px for all interactive elements
- Adequate spacing between touch targets (8px minimum)
- Visual feedback on touch (ripple effect)

**Color Contrast**:
- WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
- Status colors tested for colorblind accessibility
- Text overlays on colored backgrounds use sufficient contrast

### Performance Optimizations

**Rendering**:
- Virtual scrolling for expense lists > 50 items
- Memoized components (React.memo) for expensive renders
- Debounced input handlers (300ms for search/filter)
- Lazy loading for charts (render on scroll into view)

**Data Loading**:
- Load budget config and recent expenses first (last 30 days)
- Lazy load older expenses on demand
- Cache exchange rates for 24 hours
- Prefetch trip member data

**Animations**:
- Use CSS transforms (GPU-accelerated)
- RequestAnimationFrame for smooth animations
- Reduce motion for users with prefers-reduced-motion
- Disable animations on low-end devices

### Integration Points

**Itinerary Integration**:
```typescript
// Link expense to itinerary item
interface ItineraryExpenseLink {
  itineraryItemId: string;
  expenseId: string;
  linkType: 'planned' | 'actual';
}

// Display in itinerary view
<ItineraryItem>
  <ExpenseBadge amount={linkedExpense.amount} currency={linkedExpense.currency} />
</ItineraryItem>
```

**Reservation Integration**:
```typescript
// Auto-create expense from reservation
const createExpenseFromReservation = (reservation: Reservation): ExpenseEntry => ({
  amount: reservation.totalCost,
  currency: reservation.currency,
  category: mapReservationTypeToCategory(reservation.type), // e.g., hotel → accommodation
  date: reservation.checkInDate,
  note: `${reservation.name} - ${reservation.confirmationNumber}`,
  linkedItemId: reservation.id,
  linkedItemType: 'reservation',
  // ... other fields
});
```

**Shopping Integration**:
```typescript
// Link shopping item to expense
interface ShoppingExpenseLink {
  shoppingItemId: string;
  expenseId: string;
  isPurchased: boolean;
}

// Mark as purchased creates expense
const markAsPurchased = (item: ShoppingItem): ExpenseEntry => ({
  amount: item.estimatedCost,
  currency: item.currency,
  category: 'shopping',
  date: new Date().toISOString(),
  note: item.name,
  linkedItemId: item.id,
  linkedItemType: 'shopping',
  // ... other fields
});
```

**Collaboration Integration**:
```typescript
// Real-time sync via WebSocket
interface BudgetCollaborationEvent {
  type: 'budget_config_updated' | 'expense_added' | 'expense_updated' | 'expense_deleted';
  tripId: string;
  userId: string;
  timestamp: string;
  data: BudgetConfig | ExpenseEntry | { expenseId: string };
}

// Subscribe to budget events via WebSocket
const ws = new WebSocket(`wss://api.example.com/ws/trips/${tripId}/budget`);

ws.onmessage = (event) => {
  const budgetEvent: BudgetCollaborationEvent = JSON.parse(event.data);
  budgetStore.handleRemoteUpdate(budgetEvent);
};

// Send updates via WebSocket
const broadcastUpdate = (event: BudgetCollaborationEvent) => {
  ws.send(JSON.stringify(event));
};
```

### Database Indexes (PostgreSQL)

Already defined in the database schema section above. Key indexes include:
- `idx_budget_configs_trip_id` for fast budget config lookups
- `idx_expenses_trip_id` for fetching all expenses for a trip
- `idx_expenses_trip_date` for date-ordered expense queries
- `idx_expenses_trip_category` for category filtering
- `idx_expenses_trip_settled` for settlement status filtering

### API Authorization

```typescript
// Middleware for API endpoints
const requireTripMember = async (req, res, next) => {
  const { tripId } = req.params;
  const userId = req.user.id; // From auth token
  
  const trip = await db.query(
    'SELECT member_ids FROM trips WHERE id = $1',
    [tripId]
  );
  
  if (!trip.rows[0] || !trip.rows[0].member_ids.includes(userId)) {
    return res.status(403).json({ error: 'Not a trip member' });
  }
  
  next();
};

// Apply to all budget endpoints
app.use('/api/trips/:tripId/budget/*', requireTripMember);

// Additional authorization for expense modifications
const requireExpenseOwner = async (req, res, next) => {
  const { expenseId } = req.params;
  const userId = req.user.id;
  
  const expense = await db.query(
    'SELECT created_by FROM expenses WHERE id = $1',
    [expenseId]
  );
  
  if (!expense.rows[0] || expense.rows[0].created_by !== userId) {
    return res.status(403).json({ error: 'Not expense owner' });
  }
  
  next();
};

// Apply to update/delete endpoints
app.put('/api/trips/:tripId/budget/expenses/:expenseId', requireExpenseOwner);
app.delete('/api/trips/:tripId/budget/expenses/:expenseId', requireExpenseOwner);
```

## Implementation Notes

### Existing Infrastructure to Leverage

The Budget page should integrate with existing app infrastructure:

1. **Navigation**: Use existing `NavigationWrapper` and `PageLayout` components
2. **State Management**: Follow existing Zustand store patterns
3. **Styling**: Use existing Tailwind configuration and kawaii theme
4. **i18n**: Use existing i18next configuration for bilingual support
5. **Offline**: Use existing offline service and IndexedDB setup
6. **Currency**: Use existing Frankfurter API integration
7. **Collaboration**: Use existing WebSocket real-time sync and notification system
8. **Authentication**: Use existing authentication integration

### Development Phases

**Phase 1: Core Budget Setup** (MVP)
- Budget configuration UI
- Category allocation with validation
- Basic expense entry form
- Expense list display
- Local storage persistence

**Phase 2: Calculations and Visualizations**
- Budget summary calculations
- Category summaries
- Progress ring with color coding
- Basic charts (pie, bar)
- Burn rate calculation

**Phase 3: Multi-Currency and Sync**
- Currency conversion
- PostgreSQL database sync via REST API
- Real-time collaboration via WebSocket
- Offline queue management
- Conflict resolution

**Phase 4: Group Features**
- Split expense functionality
- Member balance calculations
- Settlement flow
- Group view UI

**Phase 5: Integration and Polish**
- Itinerary integration
- Reservation integration
- Shopping integration
- Cat animations
- Confetti effects
- Alert banners
- Performance optimizations

### Migration Strategy

If users have existing budget data in a different format:

```typescript
const migrateLegacyBudgetData = async (tripId: string): Promise<void> => {
  // Check for legacy data
  const legacyData = await getLegacyBudgetData(tripId);
  if (!legacyData) return;
  
  // Transform to new format
  const newConfig: BudgetConfig = {
    id: generateId(),
    tripId,
    totalBudget: legacyData.total,
    homeCurrency: 'HKD',
    tripCurrency: legacyData.currency || 'HKD',
    categoryAllocations: transformLegacyAllocations(legacyData.categories),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const newExpenses: ExpenseEntry[] = legacyData.expenses.map(transformLegacyExpense);
  
  // Save to new format
  await budgetService.createBudgetConfig(newConfig);
  await Promise.all(newExpenses.map(e => budgetService.createExpense(e)));
  
  // Mark migration complete
  await markMigrationComplete(tripId);
};
```

## Conclusion

The Budget page design provides a comprehensive, user-friendly budget management system that integrates seamlessly with the existing travel app. The cute cat theme and pastel colors create an engaging experience that makes budget tracking feel less tedious. Real-time collaboration ensures all trip members stay informed, while offline support guarantees functionality even without network connectivity. The dual testing approach (unit tests + property-based tests) ensures correctness and reliability across all use cases.
