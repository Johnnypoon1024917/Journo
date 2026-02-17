import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import {
  BudgetConfig,
  BudgetConfigRow,
  ExpenseEntry,
  ExpenseRow,
  CreateBudgetConfigDto,
  UpdateBudgetConfigDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  BatchSyncExpenseDto,
  SyncResult,
} from '../types/budget.js';

export class BudgetController {
  /**
   * Helper: Convert database row to BudgetConfig
   */
  private static rowToBudgetConfig(row: BudgetConfigRow): BudgetConfig {
    return {
      id: row.id,
      tripId: row.trip_id,
      totalBudget: parseFloat(row.total_budget),
      homeCurrency: row.home_currency,
      tripCurrency: row.trip_currency,
      categoryAllocations: row.category_allocations?.allocations || [],
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  /**
   * Helper: Convert database row to ExpenseEntry
   */
  private static rowToExpense(row: ExpenseRow): ExpenseEntry {
    return {
      id: row.id,
      tripId: row.trip_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      category: row.category as any,
      date: row.date.toISOString().split('T')[0],
      note: row.note,
      paidBy: row.paid_by,
      splitWith: row.split_with,
      splitType: row.split_type as any,
      customSplits: row.custom_splits?.splits,
      isSettled: row.is_settled,
      linkedItemId: row.linked_item_id,
      linkedItemType: row.linked_item_type as any,
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      syncStatus: row.sync_status as any,
    };
  }

  /**
   * Helper: Verify user has access to trip
   */
  private static async verifyTripAccess(tripId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM trips 
       WHERE id = $1 AND (owner_id = $2 OR id IN (
         SELECT trip_id FROM trip_collaborators WHERE user_id = $2 AND accepted_at IS NOT NULL
       ))`,
      [tripId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * GET /api/budget/config/:tripId
   * Get budget configuration for a trip
   */
  static async getBudgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify access
      const hasAccess = await BudgetController.verifyTripAccess(tripId, userId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const result = await pool.query<BudgetConfigRow>(
        'SELECT * FROM budget_configs WHERE trip_id = $1',
        [tripId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Budget configuration not found' });
        return;
      }

      const config = BudgetController.rowToBudgetConfig(result.rows[0]);
      res.json({ config });
    } catch (error) {
      console.error('Error fetching budget config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/budget/config
   * Create budget configuration
   */
  static async createBudgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dto: CreateBudgetConfigDto = req.body;

      // Verify access
      const hasAccess = await BudgetController.verifyTripAccess(dto.tripId, userId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Validate category allocations sum to 100%
      const totalPercentage = dto.categoryAllocations.reduce((sum, a) => sum + a.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        res.status(400).json({ error: 'Category allocations must sum to 100%' });
        return;
      }

      const result = await pool.query<BudgetConfigRow>(
        `INSERT INTO budget_configs (trip_id, total_budget, home_currency, trip_currency, category_allocations)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          dto.tripId,
          dto.totalBudget,
          dto.homeCurrency || 'HKD',
          dto.tripCurrency,
          JSON.stringify({ allocations: dto.categoryAllocations }),
        ]
      );

      const config = BudgetController.rowToBudgetConfig(result.rows[0]);
      res.status(201).json({ config });
    } catch (error: any) {
      console.error('Error creating budget config:', error);
      if (error.code === '23505') {
        res.status(409).json({ error: 'Budget configuration already exists for this trip' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * PUT /api/budget/config/:configId
   * Update budget configuration
   */
  static async updateBudgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dto: UpdateBudgetConfigDto = req.body;

      // Verify access via trip
      const accessCheck = await pool.query(
        `SELECT trip_id FROM budget_configs WHERE id = $1`,
        [configId]
      );

      if (accessCheck.rows.length === 0) {
        res.status(404).json({ error: 'Budget configuration not found' });
        return;
      }

      const hasAccess = await BudgetController.verifyTripAccess(accessCheck.rows[0].trip_id, userId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Validate category allocations if provided
      if (dto.categoryAllocations) {
        const totalPercentage = dto.categoryAllocations.reduce((sum, a) => sum + a.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          res.status(400).json({ error: 'Category allocations must sum to 100%' });
          return;
        }
      }

      const result = await pool.query<BudgetConfigRow>(
        `UPDATE budget_configs SET
          total_budget = COALESCE($1, total_budget),
          home_currency = COALESCE($2, home_currency),
          trip_currency = COALESCE($3, trip_currency),
          category_allocations = COALESCE($4, category_allocations)
         WHERE id = $5
         RETURNING *`,
        [
          dto.totalBudget,
          dto.homeCurrency,
          dto.tripCurrency,
          dto.categoryAllocations ? JSON.stringify({ allocations: dto.categoryAllocations }) : null,
          configId,
        ]
      );

      const config = BudgetController.rowToBudgetConfig(result.rows[0]);
      res.json({ config });
    } catch (error) {
      console.error('Error updating budget config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/budget/expenses/:tripId
   * Get all expenses for a trip
   */
  static async getExpenses(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify access
      const hasAccess = await BudgetController.verifyTripAccess(tripId, userId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const result = await pool.query<ExpenseRow>(
        `SELECT * FROM expenses 
         WHERE trip_id = $1 
         ORDER BY date DESC, created_at DESC`,
        [tripId]
      );

      const expenses = result.rows.map(BudgetController.rowToExpense);
      res.json({ expenses });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/budget/expenses
   * Create a new expense
   */
  static async createExpense(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dto: CreateExpenseDto = req.body;

      // Verify access
      const hasAccess = await BudgetController.verifyTripAccess(dto.tripId, userId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Validate custom splits if provided
      if (dto.splitType === 'custom' && dto.customSplits) {
        const splitTotal = dto.customSplits.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(splitTotal - dto.amount) > 0.01) {
          res.status(400).json({ error: 'Custom splits must sum to expense amount' });
          return;
        }
      }

      const result = await pool.query<ExpenseRow>(
        `INSERT INTO expenses (
          trip_id, amount, currency, category, date, note, paid_by, split_with,
          split_type, custom_splits, linked_item_id, linked_item_type, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          dto.tripId,
          dto.amount,
          dto.currency,
          dto.category,
          dto.date,
          dto.note,
          dto.paidBy,
          dto.splitWith,
          dto.splitType,
          dto.customSplits ? JSON.stringify({ splits: dto.customSplits }) : null,
          dto.linkedItemId,
          dto.linkedItemType,
          userId,
        ]
      );

      const expense = BudgetController.rowToExpense(result.rows[0]);
      res.status(201).json({ expense });
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/budget/expenses/:expenseId
   * Update an expense
   */
  static async updateExpense(req: Request, res: Response): Promise<void> {
    try {
      const { expenseId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dto: UpdateExpenseDto = req.body;

      // Verify access via trip
      const accessCheck = await pool.query(
        `SELECT trip_id FROM expenses WHERE id = $1`,
        [expenseId]
      );

      if (accessCheck.rows.length === 0) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      const hasAccess = await BudgetController.verifyTripAccess(accessCheck.rows[0].trip_id, userId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Validate custom splits if provided
      if (dto.splitType === 'custom' && dto.customSplits && dto.amount) {
        const splitTotal = dto.customSplits.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(splitTotal - dto.amount) > 0.01) {
          res.status(400).json({ error: 'Custom splits must sum to expense amount' });
          return;
        }
      }

      const result = await pool.query<ExpenseRow>(
        `UPDATE expenses SET
          amount = COALESCE($1, amount),
          currency = COALESCE($2, currency),
          category = COALESCE($3, category),
          date = COALESCE($4, date),
          note = COALESCE($5, note),
          paid_by = COALESCE($6, paid_by),
          split_with = COALESCE($7, split_with),
          split_type = COALESCE($8, split_type),
          custom_splits = COALESCE($9, custom_splits),
          is_settled = COALESCE($10, is_settled),
          linked_item_id = COALESCE($11, linked_item_id),
          linked_item_type = COALESCE($12, linked_item_type),
          sync_status = COALESCE($13, sync_status)
         WHERE id = $14
         RETURNING *`,
        [
          dto.amount,
          dto.currency,
          dto.category,
          dto.date,
          dto.note,
          dto.paidBy,
          dto.splitWith,
          dto.splitType,
          dto.customSplits ? JSON.stringify({ splits: dto.customSplits }) : null,
          dto.isSettled,
          dto.linkedItemId,
          dto.linkedItemType,
          dto.syncStatus,
          expenseId,
        ]
      );

      const expense = BudgetController.rowToExpense(result.rows[0]);
      res.json({ expense });
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/budget/expenses/:expenseId
   * Delete an expense
   */
  static async deleteExpense(req: Request, res: Response): Promise<void> {
    try {
      const { expenseId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify access via trip
      const accessCheck = await pool.query(
        `SELECT trip_id FROM expenses WHERE id = $1`,
        [expenseId]
      );

      if (accessCheck.rows.length === 0) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      const hasAccess = await BudgetController.verifyTripAccess(accessCheck.rows[0].trip_id, userId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await pool.query('DELETE FROM expenses WHERE id = $1', [expenseId]);

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/budget/expenses/batch
   * Batch sync expenses (for offline queue processing)
   */
  static async batchSyncExpenses(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dto: BatchSyncExpenseDto = req.body;
      const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      };

      for (const expense of dto.expenses) {
        try {
          if ('id' in expense) {
            // Update existing expense
            await pool.query(
              `UPDATE expenses SET
                amount = COALESCE($1, amount),
                currency = COALESCE($2, currency),
                category = COALESCE($3, category),
                date = COALESCE($4, date),
                note = COALESCE($5, note),
                sync_status = 'synced'
               WHERE id = $6`,
              [
                expense.amount,
                expense.currency,
                expense.category,
                expense.date,
                expense.note,
                expense.id,
              ]
            );
          } else {
            // Create new expense
            await pool.query(
              `INSERT INTO expenses (
                trip_id, amount, currency, category, date, note, created_by, sync_status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'synced')`,
              [
                expense.tripId,
                expense.amount,
                expense.currency,
                expense.category,
                expense.date,
                expense.note,
                userId,
              ]
            );
          }
          result.synced++;
        } catch (error: any) {
          result.failed++;
          result.errors?.push({
            id: 'id' in expense ? expense.id : undefined,
            error: error.message,
          });
        }
      }

      result.success = result.failed === 0;
      res.json(result);
    } catch (error) {
      console.error('Error batch syncing expenses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
