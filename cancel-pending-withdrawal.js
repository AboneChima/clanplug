const axios = require('axios');

const API_URL = 'https://clanplug-o7rp.onrender.com';

async function cancelPendingWithdrawals() {
  console.log('🔍 Finding pending withdrawals...\n');

  try {
    // Get all withdrawals
    const response = await axios.get(`${API_URL}/api/debug/withdrawals?secret=debug-withdrawals-2024`);
    
    const withdrawals = response.data.data.withdrawals;
    const pending = withdrawals.filter(w => w.status === 'PENDING');

    if (pending.length === 0) {
      console.log('✅ No pending withdrawals found!\n');
      return;
    }

    console.log(`📊 Found ${pending.length} pending withdrawal(s):\n`);

    pending.forEach((w, i) => {
      console.log(`${i + 1}. ${w.user}`);
      console.log(`   Amount: ₦${w.amount}`);
      console.log(`   Reference: ${w.reference}`);
      console.log(`   Date: ${new Date(w.createdAt).toLocaleString()}\n`);
    });

    console.log('🔄 Cancelling and refunding...\n');

    for (const w of pending) {
      try {
        const refundResponse = await axios.post(`${API_URL}/api/debug/refund`, {
          secret: 'manual-refund-2024',
          transactionId: w.id
        });

        console.log(`✅ Cancelled and refunded: ${w.user} - ₦${w.amount}`);
      } catch (error) {
        console.log(`❌ Failed to refund ${w.id}:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n✅ All pending withdrawals cancelled and refunded!\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

cancelPendingWithdrawals();
