/**
 * Budget Store Tests
 * 
 * Unit tests for the Budget Store Zustand store.
 * Tests state management, actions, computed selectors, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBudgetStore } from '../budgetStore';
import {
  BudgetConfig,
  ExpenseEntry,
  CategoryAllocation,
} from '../../types/expense';
import { Trip } from '../../types/trip';

describe('Budget Store', () => {
  // Sample test data
  const mockTrip: Trip = {
    id: 'trip-123',
    title: 'Tokyo Adventure',
    destination: 'Tokyo, Japan',
    start_date: '2024-03-01',
    end_date: '2024-03-07',
    cover_image_url: null,
    theme: 'adventure',
    owner_id: 'user-1',
    is_public: false,
    is_community: false,
    share_token: 'abc123',
    total_budget: 10000,
    currency_code: 'HKD',
    weather_data: null,
    likes_count: 0,
    views_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockCategoryAllocations: CategoryAllocation[] = [
    { category: 'flights', percentage: 30, allocatedAmount: 3000 },
    { category: 'accommodation', percentage: 25, allocatedAmount: 2500 },
    { category: 'food', percentage: 15, allocatedAmount: 1500 },
    { category: 'transport', percentage: 10, allocatedAmount: 1000 },
    { category: 'activities', percentage: 10, allocatedAmount: 1000 },
    { category: 'shopping', percentage: 5, allocatedAmount: 500 },
    { category: 'misc', percentage: 5, allocatedAmount: 500 },
  ];

  const mockBudgetConfig: BudgetConfig = {
    id: 'config-1',
    tripId: 'trip-123',
    totalBudget: 10000,
    homeCurrency: 'HKD',
    tripCurrency: 'JPY',
    categoryAllocations: mockCategoryAllocations,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockExpense1: ExpenseEntry = {
    id: 'expense-1',
    tripId: 'trip-123',
    amount: 500,
    currency: 'JPY',
    category: 'food',
    date: '2024-03-02',
    note: 'Lunch at ramen shop',
    createdBy: 'user-1',
    isSettled: false,
    createdAt: '2024-03-02T12:00:00Z',
    updatedAt: '2024-03-02T12:00:00Z',
    syncStatus: 'synced',
  };

  const mockExpense2: ExpenseEntry = {
    id: 'expense-2',
    tripId: 'trip-123',
    amount: 2000,
    currency: 'JPY',
    category: 'accommodation',
    date: '2024-03-01',
    note: 'Hotel night 1',
    paidBy: 'user-1',
    splitWith: ['user-1', 'user-2'],
    splitType: 'equal',
    createdBy: 'user-1',
    isSettled: false,
    createdAt: '2024-03-01T20:00:00Z',
    updatedAt: '2024-03-01T20:00:00Z',
    syncStatus: 'synced',
  };

  beforeEach(() => {
    // Reset store state before each test
    useBudgetStore.getState().reset();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useBudgetStore.getState();

      expect(state.budgetConfig).toBeNull();
      expect(state.expenses).toEqual([]);
      expect(state.currentTrip).toBeNull();
      expect(state.filterTab).toBe('all');
      expect(state.selectedCategory).toBeNull();
      expect(state.isExpenseFormOpen).toBe(false);
      expect(state.editingExpense).toBeNull();
      expect(state.syncStatus).toBe('online');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('State Setters', () => {
    it('should set budget config', () => {
      const { setBudgetConfig } = useBudgetStore.getState();
      
      setBudgetConfig(mockBudgetConfig);
      
      const state = useBudgetStore.getState();
      expect(state.budgetConfig).toEqual(mockBudgetConfig);
    });

    it('should set expenses', () => {
      const { setExpenses } = useBudgetStore.getState();
      
      setExpenses([mockExpense1, mockExpense2]);
      
      const state = useBudgetStore.getState();
      expect(state.expenses).toHaveLength(2);
      expect(state.expenses).toContain(mockExpense1);
      expect(state.expenses).toContain(mockExpense2);
    });

    it('should set current trip', () => {
      const { setCurrentTrip } = useBudgetStore.getState();
      
      setCurrentTrip(mockTrip);
      
      const state = useBudgetStore.getState();
      expect(state.currentTrip).toEqual(mockTrip);
    });

    it('should set filter tab', () => {
      const { setFilterTab } = useBudgetStore.getState();
      
      setFilterTab('by-category');
      
      const state = useBudgetStore.getState();
      expect(state.filterTab).toBe('by-category');
    });

    it('should set selected category', () => {
      const { setSelectedCategory } = useBudgetStore.getState();
      
      setSelectedCategory('food');
      
      const state = useBudgetStore.getState();
      expect(state.selectedCategory).toBe('food');
    });

    it('should set sync status', () => {
      const { setSyncStatus } = useBudgetStore.getState();
      
      setSyncStatus('syncing');
      
      const state = useBudgetStore.getState();
      expect(state.syncStatus).toBe('syncing');
    });

    it('should set loading state', () => {
      const { setLoading } = useBudgetStore.getState();
      
      setLoading(true);
      
      const state = useBudgetStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set error', () => {
      const { setError } = useBudgetStore.getState();
      
      setError('Test error');
      
      const state = useBudgetStore.getState();
      expect(state.error).toBe('Test error');
    });
  });

  describe('Expense Form UI State', () => {
    it('should open expense form without editing expense', () => {
      const { openExpenseForm } = useBudgetStore.getState();
      
      openExpenseForm();
      
      const state = useBudgetStore.getState();
      expect(state.isExpenseFormOpen).toBe(true);
      expect(state.editingExpense).toBeNull();
    });

    it('should open expense form with editing expense', () => {
      const { openExpenseForm } = useBudgetStore.getState();
      
      openExpenseForm(mockExpense1);
      
      const state = useBudgetStore.getState();
      expect(state.isExpenseFormOpen).toBe(true);
      expect(state.editingExpense).toEqual(mockExpense1);
    });

    it('should close expense form and clear editing expense', () => {
      const { openExpenseForm, closeExpenseForm } = useBudgetStore.getState();
      
      // First open with an expense
      openExpenseForm(mockExpense1);
      expect(useBudgetStore.getState().isExpenseFormOpen).toBe(true);
      
      // Then close
      closeExpenseForm();
      
      const state = useBudgetStore.getState();
      expect(state.isExpenseFormOpen).toBe(false);
      expect(state.editingExpense).toBeNull();
    });
  });

  describe('Computed Selectors', () => {
    describe('getBudgetSummary', () => {
      it('should return null when no budget config', () => {
        const { getBudgetSummary } = useBudgetStore.getState();
        
        const summary = getBudgetSummary();
        
        expect(summary).toBeNull();
      });

      it('should return null when no trip', () => {
        const { setBudgetConfig, getBudgetSummary } = useBudgetStore.getState();
        
        setBudgetConfig(mockBudgetConfig);
        const summary = getBudgetSummary();
        
        expect(summary).toBeNull();
      });

      it('should calculate budget summary correctly', () => {
        const { setBudgetConfig, setExpenses, setCurrentTrip, getBudgetSummary } = useBudgetStore.getState();
        
        setBudgetConfig(mockBudgetConfig);
        setExpenses([mockExpense1, mockExpense2]);
        setCurrentTrip(mockTrip);
        
        const summary = getBudgetSummary();
        
        expect(summary).not.toBeNull();
        expect(summary?.totalBudget).toBe(10000);
        expect(summary?.totalSpent).toBe(2500); // 500 + 2000
        expect(summary?.remaining).toBe(7500);
        expect(summary?.percentageSpent).toBe(25);
        expect(summary?.status).toBe('safe');
      });

      it('should set status to warning when spent >= 70%', () => {
        const { setBudgetConfig, setExpenses, setCurrentTrip, getBudgetSummary } = useBudgetStore.getState();
        
        const expenseOver70: ExpenseEntry = {
          ...mockExpense1,
          id: 'expense-3',
          amount: 7000,
        };
        
        setBudgetConfig(mockBudgetConfig);
        setExpenses([expenseOver70]);
        setCurrentTrip(mockTrip);
        
        const summary = getBudgetSummary();
        
        expect(summary?.status).toBe('warning');
      });

      it('should set status to danger when spent >= 90%', () => {
        const { setBudgetConfig, setExpenses, setCurrentTrip, getBudgetSummary } = useBudgetStore.getState();
        
        const expenseOver90: ExpenseEntry = {
          ...mockExpense1,
          id: 'expense-3',
          amount: 9000,
        };
        
        setBudgetConfig(mockBudgetConfig);
        setExpenses([expenseOver90]);
        setCurrentTrip(mockTrip);
        
        const summary = getBudgetSummary();
        
        expect(summary?.status).toBe('danger');
      });

      it('should set status to over when spent >= 100%', () => {
        const { setBudgetConfig, setExpenses, setCurrentTrip, getBudgetSummary } = useBudgetStore.getState();
        
        const expenseOver100: ExpenseEntry = {
          ...mockExpense1,
          id: 'expense-3',
          amount: 10500,
        };
        
        setBudgetConfig(mockBudgetConfig);
        setExpenses([expenseOver100]);
        setCurrentTrip(mockTrip);
        
        const summary = getBudgetSummary();
        
        expect(summary?.status).toBe('over');
      });
    });

    describe('getCategorySummaries', () => {
      it('should return empty array when no budget config', () => {
        const { getCategorySummaries } = useBudgetStore.getState();
        
        const summaries = getCategorySummaries();
        
        expect(summaries).toEqual([]);
      });

      it('should calculate category summaries correctly', () => {
        const { setBudgetConfig, setExpenses, getCategorySummaries } = useBudgetStore.getState();
        
        setBudgetConfig(mockBudgetConfig);
        setExpenses([mockExpense1, mockExpense2]);
        
        const summaries = getCategorySummaries();
        
        expect(summaries).toHaveLength(7);
        
        // Check food category
        const foodSummary = summaries.find(s => s.category === 'food');
        expect(foodSummary).toBeDefined();
        expect(foodSummary?.allocated).toBe(1500);
        expect(foodSummary?.spent).toBe(500);
        expect(foodSummary?.remaining).toBe(1000);
        expect(foodSummary?.expenseCount).toBe(1);
        expect(foodSummary?.status).toBe('safe');
        
        // Check accommodation category
        const accommodationSummary = summaries.find(s => s.category === 'accommodation');
        expect(accommodationSummary).toBeDefined();
        expect(accommodationSummary?.allocated).toBe(2500);
        expect(accommodationSummary?.spent).toBe(2000);
        expect(accommodationSummary?.remaining).toBe(500);
        expect(accommodationSummary?.expenseCount).toBe(1);
      });

      it('should set category status to over when spent >= 100%', () => {
        const { setBudgetConfig, setExpenses, getCategorySummaries } = useBudgetStore.getState();
        
        const expenseOverBudget: ExpenseEntry = {
          ...mockExpense1,
          amount: 1600, // Over the 1500 allocated for food
        };
        
        setBudgetConfig(mockBudgetConfig);
        setExpenses([expenseOverBudget]);
        
        const summaries = getCategorySummaries();
        const foodSummary = summaries.find(s => s.category === 'food');
        
        expect(foodSummary?.status).toBe('over');
      });
    });

    describe('getFilteredExpenses', () => {
      beforeEach(() => {
        const { setExpenses } = useBudgetStore.getState();
        setExpenses([mockExpense1, mockExpense2]);
      });

      it('should return all expenses when filter is "all"', () => {
        const { setFilterTab, getFilteredExpenses } = useBudgetStore.getState();
        
        setFilterTab('all');
        const filtered = getFilteredExpenses();
        
        expect(filtered).toHaveLength(2);
      });

      it('should filter pending expenses', () => {
        const { setFilterTab, getFilteredExpenses } = useBudgetStore.getState();
        
        setFilterTab('pending');
        const filtered = getFilteredExpenses();
        
        // Only mockExpense2 has splitWith and is not settled
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('expense-2');
      });

      it('should filter settled expenses', () => {
        const { setExpenses, setFilterTab, getFilteredExpenses } = useBudgetStore.getState();
        
        const settledExpense: ExpenseEntry = {
          ...mockExpense2,
          isSettled: true,
        };
        
        setExpenses([mockExpense1, settledExpense]);
        setFilterTab('settled');
        const filtered = getFilteredExpenses();
        
        expect(filtered).toHaveLength(1);
        expect(filtered[0].isSettled).toBe(true);
      });

      it('should filter by category', () => {
        const { setFilterTab, setSelectedCategory, getFilteredExpenses } = useBudgetStore.getState();
        
        setFilterTab('by-category');
        setSelectedCategory('food');
        const filtered = getFilteredExpenses();
        
        expect(filtered).toHaveLength(1);
        expect(filtered[0].category).toBe('food');
      });

      it('should sort expenses by date (most recent first)', () => {
        const { getFilteredExpenses } = useBudgetStore.getState();
        
        const filtered = getFilteredExpenses();
        
        // mockExpense1 is from 2024-03-02, mockExpense2 is from 2024-03-01
        expect(filtered[0].id).toBe('expense-1'); // More recent
        expect(filtered[1].id).toBe('expense-2'); // Older
      });
    });
  });

  describe('Reset', () => {
    it('should reset store to initial state', () => {
      const { setBudgetConfig, setExpenses, setFilterTab, reset } = useBudgetStore.getState();
      
      // Set some state
      setBudgetConfig(mockBudgetConfig);
      setExpenses([mockExpense1]);
      setFilterTab('by-category');
      
      // Reset
      reset();
      
      const state = useBudgetStore.getState();
      expect(state.budgetConfig).toBeNull();
      expect(state.expenses).toEqual([]);
      expect(state.filterTab).toBe('all');
    });
  });
});
