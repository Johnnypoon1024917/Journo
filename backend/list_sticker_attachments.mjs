import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function listAttachments() {
  try {
    const result = await pool.query(
      `SELECT id, user_id, entity_type, entity_id, emoji_sticker, sticker_id, 
              position_x, position_y, created_at 
       FROM sticker_attachments 
       ORDER BY created_at DESC LIMIT 10`
    );
    console.log('Sticker Attachments:');
    result.rows.forEach(a => {
      console.log(`  ID: ${a.id}`);
      console.log(`    User: ${a.user_id}`);
      console.log(`    Entity: ${a.entity_type} / ${a.entity_id}`);
      console.log(`    Sticker: ${a.emoji_sticker || a.sticker_id}`);
      console.log(`    Position: (${a.position_x}, ${a.position_y})`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listAttachments();
