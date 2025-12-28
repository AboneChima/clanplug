const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: { rejectUnauthorized: false }
});

async function checkTable() {
  try {
    await client.connect();
    console.log('✅ Connected\n');
    
    // Check table names
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%erification%'
      ORDER BY table_name;
    `);
    
    console.log('Tables with "verification" in name:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTable();
