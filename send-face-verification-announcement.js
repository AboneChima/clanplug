// Script to send Face Verification announcement to all users
// Run with: node send-face-verification-announcement.js

const API_URL = 'https://clanplug.onrender.com'; // Your backend URL

async function sendAnnouncement() {
  try {
    // You need to get your admin access token first
    // Login as admin and copy the token from localStorage
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';

    if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
      console.log('❌ Please set ADMIN_TOKEN environment variable or edit this file');
      console.log('   Get your token by:');
      console.log('   1. Login as admin on the website');
      console.log('   2. Open browser console (F12)');
      console.log('   3. Type: localStorage.getItem("accessToken")');
      console.log('   4. Copy the token and run:');
      console.log('      ADMIN_TOKEN=your_token node send-face-verification-announcement.js');
      return;
    }

    const announcement = {
      title: '🎉 New Feature: Face Verification!',
      message: `Great news! You can now verify your account using Face Verification - no documents needed!

✨ What's New:
• Quick 2-minute face verification
• No NIN or BVN required
• Just 4 simple selfie steps
• Transaction limit: ₦500,000/day

📍 How to Get Started:
1. Go to KYC Verification page
2. Choose "Face Verification"
3. Follow the 4-step selfie guide
4. Wait for approval (24 hours)

Perfect for users who don't have proper documents ready! Try it now! 🚀`,
      type: 'SYSTEM',
      targetUsers: 'all', // Send to all users
      actionButton: {
        text: 'Verify Now',
        link: '/kyc'
      }
    };

    console.log('📤 Sending announcement to all users...');
    console.log('Title:', announcement.title);
    console.log('');

    const response = await fetch(`${API_URL}/api/admin/notifications/broadcast`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(announcement),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Announcement sent successfully!');
      console.log(`📊 Sent to ${data.sentTo || data.count || 0} users`);
      console.log('');
      console.log('Users will see this notification in their notification bell 🔔');
    } else {
      console.error('❌ Failed to send announcement:', data.message);
      if (response.status === 401 || response.status === 403) {
        console.log('   Your admin token may be expired. Please get a new one.');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendAnnouncement();
