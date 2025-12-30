const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function deleteBadPost() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Delete the post with null in images array
    await client.query(`DELETE FROM posts WHERE id = '4a4ed869-e13f-4b21-b244-989ef33da955'`);
    console.log('✅ Deleted bad post');
    
    // Fix the other post's null tags
    await client.query(`UPDATE posts SET tags = ARRAY[]::text[] WHERE tags IS NULL`);
    console.log('✅ Fixed null tags');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

deleteBadPost();
