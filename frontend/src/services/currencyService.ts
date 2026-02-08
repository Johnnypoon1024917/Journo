import { apiRequest } from './api';

export interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  cached_at: string;
}

export interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  rate: number;
}

class CurrencyService {
  private cache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionResult> {
    // If same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return {
        amount,
        from: fromCurrency,
        to: toCurrency,
        rate: 1,
      };
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    return {
      amount: convertedAmount,
      from: fromCurrency,
      to: toCurrency,
      rate,
    };
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Check memory cache first
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.rate;
    }

    try {
      // Try to get from database cache
      const dbRate = await this.getCachedRateFromDB(fromCurrency, toCurrency);
      
      if (dbRate) {
        // Update memory cache
        this.cache.set(cacheKey, {
          rate: dbRate.rate,
          timestamp: new Date(dbRate.cached_at).getTime(),
        });
        return dbRate.rate;
      }

      // Fetch from Frankfurter API
      const rate = await this.fetchLiveRate(fromCurrency, toCurrency);
      
      // Cache in memory
      this.cache.set(cacheKey, {
        rate,
        timestamp: Date.now(),
      });

      // Cache in database
      await this.cacheRateInDB(fromCurrency, toCurrency, rate);

      return rate;
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      
      // Try to use stale cache as fallback
      const staleCache = this.cache.get(cacheKey);
      if (staleCache) {
        console.warn('Using stale exchange rate from cache');
        return staleCache.rate;
      }

      // If all else fails, return 1 (no conversion)
      console.warn('Could not get exchange rate, using 1:1 conversion');
      return 1;
    }
  }

  /**
   * Fetch live exchange rate from Frankfurter API
   */
  private async fetchLiveRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`
      );

      if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.status}`);
      }

      const data = await response.json();
      const rate = data.rates[toCurrency];

      if (!rate) {
        throw new Error(`No rate found for ${fromCurrency} to ${toCurrency}`);
      }

      return rate;
    } catch (error) {
      console.error('Error fetching live rate from Frankfurter:', error);
      throw error;
    }
  }

  /**
   * Get cached exchange rate from database
   */
  private async getCachedRateFromDB(
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRate | null> {
    try {
      const response = await apiRequest<{ success: boolean; data: ExchangeRate }>(
        `/currency/rate?from=${fromCurrency}&to=${toCurrency}`,
        {
          method: 'GET',
        }
      );
      
      // Check if cache is still valid (within 24 hours)
      const cachedAt = new Date(response.data.cached_at).getTime();
      const now = Date.now();
      
      if (now - cachedAt < this.CACHE_DURATION) {
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      // If 404, no cached rate exists
      if (error.status === 404) {
        return null;
      }
      console.error('Error getting cached rate from DB:', error);
      return null;
    }
  }

  /**
   * Cache exchange rate in database
   */
  private async cacheRateInDB(
    fromCurrency: string,
    toCurrency: string,
    rate: number
  ): Promise<void> {
    try {
      await apiRequest('/currency/rate', {
        method: 'POST',
        body: JSON.stringify({
          base_currency: fromCurrency,
          target_currency: toCurrency,
          rate,
        }),
      });
    } catch (error) {
      console.error('Error caching rate in DB:', error);
      // Don't throw - caching failure shouldn't break the conversion
    }
  }

  /**
   * Convert multiple amounts at once
   */
  async convertMultiple(
    conversions: Array<{ amount: number; from: string; to: string }>
  ): Promise<ConversionResult[]> {
    const results = await Promise.all(
      conversions.map((conv) =>
        this.convertCurrency(conv.amount, conv.from, conv.to)
      )
    );
    return results;
  }

  /**
   * Clear memory cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const currencyService = new CurrencyService();
