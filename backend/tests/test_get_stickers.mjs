import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'journo_db',
  user: 'postgres',
  password: 'postgres',
});

async function testGetStickers() {
  try {
    const entityType = 'trip_day';
    const entityId = '26b02ffa-a44a-4523-b660-f42e2b1e3d1e';
    
    console.log('Testing getEntityStickers query...');
    console.log('Parameters:', { entityType, entityId });
    
    const result = await pool.query(
      `SELECT 
        sa.id,
        sa.sticker_id,
        sa.emoji_sticker,
        sa.entity_type,
        sa.entity_id,
        sa.position_x,
        sa.position_y,
        sa.rotation,
        sa.scale,
        sa.z_index,
        sa.created_at,
        sa.updated_at
       FROM sticker_attachments sa
       WHERE sa.entity_type = $1 AND sa.entity_id = $2
       ORDER BY sa.z_index ASC, sa.created_at ASC`,
      [entityType, entityId]
    );

    console.log('\nQuery result:');
    console.log('Row count:', result.rowCount);
    console.log('Rows:', JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testGetStickers();
