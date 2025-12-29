const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function checkFeed() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check what the feed query would return
    const result = await client.query(`
      SELECT 
        type,
        status,
        COUNT(*) as count
      FROM posts
      WHERE status IN ('ACTIVE', 'SOLD')
        AND type IN ('SOCIAL_POST', 'MARKETPLACE_LISTING')
      GROUP BY type, status
      ORDER BY type, status
    `);
    
    console.log('📊 Posts that should appear in feed:');
    console.table(result.rows);
    
    // Check SOCIAL_POST specifically
    const socialResult = await client.query(`
      SELECT COUNT(*) 
      FROM posts
      WHERE status = 'ACTIVE'
        AND type = 'SOCIAL_POST'
    `);
    
    console.log('\n✅ SOCIAL_POST count:', socialResult.rows[0].count);
    
    // Sample some social posts
    const sampleResult = await client.query(`
      SELECT 
        p.id,
        u.username,
        LEFT(p.description, 50) as preview,
        p."createdAt"
      FROM posts p
      JOIN users u ON p."userId" = u.id
      WHERE p.type = 'SOCIAL_POST'
        AND p.status = 'ACTIVE'
      ORDER BY p."createdAt" DESC
      LIMIT 5
    `);
    
    console.log('\n📝 Sample social posts:');
    sampleResult.rows.forEach(post => {
      console.log(`  ${post.username}: ${post.preview}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkFeed();
