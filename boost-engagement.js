// Boost engagement for abonejoseph@gmail.com
// Run with: node boost-engagement.js

const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function boostEngagement() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Reading SQL script...');
    const sql = fs.readFileSync('boost-abonejoseph-engagement.sql', 'utf8');
    
    console.log('🚀 Boosting engagement for abonejoseph@gmail.com...');
    console.log('   - Creating 5,000 bot followers');
    console.log('   - Adding 300 likes to post');
    console.log('   - Adding 30 comments\n');
    console.log('⏳ This may take 2-3 minutes...\n');

    const result = await client.query(sql);
    
    console.log('\n✅ Success! Engagement boosted!\n');
    
    // Show results
    if (result.length > 0) {
      console.log('📈 Results:');
      result.forEach((res, i) => {
        if (res.rows && res.rows.length > 0) {
          console.log(`\nQuery ${i + 1}:`);
          console.table(res.rows);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

boostEngagement();
