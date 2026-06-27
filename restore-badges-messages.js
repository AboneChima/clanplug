const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://clanplug_user:ClanPlugDB2024@176.57.189.248:5432/clanplug'
});

async function restore() {
  try {
    await client.connect();
    console.log('✅ Connected to Contabo database\n');
    
    // Load backup
    const backupFiles = fs.readdirSync('backups').filter(f => f.startsWith('badges-messages-'));
    const latestBackup = backupFiles.sort().reverse()[0];
    console.log(`📂 Loading backup: ${latestBackup}\n`);
    
    const backup = JSON.parse(fs.readFileSync(`backups/${latestBackup}`, 'utf8'));
    
    // Restore verification badges
    console.log(`💎 Restoring ${backup.badges.length} verification badges...`);
    let badgeCount = 0;
    for (const badge of backup.badges) {
      try {
        await client.query(
          `INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           ON CONFLICT (id) DO UPDATE SET 
           status = EXCLUDED.status, 
           "purchasedAt" = EXCLUDED."purchasedAt", 
           "expiresAt" = EXCLUDED."expiresAt"`,
          [badge.id, badge.userId, badge.status, badge.purchasedAt, badge.expiresAt, badge.createdAt, badge.updatedAt]
        );
        badgeCount++;
      } catch (e) {
        console.log(`⚠️  Badge ${badge.id}: ${e.message}`);
      }
    }
    console.log(`✅ ${badgeCount} badges restored\n`);
    
    // Restore chat messages
    console.log(`💬 Restoring ${backup.messages.length} messages...`);
    let messageCount = 0;
    let skipped = 0;
    for (const message of backup.messages) {
      try {
        // Convert attachments array to PostgreSQL array format
        const attachmentsArray = message.attachments || [];
        
        await client.query(
          `INSERT INTO chat_messages (id, "chatId", "userId", content, type, attachments, metadata, "isEdited", "isDeleted", "replyToId", "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
           ON CONFLICT (id) DO NOTHING`,
          [message.id, message.chatId, message.userId, message.content, message.type, 
           attachmentsArray, message.metadata, 
           message.isEdited, message.isDeleted, message.replyToId, 
           message.createdAt, message.updatedAt]
        );
        messageCount++;
        if (messageCount % 500 === 0) {
          console.log(`  ... ${messageCount} messages processed`);
        }
      } catch (e) {
        skipped++;
        // Log first few errors to debug
        if (skipped <= 3) {
          console.log(`⚠️  Message ${message.id}: ${e.message}`);
        }
      }
    }
    console.log(`✅ ${messageCount} messages restored`);
    if (skipped > 0) {
      console.log(`⚠️  ${skipped} messages skipped (chat or user not found)\n`);
    }
    
    console.log('🎉 Restoration complete!');
    
  } catch (e) {
    console.log('❌ Error:', e.message);
  } finally {
    await client.end();
  }
}

restore();
