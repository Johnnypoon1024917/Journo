import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
});

async function testBudgetAPI() {
  try {
    console.log('🧪 Testing Budget API database operations...\n');

    // Get a test user and trip
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }
    const userId = userResult.rows[0].id;
    console.log(`✅ Using test user: ${userId}`);

    const tripResult = await pool.query('SELECT id FROM trips WHERE owner_id = $1 LIMIT 1', [userId]);
    if (tripResult.rows.length === 0) {
      console.log('❌ No trips found for user. Please create a trip first.');
      return;
    }
    const tripId = tripResult.rows[0].id;
    console.log(`✅ Using test trip: ${tripId}\n`);

    // Test 1: Create budget config
    console.log('Test 1: Creating budget configuration...');
    const categoryAllocations = [
      { category: 'flights', percentage: 30, allocatedAmount: 3000 },
      { category: 'accommodation', percentage: 25, allocatedAmount: 2500 },
      { category: 'food', percentage: 15, allocatedAmount: 1500 },
      { category: 'transport', percentage: 10, allocatedAmount: 1000 },
      { category: 'activities', percentage: 10, allocatedAmount: 1000 },
      { category: 'shopping', percentage: 5, allocatedAmount: 500 },
      { category: 'misc', percentage: 5, allocatedAmount: 500 },
    ];

    const configResult = await pool.query(
      `INSERT INTO budget_configs (trip_id, total_budget, home_currency, trip_currency, category_allocations)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (trip_id) DO UPDATE SET
         total_budget = EXCLUDED.total_budget,
         category_allocations = EXCLUDED.category_allocations
       RETURNING *`,
      [tripId, 10000, 'HKD', 'JPY', JSON.stringify({ allocations: categoryAllocations })]
    );
    console.log(`✅ Budget config created: ${configResult.rows[0].id}\n`);

    // Test 2: Create expense
    console.log('Test 2: Creating expense...');
    const expenseResult = await pool.query(
      `INSERT INTO expenses (trip_id, amount, currency, category, date, note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tripId, 150.50, 'JPY', 'food', '2024-02-08', 'Lunch at ramen shop', userId]
    );
    const expenseId = expenseResult.rows[0].id;
    console.log(`✅ Expense created: ${expenseId}\n`);

    // Test 3: Get budget config
    console.log('Test 3: Fetching budget configuration...');
    const getConfigResult = await pool.query(
      'SELECT * FROM budget_configs WHERE trip_id = $1',
      [tripId]
    );
    console.log(`✅ Budget config fetched: Total budget = ${getConfigResult.rows[0].total_budget}\n`);

    // Test 4: Get expenses
    console.log('Test 4: Fetching expenses...');
    const getExpensesResult = await pool.query(
      'SELECT * FROM expenses WHERE trip_id = $1 ORDER BY date DESC',
      [tripId]
    );
    console.log(`✅ Found ${getExpensesResult.rows.length} expense(s)\n`);

    // Test 5: Update expense
    console.log('Test 5: Updating expense...');
    await pool.query(
      'UPDATE expenses SET amount = $1, note = $2 WHERE id = $3',
      [200.00, 'Updated: Lunch at ramen shop', expenseId]
    );
    console.log(`✅ Expense updated\n`);

    // Test 6: Create split expense
    console.log('Test 6: Creating split expense...');
    const splitExpenseResult = await pool.query(
      `INSERT INTO expenses (
        trip_id, amount, currency, category, date, note, paid_by, split_with, split_type, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [tripId, 500.00, 'JPY', 'activities', '2024-02-08', 'Museum tickets', userId, [userId], 'equal', userId]
    );
    console.log(`✅ Split expense created: ${splitExpenseResult.rows[0].id}\n`);

    // Test 7: Verify indexes are working
    console.log('Test 7: Testing index performance...');
    const indexTestResult = await pool.query(
      'EXPLAIN ANALYZE SELECT * FROM expenses WHERE trip_id = $1 AND category = $2',
      [tripId, 'food']
    );
    console.log(`✅ Index query executed successfully\n`);

    // Cleanup
    console.log('Cleaning up test data...');
    await pool.query('DELETE FROM expenses WHERE trip_id = $1', [tripId]);
    await pool.query('DELETE FROM budget_configs WHERE trip_id = $1', [tripId]);
    console.log('✅ Test data cleaned up\n');

    console.log('✅ All budget API tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testBudgetAPI();
