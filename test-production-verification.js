// Test the production verification API endpoint
const API_URL = 'https://clanplug-o7rp.onrender.com';

async function testVerificationAPI() {
  console.log('🔍 Testing Production Verification API...\n');
  console.log(`API URL: ${API_URL}\n`);

  // Test 1: Check if API is running
  console.log('1️⃣ Testing API health...');
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ API is running:', healthData);
    console.log('');
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
    console.log('💡 The backend server might be down or sleeping (Render free tier)\n');
    return;
  }

  // Test 2: Check verification endpoint (without auth - should return 401)
  console.log('2️⃣ Testing verification endpoint (without auth)...');
  try {
    const response = await fetch(`${API_URL}/api/verification/status`);
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists and requires authentication (expected)\n');
    } else {
      console.log('⚠️  Unexpected response\n');
    }
  } catch (error) {
    console.error('❌ Verification endpoint test failed:', error.message);
    console.log('');
  }

  // Test 3: Check if route is registered
  console.log('3️⃣ Testing if verification routes are registered...');
  try {
    const response = await fetch(`${API_URL}/api/verification/nonexistent`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Verification routes are registered (401 = needs auth)\n');
    } else if (response.status === 404) {
      console.log('❌ Verification routes might not be registered (404 = not found)\n');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}\n`);
    }
  } catch (error) {
    console.error('❌ Route test failed:', error.message);
    console.log('');
  }

  console.log('\n📝 Summary:');
  console.log('   To test with authentication:');
  console.log('   1. Login to the app in your browser');
  console.log('   2. Open browser DevTools (F12)');
  console.log('   3. Go to Console tab');
  console.log('   4. Run: localStorage.getItem("accessToken")');
  console.log('   5. Copy the token');
  console.log('   6. Test with: curl -H "Authorization: Bearer YOUR_TOKEN" ' + API_URL + '/api/verification/status');
  console.log('\n   Or check the browser Network tab when visiting the profile page');
  console.log('   to see the actual error response from the API');
}

testVerificationAPI().catch(console.error);
