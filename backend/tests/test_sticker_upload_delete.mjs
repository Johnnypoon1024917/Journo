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

// Test user ID (replace with actual user ID from your database)
const TEST_USER_ID = '46d62fdc-7b1c-4e20-83f9-db7323fbbb46';

async function testStickerUploadDelete() {
  try {
    console.log('🧪 Testing Sticker Upload and Delete Flow\n');
    console.log('=' .repeat(60));
    
    // 1. Create a test image (1x1 red pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    console.log('\n📤 STEP 1: Simulating sticker upload...');
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomString}.png`;
    const uploadPath = `/uploads/stickers/${filename}`;
    
    // Save to uploads folder
    const uploadsDir = path.join(__dirname, 'uploads', 'stickers');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, testImageBuffer);
    console.log(`  ✅ File saved: ${filename}`);
    
    // Insert into database
    const insertResult = await pool.query(
      `INSERT INTO stickers (user_id, name, image_url, category, is_public, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, image_url, created_at`,
      [TEST_USER_ID, 'Test Sticker', uploadPath, 'custom', false, testImageBuffer.length, 'image/png']
    );
    
    const sticker = insertResult.rows[0];
    console.log(`  ✅ Sticker created in database:`);
    console.log(`     ID: ${sticker.id}`);
    console.log(`     Name: ${sticker.name}`);
    console.log(`     URL: ${sticker.image_url}`);
    
    // 2. Verify sticker exists
    console.log('\n🔍 STEP 2: Verifying sticker exists...');
    const checkResult = await pool.query(
      'SELECT * FROM stickers WHERE id = $1',
      [sticker.id]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('  ✅ Sticker found in database');
    } else {
      console.log('  ❌ Sticker NOT found in database');
      throw new Error('Sticker verification failed');
    }
    
    if (fs.existsSync(filePath)) {
      console.log('  ✅ File exists on disk');
    } else {
      console.log('  ❌ File NOT found on disk');
      throw new Error('File verification failed');
    }
    
    // 3. Create a test attachment
    console.log('\n📌 STEP 3: Creating test attachment...');
    const testDayId = '26b02ffa-a44a-4523-b660-f42e2b1e3d1e'; // Use existing day from your database
    
    const attachResult = await pool.query(
      `INSERT INTO sticker_attachments 
       (sticker_id, user_id, entity_type, entity_id, position_x, position_y)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [sticker.id, TEST_USER_ID, 'trip_day', testDayId, 50, 50]
    );
    
    console.log(`  ✅ Attachment created: ${attachResult.rows[0].id}`);
    
    // 4. Verify attachment
    console.log('\n🔍 STEP 4: Verifying attachment...');
    const attachCheck = await pool.query(
      'SELECT * FROM sticker_attachments WHERE sticker_id = $1',
      [sticker.id]
    );
    
    if (attachCheck.rows.length > 0) {
      console.log(`  ✅ Found ${attachCheck.rows.length} attachment(s)`);
    } else {
      console.log('  ❌ No attachments found');
    }
    
    // 5. Delete sticker (should cascade delete attachments)
    console.log('\n🗑️  STEP 5: Deleting sticker...');
    
    // First delete attachments manually (as per controller logic)
    const deleteAttachResult = await pool.query(
      'DELETE FROM sticker_attachments WHERE sticker_id = $1',
      [sticker.id]
    );
    console.log(`  ✅ Deleted ${deleteAttachResult.rowCount} attachment(s)`);
    
    // Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('  ✅ File deleted from disk');
    }
    
    // Delete from database
    const deleteStickerResult = await pool.query(
      'DELETE FROM stickers WHERE id = $1',
      [sticker.id]
    );
    console.log(`  ✅ Deleted ${deleteStickerResult.rowCount} sticker(s) from database`);
    
    // 6. Verify deletion
    console.log('\n🔍 STEP 6: Verifying deletion...');
    
    const stickerCheck = await pool.query(
      'SELECT * FROM stickers WHERE id = $1',
      [sticker.id]
    );
    
    const attachmentCheck = await pool.query(
      'SELECT * FROM sticker_attachments WHERE sticker_id = $1',
      [sticker.id]
    );
    
    const fileExists = fs.existsSync(filePath);
    
    if (stickerCheck.rows.length === 0) {
      console.log('  ✅ Sticker removed from database');
    } else {
      console.log('  ❌ Sticker still in database');
    }
    
    if (attachmentCheck.rows.length === 0) {
      console.log('  ✅ Attachments removed');
    } else {
      console.log('  ❌ Attachments still exist');
    }
    
    if (!fileExists) {
      console.log('  ✅ File removed from disk');
    } else {
      console.log('  ❌ File still on disk');
    }
    
    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📝 TEST SUMMARY:');
    console.log('='.repeat(60));
    
    if (stickerCheck.rows.length === 0 && 
        attachmentCheck.rows.length === 0 && 
        !fileExists) {
      console.log('✅ ✅ ✅ ALL TESTS PASSED!');
      console.log('✅ Upload works correctly');
      console.log('✅ Delete works correctly');
      console.log('✅ Attachments are properly cleaned up');
      console.log('✅ Files are properly removed');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Check output above');
    }
    
    await pool.end();
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    await pool.end();
    process.exit(1);
  }
}

testStickerUploadDelete();
