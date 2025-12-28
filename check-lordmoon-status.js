require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLordmoon() {
  try {
    console.log('🔍 Checking LORDMOON status...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        username,
        email,
        verification_status,
        verification_expires_at,
        CASE 
          WHEN verification_expires_at IS NULL THEN NULL
          WHEN verification_expires_at > NOW() THEN 
            EXTRACT(DAY FROM (verification_expires_at - NOW()))
          ELSE 0
        END as days_left
      FROM users 
      WHERE email = 'franklynnnamdi136@gmail.com'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = result.rows[0];
    console.log('User Details:');
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Status:', user.verification_status);
    console.log('Expires:', user.verification_expires_at);
    console.log('Days Left:', Math.floor(user.days_left));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLordmoon();
