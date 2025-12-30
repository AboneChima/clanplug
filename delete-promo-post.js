const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function deletePromo() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    await client.query(`DELETE FROM posts WHERE id = 'ccc53a76-ff1b-4d54-a5fb-22936a877a52'`);
    console.log('✅ Deleted promo post with broken image');
    console.log('\n📝 Now create it via the website:');
    console.log('1. Login as abonejoseph@gmail.com');
    console.log('2. Click + to create post');
    console.log('3. Upload "verified feature.jpeg"');
    console.log('4. Paste the caption');
    console.log('5. Post will auto-show as featured!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

deletePromo();
