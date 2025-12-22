// Run this on Render to verify users for 5 years
// Usage: node verify-users-render.js

const fetch = require('node-fetch');

const API_URL = 'https://clanplug.onrender.com';
const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY || 'lordmoon_admin_2024_secure_key';

const emails = [
  'Franklynnnamdi136@gmail.com',
  'abonejoseph@gmail.com'
];

async function verifyUsers() {
  try {
    console.log('🔍 Verifying users for 5 years...');
    console.log('API URL:', API_URL);
    
    for (const email of emails) {
      console.log(`\n📧 Processing: ${email}`);
      
      const response = await fetch(`${API_URL}/api/admin/verify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY
        },
        body: JSON.stringify({
          email: email,
          duration: 5 // 5 years
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success: ${result.message}`);
        if (result.data) {
          console.log(`   User: ${result.data.user?.firstName} ${result.data.user?.lastName}`);
          console.log(`   Expires: ${result.data.badge?.expiresAt}`);
        }
      } else {
        console.log(`❌ Failed: ${result.message}`);
      }
    }
    
    console.log('\n✅ Verification process complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyUsers();
