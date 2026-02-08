import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkOrphanedAttachments() {
  try {
    // Find attachments with non-existent stickers
    const result = await pool.query(`
      SELECT sa.*, s.image_url 
      FROM sticker_attachments sa
      LEFT JOIN stickers s ON sa.sticker_id = s.id
      WHERE s.id IS NULL
    `);
    
    console.log('Orphaned attachments (attachments with missing stickers):', result.rows);
    
    if (result.rows.length > 0) {
      console.log('\nDeleting orphaned attachments...');
      for (const row of result.rows) {
        await pool.query('DELETE FROM sticker_attachments WHERE id = $1', [row.id]);
        console.log('Deleted attachment:', row.id);
      }
    }
    
    // Also check all stickers and their image URLs
    const stickers = await pool.query('SELECT id, image_url, name FROM stickers ORDER BY created_at DESC LIMIT 20');
    console.log('\nRecent stickers in database:');
    stickers.rows.forEach(s => {
      console.log(`- ${s.id}: ${s.name || 'Unnamed'} -> ${s.image_url}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkOrphanedAttachments();
