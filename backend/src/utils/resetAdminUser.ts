import { pool } from '../config/database';
import bcrypt from 'bcrypt';

async function resetAdminUser() {
  const client = await pool.connect();
  
  try {
    const adminEmail = 'admin@journo.com';
    const adminPassword = 'AdminJourno2024!';
    const adminName = 'System Administrator';
    const adminRole = 'admin';

    // Delete existing admin user
    await client.query('DELETE FROM users WHERE email = $1', [adminEmail]);
    console.log('🗑️  Deleted existing admin user');

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create new admin user with default password flag
    const result = await client.query(
      `INSERT INTO users (email, password_hash, name, role, email_verified, password_changed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW(), NOW())
       RETURNING id, email, name, role, created_at, password_changed_at`,
      [adminEmail, hashedPassword, adminName, adminRole]
    );

    const adminUser = result.rows[0];

    console.log('🎉 New admin user created successfully!');
    console.log('👤 User ID:', adminUser.id);
    console.log('📧 Email:', adminUser.email);
    console.log('👨‍💼 Name:', adminUser.name);
    console.log('🔐 Role:', adminUser.role);
    console.log('🔑 Password:', adminPassword);
    console.log('📅 Created at:', adminUser.created_at);
    console.log('🔑 Password changed at:', adminUser.password_changed_at);
    console.log('');
    console.log('🔔 This user will be prompted to change password on first login');

  } catch (error) {
    console.error('❌ Error resetting admin user:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
resetAdminUser()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });