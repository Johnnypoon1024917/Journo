/**
 * Budget Store
 * 
 * Zustand store for managing budget configuration, expenses, and UI state
 * for the Budget page feature.
 * 
 * Requirements: 1.5, 2.5, 2.6, 7.1, 9.1
 */

import { create } from 'zustand';
import {
  BudgetConfig,
  ExpenseEntry,
  BudgetPageSummary,
  CategorySummary,
  FilterTab,
} from '../types/expense';
import { Trip, BudgetCategory } from '../types/trip';

// ============================================================================
// Store State Interface
// ============================================================================

interface BudgetStore {
  // ========== State ==========
  
  // Core data
  budgetConfig: BudgetConfig | null;
  expenses: ExpenseEntry[];
  currentTrip: Trip | null;
  
  // UI state
  filterTab: FilterTab;
  selectedCategory: BudgetCategory | null;
  isExpenseFormOpen: boolean;
  editingExpense: ExpenseEntry | null;
  
  // Sync state
  syncStatus: 'online' | 'offline' | 'syncing';
  isLoading: boolean;
  error: string | null;
  
  // ========== Computed Selectors ==========
  
  // Get budget summary with calculations
  getBudgetSummary: () => BudgetPageSummary | null;
  
  // Get category summaries with spending calculations
  getCategorySummaries: () => CategorySummary[];
  
  // Get filtered expenses based on current filter tab
  getFilteredExpenses: () => ExpenseEntry[];
  
  // ========== Actions ==========
  
  // Data loading
  loadBudgetData: (tripId: string) => Promise<void>;
  setCurrentTrip: (trip: Trip | null) => void;
  
  // Budget configuration
  updateBudgetConfig: (updates: Partial<BudgetConfig>) => Promise<void>;
  setBudgetConfig: (config: BudgetConfig | null) => void;
  
  // Expense management
  addExpense: (expense: Omit<ExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (expenseId: string, updates: Partial<ExpenseEntry>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  setExpenses: (expenses: ExpenseEntry[]) => void;
  
  // Filter and UI state
  setFilterTab: (tab: FilterTab) => void;
  setSelectedCategory: (category: BudgetCategory | null) => void;
  openExpenseForm: (expense?: ExpenseEntry) => void;
  closeExpenseForm: () => void;
  
  // Sync state
  setSyncStatus: (status: 'online' | 'offline' | 'syncing') => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

// Restore filter tab from localStorage (Validates: Requirements 7.7, 22)
const getInitialFilterTab = (): FilterTab => {
  try {
    const saved = localStorage.getItem('budget-filter-tab');
    if (saved && ['all', 'by-category', 'by-date', 'pending', 'settled'].includes(saved)) {
      return saved as FilterTab;
    }
  } catch (error) {
    console.error('Failed to restore filter tab:', error);
  }
  return 'all';
};

const initialState = {
  budgetConfig: null,
  expenses: [],
  currentTrip: null,
  filterTab: getInitialFilterTab(),
  selectedCategory: null,
  isExpenseFormOpen: false,
  editingExpense: null,
  syncStatus: 'online' as const,
  isLoading: false,
  error: null,
};

// ============================================================================
// Helper Functions for Calculations
// ============================================================================

/**
 * Calculate budget summary from config, expenses, and trip data
 */
function calculateBudgetSummary(
  config: BudgetConfig | null,
  expenses: ExpenseEntry[],
  trip: Trip | null
): BudgetPageSummary | null {
  if (!config || !trip) return null;
  
  // Calculate total spent (in home currency)
  const totalSpent = expenses.reduce((sum, expense) => {
    // For now, assume all expenses are in the same currency
    // TODO: Implement currency conversion in task 12
    return sum + expense.amount;
  }, 0);
  
  const remaining = config.totalBudget - totalSpent;
  const percentageSpent = config.totalBudget > 0 
    ? (totalSpent / config.totalBudget) * 100 
    : 0;
  
  // Determine status based on percentage spent
  let status: 'safe' | 'warning' | 'danger' | 'over' = 'safe';
  if (percentageSpent >= 100) {
    status = 'over';
  } else if (percentageSpent >= 90) {
    status = 'danger';
  } else if (percentageSpent >= 70) {
    status = 'warning';
  }
  
  // Calculate days elapsed and remaining
  const now = new Date();
  const startDate = trip.start_date ? new Date(trip.start_date) : now;
  const endDate = trip.end_date ? new Date(trip.end_date) : now;
  
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  
  // Calculate burn rate (average daily spending)
  const burnRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  
  // Calculate projected total based on burn rate
  const projectedTotal = burnRate * totalDays;
  
  return {
    totalBudget: config.totalBudget,
    totalSpent,
    remaining,
    percentageSpent,
    status,
    burnRate,
    projectedTotal,
    daysElapsed,
    daysRemaining,
  };
}

/**
 * Calculate category summaries from config and expenses
 */
function calculateCategorySummaries(
  config: BudgetConfig | null,
  expenses: ExpenseEntry[]
): CategorySummary[] {
  if (!config) return [];
  
  // Calculate spending by category
  const spendingByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = { total: 0, count: 0 };
    }
    acc[expense.category].total += expense.amount;
    acc[expense.category].count += 1;
    return acc;
  }, {} as Record<BudgetCategory, { total: number; count: number }>);
  
