import { pool } from '../config/database';
import { EnhancedAuthService } from '../services/enhancedAuthService';
import { EmailService } from '../services/emailService';
import { AuditService } from '../services/auditService';
import { RateLimitService } from '../services/rateLimitService';

async function testAdminLogin() {
  console.log('🧪 Testing admin login...');
  
  try {
    // Initialize services
    const emailService = new EmailService();
    const auditService = new AuditService(pool);
    const rateLimitService = new RateLimitService(pool);
    const authService = new EnhancedAuthService(pool, emailService, auditService, rateLimitService);

    // Test admin login
    const loginResult = await authService.login(
      'admin@journo.com',
      'AdminJourno2024!',
      false, // rememberMe
      '127.0.0.1', // ipAddress
      'Mozilla/5.0 (test-user-agent)' // userAgent
    );

    if (loginResult.success && loginResult.user && loginResult.accessToken) {
      console.log('✅ Admin login successful!');
      console.log('👤 User:', {
        id: loginResult.user.id,
        email: loginResult.user.email,
        role: loginResult.user.role,
        first_name: loginResult.user.first_name
      });
      console.log('🔑 Access token generated:', loginResult.accessToken.substring(0, 20) + '...');
      
      // Test JWT token decoding
      const jwt = await import('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(loginResult.accessToken, jwtSecret) as any;
      console.log('🔓 JWT payload:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        emailVerified: decoded.emailVerified
      });
    } else {
      console.log('❌ Admin login failed:', loginResult.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testAdminLogin().catch(console.error);