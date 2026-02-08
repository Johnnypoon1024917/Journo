// Expense/Budget types and interfaces

import { BudgetCategory } from './trip';

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
