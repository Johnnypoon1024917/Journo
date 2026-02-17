import { Trip, Place, BudgetCategory } from '../types/trip';
import { currencyService } from './currencyService';
import api from './api';
import { getAuthToken } from '../utils/auth';
import {
  BudgetConfig,
  ExpenseEntry,
  BudgetPageSummary,
  CategorySummary,
  MemberBalance,
  Settlement,
  CreateBudgetConfigDto,
  UpdateBudgetConfigDto,
  CreateExpenseEntryDto,
  UpdateExpenseEntryDto,
  TripMember,
} from '../types/expense';

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageSpent: number;
  currency: string;
  dailyBudget: number;
  daysCount: number;
  status: 'ok' | 'warning' | 'danger';
}

export interface CategorySpending {
  category: BudgetCategory;
  amount: number;
  percentage: number;
  count: number;
}

export interface DailySpending {
  dayNumber: number;
  date: string;
  spent: number;
  budget: number;
  places: number;
}

class BudgetService {
  /**
   * Create budget entries from Quick Plan suggestions
   */
  async createBudgetEntriesFromSuggestions(
    suggestions: Array<{
      places: Array<{
        name: string;
        estimatedCost: number;
        placeType: string;
      }>;
    }>,
    tripCurrency: string
  ): Promise<Array<{ category: string; amount: number; currency: string }>> {
    const categoryTotals: { [key: string]: number } = {};
    
    // Group places by budget category
    for (const day of suggestions) {
      for (const place of day.places) {
        const category = this.mapPlaceTypeToBudgetCategory(place.placeType);
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += place.estimatedCost;
      }
    }
    
    // Convert to budget entries
    return Object.entries(categoryTotals)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        currency: tripCurrency
      }));
  }

  /**
   * Map place type to budget category
   */
  mapPlaceTypeToBudgetCategory(placeType: string): BudgetCategory {
    const categoryMap: { [key: string]: BudgetCategory } = {
      'food': 'food',
      'restaurant': 'food',
      'cafe': 'food',
      'hotel': 'accommodation',
      'accommodation': 'accommodation',
      'lodging': 'accommodation',
      'attraction': 'activities',
      'museum': 'activities',
      'park': 'activities',
      'entertainment': 'activities',
      'transport': 'transport',
      'transportation': 'transport',
      'shopping': 'shopping',
      'market': 'shopping',
      'mall': 'shopping',
      'other': 'misc'
    };
    
    const lowerType = placeType.toLowerCase();
    return categoryMap[lowerType] || 'misc';
  }

  /**
   * Convert budget entries to different currency
   */
  async convertBudgetEntriesToCurrency(
    entries: Array<{ category: string; amount: number; currency: string }>,
    targetCurrency: string
  ): Promise<Array<{ category: string; amount: number; currency: string }>> {
    if (!entries.length) return entries;
    
    const conversions = entries.map(entry => ({
      amount: entry.amount,
      from: entry.currency,
      to: targetCurrency
    }));
    
    try {
      const convertedAmounts = await currencyService.convertMultiple(conversions);
      
      return entries.map((entry, index) => ({
        ...entry,
        amount: Math.round(convertedAmounts[index].amount * 100) / 100,
        currency: targetCurrency
      }));
    } catch (error) {
      console.error('Error converting budget entries:', error);
      return entries; // Return original if conversion fails
    }
  }

  /**
   * Validate budget consistency between suggestions and final trip
   */
  validateBudgetConsistency(
    originalBudget: number,
    actualCosts: Array<{ amount: number }>,
    tolerance: number = 0.2
  ): {
    isConsistent: boolean;
    variance: number;
    recommendation?: string;
  } {
    const totalActualCost = actualCosts.reduce((sum, entry) => sum + entry.amount, 0);
    const variance = Math.abs(totalActualCost - originalBudget) / originalBudget;
    
    const isConsistent = variance <= tolerance;
    
    let recommendation: string | undefined;
    if (!isConsistent) {
      if (totalActualCost > originalBudget) {
        recommendation = `Actual costs are ${Math.round(variance * 100)}% higher than estimated. Consider adjusting budget or reducing expenses.`;
      } else {
        recommendation = `Actual costs are ${Math.round(variance * 100)}% lower than estimated. You may have room for additional activities.`;
      }
    }
    
    return {
      isConsistent,
      variance,
      recommendation
    };
  }

  /**
   * Calculate budget summary for a trip
   */
  async calculateBudgetSummary(
    trip: Trip,
    places: Place[]
  ): Promise<BudgetSummary> {
    const totalBudget = trip.total_budget || 0;
    const currency = trip.currency_code || 'USD';

    // Calculate total spent by converting all place costs to trip currency
    let totalSpent = 0;
    for (const place of places) {
      if (place.cost) {
        const placeCurrency = place.cost_currency || 'USD';
        if (placeCurrency === currency) {
          totalSpent += place.cost;
        } else {
          const converted = await currencyService.convertCurrency(
            place.cost,
            placeCurrency,
            currency
          );
          totalSpent += converted.amount;
        }
      }
    }

    const remaining = totalBudget - totalSpent;
    const percentageSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Calculate days count
    let daysCount = 1;
    if (trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      daysCount = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
    }

    const dailyBudget = totalBudget / daysCount;

    // Determine status
    let status: 'ok' | 'warning' | 'danger' = 'ok';
    if (percentageSpent >= 100) {
      status = 'danger';
    } else if (percentageSpent >= 80) {
      status = 'warning';
    }

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentageSpent,
      currency,
      dailyBudget,
      daysCount,
      status,
    };
  }

  /**
   * Calculate spending by category
   */
  async calculateCategorySpending(
    trip: Trip,
    places: Place[]
  ): Promise<CategorySpending[]> {
    const currency = trip.currency_code || 'USD';
    const categoryTotals: Record<BudgetCategory, { amount: number; count: number }> = {
      accommodation: { amount: 0, count: 0 },
      food: { amount: 0, count: 0 },
      transport: { amount: 0, count: 0 },
      activities: { amount: 0, count: 0 },
      shopping: { amount: 0, count: 0 },
      misc: { amount: 0, count: 0 },
    };

    // Sum up costs by category
    for (const place of places) {
      if (place.cost && place.budget_category) {
        const placeCurrency = place.cost_currency || 'USD';
        let amount = place.cost;

        // Convert to trip currency if needed
        if (placeCurrency !== currency) {
          const converted = await currencyService.convertCurrency(
            place.cost,
            placeCurrency,
            currency
          );
          amount = converted.amount;
        }

        categoryTotals[place.budget_category].amount += amount;
        categoryTotals[place.budget_category].count += 1;
      }
    }

    // Calculate total for percentages
    const total = Object.values(categoryTotals).reduce(
      (sum, cat) => sum + cat.amount,
      0
    );

    // Convert to array with percentages
    const categories: CategorySpending[] = (
      Object.entries(categoryTotals) as [BudgetCategory, { amount: number; count: number }][]
    ).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      count: data.count,
    }));

    // Sort by amount descending
    return categories.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate daily spending
   */
  async calculateDailySpending(
    trip: Trip,
    days: Array<{ id: string; day_number: number; date: string | null }>,
    places: Place[]
  ): Promise<DailySpending[]> {
    const currency = trip.currency_code || 'USD';
    const summary = await this.calculateBudgetSummary(trip, places);

    // Group places by day
    const placesByDay: Record<string, Place[]> = {};
    places.forEach((place) => {
      if (!placesByDay[place.trip_day_id]) {
        placesByDay[place.trip_day_id] = [];
      }
      placesByDay[place.trip_day_id].push(place);
    });

    // Calculate spending for each day
    const dailySpending: DailySpending[] = [];

    for (const day of days) {
      const dayPlaces = placesByDay[day.id] || [];
      let daySpent = 0;

      for (const place of dayPlaces) {
        if (place.cost) {
          const placeCurrency = place.cost_currency || 'USD';
          if (placeCurrency === currency) {
            daySpent += place.cost;
          } else {
            const converted = await currencyService.convertCurrency(
              place.cost,
              placeCurrency,
              currency
            );
            daySpent += converted.amount;
          }
        }
      }

      dailySpending.push({
        dayNumber: day.day_number,
        date: day.date || '',
        spent: daySpent,
        budget: summary.dailyBudget,
        places: dayPlaces.length,
      });
    }

    return dailySpending;
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // ============================================================================
  // Budget Configuration Methods (Budget Page)
  // ============================================================================

  /**
   * Get budget configuration for a trip
   * Validates: Requirements 1.1, 1.5
   */
  async getBudgetConfig(tripId: string): Promise<BudgetConfig | null> {
    try {
      const token = getAuthToken();
      const response = await api.get<{ config: BudgetConfig }>(
        `/budget/config/${tripId}`,
        { token: token || undefined }
      );
      return response.config;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // No budget config exists yet
      }
      console.error('Error fetching budget config:', error);
      throw error;
    }
  }

  /**
   * Create budget configuration for a trip
   * Validates: Requirements 1.1, 1.2, 1.4, 1.5
   */
  async createBudgetConfig(dto: CreateBudgetConfigDto): Promise<BudgetConfig> {
    try {
      const token = getAuthToken();
      const response = await api.post<{ config: BudgetConfig }>(
        `/budget/config`,
        dto,
        { token: token || undefined }
      );
      return response.config;
    } catch (error) {
      console.error('Error creating budget config:', error);
      throw error;
    }
  }

  /**
   * Update budget configuration
   * Validates: Requirements 1.1, 1.4, 1.5
   */
  async updateBudgetConfig(
    tripId: string,
    configId: string,
    updates: UpdateBudgetConfigDto
  ): Promise<BudgetConfig> {
    try {
      const token = getAuthToken();
      const response = await api.put<{ config: BudgetConfig }>(
        `/budget/config/${configId}`,
        updates,
        { token: token || undefined }
      );
      return response.config;
    } catch (error) {
      console.error('Error updating budget config:', error);
      throw error;
    }
  }

  // ============================================================================
  // Expense Management Methods (Budget Page)
  // ============================================================================

  /**
   * Get all expenses for a trip
   * Validates: Requirements 2.1, 2.6
   */
  async getExpenses(tripId: string): Promise<ExpenseEntry[]> {
    try {
      const token = getAuthToken();
      const response = await api.get<{ expenses: ExpenseEntry[] }>(
        `/budget/expenses/${tripId}`,
        { token: token || undefined }
      );
      return response.expenses;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  /**
   * Create a new expense entry
   * Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6
   */
  async createExpense(dto: CreateExpenseEntryDto): Promise<ExpenseEntry> {
    try {
      const token = getAuthToken();
      const response = await api.post<{ expense: ExpenseEntry }>(
        `/budget/expenses`,
        dto,
        { token: token || undefined }
      );
      return response.expense;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Update an existing expense entry
   * Validates: Requirements 2.5, 2.6, 2.8
   */
  async updateExpense(
    tripId: string,
    expenseId: string,
    updates: UpdateExpenseEntryDto
  ): Promise<ExpenseEntry> {
    try {
      const token = getAuthToken();
      const response = await api.put<{ expense: ExpenseEntry }>(
        `/budget/expenses/${expenseId}`,
        updates,
        { token: token || undefined }
      );
      return response.expense;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  /**
   * Delete an expense entry
   * Validates: Requirements 2.8, 2.9
   */
  async deleteExpense(tripId: string, expenseId: string): Promise<void> {
    try {
      const token = getAuthToken();
      await api.delete<{ message: string }>(
        `/budget/expenses/${expenseId}`,
        { token: token || undefined }
      );
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // ============================================================================
  // Calculation Methods (Budget Page)
  // ============================================================================

  /**
   * Calculate budget summary with burn rate
   * Validates: Requirements 1.1, 4.6, 5.1
   */
  calculateBudgetPageSummary(
    config: BudgetConfig,
    expenses: ExpenseEntry[],
    trip: Trip
  ): BudgetPageSummary {
    const totalBudget = config.totalBudget;
    
    // Calculate total spent in home currency
    let totalSpent = 0;
    for (const expense of expenses) {
      // Convert expense to home currency if needed
      if (expense.currency === config.homeCurrency) {
        totalSpent += expense.amount;
      } else {
        // For now, use 1:1 conversion - will be enhanced with real exchange rates
        totalSpent += expense.amount;
      }
    }

    const remaining = totalBudget - totalSpent;
    const percentageSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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
    let daysElapsed = 1;
    let daysRemaining = 0;
    
    if (trip.start_date && trip.end_date) {
      const now = new Date();
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      
      // Calculate days elapsed (from start to now, or to end if trip is over)
      const currentDate = now > endDate ? endDate : now;
      if (currentDate >= startDate) {
        daysElapsed = Math.max(
          1,
          Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        );
      }
      
      // Calculate days remaining (from now to end, or 0 if trip is over)
      if (now < endDate) {
        daysRemaining = Math.max(
          0,
          Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
      }
    }

    // Calculate burn rate (average daily spending)
    const burnRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;

    // Calculate projected total based on burn rate
    const totalDays = daysElapsed + daysRemaining;
    const projectedTotal = totalDays > 0 ? burnRate * totalDays : totalSpent;

    return {
      totalBudget,
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
   * Calculate category summaries with allocation tracking
   * Validates: Requirements 1.4, 5.1, 5.2
   */
  calculateCategorySummaries(
    config: BudgetConfig,
    expenses: ExpenseEntry[]
  ): CategorySummary[] {
    const summaries: CategorySummary[] = [];

    // Process each category allocation
    for (const allocation of config.categoryAllocations) {
      const allocated = allocation.allocatedAmount;
      
      // Sum expenses for this category
      let spent = 0;
      let expenseCount = 0;
      
      for (const expense of expenses) {
        if (expense.category === allocation.category) {
          // Convert to home currency if needed
          if (expense.currency === config.homeCurrency) {
            spent += expense.amount;
          } else {
            // For now, use 1:1 conversion - will be enhanced with real exchange rates
            spent += expense.amount;
          }
          expenseCount++;
        }
      }

      const remaining = allocated - spent;
      const percentageSpent = allocated > 0 ? (spent / allocated) * 100 : 0;

      // Determine status
      let status: 'safe' | 'warning' | 'danger' | 'over' = 'safe';
      if (percentageSpent >= 100) {
        status = 'over';
      } else if (percentageSpent >= 90) {
        status = 'danger';
      } else if (percentageSpent >= 70) {
        status = 'warning';
      }

      summaries.push({
        category: allocation.category,
        allocated,
        spent,
        remaining,
        percentageSpent,
        expenseCount,
        status,
      });
    }

    return summaries;
  }

  /**
   * Calculate member balances for group expense splitting
   * Validates: Requirements 6.4, 6.5
   */
  calculateMemberBalances(
    expenses: ExpenseEntry[],
    members: TripMember[]
  ): MemberBalance[] {
    const balances: Map<string, MemberBalance> = new Map();

    // Initialize balances for all members
    for (const member of members) {
      balances.set(member.id, {
        userId: member.id,
        userName: member.name,
        avatarUrl: member.avatarUrl,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      });
    }

    // Process each expense
    for (const expense of expenses) {
      // Skip if not a split expense or already settled
      if (!expense.paidBy || !expense.splitWith || expense.isSettled) {
        continue;
      }

      const paidByBalance = balances.get(expense.paidBy);
      if (!paidByBalance) continue;

      // Add to total paid
      paidByBalance.totalPaid += expense.amount;

      // Calculate split amounts
      if (expense.splitType === 'equal') {
        // Equal split among all members
        const splitAmount = expense.amount / expense.splitWith.length;
        
        for (const memberId of expense.splitWith) {
          const memberBalance = balances.get(memberId);
          if (memberBalance) {
            memberBalance.totalOwed += splitAmount;
          }
        }
      } else if (expense.splitType === 'custom' && expense.customSplits) {
        // Custom split amounts
        for (const split of expense.customSplits) {
          const memberBalance = balances.get(split.userId);
          if (memberBalance) {
            memberBalance.totalOwed += split.amount;
          }
        }
      }
    }

    // Calculate net balances
    for (const balance of balances.values()) {
      balance.netBalance = balance.totalPaid - balance.totalOwed;
    }

    return Array.from(balances.values());
  }

  /**
   * Calculate settlements using balance minimization algorithm
   * Validates: Requirements 6.4, 6.5, 6.7
   */
  calculateSettlements(balances: MemberBalance[]): Settlement[] {
    const settlements: Settlement[] = [];

    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = balances
      .filter(b => b.netBalance > 0.01) // Use small threshold for floating point
      .map(b => ({ userId: b.userId, amount: b.netBalance }))
      .sort((a, b) => b.amount - a.amount);

    const debtors = balances
      .filter(b => b.netBalance < -0.01) // Use small threshold for floating point
      .map(b => ({ userId: b.userId, amount: -b.netBalance }))
      .sort((a, b) => b.amount - a.amount);

    // Use greedy algorithm to minimize number of transactions
    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      // Settle the minimum of what's owed and what's due
      const settlementAmount = Math.min(creditor.amount, debtor.amount);

      if (settlementAmount > 0.01) {
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Math.round(settlementAmount * 100) / 100, // Round to 2 decimals
          currency: 'HKD', // Default currency - should be from config
        });
      }

      // Update remaining amounts
      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;

      // Move to next creditor or debtor if current one is settled
      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }

    return settlements;
  }
}

export const budgetService = new BudgetService();
