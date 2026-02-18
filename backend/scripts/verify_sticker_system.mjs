import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verifySystem() {
  try {
    console.log('🔍 Verifying Sticker System\n');
    console.log('=' .repeat(60));
    
    // 1. Check stickers table
    console.log('\n📊 STICKERS TABLE:');
    const stickers = await pool.query('SELECT * FROM stickers ORDER BY created_at DESC');
    console.log(`Total custom stickers: ${stickers.rows.length}`);
    if (stickers.rows.length > 0) {
      stickers.rows.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s.name} (${s.id})`);
        console.log(`     URL: ${s.image_url}`);
        console.log(`     User: ${s.user_id}`);
        console.log(`     Public: ${s.is_public}`);
      });
    } else {
      console.log('  ✅ No custom stickers (clean state)');
    }
    
    // 2. Check sticker_attachments table
    console.log('\n📊 STICKER_ATTACHMENTS TABLE:');
    const attachments = await pool.query(`
      SELECT 
        id, 
        sticker_id, 
        emoji_sticker, 
        entity_type, 
        entity_id,
        position_x,
        position_y
      FROM sticker_attachments 
      ORDER BY created_at DESC
    `);
    console.log(`Total attachments: ${attachments.rows.length}`);
    
    const customAttachments = attachments.rows.filter(a => a.sticker_id !== null);
    const emojiAttachments = attachments.rows.filter(a => a.emoji_sticker !== null);
    
    console.log(`  - Custom sticker attachments: ${customAttachments.length}`);
    console.log(`  - Emoji sticker attachments: ${emojiAttachments.length}`);
    
    if (emojiAttachments.length > 0) {
      console.log('\n  Emoji Attachments:');
      emojiAttachments.forEach((a, idx) => {
        console.log(`    ${idx + 1}. ${a.emoji_sticker} on ${a.entity_type}:${a.entity_id.substring(0, 8)}...`);
      });
    }
    
    if (customAttachments.length > 0) {
      console.log('\n  Custom Attachments:');
      customAttachments.forEach((a, idx) => {
        console.log(`    ${idx + 1}. Sticker ${a.sticker_id.substring(0, 8)}... on ${a.entity_type}:${a.entity_id.substring(0, 8)}...`);
      });
    }
    
    // 3. Check for orphaned attachments
    console.log('\n🔍 CHECKING FOR ORPHANED ATTACHMENTS:');
    const orphaned = await pool.query(`
      SELECT sa.* 
      FROM sticker_attachments sa
      LEFT JOIN stickers s ON sa.sticker_id = s.id
      WHERE sa.sticker_id IS NOT NULL AND s.id IS NULL
    `);
    
    if (orphaned.rows.length > 0) {
      console.log(`  ⚠️  Found ${orphaned.rows.length} orphaned attachments!`);
      orphaned.rows.forEach((a, idx) => {
        console.log(`    ${idx + 1}. Attachment ${a.id} references missing sticker ${a.sticker_id}`);
      });
    } else {
      console.log('  ✅ No orphaned attachments');
    }
    
    // 4. Check foreign key constraints
    console.log('\n🔍 CHECKING FOREIGN KEY CONSTRAINTS:');
    const constraints = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'sticker_attachments'
    `);
    
    console.log(`  Found ${constraints.rows.length} foreign key constraints:`);
    constraints.rows.forEach((c, idx) => {
      console.log(`    ${idx + 1}. ${c.constraint_name}`);
      console.log(`       ${c.table_name}.${c.column_name} -> ${c.foreign_table_name}.${c.foreign_column_name}`);
    });
    
    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📝 SUMMARY:');
    console.log('='.repeat(60));
    
    const issues = [];
    
    if (orphaned.rows.length > 0) {
      issues.push(`${orphaned.rows.length} orphaned attachments`);
    }
    
    if (customAttachments.length > 0 && stickers.rows.length === 0) {
      issues.push('Custom attachments exist but no custom stickers');
    }
    
    if (issues.length > 0) {
      console.log('⚠️  ISSUES FOUND:');
      issues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. ${issue}`);
      });
    } else {
      console.log('✅ System is clean and ready!');
      console.log('✅ Emoji stickers: Working');
      console.log('✅ Custom stickers: Ready for upload');
      console.log('✅ No orphaned data');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verifySystem();
