import { pool } from '../config/database.js';

async function updateAdminPasswordFlag() {
  const client = await pool.connect();
  
  try {
    const adminEmail = 'admin@journo.com';

    // Update existing admin user to mark as using default password
    const result = await client.query(
      `UPDATE users 
       SET password_changed_at = created_at 
       WHERE email = $1 AND password_changed_at IS NULL
       RETURNING id, email, created_at, password_changed_at`,
      [adminEmail]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Admin user updated successfully!');
      console.log('👤 User ID:', user.id);
      console.log('📧 Email:', user.email);
      console.log('📅 Created at:', user.created_at);
      console.log('🔑 Password changed at:', user.password_changed_at);
      console.log('');
      console.log('🔔 The admin will now be prompted to change password on first login');
    } else {
      console.log('ℹ️  Admin user already has password_changed_at set or does not exist');
    }

  } catch (error) {
    console.error('❌ Error updating admin user:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
updateAdminPasswordFlag()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });