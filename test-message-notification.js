// Test message notification creation and push
const { PrismaClient } = require('@prisma/client');
const { pushService } = require('./dist/services/push.service');
const { notificationService } = require('./dist/services/notification.service');

const prisma = new PrismaClient();

async function testMessageNotification() {
  try {
    console.log('🧪 Testing message notification flow...\n');

    // Get a user to test with
    const user = await prisma.user.findFirst({
      where: { email: 'abonejoseph@gmail.com' }
    });

    if (!user) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('👤 Testing with user:', user.username);
    console.log('📧 Email:', user.email);
    console.log('🆔 ID:', user.id);
    console.log('');

    // Check if user has push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id }
    });

    console.log(`📊 User has ${subscriptions.length} push subscription(s)`);
    
    if (subscriptions.length === 0) {
      console.log('❌ User has no push subscriptions. Enable push notifications first.');
      return;
    }

    console.log('');

    // Simulate a message notification
    console.log('📝 Creating test message notification...');
    
    const testNotification = await notificationService.createNotification({
      userId: user.id,
      type: 'CHAT',
      title: 'New Message',
      message: 'Test User: This is a test message to check push notifications!',
      data: {
        chatId: 'test-chat-id',
        messageId: 'test-message-id',
        senderId: 'cmi2ntvc90000bv5rbc2r5kb0' // Another user ID for avatar test
      }
    });

    console.log('✅ Notification created:', testNotification.id);
    console.log('');
    console.log('⏳ Waiting 3 seconds for push to be sent...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('');
    console.log('✅ Test complete!');
    console.log('');
    console.log('📱 Check your device for the push notification.');
    console.log('🔍 If no notification appeared, check PM2 logs:');
    console.log('   pm2 logs clanplug-backend --lines 50');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMessageNotification();
