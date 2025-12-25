const axios = require('axios');

async function verifyUser() {
  try {
    // First, login as admin
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('https://clanplug.onrender.com/api/auth/admin-login', {
      email: process.env.ADMIN_EMAIL || 'admin@clanplug.com',
      password: process.env.ADMIN_PASSWORD || 'your-admin-password'
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in successfully');

    // Get user by email
    console.log('Searching for user...');
    const usersResponse = await axios.get('https://clanplug.onrender.com/api/admin/users?search=Natashanice8717', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const user = usersResponse.data.users?.find(u => 
      u.email.toLowerCase() === 'natashanice8717@gmail.com'
    );

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.username);

    // Verify user for 60 days
    console.log('Verifying user for 60 days...');
    const verifyResponse = await axios.post(
      'https://clanplug.onrender.com/api/admin/verifications/verify',
      {
        userId: user.id,
        days: 60
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ User verified successfully!');
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('Duration: 60 days');
    console.log('Expires:', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString());

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

verifyUser();
