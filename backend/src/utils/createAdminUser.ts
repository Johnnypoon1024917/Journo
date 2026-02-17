import { pool } from '../config/database.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    // Admin user credentials
    const adminEmail = 'admin@journo.com';
    const adminPassword = 'AdminJourno2024!';
    const adminName = 'System Administrator';
    const adminRole = 'admin';

    // Check if admin user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Password:', adminPassword);
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, name, role, email_verified, password_changed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW(), NOW())
       RETURNING id, email, name, role`,
      [adminEmail, hashedPassword, adminName, adminRole]
    );

    const adminUser = result.rows[0];

    console.log('🎉 Admin user created successfully!');
    console.log('👤 User ID:', adminUser.id);
    console.log('📧 Email:', adminUser.email);
    console.log('👨‍💼 Name:', adminUser.name);
    console.log('🔐 Role:', adminUser.role);
    console.log('🔑 Password:', adminPassword);
    console.log('');
    console.log('🚀 You can now login to the admin dashboard at:');
    console.log('   http://localhost:3000/admin');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });