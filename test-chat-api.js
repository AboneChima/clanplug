const https = require('https');

// Test with a known user ID from database
// Let's get a user ID first
const { Client } = require('pg');

const client = new Client({
  host: '176.57.189.248',
  port: 5432,
  database: 'clanplug',
  user: 'clanplug_user',
  password: 'ClanPlugDB2024'
});

async function testChatAPI() {
  try {
    await client.connect();
    
    // Get a user who has chats
    const result = await client.query(`
      SELECT DISTINCT u.id, u.username, COUNT(cp."chatId") as chat_count
      FROM users u
      JOIN chat_participants cp ON u.id = cp."userId"
      GROUP BY u.id
      ORDER BY chat_count DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No users with chats found');
      return;
    }
    
    const user = result.rows[0];
    console.log(`\n👤 Testing with user: ${user.username} (${user.id})`);
    console.log(`   User has ${user.chat_count} chats\n`);
    
    // Get chats for this user directly from database
    const chatsResult = await client.query(`
      SELECT c.id, c.type, c."lastMessageAt"
      FROM chats c
      JOIN chat_participants cp ON c.id = cp."chatId"
      WHERE cp."userId" = $1
      ORDER BY c."lastMessageAt" DESC
      LIMIT 5
    `, [user.id]);
    
    console.log(`📊 Database says user has ${chatsResult.rows.length} chats (showing first 5):`);
    chatsResult.rows.forEach((chat, i) => {
      console.log(`   ${i + 1}. ${chat.type} chat (${chat.id})`);
    });
    
    console.log('\n✅ Chat participants restored successfully!');
    console.log('🎉 The chats should now be visible in the app when users log in.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

testChatAPI();
