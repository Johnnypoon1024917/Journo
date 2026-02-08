#!/usr/bin/env node

/**
 * Test login and cookie setting
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
  console.log('🧪 Testing login and cookie flow...\n');

  try {
    // Test login
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'cypoon54@gmail.com',
        password: 'test123',
        rememberMe: false
      }),
    });

    console.log('📥 Login Response Status:', loginResponse.status);
    console.log('📥 Login Response Headers:');
    
    // Check for Set-Cookie header
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('   Set-Cookie:', setCookieHeader || 'NOT PRESENT');
    
    const data = await loginResponse.json();
    console.log('\n📦 Response Body:', {
      success: data.success,
      hasUser: !!data.user,
      hasAccessToken: !!data.accessToken,
      hasRefreshToken: !!data.refreshToken,
      accessTokenPreview: data.accessToken ? data.accessToken.substring(0, 30) + '...' : 'none',
      refreshTokenPreview: data.refreshToken ? data.refreshToken.substring(0, 30) + '...' : 'none'
    });

    if (setCookieHeader) {
      console.log('\n✅ Cookie IS being set by backend');
      console.log('Cookie details:', setCookieHeader);
    } else {
      console.log('\n❌ Cookie is NOT being set by backend');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
