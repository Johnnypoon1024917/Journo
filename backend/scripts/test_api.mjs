import fetch from 'node-fetch';

async function testAPI() {
  try {
    // First, let's get a valid token by logging in
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cypoon54@gmail.com',
        password: 'your-password-here' // You'll need to provide the actual password
      })
    });
    
    if (!loginResponse.ok) {
      console.log('Login failed. Status:', loginResponse.status);
      console.log('Response:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    console.log('✅ Login successful');
    
    // Now test the For You feed
    console.log('\n2. Fetching For You feed...');
    const feedResponse = await fetch('http://localhost:5000/api/community/feed/for-you?limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!feedResponse.ok) {
      console.log('Feed fetch failed. Status:', feedResponse.status);
      console.log('Response:', await feedResponse.text());
      return;
    }
    
    const feedData = await feedResponse.json();
    console.log('✅ Feed fetched successfully');
    console.log('\nFeed data:');
    console.log('- Posts count:', feedData.posts?.length || 0);
    console.log('- Has more:', feedData.hasMore);
    console.log('- Cursor:', feedData.cursor);
    
    if (feedData.posts && feedData.posts.length > 0) {
      console.log('\nFirst post:');
      console.log(JSON.stringify(feedData.posts[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
