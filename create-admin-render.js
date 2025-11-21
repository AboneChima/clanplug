/**
 * Script to create an admin user on Render database
 * Run: node create-admin-render.js
 */

const fetch = require('node-fetch');

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user on Render...\n');

    const API_URL = 'https://clanplug-o7rp.onrender.com';
    
    // Admin credentials
    const adminData = {
      email: 'admin@clanplug.com',
      password: 'Admin@2024!',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    };

    console.log('📝 Registering admin user...');
    
    // Register the user
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData)
    });

    const registerData = await registerResponse.json();
    
    if (!registerResponse.ok) {
      if (registerData.message?.includes('already exists')) {
        console.log('✅ Admin user already exists!');
        console.log('\n📧 Email:', adminData.email);
        console.log('🔑 Password:', adminData.password);
        console.log('👤 Username:', adminData.username);
        console.log('\n🌐 Login at: https://clanplug.site/login');
        console.log('\n⚠️  You need to manually upgrade this user to ADMIN role in the database');
        console.log('   Run this SQL in your Render PostgreSQL:');
        console.log(`   UPDATE "User" SET role = 'ADMIN' WHERE email = '${adminData.email}';`);
        return;
      }
      throw new Error(registerData.message || 'Registration failed');
    }

    console.log('✅ User registered successfully!');
    console.log('🆔 User ID:', registerData.data?.user?.id);
    
    console.log('\n📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Username:', adminData.username);
    console.log('\n🌐 Login at: https://clanplug.site/login');
    console.log('\n⚠️  IMPORTANT: You need to upgrade this user to ADMIN role');
    console.log('   Go to Render Dashboard → PostgreSQL → Run this SQL:');
    console.log(`   UPDATE "User" SET role = 'ADMIN', "isEmailVerified" = true WHERE email = '${adminData.email}';`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminUser();
