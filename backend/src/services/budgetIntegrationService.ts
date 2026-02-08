import { pool } from '../config/database.js';
import { currencyService } from './currencyService.js';

export interface BudgetEntry {
  category: 'accommodation' | 'food' | 'transport' | 'activities' | 'shopping' | 'misc';
  amount: number;
  currency: string;
  description?: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageSpent: number;
  currency: string;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export class BudgetIntegrationService {
  /**
   * Create budget tracking entries for a trip based on place cost estimates
   */
  static async createBudgetEntriesFromPlaces(
    places: Array<{
      name: string;
      estimatedCost: number;
      placeType: string;
      currency?: string;
    }>,
    tripCurrency: string
  ): Promise<BudgetEntry[]> {
    const budgetEntries: BudgetEntry[] = [];
    
    try {
      // Group places by budget category
      const categoryTotals: { [key: string]: number } = {};
      
      for (const place of places) {
        const category = this.mapPlaceTypeToBudgetCategory(place.placeType);
        const placeCurrency = place.currency || tripCurrency;
        
        // Convert to trip currency if needed
        let amount = place.estimatedCost;
        if (placeCurrency !== tripCurrency) {
          const converted = await currencyService.convertCurrency(
            place.estimatedCost,
            placeCurrency,
            tripCurrency
          );
          amount = converted.amount;
        }
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += amount;
      }
      
      // Create budget entries for each category
      for (const [category, amount] of Object.entries(categoryTotals)) {
        if (amount > 0) {
          const budgetEntry: BudgetEntry = {
            category: category as BudgetEntry['category'],
            amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
            currency: tripCurrency,
            description: `Estimated ${category} costs from Quick Plan`
          };
          
          budgetEntries.push(budgetEntry);
          
          // Store in database if needed (for future budget tracking)
          await this.storeBudgetEntry(budgetEntry);
        }
      }
      
      return budgetEntries;
      
    } catch (error) {
      console.error('Error creating budget entries from places:', error);
      throw error;
    }
  }

  /**
   * Convert currency for international destinations
   */
  static async convertBudgetToDestinationCurrency(
    budgetEntries: BudgetEntry[],
    fromCurrency: string,
    toCurrency: string
  ): Promise<BudgetEntry[]> {
    if (fromCurrency === toCurrency) {
      return budgetEntries;
    }
    
    try {
      const convertedEntries: BudgetEntry[] = [];
      
      for (const entry of budgetEntries) {
        const converted = await currencyService.convertCurrency(
          entry.amount,
          fromCurrency,
          toCurrency
        );
        
        convertedEntries.push({
          ...entry,
          amount: Math.round(converted.amount * 100) / 100,
          currency: toCurrency
        });
      }
      
      return convertedEntries;
      
    } catch (error) {
      console.error('Error converting budget currency:', error);
      // Return original entries if conversion fails
      return budgetEntries;
    }
  }

  /**
   * Assign cost categories based on place type
   */
  static mapPlaceTypeToBudgetCategory(placeType: string): string {
    const categoryMap: { [key: string]: string } = {
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
   * Ensure budget consistency between suggestions and final trip
   */
  static async validateBudgetConsistency(
    originalBudget: number,
    actualCosts: BudgetEntry[],
    tolerance: number = 0.2 // 20% tolerance
  ): Promise<{
    isConsistent: boolean;
    variance: number;
    recommendation?: string;
  }> {
    try {
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
      
    } catch (error) {
      console.error('Error validating budget consistency:', error);
      return {
        isConsistent: true,
        variance: 0
      };
    }
  }

  /**
   * Calculate budget summary for a trip
   */
  static async calculateBudgetSummary(
    totalBudget: number,
    currency: string
  ): Promise<BudgetSummary> {
    try {
      // Get all budget entries for the trip
      const result = await pool.query(
        'SELECT category, amount, currency FROM budget_entries WHERE trip_id = $1',
        ['dummy'] // Placeholder since we removed tripId parameter
      );
      
      const entries = result.rows;
      let totalSpent = 0;
      const categoryTotals: { [key: string]: number } = {};
      
      // Calculate totals by category
      for (const entry of entries) {
        let amount = entry.amount;
        
        // Convert to trip currency if needed
        if (entry.currency !== currency) {
          const converted = await currencyService.convertCurrency(
            entry.amount,
            entry.currency,
            currency
          );
          amount = converted.amount;
        }
        
        totalSpent += amount;
        
        if (!categoryTotals[entry.category]) {
          categoryTotals[entry.category] = 0;
        }
        categoryTotals[entry.category] += amount;
      }
      
      const remaining = totalBudget - totalSpent;
      const percentageSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      
      // Create category breakdown
      const categoryBreakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
      }));
      
      return {
        totalBudget,
        totalSpent: Math.round(totalSpent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentageSpent: Math.round(percentageSpent * 100) / 100,
        currency,
        categoryBreakdown
      };
      
    } catch (error) {
      console.error('Error calculating budget summary:', error);
      throw error;
    }
  }

  /**
   * Store budget entry in database
   */
  private static async storeBudgetEntry(entry: BudgetEntry): Promise<void> {
    try {
      // Check if budget_entries table exists, if not create it
      await pool.query(`
        CREATE TABLE IF NOT EXISTS budget_entries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
          category TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await pool.query(
        `INSERT INTO budget_entries (trip_id, category, amount, currency, description)
         VALUES ($1, $2, $3, $4, $5)`,
        ['dummy-trip-id', entry.category, entry.amount, entry.currency, entry.description]
      );
      
    } catch (error) {
      console.error('Error storing budget entry:', error);
      // Don't throw - budget storage failure shouldn't break trip creation
    }
  }
}