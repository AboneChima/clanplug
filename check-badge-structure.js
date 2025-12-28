const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: { rejectUnauthorized: false }
});

async function checkStructure() {
  try {
    await client.connect();
    console.log('✅ Connected\n');
    
    // Check table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'verification_badges'
      ORDER BY ordinal_position;
    `);
    
    console.log('verification_badges table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
    // Check existing badges
    const badges = await client.query(`
      SELECT vb.*, u.username, u.email
      FROM verification_badges vb
      JOIN users u ON vb."userId" = u.id
      LIMIT 5;
    `);
    
    console.log('\nExisting verification badges:');
    badges.rows.forEach(row => {
      console.log(`  ${row.username} (${row.email}): ${row.status}, expires: ${row.expiresAt}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkStructure();
