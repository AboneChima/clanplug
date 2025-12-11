/**
 * Test Admin Endpoints
 * This script tests if admin endpoints are working correctly
 */

const API_URL = 'https://api.clanplug.site';

// You need to replace this with an actual admin token
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

async function testAdminEndpoints() {
  console.log('🔍 Testing Admin Endpoints...\n');

  // Test 1: Get Dashboard Stats
  console.log('1️⃣ Testing GET /api/admin/dashboard');
  try {
    const response = await fetch(`${API_URL}/api/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    const data = await response.json();
    console.log('✅ Dashboard Stats:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Dashboard Stats Error:', error.message);
  }

  console.log('\n');

  // Test 2: Get All Users
  console.log('2️⃣ Testing GET /api/admin/users');
  try {
    const response = await fetch(`${API_URL}/api/admin/users?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    const data = await response.json();
    console.log('✅ Users:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Users Error:', error.message);
  }

  console.log('\n');

  // Test 3: Get KYC Verifications
  console.log('3️⃣ Testing GET /api/admin/kyc');
  try {
    const response = await fetch(`${API_URL}/api/admin/kyc?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    const data = await response.json();
    console.log('✅ KYC Verifications:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ KYC Verifications Error:', error.message);
  }

  console.log('\n');

  // Test 4: Get Transactions
  console.log('4️⃣ Testing GET /api/admin/transactions');
  try {
    const response = await fetch(`${API_URL}/api/admin/transactions?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    const data = await response.json();
    console.log('✅ Transactions:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Transactions Error:', error.message);
  }

  console.log('\n');

  // Test 5: Get System Config
  console.log('5️⃣ Testing GET /api/admin/system-config');
  try {
    const response = await fetch(`${API_URL}/api/admin/system-config`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    const data = await response.json();
    console.log('✅ System Config:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ System Config Error:', error.message);
  }

  console.log('\n✨ Admin endpoint tests complete!');
}

// Run tests
testAdminEndpoints().catch(console.error);
