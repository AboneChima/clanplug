const { Client } = require('pg');

// Render database (source)
const renderClient = new Client({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: { rejectUnauthorized: false }
});

// Contabo database (destination)
const contaboClient = new Client({
  host: '176.57.189.248',
  port: 5432,
  database: 'clanplug',
  user: 'clanplug_user',
  password: 'ClanPlugDB2024'
});

async function backupAndRestoreFollows() {
  try {
    console.log('🔗 Connecting to Render database...');
    await renderClient.connect();
    console.log('✅ Render connected!\n');
    
    console.log('🔗 Connecting to Contabo database...');
    await contaboClient.connect();
    console.log('✅ Contabo connected!\n');
    
    // Get follows from Render
    console.log('📥 Fetching follows from Render...');
    const followsResult = await renderClient.query(`
      SELECT id, "followerId", "followingId", "createdAt"
      FROM follows
      ORDER BY "createdAt" DESC
    `);
    
    const follows = followsResult.rows;
    console.log(`✅ Found ${follows.length} follows\n`);
    
    if (follows.length === 0) {
      console.log('❌ No follows to restore');
      return;
    }
    
    console.log('📤 Restoring follows to Contabo...');
    
    let restoredCount = 0;
    let skippedCount = 0;
    
    for (const follow of follows) {
      try {
        await contaboClient.query(
          `INSERT INTO follows (id, "followerId", "followingId", "createdAt") 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (id) DO NOTHING`,
          [follow.id, follow.followerId, follow.followingId, follow.createdAt]
        );
        restoredCount++;
        
        if (restoredCount % 100 === 0) {
          console.log(`   Restored ${restoredCount}/${follows.length}...`);
        }
      } catch (err) {
        skippedCount++;
        console.log(`⚠️  Skipped follow ${follow.id}: ${err.message}`);
      }
    }
    
    console.log(`\n✅ Restored ${restoredCount} follows`);
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} follows due to errors`);
    }
    
    // Verify
    const verifyResult = await contaboClient.query('SELECT COUNT(*) FROM follows');
    console.log(`\n📊 Total follows in Contabo: ${verifyResult.rows[0].count}`);
    
    // Sample data
    const sampleResult = await contaboClient.query(`
      SELECT f.id, 
             u1.username as follower, 
             u2.username as following
      FROM follows f
      JOIN users u1 ON f."followerId" = u1.id
      JOIN users u2 ON f."followingId" = u2.id
      LIMIT 5
    `);
    
    console.log('\n📝 Sample follows:');
    sampleResult.rows.forEach((f, i) => {
      console.log(`   ${i + 1}. @${f.follower} → @${f.following}`);
    });
    
    console.log('\n✅ FOLLOWS RESTORATION COMPLETE! 🎉\n');
    
  } catch (error) {
    console.error('\n❌ Failed!');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    await renderClient.end();
    await contaboClient.end();
  }
}

backupAndRestoreFollows();
