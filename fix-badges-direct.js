// Direct database connection to fix badges
const { Client } = require('pg');

const connectionString = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon?sslmode=require';

async function fixBadges() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // 1. Update all 'active' to 'verified'
    const updateResult = await client.query(`
      UPDATE verification_badges 
      SET status = 'verified' 
      WHERE status = 'active'
      RETURNING *;
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} badges from 'active' to 'verified'\n`);
    
    // 2. Show all verifications
    const result = await client.query(`
      SELECT 
        u.username,
        u.email,
        vb.status,
        vb."expiresAt",
        EXTRACT(DAY FROM (vb."expiresAt" - NOW())) as days_remaining
      FROM users u
      INNER JOIN verification_badges vb ON vb."userId" = u.id
      ORDER BY u.username;
    `);
    
    console.log('=== VERIFIED USERS ===\n');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.username} (${row.email})`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Expires: ${new Date(row.expiresAt).toLocaleDateString()}`);
      console.log(`   Days remaining: ${Math.ceil(row.days_remaining)}\n`);
    });
    
    console.log(`Total verified users: ${result.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixBadges();
