import { Pool } from 'pg';
import dotenv from 'dotenv';
import { EnhancedAuthService } from '../services/enhancedAuthService.js';
import { EmailService } from '../services/emailService.js';
import { AuditService } from '../services/auditService.js';
import { RateLimitService } from '../services/rateLimitService.js';

// Load environment variables
dotenv.config();

async function testEnhancedAuth() {
  console.log('🧪 Testing Enhanced Authentication System...\n');

  // Create database connection
  const db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'journo_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    // Initialize services
    const emailService = new EmailService(db);
    const auditService = new AuditService(db);
    const rateLimitService = new RateLimitService(db);
    const authService = new EnhancedAuthService(db, emailService, auditService, rateLimitService);

    console.log('✅ Services initialized successfully');

    // Test 1: User Registration
    console.log('\n📝 Testing user registration...');
    const registerResult = await authService.register(
      'test@example.com',
      'TestPassword123!',
      'Test',
      'User',
      '127.0.0.1',
      'Test-Agent'
    );

    if (registerResult.success) {
      console.log('✅ Registration successful');
      console.log(`   Message: ${registerResult.message}`);
      console.log(`   Verification required: ${registerResult.verificationRequired}`);
    } else {
      console.log('❌ Registration failed');
      console.log(`   Error: ${registerResult.message}`);
    }

    // Test 2: Password Strength Validation
    console.log('\n🔒 Testing password strength validation...');
    const weakPasswordResult = await authService.register(
      'weak@example.com',
      'weak',
      'Weak',
      'User',
      '127.0.0.1',
      'Test-Agent'
    );

    if (!weakPasswordResult.success) {
      console.log('✅ Weak password correctly rejected');
      console.log(`   Message: ${weakPasswordResult.message}`);
    } else {
      console.log('❌ Weak password was accepted (this should not happen)');
    }

    // Test 3: Duplicate Email Registration
    console.log('\n📧 Testing duplicate email registration...');
    const duplicateResult = await authService.register(
      'test@example.com',
      'AnotherPassword123!',
      'Another',
      'User',
      '127.0.0.1',
      'Test-Agent'
    );

    if (!duplicateResult.success) {
      console.log('✅ Duplicate email correctly rejected');
      console.log(`   Message: ${duplicateResult.message}`);
    } else {
      console.log('❌ Duplicate email was accepted (this should not happen)');
    }

    // Test 4: Login Attempt (should fail due to unverified email)
    console.log('\n🔐 Testing login with unverified email...');
    const loginResult = await authService.login(
      'test@example.com',
      'TestPassword123!',
      false,
      '127.0.0.1',
      'Test-Agent'
    );

    if (!loginResult.success) {
      console.log('✅ Login correctly blocked for unverified email');
      console.log(`   Message: ${loginResult.message}`);
    } else {
      console.log('❌ Login succeeded with unverified email (this should not happen)');
    }

    // Test 5: Password Reset Request
    console.log('\n🔄 Testing password reset request...');
    const resetRequestResult = await authService.requestPasswordReset(
      'test@example.com',
      '127.0.0.1',
      'Test-Agent'
    );

    if (resetRequestResult.success) {
      console.log('✅ Password reset request successful');
      console.log(`   Message: ${resetRequestResult.message}`);
    } else {
      console.log('❌ Password reset request failed');
      console.log(`   Error: ${resetRequestResult.message}`);
    }

    // Test 6: Rate Limiting
    console.log('\n⏱️  Testing rate limiting...');
    let rateLimitHit = false;
    for (let i = 0; i < 12; i++) {
      const result = await authService.login(
        'nonexistent@example.com',
        'wrongpassword',
        false,
        '127.0.0.1',
        'Test-Agent'
      );
      
      if (result.message?.includes('Too many')) {
        console.log(`✅ Rate limit hit after ${i + 1} attempts`);
        rateLimitHit = true;
        break;
      }
    }

    if (!rateLimitHit) {
      console.log('❌ Rate limiting did not activate');
    }

    // Test 7: Audit Log Check
    console.log('\n📊 Testing audit logging...');
    const auditLogs = await auditService.getLogs({
      limit: 5
    });

    if (auditLogs.logs.length > 0) {
      console.log(`✅ Found ${auditLogs.logs.length} audit log entries`);
      console.log('   Recent actions:');
      auditLogs.logs.forEach(log => {
        console.log(`   - ${log.action} (${log.success ? 'success' : 'failed'})`);
      });
    } else {
      console.log('❌ No audit logs found');
    }

    console.log('\n🎉 Enhanced Authentication System test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await db.end();
  }
}

// Run the test
testEnhancedAuth().catch(console.error);