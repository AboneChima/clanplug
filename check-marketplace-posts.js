const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkMarketplacePosts() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check recent listings
    const listings = await client.query(`
      SELECT id, title, "sellerId", "createdAt"      
      FROM "Listing" 
      ORDER BY "createdAt" DESC 
      LIMIT 10;
    `);
    console.log('📦 Recent Listings:');
    listings.rows.forEach(l => {
      console.log(`  - ${l.title} (${l.id}) - ${new Date(l.createdAt).toLocaleString()}`);
    });

    // Check marketplace posts
    const posts = await client.query(`
      SELECT id, title, type, "listingId", "createdAt" 
      FROM posts 
      WHERE type = 'MARKETPLACE_LISTING'
      ORDER BY "createdAt" DESC 
      LIMIT 5;
    `);
    console.log('\n📝 Marketplace Posts:');
    if (posts.rows.length === 0) {
      console.log('  ⚠️ No marketplace posts found!');
    } else {
      posts.rows.forEach(p => {
        console.log(`  - ${p.title} (${p.id})`);
        console.log(`    Listing ID: ${p.listingId}`);
        console.log(`    Created: ${new Date(p.createdAt).toLocaleString()}`);
      });
    }

    // Check all post types
    const postTypes = await client.query(`
      SELECT type, COUNT(*) as count 
      FROM posts 
      GROUP BY type 
      ORDER BY count DESC;
    `);
    console.log('\n📊 Post Types Distribution:');
    postTypes.rows.forEach(pt => {
      console.log(`  - ${pt.type}: ${pt.count} posts`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkMarketplacePosts();
