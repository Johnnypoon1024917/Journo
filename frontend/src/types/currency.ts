// Currency and budget types

export interface CurrencyRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  cached_at: string;
}

export interface CurrencyConversionRequest {
  amount: number;
  from_currency: string;
  to_currency: string;
}

export interface CurrencyConversionResponse {
  amount: number;
  from_currency: string;
  to_currency: string;
  converted_amount: number;
  rate: number;
  cached: boolean;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  remaining: number;
  currency: string;
  percentage_spent: number;
  status: 'under_budget' | 'warning' | 'over_budget';
  daily_budget: number;
  daily_average_spent: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  item_count: number;
}

export interface DailySpending {
  date: string;
  day_number: number;
  total_spent: number;
  budget_allocated: number;
  places: Array<{
    name: string;
    cost: number;
    category: string;
  }>;
}

export interface BudgetBreakdown {
  summary: BudgetSummary;
  by_category: CategorySpending[];
  by_day: DailySpending[];
  top_expenses: Array<{
    place_name: string;
    cost: number;
    category: string;
    date: string;
  }>;
}

// Supported currencies (ISO 4217)
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];
