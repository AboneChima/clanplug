const axios = require('axios');

const API_URL = 'https://clanplug-o7rp.onrender.com';

async function findAndRefund() {
  console.log('🔍 Step 1: Finding ALL withdrawal transactions...\n');

  try {
    // Get all withdrawals
    const response = await axios.get(`${API_URL}/api/debug/withdrawals?secret=debug-withdrawals-2024`);
    
    const withdrawals = response.data.data.withdrawals;
    
    console.log(`📊 Found ${withdrawals.length} withdrawal transactions\n`);
    console.log('='.repeat(80) + '\n');

    if (withdrawals.length === 0) {
      console.log('No withdrawals found in last 7 days\n');
      return;
    }

    // Show all withdrawals
    withdrawals.forEach((w, i) => {
      console.log(`${i + 1}. ${w.user}`);
      console.log(`   Amount: ₦${w.amount} (Fee: ₦${w.fee}, Net: ₦${w.netAmount})`);
      console.log(`   Status: ${w.status}`);
      console.log(`   Reference: ${w.reference}`);
      console.log(`   Date: ${new Date(w.createdAt).toLocaleString()}`);
      console.log(`   Current Wallet Balance: ₦${w.currentWalletBalance}`);
      
      if (w.metadata) {
        const meta = w.metadata;
        if (meta.flutterwaveStatus) {
          console.log(`   Flutterwave Status: ${meta.flutterwaveStatus}`);
        }
        if (meta.flutterwaveResponse?.complete_message) {
          console.log(`   Flutterwave Message: ${meta.flutterwaveResponse.complete_message}`);
        }
      }
      console.log('');
    });

    console.log('='.repeat(80) + '\n');

    // Find stuck transactions (PROCESSING or COMPLETED but Flutterwave failed)
    const stuckTransactions = withdrawals.filter(w => {
      const meta = w.metadata || {};
      const isStuck = (w.status === 'PROCESSING' || w.status === 'COMPLETED') && 
                      meta.flutterwaveStatus === 'FAILED';
      return isStuck;
    });

    if (stuckTransactions.length > 0) {
      console.log(`💰 Found ${stuckTransactions.length} stuck transaction(s)!\n`);
      
      stuckTransactions.forEach((tx, i) => {
        console.log(`${i + 1}. Transaction ID: ${tx.id}`);
        console.log(`   User: ${tx.user}`);
        console.log(`   Amount: ₦${tx.amount}`);
        console.log(`   Status in DB: ${tx.status}`);
        console.log(`   Flutterwave: ${tx.metadata.flutterwaveStatus}\n`);
      });

      console.log('🔄 Refunding stuck transactions...\n');

      for (const tx of stuckTransactions) {
        try {
          const refundResponse = await axios.post(`${API_URL}/api/debug/refund`, {
            secret: 'manual-refund-2024',
            transactionId: tx.id
          });

          console.log(`✅ Refunded: ${tx.user} - ₦${tx.amount}`);
        } catch (error) {
          console.log(`❌ Failed to refund transaction ${tx.id}:`, error.response?.data?.message || error.message);
        }
      }

      console.log('\n✅ Refund process complete!\n');
    } else {
      console.log('✅ No stuck transactions found!\n');
      console.log('All withdrawal transactions are properly handled.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

findAndRefund();
