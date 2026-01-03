const { Client } = require('pg');

const DATABASE_URL = "postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon";

async function deleteBotFollowers() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected!');

    // Find bot users
    console.log('\n🔍 Finding bot users...');
    const findBotsQuery = `
      SELECT id, username, email, "firstName", "lastName" 
      FROM users 
      WHERE 
        username ILIKE '%bot%' OR 
        email ILIKE '%bot%' OR 
        "firstName" ILIKE '%bot%' OR 
        "lastName" ILIKE '%bot%'
      LIMIT 20;
    `;
    
    const botsResult = await client.query(findBotsQuery);
    console.log(`Found ${botsResult.rows.length} bot users:`);
    botsResult.rows.forEach(bot => {
      console.log(`  - ${bot.username} (${bot.email}) - ${bot.firstName} ${bot.lastName}`);
    });

    if (botsResult.rows.length === 0) {
      console.log('✅ No bot users found!');
      return;
    }

    // Delete follow relationships
    console.log('\n🗑️  Deleting follow relationships...');
    const deleteFollowsQuery = `
      DELETE FROM follows
      WHERE "followerId" IN (
        SELECT id FROM users 
        WHERE 
          username ILIKE '%bot%' OR 
          email ILIKE '%bot%' OR 
          "firstName" ILIKE '%bot%' OR 
          "lastName" ILIKE '%bot%'
      )
      OR "followingId" IN (
        SELECT id FROM users 
        WHERE 
          username ILIKE '%bot%' OR 
          email ILIKE '%bot%' OR 
          "firstName" ILIKE '%bot%' OR 
          "lastName" ILIKE '%bot%'
      );
    `;
    
    const followsResult = await client.query(deleteFollowsQuery);
    console.log(`✅ Deleted ${followsResult.rowCount} follow relationships`);

    // Delete comments by bot users
    console.log('\n🗑️  Deleting comments...');
    const deleteCommentsQuery = `
      DELETE FROM comments
      WHERE "userId" IN (
        SELECT id FROM users 
        WHERE 
          username ILIKE '%bot%' OR 
          email ILIKE '%bot%' OR 
          "firstName" ILIKE '%bot%' OR 
          "lastName" ILIKE '%bot%'
      );
    `;
    const commentsResult = await client.query(deleteCommentsQuery);
    console.log(`✅ Deleted ${commentsResult.rowCount} comments`);

    // Delete likes by bot users
    console.log('\n🗑️  Deleting likes...');
    const deleteLikesQuery = `
      DELETE FROM likes
      WHERE "userId" IN (
        SELECT id FROM users 
        WHERE 
          username ILIKE '%bot%' OR 
          email ILIKE '%bot%' OR 
          "firstName" ILIKE '%bot%' OR 
          "lastName" ILIKE '%bot%'
      );
    `;
    const likesResult = await client.query(deleteLikesQuery);
    console.log(`✅ Deleted ${likesResult.rowCount} likes`);

    // Delete posts by bot users
    console.log('\n🗑️  Deleting posts...');
    const deletePostsQuery = `
      DELETE FROM posts
      WHERE "userId" IN (
        SELECT id FROM users 
        WHERE 
          username ILIKE '%bot%' OR 
          email ILIKE '%bot%' OR 
          "firstName" ILIKE '%bot%' OR 
          "lastName" ILIKE '%bot%'
      );
    `;
    const postsResult = await client.query(deletePostsQuery);
    console.log(`✅ Deleted ${postsResult.rowCount} posts`);

    // Delete bot users
    console.log('\n🗑️  Deleting bot users...');
    const deleteUsersQuery = `
      DELETE FROM users
      WHERE 
        username ILIKE '%bot%' OR 
        email ILIKE '%bot%' OR 
        "firstName" ILIKE '%bot%' OR 
        "lastName" ILIKE '%bot%';
    `;
    
    const usersResult = await client.query(deleteUsersQuery);
    console.log(`✅ Deleted ${usersResult.rowCount} bot users`);

    // Show remaining users count
    const countResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n📊 Remaining users: ${countResult.rows[0].count}`);

    console.log('\n✅ Bot cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

deleteBotFollowers();
