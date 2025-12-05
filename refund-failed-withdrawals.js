const axios = require('axios');

const API_URL = 'https://clanplug-o7rp.onrender.com';
const SECRET = 'refund-failed-withdrawals-2024';

async function checkFailedWithdrawals() {
  console.log('🔍 Step 1: Checking for failed withdrawals...\n');

  try {
    const response = await axios.get(`${API_URL}/api/refund/check?secret=${SECRET}`);
    
    console.log('✅ Check completed!\n');
    console.log(`Total withdrawals: ${response.data.data.total}`);
    console.log(`Need refund: ${response.data.data.needsRefund}\n`);

    if (response.data.data.needsRefund > 0) {
      console.log('📋 Transactions needing refund:\n');
      response.data.data.transactions.forEach((tx, i) => {
        console.log(`${i + 1}. ${tx.user}`);
        console.log(`   Amount: ₦${tx.amount}`);
        console.log(`   Reference: ${tx.reference}`);
        console.log(`   Status: ${tx.status} (Flutterwave: ${tx.flutterwaveStatus})`);
        console.log(`   Message: ${tx.message}`);
        console.log(`   Date: ${new Date(tx.createdAt).toLocaleString()}\n`);
      });

      return response.data.data.needsRefund;
    } else {
      console.log('✅ No failed withdrawals found! All good.\n');
      return 0;
    }
  } catch (error) {
    console.error('❌ Error checking:', error.response?.data || error.message);
    return -1;
  }
}

async function processRefunds() {
  console.log('💰 Step 2: Processing refunds...\n');

  try {
    const response = await axios.post(`${API_URL}/api/refund/process`, {
      secret: SECRET
    });

    console.log('✅ Refunds processed!\n');
    console.log(`Refunded: ${response.data.data.refunded}`);
    console.log(`Errors: ${response.data.data.errorCount}\n`);

    if (response.data.data.refunds.length > 0) {
      console.log('📋 Refunded transactions:\n');
      response.data.data.refunds.forEach((refund, i) => {
        console.log(`${i + 1}. ${refund.userId}`);
        console.log(`   Amount: ₦${refund.amount}`);
        console.log(`   Reference: ${refund.reference}`);
        console.log(`   Status: ${refund.status}\n`);
      });
    }

    if (response.data.data.errors.length > 0) {
      console.log('❌ Errors:\n');
      response.data.data.errors.forEach((error, i) => {
        console.log(`${i + 1}. Transaction ${error.transactionId}`);
        console.log(`   Error: ${error.error}\n`);
      });
    }
  } catch (error) {
    console.error('❌ Error processing refunds:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 Refund Failed Withdrawals Script\n');
  console.log('='.repeat(60) + '\n');

  const needsRefund = await checkFailedWithdrawals();

  if (needsRefund > 0) {
    console.log('='.repeat(60) + '\n');
    console.log('⚠️  Found transactions that need refund!\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    await processRefunds();
  }

  console.log('='.repeat(60));
  console.log('✅ Done!\n');
}

main();
