const axios = require('axios');

const API_URL = 'https://clanplug-o7rp.onrender.com';
const SECRET = 'refund-failed-withdrawals-2024';

async function findStuckMoney() {
  console.log('🔍 Searching for your stuck money...\n');

  try {
    // Check all withdrawal transactions
    const response = await axios.get(`${API_URL}/api/refund/check?secret=${SECRET}`);
    
    console.log('📊 Database Check Results:\n');
    console.log(`Total withdrawal transactions: ${response.data.data.total}`);
    console.log(`Transactions needing refund: ${response.data.data.needsRefund}\n`);

    if (response.data.data.transactions && response.data.data.transactions.length > 0) {
      console.log('💰 Found stuck transactions:\n');
      response.data.data.transactions.forEach((tx, i) => {
        console.log(`${i + 1}. User: ${tx.user}`);
        console.log(`   Amount: ₦${tx.amount}`);
        console.log(`   Status in DB: ${tx.status}`);
        console.log(`   Flutterwave Status: ${tx.flutterwaveStatus}`);
        console.log(`   Reference: ${tx.reference}`);
        console.log(`   Date: ${new Date(tx.createdAt).toLocaleString()}`);
        console.log(`   Message: ${tx.message}\n`);
      });
    } else {
      console.log('🤔 No transactions found with FAILED Flutterwave status\n');
      console.log('This means the transaction might be:');
      console.log('1. Still marked as PROCESSING in database');
      console.log('2. Or marked as COMPLETED even though it failed\n');
      console.log('Let me check ALL recent withdrawals...\n');
    }

    // Now let's check what the refund endpoint sees
    console.log('='.repeat(60) + '\n');
    console.log('Checking what transactions exist in database...\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

findStuckMoney();
