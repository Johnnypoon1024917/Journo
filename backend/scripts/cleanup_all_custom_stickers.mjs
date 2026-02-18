import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanupAllCustomStickers() {
  try {
    console.log('🧹 Starting cleanup of all custom stickers...\n');

    // 1. Get all custom stickers
    const stickersResult = await pool.query(
      'SELECT id, name, image_url, user_id FROM stickers ORDER BY created_at DESC'
    );
    
    console.log(`📊 Found ${stickersResult.rows.length} custom stickers in database`);
    stickersResult.rows.forEach((s, idx) => {
      console.log(`  ${idx + 1}. ${s.name || 'Unnamed'} (${s.id}) -> ${s.image_url}`);
    });
    console.log('');

    // 2. Get all sticker attachments
    const attachmentsResult = await pool.query(
      'SELECT id, sticker_id, emoji_sticker, entity_type, entity_id FROM sticker_attachments'
    );
    
    console.log(`📊 Found ${attachmentsResult.rows.length} sticker attachments`);
    
    // Count attachments by type
    const customAttachments = attachmentsResult.rows.filter(a => a.sticker_id !== null);
    const emojiAttachments = attachmentsResult.rows.filter(a => a.emoji_sticker !== null);
    
    console.log(`  - Custom sticker attachments: ${customAttachments.length}`);
    console.log(`  - Emoji sticker attachments: ${emojiAttachments.length}`);
    console.log('');

    // 3. Delete all custom sticker attachments
    if (customAttachments.length > 0) {
      console.log('🗑️  Deleting custom sticker attachments...');
      const deleteAttachmentsResult = await pool.query(
        'DELETE FROM sticker_attachments WHERE sticker_id IS NOT NULL'
      );
      console.log(`✅ Deleted ${deleteAttachmentsResult.rowCount} custom sticker attachments\n`);
    }

    // 4. Delete all custom stickers from database
    if (stickersResult.rows.length > 0) {
      console.log('🗑️  Deleting custom stickers from database...');
      const deleteStickersResult = await pool.query('DELETE FROM stickers');
      console.log(`✅ Deleted ${deleteStickersResult.rowCount} custom stickers from database\n`);
    }

    // 5. Clean up sticker files from uploads folder
    const uploadsDir = path.join(__dirname, 'uploads', 'stickers');
    
    if (fs.existsSync(uploadsDir)) {
      console.log('🗑️  Cleaning up sticker files from uploads folder...');
      const files = fs.readdirSync(uploadsDir);
      
      console.log(`📊 Found ${files.length} files in uploads/stickers/`);
      
      let deletedCount = 0;
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`  ✅ Deleted: ${file}`);
        } catch (err) {
          console.error(`  ❌ Failed to delete ${file}:`, err.message);
        }
      });
      
      console.log(`✅ Deleted ${deletedCount} files from uploads/stickers/\n`);
    } else {
      console.log('⚠️  uploads/stickers/ directory not found\n');
    }

    // 6. Verify cleanup
    console.log('🔍 Verifying cleanup...');
    
    const remainingStickers = await pool.query('SELECT COUNT(*) FROM stickers');
    const remainingCustomAttachments = await pool.query(
      'SELECT COUNT(*) FROM sticker_attachments WHERE sticker_id IS NOT NULL'
    );
    const remainingEmojiAttachments = await pool.query(
      'SELECT COUNT(*) FROM sticker_attachments WHERE emoji_sticker IS NOT NULL'
    );
    
    console.log(`  - Remaining custom stickers: ${remainingStickers.rows[0].count}`);
    console.log(`  - Remaining custom attachments: ${remainingCustomAttachments.rows[0].count}`);
    console.log(`  - Remaining emoji attachments: ${remainingEmojiAttachments.rows[0].count}`);
    console.log('');

    if (remainingStickers.rows[0].count === '0' && remainingCustomAttachments.rows[0].count === '0') {
      console.log('✅ ✅ ✅ CLEANUP SUCCESSFUL! All custom stickers removed.');
      console.log('📝 Emoji stickers are preserved and working correctly.');
    } else {
      console.log('⚠️  Some items remain. Please check manually.');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    await pool.end();
    process.exit(1);
  }
}

cleanupAllCustomStickers();
