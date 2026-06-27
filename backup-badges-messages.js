const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const renderPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon'
    }
  }
});

async function backupBadgesAndMessages() {
  try {
    console.log('📥 Fetching verification badges from Render...\n');
    
    const badges = await renderPrisma.verificationBadge.findMany();
    console.log(`✅ Found ${badges.length} verification badges`);
    
    // Try to get messages with different table names
    let messages = [];
    try {
      messages = await renderPrisma.message.findMany();
      console.log(`✅ Found ${messages.length} messages`);
    } catch (e) {
      console.log('⚠️  Message table not found with model "message"');
      try {
        // Try chatMessage
        messages = await renderPrisma.chatMessage.findMany();
        console.log(`✅ Found ${messages.length} chat messages`);
      } catch (e2) {
        console.log('⚠️  Message table not found with model "chatMessage"');
      }
    }
    
    // Save to file
    const backup = {
      timestamp: new Date().toISOString(),
      badges,
      messages
    };
    
    const filename = `backups/badges-messages-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    console.log(`\n💾 Backup saved to: ${filename}`);
    console.log(`📊 Total badges: ${badges.length}`);
    console.log(`📊 Total messages: ${messages.length}`);
    
  } catch (e) {
    console.log('❌ Error:', e.message);
    console.log(e.stack);
  } finally {
    await renderPrisma.$disconnect();
  }
}

backupBadgesAndMessages();
