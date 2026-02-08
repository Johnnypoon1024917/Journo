import { pool } from '../config/database';
import { EnhancedAuthService } from '../services/enhancedAuthService';
import { EmailService } from '../services/emailService';
import { AuditService } from '../services/auditService';
import { RateLimitService } from '../services/rateLimitService';
import fetch from 'node-fetch';

async function testAdminEndpoints() {
  console.log('🧪 Testing admin endpoints...');
  
  try {
    // Initialize services and login as admin
    const emailService = new EmailService();
    const auditService = new AuditService(pool);
    const rateLimitService = new RateLimitService(pool);
    const authService = new EnhancedAuthService(pool, emailService, auditService, rateLimitService);

    // Login as admin
    const loginResult = await authService.login(
      'admin@journo.com',
      'AdminJourno2024!',
      false,
      '127.0.0.1',
      'Mozilla/5.0 (test-user-agent)'
    );

    if (!loginResult.success || !loginResult.accessToken) {
      console.log('❌ Admin login failed');
      return;
    }

    console.log('✅ Admin login successful');
    const token = loginResult.accessToken;

    // Test endpoints
    const baseUrl = 'http://localhost:5000/api/admin';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test dashboard metrics
    console.log('🔍 Testing dashboard metrics...');
    try {
      const metricsResponse = await fetch(`${baseUrl}/metrics`, { headers });
      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json();
        console.log('✅ Dashboard metrics:', Object.keys(metrics));
      } else {
        console.log('❌ Dashboard metrics failed:', metricsResponse.status, await metricsResponse.text());
      }
    } catch (error) {
      console.log('❌ Dashboard metrics error:', error.message);
    }

    // Test analytics insights
    console.log('🔍 Testing analytics insights...');
    try {
      const analyticsResponse = await fetch(`${baseUrl}/analytics/insights`, { headers });
      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        console.log('✅ Analytics insights:', Object.keys(analytics));
      } else {
        console.log('❌ Analytics insights failed:', analyticsResponse.status, await analyticsResponse.text());
      }
    } catch (error) {
      console.log('❌ Analytics insights error:', error.message);
    }

    // Test moderation flags
    console.log('🔍 Testing moderation flags...');
    try {
      const flagsResponse = await fetch(`${baseUrl}/moderation/flags?status=pending&page=1&limit=20`, { headers });
      if (flagsResponse.ok) {
        const flags = await flagsResponse.json();
        console.log('✅ Moderation flags:', flags.flags?.length || 0, 'flags found');
      } else {
        console.log('❌ Moderation flags failed:', flagsResponse.status, await flagsResponse.text());
      }
    } catch (error) {
      console.log('❌ Moderation flags error:', error.message);
    }

    // Test feature flags
    console.log('🔍 Testing feature flags...');
    try {
      const featureFlagsResponse = await fetch(`${baseUrl}/feature-flags`, { headers });
      if (featureFlagsResponse.ok) {
        const featureFlags = await featureFlagsResponse.json();
        console.log('✅ Feature flags:', featureFlags.flags?.length || 0, 'flags found');
      } else {
        console.log('❌ Feature flags failed:', featureFlagsResponse.status, await featureFlagsResponse.text());
      }
    } catch (error) {
      console.log('❌ Feature flags error:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testAdminEndpoints().catch(console.error);