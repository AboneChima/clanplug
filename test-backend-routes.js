/**
 * Test script to verify backend routes are working
 * Run: node test-backend-routes.js
 */

const API_URL = 'https://clanplug-o7rp.onrender.com';

async function testRoutes() {
  console.log('🧪 Testing Backend Routes...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Endpoint...');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Health:', data);
  } catch (error) {
    console.error('❌ Health failed:', error.message);
  }

  // Test 2: Password Reset Request
  console.log('\n2. Testing Password Reset Request...');
  try {
    const response = await fetch(`${API_URL}/api/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    if (response.status === 404) {
      console.log('❌ Route not found - backend needs to redeploy');
    } else {
      console.log('✅ Route exists');
    }
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
  }

  // Test 3: Comment Delete (will fail without auth, but should return 401 not 404)
  console.log('\n3. Testing Comment Delete Endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/comments/test-id-123`, {
      method: 'DELETE'
    });
    console.log(`Status: ${response.status}`);
    if (response.status === 404) {
      console.log('❌ Route not found');
    } else if (response.status === 401) {
      console.log('✅ Route exists (401 = needs auth)');
    } else {
      const data = await response.json();
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('❌ Comment delete test failed:', error.message);
  }

  console.log('\n✅ Tests complete!');
}

testRoutes();
