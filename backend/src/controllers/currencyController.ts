import { Request, Response } from 'express';
import { currencyService } from '../services/currencyService.js';

export class CurrencyController {
  // Get exchange rate between two currencies
  static async getExchangeRate(req: Request, res: Response) {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({ 
          error: 'Both from and to currencies are required' 
        });
      }

      const rate = await currencyService.getExchangeRate(
        from as string, 
        to as string
      );

      res.json({
        success: true,
        data: {
          base_currency: from,
          target_currency: to,
          rate,
          cached_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting exchange rate:', error);
      res.status(500).json({ 
        error: 'Failed to get exchange rate' 
      });
    }
  }

  // Convert amount between currencies
  static async convertCurrency(req: Request, res: Response) {
    try {
      const { amount, from, to } = req.body;

      if (!amount || !from || !to) {
        return res.status(400).json({ 
          error: 'Amount, from currency, and to currency are required' 
        });
      }

      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ 
          error: 'Amount must be a positive number' 
        });
      }

      const result = await currencyService.convertCurrency(amount, from, to);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error converting currency:', error);
      res.status(500).json({ 
        error: 'Failed to convert currency' 
      });
    }
  }

  // Cache exchange rate (for internal use)
  static async cacheExchangeRate(req: Request, res: Response) {
    try {
      const { base_currency, target_currency, rate } = req.body;

      if (!base_currency || !target_currency || !rate) {
        return res.status(400).json({ 
          error: 'Base currency, target currency, and rate are required' 
        });
      }

      if (typeof rate !== 'number' || rate <= 0) {
        return res.status(400).json({ 
          error: 'Rate must be a positive number' 
        });
      }

      // This will cache the rate in the database
      await currencyService.getExchangeRate(base_currency, target_currency);

      res.json({
        success: true,
        message: 'Exchange rate cached successfully'
      });

    } catch (error) {
      console.error('Error caching exchange rate:', error);
      res.status(500).json({ 
        error: 'Failed to cache exchange rate' 
      });
    }
  }
}