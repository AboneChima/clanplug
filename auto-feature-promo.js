const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function autoFeaturePromo() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 Looking for promo post...\n');
    
    // Find the promo post
    const result = await client.query(`
      SELECT p.id, p.description, u.username
      FROM posts p
      JOIN users u ON p."userId" = u.id
      WHERE u.email = 'abonejoseph@gmail.com'
        AND p.description LIKE '%VERIFICATION PROMO%'
      ORDER BY p."createdAt" DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ No promo post found');
      console.log('\n📝 Create the post first:');
      console.log('1. Login as abonejoseph@gmail.com');
      console.log('2. Create a post with the promo image and caption');
      console.log('3. Run this script again to auto-feature it');
      return;
    }

    const post = result.rows[0];
    console.log('✅ Found promo post:', post.id);
    console.log('   By:', post.username);
    
    // Mark as featured and pin to top
    await client.query(`
      UPDATE posts
      SET 
        "isFeatured" = true,
        "createdAt" = NOW()
      WHERE id = $1
    `, [post.id]);

    console.log('\n🎉 Post is now FEATURED and pinned to top!');
    console.log('   Refresh the feed to see it with special styling');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

autoFeaturePromo();
