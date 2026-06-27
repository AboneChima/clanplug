const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon'
    }
  }
});

async function check() {
  try {
    console.log('Checking Render database...\n');
    
    // Check messages
    let messageCount = 0;
    try {
      messageCount = await prisma.message.count();
      console.log('✅ Messages in Render DB:', messageCount);
    } catch (e) {
      console.log('❌ Messages table error:', e.message);
    }
    
    // Check verification badges
    let badgeCount = 0;
    try {
      badgeCount = await prisma.verificationBadge.count();
      console.log('✅ Verification Badges in Render DB:', badgeCount);
    } catch (e) {
      console.log('❌ Verification Badges table error:', e.message);
    }
    
    // Check chats
    let chatCount = 0;
    try {
      chatCount = await prisma.chat.count();
      console.log('✅ Chats in Render DB:', chatCount);
    } catch (e) {
      console.log('❌ Chats table error:', e.message);
    }
    
  } catch (e) {
    console.log('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
