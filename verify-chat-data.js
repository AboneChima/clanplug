const { Client } = require('pg');

const client = new Client({
  host: '176.57.189.248',
  port: 5432,
  database: 'clanplug',
  user: 'clanplug_user',
  password: 'ClanPlugDB2024'
});

async function verify() {
  try {
    await client.connect();
    
    // Check chats
    const chatsResult = await client.query('SELECT COUNT(*) FROM chats');
    console.log(`📊 Chats: ${chatsResult.rows[0].count}`);
    
    // Check chat participants
    const participantsResult = await client.query('SELECT COUNT(*) FROM chat_participants');
    console.log(`👥 Chat Participants: ${participantsResult.rows[0].count}`);
    
    // Check chat messages
    const messagesResult = await client.query('SELECT COUNT(*) FROM chat_messages');
    console.log(`✉️  Chat Messages: ${messagesResult.rows[0].count}`);
    
    // Sample chat with participants
    const sampleResult = await client.query(`
      SELECT c.id, c.type, 
             array_agg(cp."userId") as participants
      FROM chats c
      LEFT JOIN chat_participants cp ON c.id = cp."chatId"
      WHERE c.type = 'DIRECT'
      GROUP BY c.id
      LIMIT 1
    `);
    console.log('\n📝 Sample chat:');
    console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verify();
