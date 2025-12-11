/**
 * Make a user admin via API
 * Usage: node make-me-admin.js your-email@example.com
 */

const https = require('https');

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node make-me-admin.js your-email@example.com');
  process.exit(1);
}

const data = JSON.stringify({
  email: email.toLowerCase(),
  secret: 'clanplug-admin-2024'
});

const options = {
  hostname: 'api.clanplug.site',
  port: 443,
  path: '/api/admin-verify/make-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log(`🔧 Making ${email} an admin...\n`);

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      
      if (response.success) {
        console.log('✅ Success!');
        console.log('\n📧 Email:', response.data.email);
        console.log('👤 Username:', response.data.username);
        console.log('🔑 Role:', response.data.role);
        console.log('\n🌐 Login at: https://clanplug.site/login');
        console.log('📊 Admin Panel: https://clanplug.site/admin');
      } else {
        console.error('❌ Error:', response.message);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(data);
req.end();
