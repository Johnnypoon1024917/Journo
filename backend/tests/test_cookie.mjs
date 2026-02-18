#!/usr/bin/env node

/**
 * Test cookie setting and retrieval
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function testCookies() {
  console.log('🍪 Testing cookie flow...\n');

  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'cypoon54@gmail.com',
        password: 'password123',
        rememberMe: true
      }),
    });

    const loginData = await loginResponse.json();
    const cookies = loginResponse.headers.get('set-cookie');
    
    console.log('Login response:', {
      status: loginResponse.status,
      success: loginData.success,
      hasAccessToken: !!loginData.accessToken,
      hasRefreshToken: !!loginData.refreshToken,
      cookies: cookies
    });

    if (!cookies) {
      console.log('❌ No cookies set in response!');
      return;
    }

    // Extract refresh token from cookie
    const refreshTokenMatch = cookies.match(/refreshToken=([^;]+)/);
    const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;

    console.log('\n2️⃣ Testing refresh with cookie...');
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${refreshToken}`
      },
    });

    const refreshData = await refreshResponse.json();
    console.log('Refresh response:', {
      status: refreshResponse.status,
      success: refreshData.success,
      hasAccessToken: !!refreshData.accessToken,
      message: refreshData.message
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCookies();
