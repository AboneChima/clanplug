const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function fixNullImages() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔌 Connected\n');
    
    // Find posts with null images
    const nullResult = await client.query(`
      SELECT id, "userId", description, images
      FROM posts
      WHERE images IS NULL
    `);
    
    console.log('📊 Posts with null images:', nullResult.rows.length);
    
    if (nullResult.rows.length > 0) {
      console.log('\n🔧 Fixing null images...');
      
      // Update all null images to empty array
      await client.query(`
        UPDATE posts
        SET images = ARRAY[]::text[]
        WHERE images IS NULL
      `);
      
      console.log('✅ Fixed', nullResult.rows.length, 'posts');
    } else {
      console.log('✅ No posts with null images found');
    }
    
    // Also check for null videos
    const nullVideosResult = await client.query(`
      SELECT COUNT(*) FROM posts WHERE videos IS NULL
    `);
    
    if (parseInt(nullVideosResult.rows[0].count) > 0) {
      console.log('\n🔧 Fixing null videos...');
      await client.query(`
        UPDATE posts
        SET videos = ARRAY[]::text[]
        WHERE videos IS NULL
      `);
      console.log('✅ Fixed', nullVideosResult.rows[0].count, 'posts');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixNullImages();
