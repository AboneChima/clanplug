// Check Flutterwave wallet balance
require('dotenv').config();
const https = require('https');

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

if (!FLUTTERWAVE_SECRET_KEY) {
  console.error('❌ FLUTTERWAVE_SECRET_KEY not found in .env');
  process.exit(1);
}

console.log('🔍 Checking Flutterwave Wallet Balance...\n');

// Check wallet balance
const options = {
  hostname: 'api.flutterwave.com',
  path: '/v3/balances',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('📊 Flutterwave Account Status:\n');
      
      if (response.status === 'success') {
        console.log('✅ Status: Active\n');
        console.log('💰 Wallet Balances:');
        console.log('─────────────────────────────────────');
        
        response.data.forEach(wallet => {
          const balance = parseFloat(wallet.available_balance || 0);
          const currency = wallet.currency;
          
          if (currency === 'NGN') {
            console.log(`\n💵 Nigerian Naira (NGN):`);
            console.log(`   Available: ₦${balance.toLocaleString()}`);
            console.log(`   Ledger: ₦${parseFloat(wallet.ledger_balance || 0).toLocaleString()}`);
          } else if (currency === 'USD') {
            console.log(`\n💵 US Dollar (USD):`);
            console.log(`   Available: $${balance.toLocaleString()}`);
            console.log(`   Ledger: $${parseFloat(wallet.ledger_balance || 0).toLocaleString()}`);
          } else {
            console.log(`\n💵 ${currency}:`);
            console.log(`   Available: ${balance.toLocaleString()}`);
            console.log(`   Ledger: ${parseFloat(wallet.ledger_balance || 0).toLocaleString()}`);
          }
        });
        
        console.log('\n─────────────────────────────────────');
        console.log('\n✅ Balance check complete!');
      } else {
        console.error('❌ Error:', response.message);
        console.error('Full response:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();
