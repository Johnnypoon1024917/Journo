// Budget Management Types

export type BudgetCategory = 'flights' | 'accommodation' | 'food' | 'transport' | 'activities' | 'shopping' | 'misc';
export type SplitType = 'equal' | 'custom';
export type SyncStatus = 'synced' | 'pending' | 'error';
export type LinkedItemType = 'reservation' | 'shopping' | 'itinerary';

export interface CategoryAllocation {
  category: BudgetCategory;
  percentage: number;
  allocatedAmount: number;
}

export interface BudgetConfig {
  id: string;
  tripId: string;
  totalBudget: number;
  homeCurrency: string;
  tripCurrency: string;
  categoryAllocations: CategoryAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomSplit {
  userId: string;
  amount: number;
}

export interface ExpenseEntry {
  id: string;
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
  isSettled: boolean;
  linkedItemId?: string;
  linkedItemType?: LinkedItemType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

// DTOs for API requests
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

export interface CreateExpenseDto {
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

export interface UpdateExpenseDto {
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

export interface BatchSyncExpenseDto {
  expenses: (CreateExpenseDto | (UpdateExpenseDto & { id: string }))[];
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors?: Array<{ id?: string; error: string }>;
}

// Database row types (snake_case from PostgreSQL)
export interface BudgetConfigRow {
  id: string;
  trip_id: string;
  total_budget: string;
  home_currency: string;
  trip_currency: string;
  category_allocations: any;
  created_at: Date;
  updated_at: Date;
}

export interface ExpenseRow {
  id: string;
  trip_id: string;
  amount: string;
  currency: string;
  category: string;
  date: Date;
  note?: string;
  paid_by?: string;
  split_with?: string[];
  split_type?: string;
  custom_splits?: any;
  is_settled: boolean;
  linked_item_id?: string;
  linked_item_type?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  sync_status: string;
}
