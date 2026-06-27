const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: '176.57.189.248',
  port: 5432,
  database: 'clanplug',
  user: 'clanplug_user',
  password: 'ClanPlugDB2024'
});

async function restoreChatParticipants() {
  try {
    console.log('🔗 Connecting to Contabo database...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Load backup
    const backupFile = 'clanplug_data_2026-06-25_02-09-36.json';
    const backupPath = path.join(__dirname, 'backups', backupFile);
    
    console.log(`📂 Loading backup: ${backupFile}`);
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('\n💬 Processing chat participants...');
    
    let participantCount = 0;
    let skippedCount = 0;
    
    for (const chat of backupData.data.chats || []) {
      if (chat.participants && Array.isArray(chat.participants)) {
        for (const participant of chat.participants) {
          try {
            // Insert with all available fields
            const columns = [
              'id', 'chatId', 'userId', 'role', 'joinedAt', 
              'lastReadAt', 'isActive'
            ];
            
            const values = [
              participant.id,
              participant.chatId,
              participant.userId,
              participant.role || 'member',
              participant.joinedAt,
              participant.lastReadAt || participant.joinedAt,
              participant.isActive !== undefined ? participant.isActive : true
            ];
            
            await client.query(
              `INSERT INTO chat_participants (${columns.map(c => `"${c}"`).join(', ')}) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) 
               ON CONFLICT (id) DO UPDATE SET
               "lastReadAt" = EXCLUDED."lastReadAt",
               "isActive" = EXCLUDED."isActive"`,
              values
            );
            participantCount++;
          } catch (err) {
            console.log(`⚠️  Skipped participant ${participant.id}: ${err.message}`);
            skippedCount++;
          }
        }
      }
    }
    
    console.log(`\n✅ Restored ${participantCount} chat participants`);
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} participants due to errors`);
    }
    
    // Verify restoration
    const result = await client.query('SELECT COUNT(*) FROM chat_participants');
    console.log(`\n📊 Total chat participants in database: ${result.rows[0].count}`);
    
    console.log('\n✅ RESTORATION COMPLETE! 🎉\n');
    
  } catch (error) {
    console.error('\n❌ Restore failed!');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

restoreChatParticipants();
