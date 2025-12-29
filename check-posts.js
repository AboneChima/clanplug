const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function checkPosts() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check total posts
    const totalResult = await client.query(`SELECT COUNT(*) FROM posts`);
    console.log('📊 Total posts in database:', totalResult.rows[0].count);
    
    // Check posts by status
    const statusResult = await client.query(`
      SELECT status, COUNT(*) 
      FROM posts 
      GROUP BY status
    `);
    console.log('\n📋 Posts by status:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    // Check posts by type
    const typeResult = await client.query(`
      SELECT type, COUNT(*) 
      FROM posts 
      GROUP BY type
    `);
    console.log('\n📋 Posts by type:');
    typeResult.rows.forEach(row => {
      console.log(`  ${row.type}: ${row.count}`);
    });
    
    // Check recent posts
    const recentResult = await client.query(`
      SELECT 
        p.id,
        p.type,
        p.status,
        p.description,
        u.username,
        p."createdAt"
      FROM posts p
      JOIN users u ON p."userId" = u.id
      ORDER BY p."createdAt" DESC
      LIMIT 10
    `);
    
    console.log('\n📝 Recent posts:');
    recentResult.rows.forEach(post => {
      console.log(`  - ${post.username}: ${post.description.substring(0, 50)}... (${post.type}, ${post.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkPosts();
