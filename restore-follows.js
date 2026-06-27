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

async function restoreFollows() {
  try {
    console.log('🔗 Connecting to Contabo database...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Load backup
    const backupFile = 'clanplug_data_2026-06-25_02-09-36.json';
    const backupPath = path.join(__dirname, 'backups', backupFile);
    
    console.log(`📂 Loading backup: ${backupFile}`);
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    const follows = backupData.data.follows || [];
    console.log(`\n👫 Found ${follows.length} follows in backup`);
    
    if (follows.length === 0) {
      console.log('❌ No follows data in backup');
      return;
    }
    
    console.log('📥 Restoring follows...');
    
    let restoredCount = 0;
    let skippedCount = 0;
    
    for (const follow of follows) {
      try {
        await client.query(
          `INSERT INTO follows (id, "followerId", "followingId", "createdAt") 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (id) DO NOTHING`,
          [follow.id, follow.followerId, follow.followingId, follow.createdAt]
        );
        restoredCount++;
      } catch (err) {
        console.log(`⚠️  Skipped follow ${follow.id}: ${err.message}`);
        skippedCount++;
      }
    }
    
    console.log(`\n✅ Restored ${restoredCount} follows`);
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} follows due to errors`);
    }
    
    // Verify
    const result = await client.query('SELECT COUNT(*) FROM follows');
    console.log(`\n📊 Total follows in database: ${result.rows[0].count}`);
    
    // Sample data
    const sampleResult = await client.query(`
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

restoreFollows();
