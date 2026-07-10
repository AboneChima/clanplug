// Check push subscriptions in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkSubscriptions() {
  try {
    console.log('🔍 Checking push subscriptions...\n');
    
    const subscriptions = await prisma.pushSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total subscriptions: ${subscriptions.length}\n`);

    if (subscriptions.length === 0) {
      console.log('❌ No push subscriptions found!');
      console.log('\n💡 To create a subscription:');
      console.log('1. Go to https://www.clanplug.site/settings');
      console.log('2. Toggle ON "Push Notifications"');
      console.log('3. Click "Allow" when browser asks');
      return;
    }

    subscriptions.forEach((sub, index) => {
      console.log(`\n📱 Subscription ${index + 1}:`);
      console.log(`   User: ${sub.user.username} (${sub.user.email})`);
      console.log(`   User ID: ${sub.userId}`);
      console.log(`   Endpoint: ${sub.endpoint.slice(0, 60)}...`);
      console.log(`   Created: ${sub.createdAt}`);
      console.log(`   Has p256dh: ${!!sub.p256dh} (${sub.p256dh.length} chars)`);
      console.log(`   Has auth: ${!!sub.auth} (${sub.auth.length} chars)`);
    });

    console.log('\n✅ All subscriptions look valid!');
    console.log('\n💡 To test notifications:');
    console.log('1. Go to https://www.clanplug.site/settings');
    console.log('2. Click "Test" button');
    console.log('3. Check PM2 logs: pm2 logs clanplug-backend --lines 50');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptions();
