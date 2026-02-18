import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function findAndDeleteSticker() {
  try {
    // Find the sticker with the missing image
    const result = await pool.query(
      "SELECT * FROM stickers WHERE image_url LIKE $1",
      ['%1770048585469-8598d936fd94016a.png%']
    );
    
    console.log('Found stickers:', result.rows);
    
    if (result.rows.length > 0) {
      const stickerId = result.rows[0].id;
      
      // Delete sticker attachments first
      await pool.query('DELETE FROM sticker_attachments WHERE sticker_id = $1', [stickerId]);
      console.log('Deleted sticker attachments');
      
      // Delete the sticker
      await pool.query('DELETE FROM stickers WHERE id = $1', [stickerId]);
      console.log('Deleted sticker:', stickerId);
    } else {
      console.log('No sticker found with that image URL');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

findAndDeleteSticker();
