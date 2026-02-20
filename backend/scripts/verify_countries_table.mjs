import { pool } from '../src/config/database.js';

async function verifyCountriesTable() {
  try {
    console.log('🔍 Verifying countries table...\n');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'countries'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Countries table does not exist!');
      process.exit(1);
    }
    
    console.log('✅ Countries table exists');

    // Check columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'countries'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'countries';
    `);

    console.log('\n🔑 Indexes:');
    indexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    });

    // Check constraints
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'countries';
    `);

    console.log('\n🔒 Constraints:');
    constraints.rows.forEach(con => {
      console.log(`  - ${con.constraint_name} (${con.constraint_type})`);
    });

    // Check triggers
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'countries';
    `);

    console.log('\n⚡ Triggers:');
    if (triggers.rows.length === 0) {
      console.log('  - No triggers found');
    } else {
      triggers.rows.forEach(trig => {
        console.log(`  - ${trig.trigger_name} (${trig.event_manipulation})`);
      });
    }

    console.log('\n✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyCountriesTable();
