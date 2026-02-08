import express from 'express';
import { CurrencyController } from '../controllers/currencyController.js';

const router = express.Router();

// Get exchange rate between two currencies
router.get('/rate', CurrencyController.getExchangeRate);

// Convert amount between currencies
router.post('/convert', CurrencyController.convertCurrency);

// Cache exchange rate
router.post('/rate', CurrencyController.cacheExchangeRate);

export default router;