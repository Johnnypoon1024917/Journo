import { pool } from '../config/database.js';

async function checkAdminUser() {
  const client = await pool.connect();
  
  try {
    const adminEmail = 'admin@journo.com';

    // Check admin user details
    const result = await client.query(
      `SELECT id, email, created_at, password_changed_at, updated_at
       FROM users 
       WHERE email = $1`,
      [adminEmail]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('👤 Admin User Details:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Created at:', user.created_at);
      console.log('   Password changed at:', user.password_changed_at);
      console.log('   Updated at:', user.updated_at);
      console.log('');
      
      // Check if using default password
      if (!user.password_changed_at) {
        console.log('🔔 Status: Using default password (password_changed_at is NULL)');
      } else {
        const createdAt = new Date(user.created_at).getTime();
        const passwordChangedAt = new Date(user.password_changed_at).getTime();
        const timeDiff = Math.abs(passwordChangedAt - createdAt);
        
        if (timeDiff < 1000) {
          console.log('🔔 Status: Using default password (password changed within 1 second of creation)');
        } else {
          console.log('✅ Status: Password has been changed');
        }
      }
    } else {
      console.log('❌ Admin user not found');
    }

  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
checkAdminUser()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });