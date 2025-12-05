// Check Flutterwave balance
const axios = require('axios');
require('dotenv').config();

async function checkBalance() {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    if (!secretKey) {
      console.log('❌ FLUTTERWAVE_SECRET_KEY not found in .env');
      return;
    }

    console.log('🔍 Checking Flutterwave balance...\n');

    const response = await axios.get('https://api.flutterwave.com/v3/balances', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success') {
      const balances = response.data.data;
      
      console.log('💰 Flutterwave Wallet Balances:\n');
      
      balances.forEach(balance => {
        console.log(`${balance.currency}:`);
        console.log(`  Available: ${balance.currency} ${balance.available_balance.toLocaleString()}`);
        console.log(`  Ledger: ${balance.currency} ${balance.ledger_balance.toLocaleString()}`);
        console.log('');
      });

      // Check NGN specifically
      const ngnBalance = balances.find(b => b.currency === 'NGN');
      if (ngnBalance) {
        console.log('📊 NGN Balance Analysis:');
        console.log(`  Available for withdrawals: ₦${ngnBalance.available_balance.toLocaleString()}`);
        
        if (ngnBalance.available_balance < 50000) {
          console.log('\n⚠️  WARNING: Balance too low for instant withdrawals!');
          console.log('   Recommended: ₦500,000 - ₦1,000,000');
          console.log('   Current: ₦' + ngnBalance.available_balance.toLocaleString());
        } else {
          console.log('\n✅ Balance sufficient for instant withdrawals!');
        }
      }

      // Check if there's a difference between ledger and available
      const ngnLedger = ngnBalance?.ledger_balance || 0;
      const ngnAvailable = ngnBalance?.available_balance || 0;
      const difference = ngnLedger - ngnAvailable;

      if (difference > 0) {
        console.log('\n💡 Balance Breakdown:');
        console.log(`  Total (Ledger): ₦${ngnLedger.toLocaleString()}`);
        console.log(`  Available: ₦${ngnAvailable.toLocaleString()}`);
        console.log(`  Locked/Pending: ₦${difference.toLocaleString()}`);
        console.log('\n📝 Note: Locked balance is from collections that need to be moved to payout balance.');
      }

    } else {
      console.log('❌ Failed to fetch balance:', response.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

checkBalance();
