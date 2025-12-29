// Check database schema
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function checkSchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables in database:');
    tables.rows.forEach(row => console.log('  -', row.table_name));

    // Find user with email
    console.log('\n🔍 Looking for abonejoseph@gmail.com...');
    const user = await client.query(`SELECT id, email, username, "firstName", "lastName" FROM "User" WHERE email = 'abonejoseph@gmail.com'`);
    
    if (user.rows.length > 0) {
      console.log('✅ User found:');
      console.table(user.rows);
      
      // Check their posts
      const posts = await client.query(`SELECT id, description, "createdAt" FROM "Post" WHERE "userId" = $1 ORDER BY "createdAt" DESC`, [user.rows[0].id]);
      console.log('\n📝 User posts:');
      console.table(posts.rows);
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
