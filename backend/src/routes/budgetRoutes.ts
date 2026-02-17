import express from 'express';
import { BudgetController } from '../controllers/budgetController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
// Budget Configuration routes
router.get('/config/:tripId', authenticateToken, BudgetController.getBudgetConfig);
router.post('/config', authenticateToken, BudgetController.createBudgetConfig);
router.put('/config/:configId', authenticateToken, BudgetController.updateBudgetConfig);

// Expense routes
router.get('/expenses/:tripId', authenticateToken, BudgetController.getExpenses);
router.post('/expenses', authenticateToken, BudgetController.createExpense);
router.put('/expenses/:expenseId', authenticateToken, BudgetController.updateExpense);
router.delete('/expenses/:expenseId', authenticateToken, BudgetController.deleteExpense);

// Batch sync route for offline queue processing
router.post('/expenses/batch', authenticateToken, BudgetController.batchSyncExpenses);

export default router;
