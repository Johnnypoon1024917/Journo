import axios from 'axios';

async function testStickerAttach() {
  try {
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@journo.com',
      password: 'Admin123!@#'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in, token:', token.substring(0, 20) + '...');
    
    // Get a trip day ID
    console.log('\n2. Getting trips...');
    const tripsResponse = await axios.get('http://localhost:5000/api/trips', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (tripsResponse.data.data.length === 0) {
      console.log('❌ No trips found');
      return;
    }
    
    const tripId = tripsResponse.data.data[0].id;
    console.log('✅ Found trip:', tripId);
    
    // Get trip days
    console.log('\n3. Getting trip days...');
    const daysResponse = await axios.get(`http://localhost:5000/api/days/trip/${tripId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (daysResponse.data.length === 0) {
      console.log('❌ No days found');
      return;
    }
    
    const dayId = daysResponse.data[0].id;
    console.log('✅ Found day:', dayId);
    
    // Test attaching emoji sticker
    console.log('\n4. Attaching emoji sticker...');
    const attachResponse = await axios.post('http://localhost:5000/api/stickers/attach', {
      stickerId: 'emoji-1',
      entityType: 'trip_day',
      entityId: dayId,
      positionX: 50,
      positionY: 50
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Sticker attached successfully!');
    console.log('Attachment:', attachResponse.data.attachment);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testStickerAttach();
