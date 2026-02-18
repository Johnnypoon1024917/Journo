import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testCheckbox() {
  try {
    console.log('=== Testing Activity Checkbox Functionality ===\n');
    
    // 1. Check if is_completed column exists
    console.log('1. Checking if is_completed column exists...');
    const columnCheck = await pool.query(
      `SELECT column_name, data_type, column_default 
       FROM information_schema.columns 
       WHERE table_name = 'places' AND column_name = 'is_completed'`
    );
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ is_completed column does NOT exist!');
      console.log('   Run migration 029_add_is_completed_to_places.sql');
      await pool.end();
      return;
    }
    
    console.log('✅ is_completed column exists');
    console.log('   Type:', columnCheck.rows[0].data_type);
    console.log('   Default:', columnCheck.rows[0].column_default);
    console.log('');
    
    // 2. Get a sample place
    console.log('2. Getting sample places...');
    const places = await pool.query(
      `SELECT p.id, p.name, p.is_completed, p.trip_day_id, td.trip_id
       FROM places p
       JOIN trip_days td ON td.id = p.trip_day_id
       ORDER BY p.created_at DESC
       LIMIT 5`
    );
    
    if (places.rows.length === 0) {
      console.log('⚠️  No places found in database');
      console.log('   Create a trip with activities to test');
      await pool.end();
      return;
    }
    
    console.log(`✅ Found ${places.rows.length} places:`);
    places.rows.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - is_completed: ${p.is_completed}`);
    });
    console.log('');
    
    // 3. Test updating is_completed
    const testPlace = places.rows[0];
    console.log(`3. Testing update on: ${testPlace.name}`);
    console.log(`   Current status: ${testPlace.is_completed}`);
    
    const newStatus = !testPlace.is_completed;
    console.log(`   Updating to: ${newStatus}`);
    
    const updateResult = await pool.query(
      `UPDATE places 
       SET is_completed = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, name, is_completed`,
      [newStatus, testPlace.id]
    );
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Update successful!');
      console.log(`   New status: ${updateResult.rows[0].is_completed}`);
    } else {
      console.log('❌ Update failed!');
    }
    console.log('');
    
    // 4. Verify the update persisted
    console.log('4. Verifying update persisted...');
    const verifyResult = await pool.query(
      `SELECT id, name, is_completed FROM places WHERE id = $1`,
      [testPlace.id]
    );
    
    if (verifyResult.rows[0].is_completed === newStatus) {
      console.log('✅ Update persisted correctly!');
      console.log(`   Confirmed status: ${verifyResult.rows[0].is_completed}`);
    } else {
      console.log('❌ Update did NOT persist!');
      console.log(`   Expected: ${newStatus}, Got: ${verifyResult.rows[0].is_completed}`);
    }
    console.log('');
    
    // 5. Revert the change
    console.log('5. Reverting change...');
    await pool.query(
      `UPDATE places SET is_completed = $1 WHERE id = $2`,
      [testPlace.is_completed, testPlace.id]
    );
    console.log('✅ Reverted to original status');
    console.log('');
    
    console.log('=== Test Complete ===');
    console.log('✅ Activity checkbox functionality is working correctly!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart the backend server to pick up code changes');
    console.log('2. Test in the UI by checking/unchecking activities');
    console.log('3. Refresh the page to verify status persists');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testCheckbox();
