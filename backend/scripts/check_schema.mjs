import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'journo',
  user: 'postgres',
  password: 'postgres',
});

async function checkSchema() {
  try {
    // Check which schemas exist
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
    `);
    console.log('Schemas:', schemasResult.rows.map(r => r.schema_name));
    
    // Check if posts table exists in any schema
    const tablesResult = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'posts'
    `);
    console.log('\nPosts table locations:', tablesResult.rows);
    
    // Try to query posts with explicit schema
    if (tablesResult.rows.length > 0) {
      const schema = tablesResult.rows[0].table_schema;
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${schema}.posts`);
      console.log(`\nPosts count in ${schema}.posts:`, countResult.rows[0].count);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
