const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkChats() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check mutual follows
    const mutualFollows = await client.query(`
      SELECT 
        f1."followerId" as user1,
        f1."followingId" as user2,
        u1."username" as user1_name,
        u2."username" as user2_name
      FROM follows f1
      INNER JOIN follows f2 
        ON f1."followerId" = f2."followingId" 
        AND f1."followingId" = f2."followerId"
      INNER JOIN users u1 ON f1."followerId" = u1.id
      INNER JOIN users u2 ON f1."followingId" = u2.id
      LIMIT 10;
    `);
    
    console.log('👥 Mutual Followers (Friends):');
    if (mutualFollows.rows.length === 0) {
      console.log('  ⚠️ No mutual followers found!');
    } else {
      mutualFollows.rows.forEach(mf => {
        console.log(`  - ${mf.user1_name} ↔️ ${mf.user2_name}`);
      });
    }

    // Check chats
    const chats = await client.query(`
      SELECT 
        c.id,
        c.type,
        c."createdAt",
        COUNT(cp.id) as participant_count
      FROM chats c
      LEFT JOIN chat_participants cp ON c.id = cp."chatId"
      WHERE c."isActive" = true
      GROUP BY c.id
      ORDER BY c."createdAt" DESC
      LIMIT 10;
    `);
    
    console.log('\n💬 Recent Chats:');
    if (chats.rows.length === 0) {
      console.log('  ⚠️ No chats found!');
    } else {
      chats.rows.forEach(chat => {
        console.log(`  - Chat ${chat.id.substring(0, 8)}... (${chat.type}) - ${chat.participant_count} participants - ${new Date(chat.createdAt).toLocaleString()}`);
      });
    }

    // Check chat participants
    const participants = await client.query(`
      SELECT 
        cp."chatId",
        u.username,
        cp."isActive"
      FROM chat_participants cp
      INNER JOIN users u ON cp."userId" = u.id
      ORDER BY cp."createdAt" DESC
      LIMIT 20;
    `);
    
    console.log('\n👤 Chat Participants:');
    if (participants.rows.length === 0) {
      console.log('  ⚠️ No chat participants found!');
    } else {
      const chatGroups = {};
      participants.rows.forEach(p => {
        if (!chatGroups[p.chatId]) {
          chatGroups[p.chatId] = [];
        }
        chatGroups[p.chatId].push(p.username);
      });
      
      Object.entries(chatGroups).forEach(([chatId, users]) => {
        console.log(`  - Chat ${chatId.substring(0, 8)}...: ${users.join(', ')}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkChats();
