import { Trip, Place, BudgetCategory } from '../types/trip';
import { currencyService } from './currencyService';

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
}

export const budgetService = new BudgetService();
