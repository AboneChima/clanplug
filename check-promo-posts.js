const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function checkPromo() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, images, videos, tags
      FROM posts
      WHERE description LIKE '%VERIFICATION PROMO%'
    `);
    
    console.log('Promo posts:');
    console.table(result.rows);
    
    // Check if any have null arrays
    result.rows.forEach(post => {
      if (post.images === null || post.videos === null || post.tags === null) {
        console.log('\n⚠️  Post', post.id, 'has null arrays!');
        console.log('  images:', post.images);
        console.log('  videos:', post.videos);
        console.log('  tags:', post.tags);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkPromo();
