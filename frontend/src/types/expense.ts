// Expense/Budget types and interfaces

import { BudgetCategory } from './trip';

// Legacy expense interface (kept for backward compatibility)
export interface Expense {
  id: string;
  trip_id: string;
  amount: number;
  currency: string;
  category: BudgetCategory;
  date: string; // ISO date string
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseDto {
  trip_id: string;
  amount: number;
  currency: string;
  category: BudgetCategory;
  date: string;
  notes?: string;
}

export interface UpdateExpenseDto {
  amount?: number;
  currency?: string;
  category?: BudgetCategory;
  date?: string;
  notes?: string;
}

export interface ExpenseStats {
  total: number;
  currency: string;
  byCategory: CategoryExpense[];
}

export interface CategoryExpense {
  category: BudgetCategory;
  amount: number;
  percentage: number;
  count: number;
}

// ============================================================================
// Budget Page - Core Data Models
// ============================================================================

export type SplitType = 'equal' | 'custom';
export type SyncStatus = 'synced' | 'pending' | 'error';
export type LinkedItemType = 'reservation' | 'shopping' | 'itinerary';
export type BudgetStatus = 'safe' | 'warning' | 'danger' | 'over';
export type FilterTab = 'all' | 'pending' | 'settled' | 'by-category' | 'by-date';

// Budget Configuration
export interface CategoryAllocation {
  category: BudgetCategory;
  percentage: number;
  allocatedAmount: number;
}

export interface BudgetConfig {
  id: string;
  tripId: string;
  totalBudget: number;
  homeCurrency: string; // Default: 'HKD'
  tripCurrency: string; // e.g., 'JPY', 'USD'
  categoryAllocations: CategoryAllocation[];
  createdAt: string;
  updatedAt: string;
}

// Custom Split for group expenses
export interface CustomSplit {
  userId: string;
  amount: number;
}

// Expense Entry
export interface ExpenseEntry {
  id: string;
  tripId: string;
  amount: number;
  currency: string; // Trip currency
  category: BudgetCategory;
  date: string; // ISO date
  note?: string;
  paidBy?: string; // User ID
  splitWith?: string[]; // User IDs
  splitType?: SplitType;
  customSplits?: CustomSplit[];
  isSettled: boolean;
  linkedItemId?: string; // Link to reservation/shopping item
  linkedItemType?: LinkedItemType;
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

// Budget Summary (Computed)
export interface BudgetPageSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageSpent: number;
  status: BudgetStatus;
  burnRate: number; // Average daily spending
  projectedTotal: number; // Based on burn rate
  daysElapsed: number;
  daysRemaining: number;
}

// Category Summary (Computed)
export interface CategorySummary {
  category: BudgetCategory;
  allocated: number;
  spent: number;
  remaining: number;
  percentageSpent: number;
  expenseCount: number;
  status: BudgetStatus;
}

// Group Balance (Computed)
export interface MemberBalance {
  userId: string;
  userName: string;
  avatarUrl?: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // Positive = owed to them, Negative = they owe
}

// Settlement
export interface Settlement {
  from: string; // User ID
  to: string; // User ID
  amount: number;
  currency: string;
}

// ============================================================================
// API DTOs (Data Transfer Objects)
// ============================================================================

// Budget Config DTOs
export interface CreateBudgetConfigDto {
  tripId: string;
  totalBudget: number;
  homeCurrency?: string;
  tripCurrency: string;
  categoryAllocations: CategoryAllocation[];
}

export interface UpdateBudgetConfigDto {
  totalBudget?: number;
  homeCurrency?: string;
  tripCurrency?: string;
  categoryAllocations?: CategoryAllocation[];
}

// Expense DTOs
export interface CreateExpenseEntryDto {
  tripId: string;
  amount: number;
  currency: string;
  category: BudgetCategory;
  date: string;
  note?: string;
  paidBy?: string;
  splitWith?: string[];
  splitType?: SplitType;
  customSplits?: CustomSplit[];
  linkedItemId?: string;
  linkedItemType?: LinkedItemType;
}

export interface UpdateExpenseEntryDto {
  amount?: number;
  currency?: string;
  category?: BudgetCategory;
  date?: string;
  note?: string;
  paidBy?: string;
  splitWith?: string[];
  splitType?: SplitType;
  customSplits?: CustomSplit[];
  isSettled?: boolean;
  linkedItemId?: string;
  linkedItemType?: LinkedItemType;
  syncStatus?: SyncStatus;
}

// Batch Sync DTO
export interface BatchSyncExpenseDto {
  expenses: (CreateExpenseEntryDto | (UpdateExpenseEntryDto & { id: string }))[];
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors?: Array<{ id?: string; error: string }>;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

// Budget Dashboard Props
export interface BudgetDashboardProps {
  tripId: string;
  summary: BudgetPageSummary;
  onCurrencyChange: (currency: string) => void;
}

// Expense Card Props
export interface ExpenseCardProps {
  expense: ExpenseEntry;
  homeCurrency: string;
  exchangeRate: number;
  onEdit: (expense: ExpenseEntry) => void;
  onDelete: (expenseId: string) => void;
}

// Expense Form Props
export interface ExpenseFormProps {
  tripId: string;
  initialData?: ExpenseEntry;
  tripMembers: TripMember[];
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
}

export interface ExpenseFormData {
  amount: number;
  category: BudgetCategory;
  date: string;
  note?: string;
  paidBy?: string;
  splitWith?: string[];
  splitType?: SplitType;
  customSplits?: CustomSplit[];
}

// Trip Member (for expense splitting)
export interface TripMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// Chart Props
export interface BudgetChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  colors?: string[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// ============================================================================
// Real-time Sync Events
// ============================================================================

export type BudgetUpdateEventType = 
  | 'budget_config_updated' 
  | 'expense_added' 
  | 'expense_updated' 
  | 'expense_deleted';

export interface BudgetUpdateEvent {
  type: BudgetUpdateEventType;
  tripId: string;
  userId: string;
  timestamp: string;
  data: BudgetConfig | ExpenseEntry | { expenseId: string };
}

// ============================================================================
// Validation and Error Types
// ============================================================================

export interface BudgetValidationError {
  field: string;
  code: string;
  message: string;
}

export const VALIDATION_ERROR_CODES = {
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  NEGATIVE_AMOUNT: 'NEGATIVE_AMOUNT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_PERCENTAGE: 'INVALID_PERCENTAGE',
  ALLOCATION_SUM_MISMATCH: 'ALLOCATION_SUM_MISMATCH',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_SPLIT: 'INVALID_SPLIT',
} as const;

export interface BudgetSyncError {
  operation: string;
  retryable: boolean;
  message: string;
  originalError?: Error;
}

export const SYNC_ERROR_TYPES = {
  NETWORK_UNAVAILABLE: { retryable: true, message: '網絡連接不可用 / Network unavailable' },
  API_PERMISSION_DENIED: { retryable: false, message: '權限被拒絕 / Permission denied' },
  API_TIMEOUT: { retryable: true, message: '請求超時 / Request timeout' },
  CONFLICT_DETECTED: { retryable: true, message: '檢測到衝突 / Conflict detected' },
  SERVER_ERROR: { retryable: true, message: '服務器錯誤 / Server error' },
} as const;

// ============================================================================
// Expense Filters
// ============================================================================

export interface ExpenseFilters {
  category?: BudgetCategory;
  startDate?: string;
  endDate?: string;
  isSettled?: boolean;
  paidBy?: string;
}

// ============================================================================
// Integration Types
// ============================================================================

// Link expense to itinerary item
export interface ItineraryExpenseLink {
  itineraryItemId: string;
  expenseId: string;
  linkType: 'planned' | 'actual';
}

// Link shopping item to expense
export interface ShoppingExpenseLink {
  shoppingItemId: string;
  expenseId: string;
  isPurchased: boolean;
}