  // Create summaries for each category allocation
  return config.categoryAllocations.map(allocation => {
    const spent = spendingByCategory[allocation.category]?.total || 0;
    const expenseCount = spendingByCategory[allocation.category]?.count || 0;
    const remaining = allocation.allocatedAmount - spent;
    const percentageSpent = allocation.allocatedAmount > 0 
      ? (spent / allocation.allocatedAmount) * 100 
      : 0;
    
    // Determine status
    let status: 'safe' | 'warning' | 'danger' | 'over' = 'safe';
    if (percentageSpent >= 100) {
      status = 'over';
    } else if (percentageSpent >= 90) {
      status = 'danger';
    } else if (percentageSpent >= 70) {
      status = 'warning';
    }
    
    return {
      category: allocation.category,
      allocated: allocation.allocatedAmount,
      spent,
      remaining,
      percentageSpent,
      expenseCount,
      status,
    };
  });
}

/**
 * Filter expenses based on filter tab and selected category
 */
function filterExpenses(
  expenses: ExpenseEntry[],
  filterTab: FilterTab,
  selectedCategory: BudgetCategory | null
): ExpenseEntry[] {
  let filtered = [...expenses];
  
  // Apply filter tab
  switch (filterTab) {
    case 'pending':
      filtered = filtered.filter(e => e.splitWith && e.splitWith.length > 0 && !e.isSettled);
      break;
    case 'settled':
      filtered = filtered.filter(e => e.isSettled);
      break;
    case 'by-category':
      if (selectedCategory) {
        filtered = filtered.filter(e => e.category === selectedCategory);
      }
      break;
    case 'by-date':
      // Sort by date (already sorted below)
      break;
    case 'all':
    default:
      // No additional filtering
      break;
  }
  
  // Sort by date (most recent first)
  filtered.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
  
  return filtered;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  // Initial state
  ...initialState,
  
  // ========== Computed Selectors ==========
  
  getBudgetSummary: () => {
    const { budgetConfig, expenses, currentTrip } = get();
    return calculateBudgetSummary(budgetConfig, expenses, currentTrip);
  },
  
  getCategorySummaries: () => {
    const { budgetConfig, expenses } = get();
    return calculateCategorySummaries(budgetConfig, expenses);
  },
  
  getFilteredExpenses: () => {
    const { expenses, filterTab, selectedCategory } = get();
    return filterExpenses(expenses, filterTab, selectedCategory);
  },
  
  // ========== Actions ==========
  
  // Data loading
  loadBudgetData: async (tripId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // TODO: Implement actual API calls in task 4
      // For now, this is a placeholder that will be implemented with budgetService
      
      // Placeholder: Load from API
      // const config = await budgetService.getBudgetConfig(tripId);
      // const expenses = await budgetService.getExpenses(tripId);
      
      // set({ budgetConfig: config, expenses, isLoading: false });
      
      // Temporary: Set loading to false
      set({ isLoading: false });
      
      console.log('loadBudgetData called for tripId:', tripId);
      console.log('TODO: Implement API calls in task 4');
    } catch (error) {
      console.error('Failed to load budget data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load budget data',
        isLoading: false 
      });
    }
  },
  
  setCurrentTrip: (trip: Trip | null) => {
    set({ currentTrip: trip });
  },
  
  // Budget configuration
  updateBudgetConfig: async (updates: Partial<BudgetConfig>) => {
    const { budgetConfig } = get();
    if (!budgetConfig) {
      console.error('Cannot update budget config: no config loaded');
      return;
    }
    
    set({ syncStatus: 'syncing' });
    
    try {
      // Optimistic update
      const updatedConfig = { ...budgetConfig, ...updates, updatedAt: new Date().toISOString() };
      set({ budgetConfig: updatedConfig });
      
      // TODO: Implement actual API call in task 4
      // await budgetService.updateBudgetConfig(budgetConfig.id, updates);
      
      // TODO: Implement local storage sync in task 5
      // await offlineStorage.saveBudgetConfig(updatedConfig);
      
      set({ syncStatus: 'online' });
      
      console.log('updateBudgetConfig called with updates:', updates);
      console.log('TODO: Implement API call and local storage sync in tasks 4 and 5');
    } catch (error) {
      console.error('Failed to update budget config:', error);
      // Revert optimistic update
      set({ budgetConfig, syncStatus: 'offline' });
      throw error;
    }
  },
  
  setBudgetConfig: (config: BudgetConfig | null) => {
    set({ budgetConfig: config });
  },
  
  // Expense management
  addExpense: async (expenseData: Omit<ExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ syncStatus: 'syncing' });
    
    try {
      // Import budgetService dynamically to avoid circular dependency
      const { budgetService } = await import('../services/budgetService');
      
      // Create temporary expense with generated ID for optimistic update
      const tempExpense: ExpenseEntry = {
        ...expenseData,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };
      
      // Optimistic update
      const { expenses } = get();
      set({ expenses: [...expenses, tempExpense] });
      
      // Call API to create expense
      const savedExpense = await budgetService.createExpense(expenseData);
      
      // Replace temp expense with saved expense
      const updatedExpenses = expenses.map(e => 
        e.id === tempExpense.id ? savedExpense : e
      );
      set({ expenses: updatedExpenses, syncStatus: 'online' });
      
      console.log('Expense created successfully:', savedExpense);
    } catch (error) {
      console.error('Failed to add expense:', error);
      // Revert optimistic update on error
      const { expenses } = get();
      set({ 
        expenses: expenses.filter(e => !e.id.startsWith('temp-')),
        syncStatus: 'offline' 
      });
      throw error;
    }
  },
  
  updateExpense: async (expenseId: string, updates: Partial<ExpenseEntry>) => {
    const { expenses } = get();
    const expense = expenses.find(e => e.id === expenseId);
    
    if (!expense) {
      console.error('Cannot update expense: expense not found');
      return;
    }
    
    set({ syncStatus: 'syncing' });
    
    try {
      // Import budgetService dynamically to avoid circular dependency
      const { budgetService } = await import('../services/budgetService');
      
      // Optimistic update
      const updatedExpense = { ...expense, ...updates, updatedAt: new Date().toISOString() };
      const updatedExpenses = expenses.map(e => e.id === expenseId ? updatedExpense : e);
      set({ expenses: updatedExpenses });
      
      // Call API to update expense
      const savedExpense = await budgetService.updateExpense(expense.tripId, expenseId, updates);
      
      // Update with server response
      const finalExpenses = expenses.map(e => e.id === expenseId ? savedExpense : e);
      set({ expenses: finalExpenses, syncStatus: 'online' });
      
      console.log('Expense updated successfully:', savedExpense);
    } catch (error) {
      console.error('Failed to update expense:', error);
      // Revert optimistic update
      set({ expenses, syncStatus: 'offline' });
      throw error;
    }
  },
  
  deleteExpense: async (expenseId: string) => {
    const { expenses } = get();
    const expense = expenses.find(e => e.id === expenseId);
    
    if (!expense) {
      console.error('Cannot delete expense: expense not found');
      return;
    }
    
    set({ syncStatus: 'syncing' });
    
    try {
      // Import budgetService dynamically to avoid circular dependency
      const { budgetService } = await import('../services/budgetService');
      
      // Optimistic update
      const updatedExpenses = expenses.filter(e => e.id !== expenseId);
      set({ expenses: updatedExpenses });
      
      // Call API to delete expense
      await budgetService.deleteExpense(expense.tripId, expenseId);
      
      set({ syncStatus: 'online' });
      
      console.log('Expense deleted successfully');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      // Revert optimistic update
      set({ expenses, syncStatus: 'offline' });
      throw error;
    }
  },
  
  setExpenses: (expenses: ExpenseEntry[]) => {
    set({ expenses });
  },
  
  // Filter and UI state
  setFilterTab: (tab: FilterTab) => {
    set({ filterTab: tab });
    // Persist to localStorage (Validates: Requirements 7.7, 22)
    try {
      localStorage.setItem('budget-filter-tab', tab);
    } catch (error) {
      console.error('Failed to persist filter tab:', error);
    }
  },
  
  setSelectedCategory: (category: BudgetCategory | null) => {
    set({ selectedCategory: category });
  },
  
  openExpenseForm: (expense?: ExpenseEntry) => {
    set({ 
      isExpenseFormOpen: true,
      editingExpense: expense || null,
    });
  },
  
  closeExpenseForm: () => {
    set({ 
      isExpenseFormOpen: false,
      editingExpense: null,
    });
  },
  
  // Sync state
  setSyncStatus: (status: 'online' | 'offline' | 'syncing') => {
    set({ syncStatus: status });
  },
  
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  // Reset
  reset: () => {
    set(initialState);
  },
}));

export default useBudgetStore;
